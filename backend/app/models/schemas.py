from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ConceptNodeSchema(BaseModel):
    id: str
    label: str
    core_invariant: str
    jargon_blacklist: List[str] = Field(default_factory=list)
    is_hobby_anchor: bool = False
    position_x: float = 0.0
    position_y: float = 0.0
    chapter_id: Optional[str] = None
    p_mastery: Optional[float] = 0.15
    status: Optional[str] = "UNVERIFIED"

class CausalEdgeSchema(BaseModel):
    source: str
    target: str
    relationship_label: str
    is_cross_chapter: bool = False
    is_isomorphism_bridge: bool = False
    chapter_id: Optional[str] = None

class ChapterExtractionPayload(BaseModel):
    chapter_title: str
    subject: str
    concepts: List[ConceptNodeSchema]
    edges: List[CausalEdgeSchema]

class Tier2Option(BaseModel):
    option_id: str
    text: str
    is_correct: bool
    error_type: str = Field(description="'NONE', 'LOCAL_MISCONCEPTION', or 'UPSTREAM_INVARIANT_VIOLATION'")
    blame_node_id: Optional[str] = None
    misconception_label: Optional[str] = None

class TwoTierQuestionPayload(BaseModel):
    target_concept_id: str
    tier_1_scenario: str
    tier_1_options: List[str]
    tier_1_correct_index: int
    tier_2_justifications: List[Tier2Option]

class EvaluateSubmissionRequest(BaseModel):
    user_id: str
    concept_id: str
    tier_1_selected_index: int
    tier_2_selected_option_id: str
    free_text_explanation: Optional[str] = None

class MicroProbeSchema(BaseModel):
    probe_id: str
    blame_node_id: str
    question: str
    options: List[str]
    correct_index: int
    time_limit_seconds: int = 15

class EvaluationResponse(BaseModel):
    tier_1_passed: bool
    tier_2_passed: bool
    requires_anti_jargon_probe: bool = False
    flagged_word: Optional[str] = None
    time_limit_seconds: Optional[int] = None
    updated_p_mastery: float
    new_status: str
    rca_triggered: bool = False
    blame_node_id: Optional[str] = None
    micro_probe: Optional[Any] = None
    active_trace_path: Optional[List[str]] = None
    rca: Optional[Dict[str, Any]] = None
    bayesian_attribution: Optional[Dict[str, Any]] = None

class ProfileCreateRequest(BaseModel):
    email: str
    display_name: Optional[str] = None
    hobby_anchor: str = "Music Production"

class ProfileResponse(BaseModel):
    id: str
    email: str
    display_name: str
    hobby_anchor: str

class AntiJargonVerifyRequest(BaseModel):
    user_id: str
    concept_id: str
    student_explanation: str
    flagged_word: str

class AntiJargonVerifyResponse(BaseModel):
    passed: bool
    reason: str
    updated_p_mastery: float
    new_status: str

class RcaMicroProbeSubmitRequest(BaseModel):
    user_id: str
    current_concept_id: str
    blame_node_id: str
    selected_option_index: int
    correct_option_index: int

class RcaMicroProbeGradeResponse(BaseModel):
    confirmed_upstream_fault: bool
    trigger_ui_trace: bool
    blame_node_id: str
    active_trace_path: List[str]
    explanation: str

class ChatMessageRequest(BaseModel):
    user_id: str
    concept_id: str
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class ChatMessageResponse(BaseModel):
    reply: str
    concept_id: str
    hobby_anchor: str

class GraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    chapters: List[Dict[str, Any]]
    hobby_anchor: str
