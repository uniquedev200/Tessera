'use client';

import React, { useState, useEffect } from 'react';
import {
  Timer,
  AlertOctagon,
  Flame,
  CheckCircle,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGraphStore } from '@/store/useGraphStore';
import { api } from '@/lib/api';

export const AntiJargonCountdownModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    selectedConcept,
    userProfile,
    antiJargonFlaggedWord,
    antiJargonTimeLeft,
    tickAntiJargonTimer,
    loadUserGraph,
  } = useGraphStore();

  const [explanation, setExplanation] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ passed: boolean; reason: string } | null>(null);

  // 45-second countdown timer interval
  useEffect(() => {
    if (activeModal !== 'ANTI_JARGON' || antiJargonTimeLeft <= 0) return;

    const timer = setInterval(() => {
      tickAntiJargonTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [activeModal, antiJargonTimeLeft, tickAntiJargonTimer]);

  if (activeModal !== 'ANTI_JARGON' || !selectedConcept) return null;

  const isExpired = antiJargonTimeLeft <= 0;
  const progressPercent = Math.max(0, (antiJargonTimeLeft / 45) * 100);

  const handleVerify = async () => {
    if (!explanation.trim() || isExpired || !userProfile?.id || isVerifying) return;
    setIsVerifying(true);
    setFeedback(null);

    try {
      const res = await api.verifyAntiJargon({
        user_id: userProfile.id,
        concept_id: selectedConcept.id,
        student_explanation: explanation.trim(),
        flagged_word: antiJargonFlaggedWord || '',
      });

      setFeedback({ passed: res.passed, reason: res.reason });
      if (res.passed) {
        confetti({ particleCount: 50, spread: 50 });
      }
      await loadUserGraph(userProfile.id);
    } catch (err: any) {
      setFeedback({ passed: false, reason: err.message || 'Verification error' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border-2 border-bauhaus-ink bg-white/95 backdrop-blur-md p-6 shadow-[8px_8px_0px_#171A21]">
        {/* Close button only visible once verified or expired */}
        {(isExpired || feedback?.passed) && (
          <button
            onClick={closeModal}
            className="absolute top-5 right-5 text-bauhaus-muted hover:text-bauhaus-ink transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header with Anti-Jargon Siren */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-bauhaus-red text-white flex items-center justify-center border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21]">
            <AlertOctagon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-bauhaus-red font-bold px-2 py-0.5 rounded-full bg-bauhaus-red/10 border border-bauhaus-red">
              [Lexical Masking Intercepted]
            </span>
            <h2 className="text-lg font-black text-bauhaus-ink mt-0.5 font-mono">
              Anti-Jargon Invariant Verification
            </h2>
          </div>
        </div>

        {/* Flagged word notice */}
        <div className="mb-4 p-3.5 rounded-xl bg-bauhaus-amber/10 border-2 border-bauhaus-amber shadow-[3px_3px_0px_#F59E0B]">
          <p className="text-xs text-bauhaus-ink leading-relaxed font-sans">
            You used the textbook label <strong className="text-bauhaus-ink font-mono font-black uppercase underline decoration-bauhaus-amber decoration-2">&apos;{antiJargonFlaggedWord}&apos;</strong>.
            True understanding does not hide behind memorized vocabulary. In plain physical action verbs, explain what is physically pushing what across that gap.
          </p>
        </div>

        {/* 45-Second Countdown Timer Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="flex items-center space-x-1.5 text-bauhaus-ink font-bold">
              <Timer className="w-4 h-4 text-bauhaus-amber" />
              <span>Time Remaining:</span>
            </span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded-md border-2 ${
                antiJargonTimeLeft < 10
                  ? 'bg-bauhaus-red/15 text-bauhaus-red border-bauhaus-red animate-pulse'
                  : 'bg-white text-bauhaus-ink border-bauhaus-ink shadow-[1px_1px_0px_#171A21]'
              }`}
            >
              {antiJargonTimeLeft}s
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 border border-bauhaus-ink overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                antiJargonTimeLeft < 10
                  ? 'bg-bauhaus-red'
                  : antiJargonTimeLeft < 25
                  ? 'bg-bauhaus-amber'
                  : 'bg-bauhaus-green'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Text Area */}
        <div className="mb-4">
          <textarea
            rows={3}
            disabled={isExpired || isVerifying || (feedback?.passed ?? false)}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Focus strictly on physical action verbs: 'pushes', 'collides', 'drags', 'resists', 'heats'..."
            className="w-full rounded-xl border-2 border-bauhaus-ink bg-white px-3.5 py-2.5 text-xs font-mono text-bauhaus-ink placeholder-bauhaus-muted focus:outline-none focus:ring-2 focus:ring-bauhaus-red disabled:opacity-40"
          />
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`mb-4 p-3.5 rounded-xl border-2 text-xs font-mono shadow-[2px_2px_0px_#171A21] ${
              feedback.passed
                ? 'bg-green-50/70 border-bauhaus-green text-bauhaus-green font-bold'
                : 'bg-red-50/70 border-bauhaus-red text-bauhaus-red font-bold'
            }`}
          >
            <div className="font-bold flex items-center space-x-1.5 mb-1">
              {feedback.passed ? (
                <>
                  <CheckCircle className="w-4 h-4 text-bauhaus-green" />
                  <span>Sub-Second Evaluation Passed! Mastery Awarded.</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-bauhaus-red" />
                  <span>Action Verb Check Incomplete</span>
                </>
              )}
            </div>
            <p className="font-normal font-sans text-bauhaus-ink mt-1">{feedback.reason}</p>
          </div>
        )}

        {isExpired && !feedback && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50/70 border-2 border-bauhaus-red text-xs font-mono text-bauhaus-red font-bold">
            Time expired! Epistemic state recorded. Please review the physical mechanisms and try again.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-bauhaus-ink">
          {feedback?.passed ? (
            <button
              onClick={closeModal}
              className="px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] transition-all ml-auto"
            >
              Continue Learning
            </button>
          ) : isExpired ? (
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-bauhaus-ink font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] ml-auto"
            >
              Close
            </button>
          ) : (
            <>
              <span className="text-[11px] font-mono text-bauhaus-muted font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-bauhaus-amber" />
                <span>Plain physical action verbs required</span>
              </span>

              <button
                onClick={handleVerify}
                disabled={isExpired || !explanation.trim() || isVerifying}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-40"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Evaluating Verbs...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-bauhaus-amber" />
                    <span>Verify Action Verbs</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
