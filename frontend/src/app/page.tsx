'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { StickyScrollStory } from '@/components/home/StickyScrollStory';
import { ArrowRight, Award, Sparkles } from 'lucide-react';
import { useGraphStore } from '@/store/useGraphStore';
import { api } from '@/lib/api';

export default function HomePage() {
  // Background pre-warming: pre-create profile and load graph so Studio opens in 0ms
  useEffect(() => {
    const prewarm = async () => {
      try {
        const store = useGraphStore.getState();
        await store.initUserSession();
      } catch (err) {
        console.debug('Background prewarm skipped:', err);
      }
    };
    prewarm();
  }, []);
  const handleNavStory = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('jump-to-story', { detail: { index } }));
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col selection:bg-bauhaus-amber selection:text-bauhaus-ink font-sans">
      {/* Bauhaus Top Navigation */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-8 md:px-12 py-3.5">
        <div className="max-w-7xl mx-auto bg-white/95 rounded-2xl px-5 py-3 flex items-center justify-between border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21]">
          {/* Brand Mark: Geometric Bauhaus Harmony */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center -space-x-1">
              <div className="w-3.5 h-3.5 bg-bauhaus-red border-2 border-bauhaus-ink rounded-sm" />
              <div className="w-3.5 h-3.5 bg-bauhaus-amber border-2 border-bauhaus-ink rounded-full z-10" />
              <div className="w-3.5 h-3.5 bg-bauhaus-blue border-2 border-bauhaus-ink rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-black tracking-tight text-bauhaus-ink">
                  TESSERA
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-bauhaus-blue/10 border border-bauhaus-blue text-bauhaus-blue uppercase">
                  Cognitive Compiler
                </span>
              </div>
              <p className="text-[10px] font-mono text-bauhaus-muted hidden sm:block">
                Adaptive Cognitive Architecture
              </p>
            </div>
          </Link>

          {/* Architectural Pillars (Bauhaus Geometric Badges) */}
          <nav className="hidden lg:flex items-center gap-2">
            <a
              href="#story-section"
              onClick={handleNavStory(0)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-bauhaus-ink bg-white hover:bg-blue-50 border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-bauhaus-blue" />
              <span>Bayesian DAG</span>
            </a>
            <a
              href="#story-section"
              onClick={handleNavStory(1)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-bauhaus-ink bg-white hover:bg-amber-50 border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="w-2 h-2 bg-bauhaus-amber border border-bauhaus-ink" />
              <span>Hobby Anchors</span>
            </a>
            <a
              href="#story-section"
              onClick={handleNavStory(2)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-bauhaus-ink bg-white hover:bg-emerald-50 border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-sm bg-bauhaus-green border border-bauhaus-ink" />
              <span>Two-Tier Probes</span>
            </a>
            <a
              href="#story-section"
              onClick={handleNavStory(3)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-bauhaus-ink bg-white hover:bg-red-50 border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] hover:shadow-[3px_3px_0px_#171A21] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="w-2 h-2 bg-bauhaus-red border border-bauhaus-ink rotate-45" />
              <span>Agentic RCA</span>
            </a>
          </nav>

          {/* Studio Launch CTA */}
          <Link
            className="px-4 py-2 bg-bauhaus-ink text-white hover:bg-bauhaus-blue rounded-xl font-mono text-xs font-bold transition-all border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] hover:shadow-[4px_4px_0px_#171A21] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_#171A21] flex items-center gap-2"
            href="/studio"
          >
            <span>LAUNCH STUDIO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto pt-16 sm:pt-20 pb-16 px-6 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border-2 border-bauhaus-ink text-xs font-mono font-bold text-bauhaus-ink shadow-[2px_2px_0px_#171A21] mb-6">
          <Sparkles className="w-3.5 h-3.5 text-bauhaus-amber" />
          <span>ADAPTIVE COGNITIVE COMPILER</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-bauhaus-ink tracking-tight leading-[1.1] max-w-4xl">
          Memorization is a bug in learning. <br />
          <span className="bg-gradient-to-r from-bauhaus-blue via-bauhaus-ink to-bauhaus-amber bg-clip-text text-transparent">
            We built the compiler to fix it.
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-bauhaus-muted max-w-2xl font-medium leading-relaxed">
          Flashcards and quizzes reward surface familiarity. Tessera compiles textbook chapters into live
          topological knowledge graphs, detects false positives, and uses Agentic RCA to trace errors to their
          upstream source.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            className="px-8 py-4 bg-bauhaus-ink text-white hover:bg-bauhaus-blue rounded-2xl font-mono text-sm font-black transition-all border-2 border-bauhaus-ink shadow-[4px_4px_0px_#171A21] hover:shadow-[5px_5px_0px_#171A21] flex items-center gap-3 hover:-translate-y-0.5 active:translate-y-0"
            href="/studio"
          >
            <span>ENTER INTERACTIVE STUDIO</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Sticky Scroll Showcase Section */}
      <StickyScrollStory />

      {/* Footer CTA */}
      <footer className="w-full py-16 px-6 text-center border-t-2 border-bauhaus-ink bg-white/80 backdrop-blur-md mt-20">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h3 className="text-2xl sm:text-3xl font-black text-bauhaus-ink tracking-tight">
            Ready to compile your mental schema?
          </h3>
          <p className="mt-2 text-sm text-bauhaus-muted">Active real-time cognitive reasoning engine.</p>
          <Link
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-bauhaus-blue text-white rounded-xl font-mono text-xs font-bold shadow-[3px_3px_0px_#171A21] hover:translate-y-[-2px] transition"
            href="/studio"
          >
            <span>OPEN INTERACTIVE STUDIO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
