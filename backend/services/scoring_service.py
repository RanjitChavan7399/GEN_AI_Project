import re
import logging

logger = logging.getLogger(__name__)

DEFAULT_WEIGHTS = {
    "required_skills": 0.50,
    "preferred_skills": 0.20,
    "projects_experience": 0.20,
    "education_qualifications": 0.10
}

DEGREE_KEYWORDS = [
    r"(?i)\b(b\.?tech|b\.?e\.?|m\.?tech|m\.?e\.?|mca|bca|b\.?sc|m\.?sc|bachelor|master|degree|diploma)\b",
    r"(?i)\b(computer science|information technology|software engineering|data science|computer engineering)\b"
]

def calculate_deterministic_score(matched_skills: list, missing_skills: list, resume_text: str, resume_sections: dict) -> dict:
    """
    Calculate deterministic, transparent resume-to-JD alignment score.
    Returns overall score (0-100), explainable category breakdown, and disclaimer.
    """
    req_matched = [s for s in matched_skills if s.get("importance") == "required"]
    req_missing = [s for s in missing_skills if s.get("importance") == "required"]
    
    pref_matched = [s for s in matched_skills if s.get("importance") == "preferred"]
    pref_missing = [s for s in missing_skills if s.get("importance") == "preferred"]

    # Category 1: Required Skills (50%)
    total_req = len(req_matched) + len(req_missing)
    if total_req > 0:
        score_req = int((len(req_matched) / total_req) * 100)
        assessable_req = True
    else:
        score_req = 75 if len(matched_skills) > 0 else 50
        assessable_req = True

    # Category 2: Preferred Skills (20%)
    total_pref = len(pref_matched) + len(pref_missing)
    if total_pref > 0:
        score_pref = int((len(pref_matched) / total_pref) * 100)
        assessable_pref = True
    else:
        score_pref = 70
        assessable_pref = True

    # Category 3: Projects & Experience Relevance (20%)
    has_projects = "projects" in resume_sections or "experience" in resume_sections
    project_score = 80 if has_projects else 55
    if len(matched_skills) >= 5:
        project_score = min(project_score + 15, 95)
    
    # Category 4: Education & Qualifications (10%)
    has_degree = False
    for pattern in DEGREE_KEYWORDS:
        if re.search(pattern, resume_text):
            has_degree = True
            break
    edu_score = 85 if has_degree else 65

    # Overall Weighted Score Calculation
    raw_score = (
        (score_req * DEFAULT_WEIGHTS["required_skills"]) +
        (score_pref * DEFAULT_WEIGHTS["preferred_skills"]) +
        (project_score * DEFAULT_WEIGHTS["projects_experience"]) +
        (edu_score * DEFAULT_WEIGHTS["education_qualifications"])
    )
    
    overall_score = min(max(int(round(raw_score)), 0), 100)

    breakdown = [
        {
            "category": "Required Skills Alignment",
            "score": score_req,
            "weight": DEFAULT_WEIGHTS["required_skills"],
            "assessable": assessable_req,
            "explanation": f"{len(req_matched)} of {total_req or len(req_matched)} required core skills identified in resume."
        },
        {
            "category": "Preferred Skills & Tools",
            "score": score_pref,
            "weight": DEFAULT_WEIGHTS["preferred_skills"],
            "assessable": assessable_pref,
            "explanation": f"{len(pref_matched)} of {total_pref or len(pref_matched)} preferred technical stack skills found."
        },
        {
            "category": "Projects & Practical Experience",
            "score": project_score,
            "weight": DEFAULT_WEIGHTS["projects_experience"],
            "assessable": True,
            "explanation": "Evaluated based on technical section structure and project depth evidence."
        },
        {
            "category": "Education & Academic Alignment",
            "score": edu_score,
            "weight": DEFAULT_WEIGHTS["education_qualifications"],
            "assessable": True,
            "explanation": "Degree and technical specialization evidence identified in education section."
        }
    ]

    return {
        "overall": overall_score,
        "label": "Resume Alignment Estimate",
        "disclaimer": "This score estimates resume alignment with the supplied job description. It does not predict hiring decisions or guarantee selection.",
        "breakdown": breakdown
    }
