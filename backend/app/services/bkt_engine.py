"""
Bayesian Knowledge Tracing (BKT) Mathematical Engine
Pure, deterministic Python implementation. No LLM estimation.
"""
from typing import Tuple

def determine_mastery_status(p_mastery: float, has_active_misconceptions: bool) -> str:
    """
    Standardized BKT mastery threshold rule across platform:
    - P(M) >= 0.75 => MASTERED (Green: #10b981)
    - P(M) <= 0.40 and has active misconceptions => FRAGILE (Amber: #f59e0b)
    - Otherwise => IN_PROGRESS (Slate: #6b7280)
    """
    if p_mastery >= 0.75:
        return "MASTERED"
    if p_mastery <= 0.40 and has_active_misconceptions:
        return "FRAGILE"
    return "IN_PROGRESS"

class BKTEngine:
    def __init__(
        self,
        p_l0: float = 0.20, # Prior probability of initial knowledge
        p_t: float = 0.15,  # Probability of transition from unlearned to learned
        p_g: float = 0.05,  # Probability of lucky guess (low due to two-tier requirement)
        p_s: float = 0.08   # Probability of slip
    ):
        self.P_L0 = p_l0
        self.P_T = p_t
        self.P_G = p_g
        self.P_S = p_s

    def compute_update(
        self,
        p_prev: float,
        is_correct: bool,
        has_misconception: bool = False
    ) -> Tuple[float, str]:
        """
        Computes Bayesian Knowledge Tracing update based on observation evidence.
        Returns (p_updated, status_string).
        """
        # Ensure prior is bounded in [0.001, 0.999]
        p_prev = max(0.001, min(0.999, p_prev))

        if is_correct:
            # P(L_t | correct) = (P(L_{t-1}) * (1 - P(S))) / [P(L_{t-1}) * (1 - P(S)) + (1 - P(L_{t-1})) * P(G)]
            numerator = p_prev * (1.0 - self.P_S)
            denominator = numerator + ((1.0 - p_prev) * self.P_G)
        else:
            # P(L_t | incorrect) = (P(L_{t-1}) * P(S)) / [P(L_{t-1}) * P(S) + (1 - P(L_{t-1})) * (1 - P(G))]
            numerator = p_prev * self.P_S
            denominator = numerator + ((1.0 - p_prev) * (1.0 - self.P_G))

        p_posterior = numerator / max(denominator, 1e-9)

        # Factor in learning transition
        # P(L_t) = P(L_t | evidence) + (1 - P(L_t | evidence)) * P(T)
        p_updated = p_posterior + ((1.0 - p_posterior) * self.P_T)
        p_updated = round(max(0.01, min(0.99, p_updated)), 4)

        # Standardized status evaluation
        status = determine_mastery_status(p_updated, has_misconception)

        return p_updated, status

bkt_engine = BKTEngine()
