from django.test import TestCase
from services.scoring_service import calculate_deterministic_score

class ScoringServiceTestCase(TestCase):
    def test_deterministic_scoring_calculation(self):
        matched = [
            {"name": "Python", "importance": "required"},
            {"name": "Django", "importance": "required"},
            {"name": "React", "importance": "preferred"}
        ]
        missing = [
            {"name": "Docker", "importance": "required"}
        ]
        text = "Education: B.Tech in Computer Science and Engineering. Built Python & React projects."
        sections = {"education": "B.Tech", "projects": "Python & React"}

        scoring = calculate_deterministic_score(matched, missing, text, sections)
        
        self.assertGreater(scoring["overall"], 50)
        self.assertLessEqual(scoring["overall"], 100)
        self.assertEqual(len(scoring["breakdown"]), 4)
        self.assertIn("disclaimer", scoring)
