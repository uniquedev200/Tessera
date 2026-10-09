import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from app.models.state import DiagnosticState
from app.db.supabase_client import db
from app.services.bkt_engine import bkt_engine
from app.services.anti_jargon import anti_jargon_service
from app.services.rca_engine import rca_engine
from app.models.schemas import EvaluationResponse, MicroProbeSchema

logger = logging.getLogger(__name__)

def node_validate_and_jargon_check(state: DiagnosticState) -> DiagnosticState:
    concept_id = state["concept_id"]
    concept = db.get_concept(concept_id) or {}
    blacklist = concept.get("jargon_blacklist", [])
    free_text = state.get("free_text_explanation")

    # Anti-jargon lexical scan
    if free_text:
        flagged = anti_jargon_service.scan_for_blacklisted_jargon(free_text, blacklist)
        if flagged:
            state["requires_anti_jargon"] = True
            state["flagged_word"] = flagged
            state["logs"] = state.get("logs", []) + [f"Anti-jargon triggered on word: '{flagged}'"]
            return state

    state["requires_anti_jargon"] = False
    return state

def node_bkt_update(state: DiagnosticState) -> DiagnosticState:
    user_id = state["user_id"]
    concept_id = state["concept_id"]
    tier_1_passed = state.get("tier_1_passed", False)
    tier_2_passed = state.get("tier_2_passed", False)
    both_passed = tier_1_passed and tier_2_passed

    # Fetch prior epistemic state
    epistemic = db.get_epistemic_state(user_id, concept_id)
    p_prev = epistemic.get("p_mastery", 0.20) if epistemic else 0.20
    distractor = state.get("selected_distractor", {})
    has_misconception = bool(distractor and not both_passed)

    # Deterministic BKT mathematical update
    p_updated, new_status = bkt_engine.compute_update(
        p_prev=p_prev,
        is_correct=both_passed,
        has_misconception=has_misconception
    )

    state["current_p_mastery"] = p_prev
    state["updated_p_mastery"] = p_updated
    state["new_status"] = new_status

    # Persist in Supabase
    misconceptions = []
    if not both_passed and distractor:
        misconceptions.append({
            "option_id": distractor.get("option_id"),
            "label": distractor.get("misconception_label", "Causal confusion"),
            "error_type": distractor.get("error_type")
        })

    db.upsert_epistemic_state(
        user_id=user_id,
        concept_id=concept_id,
        p_mastery=p_updated,
        status=new_status,
        active_misconceptions=misconceptions
    )

    state["logs"] = state.get("logs", []) + [
        f"BKT updated P(M) from {p_prev} to {p_updated}. Status: {new_status}"
    ]
    return state

def node_rca_evaluate(state: DiagnosticState) -> DiagnosticState:
    user_id = state["user_id"]
    concept_id = state["concept_id"]
    tier_2_passed = state.get("tier_2_passed", False)
    distractor = state.get("selected_distractor", {})

    if tier_2_passed or not distractor:
        state["rca_triggered"] = False
        return state

    # Run Gate 1 & Gate 2
    rca_trig, blame_id, probe, trace = rca_engine.evaluate_distractor(
        user_id=user_id,
        current_node_id=concept_id,
        tier_2_option=distractor
    )

    state["rca_triggered"] = rca_trig
    state["blame_node_id"] = blame_id
    state["micro_probe"] = probe.model_dump() if probe else None
    state["active_trace_path"] = trace

    # Log to Supabase assessment_logs
    db.log_assessment(
        user_id=user_id,
        concept_id=concept_id,
        tier_1_passed=state.get("tier_1_passed", False),
        tier_2_passed=tier_2_passed,
        selected_distractor_id=distractor.get("option_id"),
        jargon_failed=state.get("requires_anti_jargon", False),
        rca_triggered=rca_trig,
        blame_node_id=blame_id
    )

    return state

def route_after_jargon_check(state: DiagnosticState) -> str:
    if state.get("requires_anti_jargon", False):
        return END
    return "bkt_update"

# Build LangGraph workflow
workflow = StateGraph(DiagnosticState)
workflow.add_node("jargon_check", node_validate_and_jargon_check)
workflow.add_node("bkt_update", node_bkt_update)
workflow.add_node("rca_evaluate", node_rca_evaluate)

workflow.set_entry_point("jargon_check")
workflow.add_conditional_edges(
    "jargon_check",
    route_after_jargon_check,
    {
        END: END,
        "bkt_update": "bkt_update"
    }
)
workflow.add_edge("bkt_update", "rca_evaluate")
workflow.add_edge("rca_evaluate", END)

diagnostic_app = workflow.compile()
