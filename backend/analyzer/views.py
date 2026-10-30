import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .serializers import (
    ResumeAnalysisRequestSerializer,
    CompanyRoadmapRequestSerializer,
    CompanyPrepOverviewSerializer,
    CompanyQuestionsRequestSerializer,
    InterviewExperienceSerializer,
    StartMockInterviewSerializer,
    EvaluateAnswerTurnSerializer,
    AudioTranscribeSerializer,
    ConceptExplainSerializer
)
from services.groq_service import groq_service
from services.resume_parser import parse_resume_file
from services.skill_matcher import perform_deterministic_skill_matching
from services.scoring_service import calculate_deterministic_score
from services.gemini_service import generate_ai_resume_feedback
from services.company_prep_service import company_prep_service
from services.voice_interview_service import voice_interview_service
from services.interview_ai_service import interview_ai_service
from services.experience_indexing_service import experience_indexing_service
from services.experience_retrieval_service import experience_retrieval_service
from services.db_service import db_service

logger = logging.getLogger(__name__)

# RESUME ANALYZER (PRESERVED GEMINI WORKFLOW)
class AnalyzeResumeView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ResumeAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = serializer.validated_data['resume']
        job_description = serializer.validated_data['job_description']
        company_name = serializer.validated_data.get('company_name', 'Target Company') or 'Target Company'
        job_role = serializer.validated_data.get('job_role', 'Software Engineer') or 'Software Engineer'

        try:
            parsed_resume = parse_resume_file(uploaded_file)
            resume_text = parsed_resume["text"]
            resume_sections = parsed_resume["sections"]
        except ValueError as err:
            return Response({
                "success": False,
                "error": str(err)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as err:
            logger.error(f"Resume text extraction error: {err}")
            return Response({
                "success": False,
                "error": "Failed to extract text from resume file. Ensure document is valid and readable."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            skill_match_results = perform_deterministic_skill_matching(
                resume_text=resume_text,
                resume_sections=resume_sections,
                job_description=job_description
            )
            matched_skills = skill_match_results["matched_skills"]
            missing_skills = skill_match_results["missing_skills"]
        except Exception as err:
            logger.error(f"Skill matching error: {err}")
            matched_skills = []
            missing_skills = []

        try:
            scoring_results = calculate_deterministic_score(
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                resume_text=resume_text,
                resume_sections=resume_sections
            )
        except Exception as err:
            logger.error(f"Scoring engine error: {err}")
            scoring_results = {
                "overall": 75,
                "label": "Resume Alignment Estimate",
                "disclaimer": "This score estimates resume alignment with the supplied job description.",
                "breakdown": []
            }

        try:
            ai_feedback = generate_ai_resume_feedback(
                resume_text=resume_text,
                resume_sections=resume_sections,
                job_description=job_description,
                company_name=company_name,
                job_role=job_role,
                matched_skills=matched_skills,
                missing_skills=missing_skills
            )
        except Exception as err:
            logger.error(f"Gemini processing error: {err}")
            ai_feedback = {
                "strengths": [],
                "improvement_areas": [],
                "bullet_suggestions": [],
                "ats_review": {"sections_found": list(resume_sections.keys())},
                "action_plan": {"today": [], "this_week": [], "before_applying": []},
                "summary": {"key_strengths": [], "key_improvements": [], "next_steps": []}
            }

        # Prioritize Gemini's authentic evaluation score & breakdown if present
        if ai_feedback and "overall_score" in ai_feedback and ai_feedback.get("overall_score") is not None:
            final_overall = int(ai_feedback["overall_score"])
            final_breakdown = ai_feedback.get("score_breakdown", scoring_results.get("breakdown", []))
            final_label = ai_feedback.get("score_label", scoring_results.get("label", "Resume Alignment Analysis"))
            score_object = {
                "overall": final_overall,
                "label": final_label,
                "disclaimer": "This score represents an authentic semantic alignment analysis generated by Gemini AI.",
                "breakdown": final_breakdown
            }
        else:
            score_object = scoring_results

        # Use Gemini's deep matched & missing skills if available
        if ai_feedback and ai_feedback.get("matched_skills"):
            ai_matched = ai_feedback["matched_skills"]
            if isinstance(ai_matched, list) and len(ai_matched) > 0 and isinstance(ai_matched[0], dict):
                matched_skills = ai_matched
        if ai_feedback and ai_feedback.get("missing_skills"):
            ai_missing = ai_feedback["missing_skills"]
            if isinstance(ai_missing, list) and len(ai_missing) > 0 and isinstance(ai_missing[0], dict):
                missing_skills = ai_missing

        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"

        full_analysis_result = {
            "success": True,
            "company_name": company_name,
            "job_role": job_role,
            "filename": uploaded_file.name,
            "char_count": parsed_resume["char_count"],
            "score": score_object,
            "match_score": score_object["overall"],
            "score_breakdown": score_object["breakdown"],
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "strengths": ai_feedback.get("strengths", []),
            "improvement_areas": ai_feedback.get("improvement_areas", []),
            "bullet_suggestions": ai_feedback.get("bullet_suggestions", []),
            "ats_review": ai_feedback.get("ats_review", {}),
            "action_plan": ai_feedback.get("action_plan", {}),
            "summary": ai_feedback.get("summary", {}),
            "is_ai_simulated": ai_feedback.get("is_ai_simulated", False)
        }

        db_record = {
            "user_email": user_email,
            "filename": uploaded_file.name,
            "company_name": company_name,
            "job_role": job_role,
            "job_description_snippet": job_description[:200] + "...",
            "result": full_analysis_result
        }
        saved_doc = db_service.save_resume_analysis(db_record)
        full_analysis_result["analysis_id"] = saved_doc.get("analysis_id", "")

        return Response(full_analysis_result, status=status.HTTP_200_OK)


# MODULE A: COMPANY PREPARATION & ROADMAP VIEWS
class CompanyPrepOverviewView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        serializer = CompanyPrepOverviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        company_name = serializer.validated_data['company_name']
        job_role = serializer.validated_data['job_role']
        job_description = serializer.validated_data.get('job_description', '')

        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        student_profile = db_service.get_user_profile(user_email)

        overview = company_prep_service.generate_company_prep_overview(
            company_name=company_name,
            job_role=job_role,
            job_description=job_description,
            student_profile=student_profile
        )

        return Response({"success": True, "data": overview}, status=status.HTTP_200_OK)


class GenerateCompanyRoadmapView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        serializer = CompanyRoadmapRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        company_name = serializer.validated_data['company_name']
        job_role = serializer.validated_data['job_role']
        days_remaining = serializer.validated_data.get('days_remaining', 7)
        job_description = serializer.validated_data.get('job_description', '')

        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        student_profile = db_service.get_user_profile(user_email)

        try:
            roadmap_data = company_prep_service.generate_personalized_roadmap(
                company_name=company_name,
                job_role=job_role,
                days_remaining=days_remaining,
                job_description=job_description,
                student_profile=student_profile
            )

            # Persist roadmap for user
            roadmap_record = {
                "user_email": user_email,
                "company_name": company_name,
                "job_role": job_role,
                "days_remaining": days_remaining,
                "roadmap": roadmap_data
            }
            db_service.save_company_roadmap(roadmap_record)

            return Response({"success": True, "data": roadmap_data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error generating roadmap: {e}")
            return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request):
        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        roadmaps = db_service.get_user_company_roadmaps(user_email)
        return Response({"success": True, "roadmaps": roadmaps}, status=status.HTTP_200_OK)


class CompanyQuestionsView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        serializer = CompanyQuestionsRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        company_name = serializer.validated_data['company_name']
        job_role = serializer.validated_data['job_role']
        category = serializer.validated_data.get('category', 'all')

        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        student_profile = db_service.get_user_profile(user_email)

        questions = company_prep_service.generate_company_questions(
            company_name=company_name,
            job_role=job_role,
            question_category=category,
            student_profile=student_profile
        )

        return Response({"success": True, "questions": questions}, status=status.HTTP_200_OK)


# MODULE C & D: VOICE & TEXT MOCK INTERVIEW VIEWS
class StartMockInterviewView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        serializer = StartMockInterviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"

        session = voice_interview_service.start_interview_session(
            user_email=user_email,
            company_name=serializer.validated_data['company_name'],
            job_role=serializer.validated_data['job_role'],
            interview_type=serializer.validated_data['interview_type'],
            difficulty=serializer.validated_data['difficulty'],
            question_count=serializer.validated_data['question_count']
        )

        return Response({"success": True, "session": session}, status=status.HTTP_201_CREATED)


class EvaluateAnswerTurnView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        serializer = EvaluateAnswerTurnSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"

        result = voice_interview_service.evaluate_answer_turn(
            session_id=serializer.validated_data['session_id'],
            user_email=user_email,
            question_id=serializer.validated_data['question_id'],
            question_text=serializer.validated_data['question_text'],
            transcribed_answer=serializer.validated_data['transcribed_answer']
        )

        if not result.get("success"):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)


class FinishMockInterviewView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]

    def post(self, request, session_id):
        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        ended_early = False
        if hasattr(request, 'data') and isinstance(request.data, dict):
            ended_early = request.data.get("ended_early", False)
        res = voice_interview_service.finish_interview_session(session_id, user_email, ended_early=ended_early)
        if not res.get("success"):
            return Response(res, status=status.HTTP_400_BAD_REQUEST)
        return Response(res, status=status.HTTP_200_OK)


class MockInterviewReportsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        reports = db_service.get_user_mock_interview_reports(user_email)
        return Response({"success": True, "reports": reports}, status=status.HTTP_200_OK)


# MODULE E & B: INTERVIEW EXPERIENCES & RAG MODERATION
class InterviewExperienceView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        company = request.query_params.get("company", None)
        role = request.query_params.get("role", None)
        include_unapproved = request.query_params.get("include_unapproved", "false").lower() in ("true", "1")
        experiences = db_service.get_all_interview_experiences(company=company, role=role, limit=50, include_unapproved=include_unapproved)
        return Response({"success": True, "experiences": experiences}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = InterviewExperienceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        exp_data = serializer.validated_data
        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        exp_data["user_email"] = user_email

        # Moderation check
        summary_clean = exp_data.get("summary", "").strip()
        is_spam = len(summary_clean) < 15 or any(term in summary_clean.lower() for term in ["viagra", "casino", "free money"])

        if is_spam:
            exp_data["is_approved"] = False
            exp_data["status"] = "Pending Review"
            saved_exp = db_service.save_interview_experience(exp_data)
            return Response({
                "success": True,
                "message": "Experience submitted and is pending moderation review.",
                "experience": saved_exp
            }, status=status.HTTP_201_CREATED)
        else:
            exp_data["is_approved"] = True
            exp_data["status"] = exp_data.get("status") or "Selected / Offered"
            saved_exp = db_service.save_interview_experience(exp_data)
            experience_indexing_service.index_single_experience(saved_exp)
            return Response({
                "success": True,
                "message": "Interview experience shared and indexed successfully!",
                "experience": saved_exp
            }, status=status.HTTP_201_CREATED)


class ApproveExperienceView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, exp_id):
        exps = db_service.get_all_interview_experiences(limit=200, include_unapproved=True)
        target = next((e for e in exps if str(e.get("_id")) == str(exp_id)), None)
        if not target:
            return Response({"success": False, "error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)

        target["is_approved"] = True
        target["status"] = "Approved"
        db_service.update_interview_experience(target)
        experience_indexing_service.index_single_experience(target)

        return Response({"success": True, "message": "Experience approved and indexed into RAG vector store successfully."}, status=status.HTTP_200_OK)


class DeleteExperienceView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, exp_id):
        deleted = db_service.delete_interview_experience(exp_id)
        if deleted:
            experience_indexing_service.remove_experience_from_index(exp_id)
            return Response({"success": True, "message": "Experience deleted and removed from RAG index."}, status=status.HTTP_200_OK)
        return Response({"success": False, "error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)


class FlagExperienceView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, exp_id):
        reason = request.data.get("reason", "Community report for moderation")
        flagged = db_service.flag_interview_experience(exp_id, reason)
        if flagged:
            return Response({"success": True, "message": "Experience flagged for moderation review."}, status=status.HTTP_200_OK)
        return Response({"success": False, "error": "Experience not found."}, status=status.HTTP_404_NOT_FOUND)


class UpvoteExperienceView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, exp_id):
        new_upvotes = db_service.upvote_interview_experience(exp_id)
        return Response({"success": True, "upvotes": new_upvotes}, status=status.HTTP_200_OK)


# MODULE C & D: AUDIO TRANSCRIBE & CONCEPT Q&A VIEWS
class AudioTranscribeView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = AudioTranscribeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        audio_file = serializer.validated_data['audio']
        try:
            transcript = interview_ai_service.transcribe_audio(audio_file)
            return Response({"success": True, "transcript": transcript}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Audio transcription error: {e}")
            return Response({"success": False, "error": f"Audio transcription failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConceptExplainView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        serializer = ConceptExplainSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        concept = serializer.validated_data['concept']
        company_name = serializer.validated_data.get('company_name', 'Target Company')
        job_role = serializer.validated_data.get('job_role', 'Software Engineer')

        rag_res = experience_retrieval_service.retrieve_relevant_experiences(
            company_name=company_name,
            job_role=job_role,
            query=concept,
            top_k=2
        )

        user_prompt = f"""
CONCEPT TO EXPLAIN: {concept}
TARGET COMPANY: {company_name}
ROLE: {job_role}

COMMUNITY CONTEXT (RAG):
---
{rag_res['formatted_context']}
---

Explain this technical concept in depth for an interview setting in JSON matching this schema:
{{
  "concept": "{concept}",
  "simple_explanation": "Clear, concise high-level explanation",
  "technical_deep_dive": "Under-the-hood technical mechanics, time/space complexity if applicable",
  "interview_tradeoffs": ["Trade-off 1", "Trade-off 2"],
  "code_or_design_example": "Illustrative code snippet or design pattern outline",
  "common_pitfalls": ["Pitfall 1", "Pitfall 2"],
  "model_interview_answer": "How to verbally articulate this concept when asked in an interview"
}}
"""
        explanation = None
        if groq_service.is_available():
            try:
                explanation = groq_service.generate_json_response(
                    "You are an expert technical staff engineer and computer science educator. Return strictly valid JSON.",
                    user_prompt
                )
            except Exception as e:
                logger.error(f"Groq concept explanation error: {e}")

        if not explanation:
            explanation = {
                "concept": concept,
                "simple_explanation": f"{concept} is a foundational technical principle relevant to engineering roles at {company_name}.",
                "technical_deep_dive": f"Understanding {concept} requires analyzing performance trade-offs, scalability, and system resource utilization.",
                "interview_tradeoffs": ["Simplicity vs Performance", "Memory Overhead vs Speed"],
                "code_or_design_example": f"// Example implementation pattern for {concept}\n// Structure logic clearly and handle edge cases.",
                "common_pitfalls": ["Overlooking edge cases", "Premature optimization without profiling"],
                "model_interview_answer": f"When asked about {concept}, define the principle succinctly, discuss realistic scenarios where it applies, and present explicit time/space trade-offs."
            }

        explanation["sources"] = rag_res["sources"]
        explanation["is_rag_grounded"] = rag_res["has_matches"]

        return Response({"success": True, "data": explanation}, status=status.HTTP_200_OK)


# HISTORY & DETAIL VIEWS
class AnalysisHistoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        history = db_service.get_resume_analyses_for_user(user_email, limit=15)
        return Response({"success": True, "history": history}, status=status.HTTP_200_OK)


class AnalysisDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, analysis_id):
        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        record = db_service.get_resume_analysis_by_id(analysis_id, user_email)
        if not record:
            return Response({"success": False, "error": "Analysis record not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"success": True, "data": record}, status=status.HTTP_200_OK)


class DeleteAnalysisView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, analysis_id):
        user_email = request.user.email if request.user and request.user.is_authenticated else "student@college.edu"
        deleted = db_service.delete_resume_analysis_by_id(analysis_id, user_email)
        if not deleted:
            return Response({"success": False, "error": "Analysis record not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"success": True, "message": "Analysis deleted successfully."}, status=status.HTTP_200_OK)
