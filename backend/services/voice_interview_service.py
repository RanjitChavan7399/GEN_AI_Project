import logging
from datetime import datetime
from services.interview_ai_service import interview_ai_service
from services.db_service import db_service
from services.experience_retrieval_service import experience_retrieval_service

logger = logging.getLogger(__name__)

class VoiceInterviewService:
    """
    Mock Interview workflow controller powered by GEMINI_API_KEY3.
    Orchestrates unique question generation, real-time voice evaluation rubrics,
    early termination handling, and performance scoring.
    """
    def start_interview_session(self, user_email: str, company_name: str, job_role: str, interview_type: str = "Technical", difficulty: str = "Medium", question_count: int = 5, resume_text: str = "") -> dict:
        """Initialize a new mock interview session with fresh, non-repeating questions powered by GEMINI_API_KEY3."""
        comp = company_name or "Target Company"
        role = job_role or "Software Engineer"
        itype = interview_type or "Technical"
        diff = difficulty or "Medium"

        # RAG context retrieval
        rag_res = experience_retrieval_service.retrieve_relevant_experiences(
            company_name=comp,
            job_role=role,
            query=f"{itype} interview questions for {comp}",
            top_k=2
        )
        rag_context = rag_res.get("formatted_context", "")

        # Generate unique, non-repeating questions using GEMINI_API_KEY3
        questions = interview_ai_service.generate_unique_questions(
            company_name=comp,
            job_role=role,
            interview_type=itype,
            difficulty=diff,
            question_count=question_count,
            rag_context=rag_context
        )

        session_id = f"mock_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{user_email.split('@')[0]}"
        
        session_data = {
            "session_id": session_id,
            "user_email": user_email,
            "company_name": comp,
            "job_role": role,
            "interview_type": itype,
            "difficulty": diff,
            "total_questions": len(questions),
            "current_question_index": 0,
            "questions": questions,
            "turns": [],
            "status": "IN_PROGRESS",
            "created_at": datetime.utcnow().isoformat(),
            "sources": rag_res.get("sources", [])
        }

        # Store session in db_service
        db_service.save_mock_interview_session(session_data)

        return {
            "session_id": session_id,
            "company_name": comp,
            "job_role": role,
            "interview_type": itype,
            "difficulty": diff,
            "total_questions": len(questions),
            "first_question": questions[0] if questions else None,
            "sources": rag_res.get("sources", [])
        }

    def evaluate_answer_turn(self, session_id: str, user_email: str, question_id: str, question_text: str, transcribed_answer: str) -> dict:
        """Evaluate a spoken candidate response using GEMINI_API_KEY3."""
        if not transcribed_answer or len(transcribed_answer.strip()) < 3:
            return {
                "success": False,
                "error": "Transcribed answer is too short. Please provide a spoken or typed response."
            }

        session = db_service.get_mock_interview_session(session_id, user_email)
        company_name = session.get("company_name", "Target Company") if session else "Target Company"
        job_role = session.get("job_role", "Software Engineer") if session else "Software Engineer"

        evaluation = interview_ai_service.evaluate_spoken_answer(
            question_text=question_text,
            transcribed_answer=transcribed_answer,
            company_name=company_name,
            job_role=job_role
        )

        turn_record = {
            "question_id": question_id,
            "question_text": question_text,
            "transcribed_answer": transcribed_answer,
            "evaluation": evaluation,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Update session in DB
        db_service.add_turn_to_mock_interview(session_id, user_email, turn_record)

        return {
            "success": True,
            "session_id": session_id,
            "question_id": question_id,
            "evaluation": evaluation,
            "disclaimer": "Scores are AI practice feedback metrics based on transcript evidence, not official hiring outcomes."
        }

    def finish_interview_session(self, session_id: str, user_email: str, ended_early: bool = False) -> dict:
        """
        Finalize interview session and produce comprehensive performance report.
        Fully supports stopping the interview in between / early exit!
        """
        session = db_service.get_mock_interview_session(session_id, user_email)
        if not session:
            return {"success": False, "error": "Mock interview session not found."}

        turns = session.get("turns", [])
        comp = session.get("company_name", "Target Company")
        role = session.get("job_role", "Software Engineer")
        total_qs = session.get("total_questions", len(turns))

        if not turns:
            # Candidate stopped without completing any question
            final_report = {
                "session_id": session_id,
                "company_name": comp,
                "job_role": role,
                "interview_type": session.get("interview_type", "Technical"),
                "difficulty": session.get("difficulty", "Medium"),
                "total_questions_answered": 0,
                "total_questions_planned": total_qs,
                "overall_score": 0,
                "performance_level": "Incomplete (Ended before answering)",
                "topic_performance": [],
                "key_strengths": ["Session initiated"],
                "weak_areas": ["No answers recorded to evaluate"],
                "recommended_revision_topics": [
                    f"Practice verbal communication for {comp}",
                    "Launch another session and complete at least 2 questions"
                ],
                "completed_at": datetime.utcnow().isoformat(),
                "ended_early": True,
                "disclaimer": "Session ended early before any questions were submitted."
            }
            db_service.update_mock_interview_status(session_id, user_email, "ENDED_EARLY", final_report)
            return {"success": True, "report": final_report}

        overall_scores = [t["evaluation"].get("overall_turn_score", 75) for t in turns if "evaluation" in t]
        avg_score = round(sum(overall_scores) / max(len(overall_scores), 1), 1)

        all_strengths = []
        all_missing = []
        for t in turns:
            ev = t.get("evaluation", {})
            all_strengths.extend(ev.get("strengths", []))
            all_missing.extend(ev.get("missing_concepts", []))

        is_early = len(turns) < total_qs or ended_early

        perf_label = "Excellent" if avg_score >= 85 else "Good / Ready" if avg_score >= 70 else "Needs Practice"
        if is_early:
            perf_label += f" ({len(turns)}/{total_qs} Questions Completed)"

        final_report = {
            "session_id": session_id,
            "company_name": comp,
            "job_role": role,
            "interview_type": session.get("interview_type", "Technical"),
            "difficulty": session.get("difficulty", "Medium"),
            "total_questions_answered": len(turns),
            "total_questions_planned": total_qs,
            "overall_score": avg_score,
            "performance_level": perf_label,
            "topic_performance": [
                {"topic": "Technical Knowledge", "score": min(avg_score + 3, 98)},
                {"topic": "Problem-Solving & Approach", "score": avg_score},
                {"topic": "Spoken Communication", "score": max(avg_score - 2, 60)}
            ],
            "key_strengths": list(set(all_strengths))[:4] if all_strengths else ["Good technical communication"],
            "weak_areas": list(set(all_missing))[:4] if all_missing else ["Edge case handling in coding logic"],
            "recommended_revision_topics": [
                f"Revise core DS & system design expected at {comp}",
                "Practice explicit time and space complexity explanations",
                "Structure technical answers with clear step-by-step logic"
            ],
            "question_breakdown": turns,
            "completed_at": datetime.utcnow().isoformat(),
            "ended_early": is_early,
            "disclaimer": "This report is generated from transcript evidence for placement practice."
        }

        db_service.update_mock_interview_status(session_id, user_email, "COMPLETED" if not is_early else "ENDED_EARLY", final_report)
        return {"success": True, "report": final_report}

voice_interview_service = VoiceInterviewService()
