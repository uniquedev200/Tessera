'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Music,
  Gamepad2,
  UtensilsCrossed,
  Activity,
  TrendingUp,
  Terminal,
  Compass,
} from 'lucide-react';
import { ConceptNodeData } from '@/lib/types';
import { useGraphStore } from '@/store/useGraphStore';

function getHobbyIcon(label: string) {
  const l = (label || '').toLowerCase();
  if (l.includes('music') || l.includes('audio')) return <Music className="w-5 h-5 text-amber-950 stroke-[2.4]" />;
  if (l.includes('gaming') || l.includes('esports')) return <Gamepad2 className="w-5 h-5 text-sky-950 stroke-[2.4]" />;
  if (l.includes('culinary') || l.includes('baking') || l.includes('cooking')) return <UtensilsCrossed className="w-5 h-5 text-amber-950 stroke-[2.4]" />;
  if (l.includes('sport') || l.includes('biomechanic')) return <Activity className="w-5 h-5 text-emerald-950 stroke-[2.4]" />;
  if (l.includes('trading') || l.includes('market')) return <TrendingUp className="w-5 h-5 text-emerald-950 stroke-[2.4]" />;
  if (l.includes('software') || l.includes('system') || l.includes('code')) return <Terminal className="w-5 h-5 text-slate-950 stroke-[2.4]" />;
  return <Compass className="w-5 h-5 text-amber-950 stroke-[2.4]" />;
}

export const HobbyAnchorNode: React.FC<{ data: ConceptNodeData; id: string }> = ({ data, id }) => {
  const { openDrawer, selectedNodeId, userProfile } = useGraphStore();

  const isSelected = selectedNodeId === id;
  const isNeighbor = Boolean(data.isNeighbor);
  const isDimmed = selectedNodeId !== null && !isSelected && !isNeighbor;

  const activeHobby = userProfile?.hobby_anchor || 'Music Production';
  const displayLabel = `${activeHobby} Cognitive Anchor`;
  const displayInvariant = data.core_invariant && !data.core_invariant.includes('Music Production')
    ? data.core_invariant
    : `Primary world-model grounding in ${activeHobby}`;

  const selectionRing = isSelected
    ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-amber-100 !-translate-y-1'
    : isNeighbor
    ? 'ring-2 ring-amber-400/60'
    : '';

  const opacityClass = isDimmed ? 'opacity-35 hover:opacity-100' : 'opacity-100';

  return (
    <div
      onClick={() => openDrawer({ ...data, label: displayLabel, core_invariant: displayInvariant })}
      className={`relative select-none tessera-stone-fragile cursor-pointer ${selectionRing} ${opacityClass}`}
      style={{ width: 236, height: 86 }}
    >
      <div className="h-full px-4 flex items-center justify-between gap-3">
        {/* Debossed Stone Icon Socket */}
        <div className="tessera-socket w-12 h-12 shrink-0 flex items-center justify-center border border-[#A89E8A]">
          {getHobbyIcon(activeHobby)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono font-black text-amber-900 uppercase tracking-wider">
              HOME BASE ANCHOR
            </span>
          </div>
          <h4 className="text-xs font-black tracking-tight text-[#1E252B] truncate uppercase mt-0.5" title={activeHobby}>
            {activeHobby}
          </h4>
          <span className="text-[9px] font-mono text-[#61594D] font-bold block mt-1">
            WORLD-MODEL GROUND
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-[#D97706] !border-2 !border-[#FAF7F0] !-bottom-1.5"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-3 !h-3 !bg-[#D97706] !border-2 !border-[#FAF7F0] !-bottom-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-[#D97706] !border-2 !border-[#FAF7F0] !-right-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3 !h-3 !bg-[#D97706] !border-2 !border-[#FAF7F0] !-right-1.5"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-[#D97706] !border-2 !border-[#FAF7F0] !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className="!w-3 !h-3 !bg-[#D97706] !border-2 !border-[#FAF7F0] !-left-1.5"
      />
    </div>
  );
};

HobbyAnchorNode.displayName = 'HobbyAnchorNode';
