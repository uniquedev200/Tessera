'use client';

import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  X,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  GitBranch,
  Crosshair,
  Layers,
  Send,
  Loader2,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { useGraphStore, isNodeUnlocked, getMissingPrerequisites } from '@/store/useGraphStore';
import { api } from '@/lib/api';
import { ConceptNodeData, ChatMessage } from '@/lib/types';
import { useRotatingMessages } from '@/lib/useRotatingMessages';

export const NodeInspectionDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    closeDrawer,
    selectedConcept,
    selectedNodeId,
    nodes,
    edges,
    chapters,
    userProfile,
    openTwoTier,
    setSelectedConcept,
    setSelectedNodeId,
    setLatestArtifact,
  } = useGraphStore();

  const reactFlow = useReactFlow();

  // Socratic Chat local state
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  if (!isDrawerOpen || !selectedConcept) return null;

  const hobby = userProfile?.hobby_anchor || 'Music Production';

  const chatRotatingText = useRotatingMessages(
    React.useMemo(
      () => [
        'Retrieving syllabus context & textbook vector chunks...',
        `Consulting epistemic invariants in ${hobby}...`,
        'Synthesizing rigorous Socratic explanation...',
        'Formatting verified textbook citations...',
      ],
      [hobby]
    ),
    1200,
    isSending
  );

  const conceptId = selectedConcept.id || selectedNodeId || '';

  // Look up live node from reactive store
  const liveNode = nodes.find((n) => n.id === conceptId);
  const liveAnalogy = (liveNode?.data?.hobbyAnalogy as string) || (liveNode?.data?.hobby_analogy as string);
  const activeAnalogy = liveAnalogy || selectedConcept.hobby_analogy || selectedConcept.hobbyAnalogy || `In ${hobby}, this functions directly like maintaining continuous dynamic rates across input stages: balance is conserved regardless of system complexity.`;

  const isHobbyNode = Boolean(
    selectedConcept.is_hobby_anchor ||
    selectedConcept.isHobbyAnchor ||
    liveNode?.data?.is_hobby_anchor ||
    liveNode?.data?.isHobbyAnchor ||
    conceptId.startsWith('hobby_')
  );
  const conceptTitle = isHobbyNode ? `${hobby} Cognitive Anchor` : selectedConcept.label;

  // Find chapter details
  const chapterId = selectedConcept.chapter_id || selectedConcept.chapterId;
  const currentChapter = chapters.find(
    (c) => String(c.id) === String(chapterId) || `hull_${c.id}` === String(chapterId)
  );

  // Status and Mastery
  const pMastery = (liveNode?.data?.p_mastery as number) ?? (liveNode?.data?.pMastery as number) ?? selectedConcept.p_mastery ?? selectedConcept.pMastery ?? 0.15;
  const pMasteryPercent = Math.round(pMastery * 100);

  // 1. Compute Intra-Chapter Prerequisites (Incoming causal edges)
  const incomingEdges = edges.filter(
    (e) =>
      e.target === conceptId &&
      !e.data?.isBridge &&
      !e.data?.is_isomorphism_bridge &&
      e.type !== 'bridge' &&
      !e.data?.is_hobby_anchor &&
      !e.data?.isHobbyAnchor
  );

  const prerequisites = incomingEdges
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

  // 2. Compute Intra-Chapter Dependents (Outgoing causal edges)
  const outgoingEdges = edges.filter(
    (e) =>
      e.source === conceptId &&
      !e.data?.isBridge &&
      !e.data?.is_isomorphism_bridge &&
      e.type !== 'bridge' &&
      !e.data?.is_hobby_anchor &&
      !e.data?.isHobbyAnchor
  );

  const dependents = outgoingEdges
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

  // 3. Compute Cross-Chapter Bridges
  const bridgeEdges = edges.filter(
    (e) =>
      (e.source === conceptId || e.target === conceptId) &&
      (e.data?.isBridge || e.data?.is_isomorphism_bridge || e.type === 'bridge')
  );

  const crossBridges = bridgeEdges
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
        `Both concepts share an identical mathematical structure: the gradient-driven flow across an energy barrier in this domain is structurally isomorphic to the conservation balance in ${partnerChapter?.title || 'the bridged chapter'}.`;

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
          `Cross-Domain Physical Isomorphism: Why both ${selectedConcept?.label || 'this concept'} and ${partnerNode?.data?.label || 'the partner concept'} obey equivalent rate equations in real-world systems.`,
      };
    })
    .filter((b) => b.partnerNode !== undefined);

  // Focus/Pan helper
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

  // Socratic message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !userProfile?.id || isSending) return;

    const userMsg: ChatMessage = { role: 'user', content: inputMessage.trim() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await api.sendChatMessage({
        user_id: userProfile.id,
        concept_id: conceptId,
        message: userMsg.content,
        conversation_history: updatedHistory,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error communicating with Socratic tutor: ' + (err.message || 'Unknown error'),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full sm:max-w-md bg-white/95 backdrop-blur-md border-l-2 border-bauhaus-ink shadow-[-6px_0px_0px_#171A21] flex flex-col animate-slideLeft">
      {/* Drawer Header */}
      <div className="flex items-start justify-between p-4 border-b-2 border-bauhaus-ink bg-white/80">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-bauhaus-blue font-bold px-2 py-0.5 rounded-full bg-bauhaus-blue/10 border border-bauhaus-blue">
              Milestone Inspector
            </span>
            {currentChapter && (
              <span className="text-[10px] text-bauhaus-muted font-mono font-bold flex items-center gap-1">
                <Layers className="w-3 h-3 text-bauhaus-ink" />
                Zone {currentChapter.order_index}: {currentChapter.subject}
              </span>
            )}
          </div>
          <h2 className="text-base font-black text-bauhaus-ink tracking-tight font-mono leading-snug">
            {conceptTitle}
          </h2>
        </div>
        <button
          onClick={closeDrawer}
          className="p-1 rounded-lg text-bauhaus-muted hover:text-bauhaus-ink hover:bg-slate-100 transition-colors"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
        {/* SECTION 1: Governing Principle & Quest Milestone Mastery */}
        <section className="p-4 rounded-xl bg-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-bauhaus-muted font-bold">
              Quest Milestone Progress
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border-2 ${
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

          {/* Mastery Progress Bar */}
          <div>
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
                style={{ width: `${Math.min(100, Math.max(5, pMasteryPercent))}%` }}
              />
            </div>
          </div>

          {/* Governing Principle */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-bauhaus-ink font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-bauhaus-green" />
              <span>Governing Principle</span>
            </div>
            <p className="text-xs text-bauhaus-ink leading-relaxed font-sans font-medium">
              {selectedConcept.core_invariant || selectedConcept.coreInvariant}
            </p>
          </div>

          {/* Active Misconceptions */}
          {selectedConcept.active_misconceptions && selectedConcept.active_misconceptions.length > 0 && (
            <div className="p-3 rounded-xl bg-bauhaus-amber/10 border-2 border-bauhaus-amber shadow-[2px_2px_0px_#F59E0B] space-y-1">
              <span className="text-[10px] font-mono font-bold text-bauhaus-amber flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-bauhaus-amber" />
                <span>Detected Active Misconception</span>
              </span>
              {selectedConcept.active_misconceptions.map((m, idx) => (
                <p key={idx} className="text-[11px] text-bauhaus-ink font-mono font-medium leading-tight">
                  {m.label || m.reason || 'Local invariant breakdown or upstream violation'}
                </p>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: Personal Hobby Analogy */}
        <section className="p-4 rounded-xl bg-bauhaus-amber/10 border-2 border-bauhaus-amber shadow-[3px_3px_0px_#F59E0B] space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-bauhaus-ink font-bold">
              <Compass className="w-3.5 h-3.5 text-bauhaus-amber" />
              <span>Grounded in {hobby}</span>
            </div>
            <span className="text-[9px] font-mono text-bauhaus-amber uppercase font-bold">World Model</span>
          </div>
          <p className="text-xs text-bauhaus-ink leading-relaxed font-sans italic">
            &ldquo;{activeAnalogy}&rdquo;
          </p>
        </section>

        {/* SECTION 3: Quest Path & Dependencies */}
        <section className="p-4 rounded-xl bg-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-2.5">
          <div className="text-xs font-mono uppercase tracking-wider text-bauhaus-ink font-bold flex items-center space-x-1.5">
            <GitBranch className="w-3.5 h-3.5 text-bauhaus-blue" />
            <span>Quest Path & Dependencies</span>
          </div>

          {/* Incoming Prerequisites */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-bauhaus-muted uppercase tracking-wider font-bold flex items-center gap-1">
              <ArrowLeft className="w-3 h-3 text-bauhaus-blue" />
              <span>Foundational Milestones (Prerequisites):</span>
            </span>

            {prerequisites.length === 0 ? (
              <p className="text-[11px] text-bauhaus-muted italic pl-2 font-sans">
                Root Milestone — Primary entrypoint for this zone.
              </p>
            ) : (
              <div className="space-y-2">
                {prerequisites.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-bauhaus-ink hover:border-bauhaus-blue transition-colors shadow-[1px_1px_0px_#171A21] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="overflow-hidden pr-2 min-w-0 flex-1">
                        <div className="text-xs font-bold text-bauhaus-ink truncate font-mono">
                          {p.node?.data?.label as string}
                        </div>
                        <div className="text-[9px] font-mono text-bauhaus-muted truncate">
                          via: {p.label}
                        </div>
                      </div>
                      <button
                        onClick={() => handlePanToNode(p.node)}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-50 border border-bauhaus-ink text-bauhaus-ink text-[10px] font-mono font-bold flex items-center space-x-1 shrink-0 shadow-[1px_1px_0px_#171A21]"
                        title="Pan camera to this prerequisite"
                      >
                        <Crosshair className="w-3 h-3 text-bauhaus-blue" />
                        <span>Focus</span>
                      </button>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-bauhaus-muted leading-relaxed font-sans">
                      <span className="font-bold text-bauhaus-ink font-mono text-[10px] block mb-0.5">Connection Reason:</span>
                      {p.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Dependents */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <span className="text-[10px] font-mono text-bauhaus-muted uppercase tracking-wider font-bold flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-bauhaus-blue" />
              <span>Next Milestones Unlocked:</span>
            </span>

            {dependents.length === 0 ? (
              <p className="text-[11px] text-bauhaus-muted italic pl-2 font-sans">
                Terminal Milestone — Capstone achievement of this zone.
              </p>
            ) : (
              <div className="space-y-2">
                {dependents.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-bauhaus-ink hover:border-bauhaus-blue transition-colors shadow-[1px_1px_0px_#171A21] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="overflow-hidden pr-2 min-w-0 flex-1">
                        <div className="text-xs font-bold text-bauhaus-ink truncate font-mono">
                          {d.node?.data?.label as string}
                        </div>
                        <div className="text-[9px] font-mono text-bauhaus-muted truncate">
                          via: {d.label}
                        </div>
                      </div>
                      <button
                        onClick={() => handlePanToNode(d.node)}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-50 border border-bauhaus-ink text-bauhaus-ink text-[10px] font-mono font-bold flex items-center space-x-1 shrink-0 shadow-[1px_1px_0px_#171A21]"
                        title="Pan camera to this dependent"
                      >
                        <Crosshair className="w-3 h-3 text-bauhaus-blue" />
                        <span>Focus</span>
                      </button>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-bauhaus-muted leading-relaxed font-sans">
                      <span className="font-bold text-bauhaus-ink font-mono text-[10px] block mb-0.5">Connection Reason:</span>
                      {d.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: Hidden Cross-Chapter Bridges */}
        <section className="p-4 rounded-xl bg-blue-50/70 border-2 border-bauhaus-blue shadow-[3px_3px_0px_#2563EB] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-wider text-bauhaus-blue font-bold flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-bauhaus-blue" />
              <span>Hidden Cross-Chapter Bridges</span>
            </div>
            {crossBridges.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-bauhaus-blue text-white text-[10px] font-mono font-bold">
                {crossBridges.length} active
              </span>
            )}
          </div>

          {crossBridges.length === 0 ? (
            <p className="text-[11px] text-bauhaus-muted leading-relaxed italic font-sans">
              No cross-chapter bridges connected to this milestone. Click &quot;Discover Hidden Links&quot; on the canvas toolbar to reveal mathematical bridges between zones.
            </p>
          ) : (
            <div className="space-y-2">
              {crossBridges.map((b, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-bauhaus-blue space-y-2 shadow-[1px_1px_0px_#2563EB]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-bauhaus-ink truncate font-mono">
                        {b.partnerNode?.data?.label as string}
                      </div>
                      <div className="text-[10px] text-bauhaus-muted font-mono">
                        {b.partnerChapter
                          ? `Zone ${b.partnerChapter.order_index}: ${b.partnerChapter.title}`
                          : 'Partner Zone'}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePanToNode(b.partnerNode)}
                      className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-50 border border-bauhaus-ink text-bauhaus-ink text-[10px] font-mono font-bold flex items-center space-x-1 shrink-0 shadow-[1px_1px_0px_#171A21]"
                    >
                      <Crosshair className="w-3 h-3 text-bauhaus-blue" />
                      <span>Pan</span>
                    </button>
                  </div>

                  <div className="p-2 rounded bg-blue-50/60 border border-bauhaus-blue/20 text-[11px] text-bauhaus-ink leading-relaxed font-sans">
                    <span className="font-bold text-bauhaus-blue font-mono text-[10px] block mb-0.5">Mathematical Duality Reason:</span>
                    {b.reason}
                  </div>

                  <div className="p-2 rounded bg-amber-50/60 border border-bauhaus-amber/30 text-[11px] text-bauhaus-muted leading-relaxed font-sans">
                    <span className="font-bold text-bauhaus-amber font-mono text-[10px] block mb-0.5">Real-World Manifestation:</span>
                    {b.artifact}
                  </div>

                  <button
                    onClick={() =>
                      setLatestArtifact({
                        bridge_label: b.relationshipLabel,
                        real_world_artifact: b.artifact,
                      })
                    }
                    className="w-full py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-bauhaus-blue text-bauhaus-blue text-[10px] font-mono font-bold transition-all text-center"
                  >
                    View Real-World Isomorphism Artifact ↗
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 5: Primary Action - Take Milestone Challenge */}
        {!selectedConcept.is_hobby_anchor && !selectedConcept.isHobbyAnchor && (
          isNodeUnlocked(conceptId, nodes, edges) ? (
            <button
              onClick={() => openTwoTier(selectedConcept)}
              className="w-full py-3.5 px-4 rounded-xl bg-bauhaus-blue hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] hover:shadow-[4px_4px_0px_#171A21] hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
            >
              <GitBranch className="w-4 h-4 text-white" />
              <span>Take Milestone Challenge</span>
            </button>
          ) : (
            <div className="space-y-1.5">
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-xl bg-slate-200 border-2 border-slate-400 text-slate-500 font-mono font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Milestone Locked</span>
              </button>
              <div className="p-3 rounded-xl bg-red-50/70 border-2 border-bauhaus-red text-[11px] text-bauhaus-red font-mono font-bold leading-tight flex items-start space-x-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-bauhaus-red" />
                <span>
                  Complete foundational milestones (<strong>{getMissingPrerequisites(conceptId, nodes, edges).join(', ') || 'upstream concepts'}</strong>) to unlock this challenge.
                </span>
              </div>
            </div>
          )
        )}

        {/* SECTION 6: Tessella Concept Assistant (Collapsible) */}
        <section className="pt-2 border-t-2 border-bauhaus-ink">
          <button
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            className="w-full flex items-center justify-between py-2 text-xs font-mono uppercase tracking-wider text-bauhaus-ink font-bold hover:text-bauhaus-blue transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-bauhaus-amber" />
              <span>Tessella ({hobby})</span>
            </div>
            {isChatExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isChatExpanded && (
            <div className="mt-2.5 space-y-2.5">
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {messages.length === 0 && (
                  <p className="text-xs text-bauhaus-muted italic p-3 rounded-xl bg-white border-2 border-bauhaus-ink font-sans">
                    Ask Tess any question about {conceptTitle}. She will explain the core mechanism using analogies to {hobby}.
                  </p>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-bauhaus-ink text-white font-mono border-2 border-bauhaus-ink ml-4 shadow-[2px_2px_0px_rgba(0,0,0,0.25)]'
                        : 'bg-white border-2 border-bauhaus-ink text-bauhaus-ink mr-4 font-sans shadow-[2px_2px_0px_#171A21]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-[9px] font-mono text-bauhaus-muted mb-1 font-bold">
                      {msg.role === 'user' ? (
                        <User className="w-3 h-3 text-bauhaus-blue" />
                      ) : (
                        <Bot className="w-3 h-3 text-bauhaus-amber" />
                      )}
                      <span>{msg.role === 'user' ? 'You' : 'Tessella (Tess)'}</span>
                    </div>
                    {msg.content}
                  </div>
                ))}
                {isSending && (
                  <div className="p-3 rounded-xl bg-white border-2 border-bauhaus-ink text-xs font-mono text-bauhaus-muted flex items-center space-x-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-bauhaus-blue shrink-0" />
                    <span>{chatRotatingText}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder={`Ask Tess how this relates to ${hobby}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 rounded-xl border-2 border-bauhaus-ink bg-white px-3.5 py-2 text-xs font-mono text-bauhaus-ink placeholder-bauhaus-muted focus:outline-none focus:ring-2 focus:ring-bauhaus-blue"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="p-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};
