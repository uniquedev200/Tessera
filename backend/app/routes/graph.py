import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from app.db.supabase_client import db
from app.services.graph_engine import graph_engine
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/graph", tags=["Graph"])

@router.get("/user/{user_id}")
async def get_user_graph_canvas(user_id: str):
    """
    Returns full graph data formatted for @xyflow/react canvas rendering:
    - ChapterHullNode containers
    - ConceptPillNode items with live BKT status and p_mastery
    - HobbyAnchorNode items
    - CausalEdge and BridgeEdge connections
    """
    try:
        profile = db.get_profile(user_id) or {"hobby_anchor": "Music Production"}
        hobby_anchor = profile.get("hobby_anchor", "Music Production")
        chapters = db.get_chapters_for_user(user_id)
        raw_concepts = db.get_all_concepts_for_user(user_id)
        raw_edges = db.get_all_edges_for_user(user_id)
        epistemic_states = {s["concept_id"]: s for s in db.get_all_epistemic_states_for_user(user_id)}

        # Layout computation for clean spatial separation
        positioned_concepts = graph_engine.compute_layout(chapters, raw_concepts)

        rf_nodes: List[Dict[str, Any]] = []

        # 1. Render Chapter Hull nodes (group containers)
        for idx, ch in enumerate(chapters):
            ch_x = 40 + (idx * 660)
            ch_y = 40
            rf_nodes.append({
                "id": f"hull_{ch['id']}",
                "type": "chapterHull",
                "position": {"x": ch_x, "y": ch_y},
                "data": {
                    "id": f"hull_{ch['id']}",
                    "chapter_id": str(ch["id"]),
                    "chapterId": f"hull_{ch['id']}",
                    "title": ch["title"],
                    "subject": ch["subject"],
                    "order_index": ch["order_index"],
                    "orderIndex": ch["order_index"]
                },
                "selectable": False,
                "draggable": False
            })

        # 2. Render Concept Nodes
        for c in positioned_concepts:
            epistemic = epistemic_states.get(c["id"], {})
            p_mastery = epistemic.get("p_mastery", 0.15)
            has_misc = len(epistemic.get("active_misconceptions", [])) > 0
            if p_mastery >= 0.75:
                status = "MASTERED"
            elif p_mastery <= 0.40 and (has_misc or epistemic.get("status") == "FRAGILE"):
                status = "FRAGILE"
            elif epistemic.get("status") in ["UNVERIFIED", "IN_PROGRESS"]:
                status = epistemic.get("status")
            else:
                status = "UNVERIFIED"

            is_hobby = c.get("is_hobby_anchor", False)
            node_type = "hobbyAnchor" if is_hobby else "conceptPill"
            ch_title = c.get("chapter_title", "Chapter")
            node_label = f"{hobby_anchor} Cognitive Anchor" if is_hobby else c["label"]
            node_invariant = f"Primary world-model grounding in {hobby_anchor}" if is_hobby else c["core_invariant"]

            rf_nodes.append({
                "id": c["id"],
                "type": node_type,
                "position": {"x": c["position_x"], "y": c["position_y"]},
                "data": {
                    "id": c["id"],
                    "label": node_label,
                    "core_invariant": node_invariant,
                    "coreInvariant": node_invariant,
                    "jargon_blacklist": c.get("jargon_blacklist", []),
                    "is_hobby_anchor": is_hobby,
                    "isHobbyAnchor": is_hobby,
                    "chapter_id": str(c.get("chapter_id", "")),
                    "chapterId": f"hull_{c.get('chapter_id')}",
                    "chapter_title": ch_title,
                    "chapterTitle": ch_title,
                    "hobby_analogy": c.get("hobby_analogy") or f"In {hobby_anchor}, this functions like balancing primary drivers and dynamic rates.",
                    "hobbyAnalogy": c.get("hobby_analogy") or f"In {hobby_anchor}, this functions like balancing primary drivers and dynamic rates.",
                    "p_mastery": p_mastery,
                    "pMastery": p_mastery,
                    "status": status,
                    "active_misconceptions": epistemic.get("active_misconceptions", [])
                }
            })

        # 3. Render Edges
        rf_edges: List[Dict[str, Any]] = []
        for e in raw_edges:
            is_bridge = e.get("is_isomorphism_bridge", False)
            is_hobby = e["source_node_id"].startswith("hobby_") or e["target_node_id"].startswith("hobby_")
            edge_type = "bridge" if is_bridge else "causal"
            rf_edges.append({
                "id": f"edge_{e['source_node_id']}_{e['target_node_id']}",
                "source": e["source_node_id"],
                "target": e["target_node_id"],
                "type": edge_type,
                "animated": is_bridge or is_hobby,
                "data": {
                    "relationship_label": e["relationship_label"],
                    "label": e["relationship_label"],
                    "is_isomorphism_bridge": is_bridge,
                    "isBridge": is_bridge,
                    "is_hobby_anchor": is_hobby,
                    "isHobbyAnchor": is_hobby,
                    "is_cross_chapter": e.get("is_cross_chapter", False),
                    "connection_reason": e.get("connection_reason") or "",
                    "connectionReason": e.get("connection_reason") or "",
                    "real_world_artifact": e.get("real_world_artifact") or "",
                    "realWorldArtifact": e.get("real_world_artifact") or ""
                }
            })

        return {
            "nodes": rf_nodes,
            "edges": rf_edges,
            "chapters": chapters,
            "hobby_anchor": hobby_anchor
        }
    except Exception as e:
        logger.error(f"Error fetching user graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bridges/discover")
async def discover_bridges(payload: dict):
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    chapters = db.get_chapters_for_user(user_id)
    if len(chapters) < 2:
        return {"discovered_bridges": [], "message": "Need at least 2 chapters to discover cross-chapter bridges"}

    all_concepts = db.get_all_concepts_for_user(user_id)
    # Group by chapter
    by_chap: Dict[str, List[Dict[str, Any]]] = {}
    for c in all_concepts:
        if not c.get("is_hobby_anchor"):
            by_chap.setdefault(str(c["chapter_id"]), []).append(c)

    chap_ids = list(by_chap.keys())
    new_bridges = []
    for i in range(len(chap_ids)):
        for j in range(i + 1, len(chap_ids)):
            c_list_a = by_chap[chap_ids[i]]
            c_list_b = by_chap[chap_ids[j]]
            for c_a in c_list_a[:3]:
                for c_b in c_list_b[:3]:
                    try:
                        res = llm_service.synthesize_isomorphism_bridge(c_a, c_b)
                        if res.get("similarity_score", 0.85) >= 0.80:
                            bridge_edge = {
                                "chapter_id": c_b.get("chapter_id"),
                                "source_node_id": c_a["id"],
                                "target_node_id": c_b["id"],
                                "relationship_label": f"ISOMORPHISM: {res.get('bridge_label', 'Shared Principle')}",
                                "connection_reason": res.get("connection_reason") or f"Both {c_a.get('label')} and {c_b.get('label')} share identical governing rate laws.",
                                "real_world_artifact": res.get("real_world_artifact") or "",
                                "is_cross_chapter": True,
                                "is_isomorphism_bridge": True
                            }
                            db.upsert_concept_edges([bridge_edge])
                            new_bridges.append(bridge_edge)
                            if len(new_bridges) >= 2:
                                break
                    except Exception as e:
                        logger.error(f"Bridge discovery error: {e}")
                if len(new_bridges) >= 2:
                    break

    graph_engine.reload_user_graph(user_id)
    return {"discovered_bridges": new_bridges}

@router.delete("/user/{user_id}/reset")
@router.post("/user/{user_id}/reset")
async def reset_user_graph(user_id: str):
    """
    Clears all chapters, concept nodes, causal edges, epistemic states,
    and logs for the student to provide a completely clean canvas.
    """
    try:
        db.clear_user_data(user_id)
        graph_engine.reload_user_graph(user_id)
        return {
            "status": "success",
            "message": "All graph data and epistemic states have been wiped cleanly."
        }
    except Exception as e:
        logger.error(f"Error resetting user graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))
