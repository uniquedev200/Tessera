import logging
from typing import List, Dict, Any, Optional
from upstash_vector import Index
from app.config import settings

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        if settings.UPSTASH_VECTOR_REST_URL and settings.UPSTASH_VECTOR_REST_TOKEN:
            try:
                self.index = Index(
                    url=settings.UPSTASH_VECTOR_REST_URL,
                    token=settings.UPSTASH_VECTOR_REST_TOKEN
                )
            except Exception as e:
                logger.error(f"Failed to initialize Upstash Vector Index: {e}")
                self.index = None
        else:
            self.index = None

    def upsert_chapter_chunks(self, chunks: List[Dict[str, Any]]) -> bool:
        """
        Upserts text chunks using Upstash hosted embedding model (e.g. text-embedding-3-small).
        Chunk format: {"id": str, "text": str, "metadata": dict}
        """
        if not chunks:
            return True
        if not self.index:
            logger.warning("Upstash Vector credentials not configured.")
            return False
        try:
            vectors = [
                (c["id"], c["text"], {**c.get("metadata", {}), "text": c["text"]})
                for c in chunks
            ]
            # Batch upsert in batches of 100
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                self.index.upsert(vectors=vectors[i:i+batch_size])
            logger.info(f"Successfully upserted {len(chunks)} chunks into Upstash Vector.")
            return True
        except Exception as e:
            logger.error(f"Error upserting vectors to Upstash: {e}")
            return False

    def query_concept_context(self, query_text: str, top_k: int = 3) -> List[str]:
        """
        Queries Upstash Vector for the most relevant textbook chunks.
        """
        try:
            results = self.index.query(data=query_text, top_k=top_k, include_metadata=True)
            contexts = []
            for res in results:
                if hasattr(res, "metadata") and res.metadata:
                    text = res.metadata.get("text", "")
                    if text:
                        contexts.append(text)
            return contexts
        except Exception as e:
            logger.error(f"Error querying Upstash Vector: {e}")
            return []

vector_service = VectorService()
