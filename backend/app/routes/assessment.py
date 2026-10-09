import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Response, status
from app.models.schemas import (
    TwoTierQuestionPayload,
    Tier2Option,
    EvaluateSubmissionRequest,
    EvaluationResponse,
    AntiJargonVerifyRequest,
    AntiJargonVerifyResponse,
    RcaMicroProbeSubmitRequest,
    RcaMicroProbeGradeResponse,
    MicroProbeSchema
)
from app.db.supabase_client import db
from app.services.vector_store import vector_service
from app.services.llm_service import llm_service
from app.services.graph_engine import graph_engine
from app.services.bkt_engine import bkt_engine
from app.services.anti_jargon import anti_jargon_service
from app.services.rca_engine import rca_engine, run_agentic_rca

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assessment", tags=["Assessment"])

# In-memory question cache so we can evaluate options accurately against stored questions
_QUESTION_CACHE: Dict[str, TwoTierQuestionPayload] = {}

@router.get("/question/{concept_id}", response_model=TwoTierQuestionPayload)
async def get_two_tier_question(concept_id: str, user_id: Optional[str] = None):
    """
    Generates a rigorous two-tier Treagust diagnostic question for the target concept.
    Tier 1 tests prediction/phenomenon.
    Tier 2 tests mechanistic justification with literature-validated misconceptions
    and an UPSTREAM_INVARIANT_VIOLATION distractor pointing to an ancestor concept.
    """
    concept = db.get_concept(concept_id)
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    # Fetch context from Upstash Vector
    context_chunks = vector_service.query_concept_context(concept["label"], top_k=2)
    context_text = "\n".join(context_chunks) if context_chunks else concept["core_invariant"]

    # Fetch DAG ancestors
    ancestors = []
    if user_id:
        ancestors = graph_engine.get_ancestors_info(user_id, concept_id)
    elif concept.get("chapter_id"):
        # Fallback to ancestors in DB
        all_concepts = db.get_concepts_by_chapter(concept["chapter_id"])
        ancestors = [{"id": c["id"], "label": c["label"], "core_invariant": c["core_invariant"]} for c in all_concepts if c["id"] != concept_id and not c.get("is_hobby_anchor")]

    try:
        q_data = llm_service.generate_two_tier_diagnostic(
            concept_label=concept["label"],
            invariant=concept["core_invariant"],
            textbook_context=context_text,
            ancestor_nodes=ancestors
        )

        # Parse justifications
        raw_t2 = q_data.get("tier_2_justifications", [])
        parsed_t2 = []
        ancestor_ids = {a["id"] for a in ancestors}
        for item in raw_t2:
            blame_id = item.get("blame_node_id")
            err_type = item.get("error_type", "NONE")
            if err_type == "UPSTREAM_INVARIANT_VIOLATION":
                if not blame_id or blame_id not in ancestor_ids:
                    blame_id = ancestors[0]["id"] if ancestors else None
            parsed_t2.append(Tier2Option(
                option_id=item.get("option_id", f"opt_{len(parsed_t2)}"),
                text=item.get("text", ""),
                is_correct=item.get("is_correct", False),
                error_type=err_type,
                blame_node_id=blame_id,
                misconception_label=item.get("misconception_label")
            ))

        # Guarantee at least 1 correct and 1 upstream violation option if LLM missed it
        if not any(opt.is_correct for opt in parsed_t2):
            parsed_t2.append(Tier2Option(
                option_id="opt_correct_fallback",
                text=f"The mechanism follows {concept['core_invariant']}.",
                is_correct=True,
                error_type="NONE"
            ))

        if ancestors and not any(opt.error_type == "UPSTREAM_INVARIANT_VIOLATION" for opt in parsed_t2):
            blame = ancestors[0]
            parsed_t2.append(Tier2Option(
                option_id="opt_upstream_fallback",
                text=f"Because energy is created from the barrier rather than conserved in {blame['label']}.",
                is_correct=False,
                error_type="UPSTREAM_INVARIANT_VIOLATION",
                blame_node_id=blame["id"],
                misconception_label=f"Violation of {blame['label']} invariant"
            ))

        payload = TwoTierQuestionPayload(
            target_concept_id=concept_id,
            tier_1_scenario=q_data.get("tier_1_scenario", f"Predict the behavior when the driving potential across {concept['label']} increases."),
            tier_1_options=q_data.get("tier_1_options", ["It increases proportionally", "It decreases inversely", "It remains constant"]),
            tier_1_correct_index=q_data.get("tier_1_correct_index", 0),
            tier_2_justifications=parsed_t2
        )

        _QUESTION_CACHE[concept_id] = payload
        return payload
    except Exception as e:
        logger.error(f"Error generating question: {e}")
        # High quality fallback
        blame_id = ancestors[0]["id"] if ancestors else None
        blame_lbl = ancestors[0]["label"] if ancestors else "Upstream System"
        fallback = TwoTierQuestionPayload(
            target_concept_id=concept_id,
            tier_1_scenario=f"When the applied driving gradient across {concept['label']} is suddenly doubled, what happens to the steady-state throughput?",
            tier_1_options=[
                "Throughput doubles once terminal equilibrium is reached",
                "Throughput increases exponentially without limit",
                "Throughput drops to zero due to immediate lattice blockage"
            ],
            tier_1_correct_index=0,
            tier_2_justifications=[
                Tier2Option(
                    option_id="opt_correct",
                    text=f"Because acceleration continues until resistive drag balances the driving force: {concept['core_invariant']}.",
                    is_correct=True,
                    error_type="NONE"
                ),
                Tier2Option(
                    option_id="opt_upstream",
                    text=f"Because the upstream potential gradient acts as an inexhaustible source of infinite particle acceleration, ignoring conservation constraints.",
                    is_correct=False,
                    error_type="UPSTREAM_INVARIANT_VIOLATION",
                    blame_node_id=blame_id,
                    misconception_label=f"Upstream Invariant Violation of {blame_lbl}"
                ),
                Tier2Option(
                    option_id="opt_local",
                    text="Because electrons move with instantaneous speed equal to light speed inside the wire.",
                    is_correct=False,
                    error_type="LOCAL_MISCONCEPTION",
                    misconception_label="Speed of Light in Conductor Misconception"
                )
            ]
        )
        _QUESTION_CACHE[concept_id] = fallback
        return fallback

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_submission(req: EvaluateSubmissionRequest, response: Response):
    """
    Evaluates student's two-tier diagnostic submission:
    - Scans free_text_explanation for banned jargon nouns (triggers 45s timer if found)
    - Updates deterministic BKT mastery state
    - Triggers 3-Gate Root Cause Analysis if Tier 2 distractor is an upstream invariant violation
    """
    concept = db.get_concept(req.concept_id)
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    cached_q = _QUESTION_CACHE.get(req.concept_id)
    if not cached_q:
        # Re-fetch or build
        cached_q = await get_two_tier_question(req.concept_id, req.user_id)

    # 1. Check Anti-Jargon in Free-Text Explanation
    blacklist = concept.get("jargon_blacklist", [])
    if req.free_text_explanation:
        flagged = anti_jargon_service.scan_for_blacklisted_jargon(req.free_text_explanation, blacklist)
        if flagged:
            # Return HTTP 428 Precondition Required or structured JSON
            response.status_code = status.HTTP_428_PRECONDITION_REQUIRED
            epistemic = db.get_epistemic_state(req.user_id, req.concept_id)
            p_cur = epistemic.get("p_mastery", 0.15) if epistemic else 0.15
            st_cur = epistemic.get("status", "UNVERIFIED") if epistemic else "UNVERIFIED"
            return EvaluationResponse(
                tier_1_passed=False,
                tier_2_passed=False,
                requires_anti_jargon_probe=True,
                flagged_word=flagged,
                time_limit_seconds=45,
                updated_p_mastery=p_cur,
                new_status=st_cur,
                rca_triggered=False
            )

    # 2. Evaluate Tier 1 & Tier 2 correctness
    tier_1_passed = (req.tier_1_selected_index == cached_q.tier_1_correct_index)
    selected_option = next((opt for opt in cached_q.tier_2_justifications if opt.option_id == req.tier_2_selected_option_id), None)
    tier_2_passed = bool(selected_option and selected_option.is_correct)
    both_passed = tier_1_passed and tier_2_passed

    # 3. Deterministic BKT Update
    epistemic = db.get_epistemic_state(req.user_id, req.concept_id)
    p_prev = epistemic.get("p_mastery", 0.20) if epistemic else 0.20
    has_misconception = bool(not both_passed and selected_option and selected_option.error_type != "NONE")

    p_updated, new_status = bkt_engine.compute_update(
        p_prev=p_prev,
        is_correct=both_passed,
        has_misconception=has_misconception
    )

    # Persist in Supabase
    active_misconceptions = []
    if not both_passed and selected_option:
        active_misconceptions.append({
            "option_id": selected_option.option_id,
            "label": selected_option.misconception_label or "Causal Misconception",
            "error_type": selected_option.error_type,
            "blame_node_id": selected_option.blame_node_id
        })

    db.upsert_epistemic_state(
        user_id=req.user_id,
        concept_id=req.concept_id,
        p_mastery=p_updated,
        status=new_status,
        active_misconceptions=active_misconceptions
    )

    # 4. 3-Gate Agentic RCA Check
    kg = graph_engine.get_user_graph(req.user_id)
    user_priors = {s["concept_id"]: s["p_mastery"] for s in db.get_all_epistemic_states_for_user(req.user_id)}
    
    rca_result = run_agentic_rca(
        kg=kg,
        current_node_id=req.concept_id,
        selected_tier2_option=selected_option.model_dump() if selected_option else {},
        user_priors=user_priors
    )

    # Log assessment in Supabase
    db.log_assessment(
        user_id=req.user_id,
        concept_id=req.concept_id,
        tier_1_passed=tier_1_passed,
        tier_2_passed=tier_2_passed,
        selected_distractor_id=req.tier_2_selected_option_id,
        jargon_failed=False,
        rca_triggered=rca_result.rca_triggered,
        blame_node_id=rca_result.blame_node_id
    )

    # Invalidate cached question once evaluated to prevent repeat submissions
    _QUESTION_CACHE.pop(req.concept_id, None)

    return EvaluationResponse(
        tier_1_passed=tier_1_passed,
        tier_2_passed=tier_2_passed,
        requires_anti_jargon_probe=False,
        updated_p_mastery=p_updated,
        new_status=new_status,
        rca_triggered=rca_result.rca_triggered,
        blame_node_id=rca_result.blame_node_id,
        micro_probe=rca_result.micro_probe,
        active_trace_path=rca_result.path_node_ids,
        rca=rca_result.model_dump(),
        bayesian_attribution=rca_result.bayesian_attribution
    )

@router.post("/anti-jargon/verify", response_model=AntiJargonVerifyResponse)
async def verify_anti_jargon_explanation(req: AntiJargonVerifyRequest):
    """
    Evaluates the 45-second timed submission:
    Verifies that the student explained using mechanical/operational action verbs
    without using the banned vocabulary.
    """
    concept = db.get_concept(req.concept_id)
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    banned_words = concept.get("jargon_blacklist", [])
    if req.flagged_word and req.flagged_word not in banned_words:
        banned_words.append(req.flagged_word)

    eval_result = anti_jargon_service.verify_action_verbs(
        student_text=req.student_explanation,
        banned_words=banned_words,
        concept_invariant=concept["core_invariant"]
    )

    passed = eval_result.get("passed", False)
    reason = eval_result.get("reasoning", "")

    # Update BKT
    epistemic = db.get_epistemic_state(req.user_id, req.concept_id)
    p_prev = epistemic.get("p_mastery", 0.20) if epistemic else 0.20

    if passed:
        # Student successfully explained in plain action verbs without banned jargon
        p_updated = max(round(p_prev + 0.35, 4), 0.85)
        new_status = "MASTERED"
        active_misconceptions = []
    else:
        p_updated = min(p_prev, 0.40)
        new_status = "FRAGILE"
        active_misconceptions = [{"reason": "Failed 45s anti-jargon probe"}]

    db.upsert_epistemic_state(
        user_id=req.user_id,
        concept_id=req.concept_id,
        p_mastery=p_updated,
        status=new_status,
        active_misconceptions=active_misconceptions
    )

    return AntiJargonVerifyResponse(
        passed=passed,
        reason=reason,
        updated_p_mastery=p_updated,
        new_status=new_status
    )

@router.post("/rca/probe/grade", response_model=RcaMicroProbeGradeResponse)
async def grade_rca_micro_probe(req: RcaMicroProbeSubmitRequest):
    """
    Grades Gate 3 Zero-Context Invariant Micro-Probe:
    - If student fails: Issue confirmed with >95% certainty. Triggers red trace animation.
    - If student passes: Root cause rejected. Suppresses graph alarms.
    """
    student_passed = (req.selected_option_index == req.correct_option_index)
    confirmed, trigger_trace, trace_path, explanation = rca_engine.confirm_gate_3_result(
        user_id=req.user_id,
        current_node_id=req.current_concept_id,
        blame_node_id=req.blame_node_id,
        student_passed=student_passed
    )

    return RcaMicroProbeGradeResponse(
        confirmed_upstream_fault=confirmed,
        trigger_ui_trace=trigger_trace,
        blame_node_id=req.blame_node_id,
        active_trace_path=trace_path,
        explanation=explanation
    )
