'use client';

import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { useGraphStore } from '@/store/useGraphStore';

export const CausalEdge: React.FC<EdgeProps> = ({
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

  const { rcaPathEdgeIds, rcaPathNodeIds, activeTracePath, selectedNodeId } = useGraphStore();

  const isRcaActive =
    rcaPathEdgeIds.includes(id) ||
    rcaPathEdgeIds.includes(`edge_${source}_${target}`) ||
    (rcaPathNodeIds.includes(source) && rcaPathNodeIds.includes(target));

  const isAlarmTrace =
    !isRcaActive && activeTracePath.includes(source) && activeTracePath.includes(target);

  const isHobbyAnchor = Boolean(data?.is_hobby_anchor || data?.isHobbyAnchor);
  const isConnectedToSelected =
    selectedNodeId !== null &&
    (source === selectedNodeId || target === selectedNodeId);
  const isDimmed = selectedNodeId !== null && !isConnectedToSelected && !isRcaActive;

  let strokeColor = '#334155'; // Crisp Slate-700 Ink for high visibility on light backgrounds
  let strokeWidth = 2.2;
  let strokeDasharray = undefined;
  let filter = undefined;
  let animation = undefined;
  let opacity = 0.95;

  if (isRcaActive) {
    strokeColor = '#EF4444'; // Bauhaus Red
    strokeWidth = 3.5;
    strokeDasharray = '8 4';
    filter = 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))';
    animation = 'dash-reverse 0.6s linear infinite';
    opacity = 1;
  } else if (isAlarmTrace) {
    strokeColor = '#EF4444';
    strokeWidth = 3;
    filter = 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))';
    animation = 'dashdraw 1s linear infinite';
    opacity = 1;
  } else if (isConnectedToSelected) {
    if (isHobbyAnchor) {
      strokeColor = '#F59E0B'; // Bauhaus Amber
      strokeWidth = 2.5;
      strokeDasharray = '5 4';
      filter = 'drop-shadow(0 1px 4px rgba(245, 158, 11, 0.35))';
      animation = 'dashdraw 1.2s linear infinite';
    } else {
      strokeColor = '#2563EB'; // Bauhaus Blue
      strokeWidth = 2.5;
      strokeDasharray = '6 4';
      filter = 'drop-shadow(0 1px 4px rgba(37, 99, 235, 0.35))';
      animation = 'dashdraw 1.2s linear infinite';
    }
    opacity = 1;
  } else if (isDimmed) {
    strokeColor = '#64748B';
    strokeWidth = 1.4;
    opacity = 0.35;
  }

  const label = (data?.relationship_label as string) || '';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          filter,
          animation,
          opacity,
          transition: 'stroke 0.2s, opacity 0.2s, stroke-width 0.2s',
        }}
        markerEnd={markerEnd}
      />
      {label && !isDimmed && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`px-2.5 py-0.5 rounded-md text-[9px] font-mono tracking-tight font-black transition-opacity duration-200 ${
              isAlarmTrace || isRcaActive
                ? 'bg-red-50 text-red-700 border-2 border-red-500 shadow-[2px_2px_0px_#EF4444]'
                : isConnectedToSelected
                ? isHobbyAnchor
                  ? 'bg-amber-50 text-amber-900 border-2 border-amber-500 shadow-[2px_2px_0px_#F59E0B]'
                  : 'bg-blue-50 text-blue-900 border-2 border-blue-500 shadow-[2px_2px_0px_#2563EB]'
                : 'bg-white text-bauhaus-ink border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21]'
            }`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
