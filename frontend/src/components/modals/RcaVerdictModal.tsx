'use client';

import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  ShieldAlert,
  CheckCircle2,
  X,
  ArrowRight,
  RotateCcw,
  Wrench,
  Sparkles,
  Search,
  Puzzle,
  GitBranch,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useGraphStore } from '@/store/useGraphStore';
import { ConceptNodeData } from '@/lib/types';

export const RcaVerdictModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    rcaStage,
    rcaSuspectNodeId,
    rcaBayesianAttribution,
    selectedConcept,
    nodes,
    setSelectedNodeId,
    setSelectedConcept,
    openDrawer,
    resetRCA,
  } = useGraphStore();

  const [showAttributionDetails, setShowAttributionDetails] = useState(false);
  const reactFlow = useReactFlow();

  if (activeModal !== 'RCA_VERDICT') return null;

  const isConfirmed = rcaStage === 'ROOT_CAUSE_CONFIRMED';
  const suspectNode = nodes.find((n) => n.id === rcaSuspectNodeId);
  const suspectLabel = (suspectNode?.data?.label as string) || 'Upstream Prerequisite';
  const currentLabel = selectedConcept?.label || 'Current Concept';

  const handleJumpToRepair = () => {
    closeModal();
    if (suspectNode) {
      if (reactFlow?.setCenter) {
        reactFlow.setCenter(suspectNode.position.x + 115, suspectNode.position.y + 37, {
          zoom: 1.25,
          duration: 700,
        });
      }
      setSelectedNodeId(suspectNode.id);
      setSelectedConcept((suspectNode.data as unknown) as ConceptNodeData);
      openDrawer((suspectNode.data as unknown) as ConceptNodeData);
    }
  };

  const handleDismiss = () => {
    if (!isConfirmed) {
      resetRCA();
    }
    closeModal();
  };

  const candidateParents = rcaBayesianAttribution?.candidate_parents || [];
  const selectionRationale = rcaBayesianAttribution?.selection_rationale;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className={`relative w-full max-w-lg rounded-2xl border-2 p-6 transition-all bg-white/95 backdrop-blur-md max-h-[92vh] overflow-y-auto ${
          isConfirmed
            ? 'border-bauhaus-red shadow-[8px_8px_0px_#EF4444]'
            : 'border-bauhaus-blue shadow-[8px_8px_0px_#2563EB]'
        }`}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 text-bauhaus-muted hover:text-bauhaus-ink transition-colors p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Detective Verdict Icon Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] ${
              isConfirmed
                ? 'bg-amber-400 text-bauhaus-ink'
                : 'bg-emerald-300 text-bauhaus-ink'
            }`}
          >
            {isConfirmed ? (
              <Search className="w-5 h-5 text-bauhaus-ink" />
            ) : (
              <Sparkles className="w-5 h-5 text-bauhaus-ink" />
            )}
          </div>
          <div>
            <span
              className={`text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                isConfirmed
                  ? 'bg-amber-100 text-amber-900 border-amber-400'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-400'
              }`}
            >
              Detective Verdict // Mystery Solved
            </span>
            <h2 className="text-base font-black text-bauhaus-ink tracking-tight mt-0.5 font-mono">
              {isConfirmed
                ? 'Mystery Solved: Hidden Puzzle Piece Found!'
                : 'Clue Cleared: Foundation is Rock Solid!'}
            </h2>
          </div>
        </div>

        {/* Diagnosis Explanation Body */}
        <div className="p-4 rounded-xl bg-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-2 mb-4 leading-relaxed font-mono">
          {isConfirmed ? (
            <>
              <p className="text-xs text-bauhaus-ink font-bold">
                You didn&apos;t fail because of current chapter formulas! We found a hidden puzzle piece from an earlier zone in{' '}
                <strong className="text-amber-800 font-black underline decoration-amber-500 decoration-2">
                  ‘{suspectLabel}’
                </strong>
                .
              </p>
              <p className="text-[11px] text-bauhaus-muted font-sans italic">
                Because this foundational puzzle piece is slightly wobbly, the current milestone felt unstable. Tuning this foundational milestone first will make your whole quest path click into place!
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-bauhaus-ink font-bold">
                Your foundation in <strong className="text-bauhaus-blue font-black">‘{suspectLabel}’</strong> is completely solid!
              </p>
              <p className="text-[11px] text-bauhaus-muted font-sans italic">
                Your stumble was just a quick slip on <strong className="text-bauhaus-ink font-black">‘{currentLabel}’</strong> itself. No foundational damage detected—you&apos;re ready to conquer it!
              </p>
            </>
          )}
        </div>

        {/* Bayesian DAG Attribution Breakdown Card */}
        {candidateParents.length > 0 && (
          <div className="mb-5 rounded-xl border-2 border-bauhaus-ink bg-slate-50/80 p-3.5 shadow-[2px_2px_0px_#171A21] space-y-2">
            <div
              onClick={() => setShowAttributionDetails(!showAttributionDetails)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-bauhaus-blue" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-bauhaus-ink">
                  Bayesian Selection Process ({candidateParents.length} parents tested)
                </span>
              </div>
              <button
                type="button"
                className="text-bauhaus-muted hover:text-bauhaus-ink transition-colors p-0.5"
              >
                {showAttributionDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {selectionRationale && (
              <p className="text-[11px] font-sans text-bauhaus-muted leading-relaxed italic">
                {selectionRationale}
              </p>
            )}

            {showAttributionDetails && (
              <div className="space-y-1.5 pt-1 border-t border-slate-200">
                {candidateParents.map((cand: any) => {
                  const isSuspect = cand.status === 'SUSPECT_IDENTIFIED' || cand.node_id === rcaSuspectNodeId;
                  const probPct = Math.round((cand.attribution_probability || 0) * 100);
                  const priorPct = Math.round((cand.p_mastery || 0) * 100);

                  return (
                    <div
                      key={cand.node_id}
                      className={`p-2 rounded-lg border-2 text-xs font-mono transition-all flex flex-col gap-1 ${
                        isSuspect
                          ? 'border-red-600 bg-red-50/90 shadow-[2px_2px_0px_#EF4444]'
                          : 'border-slate-300 bg-white opacity-85'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isSuspect ? (
                            <Search className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className={isSuspect ? 'text-red-900' : 'text-slate-800'}>
                            {cand.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 font-bold">
                            Prior: {priorPct}% P(M)
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-black border ${
                              isSuspect
                                ? 'bg-red-200 text-red-950 border-red-500'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            {isSuspect ? `${probPct}% ATTRIBUTION` : `${probPct}% (RULED OUT)`}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-600 font-sans leading-tight">
                        {cand.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-bauhaus-ink">
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-bauhaus-muted hover:text-bauhaus-ink transition-colors"
          >
            {isConfirmed ? 'Dismiss for Now' : 'Dismiss & Try Again'}
          </button>

          {isConfirmed && (
            <button
              onClick={handleJumpToRepair}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_#F59E0B] hover:shadow-[4px_4px_0px_#F59E0B] hover:-translate-y-0.5 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Jump to Foundational Clue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
