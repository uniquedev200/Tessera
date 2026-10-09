'use client';

import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { useGraphStore } from '@/store/useGraphStore';

export const BridgeEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { setLatestArtifact, selectedNodeId } = useGraphStore();
  const label = (data?.relationship_label as string) || 'ISOMORPHISM BRIDGE';

  const isConnectedToSelected =
    selectedNodeId !== null &&
    (source === selectedNodeId || target === selectedNodeId);
  const isDimmed = selectedNodeId !== null && !isConnectedToSelected;

  const handleBridgeClick = () => {
    setLatestArtifact({
      bridge_label: label.replace('ISOMORPHISM: ', ''),
      real_world_artifact:
        (data?.real_world_artifact as string) ||
        'Cross-Chapter Isomorphism: Both concepts share the identical conservation rate law across differing physical domains.',
    });
  };

  const strokeColor = isConnectedToSelected ? '#F59E0B' : '#10B981';
  const strokeWidth = isConnectedToSelected ? 3.5 : 2.5;
  const opacity = isDimmed ? 0.35 : 0.95;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: '6 4',
          filter: isConnectedToSelected
            ? 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.4))'
            : 'drop-shadow(0 1px 4px rgba(16, 185, 129, 0.3))',
          animation: 'dashdraw 1.4s linear infinite',
          opacity,
          transition: 'stroke 0.2s, opacity 0.2s, stroke-width 0.2s',
        }}
        markerEnd={markerEnd}
      />
      {!isDimmed && (
        <EdgeLabelRenderer>
          <div
            onClick={handleBridgeClick}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`group cursor-pointer flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight bg-white text-bauhaus-ink border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] transition-all hover:scale-105 hover:bg-amber-50 ${
              isConnectedToSelected ? 'ring-2 ring-bauhaus-amber scale-105' : ''
            }`}
          >
            <Sparkles
              className="w-3 h-3 text-bauhaus-amber animate-spin"
              style={{ animationDuration: '4s' }}
            />
            <span>{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
