'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import {
  Network,
  Sparkles,
  ShieldAlert,
  SearchCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  BrainCircuit,
  Zap,
} from 'lucide-react';

interface FeatureStory {
  id: string;
  stepNumber: string;
  badge: string;
  badgeColor: string;
  title: string;
  scientificBasis: string;
  aiDeployment: string;
  aiModel: string;
  description: string;
}

const STORIES: FeatureStory[] = [
  {
    id: 'dag-bkt',
    stepNumber: '01',
    badge: 'Cognitive Topology',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
    title: 'Bayesian Knowledge Graphs',
    scientificBasis: 'Corbett & Anderson (1994) Bayesian Knowledge Tracing',
    aiDeployment: 'Chapter Ingestion & DAG Extraction Engine',
    aiModel: 'Topological Graph Compiler',
    description:
      'Stop reducing student understanding to a flat percentage. Syllabi are parsed into topological Directed Acyclic Graphs (DAGs) tracking live mastery certainty P(M) and dependency propagation.',
  },
  {
    id: 'analogical-anchors',
    stepNumber: '02',
    badge: 'Structure-Mapping',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-300',
    title: 'Analogical Hobby Anchors & Cross-Bridges',
    scientificBasis: "Gentner's Structure-Mapping & Invariant Isomorphism",
    aiDeployment: 'Cross-Domain Invariant Synthesis',
    aiModel: 'Analogical Bridge Engine',
    description:
      'Solve the single-chapter cold-start by bridging abstract concepts to real-world models (Audio Production, Gaming, Cooking), discovering cross-discipline mathematical equivalents between chapters.',
  },
  {
    id: 'two-tier-anti-jargon',
    stepNumber: '03',
    badge: 'Falsification Testing',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    title: 'Two-Tier Treagust & Anti-Jargon Probe',
    scientificBasis: 'Treagust (1986) Diagnostics & Popperian Falsification',
    aiDeployment: 'Adversarial Misconceptions + Real-Time Lexical Guard',
    aiModel: 'Real-Time Probe Evaluator (<400ms)',
    description:
      'Cancel out rote memorizers. Tier 1 tests predictions; Tier 2 tests causal drivers using documented misconceptions. If a student hides behind textbook buzzwords, a 45-second physical action-verb gauntlet intercepts them.',
  },
  {
    id: 'agentic-rca',
    stepNumber: '04',
    badge: 'Site Reliability for Cognition',
    badgeColor: 'bg-red-100 text-red-700 border-red-300',
    title: 'Agentic Root Cause Analysis (RCA)',
    scientificBasis: 'Upstream Lineage Attribution & Zero-Context Probing',
    aiDeployment: '3-Gate DAG Diagnostic Backtracking',
    aiModel: 'Diagnostic Traceback Engine',
    description:
      'When a downstream circuit concept fails, the system does not give the answer. It fires a red diagnostic pulse back up the DAG to pinpoint whether an unaddressed prerequisite from 3 weeks ago caused the failure.',
  },
];

export function StickyScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStoryIndex, setActiveStoryIndex] = React.useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const stepCount = STORIES.length;
    const currentStep = Math.min(
      Math.floor(latest * stepCount),
      stepCount - 1
    );
    const clampedStep = Math.max(0, currentStep);
    setActiveStoryIndex((prev) => (prev !== clampedStep ? clampedStep : prev));
  });

  const handleJumpToStory = React.useCallback((targetIndex: number) => {
    setActiveStoryIndex(targetIndex);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;
      const containerTop = scrollTop + rect.top;
      const scrollableHeight = containerRef.current.offsetHeight - window.innerHeight;
      if (scrollableHeight > 0) {
        const targetFraction = (targetIndex + 0.3) / STORIES.length;
        const targetScrollY = containerTop + targetFraction * scrollableHeight;
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    }
  }, []);

  React.useEffect(() => {
    const handleJumpEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      if (typeof customEvent.detail?.index === 'number') {
        handleJumpToStory(customEvent.detail.index);
      }
    };
    window.addEventListener('jump-to-story', handleJumpEvent);
    return () => window.removeEventListener('jump-to-story', handleJumpEvent);
  }, [handleJumpToStory]);

  return (
    <section id="story-section" ref={containerRef} className="relative w-full h-[220vh] px-4 md:px-12">
      {/* Sticky Viewport Frame */}
      <div className="sticky top-0 h-screen w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 py-12">
        {/* LEFT COLUMN: Narrative Details */}
        <div className="w-full md:w-1/2 flex flex-col justify-center h-full z-10 pr-0 md:pr-8">
          <div className="bg-white/95 backdrop-blur-md p-8 md:p-10 rounded-2xl border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21] relative overflow-hidden min-h-[460px] flex flex-col justify-between">
            {/* Bauhaus Geometric Corner Accent */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-bauhaus-amber/20 -mr-8 -mt-8 rounded-full pointer-events-none" />

            <div>
              {/* Step Progress Line */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-6 border border-bauhaus-ink/20">
                <div
                  className="h-full bg-bauhaus-blue transition-all duration-300 ease-out"
                  style={{ width: `${((activeStoryIndex + 1) / STORIES.length) * 100}%` }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`story-${activeStoryIndex}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  {/* Step & Badge Header */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-black text-bauhaus-ink px-2.5 py-1 bg-white border-2 border-bauhaus-ink rounded-lg shadow-[2px_2px_0px_#171A21]">
                      {STORIES[activeStoryIndex].stepNumber}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-full border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] ${STORIES[activeStoryIndex].badgeColor}`}
                    >
                      {STORIES[activeStoryIndex].badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-black text-bauhaus-ink tracking-tight">
                    {STORIES[activeStoryIndex].title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm md:text-base text-bauhaus-muted font-medium leading-relaxed">
                    {STORIES[activeStoryIndex].description}
                  </p>

                  {/* AI Deployment & Science Badges */}
                  <div className="space-y-2 pt-3 border-t border-bauhaus-border">
                    <div className="flex items-center gap-2 text-xs font-mono text-bauhaus-ink">
                      <BrainCircuit className="w-4 h-4 text-bauhaus-blue shrink-0" />
                      <span className="font-bold">AI Workflow:</span>
                      <span className="text-bauhaus-muted">{STORIES[activeStoryIndex].aiDeployment}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bauhaus-ink">
                      <Sparkles className="w-4 h-4 text-bauhaus-amber shrink-0" />
                      <span className="font-bold">Inference Engine:</span>
                      <span className="text-bauhaus-blue font-bold">{STORIES[activeStoryIndex].aiModel}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Stepper Bar & Interactive Navigation */}
            <div className="flex items-center justify-between pt-6 mt-4 border-t border-bauhaus-border/80 shrink-0">
              <div className="flex items-center gap-2">
                {STORIES.map((story, i) => (
                  <button
                    key={story.id}
                    onClick={() => handleJumpToStory(i)}
                    className={`h-2.5 transition-all duration-300 rounded-full cursor-pointer border border-bauhaus-ink ${
                      i === activeStoryIndex
                        ? 'w-9 bg-bauhaus-ink shadow-[1px_1px_0px_#171A21]'
                        : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                    }`}
                    title={`Step ${story.stepNumber}: ${story.title}`}
                  />
                ))}
              </div>

              {/* Prev / Next Controls */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={() => handleJumpToStory(Math.max(0, activeStoryIndex - 1))}
                  disabled={activeStoryIndex === 0}
                  className="px-3 py-1 rounded-lg border-2 border-bauhaus-ink bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-[2px_2px_0px_#171A21] font-bold text-bauhaus-ink transition-all active:translate-y-0.5"
                >
                  ← PREV
                </button>
                <button
                  onClick={() => handleJumpToStory(Math.min(STORIES.length - 1, activeStoryIndex + 1))}
                  disabled={activeStoryIndex === STORIES.length - 1}
                  className="px-3 py-1 rounded-lg border-2 border-bauhaus-ink bg-bauhaus-blue text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-[2px_2px_0px_#171A21] font-bold transition-all active:translate-y-0.5"
                >
                  NEXT →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Bauhaus Window Frame (Revealing Live Snippets) */}
        <div className="w-full md:w-1/2 h-full flex items-center justify-center">
          <div className="w-full max-w-[500px] h-[480px] bg-white rounded-2xl border-2 border-bauhaus-ink shadow-[6px_6px_0px_#171A21] flex flex-col overflow-hidden relative">
            {/* Window Header Bar */}
            <div className="h-10 bg-white border-b-2 border-bauhaus-ink px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-bauhaus-red border border-bauhaus-ink" />
                <div className="w-3 h-3 rounded-full bg-bauhaus-amber border border-bauhaus-ink" />
                <div className="w-3 h-3 rounded-full bg-bauhaus-green border border-bauhaus-ink" />
              </div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-bauhaus-ink">
                TESSERA // RUNTIME_MONITOR
              </span>
              <span className="text-[10px] font-mono font-bold text-bauhaus-blue">
                {STORIES[activeStoryIndex].stepNumber} / 04
              </span>
            </div>

            {/* Dynamic Interactive Window Content */}
            <div className="relative flex-1 p-6 bg-slate-50/70 overflow-hidden flex items-center justify-center">
              <AnimatePresence mode="wait">
                {activeStoryIndex === 0 && (
                  <motion.div
                    key="snippet-0"
                    initial={{ opacity: 0, scale: 0.95, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -14 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full space-y-4"
                  >
                    <div className="p-4 bg-white rounded-xl border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21]">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-bauhaus-ink">NODE // Drift Velocity</span>
                        <span className="text-bauhaus-green bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          P(M): 0.88 [MASTERED]
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-bauhaus-muted">
                        Invariant: Net directional motion of charge under E-field.
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-2">
                      <div className="w-0.5 h-6 bg-bauhaus-blue border-r border-dashed border-bauhaus-blue" />
                    </div>

                    <div className="p-4 bg-white rounded-xl border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21]">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-bauhaus-ink">NODE // Electric Current</span>
                        <span className="text-bauhaus-amber bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                          P(M): 0.35 [IN_EVALUATION]
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-bauhaus-muted">
                        Invariant: Causal flux dependent on drift velocity.
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStoryIndex === 1 && (
                  <motion.div
                    key="snippet-1"
                    initial={{ opacity: 0, scale: 0.95, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -14 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full space-y-4"
                  >
                    <div className="p-4 bg-amber-50/90 rounded-xl border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21]">
                      <span className="text-[10px] font-mono font-bold text-amber-800 uppercase px-2 py-0.5 bg-amber-200 rounded">
                        HOBBY ANCHOR // AUDIO PRODUCTION
                      </span>
                      <h4 className="mt-2 font-bold text-sm text-bauhaus-ink">
                        Gain Staging ⟷ Electric Potential
                      </h4>
                      <p className="mt-1 text-xs text-bauhaus-muted">
                        &quot;Preamp drive dictates signal headroom exactly as voltage drop dictates charge velocity.&quot;
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50/90 rounded-xl border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21]">
                      <span className="text-[10px] font-mono font-bold text-blue-800 uppercase px-2 py-0.5 bg-blue-200 rounded">
                        CROSS-CHAPTER ISOMORPHISM
                      </span>
                      <h4 className="mt-2 font-bold text-sm text-bauhaus-ink">
                        Physics Ch 1 ⟷ Chemistry Ch 3 (Redox)
                      </h4>
                      <p className="mt-1 text-xs text-bauhaus-muted">
                        Structural invariant: Potential energy difference driving electron movement across phase boundary.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeStoryIndex === 2 && (
                  <motion.div
                    key="snippet-2"
                    initial={{ opacity: 0, scale: 0.95, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -14 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full space-y-3"
                  >
                    <div className="p-4 bg-red-50 rounded-xl border-2 border-bauhaus-red shadow-[3px_3px_0px_#EF4444]">
                      <div className="flex items-center gap-2 text-bauhaus-red text-xs font-mono font-bold">
                        <ShieldAlert className="w-4 h-4" />
                        <span>LEXICAL MASKING INTERCEPTED</span>
                      </div>
                      <p className="mt-1.5 text-xs text-bauhaus-ink font-semibold">
                        Student flagged using textbook buzzword: &quot;electronegativity&quot;
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-xl border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21] space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-bauhaus-ink">45s PHYSICAL VERB CHALLENGE</span>
                        <span className="text-bauhaus-amber font-mono text-sm font-black">00:32</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-bauhaus-amber h-full w-[70%]" />
                      </div>
                      <p className="text-[11px] text-bauhaus-muted italic">
                        &quot;Explain in plain physical verbs what is mechanically pushing the charge across that gap.&quot;
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeStoryIndex === 3 && (
                  <motion.div
                    key="snippet-3"
                    initial={{ opacity: 0, scale: 0.95, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -14 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full space-y-3"
                  >
                    <div className="p-3 bg-red-500 text-white rounded-xl border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21] flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase">
                        CRITICAL FAILURE ATTRIBUTED
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-white text-red-600 rounded font-bold">
                        CERTAINTY: 96.4%
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-xl border-2 border-bauhaus-red shadow-[4px_4px_0px_#EF4444] space-y-2">
                      <div className="text-xs font-mono font-bold text-bauhaus-red">
                        ROOT CAUSE // Phase Shift Invariant (Ch 1)
                      </div>
                      <p className="text-xs text-bauhaus-muted">
                        Student failed &apos;Capacitive Reactance&apos; not from circuit formulas, but from a broken harmonic oscillation prior from 3 weeks ago.
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-bauhaus-ink">
                          Gate 3 Micro-Probe Dispatched
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
