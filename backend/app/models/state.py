from typing import TypedDict, Optional, List, Dict, Any

class DiagnosticState(TypedDict, total=False):
    user_id: str
    concept_id: str
    tier_1_selected_index: int
    tier_2_selected_option_id: str
    free_text_explanation: Optional[str]
    
    # Validation results
    tier_1_passed: bool
    tier_2_passed: bool
    selected_distractor: Optional[Dict[str, Any]]
    
    # Anti-jargon gate
    requires_anti_jargon: bool
    flagged_word: Optional[str]
    
    # BKT calculations
    current_p_mastery: float
    updated_p_mastery: float
    new_status: str
    
    # 3-Gate RCA results
    gate1_passed: bool # True if ancestor violation detected
    gate2_passed: bool # True if epistemic prior confirms fragility
    gate3_required: bool
    blame_node_id: Optional[str]
    micro_probe: Optional[Dict[str, Any]]
    active_trace_path: Optional[List[str]]
    rca_triggered: bool
    
    # Log trace
    logs: List[str]
