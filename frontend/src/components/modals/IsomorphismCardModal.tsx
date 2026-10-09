'use client';

import React from 'react';
import { Sparkles, X, Compass, ExternalLink } from 'lucide-react';
import { useGraphStore } from '@/store/useGraphStore';

export const IsomorphismCardModal: React.FC = () => {
  const { activeModal, closeModal, latestArtifact } = useGraphStore();

  if (activeModal !== 'ISOMORPHISM_CARD' || !latestArtifact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-bauhaus-blue bg-white/95 backdrop-blur-md p-6 shadow-[8px_8px_0px_#2563EB]">
        <button
          onClick={closeModal}
          className="absolute top-5 right-5 text-bauhaus-muted hover:text-bauhaus-ink transition-colors p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-bauhaus-blue text-white flex items-center justify-center border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-bauhaus-blue font-bold px-2 py-0.5 rounded-full bg-bauhaus-blue/10 border border-bauhaus-blue">
              Phase 3: Structural Isomorphism
            </span>
            <h2 className="text-base font-black text-bauhaus-ink mt-0.5 font-mono">Cross-Chapter Real-World Artifact</h2>
          </div>
        </div>

        <div className="mb-4 px-3 py-1.5 rounded-xl bg-white border-2 border-bauhaus-ink inline-block shadow-[2px_2px_0px_#171A21]">
          <span className="text-xs font-mono font-bold text-bauhaus-ink">
            {latestArtifact.bridge_label}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border-2 border-bauhaus-ink mb-5 shadow-[3px_3px_0px_#171A21] space-y-2">
          <div className="text-xs font-bold text-bauhaus-blue uppercase font-mono tracking-wider flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-bauhaus-amber" />
            <span>The Shared Physical Invariant</span>
          </div>
          <p className="text-xs text-bauhaus-ink leading-relaxed font-sans font-medium">
            {latestArtifact.real_world_artifact}
          </p>
        </div>

        <div className="flex items-center justify-end pt-3 border-t-2 border-bauhaus-ink">
          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all"
          >
            Explore Weaved Graph
          </button>
        </div>
      </div>
    </div>
  );
};
