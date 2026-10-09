'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ChapterHullNode } from './nodes/ChapterHullNode';
import { ConceptPillNode } from './nodes/ConceptPillNode';
import { HobbyAnchorNode } from './nodes/HobbyAnchorNode';
import { CausalEdge } from './edges/CausalEdge';
import { BridgeEdge } from './edges/BridgeEdge';
import { SteppingStoneEdge } from './edges/SteppingStoneEdge';
import { NodeInspectionDrawer } from './drawer/NodeInspectionDrawer';
import { useGraphStore } from '@/store/useGraphStore';
import { Plus, Sparkles, RotateCcw, Compass, Trash2, Maximize2, Check, Puzzle, Lock } from 'lucide-react';
import { api } from '@/lib/api';

const ConceptCanvasInner: React.FC<{ onOpenUpload: () => void; hideFloatingDrawer?: boolean }> = ({
  onOpenUpload,
  hideFloatingDrawer,
}) => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    userProfile,
    activeTracePath,
    clearActiveTracePath,
    loadUserGraph,
    setLatestArtifact,
    clearAllData,
    selectedNodeId,
    setSelectedNodeId,
    setSelectedConcept,
    openDrawer,
    rcaStage,
    rcaSuspectNodeId,
    rcaPathEdgeIds,
    rcaPathNodeIds,
  } = useGraphStore();

  const { fitView, setCenter } = useReactFlow();

  // Camera Auto-Tracking: When TARGET_LOCKED, smoothly pan camera to suspect node
  React.useEffect(() => {
    if (rcaStage === 'TARGET_LOCKED' && rcaSuspectNodeId) {
      const suspectNode = nodes.find((n) => n.id === rcaSuspectNodeId);
      if (suspectNode) {
        setCenter(suspectNode.position.x + 120, suspectNode.position.y + 40, {
          zoom: 1.25,
          duration: 900,
        });
      }
    }
  }, [rcaStage, rcaSuspectNodeId, nodes, setCenter]);

  const nodeTypes = useMemo(
    () => ({
      chapterHull: ChapterHullNode,
      conceptPill: ConceptPillNode,
      hobbyAnchor: HobbyAnchorNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      steppingStone: SteppingStoneEdge,
      causal: SteppingStoneEdge,
      bridge: SteppingStoneEdge,
    }),
    []
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: '#2C3539',
      },
    }),
    []
  );

  // Calculate 1-hop direct neighbors of the selected node
  const neighborNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const neighbors = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedNodeId) neighbors.add(e.target);
      if (e.target === selectedNodeId) neighbors.add(e.source);
    });
    return neighbors;
  }, [selectedNodeId, edges]);

  // Inject isSelected and isNeighbor into node data dynamically for reactive rendering
  const displayNodes = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = node.id === selectedNodeId;
      const isNeighbor = neighborNodeIds.has(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          isSelected,
          isNeighbor,
        },
      };
    });
  }, [nodes, selectedNodeId, neighborNodeIds]);

  // Transform all edges into physical stepping stone trailways with RCA status
  const displayEdges = useMemo(() => {
    return edges.map((edge) => {
      const isRcaActive =
        rcaPathEdgeIds.includes(edge.id) ||
        rcaPathEdgeIds.includes(`edge_${edge.source}_${edge.target}`) ||
        (rcaPathNodeIds.includes(edge.source) && rcaPathNodeIds.includes(edge.target));
      const relationshipLabel =
        (edge.data as any)?.relationship_label ||
        (edge.data as any)?.label ||
        edge.label ||
        '';
      return {
        ...edge,
        type: 'steppingStone',
        data: {
          ...edge.data,
          label: relationshipLabel,
          relationship_label: relationshipLabel,
          isBridge: Boolean(
            (edge.data as any)?.is_isomorphism_bridge ||
            (edge.data as any)?.isBridge ||
            edge.type === 'bridge'
          ),
          isRcaActive: Boolean(isRcaActive || edge.data?.isRcaActive),
        },
      };
    });
  }, [edges, rcaPathEdgeIds, rcaPathNodeIds]);

  // Click on node: select, open inspection drawer, and smoothly pan/center camera
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'chapterHull') return;
      setSelectedNodeId(node.id);
      setSelectedConcept(node.data as any);
      openDrawer(node.data as any);
      setCenter(node.position.x + 115, node.position.y + 37, {
        zoom: 1.15,
        duration: 600,
      });
    },
    [setSelectedNodeId, setSelectedConcept, openDrawer, setCenter]
  );

  // Click on background canvas: dismiss selection
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleDiscoverBridges = async () => {
    if (!userProfile?.id) return;
    try {
      const res = await api.discoverBridges(userProfile.id);
      if (res.discovered_bridges && res.discovered_bridges.length > 0) {
        await loadUserGraph(userProfile.id);
        const b = res.discovered_bridges[0];
        setLatestArtifact({
          bridge_label: b.relationship_label,
          real_world_artifact:
            b.real_world_artifact ||
            'Cross-Chapter Isomorphism: Discovered structural mathematical duality between both chapters.',
        });
      }
    } catch (err) {
      console.error('Error discovering bridges:', err);
    }
  };

  return (
    <div className="relative w-full h-full bg-transparent overflow-hidden">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.15}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#171A21" gap={28} size={1} variant={BackgroundVariant.Dots} className="opacity-15" />
        <Controls className="!bauhaus-glass !border-2 !border-bauhaus-ink !text-bauhaus-ink !shadow-[3px_3px_0px_#171A21] !rounded-xl overflow-hidden [&>button]:!border-bauhaus-border [&>button]:!bg-white [&>button:hover]:!bg-slate-100" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bauhaus-glass !border-2 !border-bauhaus-ink !rounded-xl !shadow-[3px_3px_0px_#171A21]"
          maskColor="rgba(255, 255, 255, 0.7)"
        />
      </ReactFlow>

      {/* Floating Canvas Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-bauhaus-ink hover:bg-bauhaus-blue text-white text-xs font-mono font-bold shadow-[2px_2px_0px_#F59E0B] transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Chapter</span>
        </button>

        <button
          onClick={handleDiscoverBridges}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 border-2 border-bauhaus-ink text-bauhaus-ink text-xs font-mono font-bold shadow-[2px_2px_0px_#171A21] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-bauhaus-amber" />
          <span>Discover Hidden Links</span>
        </button>

        <button
          onClick={() => fitView({ padding: 0.2, duration: 600 })}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border-2 border-bauhaus-ink text-bauhaus-ink text-xs font-mono font-bold shadow-[2px_2px_0px_#171A21] transition-all"
          title="Fit view to all chapters"
        >
          <Maximize2 className="w-3.5 h-3.5 text-bauhaus-muted" />
          <span>Fit Map</span>
        </button>

        {activeTracePath.length > 0 && (
          <button
            onClick={clearActiveTracePath}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-100 border-2 border-bauhaus-red text-bauhaus-red text-xs font-mono font-bold shadow-[2px_2px_0px_#EF4444] animate-pulse"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Clue Trace</span>
          </button>
        )}

        <button
          onClick={async () => {
            if (
              window.confirm(
                'Are you sure you want to clear all graph nodes, chapters, and assessment data? This will reset your track to a fresh canvas.'
              )
            ) {
              await clearAllData();
            }
          }}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 border-2 border-bauhaus-ink hover:border-bauhaus-red text-bauhaus-muted hover:text-bauhaus-red text-xs font-mono font-bold shadow-[2px_2px_0px_#171A21] transition-all"
          title="Clear all graph nodes and reset track"
        >
          <Trash2 className="w-3.5 h-3.5 text-bauhaus-red" />
          <span>Reset Map</span>
        </button>
      </div>

      {/* Tactile Stone Archipelago Trail Legend and Active Anchor */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bauhaus-glass border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21] text-[10px] font-mono font-black text-bauhaus-ink uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-bauhaus-blue" />
            <span>Tessera // Cognitive Compiler</span>
          </div>
        </div>

        {userProfile && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bauhaus-glass border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21] text-bauhaus-ink text-xs font-mono font-bold">
            <Compass className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
            <span>
              HOME BASE: <strong className="text-bauhaus-ink font-black uppercase">{userProfile.hobby_anchor}</strong>
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-xl bauhaus-glass border-2 border-bauhaus-ink text-[11px] font-mono text-[#2C3539] shadow-[3px_3px_0px_#171A21] font-bold">
          <div className="flex items-center space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>Mastered (Moss)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Puzzle className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>Needs Tuning (Wobbly)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
              <Compass className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>Ready to Explore</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0">
              <Lock className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>Mystery Milestone</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>Stepping-Stone Bridge</span>
          </div>
        </div>
      </div>

      {/* Rich Interactive Node Inspection Drawer */}
      {!hideFloatingDrawer && <NodeInspectionDrawer />}
    </div>
  );
};

export const ConceptCanvas: React.FC<{ onOpenUpload: () => void; hideFloatingDrawer?: boolean }> = ({
  onOpenUpload,
  hideFloatingDrawer,
}) => {
  return <ConceptCanvasInner onOpenUpload={onOpenUpload} hideFloatingDrawer={hideFloatingDrawer} />;
};

