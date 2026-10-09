import json
import logging
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from app.config import settings

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self._pool: Optional[pool.ThreadedConnectionPool] = None
        self._init_pool()

    def _init_pool(self):
        if not settings.DATABASE_URL:
            logger.warning("DATABASE_URL is not configured. Database operations will require DATABASE_URL.")
            return
        try:
            self._pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                dsn=settings.DATABASE_URL
            )
            logger.info("Database connection pool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize DB connection pool: {e}")
            raise e

    @contextmanager
    def get_cursor(self, commit: bool = False):
        if not self._pool:
            self._init_pool()
        if not self._pool:
            raise RuntimeError("Database connection pool not available. Please configure DATABASE_URL in .env.")
        conn = self._pool.getconn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                yield cur
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"DB Error: {e}")
            raise e
        finally:
            self._pool.putconn(conn)

    # =========================================================================
    # Profiles / Students
    # =========================================================================
    def get_or_create_profile(self, email: str, display_name: Optional[str] = None, hobby_anchor: str = "Music Production") -> Dict[str, Any]:
        with self.get_cursor(commit=True) as cur:
            cur.execute("SELECT * FROM profiles WHERE email = %s;", (email,))
            row = cur.fetchone()
            if row:
                return dict(row)
            
            cur.execute(
                """
                INSERT INTO profiles (email, display_name, hobby_anchor)
                VALUES (%s, %s, %s)
                RETURNING *;
                """,
                (email, display_name or email.split("@")[0], hobby_anchor)
            )
            row = cur.fetchone()
            return dict(row)

    def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute("SELECT * FROM profiles WHERE id = %s;", (user_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    def update_profile_hobby(self, user_id: str, hobby_anchor: str) -> Optional[Dict[str, Any]]:
        with self.get_cursor(commit=True) as cur:
            cur.execute(
                "UPDATE profiles SET hobby_anchor = %s WHERE id = %s RETURNING *;",
                (hobby_anchor, user_id)
            )
            row = cur.fetchone()
            return dict(row) if row else None

    # =========================================================================
    # Chapters
    # =========================================================================
    def create_chapter(self, user_id: str, title: str, subject: str, order_index: int = 1) -> Dict[str, Any]:
        with self.get_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO chapters (user_id, title, subject, order_index)
                VALUES (%s, %s, %s, %s)
                RETURNING *;
                """,
                (user_id, title, subject, order_index)
            )
            return dict(cur.fetchone())

    def get_chapters_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute("SELECT * FROM chapters WHERE user_id = %s ORDER BY order_index ASC;", (user_id,))
            return [dict(r) for r in cur.fetchall()]

    def get_chapter(self, chapter_id: str) -> Optional[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute("SELECT * FROM chapters WHERE id = %s;", (chapter_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    # =========================================================================
    # Concept Nodes
    # =========================================================================
    def upsert_concept_nodes(self, nodes: List[Dict[str, Any]]) -> None:
        if not nodes:
            return
        with self.get_cursor(commit=True) as cur:
            for n in nodes:
                cur.execute(
                    """
                    INSERT INTO concept_nodes (id, chapter_id, label, core_invariant, jargon_blacklist, is_hobby_anchor, position_x, position_y, hobby_analogy)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        label = EXCLUDED.label,
                        core_invariant = EXCLUDED.core_invariant,
                        jargon_blacklist = EXCLUDED.jargon_blacklist,
                        is_hobby_anchor = EXCLUDED.is_hobby_anchor,
                        position_x = EXCLUDED.position_x,
                        position_y = EXCLUDED.position_y,
                        hobby_analogy = EXCLUDED.hobby_analogy;
                    """,
                    (
                        n["id"],
                        n["chapter_id"],
                        n["label"],
                        n["core_invariant"],
                        n.get("jargon_blacklist", []),
                        n.get("is_hobby_anchor", False),
                        n.get("position_x", 0.0),
                        n.get("position_y", 0.0),
                        n.get("hobby_analogy", "")
                    )
                )

    def get_concepts_by_chapter(self, chapter_id: str) -> List[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute("SELECT * FROM concept_nodes WHERE chapter_id = %s;", (chapter_id,))
            return [dict(r) for r in cur.fetchall()]

    def get_all_concepts_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute(
                """
                SELECT cn.*, c.title as chapter_title, c.subject as chapter_subject
                FROM concept_nodes cn
                JOIN chapters c ON cn.chapter_id = c.id
                WHERE c.user_id = %s;
                """,
                (user_id,)
            )
            return [dict(r) for r in cur.fetchall()]

    def get_concept(self, concept_id: str) -> Optional[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute("SELECT * FROM concept_nodes WHERE id = %s;", (concept_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    # =========================================================================
    # Concept Edges
    # =========================================================================
    def upsert_concept_edges(self, edges: List[Dict[str, Any]]) -> None:
        if not edges:
            return
        with self.get_cursor(commit=True) as cur:
            for e in edges:
                cur.execute(
                    """
                    INSERT INTO concept_edges (chapter_id, source_node_id, target_node_id, relationship_label, is_cross_chapter, is_isomorphism_bridge, connection_reason, real_world_artifact)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (source_node_id, target_node_id) DO UPDATE SET
                        relationship_label = EXCLUDED.relationship_label,
                        is_cross_chapter = EXCLUDED.is_cross_chapter,
                        is_isomorphism_bridge = EXCLUDED.is_isomorphism_bridge,
                        connection_reason = EXCLUDED.connection_reason,
                        real_world_artifact = EXCLUDED.real_world_artifact;
                    """,
                    (
                        e.get("chapter_id"),
                        e["source_node_id"],
                        e["target_node_id"],
                        e["relationship_label"],
                        e.get("is_cross_chapter", False),
                        e.get("is_isomorphism_bridge", False),
                        e.get("connection_reason", ""),
                        e.get("real_world_artifact", "")
                    )
                )

    def get_edges_by_chapter(self, chapter_id: str) -> List[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute("SELECT * FROM concept_edges WHERE chapter_id = %s;", (chapter_id,))
            return [dict(r) for r in cur.fetchall()]

    def get_all_edges_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute(
                """
                SELECT ce.* 
                FROM concept_edges ce
                JOIN chapters c ON ce.chapter_id = c.id
                WHERE c.user_id = %s;
                """,
                (user_id,)
            )
            return [dict(r) for r in cur.fetchall()]

    # =========================================================================
    # Student Epistemic States (BKT State Persistence)
    # =========================================================================
    def get_epistemic_state(self, user_id: str, concept_id: str) -> Optional[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute(
                "SELECT * FROM student_epistemic_states WHERE user_id = %s AND concept_id = %s;",
                (user_id, concept_id)
            )
            row = cur.fetchone()
            if row and isinstance(row.get("active_misconceptions"), str):
                row["active_misconceptions"] = json.loads(row["active_misconceptions"])
            return dict(row) if row else None

    def get_all_epistemic_states_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        with self.get_cursor() as cur:
            cur.execute(
                "SELECT * FROM student_epistemic_states WHERE user_id = %s;",
                (user_id,)
            )
            rows = cur.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                if isinstance(d.get("active_misconceptions"), str):
                    d["active_misconceptions"] = json.loads(d["active_misconceptions"])
                results.append(d)
            return results

    def upsert_epistemic_state(
        self,
        user_id: str,
        concept_id: str,
        p_mastery: float,
        status: str,
        active_misconceptions: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        misconceptions_json = json.dumps(active_misconceptions or [])
        with self.get_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO student_epistemic_states (user_id, concept_id, p_mastery, status, active_misconceptions, last_assessed_at)
                VALUES (%s, %s, %s, %s, %s::jsonb, NOW())
                ON CONFLICT (user_id, concept_id) DO UPDATE SET
                    p_mastery = EXCLUDED.p_mastery,
                    status = EXCLUDED.status,
                    active_misconceptions = EXCLUDED.active_misconceptions,
                    last_assessed_at = NOW()
                RETURNING *;
                """,
                (user_id, concept_id, p_mastery, status, misconceptions_json)
            )
            row = dict(cur.fetchone())
            if isinstance(row.get("active_misconceptions"), str):
                row["active_misconceptions"] = json.loads(row["active_misconceptions"])
            return row

    # =========================================================================
    # Assessment Logs
    # =========================================================================
    def log_assessment(
        self,
        user_id: str,
        concept_id: str,
        tier_1_passed: bool,
        tier_2_passed: bool,
        selected_distractor_id: Optional[str] = None,
        jargon_failed: bool = False,
        rca_triggered: bool = False,
        blame_node_id: Optional[str] = None
    ) -> Dict[str, Any]:
        with self.get_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO assessment_logs (
                    user_id, concept_id, tier_1_passed, tier_2_passed,
                    selected_distractor_id, jargon_failed, rca_triggered, blame_node_id
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    user_id,
                    concept_id,
                    tier_1_passed,
                    tier_2_passed,
                    selected_distractor_id,
                    jargon_failed,
                    rca_triggered,
                    blame_node_id
                )
            )
            return dict(cur.fetchone())

    def clear_user_data(self, user_id: str) -> None:
        with self.get_cursor(commit=True) as cur:
            cur.execute("DELETE FROM chapters WHERE user_id = %s;", (user_id,))
            cur.execute("DELETE FROM student_epistemic_states WHERE user_id = %s;", (user_id,))
            cur.execute("DELETE FROM assessment_logs WHERE user_id = %s;", (user_id,))

db = DatabaseService()
