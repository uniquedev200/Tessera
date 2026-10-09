'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Zap,
  Activity,
  Radio,
  Magnet,
  Compass,
  Lock,
  Check,
  Puzzle,
  Search,
} from 'lucide-react';
import { useGraphStore, isNodeUnlocked } from '@/store/useGraphStore';
import { ConceptNodeData } from '@/lib/types';

// Concept category icon mapping (Tactile debossed SVG lineglyphs)
const getStoneGlyph = (label: string) => {
  const l = (label || '').toLowerCase();
  if (l.includes('volt') || l.includes('potential') || l.includes('capacit') || l.includes('energy')) {
    return <Zap className="w-5 h-5 text-amber-950 stroke-[2.4]" />;
  }
  if (l.includes('current') || l.includes('flow') || l.includes('drift') || l.includes('velocity')) {
    return <Activity className="w-5 h-5 text-sky-950 stroke-[2.4]" />;
  }
  if (l.includes('wave') || l.includes('frequency') || l.includes('oscillation') || l.includes('signal') || l.includes('phase')) {
    return <Radio className="w-5 h-5 text-violet-950 stroke-[2.4]" />;
  }
  if (l.includes('field') || l.includes('force') || l.includes('flux') || l.includes('induct') || l.includes('magnet') || l.includes('charge')) {
    return <Magnet className="w-5 h-5 text-rose-950 stroke-[2.4]" />;
  }
  return <Compass className="w-5 h-5 text-stone-900 stroke-[2.4]" />;
};

export const ConceptPillNode = memo(({ id, data, selected }: { id: string; data: ConceptNodeData; selected?: boolean }) => {
  const {
    nodes,
    edges,
    activeTracePath,
    selectedNodeId,
    openDrawer,
    rcaSuspectNodeId,
    rcaStage,
    rcaPathNodeIds,
  } = useGraphStore();

  const unlocked = isNodeUnlocked(id, nodes, edges);
  const isMastered = data.status === 'MASTERED';
  const isFragile = data.status === 'FRAGILE';
  const isSelected = selected || selectedNodeId === id;
  const isNeighbor = Boolean(data.isNeighbor);
  const isDimmed = selectedNodeId !== null && !isSelected && !isNeighbor;
  const isSuspect = rcaSuspectNodeId === id && rcaStage !== 'IDLE';
  const isBacktrackNode = rcaPathNodeIds.includes(id) && rcaStage !== 'IDLE';
  const isAlarmTrace = isBacktrackNode || activeTracePath.includes(id);

  const rawP = data.p_mastery ?? data.pMastery ?? 0.15;

  // Determine Tessera Stone Slab Theme
  const slabClass = isSuspect
    ? 'tessera-stone-fragile !border-red-600 ring-4 ring-red-400/50 animate-pulse-ring cursor-pointer'
    : isAlarmTrace
    ? 'tessera-stone-fragile !border-red-600 shadow-[0_8px_0_0_#991B1B] cursor-pointer'
    : !unlocked
    ? 'tessera-stone-locked cursor-not-allowed'
    : isMastered
    ? 'tessera-stone-mastered cursor-pointer'
    : isFragile
    ? 'tessera-stone-fragile cursor-pointer'
    : 'tessera-stone-slab cursor-pointer';

  const selectionRing = isSelected
    ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-amber-100 !-translate-y-1'
    : isNeighbor
    ? 'ring-2 ring-blue-400/60'
    : '';

  const opacityClass = isDimmed && unlocked ? 'opacity-35 hover:opacity-100' : '';

  return (
    <div
      onClick={() => openDrawer(data)}
      className={`relative select-none ${slabClass} ${selectionRing} ${opacityClass}`}
      style={{ width: 236, height: 86 }}
    >
      {/* RCA Suspect Node Floating Carved Clue Marker Badge */}
      {isSuspect && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-300 text-[#171A21] border-2 border-[#171A21] text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1 shadow-[2px_2px_0px_#171A21] animate-bounce z-30 whitespace-nowrap">
          <Search className="w-3 h-3 stroke-[2.5]" />
          <span>Found the Clue!</span>
        </div>
      )}

      {/* Handles disguised as physical stone pathway anchors */}
      <Handle className="!w-3 !h-3 !bg-[#2B261F] !border-2 !border-[#FAF7F0] !-top-1.5" id="top" position={Position.Top} type="target" />
      <Handle className="!w-3 !h-3 !bg-[#2B261F] !border-2 !border-[#FAF7F0] !-top-1.5" id="target-top" position={Position.Top} type="target" />
      <Handle className="!w-3 !h-3 !bg-[#8B5CF6] !border-2 !border-[#FAF7F0] !-left-1.5" id="left" position={Position.Left} type="target" />
      <Handle className="!w-3 !h-3 !bg-[#8B5CF6] !border-2 !border-[#FAF7F0] !-left-1.5" id="target-left" position={Position.Left} type="target" />

      <div className="h-full px-4 flex items-center justify-between gap-3">
        {/* Debossed Stone Icon Socket */}
        <div className="tessera-socket w-12 h-12 shrink-0 flex items-center justify-center border border-[#A89E8A]">
          {!unlocked ? (
            <Lock className="w-5 h-5 text-stone-600 stroke-[2.2]" />
          ) : isMastered ? (
            <div className="relative flex items-center justify-center">
              {getStoneGlyph(data.label)}
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border border-white shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>
          ) : isFragile ? (
            <div className="relative flex items-center justify-center">
              {getStoneGlyph(data.label)}
              <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white rounded-full p-0.5 border border-white shadow-xs">
                <Puzzle className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>
          ) : (
            getStoneGlyph(data.label)
          )}
        </div>

        {/* Stone Inscription & Stepping Pebble Battery Gauge */}
        <div className="flex-1 min-w-0 pr-1">
          <h4
            className="text-xs font-black tracking-tight text-[#1E252B] truncate uppercase"
            title={data.label}
          >
            {data.label}
          </h4>

          {/* Stepping Pebble Progress Bar */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#61594D]">
              {!unlocked ? 'LOCKED' : isMastered ? 'MOSS' : isFragile ? 'WOBBLY' : 'TRAIL'}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              {/* Pebble 1 */}
              <div
                className={`w-3 h-3 rounded-full border border-[#2B261F] transition-colors ${
                  unlocked && rawP >= 0.15
                    ? isMastered || rawP >= 0.75
                      ? 'bg-[#4B845C] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                      : 'bg-[#E59838] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                    : 'bg-[#C2BBB0]'
                }`}
                title="Foundational Exposure"
              />
              {/* Pebble 2 */}
              <div
                className={`w-3 h-3 rounded-full border border-[#2B261F] transition-colors ${
                  unlocked && rawP >= 0.45
                    ? isMastered || rawP >= 0.75
                      ? 'bg-[#4B845C] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                      : 'bg-[#E59838] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                    : 'bg-[#C2BBB0]'
                }`}
                title="Mechanistic Competence"
              />
              {/* Pebble 3 */}
              <div
                className={`w-3 h-3 rounded-full border border-[#2B261F] transition-colors ${
                  unlocked && rawP >= 0.75
                    ? 'bg-[#4B845C] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                    : 'bg-[#C2BBB0]'
                }`}
                title="Mastery Anchor"
              />
            </div>
          </div>
        </div>
      </div>

      <Handle className="!w-3 !h-3 !bg-[#2B261F] !border-2 !border-[#FAF7F0] !-bottom-1.5" id="bottom" position={Position.Bottom} type="source" />
      <Handle className="!w-3 !h-3 !bg-[#2B261F] !border-2 !border-[#FAF7F0] !-bottom-1.5" id="source-bottom" position={Position.Bottom} type="source" />
      <Handle className="!w-3 !h-3 !bg-[#8B5CF6] !border-2 !border-[#FAF7F0] !-right-1.5" id="right" position={Position.Right} type="source" />
      <Handle className="!w-3 !h-3 !bg-[#8B5CF6] !border-2 !border-[#FAF7F0] !-right-1.5" id="source-right" position={Position.Right} type="source" />
    </div>
  );
});

ConceptPillNode.displayName = 'ConceptPillNode';
