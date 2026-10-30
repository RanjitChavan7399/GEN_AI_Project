import logging
from services.embedding_service import embedding_service
from services.experience_indexing_service import experience_indexing_service

logger = logging.getLogger(__name__)

class ExperienceRetrievalService:
    def retrieve_relevant_experiences(self, company_name: str = "", job_role: str = "", query: str = "", top_k: int = 3) -> dict:
        """
        RAG Retrieval Engine:
        Retrieve most semantically relevant interview experience chunks grounded in student reports.
        """
        indexed_chunks = experience_indexing_service.get_indexed_chunks()
        if not indexed_chunks:
            # Rebuild if empty
            experience_indexing_service.rebuild_index()
            indexed_chunks = experience_indexing_service.get_indexed_chunks()

        if not indexed_chunks:
            return {
                "retrieved_chunks": [],
                "formatted_context": "No verified community interview experiences currently available in knowledge base.",
                "has_matches": False,
                "sources": []
            }

        # Step 1: Pre-filter by company and job role if specified
        filtered_chunks = []
        company_clean = (company_name or "").strip().lower()
        role_clean = (job_role or "").strip().lower()

        for chunk in indexed_chunks:
            chunk_company = chunk.get("company_name", "").lower()
            chunk_role = chunk.get("job_role", "").lower()

            # Company match or generic match
            company_match = not company_clean or company_clean in chunk_company or chunk_company in company_clean
            role_match = not role_clean or role_clean in chunk_role or chunk_role in role_clean

            if company_match or role_match:
                filtered_chunks.append(chunk)

        # Fallback to all indexed chunks if strict filtering returned empty set
        candidates = filtered_chunks if filtered_chunks else indexed_chunks

        # Step 2: Perform semantic similarity scoring using embedding service
        search_query = f"{company_name} {job_role} {query}".strip()
        candidate_texts = [c["content"] for c in candidates]
        
        scores = embedding_service.compute_similarity(search_query, candidate_texts)

        # Pair scores with candidate chunks
        scored_results = []
        for idx, chunk in enumerate(candidates):
            score = float(scores[idx]) if idx < len(scores) else 0.0
            chunk_copy = dict(chunk)
            chunk_copy["similarity_score"] = round(score, 4)
            scored_results.append(chunk_copy)

        # Sort by similarity score descending and pick top_k
        scored_results.sort(key=lambda x: (x["similarity_score"], x.get("upvotes", 0)), reverse=True)
        top_chunks = scored_results[:top_k]

        # Format context string for LLM prompting
        context_lines = []
        sources = []
        for i, chunk in enumerate(top_chunks):
            citation_id = f"[Source {i+1}]"
            context_lines.append(f"{citation_id} {chunk['provenance']}:\nSummary: {chunk['summary']}\nRounds: {chunk['rounds_conducted']}\n")
            sources.append({
                "citation_id": citation_id,
                "company_name": chunk["company_name"],
                "job_role": chunk["job_role"],
                "student_name": chunk["student_name"],
                "college": chunk["college"],
                "upvotes": chunk["upvotes"],
                "similarity_score": chunk["similarity_score"],
                "provenance": chunk["provenance"]
            })

        formatted_context = "\n---\n".join(context_lines) if context_lines else "No specific matching interview experiences found."

        return {
            "retrieved_chunks": top_chunks,
            "formatted_context": formatted_context,
            "has_matches": len(top_chunks) > 0 and top_chunks[0]["similarity_score"] > 0.05,
            "sources": sources
        }

experience_retrieval_service = ExperienceRetrievalService()
