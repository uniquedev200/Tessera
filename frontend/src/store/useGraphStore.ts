import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import {
  Profile,
  Chapter,
  ConceptNodeData,
  MicroProbe,
  TwoTierQuestionPayload,
  RCAStage,
  RCATracePayload,
} from '@/lib/types';
import { api } from '@/lib/api';
import { computeHierarchicalLayout } from '@/lib/layout';

export type ModalType = 
  | 'NONE' 
  | 'TWO_TIER' 
  | 'ANTI_JARGON' 
  | 'RCA_PROBE' 
  | 'RCA_MICRO_PROBE' 
  | 'RCA_VERDICT' 
  | 'ISOMORPHISM_CARD' 
  | 'UPLOAD_MODAL';

/**
 * Checks whether a concept node is unlocked in the Skill-Tree DAG.
 * Root concepts (in-degree 0) are always unlocked.
 * Advanced nodes are unlocked ONLY if every upstream prerequisite in this chapter has status === 'MASTERED'.
 */
export const isNodeUnlocked = (nodeId: string, nodes: Node[], edges: Edge[]): boolean => {
  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode || targetNode.type !== 'conceptPill') return true;

  // Find all direct upstream prerequisites within this chapter
  const prerequisiteEdges = edges.filter(
    (e) =>
      e.target === nodeId &&
      !e.data?.isBridge &&
      !e.data?.is_isomorphism_bridge &&
      e.type !== 'bridge' &&
      !e.data?.is_hobby_anchor &&
      !e.data?.isHobbyAnchor
  );

  // If in-degree is 0, node is an entrypoint and is always unlocked
  if (prerequisiteEdges.length === 0) return true;

  // Check if every prerequisite concept is MASTERED
  return prerequisiteEdges.every((edge) => {
    const parentNode = nodes.find((n) => n.id === edge.source);
    return parentNode?.data?.status === 'MASTERED';
  });
};

/**
 * Returns labels of missing prerequisite parent nodes that need to be MASTERED.
 */
export const getMissingPrerequisites = (nodeId: string, nodes: Node[], edges: Edge[]): string[] => {
  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode || targetNode.type !== 'conceptPill') return [];

  const prerequisiteEdges = edges.filter(
    (e) =>
      e.target === nodeId &&
      !e.data?.isBridge &&
      !e.data?.is_isomorphism_bridge &&
      e.type !== 'bridge' &&
      !e.data?.is_hobby_anchor &&
      !e.data?.isHobbyAnchor
  );

  const missing: string[] = [];
  prerequisiteEdges.forEach((edge) => {
    const parentNode = nodes.find((n) => n.id === edge.source);
    if (parentNode && parentNode.data?.status !== 'MASTERED') {
      missing.push((parentNode.data?.label as string) || parentNode.id);
    }
  });
  return missing;
};

interface GraphState {
  // Graph Canvas State
  nodes: Node[];
  edges: Edge[];
  chapters: Chapter[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Active Profile & Session
  userProfile: Profile | null;
  isHobbyRecalculating: boolean;
  hobbyRecalculatingStatus: string;
  setIsHobbyRecalculating: (val: boolean, status?: string) => void;

  // Modals & Inspection Drawer
  activeModal: ModalType;
  selectedConcept: ConceptNodeData | null;
  selectedNodeId: string | null;
  isDrawerOpen: boolean;

  // Anti-Jargon 45s State
  antiJargonFlaggedWord: string | null;
  antiJargonTimeLeft: number;

  // RCA Diagnostics State
  activeTracePath: string[]; // Nodes forming the red trace line
  currentMicroProbe: MicroProbe | null;
  rcaStage: RCAStage;
  rcaPathNodeIds: string[];
  rcaPathEdgeIds: string[];
  rcaSuspectNodeId: string | null;
  rcaMicroProbe: any | null;
  rcaSummary: string | null;
  rcaBayesianAttribution: any | null;

  // Isomorphism Real-World Artifact
  latestArtifact: { bridge_label: string; real_world_artifact: string } | null;

  // Questions cache
  currentQuestion: TwoTierQuestionPayload | null;

  // Actions
  setUserProfile: (profile: Profile | null) => void;
  initUserSession: () => Promise<Profile>;
  loadUserGraph: (userId: string) => Promise<void>;
  updateUserHobby: (newHobby: string) => Promise<void>;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setSelectedConcept: (concept: ConceptNodeData | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  openDrawer: (concept: ConceptNodeData) => void;
  closeDrawer: () => void;
  openTwoTier: (concept: ConceptNodeData) => void;
  closeModal: () => void;
  setActiveModal: (modal: ModalType) => void;
  setAntiJargon: (flaggedWord: string, timeLeft?: number) => void;
  tickAntiJargonTimer: () => void;
  setActiveTracePath: (path: string[]) => void;
  clearActiveTracePath: () => void;
  setCurrentMicroProbe: (probe: MicroProbe | null) => void;
  startRCAPipeline: (rcaPayload: any) => Promise<void>;
  submitMicroProbeAnswer: (isCorrect: boolean) => void;
  resetRCA: () => void;
  setLatestArtifact: (artifact: { bridge_label: string; real_world_artifact: string } | null) => void;
  setCurrentQuestion: (question: TwoTierQuestionPayload | null) => void;
  clearAllData: () => Promise<void>;
  startNewGuestSession: (hobbyAnchor?: string) => Promise<Profile>;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      chapters: [],
      isLoading: false,
      isInitialized: false,
      error: null,
      userProfile: null,
      isHobbyRecalculating: false,
      hobbyRecalculatingStatus: '',
      setIsHobbyRecalculating: (val, status = '') => set({ isHobbyRecalculating: val, hobbyRecalculatingStatus: status }),

      activeModal: 'NONE',
      selectedConcept: null,
      selectedNodeId: null,
      isDrawerOpen: false,

      antiJargonFlaggedWord: null,
      antiJargonTimeLeft: 45,

      activeTracePath: [],
      currentMicroProbe: null,
      rcaStage: 'IDLE',
      rcaPathNodeIds: [],
      rcaPathEdgeIds: [],
      rcaSuspectNodeId: null,
      rcaMicroProbe: null,
      rcaSummary: null,
      rcaBayesianAttribution: null,
      latestArtifact: null,
      currentQuestion: null,

      setUserProfile: (profile) => set({ userProfile: profile }),

      startNewGuestSession: async (hobbyAnchor = 'Music Production') => {
        set({
          isLoading: true,
          nodes: [],
          edges: [],
          chapters: [],
          selectedConcept: null,
          selectedNodeId: null,
          isDrawerOpen: false,
          activeModal: 'NONE',
          currentMicroProbe: null,
          antiJargonFlaggedWord: null,
          rcaStage: 'IDLE',
          rcaPathNodeIds: [],
          rcaPathEdgeIds: [],
          rcaSuspectNodeId: null,
          rcaMicroProbe: null,
          rcaSummary: null,
          rcaBayesianAttribution: null,
          activeTracePath: [],
          latestArtifact: null,
          userProfile: null,
        });

        let newProfile: Profile;
        try {
          newProfile = await api.createGuestProfile(hobbyAnchor);
        } catch {
          const guestId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);
          newProfile = await api.createProfile(`guest_${guestId}@tessera.edu`, `Learner #${guestId.slice(0, 4).toUpperCase()}`, hobbyAnchor);
        }

        set({ userProfile: newProfile });

        try {
          await api.seedSampleChapter(newProfile.id, 1, newProfile.hobby_anchor || hobbyAnchor);
        } catch (e) {
          console.warn('Initial sample chapter seeding failed:', e);
        }

        await get().loadUserGraph(newProfile.id);
        set({ isLoading: false, isInitialized: true });
        return newProfile;
      },

      initUserSession: async () => {
        let profile = get().userProfile;

        // Invalidate legacy test profile (student@forgehacks.edu or any forgehacks test account)
        const isLegacyTestProfile =
          profile?.email === 'student@forgehacks.edu' ||
          Boolean(profile?.email && profile.email.includes('forgehacks'));

        if (isLegacyTestProfile || !profile?.id) {
          return await get().startNewGuestSession(profile?.hobby_anchor || 'Music Production');
        }

        // If we already have a valid isolated guest profile with a valid ID
        if (profile?.id) {
          if (get().chapters.length === 0) {
            await get().loadUserGraph(profile.id);
            // If user has no chapters yet, seed Sample Chapter 1
            if (get().chapters.length === 0) {
              try {
                await api.seedSampleChapter(profile.id, 1, profile.hobby_anchor || 'Music Production');
                await get().loadUserGraph(profile.id);
              } catch (e) {
                console.warn('Initial sample chapter seeding failed:', e);
              }
            }
          }
          return profile;
        }

        return await get().startNewGuestSession('Music Production');
      },

      loadUserGraph: async (userId: string) => {
        // Only trigger heavy loading indicator if we don't already have chapters cached
        const hasCachedChapters = get().chapters.length > 0;
        if (!hasCachedChapters) {
          set({ isLoading: true, error: null });
        } else {
          set({ error: null });
        }
        try {
          const graphData = await api.getUserGraph(userId);
          const rawNodes = graphData.nodes || [];
          const rawEdges = graphData.edges || [];
          const { nodes: layoutedNodes, edges: layoutedEdges } = computeHierarchicalLayout(rawNodes, rawEdges);

          const existingProfile = get().userProfile;
          const updatedProfile = existingProfile
            ? {
                ...existingProfile,
                hobby_anchor: graphData.hobby_anchor || existingProfile.hobby_anchor,
              }
            : {
                id: userId,
                email: `guest_${userId.slice(0, 8)}@tessera.edu`,
                display_name: 'Learner',
                hobby_anchor: graphData.hobby_anchor || 'Music Production',
                created_at: new Date().toISOString(),
              };

          const currentSelected = get().selectedConcept;
          let refreshedSelected = currentSelected;
          if (currentSelected) {
            const foundNode = layoutedNodes.find((n) => n.id === currentSelected.id);
            if (foundNode && foundNode.data) {
              refreshedSelected = (foundNode.data as unknown) as ConceptNodeData;
            }
          }

          // Preserve RCA suspect marker across reloads
          const activeSuspectId = get().rcaSuspectNodeId;
          const reconciledNodes = layoutedNodes.map((n) => {
            const hasRcaFault = (n.data as any)?.active_misconceptions?.some(
              (m: any) => m.source_current_node || (m.reason && String(m.reason).includes('Gate 3'))
            );
            if (hasRcaFault || (activeSuspectId && n.id === activeSuspectId)) {
              return {
                ...n,
                data: {
                  ...n.data,
                  status: 'FRAGILE',
                  isRootCauseSuspect: true,
                },
              };
            }
            return n;
          });

          set({
            nodes: reconciledNodes,
            edges: layoutedEdges,
            chapters: graphData.chapters || [],
            userProfile: updatedProfile,
            selectedConcept: refreshedSelected,
            isLoading: false,
            isInitialized: true,
          });
        } catch (err: any) {
          set({ error: err.message || 'Failed to load graph', isLoading: false, isInitialized: true });
        }
      },

  updateUserHobby: async (newHobby: string) => {
    const { userProfile, nodes, chapters } = get();
    const userId = userProfile?.id;
    if (!userId) return;

    // Immediately trigger background switch & Bauhaus loading symbol
    set({
      userProfile: { ...userProfile, hobby_anchor: newHobby },
      isHobbyRecalculating: true,
      hobbyRecalculatingStatus: `Grounding Epistemic DAG into ${newHobby}...`,
    });

    const isFirstTime = chapters.length === 0;
    const startTime = Date.now();

    try {
      if (isFirstTime) {
        // First-time selection: show the background cleanly for ~1 second before revealing panes
        await new Promise((r) => setTimeout(r, 1000));
        set({ isHobbyRecalculating: false });
        return;
      }

      const res = await api.updateHobby(userId, newHobby);
      if (res.status === 'ok') {
        const updatedMap = new Map(
          (res.updated_nodes || []).map((n: any) => [n.id, n.hobby_analogy])
        );

        const currentSelected = get().selectedConcept;
        let updatedSelected = currentSelected;
        if (currentSelected) {
          const newAnalogy = updatedMap.get(currentSelected.id);
          if (newAnalogy) {
            updatedSelected = {
              ...currentSelected,
              hobby_analogy: newAnalogy,
              hobbyAnalogy: newAnalogy,
            };
          }
        }

        const updatedNodes = nodes.map((n) => {
          if (n.type === 'conceptPill') {
            const updatedAnalogy = updatedMap.get(n.id);
            if (updatedAnalogy) {
              return {
                ...n,
                data: {
                  ...n.data,
                  hobbyAnalogy: updatedAnalogy,
                  hobby_analogy: updatedAnalogy,
                },
              };
            }
          }
          if (n.type === 'hobbyAnchor' || n.data?.is_hobby_anchor || n.data?.isHobbyAnchor) {
            return {
              ...n,
              data: {
                ...n.data,
                label: `${newHobby} Cognitive Anchor`,
                core_invariant: `Primary cognitive grounding in ${newHobby}`,
                coreInvariant: `Primary cognitive grounding in ${newHobby}`,
              },
            };
          }
          return n;
        });

        // Ensure user sees the clean background & Bauhaus indicator for at least 1s
        const elapsed = Date.now() - startTime;
        if (elapsed < 1100) {
          await new Promise((r) => setTimeout(r, 1100 - elapsed));
        }

        set({
          userProfile: { ...userProfile, hobby_anchor: newHobby },
          selectedConcept: updatedSelected,
          nodes: updatedNodes,
          isHobbyRecalculating: false,
        });
      } else {
        set({ isHobbyRecalculating: false });
      }
    } catch (err: any) {
      console.error('Failed to hot-swap hobby anchor:', err);
      set({ isHobbyRecalculating: false });
    }
  },

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  setSelectedConcept: (concept) =>
    set({ selectedConcept: concept, selectedNodeId: concept ? concept.id : null }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  openDrawer: (concept) =>
    set({ selectedConcept: concept, selectedNodeId: concept.id, isDrawerOpen: true }),

  closeDrawer: () => set({ isDrawerOpen: false, selectedNodeId: null }),

  openTwoTier: (concept) => {
    set({
      selectedConcept: concept,
      selectedNodeId: concept.id,
      activeModal: 'TWO_TIER',
      isDrawerOpen: false,
    });
  },

  closeModal: () => {
    set({
      activeModal: 'NONE',
      currentMicroProbe: null,
      antiJargonFlaggedWord: null,
      antiJargonTimeLeft: 45,
      currentQuestion: null,
    });
  },

  setActiveModal: (modal) => set({ activeModal: modal }),

  setAntiJargon: (flaggedWord, timeLeft = 45) =>
    set({
      activeModal: 'ANTI_JARGON',
      antiJargonFlaggedWord: flaggedWord,
      antiJargonTimeLeft: timeLeft,
    }),

  tickAntiJargonTimer: () =>
    set((state) => ({
      antiJargonTimeLeft: Math.max(0, state.antiJargonTimeLeft - 1),
    })),

  setActiveTracePath: (path) => set({ activeTracePath: path }),

  clearActiveTracePath: () => set({ activeTracePath: [] }),

  setCurrentMicroProbe: (probe) =>
    set({
      currentMicroProbe: probe,
      activeModal: probe ? 'RCA_PROBE' : 'NONE',
    }),

  startRCAPipeline: async (rcaPayload: any) => {
    if (!rcaPayload || !rcaPayload.rca_triggered) {
      set({ rcaStage: 'IDLE' });
      return;
    }

    // Step 1: Close Two-Tier Modal & Begin Reverse Trace
    set({
      activeModal: 'NONE',
      rcaStage: 'TRACING_BACKWARDS',
      rcaPathNodeIds: rcaPayload.path_node_ids || [],
      rcaPathEdgeIds: rcaPayload.path_edge_ids || [],
      rcaSuspectNodeId: rcaPayload.blame_node_id || null,
      rcaMicroProbe: rcaPayload.micro_probe || null,
      rcaSummary: rcaPayload.diagnostic_summary || null,
      rcaBayesianAttribution:
        rcaPayload.bayesian_attribution ||
        rcaPayload.micro_probe?.bayesian_attribution ||
        null,
      activeTracePath: rcaPayload.path_node_ids || [],
    });

    // Step 2: Allow the reverse trace animation to run across the screen for 2.2 seconds
    await new Promise((r) => setTimeout(r, 2200));

    // Step 3: Lock on Target & Prompt Micro-Probe
    set({
      rcaStage: 'TARGET_LOCKED',
    });

    await new Promise((r) => setTimeout(r, 800));

    // Step 4: Open 15-Second Gate 3 Micro-Probe Modal
    set({
      rcaStage: 'MICRO_PROBE_ACTIVE',
      activeModal: 'RCA_MICRO_PROBE',
    });
  },

  submitMicroProbeAnswer: async (isCorrect: boolean) => {
    const { rcaSuspectNodeId, selectedConcept, userProfile, nodes, rcaMicroProbe } = get();

    if (!isCorrect) {
      // ROOT CAUSE CONFIRMED: Upstream foundation is broken!
      set({
        rcaStage: 'ROOT_CAUSE_CONFIRMED',
        activeModal: 'RCA_VERDICT',
        // Mark the suspect ancestor node as FRAGILE with an active root cause badge
        nodes: nodes.map((n) =>
          n.id === rcaSuspectNodeId
            ? { ...n, data: { ...n.data, status: 'FRAGILE', isRootCauseSuspect: true } }
            : n
        ),
      });

      // Persist Gate 3 failure and active misconception to Supabase
      if (userProfile?.id && rcaSuspectNodeId && selectedConcept?.id) {
        try {
          await api.gradeRcaProbe({
            user_id: userProfile.id,
            current_concept_id: selectedConcept.id,
            blame_node_id: rcaSuspectNodeId,
            selected_option_index: -1,
            correct_option_index: rcaMicroProbe?.correct_index ?? 0,
          });
        } catch (e) {
          console.error('Failed to persist Gate 3 failure to DB:', e);
        }
      }
    } else {
      // REJECTED: Upstream foundation intact; error was local syntax
      set({
        rcaStage: 'ROOT_CAUSE_REJECTED',
        activeModal: 'RCA_VERDICT',
        rcaPathNodeIds: [],
        rcaPathEdgeIds: [],
        activeTracePath: [],
      });

      // Persist Gate 3 pass to Supabase
      if (userProfile?.id && rcaSuspectNodeId && selectedConcept?.id) {
        try {
          await api.gradeRcaProbe({
            user_id: userProfile.id,
            current_concept_id: selectedConcept.id,
            blame_node_id: rcaSuspectNodeId,
            selected_option_index: rcaMicroProbe?.correct_index ?? 0,
            correct_option_index: rcaMicroProbe?.correct_index ?? 0,
          });
        } catch (e) {
          console.error('Failed to persist Gate 3 pass to DB:', e);
        }
      }
    }
  },

  resetRCA: () => {
    set({
      rcaStage: 'IDLE',
      rcaPathNodeIds: [],
      rcaPathEdgeIds: [],
      rcaSuspectNodeId: null,
      rcaMicroProbe: null,
      rcaSummary: null,
      rcaBayesianAttribution: null,
      activeModal: 'NONE',
    });
  },

  setLatestArtifact: (artifact) =>
    set({
      latestArtifact: artifact,
      activeModal: artifact ? 'ISOMORPHISM_CARD' : get().activeModal,
    }),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),

  clearAllData: async () => {
    const profile = get().userProfile;
    if (profile?.id) {
      set({ isLoading: true });
      try {
        await api.resetUserGraph(profile.id);
        set({
          nodes: [],
          edges: [],
          chapters: [],
          activeTracePath: [],
          selectedConcept: null,
          selectedNodeId: null,
          isDrawerOpen: false,
          activeModal: 'NONE',
          currentMicroProbe: null,
          antiJargonFlaggedWord: null,
          latestArtifact: null,
          isLoading: false,
          isInitialized: true,
        });
      } catch (err: any) {
        set({ error: err.message, isLoading: false, isInitialized: true });
      }
    }
  },
    }),
    {
      name: 'tessera-graph-store',
      partialize: (state) => ({
        userProfile: state.userProfile,
        chapters: state.chapters,
        nodes: state.nodes,
        edges: state.edges,
        isInitialized: state.isInitialized,
        rcaStage: state.rcaStage,
        rcaSuspectNodeId: state.rcaSuspectNodeId,
        rcaPathNodeIds: state.rcaPathNodeIds,
        rcaPathEdgeIds: state.rcaPathEdgeIds,
        rcaMicroProbe: state.rcaMicroProbe,
        rcaSummary: state.rcaSummary,
        rcaBayesianAttribution: state.rcaBayesianAttribution,
        activeTracePath: state.activeTracePath,
      }),
    }
  )
);

