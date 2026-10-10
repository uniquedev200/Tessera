import {
  Profile,
  TwoTierQuestionPayload,
  EvaluationResponse,
  AntiJargonVerifyResponse,
  RcaMicroProbeGradeResponse,
  ChatMessage
} from './types';

const rawBase = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:8000`)
  : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000');
const API_BASE = rawBase.replace(/\/+$/, '');

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  // Handle 428 Precondition Required (Anti-jargon interrupt)
  if (response.status === 428) {
    const errorData = await response.json();
    return errorData as T;
  }

  if (!response.ok) {
    let errorDetail = 'API Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Profile / Onboarding
  async createProfile(email: string, displayName?: string, hobbyAnchor: string = 'Music Production'): Promise<Profile> {
    return fetchJson<Profile>('/api/onboarding/profile', {
      method: 'POST',
      body: JSON.stringify({ email, display_name: displayName, hobby_anchor: hobbyAnchor }),
    });
  },

  async createGuestProfile(hobbyAnchor: string = 'Music Production'): Promise<Profile> {
    return fetchJson<Profile>('/api/onboarding/guest', {
      method: 'POST',
      body: JSON.stringify({ hobby_anchor: hobbyAnchor }),
    });
  },

  async createOrGetDeviceProfile(deviceId: string, hobbyAnchor: string = 'Music Production'): Promise<Profile> {
    return fetchJson<Profile>('/api/onboarding/device', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, hobby_anchor: hobbyAnchor }),
    });
  },

  async updateHobby(userId: string, hobbyAnchor: string): Promise<{ status: string; updated_count?: number; updated_nodes?: any[] }> {
    return fetchJson('/api/user/hobby', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, new_hobby: hobbyAnchor }),
    });
  },

  // Graph Canvas
  async getUserGraph(userId: string): Promise<{ nodes: any[]; edges: any[]; chapters: any[]; hobby_anchor: string }> {
    return fetchJson(`/api/graph/user/${userId}`);
  },

  async discoverBridges(userId: string): Promise<{ discovered_bridges: any[] }> {
    return fetchJson('/api/graph/bridges/discover', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  async resetUserGraph(userId: string): Promise<{ status: string; message: string }> {
    return fetchJson(`/api/graph/user/${userId}/reset`, {
      method: 'POST',
    });
  },

  // Chapter Ingestion
  async uploadChapter(formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE}/api/chapters/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return response.json();
  },

  async seedSampleChapter(userId: string, sampleId: number, hobbyAnchor: string): Promise<any> {
    return fetchJson('/api/chapters/sample', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, sample_id: sampleId, hobby_anchor: hobbyAnchor }),
    });
  },

  // Diagnostics & Assessments
  async getQuestion(conceptId: string, userId: string): Promise<TwoTierQuestionPayload> {
    return fetchJson<TwoTierQuestionPayload>(`/api/assessment/question/${conceptId}?user_id=${userId}`);
  },

  async evaluateSubmission(data: {
    user_id: string;
    concept_id: string;
    tier_1_selected_index: number;
    tier_2_selected_option_id: string;
    free_text_explanation?: string;
  }): Promise<EvaluationResponse> {
    return fetchJson<EvaluationResponse>('/api/assessment/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyAntiJargon(data: {
    user_id: string;
    concept_id: string;
    student_explanation: string;
    flagged_word: string;
  }): Promise<AntiJargonVerifyResponse> {
    return fetchJson<AntiJargonVerifyResponse>('/api/assessment/anti-jargon/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async gradeRcaProbe(data: {
    user_id: string;
    current_concept_id: string;
    blame_node_id: string;
    selected_option_index: number;
    correct_option_index: number;
  }): Promise<RcaMicroProbeGradeResponse> {
    return fetchJson<RcaMicroProbeGradeResponse>('/api/assessment/rca/probe/grade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Socratic Chat Drawer
  async sendChatMessage(data: {
    user_id: string;
    concept_id: string;
    message: string;
    conversation_history?: ChatMessage[];
  }): Promise<{ reply: string; concept_id: string; hobby_anchor: string }> {
    return fetchJson('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
