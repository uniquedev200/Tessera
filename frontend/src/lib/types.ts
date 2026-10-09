export interface Profile {
  id: string;
  email: string;
  display_name: string;
  hobby_anchor: string;
}

export interface Chapter {
  id: string;
  user_id?: string;
  title: string;
  subject: string;
  order_index: number;
  created_at?: string;
}

export interface ConceptNodeData {
  id: string;
  label: string;
  core_invariant: string;
  coreInvariant?: string;
  jargon_blacklist: string[];
  is_hobby_anchor: boolean;
  isHobbyAnchor?: boolean;
  chapter_id?: string;
  chapterId?: string;
  chapter_title?: string;
  chapterTitle?: string;
  hobby_analogy?: string;
  hobbyAnalogy?: string;
  p_mastery: number;
  pMastery?: number;
  status: 'UNVERIFIED' | 'IN_PROGRESS' | 'FRAGILE' | 'MASTERED';
  isSelected?: boolean;
  isNeighbor?: boolean;
  isRootCauseSuspect?: boolean;
  active_misconceptions?: Array<{
    option_id?: string;
    label?: string;
    error_type?: string;
    blame_node_id?: string;
    reason?: string;
  }>;
}

export type RCAStage = 
  | 'IDLE'
  | 'TRACING_BACKWARDS'   // Animated laser/pulse running up the DAG
  | 'TARGET_LOCKED'        // Camera centered on suspect node, warning ring pulsing
  | 'MICRO_PROBE_ACTIVE'   // 15s Zero-Context test modal open
  | 'ROOT_CAUSE_CONFIRMED' // Confirmed bug locked in graph with persistent red trace
  | 'ROOT_CAUSE_REJECTED'; // Foundational concept was fine; local misunderstanding only

export interface RCAMicroProbeOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface RCAMicroProbe {
  probe_id?: string;
  suspect_node_id: string;
  suspect_label: string;
  scenario?: string;
  question?: string;
  options: (RCAMicroProbeOption | string)[];
  correct_index?: number;
  time_limit_seconds?: number;
  bayesian_attribution?: any;
}

export interface RCATracePayload {
  rca_triggered: boolean;
  blame_node_id?: string;
  path_node_ids: string[];
  path_edge_ids: string[];
  micro_probe?: RCAMicroProbe;
  diagnostic_summary?: string;
  bayesian_attribution?: any;
}

export interface Tier2Option {
  option_id: string;
  text: string;
  is_correct: boolean;
  error_type: 'NONE' | 'LOCAL_MISCONCEPTION' | 'UPSTREAM_INVARIANT_VIOLATION';
  blame_node_id?: string;
  misconception_label?: string;
}

export interface TwoTierQuestionPayload {
  target_concept_id: string;
  tier_1_scenario: string;
  tier_1_options: string[];
  tier_1_correct_index: number;
  tier_2_justifications: Tier2Option[];
}

export interface MicroProbe {
  probe_id: string;
  blame_node_id: string;
  question: string;
  options: string[];
  correct_index: number;
  time_limit_seconds: number;
  bayesian_attribution?: any;
}

export interface EvaluationResponse {
  tier_1_passed: boolean;
  tier_2_passed: boolean;
  requires_anti_jargon_probe: boolean;
  flagged_word?: string;
  time_limit_seconds?: number;
  updated_p_mastery: number;
  new_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'FRAGILE' | 'MASTERED';
  rca_triggered: boolean;
  blame_node_id?: string;
  micro_probe?: any;
  active_trace_path?: string[];
  rca?: RCATracePayload;
  bayesian_attribution?: any;
}

export interface AntiJargonVerifyResponse {
  passed: boolean;
  reason: string;
  updated_p_mastery: number;
  new_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'FRAGILE' | 'MASTERED';
}

export interface RcaMicroProbeGradeResponse {
  confirmed_upstream_fault: boolean;
  trigger_ui_trace: boolean;
  blame_node_id: string;
  active_trace_path: string[];
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DiscoveredBridge {
  source_node_id: string;
  target_node_id: string;
  relationship_label: string;
  real_world_artifact?: string;
}
