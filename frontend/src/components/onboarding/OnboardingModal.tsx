'use client';

import React, { useState } from 'react';
import {
  Music,
  Gamepad2,
  UtensilsCrossed,
  Activity,
  TrendingUp,
  Terminal,
  Compass,
  ArrowRight,
  BrainCircuit,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useGraphStore } from '@/store/useGraphStore';
import { useRotatingMessages } from '@/lib/useRotatingMessages';

const HOBBY_TILES = [
  {
    id: 'Music Production',
    label: 'Music & Audio Production',
    icon: <Music className="w-5 h-5 text-purple-400" />,
    subtext: 'Frequencies, gain stages, acoustics, harmonic resonance',
    badge: 'Wave Mechanics',
  },
  {
    id: 'Competitive Gaming',
    label: 'Competitive Gaming / Esports',
    icon: <Gamepad2 className="w-5 h-5 text-emerald-400" />,
    subtext: 'Cooldowns, resource economies, hitboxes, latency compensation',
    badge: 'Dynamic Systems',
  },
  {
    id: 'Culinary Arts',
    label: 'Culinary Arts & Baking',
    icon: <UtensilsCrossed className="w-5 h-5 text-orange-400" />,
    subtext: 'Emulsions, heat transfer rates, phase changes, fermentation',
    badge: 'Thermodynamics',
  },
  {
    id: 'Sports & Biomechanics',
    label: 'Sports & Biomechanics',
    icon: <Activity className="w-5 h-5 text-blue-400" />,
    subtext: 'Torque vectors, kinetic chains, elasticity, stamina recovery',
    badge: 'Classical Mechanics',
  },
  {
    id: 'Market Trading',
    label: 'Trading & Market Dynamics',
    icon: <TrendingUp className="w-5 h-5 text-green-400" />,
    subtext: 'Order books, liquidity pools, supply/demand equilibria, momentum',
    badge: 'Stochastic Flux',
  },
  {
    id: 'Software Systems',
    label: 'Software & Distributed Systems',
    icon: <Terminal className="w-5 h-5 text-cyan-400" />,
    subtext: 'Throughput bottlenecks, queues, memory leaks, backpressure',
    badge: 'Flow Conservation',
  },
];

export const OnboardingModal: React.FC<{ isOpen: boolean; onComplete: () => void }> = ({
  isOpen,
  onComplete,
}) => {
  const { userProfile, setUserProfile, updateUserHobby, loadUserGraph } = useGraphStore();
  const [selectedHobby, setSelectedHobby] = useState(userProfile?.hobby_anchor || 'Music Production');
  const [customHobby, setCustomHobby] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosenHobby = customHobby.trim() || selectedHobby;
  const onboardingRotatingText = useRotatingMessages(
    React.useMemo(
      () => [
        'Constructing cognitive world model...',
        `Grounding mental models in ${chosenHobby}...`,
        'Synthesizing epistemic prior distributions...',
        'Mounting Bauhaus studio workspace...',
      ],
      [chosenHobby]
    ),
    1100,
    isSubmitting
  );

  React.useEffect(() => {
    if (userProfile?.hobby_anchor) {
      setSelectedHobby(userProfile.hobby_anchor);
    }
  }, [userProfile?.hobby_anchor, isOpen]);

  if (!isOpen) return null;

  const handleStartTrack = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const activeHobby = customHobby.trim() ? customHobby.trim() : selectedHobby;
      if (userProfile?.id) {
        // Safe hot-swap across all existing concepts
        await updateUserHobby(activeHobby);
        await loadUserGraph(userProfile.id);
      } else {
        const guestEmail = email.trim() || `guest_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}@tessera.edu`;
        const profile = await api.createProfile(guestEmail, guestEmail.split('@')[0], activeHobby);
        setUserProfile(profile);
        try {
          await api.seedSampleChapter(profile.id, 1, activeHobby);
        } catch (e) {
          console.warn('Initial sample chapter seeding failed:', e);
        }
        await loadUserGraph(profile.id);
      }
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize cognitive track');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-bauhaus-ink bg-white/95 backdrop-blur-md p-7 shadow-[8px_8px_0px_#171A21]">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-bauhaus-ink text-white flex items-center justify-center border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21]">
            <BrainCircuit className="w-5 h-5 text-bauhaus-amber" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-bauhaus-amber font-bold px-2 py-0.5 rounded-full bg-bauhaus-amber/15 border border-bauhaus-amber">
              Phase 1: Cognitive Onboarding
            </span>
            <h2 className="text-xl font-black text-bauhaus-ink mt-0.5 font-mono">How does your brain already model the world?</h2>
          </div>
        </div>

        <p className="text-xs text-bauhaus-muted mb-5 font-sans leading-relaxed">
          Before digesting your formal syllabus, our AI grounds abstract equations into a cognitive anchor you already intuitively master.
        </p>

        {/* Hobby Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-h-[340px] overflow-y-auto pr-1">
          {HOBBY_TILES.map((tile) => {
            const isSelected = selectedHobby === tile.id && !customHobby.trim();
            return (
              <div
                key={tile.id}
                onClick={() => {
                  setSelectedHobby(tile.id);
                  setCustomHobby('');
                }}
                className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-150 ${
                  isSelected
                    ? 'border-bauhaus-amber bg-bauhaus-amber/15 shadow-[3px_3px_0px_#F59E0B]'
                    : 'border-bauhaus-ink bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#171A21]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 border border-bauhaus-ink">
                      {tile.icon}
                    </div>
                    <span className="text-xs font-bold text-bauhaus-ink font-mono">{tile.label}</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white text-bauhaus-ink border border-bauhaus-ink font-bold shadow-[1px_1px_0px_#171A21]">
                    {tile.badge}
                  </span>
                </div>
                <p className="text-[11px] text-bauhaus-muted leading-snug font-sans">{tile.subtext}</p>
              </div>
            );
          })}
        </div>

        {/* Custom Input */}
        <div className="mb-5">
          <label className="text-xs font-bold text-bauhaus-ink mb-1 block font-mono">
            Or type a custom hobby / passion:
          </label>
          <input
            type="text"
            placeholder="e.g. Scuba Diving, Astronomy, Woodworking..."
            value={customHobby}
            onChange={(e) => setCustomHobby(e.target.value)}
            className="w-full rounded-xl border-2 border-bauhaus-ink bg-white px-3.5 py-2.5 text-xs font-mono text-bauhaus-ink placeholder-bauhaus-muted focus:outline-none focus:ring-2 focus:ring-bauhaus-amber"
          />
        </div>

        {error && (
          <div className="mb-4 text-xs font-mono font-bold text-bauhaus-red bg-red-50/70 border-2 border-bauhaus-red rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-bauhaus-ink">
          <div className="flex items-center space-x-1.5 text-xs text-bauhaus-ink font-mono font-bold">
            <Compass className="w-4 h-4 text-bauhaus-amber" />
            <span>Anchor: <strong className="text-bauhaus-ink font-black">{customHobby || selectedHobby}</strong></span>
          </div>

          <button
            onClick={handleStartTrack}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                <span>{onboardingRotatingText}</span>
              </>
            ) : (
              <>
                <span>Lock In Cognitive Anchor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
