from unittest.mock import patch
from django.test import TestCase
from services.company_prep_service import company_prep_service
from services.voice_interview_service import voice_interview_service
from services.placement_ai_service import placement_ai_service
from services.db_service import db_service

class CompanyPrepAndMockTestCase(TestCase):
    @patch('services.placement_ai_service.placement_ai_service.generate_json_response')
    def test_company_prep_overview_with_ai(self, mock_ai):
        mock_ai.return_value = {
            "company_details": {"name": "Amazon", "description": "Global e-commerce & cloud leader"},
            "company_overview": "Comprehensive Amazon interview guide",
            "key_skills_required": ["Algorithms", "System Design", "AWS"],
            "recruitment_stages": [
                {"stage_number": 1, "stage_name": "Online Assessment", "duration": "90 mins", "key_topics": ["Arrays", "Logic"]}
            ],
            "preparation_priorities": [
                {"category": "DSA", "focus_areas": "Trees, Graphs", "importance": "High"}
            ]
        }
        overview = company_prep_service.generate_company_prep_overview("Amazon", "SDE-1")
        self.assertIn("company_overview", overview)
        self.assertIn("recruitment_stages", overview)
        self.assertIn("preparation_priorities", overview)

    def test_personalized_roadmap_respects_days_fallback(self):
        # Even if AI is unavailable or rate-limited, fallback guarantees exact day matching
        with patch.object(placement_ai_service, 'is_available', return_value=False):
            roadmap_7 = company_prep_service.generate_personalized_roadmap("Microsoft", "Software Engineer", days_remaining=7)
            self.assertEqual(len(roadmap_7["daily_plan"]), 7)
            self.assertEqual(roadmap_7["days_remaining"], 7)

            roadmap_3 = company_prep_service.generate_personalized_roadmap("Microsoft", "Software Engineer", days_remaining=3)
            self.assertEqual(len(roadmap_3["daily_plan"]), 3)
            self.assertEqual(roadmap_3["days_remaining"], 3)

    @patch('services.placement_ai_service.placement_ai_service.generate_json_response')
    def test_company_questions_generation(self, mock_ai):
        mock_ai.return_value = {
            "questions": [
                {
                    "id": "q1",
                    "question": "How to optimize search query response times?",
                    "category": "Technical",
                    "difficulty": "Medium",
                    "model_answer": "Use B-Tree indexing and Redis caching.",
                    "evaluation_criteria": ["Mentions Indexing"],
                    "is_reported_by_community": True,
                    "provenance": "Community reports"
                }
            ]
        }
        questions = company_prep_service.generate_company_questions("Google", "Software Development Engineer")
        self.assertGreater(len(questions), 0)
        self.assertIn("question", questions[0])
        self.assertIn("model_answer", questions[0])

    @patch('services.interview_ai_service.interview_ai_service.generate_json_response')
    def test_mock_interview_turn_and_report_flow(self, mock_ai):
        mock_ai.return_value = {
            "scores": {
                "technical_correctness": 88,
                "relevance": 90,
                "completeness": 85,
                "clarity": 87,
                "problem_solving": 86
            },
            "overall_turn_score": 87,
            "strengths": ["Clear explanation of pointer reversal", "Stated time complexity O(N)"],
            "missing_concepts": ["Mention edge case for single node"],
            "suggested_improvements": ["Discuss recursive vs iterative trade-offs"],
            "model_answer": "Use prev, current, next pointers in an iterative loop.",
            "followup_question": "How would you reverse only a portion of the list between indices m and n?"
        }

        # 1. Start Session
        session = voice_interview_service.start_interview_session(
            user_email="test_student@college.edu",
            company_name="Google",
            job_role="SDE",
            question_count=3
        )
        self.assertIn("session_id", session)
        session_id = session["session_id"]

        # 2. Evaluate Answer Turn
        eval_result = voice_interview_service.evaluate_answer_turn(
            session_id=session_id,
            user_email="test_student@college.edu",
            question_id="q1",
            question_text="How do you reverse a Linked List in O(N) time and O(1) space?",
            transcribed_answer="I would use three pointers: prev, current, and next. Iterate through list, updating current.next to prev, then advance pointers."
        )
        self.assertTrue(eval_result["success"])
        self.assertIn("evaluation", eval_result)
        self.assertEqual(eval_result["evaluation"]["overall_turn_score"], 87)

        # 3. Finish Session & Report
        finish_res = voice_interview_service.finish_interview_session(session_id, "test_student@college.edu")
        self.assertTrue(finish_res["success"])
        self.assertIn("report", finish_res)
        self.assertEqual(finish_res["report"]["company_name"], "Google")
        self.assertEqual(finish_res["report"]["total_questions_answered"], 1)

    def test_session_ownership_and_reports(self):
        reports = db_service.get_user_mock_interview_reports("test_student@college.edu")
        self.assertIsInstance(reports, list)
        self.assertGreater(len(reports), 0)
        # Verify another user cannot see this report
        other_reports = db_service.get_user_mock_interview_reports("other_student@college.edu")
        self.assertEqual(len(other_reports), 0)
