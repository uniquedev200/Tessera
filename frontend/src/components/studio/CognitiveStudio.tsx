'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import {
  BrainCircuit,
  Compass,
  Upload,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Maximize2,
  Minimize2,
  Crosshair,
  BookOpen,
  MessageSquare,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Send,
  Bot,
  User,
  Plus,
  Zap,
  ChevronRight,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { ConceptCanvas } from '@/components/canvas/ConceptCanvas';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { ChapterUploadZone } from '@/components/upload/ChapterUploadZone';
import { TwoTierModal } from '@/components/modals/TwoTierModal';
import { AntiJargonCountdownModal } from '@/components/modals/AntiJargonCountdownModal';
import { RcaMicroProbeModal } from '@/components/modals/RcaMicroProbeModal';
import { RcaVerdictModal } from '@/components/modals/RcaVerdictModal';
import { IsomorphismCardModal } from '@/components/modals/IsomorphismCardModal';
import { useGraphStore, isNodeUnlocked, getMissingPrerequisites } from '@/store/useGraphStore';
import { api } from '@/lib/api';
import { ConceptNodeData, ChatMessage } from '@/lib/types';
import { useRotatingMessages } from '@/lib/useRotatingMessages';

type HubTab = 'inspector' | 'syllabus' | 'chat';

function FormattedAssistantMessage({ content }: { content: string }) {
  // Separate explanation body from the verified citations block
  const citationSplit = content.split(/📚\s*\*\*Verified Sources:\*\*|📚\s*Verified Sources:/i);
  const mainBody = citationSplit[0].trim();
  const rawCitations = citationSplit.length > 1 ? citationSplit[1].trim() : '';

  // Extract individual citations
  const citationLines = rawCitations
    ? rawCitations
        .split('\n')
        .map((l) => l.replace(/^[•\-\*]\s*/, '').replace(/^\[Source:\s*/i, '').replace(/\]$/, '').trim())
        .filter((l) => l.length > 0)
    : [];

  const paragraphs = mainBody.split('\n\n');

  return (
    <div className="space-y-2.5">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              // Check if bullet point
              const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
              const cleanLine = isBullet ? trimmed.replace(/^[•\-\*]\s*/, '') : trimmed;

              // Format bold segments (**...**)
              const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
              const formattedContent = parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={partIdx} className="font-bold text-bauhaus-ink">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={partIdx}>{part}</span>;
              });

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start space-x-2 pl-2">
                    <span className="text-bauhaus-blue font-bold select-none">•</span>
                    <div className="flex-1">{formattedContent}</div>
                  </div>
                );
              }

              return <p key={lIdx}>{formattedContent}</p>;
            })}
          </div>
        );
      })}

      {citationLines.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-bauhaus-ink/20">
          <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold text-bauhaus-blue mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-bauhaus-blue" />
            <span>Verified Sources</span>
          </div>
          <div className="space-y-1">
            {citationLines.map((cit, cIdx) => (
              <div
                key={cIdx}
                className="text-[10px] font-mono bg-bauhaus-blue/5 border border-bauhaus-blue/25 rounded-lg px-2.5 py-1 text-bauhaus-ink flex items-center space-x-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-bauhaus-blue shrink-0" />
                <span className="truncate">{cit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CognitiveStudioInner() {
  const {
    userProfile,
    setUserProfile,
    initUserSession,
    nodes,
    edges,
    chapters,
    loadUserGraph,
    clearAllData,
    isLoading,
    isInitialized,
    isHobbyRecalculating,
    hobbyRecalculatingStatus,
    selectedConcept,
    selectedNodeId,
    setSelectedConcept,
    setSelectedNodeId,
    openTwoTier,
    setLatestArtifact,
  } = useGraphStore();

  const reactFlow = useReactFlow();

  // Layout & UI states
  const [isMaximized, setIsMaximized] = useState(false);
  const [mobileView, setMobileView] = useState<'canvas' | 'hub'>('canvas');
  const [activeTab, setActiveTab] = useState<HubTab>('inspector');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  // Socratic Chat tab state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch default student profile on load
  useEffect(() => {
    initUserSession();
  }, [initUserSession]);

  // When a concept node is clicked, automatically switch Hub to the inspector tab
  useEffect(() => {
    if (selectedConcept) {
      setActiveTab('inspector');
    }
  }, [selectedConcept]);

  // Scroll chat to bottom when messages arrive
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Live epistemic metrics
  const conceptNodes = useMemo(() => nodes.filter((n) => n.type === 'conceptPill'), [nodes]);
  const masteredCount = useMemo(() => conceptNodes.filter((n) => n.data?.status === 'MASTERED').length, [conceptNodes]);
  const fragileCount = useMemo(() => conceptNodes.filter((n) => n.data?.status === 'FRAGILE').length, [conceptNodes]);
  const unverifiedCount = useMemo(() => conceptNodes.filter((n) => n.data?.status !== 'MASTERED' && n.data?.status !== 'FRAGILE').length, [conceptNodes]);

  const activeHobby = userProfile?.hobby_anchor || 'Music Production';

  // Dynamic rotating status text for background task feedback
  const hobbyRotatingText = useRotatingMessages(
    useMemo(
      () => [
        `Anchoring causal invariants into ${activeHobby}...`,
        `Synthesizing cross-domain physical analogies...`,
        `Recalibrating topological knowledge graph...`,
        `Re-grounding cognitive entrypoint nodes...`,
        `Updating Bayesian prior distributions...`,
      ],
      [activeHobby]
    ),
    1100,
    isHobbyRecalculating
  );

  const chatRotatingText = useRotatingMessages(
    useMemo(
      () => [
        'Retrieving syllabus context & textbook vector chunks...',
        `Consulting epistemic invariants in ${activeHobby}...`,
        'Synthesizing rigorous Socratic explanation...',
        'Formatting verified textbook citations...',
      ],
      [activeHobby]
    ),
    1200,
    isSendingChat
  );

  // Compute prerequisites, dependents, and bridges for active selected concept
  const conceptId = selectedConcept?.id || selectedNodeId || '';
  const liveNode = nodes.find((n) => n.id === conceptId);
  const liveAnalogy = (liveNode?.data?.hobbyAnalogy as string) || (liveNode?.data?.hobby_analogy as string);
  const activeAnalogy =
    liveAnalogy ||
    selectedConcept?.hobby_analogy ||
    selectedConcept?.hobbyAnalogy ||
    `In ${activeHobby}, this functions directly like maintaining continuous dynamic rates across input stages: balance is conserved regardless of system complexity.`;

  const unlocked = conceptId ? isNodeUnlocked(conceptId, nodes, edges) : true;
  const missingPrereqs = conceptId ? getMissingPrerequisites(conceptId, nodes, edges) : [];

  const incomingEdges = useMemo(() => {
    if (!conceptId) return [];
    return edges.filter(
      (e) =>
        e.target === conceptId &&
        !e.data?.isBridge &&
        !e.data?.is_isomorphism_bridge &&
        e.type !== 'bridge' &&
        !e.data?.is_hobby_anchor &&
        !e.data?.isHobbyAnchor
    );
  }, [edges, conceptId]);

  const prerequisites = useMemo(() => {
    return incomingEdges
      .map((e) => {
        const srcNode = nodes.find((n) => n.id === e.source);
        const reason =
          (e.data?.connection_reason as string) ||
          (e.data?.connectionReason as string) ||
          `${srcNode?.data?.label || 'Source concept'} establishes the foundational physical state (${srcNode?.data?.core_invariant || srcNode?.data?.coreInvariant || 'conservation invariant'}), mechanically enabling and constraining ${selectedConcept?.label || 'this concept'}.`;
        return {
          edge: e,
          node: srcNode,
          label: (e.data?.relationship_label as string) || (e.data?.label as string) || 'causes',
          reason,
        };
      })
      .filter((p) => p.node !== undefined);
  }, [incomingEdges, nodes, selectedConcept]);

  const outgoingEdges = useMemo(() => {
    if (!conceptId) return [];
    return edges.filter(
      (e) =>
        e.source === conceptId &&
        !e.data?.isBridge &&
        !e.data?.is_isomorphism_bridge &&
        e.type !== 'bridge' &&
        !e.data?.is_hobby_anchor &&
        !e.data?.isHobbyAnchor
    );
  }, [edges, conceptId]);

  const dependents = useMemo(() => {
    return outgoingEdges
      .map((e) => {
        const tgtNode = nodes.find((n) => n.id === e.target);
        const reason =
          (e.data?.connection_reason as string) ||
          (e.data?.connectionReason as string) ||
          `${selectedConcept?.label || 'This concept'} enforces the prerequisite invariant rate (${selectedConcept?.core_invariant || selectedConcept?.coreInvariant || 'conservation invariant'}), which directly drives and governs ${tgtNode?.data?.label || 'target concept'}.`;
        return {
          edge: e,
          node: tgtNode,
          label: (e.data?.relationship_label as string) || (e.data?.label as string) || 'leads to',
          reason,
        };
      })
      .filter((d) => d.node !== undefined);
  }, [outgoingEdges, nodes, selectedConcept]);

  const bridgeEdges = useMemo(() => {
    if (!conceptId) return [];
    return edges.filter(
      (e) =>
        (e.source === conceptId || e.target === conceptId) &&
        (e.data?.isBridge || e.data?.is_isomorphism_bridge || e.type === 'bridge')
    );
  }, [edges, conceptId]);

  const crossBridges = useMemo(() => {
    return bridgeEdges
      .map((e) => {
        const partnerId = e.source === conceptId ? e.target : e.source;
        const partnerNode = nodes.find((n) => n.id === partnerId);
        const partnerChapterId = partnerNode?.data?.chapter_id || partnerNode?.data?.chapterId;
        const partnerChapter = chapters.find(
          (c) => String(c.id) === String(partnerChapterId) || `hull_${c.id}` === String(partnerChapterId)
        );
        const reason =
          (e.data?.connection_reason as string) ||
          (e.data?.connectionReason as string) ||
          `Structural mathematical duality: ${selectedConcept?.label || 'Source concept'} and ${partnerNode?.data?.label || 'target concept'} obey equivalent governing conservation laws across distinct physical media in ${partnerChapter?.title || 'the bridged chapter'}.`;

        return {
          edge: e,
          partnerNode,
          partnerChapter,
          relationshipLabel:
            (e.data?.relationship_label as string) ||
            (e.data?.label as string) ||
            'Isomorphism Bridge',
          reason,
          artifact:
            (e.data?.real_world_artifact as string) ||
            (e.data?.realWorldArtifact as string) ||
            `Cross-Domain Physical Isomorphism: Why both ${selectedConcept?.label || 'this concept'} and ${partnerNode?.data?.label || 'the partner concept'} obey equivalent rate equations in real-world systems.`,
        };
      })
      .filter((b) => b.partnerNode !== undefined);
  }, [bridgeEdges, conceptId, nodes, chapters, selectedConcept]);

  // Camera pan helper
  const handlePanToNode = (targetNode: any) => {
    if (!targetNode) return;
    if (reactFlow?.setCenter) {
      reactFlow.setCenter(targetNode.position.x + 115, targetNode.position.y + 37, {
        zoom: 1.15,
        duration: 600,
      });
    }
    setSelectedNodeId(targetNode.id);
    setSelectedConcept(targetNode.data as ConceptNodeData);
  };

  // Focus on a chapter
  const handleFocusChapter = (chapterId: string | number) => {
    const chapterConcepts = nodes.filter(
      (n) =>
        n.type === 'conceptPill' &&
        (String(n.data?.chapter_id) === String(chapterId) || String(n.data?.chapterId) === String(chapterId))
    );
    if (chapterConcepts.length > 0) {
      handlePanToNode(chapterConcepts[0]);
    }
  };

  // Socratic Chat Submission
  const handleSendChatMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const text = customMsg || chatInput;
    if (!text.trim() || !userProfile?.id || isSendingChat) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const activeConceptId = selectedConcept?.id || nodes.find((n) => n.type === 'conceptPill')?.id || 'general';
      const res = await api.sendChatMessage({
        user_id: userProfile.id,
        concept_id: activeConceptId,
        message: userMsg.content,
        conversation_history: updatedHistory,
      });

      setChatMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Socratic Tutor Notice: ' + (err.message || 'Unable to establish causal feedback loop.'),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const rawP = (liveNode?.data?.p_mastery as number) ?? (liveNode?.data?.pMastery as number) ?? selectedConcept?.p_mastery ?? selectedConcept?.pMastery ?? 0.15;
  const pMasteryPercent = Math.round(rawP * 100);

  const activeChapter = chapters.find(
    (c) =>
      String(c.id) === String(selectedConcept?.chapter_id || selectedConcept?.chapterId) ||
      `hull_${c.id}` === String(selectedConcept?.chapter_id || selectedConcept?.chapterId)
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-transparent text-bauhaus-ink">
      {/* ─────────────────────────────────────────────────────────────
          TOP EDITORIAL PLATFORM BAR (UPLIFTING BAUHAUS)
      ───────────────────────────────────────────────────────────── */}
      <header className="h-14 md:h-16 border-b-2 border-bauhaus-ink bauhaus-glass px-4 md:px-6 flex items-center justify-between z-30 shrink-0">
        {/* Left: Brand & Track */}
        <div className="flex items-center space-x-3.5">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs text-bauhaus-muted hover:text-bauhaus-ink transition-colors font-mono font-bold mr-1"
            title="Return to Scrollytelling Manifesto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Manifesto</span>
          </Link>
          <div className="h-5 w-0.5 bg-bauhaus-ink/20 hidden sm:block" />

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-bauhaus-ink text-white flex items-center justify-center border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21]">
              <BrainCircuit className="w-4 h-4 text-bauhaus-green" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm font-black text-bauhaus-ink tracking-tight font-mono">
                  TESSERA
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-bauhaus-blue/10 border border-bauhaus-blue text-bauhaus-blue font-bold uppercase">
                  Studio
                </span>
              </div>
              <p className="text-[10px] text-bauhaus-muted font-mono hidden md:block">
                Adaptive Cognitive Architecture
              </p>
            </div>
          </div>
        </div>

        {/* Center: Chapter Pills Navigation */}
        <div className="hidden lg:flex items-center space-x-2">
          {chapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleFocusChapter(ch.id)}
              className="px-3 py-1 rounded-lg text-[11px] font-mono font-bold border-2 border-bauhaus-ink bg-white/90 text-bauhaus-ink hover:bg-bauhaus-blue/10 hover:border-bauhaus-blue hover:text-bauhaus-blue shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] hover:-translate-y-0.5 transition-all"
              title={`Focus Chapter ${ch.order_index}: ${ch.title}`}
            >
              <span className="text-bauhaus-blue mr-1">Zone {ch.order_index}</span>
              <span className="truncate max-w-[110px] inline-block align-bottom">{ch.title}</span>
            </button>
          ))}
        </div>

        {/* Right: Metrics, Mobile Switcher, Hobby Anchor & Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-2.5">
          {/* Mobile View Switcher (Visible only on < lg) */}
          <div className="flex lg:hidden items-center p-0.5 bg-white border-2 border-bauhaus-ink rounded-xl shadow-[2px_2px_0px_#171A21]">
            <button
              onClick={() => setMobileView('canvas')}
              className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg transition-all flex items-center space-x-1 ${
                mobileView === 'canvas'
                  ? 'bg-bauhaus-ink text-white shadow-[1px_1px_0px_#171A21]'
                  : 'text-bauhaus-muted hover:text-bauhaus-ink'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setMobileView('hub')}
              className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg transition-all flex items-center space-x-1 ${
                mobileView === 'hub'
                  ? 'bg-bauhaus-ink text-white shadow-[1px_1px_0px_#171A21]'
                  : 'text-bauhaus-muted hover:text-bauhaus-ink'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Hub</span>
            </button>
          </div>

          {/* Epistemic Metrics Badges */}
          <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-white/90 border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] text-[11px] font-mono font-bold">
            <span className="flex items-center space-x-1 text-bauhaus-green" title="Mastered Milestones">
              <span className="w-2 h-2 rounded-full bg-bauhaus-green animate-pulse" />
              <span>{masteredCount}M</span>
            </span>
            <span className="text-bauhaus-border">•</span>
            <span className="flex items-center space-x-1 text-bauhaus-amber" title="Needs Tuning">
              <span className="w-2 h-2 rounded-full bg-bauhaus-amber" />
              <span>{fragileCount}T</span>
            </span>
            <span className="text-bauhaus-border">•</span>
            <span className="flex items-center space-x-1 text-bauhaus-muted" title="Ready to Explore">
              <span>{unverifiedCount}R</span>
            </span>
          </div>

          {/* Active Hobby Grounding Selector */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-bauhaus-amber/15 hover:bg-bauhaus-amber/25 border-2 border-bauhaus-ink text-bauhaus-ink text-xs font-bold font-mono shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] hover:-translate-y-0.5 transition-all"
            title="Change cognitive world-model grounding"
          >
            <Compass className="w-3.5 h-3.5 text-bauhaus-amber" />
            <span className="truncate max-w-[80px] sm:max-w-none">{activeHobby}</span>
          </button>

          {/* Syllabus Upload Action */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white text-xs font-bold font-mono border-2 border-bauhaus-ink shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Chapter</span>
          </button>

          {/* Maximize Canvas / Toggle Hub */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="hidden lg:flex p-1.5 rounded-xl bg-white/90 hover:bg-white border-2 border-bauhaus-ink text-bauhaus-ink shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] transition-all"
            title={isMaximized ? 'Restore Workflow Hub Pane' : 'Maximize Canvas (Full View)'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Reset Track Button */}
          <button
            onClick={async () => {
              if (
                window.confirm(
                  'Reset the entire knowledge graph? All ingested chapters and mastery records will be cleared.'
                )
              ) {
                await clearAllData();
              }
            }}
            className="p-1.5 rounded-xl bg-white/90 hover:bg-red-50 border-2 border-bauhaus-ink text-bauhaus-muted hover:text-bauhaus-red shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] transition-all"
            title="Reset Knowledge Graph"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          HOBBY RE-ANCHORING OVERLAY: FULL-BLEED BACKGROUND WITH BAUHAUS SPINNER
      ───────────────────────────────────────────────────────────── */}
      {isHobbyRecalculating && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-transparent animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-2xl border-2 border-bauhaus-ink bg-white/95 backdrop-blur-md shadow-[8px_8px_0px_#171A21] flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-bauhaus-amber text-bauhaus-ink border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] flex items-center justify-center">
              <Compass className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-bauhaus-amber font-bold px-2 py-0.5 rounded-full bg-bauhaus-amber/15 border border-bauhaus-amber inline-block mb-1">
                Cognitive Model Re-Grounding
              </span>
              <h3 className="text-base font-black text-bauhaus-ink font-mono tracking-tight">
                Recalculating Epistemic Nodes...
              </h3>
              <p className="text-xs text-bauhaus-muted mt-1 font-mono">
                {hobbyRotatingText}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-bauhaus-muted pt-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-bauhaus-blue" />
              <span>Updating world-model analogical mapping</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SPLIT-PANE ERGONOMIC WORKSPACE
      ───────────────────────────────────────────────────────────── */}
      <div className={`relative flex-1 w-full overflow-hidden flex flex-col lg:flex-row p-3 md:p-4 gap-3 md:gap-4 bg-transparent transition-opacity duration-300 ${
        isHobbyRecalculating ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        {/* LEFT PANE: Expandable Graph Canvas */}
        <main
          className={`h-full relative transition-all duration-300 rounded-2xl border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21] overflow-hidden bg-white/95 ${
            isMaximized ? 'w-full' : 'w-full lg:w-[62%]'
          } ${mobileView === 'hub' ? 'hidden lg:block' : 'flex-1'}`}
        >
          {!isInitialized && chapters.length === 0 ? (
            /* Hydrating State: Bauhaus Skeleton Loader */
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-white/90">
              <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border-2 border-bauhaus-ink bg-white shadow-[6px_6px_0px_#171A21]">
                <div className="w-12 h-12 mx-auto rounded-xl bg-bauhaus-blue/10 border-2 border-bauhaus-blue flex items-center justify-center text-bauhaus-blue">
                  <BrainCircuit className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-bauhaus-blue font-bold">
                    Initializing Cognitive Engine
                  </span>
                  <h2 className="text-xl font-black text-bauhaus-ink mt-1 font-mono tracking-tight">
                    Hydrating Knowledge Graph...
                  </h2>
                  <p className="text-xs text-bauhaus-muted mt-2 leading-relaxed font-sans">
                    Restoring topological mental models, Bayesian priors, and causal dependency invariants.
                  </p>
                </div>
              </div>
            </div>
          ) : isInitialized && chapters.length === 0 ? (
            /* Cold-Start State: Empty Track Ingestion */
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-white/90">
              <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border-2 border-bauhaus-ink bg-white/95 shadow-[6px_6px_0px_#171A21]">
                <div className="w-12 h-12 mx-auto rounded-xl bg-bauhaus-blue/10 border-2 border-bauhaus-blue flex items-center justify-center text-bauhaus-blue">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-bauhaus-blue font-bold">
                    Phase 2: Cold-Start Track
                  </span>
                  <h2 className="text-xl font-black text-bauhaus-ink mt-1 font-mono tracking-tight">
                    Compile Your Mental Model
                  </h2>
                  <p className="text-xs text-bauhaus-muted mt-2 leading-relaxed font-sans">
                    Upload your syllabus PDF or seed an authentic physics chapter. The pipeline will isolate causal
                    invariants, ground them into <strong>{activeHobby}</strong>, and calculate mastery using Bayesian
                    Knowledge Tracing.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] hover:shadow-[4px_4px_0px_#171A21] hover:-translate-y-0.5 transition-all"
                  >
                    Upload Chapter 1 PDF
                  </button>
                  <button
                    disabled={isSeeding}
                    onClick={async () => {
                      if (userProfile?.id && !isSeeding) {
                        setIsSeeding(true);
                        setSeedError(null);
                        try {
                          await api.seedSampleChapter(userProfile.id, 1, activeHobby);
                          await loadUserGraph(userProfile.id);
                        } catch (err: any) {
                          setSeedError(err.message || 'Seeding failed');
                        } finally {
                          setIsSeeding(false);
                        }
                      }
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-amber-50 border-2 border-bauhaus-ink text-bauhaus-ink font-mono font-bold text-xs shadow-[3px_3px_0px_#171A21] hover:shadow-[4px_4px_0px_#171A21] hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {isSeeding ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-bauhaus-ink" />
                        <span>Synthesizing Chapter 1...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-bauhaus-amber" />
                        <span>Seed Demo Chapter 1</span>
                      </>
                    )}
                  </button>
                </div>

                {seedError && (
                  <div className="mt-2 p-2.5 rounded-xl bg-red-50 border-2 border-bauhaus-red text-xs text-bauhaus-red font-mono font-bold">
                    {seedError}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ConceptCanvas
              onOpenUpload={() => setIsUploadOpen(true)}
              hideFloatingDrawer={!isMaximized}
            />
          )}

          {/* Floating Maximize Button in Bottom Left of Canvas */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bauhaus-glass border-2 border-bauhaus-ink text-bauhaus-ink text-xs font-mono font-bold shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] hover:-translate-y-0.5 transition-all"
            >
              {isMaximized ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Restore Workflow Hub</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Maximize Graph Canvas</span>
                </>
              )}
            </button>
          </div>
        </main>

        {/* RIGHT PANE: Workflow & Diagnostic Hub */}
        {!isMaximized && (
          <aside className={`w-full lg:w-[38%] min-w-0 lg:min-w-[360px] max-w-none lg:max-w-[480px] rounded-2xl border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21] bg-white/95 flex flex-col h-full overflow-hidden shrink-0 ${
            mobileView === 'canvas' ? 'hidden lg:flex' : 'flex-1'
          }`}>
            {/* Hub Persistent Tab Bar */}
            <div className="flex items-center border-b-2 border-bauhaus-ink bg-white/70 p-2 gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('inspector')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-xs font-mono transition-all ${
                  activeTab === 'inspector'
                    ? 'bg-white text-bauhaus-ink font-bold shadow-[2px_2px_0px_#171A21] border-2 border-bauhaus-ink'
                    : 'text-bauhaus-muted hover:text-bauhaus-ink hover:bg-white/60 font-medium'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 text-bauhaus-blue" />
                <span>Inspector</span>
                {selectedConcept && (
                  <span className="w-2 h-2 rounded-full bg-bauhaus-green animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('syllabus')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-xs font-mono transition-all ${
                  activeTab === 'syllabus'
                    ? 'bg-white text-bauhaus-ink font-bold shadow-[2px_2px_0px_#171A21] border-2 border-bauhaus-ink'
                    : 'text-bauhaus-muted hover:text-bauhaus-ink hover:bg-white/60 font-medium'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-bauhaus-ink" />
                <span>Syllabus</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-bauhaus-blue/15 text-bauhaus-blue font-bold">
                  {chapters.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-xs font-mono transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white text-bauhaus-ink font-bold shadow-[2px_2px_0px_#171A21] border-2 border-bauhaus-ink'
                    : 'text-bauhaus-muted hover:text-bauhaus-ink hover:bg-white/60 font-medium'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-bauhaus-amber" />
                <span>Socratic</span>
              </button>
            </div>

            {/* TAB CONTENT 1: NODE INSPECTOR */}
            {activeTab === 'inspector' && (
              <div className="flex-1 overflow-y-auto will-change-scroll transform-gpu p-4 space-y-3.5">
                {selectedConcept ? (
                  <>
                    {/* Concept Header Card */}
                    <div className="p-4 rounded-xl bg-white/95 border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-bauhaus-blue font-bold px-2 py-0.5 rounded-md bg-bauhaus-blue/10 border border-bauhaus-blue shrink-0">
                            {selectedConcept.is_hobby_anchor ? 'Home Base Anchor' : 'Quest Milestone'}
                          </span>
                          {activeChapter && (
                            <span className="text-[10px] text-bauhaus-muted font-mono truncate">
                              Zone {activeChapter.order_index}: {activeChapter.subject}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border-2 shrink-0 ${
                            selectedConcept.status === 'MASTERED'
                              ? 'bg-bauhaus-green/15 text-bauhaus-green border-bauhaus-green'
                              : selectedConcept.status === 'FRAGILE'
                              ? 'bg-bauhaus-amber/15 text-bauhaus-amber border-bauhaus-amber'
                              : 'bg-slate-100 text-bauhaus-muted border-bauhaus-border'
                          }`}
                        >
                          {selectedConcept.status === 'MASTERED'
                            ? 'Mastered'
                            : selectedConcept.status === 'FRAGILE'
                            ? 'Needs Tuning'
                            : 'Ready to Explore'}{' '}
                          ({pMasteryPercent}%)
                        </span>
                      </div>

                      <h3 className="text-base font-black text-bauhaus-ink font-mono leading-tight break-words">
                        {selectedConcept.label}
                      </h3>

                      {/* Mastery Level Gauge */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-bauhaus-muted mb-1">
                          <span>Mastery Level</span>
                          <span className="font-bold text-bauhaus-ink">{pMasteryPercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full border border-bauhaus-ink overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              selectedConcept.status === 'MASTERED'
                                ? 'bg-bauhaus-green'
                                : selectedConcept.status === 'FRAGILE'
                                ? 'bg-bauhaus-amber'
                                : 'bg-bauhaus-blue'
                            }`}
                            style={{ width: `${Math.max(6, Math.min(100, pMasteryPercent))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* World-Model Grounding / Hobby Analogy */}
                    <div className="p-3.5 rounded-xl bg-bauhaus-amber/10 border-2 border-bauhaus-amber shadow-[3px_3px_0px_#F59E0B] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-bauhaus-ink font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Compass className="w-3.5 h-3.5 text-bauhaus-amber shrink-0" />
                          <span className="truncate">Grounded In {activeHobby}</span>
                        </span>
                        <button
                          onClick={() => setIsOnboardingOpen(true)}
                          className="underline hover:text-bauhaus-blue font-mono font-bold text-[10px] shrink-0 ml-2"
                        >
                          Switch
                        </button>
                      </div>
                      <p className="text-xs text-bauhaus-ink leading-relaxed font-sans italic break-words">
                        &ldquo;{activeAnalogy}&rdquo;
                      </p>
                    </div>

                    {/* Governing Principle Description */}
                    <div className="p-3.5 rounded-xl bg-white/95 border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-1">
                      <span className="text-[10px] font-mono text-bauhaus-muted font-bold uppercase tracking-wider block">
                        Governing Principle
                      </span>
                      <p className="text-xs text-bauhaus-ink leading-relaxed font-sans break-words">
                        {selectedConcept.core_invariant ||
                          selectedConcept.coreInvariant ||
                          'Fundamental structural conservation relationship.'}
                      </p>
                    </div>

                    {/* Intra-Chapter Prerequisites (Incoming Causal Links) */}
                    <div className="p-3.5 rounded-xl bg-white/95 border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-bauhaus-ink font-bold uppercase tracking-wider block">
                          Foundational Milestones ({prerequisites.length})
                        </span>
                        <span className="text-[9px] font-mono text-bauhaus-muted">Prerequisites</span>
                      </div>
                      {prerequisites.length === 0 ? (
                        <p className="text-xs text-bauhaus-muted italic font-sans">
                          Foundational entrypoint milestone. No prior prerequisites in this zone.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {prerequisites.map((p) => {
                            const isParentMastered = p.node?.data?.status === 'MASTERED';
                            return (
                              <div
                                key={p.edge.id}
                                onClick={() => handlePanToNode(p.node)}
                                className="p-2.5 rounded-lg bg-white hover:bg-blue-50/50 border border-bauhaus-ink cursor-pointer transition-all hover:translate-x-0.5 space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                                    {isParentMastered ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-bauhaus-green shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-3.5 h-3.5 text-bauhaus-amber shrink-0" />
                                    )}
                                    <span className="font-bold text-xs font-mono text-bauhaus-ink truncate">
                                      {p.node?.data?.label as string}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-bauhaus-border text-bauhaus-muted shrink-0">
                                    {p.label}
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-bauhaus-muted leading-relaxed font-sans">
                                  <span className="font-bold text-bauhaus-ink font-mono text-[10px] block mb-0.5">Connection Reason:</span>
                                  {p.reason}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Downstream Dependents (Outgoing Causal Links) */}
                    {dependents.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-white/95 border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-bauhaus-ink font-bold uppercase tracking-wider block">
                            Next Milestones Unlocked ({dependents.length})
                          </span>
                          <span className="text-[9px] font-mono text-bauhaus-muted">Unlocked Paths</span>
                        </div>
                        <div className="space-y-2">
                          {dependents.map((d) => (
                            <div
                              key={d.edge.id}
                              onClick={() => handlePanToNode(d.node)}
                              className="p-2.5 rounded-lg bg-white hover:bg-blue-50/50 border border-bauhaus-ink cursor-pointer transition-all hover:translate-x-0.5 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <ChevronRight className="w-3.5 h-3.5 text-bauhaus-blue shrink-0" />
                                  <span className="font-bold text-xs font-mono text-bauhaus-ink truncate">
                                    {d.node?.data?.label as string}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-bauhaus-blue/30 text-bauhaus-blue shrink-0">
                                  {d.label}
                                </span>
                              </div>
                              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-bauhaus-muted leading-relaxed font-sans">
                                <span className="font-bold text-bauhaus-ink font-mono text-[10px] block mb-0.5">Connection Reason:</span>
                                {d.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hidden Cross-Chapter Bridges */}
                    {crossBridges.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-blue-50/70 border-2 border-bauhaus-blue shadow-[3px_3px_0px_#2563EB] space-y-2">
                        <span className="text-[10px] font-mono text-bauhaus-blue font-bold uppercase tracking-wider block flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-bauhaus-blue shrink-0" />
                          <span className="truncate">Hidden Cross-Chapter Bridges ({crossBridges.length})</span>
                        </span>
                        <div className="space-y-2">
                          {crossBridges.map((b) => (
                            <div
                              key={b.edge.id}
                              onClick={() => {
                                setLatestArtifact({
                                  bridge_label: b.relationshipLabel,
                                  real_world_artifact: b.artifact,
                                });
                              }}
                              className="p-2.5 rounded-lg bg-white hover:bg-blue-100/50 border border-bauhaus-blue cursor-pointer transition-colors space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2 font-bold text-bauhaus-ink min-w-0">
                                <span className="truncate flex-1 min-w-0 text-xs font-mono">{b.relationshipLabel}</span>
                                <ExternalLink className="w-3 h-3 text-bauhaus-blue shrink-0" />
                              </div>
                              <div className="p-2 rounded bg-blue-50/60 border border-bauhaus-blue/20 text-[11px] text-bauhaus-ink leading-relaxed font-sans">
                                <span className="font-bold text-bauhaus-blue font-mono text-[10px] block mb-0.5">Mathematical Duality Reason:</span>
                                {b.reason}
                              </div>
                              <div className="p-2 rounded bg-amber-50/60 border border-bauhaus-amber/30 text-[11px] text-bauhaus-muted leading-relaxed font-sans">
                                <span className="font-bold text-bauhaus-amber font-mono text-[10px] block mb-0.5">Real-World Manifestation:</span>
                                {b.artifact}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestone Challenge Action */}
                    <div className="pt-1 space-y-2">
                      <button
                        onClick={() => openTwoTier(selectedConcept)}
                        disabled={!unlocked}
                        className={`w-full flex items-center justify-center space-x-2 p-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all ${
                          unlocked
                            ? 'bg-bauhaus-blue hover:bg-blue-700 text-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] hover:shadow-[4px_4px_0px_#171A21] hover:-translate-y-0.5'
                            : 'bg-slate-200 text-slate-500 border-2 border-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {unlocked ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-white" />
                            <span>Take Milestone Challenge</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-slate-500" />
                            <span>Locked: Foundational Milestones Required</span>
                          </>
                        )}
                      </button>

                      {!unlocked && missingPrereqs.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-red-50 border-2 border-bauhaus-red text-[11px] text-bauhaus-red font-mono font-bold">
                          Complete foundational milestones: <strong>{missingPrereqs.join(', ')}</strong> before taking
                          this challenge.
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          handleSendChatMessage(
                            undefined,
                            `Can you explain ${selectedConcept.label} using an analogy from ${activeHobby}? What is the core physical invariant?`
                          );
                        }}
                        className="w-full flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-white hover:bg-amber-50 border-2 border-bauhaus-ink text-bauhaus-ink font-mono font-bold text-xs shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] hover:-translate-y-0.5 transition-all"
                      >
                        <Bot className="w-3.5 h-3.5 text-bauhaus-amber" />
                        <span>Ask Socratic Quest Mentor</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Empty state when no node is selected */
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] flex items-center justify-center text-bauhaus-ink">
                      <Crosshair className="w-6 h-6 text-bauhaus-blue" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-bauhaus-ink font-mono">
                        Select a Quest Milestone
                      </h4>
                      <p className="text-xs text-bauhaus-muted mt-1 max-w-[240px] leading-relaxed font-sans">
                        Click any milestone on the quest map to inspect its dependencies, mastery level, and real-world grounding.
                      </p>
                    </div>

                    {conceptNodes.length > 0 && (
                      <div className="w-full pt-4 text-left">
                        <span className="text-[10px] font-mono text-bauhaus-muted font-bold uppercase tracking-wider block mb-2">
                          Available Milestones
                        </span>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                          {conceptNodes.slice(0, 5).map((node) => (
                            <button
                              key={node.id}
                              onClick={() => handlePanToNode(node)}
                              className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] text-xs font-mono font-bold text-bauhaus-ink flex items-center justify-between gap-2 transition-all hover:translate-x-0.5 overflow-hidden"
                            >
                              <span className="truncate flex-1 min-w-0">{node.data?.label as string}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-bauhaus-blue shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: CHAPTER SYLLABUS */}
            {activeTab === 'syllabus' && (
              <div className="flex-1 overflow-y-auto will-change-scroll transform-gpu p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-bauhaus-ink font-mono">Curriculum Progression</h3>
                    <p className="text-[11px] text-bauhaus-muted font-mono">
                      {chapters.length} Ingested Chapters • {conceptNodes.length} Atomic Concepts
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white text-[11px] font-mono font-bold border-2 border-bauhaus-ink shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add PDF</span>
                  </button>
                </div>

                {chapters.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/95 border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] text-center space-y-2">
                    <BookOpen className="w-6 h-6 text-bauhaus-muted mx-auto" />
                    <p className="text-xs text-bauhaus-muted font-sans">No syllabus chapters uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chapters.map((ch) => {
                      const chNodes = nodes.filter(
                        (n) =>
                          n.type === 'conceptPill' &&
                          (String(n.data?.chapter_id) === String(ch.id) || String(n.data?.chapterId) === String(ch.id))
                      );
                      const chMastered = chNodes.filter((n) => n.data?.status === 'MASTERED').length;
                      const chPercent = chNodes.length > 0 ? Math.round((chMastered / chNodes.length) * 100) : 0;

                      return (
                        <div key={ch.id} className="p-3.5 rounded-xl bg-white/95 border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-2.5">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-bauhaus-muted font-bold">
                                Chapter {ch.order_index} • {ch.subject}
                              </span>
                              <h4 className="text-xs font-black text-bauhaus-ink mt-0.5 font-mono">{ch.title}</h4>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-bauhaus-ink text-bauhaus-ink font-bold shadow-[1px_1px_0px_#171A21]">
                              {chPercent}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 w-full bg-slate-100 rounded-full border border-bauhaus-ink overflow-hidden">
                            <div className="h-full bg-bauhaus-green rounded-full" style={{ width: `${chPercent}%` }} />
                          </div>

                          {/* List of Concepts in this chapter */}
                          <div className="space-y-1.5 pt-1">
                            {chNodes.map((cn) => {
                              const isM = cn.data?.status === 'MASTERED';
                              const isF = cn.data?.status === 'FRAGILE';
                              return (
                                <button
                                  key={cn.id}
                                  onClick={() => handlePanToNode(cn)}
                                  className="w-full text-left p-2 rounded-lg bg-white hover:bg-slate-50 border border-bauhaus-ink/40 hover:border-bauhaus-ink text-xs font-mono flex items-center justify-between gap-2 transition-colors overflow-hidden"
                                >
                                  <span className="truncate flex-1 min-w-0 font-bold text-bauhaus-ink">
                                    {cn.data?.label as string}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                                      isM
                                        ? 'bg-bauhaus-green/15 text-bauhaus-green border-bauhaus-green'
                                        : isF
                                        ? 'bg-bauhaus-amber/15 text-bauhaus-amber border-bauhaus-amber'
                                        : 'bg-slate-100 text-bauhaus-muted border-bauhaus-border'
                                    }`}
                                  >
                                    {isM ? 'MASTERED' : isF ? 'FRAGILE' : 'UNVERIFIED'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: SOCRATIC STUDY CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto will-change-scroll transform-gpu p-4 space-y-3">
                  {/* Tutor Greeting */}
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-xl bg-bauhaus-ink text-white flex items-center justify-center shrink-0 text-xs border border-bauhaus-ink shadow-[1px_1px_0px_#171A21]">
                      <Bot className="w-4 h-4 text-bauhaus-green" />
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/95 border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] text-xs text-bauhaus-ink space-y-1 max-w-[85%]">
                      <p className="font-bold text-bauhaus-ink font-mono">Socratic Epistemic Companion</p>
                      <p className="leading-relaxed font-sans">
                        I answer mechanistic questions across any concept in your syllabus, cite the authoritative source chapters/PDFs (NotebookLM/Gemini style), and can translate concepts into <strong>{activeHobby}</strong> when requested.
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start space-x-2.5 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-xl bg-bauhaus-ink text-white flex items-center justify-center shrink-0 text-xs border border-bauhaus-ink shadow-[1px_1px_0px_#171A21]">
                          <Bot className="w-4 h-4 text-bauhaus-green" />
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-bauhaus-ink text-white font-mono border-2 border-bauhaus-ink shadow-[2px_2px_0px_rgba(0,0,0,0.25)] whitespace-pre-wrap'
                            : 'bg-white/95 border-2 border-bauhaus-ink text-bauhaus-ink shadow-[2px_2px_0px_#171A21] font-sans'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <FormattedAssistantMessage content={msg.content} />
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-xl bg-bauhaus-blue text-white flex items-center justify-center shrink-0 text-xs border border-bauhaus-ink shadow-[1px_1px_0px_#171A21]">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isSendingChat && (
                    <div className="flex items-center space-x-2 text-xs text-bauhaus-muted font-mono italic">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-bauhaus-ink shrink-0" />
                      <span>{chatRotatingText}</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Prompt Starters */}
                <div className="p-2 border-t-2 border-bauhaus-ink bg-white/60 flex items-center gap-1.5 overflow-x-auto shrink-0">
                  {selectedConcept ? (
                    <>
                      <button
                        onClick={() =>
                          handleSendChatMessage(
                            undefined,
                            `Explain the fundamental physical mechanism of ${selectedConcept.label}.`
                          )
                        }
                        className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-bauhaus-ink text-[10px] font-mono font-bold text-bauhaus-ink shadow-[1px_1px_0px_#171A21]"
                      >
                        Explain {selectedConcept.label}
                      </button>
                      <button
                        onClick={() =>
                          handleSendChatMessage(
                            undefined,
                            `Explain ${selectedConcept.label} using an analogy to ${activeHobby}.`
                          )
                        }
                        className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-bauhaus-ink text-[10px] font-mono font-bold text-bauhaus-ink shadow-[1px_1px_0px_#171A21]"
                      >
                        Analogy to {activeHobby}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        handleSendChatMessage(
                          undefined,
                          'What are the primary physical conservation laws across this syllabus?'
                        )
                      }
                      className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-bauhaus-ink text-[10px] font-mono font-bold text-bauhaus-ink shadow-[1px_1px_0px_#171A21]"
                    >
                      Summarize Invariant Laws
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleSendChatMessage(
                        undefined,
                        'Cite the syllabus sections and explain how drift velocity connects to current continuity.'
                      )
                    }
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-bauhaus-ink text-[10px] font-mono font-bold text-bauhaus-ink shadow-[1px_1px_0px_#171A21]"
                  >
                    Cite Syllabus Sources
                  </button>
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={handleSendChatMessage}
                  className="p-3 border-t-2 border-bauhaus-ink bg-white/70 flex items-center space-x-2 shrink-0"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={
                      selectedConcept
                        ? `Ask about ${selectedConcept.label}...`
                        : 'Ask Socratic tutor...'
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border-2 border-bauhaus-ink text-xs font-mono text-bauhaus-ink placeholder-bauhaus-muted focus:outline-none focus:ring-2 focus:ring-bauhaus-blue"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSendingChat}
                    className="p-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] transition-all disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          GLOBAL MODALS & DIAGNOSTIC GAUNTLETS
      ───────────────────────────────────────────────────────────── */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => {
          setIsOnboardingOpen(false);
          if (userProfile?.id) loadUserGraph(userProfile.id);
        }}
      />

      <ChapterUploadZone
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        chapterNumber={chapters.length + 1}
      />

      <TwoTierModal />
      <AntiJargonCountdownModal />
      <RcaMicroProbeModal />
      <RcaVerdictModal />
      <IsomorphismCardModal />
    </div>
  );
}

export function CognitiveStudio() {
  return (
    <ReactFlowProvider>
      <CognitiveStudioInner />
    </ReactFlowProvider>
  );
}
