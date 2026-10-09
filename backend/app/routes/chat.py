import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatMessageRequest, ChatMessageResponse
from app.db.supabase_client import db
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("/message", response_model=ChatMessageResponse)
async def chat_socratic_message(req: ChatMessageRequest):
    """
    Socratic AI Assistant:
    Answers any question across the curriculum, cites source textbook chapters/PDFs,
    and offers hobby analogies.
    """
    user_id = req.user_id
    profile = db.get_profile(user_id) or {"hobby_anchor": "Music Production"}
    hobby_anchor = profile.get("hobby_anchor", "Music Production")

    # Get active concept if specified and not 'general'
    active_concept = None
    if req.concept_id and req.concept_id != "general":
        active_concept = db.get_concept(req.concept_id)

    # Get all concepts for user so assistant knows entire syllabus
    all_concepts = db.get_all_concepts_for_user(user_id)

    # Retrieve relevant textbook chunks from Upstash Vector
    retrieved_chunks = []
    try:
        from app.services.vector_store import vector_service
        raw_chunks = vector_service.index.query(data=req.message, top_k=2, include_metadata=True)
        for r in raw_chunks:
            if hasattr(r, "metadata") and r.metadata:
                retrieved_chunks.append(r.metadata)
    except Exception as e:
        logger.warning(f"Vector search failed in chat: {e}")

    # Fallback to chapters from DB if vector chunks empty
    if not retrieved_chunks:
        chapters = db.get_chapters_for_user(user_id)
        for ch in chapters:
            retrieved_chunks.append({
                "chapter_title": ch.get("title", "Textbook Syllabus"),
                "section_title": f"Chapter {ch.get('order_index', 1)} Core Principles",
                "subject": ch.get("subject", "Physics"),
                "text": f"Chapter {ch.get('order_index', 1)}: {ch.get('title')}"
            })

    try:
        reply = llm_service.socratic_chat_explain(
            user_question=req.message,
            hobby_anchor=hobby_anchor,
            active_concept=active_concept,
            all_concepts=all_concepts,
            retrieved_chunks=retrieved_chunks,
            history=req.conversation_history
        )
        return ChatMessageResponse(
            reply=reply,
            concept_id=req.concept_id or (active_concept["id"] if active_concept else "general"),
            hobby_anchor=hobby_anchor
        )
    except Exception as e:
        logger.error(f"Error in Socratic chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
