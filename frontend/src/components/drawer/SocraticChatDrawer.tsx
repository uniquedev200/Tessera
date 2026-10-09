'use client';

import React, { useState } from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Bot,
  User,
  GitBranch,
} from 'lucide-react';
import { useGraphStore } from '@/store/useGraphStore';
import { api } from '@/lib/api';
import { ChatMessage } from '@/lib/types';
import { useRotatingMessages } from '@/lib/useRotatingMessages';

export const SocraticChatDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    closeDrawer,
    selectedConcept,
    userProfile,
    openTwoTier,
  } = useGraphStore();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

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

  if (!isDrawerOpen || !selectedConcept) return null;

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
        concept_id: selectedConcept.id,
        message: userMsg.content,
        conversation_history: updatedHistory,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply },
      ]);
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
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col animate-slideLeft">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
              Cognitive Inspection Drawer
            </span>
            <h3 className="text-base font-bold text-white leading-tight">
              {selectedConcept.label}
            </h3>
          </div>
        </div>
        <button
          onClick={closeDrawer}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Concept Insights Cards */}
      <div className="p-5 space-y-4 overflow-y-auto flex-1">
        {/* 1. Core Invariant */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wide text-blue-400 font-bold mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>The Fundamental Invariant</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {selectedConcept.core_invariant}
          </p>
        </div>

        {/* 2. Hobby Anchor Bridge */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 to-slate-950 border border-purple-500/40 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wide text-purple-300 font-bold mb-1.5">
            <Compass className="w-4 h-4 text-purple-400" />
            <span>How This Mirrors {hobby}</span>
          </div>
          <p className="text-xs text-purple-100 leading-relaxed">
            In {hobby}, this behaves just like balancing gain staging or kinetic momentum: charge does not magically multiply; it drifts under steady drag until potential equilibrium is reached.
          </p>
        </div>

        {/* 3. Status & Active Misconceptions */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wide text-slate-400 font-bold">
              BKT Epistemic State
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                selectedConcept.status === 'MASTERED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                  : selectedConcept.status === 'FRAGILE'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {selectedConcept.status} (P(M): {Math.round(selectedConcept.p_mastery * 100)}%)
            </span>
          </div>

          {selectedConcept.active_misconceptions && selectedConcept.active_misconceptions.length > 0 ? (
            <div className="mt-2 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Detected Misconceptions:</span>
              </span>
              {selectedConcept.active_misconceptions.map((m, idx) => (
                <div key={idx} className="text-[11px] text-amber-200/90 pl-4 border-l-2 border-amber-500">
                  {m.label || m.reason || 'Causal inversion'}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">No active misconceptions recorded.</p>
          )}
        </div>

        {/* Action: Verify Understanding Button */}
        {!selectedConcept.is_hobby_anchor && (
          <button
            onClick={() => openTwoTier(selectedConcept)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <GitBranch className="w-4 h-4" />
            <span>Verify Understanding (Two-Tier Diagnostic)</span>
          </button>
        )}

        {/* Socratic Assistant Chat Stream */}
        <div className="pt-3 border-t border-slate-800">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center space-x-1.5">
            <Bot className="w-4 h-4 text-purple-400" />
            <span>Socratic Concept Assistant</span>
          </div>

          <div className="space-y-3 mb-3 max-h-56 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                Ask any question about this mechanism. The tutor will answer using analogies to {hobby}.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-950/60 border border-blue-800/60 text-blue-100 ml-4'
                    : 'bg-purple-950/40 border border-purple-800/50 text-purple-100 mr-4'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 mb-1">
                  {msg.role === 'user' ? <User className="w-3 h-3 text-blue-400" /> : <Bot className="w-3 h-3 text-purple-400" />}
                  <span>{msg.role === 'user' ? 'You' : 'Socratic Tutor'}</span>
                </div>
                {msg.content}
              </div>
            ))}
            {isSending && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400 shrink-0" />
                <span>{chatRotatingText}</span>
              </div>
            )}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder={`Ask how this relates to ${hobby}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
