import logging
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=500)
        self.is_fitted = False
        self.corpus_cache = []

    def fit_corpus(self, texts: list):
        """Fit TF-IDF vectorizer on existing corpus of experience documents."""
        valid_texts = [t for t in texts if t and len(t.strip()) > 0]
        if not valid_texts:
            valid_texts = ["sample interview experience algorithm coding data structure"]
        
        self.corpus_cache = valid_texts
        self.vectorizer.fit(valid_texts)
        self.is_fitted = True

    def get_embedding(self, text: str) -> np.ndarray:
        """Convert input text into a vector embedding array."""
        if not text:
            text = ""
        if not self.is_fitted:
            self.fit_corpus([text] if text else ["interview prep"])
        
        try:
            return self.vectorizer.transform([text]).toarray()[0]
        except Exception:
            # Fallback re-fit if new terms fail
            self.fit_corpus([text] + self.corpus_cache)
            return self.vectorizer.transform([text]).toarray()[0]

    def compute_similarity(self, query: str, document_texts: list) -> list:
        """Compute similarity scores between a query and a list of candidate documents."""
        if not document_texts:
            return []

        # Fit on combined query and documents for optimal term coverage
        temp_vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
        all_texts = [query] + document_texts
        try:
            tfidf_matrix = temp_vectorizer.fit_transform(all_texts)
            query_vec = tfidf_matrix[0:1]
            doc_vecs = tfidf_matrix[1:]
            similarities = cosine_similarity(query_vec, doc_vecs)[0]
            return similarities.tolist()
        except Exception as e:
            logger.error(f"Error computing text similarity: {e}")
            return [0.0] * len(document_texts)

embedding_service = EmbeddingService()
