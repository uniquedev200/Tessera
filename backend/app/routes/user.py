import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.supabase_client import db
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user", tags=["User"])

class UpdateHobbyRequest(BaseModel):
    user_id: str
    new_hobby: str

@router.post("/hobby")
async def update_hobby(payload: UpdateHobbyRequest):
    """
    Safely updates the user's cognitive hobby anchor:
    1. Updates profile hobby_anchor in database
    2. Fetches existing concepts
    3. Batch regenerates unique, per-concept analogies using Groq 70B
    4. Persists analogies without crashing canvas or breaking edge references
    """
    try:
        # 1. Update Profile in DB
        profile = db.update_profile_hobby(payload.user_id, payload.new_hobby)
        if not profile:
            existing = db.get_profile(payload.user_id)
            if not existing:
                raise HTTPException(status_code=404, detail=f"User profile '{payload.user_id}' not found")
            profile = existing

        # 2. Fetch existing concepts for this user
        concepts = db.get_all_concepts_for_user(payload.user_id)
        if not concepts:
            return {"status": "ok", "updated_count": 0, "updated_nodes": []}

        # 3. Batch regenerate unique analogies using 70B
        updated_nodes = llm_service.batch_regenerate_analogies(concepts, payload.new_hobby)

        # 4. Update database in a single fast batch
        from psycopg2.extras import execute_batch
        with db.get_cursor(commit=True) as cur:
            if updated_nodes:
                execute_batch(
                    cur,
                    "UPDATE concept_nodes SET hobby_analogy = %(hobby_analogy)s WHERE id = %(id)s;",
                    updated_nodes
                )
            # Synchronously update any hobby anchor nodes in concept_nodes
            cur.execute(
                """
                UPDATE concept_nodes 
                SET label = %s, core_invariant = %s 
                WHERE is_hobby_anchor = TRUE AND chapter_id IN (
                    SELECT id FROM chapters WHERE user_id = %s
                );
                """,
                (
                    f"{payload.new_hobby} Cognitive Anchor",
                    f"Primary cognitive grounding in {payload.new_hobby}",
                    payload.user_id
                )
            )

        return {
            "status": "ok",
            "hobby_anchor": payload.new_hobby,
            "updated_count": len(updated_nodes),
            "updated_nodes": updated_nodes
        }
    except Exception as e:
        logger.error(f"Error updating user hobby anchor: {e}")
        raise HTTPException(status_code=500, detail=str(e))
