import logging
from datetime import datetime
from services.db_service import db_service
from services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

class ExperienceIndexingService:
    def __init__(self):
        self.indexed_chunks = []
        self.last_indexed_at = None
        # Auto build index on startup
        self.rebuild_index()

    def rebuild_index(self):
        """Fetch all approved interview experiences, chunk them, and rebuild vector index."""
        try:
            raw_experiences = db_service.get_all_interview_experiences(limit=200)
            chunks = []
            
            for exp in raw_experiences:
                # Exclude unapproved or rejected experiences
                if exp.get("is_approved") is False or exp.get("status") == "Rejected":
                    continue

                exp_id = str(exp.get("_id", "exp_unk"))
                company = exp.get("company_name", "General")
                role = exp.get("job_role", "Software Engineer")
                student = exp.get("student_name", "Student Contributor")
                college = exp.get("college", "Engineering Institute")
                rounds = exp.get("rounds_conducted", "Technical Interview")
                summary = exp.get("summary", "")
                upvotes = exp.get("upvotes", 0)
                created_at = exp.get("created_at", datetime.utcnow().isoformat())

                # Create structured text representation for retrieval
                chunk_text = f"Company: {company} | Role: {role} | Rounds: {rounds}\nStudent Experience by {student} ({college}):\n{summary}"

                chunks.append({
                    "id": f"{exp_id}_chunk_1",
                    "exp_id": exp_id,
                    "company_name": company,
                    "job_role": role,
                    "student_name": student,
                    "college": college,
                    "rounds_conducted": rounds,
                    "content": chunk_text,
                    "summary": summary,
                    "upvotes": upvotes,
                    "created_at": created_at,
                    "provenance": f"Reported by {student} ({college}) for {company} {role}"
                })

            self.indexed_chunks = chunks
            all_texts = [c["content"] for c in chunks]
            embedding_service.fit_corpus(all_texts)
            self.last_indexed_at = datetime.utcnow().isoformat()
            logger.info(f"Successfully rebuilt vector index with {len(chunks)} interview experience chunks.")
            return len(chunks)

        except Exception as e:
            logger.error(f"Error rebuilding experience index: {e}")
            return 0

    def index_single_experience(self, exp_data: dict):
        """Index or update a single approved interview experience."""
        if exp_data.get("is_approved") is False:
            logger.info(f"Skipping indexing for unapproved experience {exp_data.get('_id')}")
            return False

        # Trigger index rebuild to ensure consistency
        self.rebuild_index()
        return True

    def remove_experience_from_index(self, exp_id: str):
        """Remove deleted experience from active index."""
        self.indexed_chunks = [c for c in self.indexed_chunks if c.get("exp_id") != str(exp_id)]
        logger.info(f"Removed experience {exp_id} from vector index.")

    def get_indexed_chunks(self):
        return self.indexed_chunks

experience_indexing_service = ExperienceIndexingService()
