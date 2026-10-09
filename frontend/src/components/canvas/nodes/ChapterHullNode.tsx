'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface ChapterHullData {
  chapter_id: string;
  title: string;
  subject: string;
  order_index: number;
  width?: number;
  height?: number;
}

export const ChapterHullNode: React.FC<{ data: ChapterHullData; style?: React.CSSProperties }> = ({
  data,
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    ...style,
    width: style?.width || (data.width ? `${data.width}px` : '480px'),
    height: style?.height || (data.height ? `${data.height}px` : '420px'),
  };

  return (
    <div
      style={containerStyle}
      className="relative select-none pointer-events-none rounded-[36px] border-[3px] border-dashed border-[#2C3539] bg-[rgba(245,240,230,0.65)] backdrop-blur-xs shadow-[0_12px_24px_-6px_rgba(44,53,57,0.15)] transition-all duration-300"
    >
      {/* Garden Terrace Corner Anchors */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#2C3539]/70 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#2C3539]/70 rounded-tr-xl pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#2C3539]/70 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#2C3539]/70 rounded-br-xl pointer-events-none" />

      {/* Carved Stone Wayfinding Marker Badge */}
      <div className="absolute -top-4.5 left-6 flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#E8DFC8] border-2 border-[#2C3539] shadow-[3px_3px_0px_#2C3539] text-[#171A21]">
        <div className="w-5 h-5 rounded-md bg-[#FAF7F0] border border-[#2C3539] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#2C3539]">
          <MapPin className="w-3.5 h-3.5 text-rose-800 stroke-[2.5]" />
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <span className="font-black uppercase tracking-wider text-[#171A21]">
            CHAPTER {data.order_index < 10 ? `0${data.order_index}` : data.order_index}
          </span>
          <span className="text-[#2C3539]/40 font-bold">|</span>
          <span className="font-sans font-black text-[#171A21] tracking-tight max-w-[280px] truncate uppercase">
            {data.title}
          </span>
          {data.subject && (
            <>
              <span className="text-[#2C3539]/40 font-bold">•</span>
              <span className="text-[10px] text-[#5A636C] font-mono font-bold truncate max-w-[140px] uppercase">
                {data.subject}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

ChapterHullNode.displayName = 'ChapterHullNode';
