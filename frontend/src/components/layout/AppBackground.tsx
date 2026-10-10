'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useGraphStore } from '@/store/useGraphStore';

export const HOBBY_BACKGROUND_MAP: Record<string, string> = {
  'Music Production': '/backgrounds/music.png',
  'Competitive Gaming': '/backgrounds/gaming.png',
  'Culinary Arts': '/backgrounds/culinary.png',
  'Sports & Biomechanics': '/backgrounds/sports.png',
  'Market Trading': '/backgrounds/trading.png',
  'Software Systems': '/backgrounds/software.png',
};

export function AppBackground() {
  const pathname = usePathname();
  const userProfile = useGraphStore((s) => s.userProfile);
  const hobby = userProfile?.hobby_anchor || 'Music Production';

  const isHome = pathname === '/' || !pathname;
  const bgUrl = isHome
    ? '/backgrounds/homepage.png'
    : (HOBBY_BACKGROUND_MAP[hobby] || '/backgrounds/music.png');

  return (
    <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden transition-all duration-700">
      {/* Dynamic Background Image */}
      <div 
        key={bgUrl}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90 transition-opacity duration-700 animate-fadeIn"
        style={{ backgroundImage: `url('${bgUrl}')` }} 
      />
      {/* Crisp Bauhaus frosted wash overlay */}
      <div className={`absolute inset-0 ${isHome ? 'bg-white/20' : 'bg-white/40'} backdrop-blur-[1px]`} />
    </div>
  );
}
