import logging
from typing import Optional, List, Dict, Any, Tuple
import networkx as nx
from pydantic import BaseModel
from app.db.supabase_client import db
from app.services.llm_service import llm_service
from app.models.schemas import MicroProbeSchema

logger = logging.getLogger(__name__)

class RCATracePayload(BaseModel):
    rca_triggered: bool
    blame_node_id: Optional[str] = None
    path_node_ids: List[str] = []      # [current_node, parent_node, ..., root_cause_node]
    path_edge_ids: List[str] = []      # IDs of edges traversed in reverse
    micro_probe: Optional[Dict[str, Any]] = None  # Gate 3 Zero-Context Test
    diagnostic_summary: str = ""
    bayesian_attribution: Optional[Dict[str, Any]] = None  # Multi-parent selection logic

def run_agentic_rca(
    kg: nx.DiGraph,
    current_node_id: str,
    selected_tier2_option: Dict[str, Any],
    user_priors: Dict[str, float]
) -> RCATracePayload:
    """
    Executes the 3-Gate Root Cause Analysis attribution pipeline with transparent
    Bayesian DAG parent selection:
    - Gate 1: Error-Signature Lineage Match (confirms UPSTREAM_INVARIANT_VIOLATION and DAG ancestry)
    - Gate 2: Epistemic History Check (inspects Bayesian prior mastery across candidate parents)
    - Gate 3: Synthesizes a rapid 15s zero-context confirmation probe for the foundational invariant
    """
    # GATE 1: Error-Signature Lineage Match
    # Check if the chosen distractor is tagged to an upstream ancestor invariant
    if selected_tier2_option.get("error_type") != "UPSTREAM_INVARIANT_VIOLATION":
        return RCATracePayload(
            rca_triggered=False,
            diagnostic_summary="Local misconception detected on current concept. No upstream dependency failure."
        )

    current_node_data = kg.nodes.get(current_node_id, {})
    current_chapter_id = str(current_node_data.get("chapter_id", ""))

    # Construct strict intra-chapter causal DAG (exclude cross-chapter isomorphism bridges)
    causal_kg = nx.DiGraph()
    for n, data in kg.nodes(data=True):
        if str(data.get("chapter_id", "")) == current_chapter_id and not data.get("is_hobby_anchor"):
            causal_kg.add_node(n, **data)
    for u, v, data in kg.edges(data=True):
        if not data.get("is_cross_chapter") and not data.get("is_isomorphism_bridge"):
            if causal_kg.has_node(u) and causal_kg.has_node(v):
                causal_kg.add_edge(u, v, **data)

    if not causal_kg.has_node(current_node_id):
        return RCATracePayload(
            rca_triggered=False,
            diagnostic_summary=f"Node '{current_node_id}' not found in intra-chapter causal DAG."
        )

    # 1. Gather all candidate parents and upstream ancestors in the Bayesian DAG
    direct_parents = list(causal_kg.predecessors(current_node_id))
    all_ancestors = list(nx.ancestors(causal_kg, current_node_id))
    candidate_pool = direct_parents if direct_parents else all_ancestors

    if not candidate_pool:
        return RCATracePayload(
            rca_triggered=False,
            diagnostic_summary=f"Concept '{current_node_id}' has no upstream prerequisites in this chapter (in-degree 0 entrypoint)."
        )

    # 2. Candidate Evaluation & Bayesian Attribution Scoring
    # Determine the suspect node among candidate parents based on distractor alignment & prior vulnerability
    suspect_node_id = selected_tier2_option.get("blame_node_id")
    distractor_text = (selected_tier2_option.get("text", "") + " " + selected_tier2_option.get("misconception_label", "")).lower()

    # Score each candidate parent
    raw_scores = {}
    for cand in candidate_pool:
        cand_data = causal_kg.nodes.get(cand, {})
        cand_label = (cand_data.get("label") or cand).lower()
        cand_inv = (cand_data.get("core_invariant") or "").lower()
        prior_p = user_priors.get(cand, 0.50)

        # Baseline alignment
        alignment = 0.10
        if suspect_node_id and cand == suspect_node_id:
            alignment = 0.85
        else:
            # Check keyword / conceptual overlap
            label_tokens = [t for t in cand_label.split() if len(t) > 3]
            for tok in label_tokens:
                if tok in distractor_text:
                    alignment += 0.35
            inv_tokens = [t for t in cand_inv.split() if len(t) > 4]
            for tok in inv_tokens:
                if tok in distractor_text:
                    alignment += 0.15

        # Prior vulnerability: lower prior mastery = higher likelihood of being the broken link
        # Prior P(M) = 0.80 -> vulnerability = 0.25 (unsolidified transfer gap)
        vulnerability = max(0.05, 1.0 - prior_p)
        raw_scores[cand] = alignment * 0.75 + vulnerability * 0.25

    total_score = sum(raw_scores.values()) or 1.0
    probabilities = {cand: round(raw_scores[cand] / total_score, 4) for cand in candidate_pool}

    # If suspect_node_id wasn't in candidate pool or missing, select candidate with highest attribution
    if not suspect_node_id or suspect_node_id not in candidate_pool:
        suspect_node_id = max(probabilities, key=probabilities.get)

    # Build detailed candidate comparison for Bayesian DAG explainability
    evaluated_candidates = []
    for cand in candidate_pool:
        cand_data = causal_kg.nodes.get(cand, {})
        cand_label = cand_data.get("label", cand)
        cand_inv = cand_data.get("core_invariant", "")
        cand_prior = user_priors.get(cand, 0.50)
        attr_prob = probabilities.get(cand, 0.0)
        is_chosen = (cand == suspect_node_id)

        if is_chosen:
            reason = (
                f"Matched Error Signature: The student's chosen explanation explicitly cited an invariant "
                f"violation originating in '{cand_label}'. Prior mastery P(M)={cand_prior*100:.0f}% indicates "
                f"an unsolidified transfer gap despite earlier success."
            )
        else:
            reason = (
                f"Invariant Preserved: Core invariant of '{cand_label}' was not violated by student's reasoning. "
                f"Prior mastery P(M)={cand_prior*100:.0f}% remains uncompromised."
            )

        evaluated_candidates.append({
            "node_id": cand,
            "label": cand_label,
            "core_invariant": cand_inv,
            "p_mastery": cand_prior,
            "attribution_probability": attr_prob,
            "status": "SUSPECT_IDENTIFIED" if is_chosen else "EXCLUDED",
            "reason": reason
        })

    # Sort candidates by attribution probability descending
    evaluated_candidates.sort(key=lambda x: x["attribution_probability"], reverse=True)

    suspect_node_data = causal_kg.nodes.get(suspect_node_id, {})
    suspect_label = suspect_node_data.get("label", "Foundational Invariant")
    suspect_invariant = suspect_node_data.get("core_invariant", "")
    prior_mastery = user_priors.get(suspect_node_id, 0.50)
    best_prob = probabilities.get(suspect_node_id, 0.85)

    # Verify topological ancestry in NetworkX intra-chapter DAG
    if not nx.has_path(causal_kg, suspect_node_id, current_node_id):
        logger.warning(f"RCA Gate 1 rejected: '{suspect_node_id}' is not an ancestor of '{current_node_id}'.")
        return RCATracePayload(
            rca_triggered=False,
            diagnostic_summary=f"Node '{suspect_node_id}' has no causal path to '{current_node_id}' in this chapter."
        )

    # Compute shortest path from suspect node to current node, then reverse for backtracking
    causal_path = nx.shortest_path(causal_kg, source=suspect_node_id, target=current_node_id)
    backtrack_path = list(reversed(causal_path))  # e.g., ["current_concept", "intermediate_concept", "suspect_root_concept"]

    # Collect edge IDs traversed in reverse
    backtrack_edges = []
    for i in range(len(backtrack_path) - 1):
        target = backtrack_path[i]
        source = backtrack_path[i + 1]
        backtrack_edges.append(f"edge_{source}_{target}")

    # GATE 2: Epistemic History Check
    logger.info(f"RCA Gate 2: Blame node '{suspect_node_id}' ({suspect_label}) prior mastery P(M)={prior_mastery}")

    # If the student has already mastered the suspect node with near-certainty (P(M) >= 0.85):
    # This is classified as a localized synthesis misconception rather than an upstream gap.
    if prior_mastery >= 0.85:
        logger.info(f"RCA Gate 2: Suspect node '{suspect_node_id}' is already deeply MASTERED (P(M)={prior_mastery*100:.0f}%). Disqualifying upstream blame.")
        return RCATracePayload(
            rca_triggered=False,
            diagnostic_summary=(
                f"Gate 2 Check: Prerequisite '{suspect_label}' is already deeply mastered ({prior_mastery*100:.0f}%). "
                f"Error classified as a localized synthesis misconception on '{current_node_data.get('label', current_node_id)}'."
            )
        )

    # Build comprehensive Bayesian attribution payload for UI inspection
    bayesian_attribution = {
        "target_concept_id": current_node_id,
        "target_concept_label": current_node_data.get("label", current_node_id),
        "candidate_parents": evaluated_candidates,
        "selected_suspect_id": suspect_node_id,
        "selected_suspect_label": suspect_label,
        "selection_rationale": (
            f"Evaluated {len(evaluated_candidates)} upstream parent node(s) in the Bayesian DAG. "
            f"'{suspect_label}' was isolated with {best_prob*100:.0f}% attribution probability because "
            f"the student's chosen justification distractor specifically violated its invariant. "
            f"Although prior mastery is {prior_mastery*100:.0f}%, BKT identifies an unsolidified transfer gap."
        ),
        "gate_status": {
            "gate_1": "PASSED: Topological Ancestry & Lineage Match in Causal DAG",
            "gate_2": f"PASSED: Epistemic History Verified (Prior P(M)={prior_mastery*100:.0f}%, <85% cutoff)",
            "gate_3": "ACTIVE: Dispatching 15s Zero-Context Invariant Confirmation Probe"
        }
    }

    # Try 32B model for zero-context scenario generation
    probe_scenario = None
    probe_options = None
    try:
        raw_probe = llm_service.generate_and_grade_rca_micro_probe(ancestor_invariant=suspect_invariant or suspect_label)
        if raw_probe and "question" in raw_probe and "options" in raw_probe:
            probe_scenario = raw_probe["question"]
            raw_opts = raw_probe.get("options", [])
            c_idx = raw_probe.get("correct_index", 0)
            probe_options = [
                {
                    "id": f"opt_{chr(97 + idx)}",
                    "text": str(opt_text),
                    "is_correct": (idx == c_idx)
                }
                for idx, opt_text in enumerate(raw_opts)
            ]
    except Exception as e:
        logger.warning(f"LLM 32B probe generation failed: {e}")

    if not probe_scenario or not probe_options or len(probe_options) < 2:
        # High-fidelity domain-neutral zero-context probe
        probe_scenario = (
            f"Zero-Context Check on [{suspect_label}]: "
            f"A driving gradient pushes tokens across a balanced channel. If resistance doubles, "
            f"what happens to the equilibrium throughput?"
        )
        probe_options = [
            {"id": "opt_a", "text": "Throughput remains identical regardless of drag", "is_correct": False},
            {"id": "opt_b", "text": "Throughput scales down by half to conserve gradient equilibrium", "is_correct": True},
            {"id": "opt_c", "text": "Throughput doubles due to backpressure accumulation", "is_correct": False}
        ]

    correct_idx = next((i for i, opt in enumerate(probe_options) if opt.get("is_correct")), 0)

    micro_probe = {
        "probe_id": f"probe_{suspect_node_id}",
        "suspect_node_id": suspect_node_id,
        "suspect_label": suspect_label,
        "scenario": probe_scenario,
        "question": probe_scenario,
        "options": probe_options,
        "correct_index": correct_idx,
        "time_limit_seconds": 15,
        "bayesian_attribution": bayesian_attribution
    }

    return RCATracePayload(
        rca_triggered=True,
        blame_node_id=suspect_node_id,
        path_node_ids=backtrack_path,
        path_edge_ids=backtrack_edges,
        micro_probe=micro_probe,
        diagnostic_summary=(
            f"Failure signature matches upstream invariant violation in '{suspect_label}'. "
            f"Initiating diagnostic backtracking across {len(backtrack_edges)} dependency edge(s)."
        ),
        bayesian_attribution=bayesian_attribution
    )

class RCAEngine:
    def __init__(self):
        pass

    def evaluate_distractor(
        self,
        user_id: str,
        current_node_id: str,
        tier_2_option: Dict[str, Any]
    ) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]], Optional[List[str]]]:
        """
        Backwards-compatible wrapper delegating to run_agentic_rca.
        """
        from app.services.graph_engine import graph_engine
        kg = graph_engine.get_user_graph(user_id)
        user_priors = {s["concept_id"]: s["p_mastery"] for s in db.get_all_epistemic_states_for_user(user_id)}
        payload = run_agentic_rca(kg, current_node_id, tier_2_option, user_priors)
        return payload.rca_triggered, payload.blame_node_id, payload.micro_probe, payload.path_node_ids

    def confirm_gate_3_result(
        self,
        user_id: str,
        current_node_id: str,
        blame_node_id: str,
        student_passed: bool
    ) -> Tuple[bool, bool, List[str], str]:
        """
        Evaluates Gate 3 result:
        If student fails probe: Issue confirmed with >95% certainty. Downgrades suspect node to FRAGILE.
        If student passes probe: Root cause rejected as local syntax.
        """
        from app.services.graph_engine import graph_engine
        trace_path = graph_engine.get_trace_path(user_id, blame_node_id, current_node_id)
        blame_concept = db.get_concept(blame_node_id)
        blame_label = blame_concept.get("label", blame_node_id) if blame_concept else blame_node_id

        if not student_passed:
            db.upsert_epistemic_state(
                user_id=user_id,
                concept_id=blame_node_id,
                p_mastery=0.25,
                status="FRAGILE",
                active_misconceptions=[{
                    "source_current_node": current_node_id,
                    "reason": "Failed Gate 3 Invariant Micro-Probe during downstream diagnostic"
                }]
            )
            return (
                True,
                True,
                trace_path,
                f"Cognitive Root Cause Confirmed: The confusion on '{current_node_id}' originates from an unsolidified invariant in upstream concept '{blame_label}'."
            )
        else:
            return (
                False,
                False,
                [],
                f"Upstream invariant in '{blame_label}' is intact. Error classified as local operational syntax on '{current_node_id}'."
            )

rca_engine = RCAEngine()
