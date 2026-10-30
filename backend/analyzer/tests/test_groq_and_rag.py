from unittest.mock import patch
from django.test import TestCase
from services.placement_ai_service import placement_ai_service
from services.embedding_service import embedding_service
from services.experience_indexing_service import experience_indexing_service
from services.experience_retrieval_service import experience_retrieval_service
from services.db_service import db_service

class PlacementAIAndRAGTestCase(TestCase):
    def test_embedding_calculation_and_similarity(self):
        query = "Google Tree BFS algorithm coding interview"
        docs = [
            "Focused heavily on Tree traversals, Graph Shortest Path, and LRU Cache design at Google.",
            "SQL query joins, database normalization 3NF and ACID properties.",
            "TCS aptitude test and basic Python OOP concepts."
        ]
        similarities = embedding_service.compute_similarity(query, docs)
        self.assertEqual(len(similarities), 3)
        self.assertGreater(similarities[0], similarities[1])

    def test_experience_indexing_and_retrieval(self):
        indexed_count = experience_indexing_service.rebuild_index()
        self.assertGreater(indexed_count, 0)

        retrieved = experience_retrieval_service.retrieve_relevant_experiences(
            company_name="Google",
            job_role="Software Development Engineer",
            query="Tree traversals",
            top_k=2
        )
        self.assertIn("retrieved_chunks", retrieved)
        self.assertIn("formatted_context", retrieved)
        self.assertTrue(len(retrieved["sources"]) > 0)
        self.assertEqual(retrieved["sources"][0]["company_name"], "Google")

    def test_experience_approval_and_removal(self):
        # 1. Create a test unapproved experience
        exp = {
            "student_name": "Test User",
            "college": "Tech College",
            "company_name": "Stripe",
            "job_role": "Backend Engineer",
            "summary": "Distributed systems, idempotency keys, and payment rate limiting interview.",
            "is_approved": False,
            "status": "Pending Review",
            "rounds_conducted": "3 Rounds"
        }
        saved = db_service.save_interview_experience(exp)
        exp_id = str(saved["_id"])

        # Should not be in index while unapproved
        experience_indexing_service.rebuild_index()
        chunks = experience_indexing_service.get_indexed_chunks()
        stripe_chunks = [c for c in chunks if c.get("exp_id") == exp_id]
        self.assertEqual(len(stripe_chunks), 0)

        # 2. Approve and index
        saved["is_approved"] = True
        saved["status"] = "Approved"
        db_service.update_interview_experience(saved)
        experience_indexing_service.index_single_experience(saved)
        chunks = experience_indexing_service.get_indexed_chunks()
        stripe_chunks = [c for c in chunks if c.get("exp_id") == exp_id]
        self.assertEqual(len(stripe_chunks), 1)

        # 3. Remove experience from index
        experience_indexing_service.remove_experience_from_index(exp_id)
        chunks = experience_indexing_service.get_indexed_chunks()
        stripe_chunks = [c for c in chunks if c.get("exp_id") == exp_id]
        self.assertEqual(len(stripe_chunks), 0)

    def test_flag_experience(self):
        res = db_service.flag_interview_experience("exp_1", reason="Inappropriate review")
        self.assertTrue(res)

    def test_placement_ai_service_availability(self):
        self.assertIsNotNone(placement_ai_service)
        self.assertTrue(placement_ai_service.is_available())
