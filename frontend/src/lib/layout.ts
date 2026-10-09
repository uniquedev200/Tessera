import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 250;
const NODE_HEIGHT = 82;
const HULL_PADDING_X = 90;
const HULL_PADDING_TOP = 110;
const HULL_PADDING_BOTTOM = 80;
const CHAPTER_GAP_X = 260;

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Computes deterministic hierarchical layout using @dagrejs/dagre:
 * - Generously spaced nodesep (120px) and ranksep (160px) for maximum breathing room and visual elegance.
 * - Detached, luminous backdrop hulls with ample padding and open atmosphere (no blurry dark boxes).
 * - Distinct chapter territories separated by 260px horizontal gaps.
 * - Single Anchor Pattern grounding Chapter 1 root concept to the hobby world-model.
 */
export function computeHierarchicalLayout(nodes: Node[], edges: Edge[]): LayoutResult {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: edges || [] };
  }

  const chapterHulls = nodes.filter((n) => n.type === 'chapterHull');
  const conceptNodes = nodes.filter((n) => n.type === 'conceptPill');
  const hobbyNodes = nodes.filter(
    (n) => n.type === 'hobbyAnchor' || n.data?.is_hobby_anchor || n.data?.isHobbyAnchor
  );

  const finalNodes: Node[] = [];
  const finalEdges: Edge[] = [];
  let currentChapterX = 80;

  // Sort chapters by order_index / orderIndex
  const sortedChapters = [...chapterHulls].sort(
    (a, b) =>
      Number(a.data?.orderIndex ?? a.data?.order_index ?? 1) -
      Number(b.data?.orderIndex ?? b.data?.order_index ?? 1)
  );

  const nodePositionMap = new Map<string, { x: number; y: number; chapterId: string }>();

  sortedChapters.forEach((chapter) => {
    const chapterId = chapter.id;
    const rawChapterId = String(chapter.data?.chapter_id || chapter.id.replace('hull_', ''));

    // Match child concepts safely across all ID formats
    const children = conceptNodes.filter((c) => {
      const nodeChId = String(c.data?.chapterId || c.data?.chapter_id || '').replace('hull_', '');
      return (
        nodeChId === rawChapterId ||
        c.data?.chapterId === chapterId ||
        c.data?.chapter_id === chapterId
      );
    });

    if (children.length === 0) {
      currentChapterX += 450 + CHAPTER_GAP_X;
      return;
    }

    // Isolate intra-chapter edges
    const childIds = new Set(children.map((c) => c.id));
    const internalEdges = edges.filter(
      (e) =>
        childIds.has(e.source) &&
        childIds.has(e.target) &&
        !e.data?.isBridge &&
        !e.data?.is_isomorphism_bridge &&
        e.type !== 'bridge' &&
        !e.data?.is_hobby_anchor &&
        !e.data?.isHobbyAnchor
    );

    // Initialize Dagre directed graph with generous spacing
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: 'TB', // Top-to-Bottom flow
      align: 'DL',
      nodesep: 120,  // Generous horizontal spacing between sibling branches
      ranksep: 160,  // Generous vertical spacing between hierarchy levels
      marginx: 0,
      marginy: 0,
    });
    g.setDefaultEdgeLabel(() => ({}));

    children.forEach((child) => {
      g.setNode(child.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    if (internalEdges.length === 0 && children.length > 1) {
      // Resilient fallback for Dagre: synthesize sequential flow so nodes never collapse into a single vertical line
      for (let i = 0; i < children.length - 1; i++) {
        g.setEdge(children[i].id, children[i + 1].id);
      }
    } else {
      internalEdges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
      });
    }

    dagre.layout(g);

    // Calculate bounding box in absolute canvas coordinates
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const positionedChildren: Node[] = children.map((child) => {
      const pos = g.node(child.id);
      const absX = currentChapterX + (pos.x - NODE_WIDTH / 2);
      const absY = 160 + (pos.y - NODE_HEIGHT / 2);

      minX = Math.min(minX, absX);
      maxX = Math.max(maxX, absX + NODE_WIDTH);
      minY = Math.min(minY, absY);
      maxY = Math.max(maxY, absY + NODE_HEIGHT);

      const placed: Node = {
        ...child,
        position: { x: absX, y: absY },
        style: { width: NODE_WIDTH, height: NODE_HEIGHT, zIndex: 10 },
      };

      nodePositionMap.set(child.id, { x: absX, y: absY, chapterId: rawChapterId });
      return placed;
    });

    finalNodes.push(...positionedChildren);

    // Compute enclosing Chapter Hull dimensions with open breathing room
    const hullX = minX - HULL_PADDING_X;
    const hullY = minY - HULL_PADDING_TOP;
    const hullWidth = maxX - minX + HULL_PADDING_X * 2;
    const hullHeight = maxY - minY + HULL_PADDING_TOP + HULL_PADDING_BOTTOM;

    finalNodes.push({
      ...chapter,
      position: { x: hullX, y: hullY },
      style: {
        width: hullWidth,
        height: hullHeight,
        zIndex: 0,
        pointerEvents: 'none', // Prevents backdrop from capturing node clicks
      },
      data: {
        ...chapter.data,
        width: hullWidth,
        height: hullHeight,
      },
    });

    currentChapterX = hullX + hullWidth + CHAPTER_GAP_X;
  });

  // Handle Hobby Anchor badge positioned above Chapter 1 root concept
  const chapter1 = sortedChapters[0];
  const rawCh1Id = chapter1
    ? String(chapter1.data?.chapter_id || chapter1.id.replace('hull_', ''))
    : '';

  const hobbyNode =
    hobbyNodes.find((n) => {
      const nChId = String(n.data?.chapterId || n.data?.chapter_id || '').replace('hull_', '');
      return nChId === rawCh1Id;
    }) || hobbyNodes[0];
  const hobbyNodeId = hobbyNode?.id;

  const ch1Children = finalNodes.filter(
    (n) =>
      n.type === 'conceptPill' &&
      (String(n.data?.chapterId || n.data?.chapter_id || '').replace('hull_', '') === rawCh1Id ||
        n.data?.chapterId === chapter1?.id)
  );

  const sortedCh1 = [...ch1Children].sort((a, b) => a.position.y - b.position.y);
  const chapter1RootConcept = sortedCh1[0];
  const rootConceptId = chapter1RootConcept?.id;

  if (hobbyNode && chapter1RootConcept) {
    const hobbyX = chapter1RootConcept.position.x + NODE_WIDTH / 2 - 125;
    const ch1Hull = finalNodes.find((n) => n.id === chapter1?.id);
    const hullY = ch1Hull?.position.y ?? 120;
    const hobbyY = Math.max(20, hullY - 95);

    finalNodes.push({
      ...hobbyNode,
      position: {
        x: hobbyX,
        y: hobbyY,
      },
      style: { width: 250, zIndex: 15 },
    });
    nodePositionMap.set(hobbyNode.id, { x: hobbyX, y: hobbyY, chapterId: 'hobby' });
  }

  // Handle Edges and enforce Single Anchor Pattern
  let hobbyEdgeCreated = false;

  edges.forEach((edge) => {
    const isFromHobby = edge.source === hobbyNodeId;
    const isToHobby = edge.target === hobbyNodeId;

    if (isFromHobby || isToHobby) {
      if (rootConceptId && (edge.target === rootConceptId || edge.source === rootConceptId)) {
        if (!hobbyEdgeCreated) {
          hobbyEdgeCreated = true;
          finalEdges.push({
            ...edge,
            source: hobbyNodeId!,
            target: rootConceptId,
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'causal',
            animated: true,
            data: {
              ...edge.data,
              relationship_label: 'Grounds Invariant',
              is_hobby_anchor: true,
              isHobbyAnchor: true,
            },
          });
        }
      }
      return; // Skip any extra spiderweb edges to other concepts
    }

    const srcPos = nodePositionMap.get(edge.source);
    const tgtPos = nodePositionMap.get(edge.target);

    const isCrossChapter =
      edge.data?.is_isomorphism_bridge ||
      edge.data?.isBridge ||
      edge.type === 'bridge' ||
      Boolean(srcPos && tgtPos && srcPos.chapterId !== tgtPos.chapterId);

    if (isCrossChapter) {
      const isLeftToRight = !srcPos || !tgtPos || srcPos.x < tgtPos.x;
      finalEdges.push({
        ...edge,
        type: 'bridge',
        sourceHandle: isLeftToRight ? 'right' : 'left',
        targetHandle: isLeftToRight ? 'left' : 'right',
      });
    } else {
      finalEdges.push({
        ...edge,
        type: 'causal',
        sourceHandle: 'bottom',
        targetHandle: 'top',
      });
    }
  });

  // Guarantee single hobby anchor edge to Chapter 1 root concept
  if (hobbyNodeId && rootConceptId && !hobbyEdgeCreated) {
    finalEdges.push({
      id: `edge_${hobbyNodeId}_${rootConceptId}`,
      source: hobbyNodeId,
      target: rootConceptId,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'causal',
      animated: true,
      data: {
        relationship_label: 'Grounds Invariant',
        is_hobby_anchor: true,
        isHobbyAnchor: true,
      },
    });
  }

  return { nodes: finalNodes, edges: finalEdges };
}

// Backward compatibility alias
export const getLayoutedGraph = computeHierarchicalLayout;
