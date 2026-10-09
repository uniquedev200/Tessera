'use client';

import React from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { useGraphStore } from '@/store/useGraphStore';
import { Sparkles, Search } from 'lucide-react';

export function SteppingStoneEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 22,
  });

  const {
    rcaPathEdgeIds,
    rcaPathNodeIds,
    activeTracePath,
    selectedNodeId,
    setLatestArtifact,
  } = useGraphStore();

  const isRcaActive =
    Boolean(data?.isRcaActive) ||
    rcaPathEdgeIds.includes(id) ||
    rcaPathEdgeIds.includes(`edge_${source}_${target}`) ||
    (rcaPathNodeIds.includes(source) && rcaPathNodeIds.includes(target));

  const isAlarmTrace =
    !isRcaActive && activeTracePath.includes(source) && activeTracePath.includes(target);

  const isBridge = Boolean(data?.isBridge || data?.is_isomorphism_bridge);
  const isHobbyAnchor = Boolean(data?.is_hobby_anchor || data?.isHobbyAnchor);

  const isConnectedToSelected =
    selectedNodeId !== null && (source === selectedNodeId || target === selectedNodeId);
  const isDimmed = selectedNodeId !== null && !isConnectedToSelected && !isRcaActive;

  const labelText = ((data?.label || data?.relationship_label || '') as string).trim();

  // Color schemes for physical trailway
  const dirtTrailColor = isRcaActive || isAlarmTrace
    ? 'rgba(239, 68, 68, 0.40)'
    : isBridge
    ? 'rgba(139, 92, 246, 0.32)'
    : isConnectedToSelected
    ? isHobbyAnchor
      ? 'rgba(217, 119, 6, 0.45)'
      : 'rgba(37, 99, 235, 0.40)'
    : isHobbyAnchor
    ? 'rgba(217, 119, 6, 0.28)'
    : '#D8CEBE';

  const paverColor = isRcaActive || isAlarmTrace
    ? '#EF4444'
    : isBridge
    ? '#8B5CF6'
    : isConnectedToSelected
    ? isHobbyAnchor
      ? '#D97706'
      : '#2563EB'
    : isHobbyAnchor
    ? '#D97706'
    : '#7E7564';

  const opacity = isDimmed ? 0.32 : 1;

  const handlePlaqueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBridge && labelText) {
      setLatestArtifact({
        bridge_label: labelText.replace('ISOMORPHISM: ', ''),
        real_world_artifact:
          (data?.real_world_artifact as string) ||
          (data?.realWorldArtifact as string) ||
          'Cross-Chapter Isomorphism: Both concepts share an identical mathematical rate invariant across differing physical domains.',
      });
    }
  };

  return (
    <>
      <g
        className="stepping-stone-edge select-none pointer-events-none"
        style={{ opacity, transition: 'opacity 0.2s ease' }}
      >
        {/* Layer 1: Earthen Dirt Trail Trench (Wide trodden path) */}
        <path
          d={edgePath}
          fill="none"
          stroke={dirtTrailColor}
          strokeWidth={isConnectedToSelected ? 18 : 16}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
        />

        {/* Layer 2: Cobblestone Paver Cast Shadows */}
        <path
          d={edgePath}
          fill="none"
          stroke="rgba(43, 38, 31, 0.32)"
          strokeWidth={7}
          strokeDasharray="14 12"
          strokeDashoffset="-2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Layer 3: Physical Cobblestone Stepping Pavers */}
        <path
          id={id}
          d={edgePath}
          fill="none"
          stroke={paverColor}
          strokeWidth={7}
          strokeDasharray="14 12"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            ...style,
            transition: 'stroke 0.25s ease',
          }}
        />

        {/* Layer 4: Top-Edge Chiseled Light Accent on Pavers */}
        <path
          d={edgePath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.65)"
          strokeWidth={2}
          strokeDasharray="14 12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Layer 4.5: Animated Energy Flow Stream inside Pavers */}
        <path
          d={edgePath}
          fill="none"
          stroke={
            isRcaActive || isAlarmTrace
              ? '#FDE047'
              : isConnectedToSelected
              ? isHobbyAnchor
                ? '#F59E0B'
                : '#93C5FD'
              : isBridge
              ? '#D8B4FE'
              : 'rgba(255, 255, 255, 0.8)'
          }
          strokeWidth={isConnectedToSelected ? 3 : 1.8}
          strokeDasharray={isConnectedToSelected ? '6 6' : '4 8'}
          strokeLinecap="round"
          style={{
            animation: isConnectedToSelected
              ? 'dashdraw 0.75s linear infinite'
              : 'dashdraw 1.8s linear infinite',
            filter: isConnectedToSelected
              ? isHobbyAnchor
                ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.7))'
                : 'drop-shadow(0 0 4px rgba(37, 99, 235, 0.7))'
              : undefined,
            transition: 'stroke 0.2s, stroke-width 0.2s',
          }}
        />

        {/* RCA Backtrack Clue Trail Animation */}
        {(isRcaActive || isAlarmTrace) && (
          <path
            d={edgePath}
            fill="none"
            stroke="#FDE047"
            strokeWidth={4}
            strokeDasharray="8 18"
            strokeLinecap="round"
            className="animate-reverse-trail"
          />
        )}
      </g>

      {/* Layer 5: In-Line 2-3 Word Connection Plaque Directly ON the Trail */}
      {labelText && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              zIndex: isConnectedToSelected ? 40 : isRcaActive ? 30 : 10,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              onClick={handlePlaqueClick}
              className={`tessera-edge-plaque inline-flex items-center gap-1 cursor-pointer ${
                isRcaActive || isAlarmTrace
                  ? '!bg-red-100 !border-red-600 !text-red-900 !shadow-[2px_2px_0px_#991B1B]'
                  : isBridge
                  ? '!bg-[#F3E8FF] !border-purple-700 !text-purple-900 !shadow-[2px_2px_0px_#4C1D95] hover:scale-110'
                  : isConnectedToSelected
                  ? isHobbyAnchor
                    ? '!bg-[#FFFBEB] !border-amber-600 !text-amber-950 !shadow-[3px_3px_0px_#D97706] scale-105'
                    : '!bg-blue-50 !border-blue-600 !text-blue-950 !shadow-[3px_3px_0px_#2563EB] scale-105'
                  : isHobbyAnchor
                  ? '!bg-amber-50 !border-amber-600 !text-amber-900 !shadow-[2px_2px_0px_#D97706]'
                  : ''
              }`}
              title={
                (data?.connection_reason as string) ||
                (data?.connectionReason as string) ||
                labelText
              }
            >
              {isBridge && (
                <Sparkles
                  className="w-2.5 h-2.5 text-purple-700 animate-spin"
                  style={{ animationDuration: '4s' }}
                />
              )}
              {(isRcaActive || isAlarmTrace) && (
                <Search className="w-2.5 h-2.5 text-red-700" />
              )}
              <span>{labelText}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

SteppingStoneEdge.displayName = 'SteppingStoneEdge';
