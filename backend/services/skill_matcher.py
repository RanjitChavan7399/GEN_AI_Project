import re
import logging

logger = logging.getLogger(__name__)

# Configurable Skill Taxonomy with Categories and Aliases
SKILL_TAXONOMY = {
    "Programming": {
        "Python": ["python", "py"],
        "JavaScript": ["javascript", "js", "ecmascript"],
        "TypeScript": ["typescript", "ts"],
        "Java": ["java"],
        "C++": ["c++", "cpp"],
        "C#": ["c#", "csharp"],
        "C": ["c"],
        "Go": ["golang", "go"],
        "Rust": ["rust"],
        "PHP": ["php"],
        "Ruby": ["ruby"]
    },
    "Backend": {
        "Django": ["django"],
        "Django REST Framework": ["django rest framework", "drf"],
        "FastAPI": ["fastapi"],
        "Flask": ["flask"],
        "Node.js": ["node.js", "nodejs", "node"],
        "Express.js": ["express.js", "expressjs", "express"],
        "Spring Boot": ["spring boot", "springboot", "spring"],
        "ASP.NET": ["asp.net", "dotnet", ".net"]
    },
    "Frontend": {
        "React": ["react", "react.js", "reactjs"],
        "Angular": ["angular", "angularjs"],
        "Vue.js": ["vue", "vue.js", "vuejs"],
        "Next.js": ["next.js", "nextjs"],
        "HTML": ["html", "html5"],
        "CSS": ["css", "css3"],
        "Tailwind CSS": ["tailwind", "tailwindcss"],
        "Redux": ["redux"]
    },
    "Databases": {
        "SQL": ["sql"],
        "PostgreSQL": ["postgresql", "postgres"],
        "MySQL": ["mysql"],
        "MongoDB": ["mongodb", "mongo"],
        "Redis": ["redis"],
        "SQLite": ["sqlite"],
        "Oracle": ["oracle"]
    },
    "Cloud & DevOps": {
        "AWS": ["aws", "amazon web services"],
        "Docker": ["docker"],
        "Kubernetes": ["kubernetes", "k8s"],
        "GCP": ["gcp", "google cloud platform", "google cloud"],
        "Azure": ["azure", "microsoft azure"],
        "Git": ["git", "github", "gitlab"],
        "CI/CD": ["ci/cd", "ci-cd", "continuous integration"],
        "Linux": ["linux", "ubuntu", "unix"]
    },
    "AI & Data": {
        "Machine Learning": ["machine learning", "ml"],
        "Deep Learning": ["deep learning", "dl"],
        "Generative AI": ["generative ai", "genai", "llm", "large language models"],
        "TensorFlow": ["tensorflow"],
        "PyTorch": ["pytorch"],
        "Pandas": ["pandas"],
        "NumPy": ["numpy"]
    },
    "Core CS": {
        "Data Structures": ["data structures", "dsa"],
        "Algorithms": ["algorithms", "algorithmic"],
        "Object-Oriented Programming": ["object-oriented programming", "oops", "oop"],
        "System Design": ["system design", "distributed systems"],
        "DBMS": ["dbms", "database management"],
        "Operating Systems": ["operating systems", "os concepts"],
        "Computer Networks": ["computer networks", "networking"]
    }
}

def match_skill_in_text(skill_name: str, aliases: list, text: str) -> tuple[bool, str]:
    """Perform exact word-boundary token matching to avoid substring false positives (e.g. C vs CSS, Java vs JavaScript)."""
    text_lower = text.lower()
    
    for alias in aliases:
        # Special handling for skills with non-alphanumeric chars like C++, C#
        escaped_alias = re.escape(alias)
        if alias in ["c++", "cpp"]:
            pattern = r'(?i)(?:\bcpp\b|c\+\+)'
        elif alias in ["c#", "csharp"]:
            pattern = r'(?i)(?:\bcsharp\b|c\#)'
        elif len(alias) <= 2:
            # Short terms like "c", "go", "js", "py", "ts", "os" require strict word boundaries
            pattern = rf'(?i)\b{escaped_alias}\b'
        else:
            pattern = rf'(?i)\b{escaped_alias}\b'

        match = re.search(pattern, text)
        if match:
            # Find supporting excerpt line around match
            match_pos = match.start()
            start_pos = max(0, text.rfind('\n', 0, match_pos))
            end_pos = text.find('\n', match_pos)
            if end_pos == -1:
                end_pos = len(text)
            excerpt = text[start_pos:end_pos].strip()
            return True, excerpt

    return False, ""

def find_resume_section_for_match(excerpt: str, sections: dict) -> str:
    """Identify which section of the resume contains the supporting excerpt."""
    if not sections:
        return "Resume Content"

    for sec_name, sec_text in sections.items():
        if excerpt in sec_text or any(word in sec_text for word in excerpt.split()[:4] if len(word) > 3):
            return sec_name.title()

    return "Projects / Skills"

def perform_deterministic_skill_matching(resume_text: str, resume_sections: dict, job_description: str) -> dict:
    """
    Extract skills from Job Description and perform token-aware matching against Resume.
    Returns categorized matched skills and missing skills.
    """
    jd_lower = job_description.lower()
    
    jd_skills_found = {}

    # Extract which skills from taxonomy appear in JD
    for category, skills_dict in SKILL_TAXONOMY.items():
        for skill_name, aliases in skills_dict.items():
            in_jd, _ = match_skill_in_text(skill_name, aliases, job_description)
            if in_jd:
                # Determine importance (required vs preferred) based on JD phrasing
                importance = "required"
                pattern_pref = rf'(?i)(preferred|nice to have|good to have|plus|optional).{{0,50}}\b{re.escape(skill_name)}\b'
                if re.search(pattern_pref, job_description):
                    importance = "preferred"

                jd_skills_found[skill_name] = {
                    "name": skill_name,
                    "category": category,
                    "aliases": aliases,
                    "importance": importance
                }

    matched_skills = []
    missing_skills = []

    for skill_name, info in jd_skills_found.items():
        matched, excerpt = match_skill_in_text(skill_name, info["aliases"], resume_text)
        if matched:
            sec = find_resume_section_for_match(excerpt, resume_sections)
            matched_skills.append({
                "name": skill_name,
                "category": info["category"],
                "importance": info["importance"],
                "evidence_status": "demonstrated",
                "evidence": excerpt if len(excerpt) < 150 else excerpt[:147] + "...",
                "resume_section": sec
            })
        else:
            missing_skills.append({
                "name": skill_name,
                "category": info["category"],
                "importance": info["importance"],
                "evidence_status": "not_found",
                "reason": f"Not clearly demonstrated in your resume.",
                "suggested_action": f"Review core {skill_name} concepts and add verified project or practical experience if applicable."
            })

    # If JD didn't explicitly mention taxonomy skills, scan resume for present skills
    if not matched_skills:
        for category, skills_dict in SKILL_TAXONOMY.items():
            for skill_name, aliases in skills_dict.items():
                matched, excerpt = match_skill_in_text(skill_name, aliases, resume_text)
                if matched and len(matched_skills) < 6:
                    sec = find_resume_section_for_match(excerpt, resume_sections)
                    matched_skills.append({
                        "name": skill_name,
                        "category": category,
                        "importance": "preferred",
                        "evidence_status": "demonstrated",
                        "evidence": excerpt[:145] if len(excerpt) > 145 else excerpt,
                        "resume_section": sec
                    })

    return {
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "total_jd_skills": len(jd_skills_found)
    }
