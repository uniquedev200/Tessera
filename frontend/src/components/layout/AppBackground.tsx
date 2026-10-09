'use client';

import React from 'react';
import { useGraphStore } from '@/store/useGraphStore';

export const HOBBY_BACKGROUND_MAP: Record<string, string> = {
  'Music Production': '/backgrounds/music.png',
  'Culinary Arts': '/backgrounds/culinary.png',
  'Sports & Biomechanics': '/backgrounds/sports.png',
  'Market Trading': '/backgrounds/trading.png',
  'Competitive Gaming': '/background/background.png',
  'Software Systems': '/background/background.png',
};

export function AppBackground() {
  const userProfile = useGraphStore((s) => s.userProfile);
  const hobby = userProfile?.hobby_anchor || 'Music Production';
  const bgUrl = HOBBY_BACKGROUND_MAP[hobby] || '/background/background.png';

  return (
    <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden transition-all duration-700">
      {/* Dynamic Background Image */}
      <div 
        key={bgUrl}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85 transition-opacity duration-700 animate-fadeIn"
        style={{ backgroundImage: `url('${bgUrl}')` }} 
      />
      {/* Crisp Bauhaus frosted wash overlay */}
      <div className="absolute inset-0 bg-white/45 backdrop-blur-[1px]" />
    </div>
  );
}
