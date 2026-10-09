'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Lock,
  GitBranch,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGraphStore } from '@/store/useGraphStore';
import { api } from '@/lib/api';
import { TwoTierQuestionPayload } from '@/lib/types';
import { useRotatingMessages } from '@/lib/useRotatingMessages';

export const TwoTierModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    selectedConcept,
    userProfile,
    loadUserGraph,
    setAntiJargon,
    startRCAPipeline,
    currentQuestion,
    setCurrentQuestion,
  } = useGraphStore();

  const [question, setQuestion] = useState<TwoTierQuestionPayload | null>(null);
  const [currentPhase, setCurrentPhase] = useState<1 | 2>(1);
  const [tier1Index, setTier1Index] = useState<number | null>(null);
  const [tier2OptionId, setTier2OptionId] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<string | null>(null);

  const questionLoadingRotatingText = useRotatingMessages(
    useMemo(
      () => [
        'Analyzing causal DAG prerequisite invariants...',
        'Formulating Treagust phenomenological prediction scenario...',
        'Synthesizing mechanistic causal justifications...',
        'Injecting upstream invariant distractor traps...',
        'Calibrating two-tier diagnostic gauntlet...',
      ],
      []
    ),
    1200,
    isLoadingQuestion
  );

  const submittingRotatingText = useRotatingMessages(
    useMemo(
      () => [
        'Evaluating prediction against core invariants...',
        'Updating Bayesian Knowledge Tracing priors...',
        'Testing 3-Gate Root Cause attribution...',
        'Finalizing epistemic state update...',
      ],
      []
    ),
    1100,
    isSubmitting
  );

  useEffect(() => {
    if (activeModal === 'TWO_TIER' && selectedConcept && userProfile?.id) {
      setCurrentPhase(1);
      setTier1Index(null);
      setTier2OptionId(null);
      setFreeText('');
      setEvaluationResult(null);
      setIsSubmitted(false);

      if (currentQuestion && currentQuestion.target_concept_id === selectedConcept.id) {
        setQuestion(currentQuestion);
      } else {
        setIsLoadingQuestion(true);
        api
          .getQuestion(selectedConcept.id, userProfile.id)
          .then((q) => {
            setQuestion(q);
            setCurrentQuestion(q);
          })
          .catch((err) => console.error(err))
          .finally(() => setIsLoadingQuestion(false));
      }
    }
  }, [activeModal, selectedConcept, userProfile]);

  if (activeModal !== 'TWO_TIER' || !selectedConcept) return null;

  const handleSelectTier1 = (idx: number) => {
    setTier1Index(idx);
    // Smooth transition to Phase 2
    setTimeout(() => {
      setCurrentPhase(2);
    }, 280);
  };

  const handleSubmit = async () => {
    if (tier1Index === null || !tier2OptionId || !userProfile?.id || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setIsSubmitted(true); // Instantly lock out duplicate clicks
    setEvaluationResult(null);

    try {
      const res = await api.evaluateSubmission({
        user_id: userProfile.id,
        concept_id: selectedConcept.id,
        tier_1_selected_index: tier1Index,
        tier_2_selected_option_id: tier2OptionId,
        free_text_explanation: freeText.trim() || undefined,
      });

      // 1. Check Anti-Jargon Precondition Required
      if (res.requires_anti_jargon_probe && res.flagged_word) {
        closeModal();
        setCurrentQuestion(null);
        setAntiJargon(res.flagged_word, res.time_limit_seconds || 45);
        return;
      }

      // 2. Check 3-Gate Agentic RCA Triggered
      const rcaData = res.rca
        ? {
            ...res.rca,
            bayesian_attribution: res.bayesian_attribution || res.rca.bayesian_attribution || res.micro_probe?.bayesian_attribution,
          }
        : res.rca_triggered
        ? {
            rca_triggered: true,
            blame_node_id: res.blame_node_id,
            path_node_ids: res.active_trace_path || [],
            path_edge_ids: [],
            micro_probe: res.micro_probe,
            diagnostic_summary: 'Upstream invariant violation triggered agentic backtracking.',
            bayesian_attribution: res.bayesian_attribution || res.micro_probe?.bayesian_attribution,
          }
        : null;

      if (rcaData && rcaData.rca_triggered) {
        // Modal closes immediately so the student watches the red trace fire across the DAG!
        closeModal();
        setCurrentQuestion(null);
        await startRCAPipeline(rcaData);
        return;
      }

      // 3. Normal Result Handling
      if (res.tier_1_passed && res.tier_2_passed) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setEvaluationResult('Passed! Both prediction and mechanistic invariant verified.');
        setTimeout(async () => {
          await loadUserGraph(userProfile.id);
          closeModal();
          setCurrentQuestion(null);
        }, 1200);
      } else {
        setEvaluationResult('Evaluation complete: Local misconception recorded on this concept.');
        await loadUserGraph(userProfile.id);
        setTimeout(async () => {
          closeModal();
          setCurrentQuestion(null);
        }, 1800);
      }
    } catch (err: any) {
      setEvaluationResult('Error submitting assessment: ' + err.message);
      setIsSubmitted(false); // Only allow retry if there was an actual network error
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTier1Text = (question && tier1Index !== null)
    ? question.tier_1_options[tier1Index]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-bauhaus-ink bg-white/95 backdrop-blur-md p-6 shadow-[8px_8px_0px_#171A21] max-h-[92vh] overflow-y-auto">
        <button
          onClick={closeModal}
          className="absolute top-5 right-5 text-bauhaus-muted hover:text-bauhaus-ink transition-colors p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Diagnostic Gauntlet Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-bauhaus-ink text-white flex items-center justify-center border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21]">
            <ShieldCheck className="w-5 h-5 text-bauhaus-green" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-bauhaus-blue font-bold px-2 py-0.5 rounded-full bg-bauhaus-blue/10 border border-bauhaus-blue">
                Treagust Diagnostic Gauntlet
              </span>
              <span className="text-[10px] font-mono text-bauhaus-muted font-bold">
                Phase {currentPhase} of 2
              </span>
            </div>
            <h2 className="text-lg font-black text-bauhaus-ink tracking-tight mt-0.5 font-mono">
              {selectedConcept.label}
            </h2>
          </div>
        </div>

        {/* Phase Progress Bar */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div
            onClick={() => setCurrentPhase(1)}
            className={`cursor-pointer p-3 rounded-xl border-2 text-left transition-all ${
              currentPhase === 1
                ? 'border-bauhaus-blue bg-bauhaus-blue/10 shadow-[3px_3px_0px_#2563EB]'
                : 'border-bauhaus-ink bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#171A21]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-bauhaus-blue">
                Tier 1: Prediction
              </span>
              {tier1Index !== null && (
                <span className="w-2 h-2 rounded-full bg-bauhaus-green animate-pulse" />
              )}
            </div>
            <p className="text-[11px] font-bold text-bauhaus-ink truncate font-mono">
              {tier1Index !== null ? selectedTier1Text : 'Predict observable outcome'}
            </p>
          </div>

          <div
            onClick={() => tier1Index !== null && setCurrentPhase(2)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              tier1Index === null
                ? 'border-slate-300 bg-slate-100 opacity-60 cursor-not-allowed'
                : currentPhase === 2
                ? 'border-bauhaus-blue bg-bauhaus-blue/10 shadow-[3px_3px_0px_#2563EB] cursor-pointer'
                : 'border-bauhaus-ink bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#171A21] cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-bauhaus-blue">
                Tier 2: Causal Driver
              </span>
              {tier2OptionId !== null && (
                <span className="w-2 h-2 rounded-full bg-bauhaus-blue" />
              )}
            </div>
            <p className="text-[11px] font-bold text-bauhaus-ink truncate font-mono">
              {tier2OptionId ? 'Mechanistic justification locked' : 'Verify physical reasoning'}
            </p>
          </div>
        </div>

        {isLoadingQuestion ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2.5 text-center px-4">
            <Loader2 className="w-8 h-8 animate-spin text-bauhaus-blue" />
            <p className="text-xs text-bauhaus-ink font-mono font-bold">
              {questionLoadingRotatingText}
            </p>
          </div>
        ) : question ? (
          <div className="space-y-4">
            {/* PHASE 1: Observable Phenomenon Prediction */}
            {currentPhase === 1 && (
              <div className="p-4 rounded-xl bg-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wide text-bauhaus-blue font-bold">
                    <Zap className="w-4 h-4 text-bauhaus-blue" />
                    <span>Predict Applied Outcome</span>
                  </div>
                  <span className="text-[10px] font-mono text-bauhaus-muted font-bold">Step 1 of 2</span>
                </div>

                <p className="text-xs font-bold text-bauhaus-ink leading-relaxed font-sans">
                  {question.tier_1_scenario}
                </p>

                <div className="space-y-2 pt-1">
                  {question.tier_1_options.map((opt, idx) => {
                    const isSelected = tier1Index === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectTier1(idx)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-mono border-2 transition-all ${
                          isSelected
                            ? 'border-bauhaus-blue bg-bauhaus-blue/15 text-bauhaus-ink ring-2 ring-bauhaus-blue shadow-[3px_3px_0px_#2563EB]'
                            : 'border-bauhaus-ink bg-white text-bauhaus-ink hover:bg-slate-50 shadow-[2px_2px_0px_#171A21]'
                        }`}
                      >
                        <span className="font-mono text-bauhaus-blue font-black mr-2">
                          [{String.fromCharCode(65 + idx)}]
                        </span>
                        <span className="font-medium">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PHASE 2: Mechanistic Causal Justification */}
            {currentPhase === 2 && (
              <div className="space-y-3.5 animate-fadeIn">
                {/* Locked Tier 1 Summary Card */}
                <div className="p-3 rounded-xl bg-bauhaus-blue/10 border-2 border-bauhaus-blue shadow-[2px_2px_0px_#2563EB] flex items-center justify-between">
                  <div className="overflow-hidden pr-2">
                    <span className="text-[9px] font-mono text-bauhaus-blue font-bold uppercase tracking-wider block">
                      Locked Prediction (Phase 1):
                    </span>
                    <span className="text-xs font-bold text-bauhaus-ink truncate block font-mono">
                      {selectedTier1Text}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPhase(1)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-bauhaus-ink text-bauhaus-ink text-[10px] font-mono font-bold shrink-0 shadow-[1px_1px_0px_#171A21] transition-colors"
                  >
                    Change
                  </button>
                </div>

                {/* Tier 2 Justifications */}
                <div className="p-4 rounded-xl bg-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wide text-bauhaus-ink font-bold">
                      <GitBranch className="w-4 h-4 text-bauhaus-blue" />
                      <span>Mechanistic Causal Driver</span>
                    </div>
                    <span className="text-[10px] font-mono text-bauhaus-muted font-bold">Step 2 of 2</span>
                  </div>

                  <p className="text-xs font-bold text-bauhaus-ink leading-relaxed font-sans">
                    Which physical reasoning directly drives your Phase 1 prediction?
                  </p>

                  {!question.tier_2_justifications.some((opt) => opt.error_type === 'UPSTREAM_INVARIANT_VIOLATION') && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-blue-50/70 border-2 border-bauhaus-blue text-[11px] text-bauhaus-ink flex items-start gap-2 font-mono">
                      <span className="font-bold text-bauhaus-blue shrink-0">ℹ Note:</span>
                      <span>This node is a foundational root with no upstream parents in the DAG. All distractors here are local. To trigger Agentic DAG Backtracking, test a downstream node (e.g. <em>Electric Current</em> or <em>Drift Velocity</em>).</span>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-1">
                    {question.tier_2_justifications.map((opt) => {
                      const isSelected = tier2OptionId === opt.option_id;
                      const isUpstream = opt.error_type === 'UPSTREAM_INVARIANT_VIOLATION';
                      const isLocal = opt.error_type === 'LOCAL_MISCONCEPTION';
                      const isCorrect = opt.is_correct;

                      return (
                        <button
                          key={opt.option_id}
                          type="button"
                          onClick={() => setTier2OptionId(opt.option_id)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-xs font-mono border-2 transition-all ${
                            isSelected
                              ? 'border-bauhaus-blue bg-bauhaus-blue/15 text-bauhaus-ink ring-2 ring-bauhaus-blue shadow-[3px_3px_0px_#2563EB]'
                              : 'border-bauhaus-ink bg-white text-bauhaus-ink hover:bg-slate-50 shadow-[2px_2px_0px_#171A21]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="leading-relaxed flex-1 font-medium">{opt.text}</span>
                            {isUpstream && (
                              <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-bauhaus-red/15 border-2 border-bauhaus-red text-bauhaus-red flex items-center gap-1 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-bauhaus-red animate-pulse" />
                                Upstream RCA Trigger
                              </span>
                            )}
                            {isLocal && (
                              <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-bauhaus-amber/15 border-2 border-bauhaus-amber text-bauhaus-amber">
                                Local Misconception
                              </span>
                            )}
                            {isCorrect && (
                              <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-bauhaus-green/15 border-2 border-bauhaus-green text-bauhaus-green">
                                Correct Invariant
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Free-Text Explanation with Anti-Jargon Monitor (COMPULSORY) */}
                <div className="p-3.5 rounded-xl bg-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-bauhaus-ink font-mono flex items-center gap-1.5">
                      <span>Operational Mechanism (Plain Verbs)</span>
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-400 uppercase">
                        Compulsory
                      </span>
                    </label>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      freeText.trim().length >= 3
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                    }`}>
                      {freeText.trim().length >= 3 ? '✓ Explanation Ready' : '• Input Required'}
                    </span>
                  </div>
                  <p className="text-[11px] text-bauhaus-muted leading-snug font-sans">
                    Explain using physical action verbs (pushes, collides, drags, heats). Avoid textbook jargon (
                    {selectedConcept.jargon_blacklist?.slice(0, 3).join(', ')}).
                  </p>
                  <textarea
                    rows={2}
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="Describe the physical interactions without formal textbook vocabulary (mandatory to submit)..."
                    className="w-full rounded-xl border-2 border-bauhaus-ink bg-white px-3 py-2 text-xs font-mono text-bauhaus-ink placeholder-bauhaus-muted focus:outline-none focus:ring-2 focus:ring-bauhaus-blue"
                  />
                  {freeText.trim().length === 0 && (
                    <p className="text-[10px] font-mono text-amber-700 font-bold flex items-center gap-1 pt-0.5">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Enter your plain action-verb explanation above to unlock submission.</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {evaluationResult && (
              <div className="p-3.5 rounded-xl bg-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] text-xs font-mono font-bold text-bauhaus-ink flex items-center space-x-2 animate-fadeIn">
                <Sparkles className="w-4 h-4 text-bauhaus-blue shrink-0" />
                <span>{evaluationResult}</span>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t-2 border-bauhaus-ink">
              {currentPhase === 2 ? (
                <button
                  type="button"
                  onClick={() => setCurrentPhase(1)}
                  className="flex items-center space-x-1 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-bauhaus-muted hover:text-bauhaus-ink transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Phase 1</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-bauhaus-muted hover:text-bauhaus-ink"
                >
                  Cancel
                </button>
              )}

              {currentPhase === 1 ? (
                <button
                  type="button"
                  onClick={() => tier1Index !== null && setCurrentPhase(2)}
                  disabled={tier1Index === null}
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-40"
                >
                  <span>Continue to Causal Driver</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : isSubmitted && !isSubmitting ? (
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all"
                >
                  <span>Close Diagnostic</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={tier1Index === null || !tier2OptionId || freeText.trim().length === 0 || isSubmitting || isSubmitted}
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-40"
                  title={freeText.trim().length === 0 ? 'Explain mechanism in plain verbs to enable submission' : undefined}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>{submittingRotatingText}</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Diagnostic Gauntlet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
