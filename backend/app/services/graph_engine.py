import logging
from typing import List, Dict, Any, Optional, Set
import networkx as nx
from app.db.supabase_client import db

logger = logging.getLogger(__name__)

class GraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.user_graphs: Dict[str, nx.DiGraph] = {}

    def get_user_graph(self, user_id: str) -> nx.DiGraph:
        if user_id not in self.user_graphs:
            g = nx.DiGraph()
            concepts = db.get_all_concepts_for_user(user_id)
            edges = db.get_all_edges_for_user(user_id)
            for c in concepts:
                g.add_node(c["id"], **c)
            for e in edges:
                g.add_edge(e["source_node_id"], e["target_node_id"], **e)
            self.user_graphs[user_id] = g
        return self.user_graphs[user_id]

    def reload_user_graph(self, user_id: str) -> nx.DiGraph:
        self.user_graphs.pop(user_id, None)
        return self.get_user_graph(user_id)

    def is_ancestor(self, user_id: str, blame_node_id: str, current_node_id: str) -> bool:
        g = self.get_user_graph(user_id)
        if not g.has_node(blame_node_id) or not g.has_node(current_node_id):
            return False
        try:
            return nx.has_path(g, blame_node_id, current_node_id)
        except Exception as e:
            logger.error(f"Error checking ancestor path in DAG: {e}")
            return False

    def get_trace_path(self, user_id: str, blame_node_id: str, current_node_id: str) -> List[str]:
        g = self.get_user_graph(user_id)
        if not g.has_node(blame_node_id) or not g.has_node(current_node_id):
            return [blame_node_id, current_node_id]
        try:
            return nx.shortest_path(g, blame_node_id, current_node_id)
        except Exception:
            return [blame_node_id, current_node_id]

    def get_ancestors_info(self, user_id: str, current_node_id: str) -> List[Dict[str, Any]]:
        g = self.get_user_graph(user_id)
        if not g.has_node(current_node_id):
            return []
        try:
            current_chapter_id = str(g.nodes[current_node_id].get("chapter_id", ""))

            # Construct intra-chapter causal DAG excluding cross-chapter isomorphism bridges
            causal_g = nx.DiGraph()
            for n, data in g.nodes(data=True):
                if str(data.get("chapter_id", "")) == current_chapter_id and not data.get("is_hobby_anchor"):
                    causal_g.add_node(n, **data)
            for u, v, data in g.edges(data=True):
                if not data.get("is_cross_chapter") and not data.get("is_isomorphism_bridge"):
                    if causal_g.has_node(u) and causal_g.has_node(v):
                        causal_g.add_edge(u, v, **data)

            if not causal_g.has_node(current_node_id):
                return []

            ancestor_ids = nx.ancestors(causal_g, current_node_id)
            results = []
            for a_id in ancestor_ids:
                node_data = causal_g.nodes.get(a_id, {})
                results.append({
                    "id": a_id,
                    "label": node_data.get("label", a_id),
                    "core_invariant": node_data.get("core_invariant", "")
                })
            return results
        except Exception as e:
            logger.error(f"Error fetching ancestors: {e}")
            return []

    def compute_layout(
        self,
        chapters: List[Dict[str, Any]],
        concepts: List[Dict[str, Any]],
        hobby_anchor_node: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Calculates canvas coordinates for React Flow:
        - Chapters placed side-by-side horizontally (e.g. Chapter 1 at x=100, Chapter 2 at x=750)
        - Concepts arranged in a clean grid/dag hierarchy inside their parent hull
        """
        positioned_concepts: List[Dict[str, Any]] = []
        chapter_x_offset = 60
        chapter_width = 540

        # Group concepts by chapter
        chapter_concepts: Dict[str, List[Dict[str, Any]]] = {}
        for c in concepts:
            ch_id = str(c.get("chapter_id", "default"))
            chapter_concepts.setdefault(ch_id, []).append(c)

        for ch_idx, ch in enumerate(chapters):
            ch_id = str(ch["id"])
            c_list = chapter_concepts.get(ch_id, [])
            base_x = chapter_x_offset + (ch_idx * (chapter_width + 120))
            
            # Position nodes in a 2-column or topological cascading layout
            for idx, c in enumerate(c_list):
                if c.get("is_hobby_anchor"):
                    pos_x = base_x + 30
                    pos_y = 70
                else:
                    col = idx % 2
                    row = idx // 2
                    pos_x = base_x + 30 + (col * 240)
                    pos_y = 170 + (row * 120)

                updated = {**c, "position_x": pos_x, "position_y": pos_y}
                positioned_concepts.append(updated)

        return positioned_concepts

graph_engine = GraphEngine()
