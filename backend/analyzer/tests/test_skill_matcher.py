from django.test import TestCase
from services.skill_matcher import perform_deterministic_skill_matching, match_skill_in_text

class SkillMatcherTestCase(TestCase):
    def test_exact_and_alias_skill_matching(self):
        text = "Experienced in Python, Django REST Framework (DRF), React, and PostgreSQL databases."
        jd = "We require Python, DRF, React, and Kubernetes (K8s)."

        results = perform_deterministic_skill_matching(text, {"skills": text}, jd)
        matched_names = [s["name"] for s in results["matched_skills"]]
        missing_names = [s["name"] for s in results["missing_skills"]]

        self.assertIn("Python", matched_names)
        self.assertIn("Django REST Framework", matched_names)
        self.assertIn("React", matched_names)
        self.assertIn("Kubernetes", missing_names)

    def test_avoid_false_positive_substring_matches(self):
        # "C" should not match "CSS"
        matched_c, _ = match_skill_in_text("C", ["c"], "Proficient in CSS3 and HTML5.")
        self.assertFalse(matched_c)

        # "Java" should not match "JavaScript"
        matched_java, _ = match_skill_in_text("Java", ["java"], "Extensive experience with JavaScript and Node.js.")
        self.assertFalse(matched_java)
