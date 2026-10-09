'use client';

import React, { useState, useEffect } from 'react';
import {
  Timer,
  Zap,
  Search,
  GitBranch,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useGraphStore } from '@/store/useGraphStore';

export const RcaMicroProbeModal: React.FC = () => {
  const {
    activeModal,
    selectedConcept,
    rcaMicroProbe,
    rcaSuspectNodeId,
    rcaBayesianAttribution,
    nodes,
    submitMicroProbeAnswer,
  } = useGraphStore();

  const [timeLeft, setTimeLeft] = useState(15);
  const [showAttributionDetails, setShowAttributionDetails] = useState(true);
  const totalTime = 15;

  useEffect(() => {
    if (activeModal === 'RCA_MICRO_PROBE') {
      setTimeLeft(totalTime);
    }
  }, [activeModal]);

  // 15-second High-Tension Countdown
  useEffect(() => {
    if (activeModal !== 'RCA_MICRO_PROBE') return;

    if (timeLeft <= 0) {
      // Automatic fail on timeout
      submitMicroProbeAnswer(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeModal, timeLeft, submitMicroProbeAnswer]);

  if (activeModal !== 'RCA_MICRO_PROBE' || !rcaMicroProbe) return null;

  const currentConceptLabel = selectedConcept?.label || 'Current Concept';
  const suspectNode = nodes.find((n) => n.id === (rcaMicroProbe.suspect_node_id || rcaSuspectNodeId));
  const suspectLabel = rcaMicroProbe.suspect_label || (suspectNode?.data?.label as string) || 'Foundational Invariant';

  const bayesianAttribution = rcaMicroProbe.bayesian_attribution || rcaBayesianAttribution;
  const candidateParents = bayesianAttribution?.candidate_parents || [];
  const selectionRationale = bayesianAttribution?.selection_rationale;

  const progressPercent = Math.max(0, (timeLeft / totalTime) * 100);

  const scenarioText =
    rcaMicroProbe.scenario ||
    rcaMicroProbe.question ||
    'A balanced system doubles its barrier resistance. Does steady-state throughput halve or double?';

  // Normalize options
  const options = (rcaMicroProbe.options || []).map((opt: any, idx: number) => {
    if (typeof opt === 'string') {
      return {
        id: `opt_${idx}`,
        text: opt,
        is_correct: idx === (rcaMicroProbe.correct_index ?? 0),
      };
    }
    return {
      id: opt.id || `opt_${idx}`,
      text: opt.text || opt.label || 'Option',
      is_correct: Boolean(opt.is_correct ?? (idx === rcaMicroProbe.correct_index)),
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-bauhaus-ink bg-white/95 backdrop-blur-md p-6 shadow-[8px_8px_0px_#171A21] max-h-[92vh] overflow-y-auto">
        {/* Detective Clue Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-bauhaus-ink flex items-center justify-center border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21]">
              <Search className="w-5 h-5 text-bauhaus-ink" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-bauhaus-blue font-bold px-2 py-0.5 rounded-full bg-blue-100 border border-blue-400">
                  Detective Mode
                </span>
                <span className="text-[10px] font-mono text-bauhaus-muted font-bold">15-Second Clue Check</span>
              </div>
              <h2 className="text-base font-black text-bauhaus-ink mt-0.5 font-mono">
                Root Cause Analysis // Foundation Puzzle Check
              </h2>
            </div>
          </div>

          {/* 15s Countdown Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-100 border-2 border-bauhaus-ink text-bauhaus-ink font-mono text-xs font-bold shrink-0 shadow-[1px_1px_0px_#171A21]">
            <Timer className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Detective Attribution Context */}
        <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-bauhaus-ink text-xs text-bauhaus-ink mb-4 leading-relaxed font-mono shadow-[2px_2px_0px_#171A21]">
          We detected an upstream foundation gap! Your error on <strong className="text-bauhaus-ink font-black">‘{currentConceptLabel}’</strong> traces back to <strong className="text-amber-800 font-black">‘{suspectLabel}’</strong>. Solve this 15-second zero-context clue to confirm:
        </div>

        {/* 15s Countdown Visual Progress Bar */}
        <div className="h-2 w-full bg-slate-100 rounded-full border border-bauhaus-ink overflow-hidden mb-4">
          <div
            className="h-full bg-bauhaus-amber transition-all duration-1000 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Bayesian DAG Selection Breakdown Card (Transparent Parent Evaluation) */}
        {candidateParents.length > 0 && (
          <div className="mb-4 rounded-xl border-2 border-bauhaus-ink bg-slate-50/80 p-3.5 shadow-[2px_2px_0px_#171A21] space-y-2">
            <div
              onClick={() => setShowAttributionDetails(!showAttributionDetails)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-bauhaus-blue" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-bauhaus-ink">
                  Bayesian DAG Parent Selection Logic ({candidateParents.length} candidates evaluated)
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
                            {isSuspect ? `${probPct}% MATCH (TARGET)` : `${probPct}% (EXCLUDED)`}
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

        {/* Zero-Context Intuitive Scenario */}
        <div className="p-4 rounded-xl bg-white border-2 border-bauhaus-ink mb-4 space-y-1.5 shadow-[3px_3px_0px_#171A21]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-bauhaus-amber font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-bauhaus-amber" />
            <span>Gate 3 Zero-Context Invariant Verification</span>
          </span>
          <p className="text-xs font-bold text-bauhaus-ink leading-relaxed font-sans">
            {scenarioText}
          </p>
        </div>

        {/* Rapid Options (1 click submits) */}
        <div className="space-y-2.5">
          {options.map((opt: any, idx: number) => (
            <button
              key={opt.id}
              onClick={() => submitMicroProbeAnswer(opt.is_correct)}
              className="w-full text-left p-3.5 rounded-xl border-2 border-bauhaus-ink bg-white hover:bg-red-50/50 hover:border-bauhaus-red shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] text-xs font-mono font-bold text-bauhaus-ink transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-bauhaus-red group-hover:text-white border border-bauhaus-ink text-[10px] font-mono font-black flex items-center justify-center text-bauhaus-ink shrink-0 transition-colors">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
