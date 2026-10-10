import logging
import uuid
from typing import List, Dict, Any, Tuple
import fitz # PyMuPDF
from app.db.supabase_client import db
from app.services.vector_store import vector_service
from app.services.llm_service import llm_service
from app.services.graph_engine import graph_engine

logger = logging.getLogger(__name__)

class IngestionService:
    @staticmethod
    def extract_text_from_pdf_stream(pdf_bytes: bytes) -> str:
        """
        Parses text from a PDF file using PyMuPDF (fitz).
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text_pages = []
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            text = page.get_text("text")
            if text:
                text_pages.append(text)
        doc.close()
        return "\n\n".join(text_pages)

    @staticmethod
    def chunk_text(text: str, chunk_size_chars: int = 2400, overlap_chars: int = 300) -> List[str]:
        """
        Splits text into ~800-token chunks with 100-token overlap.
        """
        chunks = []
        start = 0
        total_len = len(text)
        while start < total_len:
            end = min(start + chunk_size_chars, total_len)
            chunks.append(text[start:end])
            if end == total_len:
                break
            start += chunk_size_chars - overlap_chars
        return chunks

    @staticmethod
    def ingest_and_extract_chapter(
        user_id: str,
        title: str,
        subject: str,
        pdf_bytes: bytes,
        hobby_anchor: str
    ) -> Dict[str, Any]:
        """
        End-to-end ingestion pipeline:
        1. Extract text from PDF
        2. Chunk & index to Upstash Vector
        3. Extract Concept DAG + Hobby Anchor using Groq
        4. Save Chapter, Nodes, Edges into Supabase
        5. Check and weave cross-chapter isomorphism bridges
        """
        # 1. Extract Text
        full_text = IngestionService.extract_text_from_pdf_stream(pdf_bytes)
        if not full_text.strip():
            raise ValueError("The provided PDF does not contain extractable text.")

        # Determine chapter order index
        existing_chapters = db.get_chapters_for_user(user_id)
        order_index = len(existing_chapters) + 1

        # 2. Create Chapter in Supabase
        chapter = db.create_chapter(
            user_id=user_id,
            title=title,
            subject=subject,
            order_index=order_index
        )
        chapter_id = chapter["id"]

        # 3. Chunk text for Upstash Vector
        from concurrent.futures import ThreadPoolExecutor

        chunks = IngestionService.chunk_text(full_text)
        vector_chunks = []
        for idx, chk in enumerate(chunks):
            vector_chunks.append({
                "id": f"chunk_{chapter_id}_{idx}",
                "text": chk,
                "metadata": {
                    "chapter_id": chapter_id,
                    "chapter_title": title,
                    "section_title": f"Section {idx+1}: {title}",
                    "subject": subject,
                    "user_id": user_id,
                    "text": chk
                }
            })

        # 4. Concurrently execute Upstash Vector indexing and Groq LLM Graph Extraction
        sample_context = full_text[:9000]
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_vector = executor.submit(vector_service.upsert_chapter_chunks, vector_chunks)
            future_extract = executor.submit(
                llm_service.extract_chapter_graph,
                pdf_text_sample=sample_context,
                hobby_anchor=hobby_anchor,
                chapter_title=title,
                subject=subject
            )
            extraction_data = future_extract.result()
            try:
                future_vector.result(timeout=10)
            except Exception as ve:
                logger.warning(f"Vector indexing non-fatal warning: {ve}")

        raw_concepts = extraction_data.get("concepts", [])
        raw_edges = extraction_data.get("edges", [])

        # Guarantee at least 6 non-hobby concepts even if an LLM fallback returned fewer
        non_hobby_raw = [c for c in raw_concepts if not c.get("is_hobby_anchor")]
        if len(non_hobby_raw) < 6:
            existing_labels = {c.get("label", "").lower() for c in non_hobby_raw}
            t_low = (title + " " + sample_context[:1500]).lower()
            if "drift" in t_low or "potential" in t_low:
                fallback_pool = [
                    {"id": "electric_field", "label": "Electric Field", "core_invariant": "Force per unit charge establishing vector field across potential gradient", "jargon_blacklist": ["field", "charge", "force", "voltage"], "hobby_analogy": f"In {hobby_anchor}, this acts like the primary driving gradient that initiates movement across the entire system."},
                    {"id": "electrostatic_force", "label": "Electrostatic Force", "core_invariant": "Force equals charge multiplied by electric field (F = qE)", "jargon_blacklist": ["force", "charge", "electric"], "hobby_analogy": f"In {hobby_anchor}, this behaves like direct input amplification pushing active elements forward."},
                    {"id": "free_conduction_electrons", "label": "Free Conduction Electrons", "core_invariant": "Mobile charge carriers occupying the conduction band", "jargon_blacklist": ["electron", "conduction", "carrier"], "hobby_analogy": f"In {hobby_anchor}, these are the active mobile agents ready to flow as soon as pressure is applied."},
                    {"id": "non_elastic_scattering", "label": "Lattice Scattering & Drag", "core_invariant": "Momentum transfer to ionic lattice with energy dissipated as thermal agitation", "jargon_blacklist": ["scattering", "lattice", "collision"], "hobby_analogy": f"In {hobby_anchor}, this mirrors friction or server/mechanical drag that opposes unchecked acceleration."},
                    {"id": "terminal_drift_velocity", "label": "Terminal Drift Velocity", "core_invariant": "Steady-state carrier velocity where electrostatic drive equals lattice drag", "jargon_blacklist": ["drift", "velocity", "terminal"], "hobby_analogy": f"In {hobby_anchor}, this is the sustainable steady-state speed reached when forward push balances drag."},
                    {"id": "current_continuity", "label": "Current Continuity Law", "core_invariant": "Conservation of charge: rate of charge entering any volume equals exit rate", "jargon_blacklist": ["continuity", "current", "conservation"], "hobby_analogy": f"In {hobby_anchor}, this is strict throughput conservation where inflow rate must equal outflow rate."},
                ]
            elif "resist" in t_low or "joule" in t_low or "ohm" in t_low:
                fallback_pool = [
                    {"id": "geometric_resistance", "label": "Geometric Resistance", "core_invariant": "Impedance proportional to length and inversely proportional to area R = rho*(L/A)", "jargon_blacklist": ["resistance", "resistivity", "ohm"], "hobby_analogy": f"In {hobby_anchor}, a narrower bottleneck directly restricts throughput capacity."},
                    {"id": "material_resistivity", "label": "Intrinsic Material Resistivity", "core_invariant": "Microscopic scattering density governing intrinsic material impedance", "jargon_blacklist": ["resistivity", "impurity", "lattice"], "hobby_analogy": f"In {hobby_anchor}, this represents the baseline friction of the medium itself."},
                    {"id": "ohms_constitutive_law", "label": "Ohm's Constitutive Law", "core_invariant": "Potential drop across a barrier is strictly proportional to flux (V = I*R)", "jargon_blacklist": ["ohm", "voltage", "current"], "hobby_analogy": f"In {hobby_anchor}, pressure drop across a choke point scales linearly with flow rate."},
                    {"id": "joule_heating", "label": "Joule Thermal Dissipation", "core_invariant": "Rate of thermal power dissipation P = I^2 * R", "jargon_blacklist": ["joule", "heat", "dissipation", "power"], "hobby_analogy": f"In {hobby_anchor}, forcing high throughput through a heavy bottleneck converts energy into excess heat/wear."},
                    {"id": "thermal_lattice_vibration", "label": "Thermal Lattice Agitation", "core_invariant": "Temperature elevation expands ionic vibration cross-section, increasing resistivity", "jargon_blacklist": ["thermal", "vibration", "temperature"], "hobby_analogy": f"In {hobby_anchor}, system overheating increases internal noise and further degrades performance."},
                    {"id": "kirchhoff_loop_conservation", "label": "Kirchhoff's Loop Conservation", "core_invariant": "Algebraic sum of potential gains and drops around any closed loop equals zero", "jargon_blacklist": ["kirchhoff", "loop", "voltage"], "hobby_analogy": f"In {hobby_anchor}, total energy/resource gains and expenditures around a complete cycle must balance to zero."},
                ]
            else:
                fallback_pool = [
                    {"id": "electrostatic_capacitance", "label": "Geometric Capacitance", "core_invariant": "Accumulated charge is strictly proportional to applied potential Q = C*V", "jargon_blacklist": ["capacitance", "charge", "farad"], "hobby_analogy": f"In {hobby_anchor}, storage buffer capacity determines how much reserve accumulates for a given pressure."},
                    {"id": "dielectric_polarization", "label": "Dielectric Dipole Polarization", "core_invariant": "Aligned molecular dipoles generate bound surface charge opposing external field", "jargon_blacklist": ["dielectric", "dipole", "polarization"], "hobby_analogy": f"In {hobby_anchor}, internal buffering counteracts peak pressure spikes to allow higher storage density."},
                    {"id": "field_energy_density", "label": "Electrostatic Energy Density", "core_invariant": "Potential energy stored within the dielectric field volume U = 0.5*C*V^2", "jargon_blacklist": ["energy", "density", "electrostatic"], "hobby_analogy": f"In {hobby_anchor}, stored potential energy scales quadratically with the intensity of buildup."},
                    {"id": "rc_charging_dynamics", "label": "RC Transient Relaxation", "core_invariant": "Exponential voltage relaxation governed by series resistive current limit", "jargon_blacklist": ["transient", "exponential", "charging"], "hobby_analogy": f"In {hobby_anchor}, filling a reserve through a bottleneck follows a diminishing-returns curve."},
                    {"id": "characteristic_time_constant", "label": "Characteristic Time Constant (tau = RC)", "core_invariant": "Product of resistance and capacitance defining the 63.2% relaxation timescale", "jargon_blacklist": ["constant", "tau", "timescale"], "hobby_analogy": f"In {hobby_anchor}, the cooldown/recharge duration is set by multiplying bottleneck drag by storage size."},
                    {"id": "mechanical_spring_duality", "label": "Elastic Compliance Isomorphism", "core_invariant": "Mathematical duality mapping capacitance C to mechanical spring compliance 1/k", "jargon_blacklist": ["compliance", "spring", "hooke"], "hobby_analogy": f"In {hobby_anchor}, electrical storage elasticity mirrors mechanical suspension absorbing and releasing energy."},
                ]
            for fb in fallback_pool:
                if len(non_hobby_raw) >= 6:
                    break
                if fb["label"].lower() not in existing_labels:
                    raw_concepts.append({**fb, "is_hobby_anchor": False})
                    non_hobby_raw.append(fb)
                    existing_labels.add(fb["label"].lower())

        # Assign unique prefixed IDs if needed to avoid cross-chapter collisions
        concept_id_map = {}
        processed_concepts = []
        for idx, c in enumerate(raw_concepts):
            orig_id = c.get("id", f"concept_{idx+1}")
            is_hobby = c.get("is_hobby_anchor", False)
            if is_hobby:
                scoped_id = f"hobby_{chapter_id[:8]}"
            else:
                scoped_id = f"c_{chapter_id[:8]}_{orig_id.replace(' ', '_').lower()}"

            # Map multiple casings and variations so edges always match
            concept_id_map[orig_id] = scoped_id
            concept_id_map[orig_id.lower()] = scoped_id
            concept_id_map[orig_id.replace(" ", "_").lower()] = scoped_id
            concept_id_map[orig_id.replace("_", " ").lower()] = scoped_id
            if c.get("label"):
                concept_id_map[c["label"]] = scoped_id
                concept_id_map[c["label"].lower()] = scoped_id
                concept_id_map[c["label"].replace(" ", "_").lower()] = scoped_id

            hobby_analogy = c.get("hobby_analogy") or c.get("is_hobby_analogy") or c.get("analogy")
            if not hobby_analogy:
                lbl = c.get("label", "this concept")
                inv = c.get("core_invariant", "its invariant balance")
                hobby_analogy = f"In {hobby_anchor}, {lbl} behaves directly like an operational stage maintaining {inv}."
            processed_concepts.append({
                "id": scoped_id,
                "chapter_id": chapter_id,
                "label": c.get("label", "Concept"),
                "core_invariant": c.get("core_invariant", "Mechanical invariance"),
                "jargon_blacklist": c.get("jargon_blacklist", []),
                "is_hobby_anchor": is_hobby,
                "hobby_analogy": hobby_analogy,
                "position_x": 0.0,
                "position_y": 0.0
            })

        # Ensure a hobby anchor node exists if one wasn't returned
        hobby_node_id = next((c["id"] for c in processed_concepts if c["is_hobby_anchor"]), None)
        if not hobby_node_id and hobby_anchor:
            hobby_node_id = f"hobby_{chapter_id[:8]}"
            hobby_node = {
                "id": hobby_node_id,
                "chapter_id": chapter_id,
                "label": f"{hobby_anchor} Cognitive Anchor",
                "core_invariant": f"Primary world-model grounding for {hobby_anchor}",
                "jargon_blacklist": [],
                "is_hobby_anchor": True,
                "hobby_analogy": f"Primary world model anchor in {hobby_anchor}",
                "position_x": 0.0,
                "position_y": 0.0
            }
            processed_concepts.insert(0, hobby_node)

        # Find chapter entrypoint concept (first non-hobby concept)
        entrypoint_concept_id = next((c["id"] for c in processed_concepts if not c["is_hobby_anchor"]), None)

        processed_edges = []
        has_hobby_edge = False

        for e in raw_edges:
            src = e.get("source", "")
            tgt = e.get("target", "")
            mapped_src = concept_id_map.get(src, src)
            mapped_tgt = concept_id_map.get(tgt, tgt)
            if not mapped_src or not mapped_tgt or mapped_src == mapped_tgt:
                continue

            # If edge involves hobby node: ONLY allow connection to entrypoint concept
            is_hobby_edge = (mapped_src == hobby_node_id or mapped_tgt == hobby_node_id)
            if is_hobby_edge:
                if not has_hobby_edge and entrypoint_concept_id:
                    processed_edges.append({
                        "chapter_id": chapter_id,
                        "source_node_id": hobby_node_id,
                        "target_node_id": entrypoint_concept_id,
                        "relationship_label": f"Cognitive Anchor to {hobby_anchor}",
                        "connection_reason": f"Experiential cognitive anchor anchoring chapter entrypoint to {hobby_anchor}.",
                        "is_cross_chapter": False,
                        "is_isomorphism_bridge": False
                    })
                    has_hobby_edge = True
                # Skip any other spiderweb hobby edges
                continue

            src_c = next((c for c in processed_concepts if c["id"] == mapped_src), None)
            tgt_c = next((c for c in processed_concepts if c["id"] == mapped_tgt), None)
            
            conn_reason = e.get("connection_reason")
            if not conn_reason or len(conn_reason.strip()) < 10:
                if src_c and tgt_c:
                    s_lbl = src_c.get("label", "Source principle")
                    s_inv = src_c.get("core_invariant", "conservation invariant")
                    t_lbl = tgt_c.get("label", "target principle")
                    t_inv = tgt_c.get("core_invariant", "equilibrium state")
                    conn_reason = f"{s_lbl} establishes the prerequisite physical state ({s_inv}), which directly enables and constrains {t_lbl} to maintain {t_inv}."
                else:
                    conn_reason = "Prerequisite physical invariant governing causal progression toward target element."

            # Regular intra-chapter causal edge
            processed_edges.append({
                "chapter_id": chapter_id,
                "source_node_id": mapped_src,
                "target_node_id": mapped_tgt,
                "relationship_label": e.get("relationship_label", "causes / governs"),
                "connection_reason": conn_reason,
                "is_cross_chapter": False,
                "is_isomorphism_bridge": False
            })

        # Resilient Fallback DAG Builder:
        # Check how many intra-chapter causal edges were formed
        non_hobby_concepts = [c for c in processed_concepts if not c.get("is_hobby_anchor")]
        intra_edges = [
            e for e in processed_edges
            if e.get("source_node_id") != hobby_node_id and e.get("target_node_id") != hobby_node_id
        ]

        if len(intra_edges) < 2 and len(non_hobby_concepts) >= 2:
            logger.warning(
                f"Chapter '{title}' had only {len(intra_edges)} valid intra-chapter edges from LLM. "
                f"Auto-generating resilient branching diamond DAG causal edges across {len(non_hobby_concepts)} concepts..."
            )
            n = len(non_hobby_concepts)
            if n == 2:
                c0, c1 = non_hobby_concepts[0], non_hobby_concepts[1]
                processed_edges.append({
                    "chapter_id": chapter_id,
                    "source_node_id": c0["id"],
                    "target_node_id": c1["id"],
                    "relationship_label": "causally enables",
                    "connection_reason": f"{c0['label']} establishes the foundational invariant ({c0.get('core_invariant', 'conservation law')}), which directly drives and enables {c1['label']} ({c1.get('core_invariant', 'equilibrium state')}).",
                    "is_cross_chapter": False,
                    "is_isomorphism_bridge": False
                })
            elif n == 3:
                c0, c1, c2 = non_hobby_concepts[0], non_hobby_concepts[1], non_hobby_concepts[2]
                processed_edges.append({
                    "chapter_id": chapter_id,
                    "source_node_id": c0["id"],
                    "target_node_id": c1["id"],
                    "relationship_label": "branches into",
                    "connection_reason": f"{c0['label']} ({c0.get('core_invariant', 'conservation law')}) establishes the prerequisite physical foundation that directly drives parallel branch {c1['label']}.",
                    "is_cross_chapter": False,
                    "is_isomorphism_bridge": False
                })
                processed_edges.append({
                    "chapter_id": chapter_id,
                    "source_node_id": c0["id"],
                    "target_node_id": c2["id"],
                    "relationship_label": "branches into",
                    "connection_reason": f"{c0['label']} ({c0.get('core_invariant', 'conservation law')}) establishes the prerequisite physical foundation that directly drives parallel branch {c2['label']}.",
                    "is_cross_chapter": False,
                    "is_isomorphism_bridge": False
                })
                processed_edges.append({
                    "chapter_id": chapter_id,
                    "source_node_id": c1["id"],
                    "target_node_id": c2["id"],
                    "relationship_label": "converges with",
                    "connection_reason": f"Operational rate dynamics in {c1['label']} ({c1.get('core_invariant', 'rate balance')}) converge with {c0['label']} to mechanically constrain {c2['label']}.",
                    "is_cross_chapter": False,
                    "is_isomorphism_bridge": False
                })
            else:
                # Multi-branch diamond DAG:
                # C0 (root) branches into C1 and C2
                # C1 and C2 converge into C3
                processed_edges.append({
                    "chapter_id": chapter_id,
                    "source_node_id": non_hobby_concepts[0]["id"],
                    "target_node_id": non_hobby_concepts[1]["id"],
                    "relationship_label": "branches into",
                    "connection_reason": f"{non_hobby_concepts[0]['label']} establishes foundational invariant ({non_hobby_concepts[0].get('core_invariant', 'conservation law')}), which directly drives parallel branch {non_hobby_concepts[1]['label']}.",
                    "is_cross_chapter": False,
                    "is_isomorphism_bridge": False
                })
                processed_edges.append({
                    "chapter_id": chapter_id,
                    "source_node_id": non_hobby_concepts[0]["id"],
                    "target_node_id": non_hobby_concepts[2]["id"],
                    "relationship_label": "branches into",
                    "connection_reason": f"{non_hobby_concepts[0]['label']} establishes foundational invariant ({non_hobby_concepts[0].get('core_invariant', 'conservation law')}), which directly drives parallel branch {non_hobby_concepts[2]['label']}.",
                    "is_cross_chapter": False,
                    "is_isomorphism_bridge": False
                })
                processed_edges.append({
                    "chapter_id": chapter_id,
                    "source_node_id": non_hobby_concepts[1]["id"],
                    "target_node_id": non_hobby_concepts[3]["id"],
                    "relationship_label": "converges into",
                    "connection_reason": f"Dynamic rate balance in {non_hobby_concepts[1]['label']} ({non_hobby_concepts[1].get('core_invariant', 'rate balance')}) converges into synthesis invariant {non_hobby_concepts[3]['label']}.",
                    "is_cross_chapter": False,
                    "is_isomorphism_bridge": False
                })
                processed_edges.append({
                    "chapter_id": chapter_id,
                    "source_node_id": non_hobby_concepts[2]["id"],
                    "target_node_id": non_hobby_concepts[3]["id"],
                    "relationship_label": "converges into",
                    "connection_reason": f"Complementary physical constraints in {non_hobby_concepts[2]['label']} ({non_hobby_concepts[2].get('core_invariant', 'flux balance')}) converge into synthesis invariant {non_hobby_concepts[3]['label']}.",
                    "is_cross_chapter": False,
                    "is_isomorphism_bridge": False
                })
                # Subsequent concepts branch and converge across parents
                for idx in range(4, n):
                    parent_a = non_hobby_concepts[idx - 1]
                    parent_b = non_hobby_concepts[idx - 2]
                    processed_edges.append({
                        "chapter_id": chapter_id,
                        "source_node_id": parent_a["id"],
                        "target_node_id": non_hobby_concepts[idx]["id"],
                        "relationship_label": "causally drives",
                        "connection_reason": f"Physical understanding of {parent_a['label']} ({parent_a.get('core_invariant', 'conservation invariant')}) mechanically enables and constrains {non_hobby_concepts[idx]['label']}.",
                        "is_cross_chapter": False,
                        "is_isomorphism_bridge": False
                    })
                    if idx % 2 == 1:
                        # Second converging parent for alternating nodes (multi-parent diamond structure)
                        processed_edges.append({
                            "chapter_id": chapter_id,
                            "source_node_id": parent_b["id"],
                            "target_node_id": non_hobby_concepts[idx]["id"],
                            "relationship_label": "converges with",
                            "connection_reason": f"Invariant conservation in {parent_b['label']} ({parent_b.get('core_invariant', 'conservation balance')}) converges with {parent_a['label']} to govern {non_hobby_concepts[idx]['label']}.",
                            "is_cross_chapter": False,
                            "is_isomorphism_bridge": False
                        })

        # Ensure no completely disconnected non-hobby concepts remain orphan floating nodes
        connected_node_ids = set()
        for e in processed_edges:
            connected_node_ids.add(e["source_node_id"])
            connected_node_ids.add(e["target_node_id"])

        for i, c in enumerate(non_hobby_concepts):
            if c["id"] not in connected_node_ids:
                prev_node = non_hobby_concepts[i - 1] if i > 0 else (non_hobby_concepts[1] if len(non_hobby_concepts) > 1 else None)
                if prev_node and prev_node["id"] != c["id"]:
                    processed_edges.append({
                        "chapter_id": chapter_id,
                        "source_node_id": prev_node["id"],
                        "target_node_id": c["id"],
                        "relationship_label": "governs",
                        "connection_reason": f"Mechanistic causal relationship linking {prev_node['label']} to {c['label']}.",
                        "is_cross_chapter": False,
                        "is_isomorphism_bridge": False
                    })
                    connected_node_ids.add(c["id"])

        # Ensure at least the single hobby edge exists if hobby node and entrypoint exist
        if not has_hobby_edge and hobby_node_id and entrypoint_concept_id:
            processed_edges.append({
                "chapter_id": chapter_id,
                "source_node_id": hobby_node_id,
                "target_node_id": entrypoint_concept_id,
                "relationship_label": f"Cognitive Anchor to {hobby_anchor}",
                "connection_reason": f"Experiential cognitive anchor anchoring chapter entrypoint to {hobby_anchor}.",
                "is_cross_chapter": False,
                "is_isomorphism_bridge": False
            })

        # Save concepts & edges into Supabase
        db.upsert_concept_nodes(processed_concepts)
        db.upsert_concept_edges(processed_edges)

        # Initialize student epistemic state for all concepts
        for c in processed_concepts:
            if not c.get("is_hobby_anchor"):
                db.upsert_epistemic_state(
                    user_id=user_id,
                    concept_id=c["id"],
                    p_mastery=0.15,
                    status="UNVERIFIED",
                    active_misconceptions=[]
                )

        # 5. Fast Progressive Cross-Chapter Isomorphism Bridge Discovery
        isomorphism_bridges = []
        all_user_concepts = db.get_all_concepts_for_user(user_id)
        prior_concepts = [c for c in all_user_concepts if str(c.get("chapter_id")) != str(chapter_id) and not c.get("is_hobby_anchor")]
        new_syllabus_concepts = [c for c in processed_concepts if not c.get("is_hobby_anchor")]

        if prior_concepts and new_syllabus_concepts:
            try:
                # Fast batch bridge discovery (1 single LLM call instead of N x M slow serial loops!)
                discovered = llm_service.discover_cross_chapter_bridges(prior_concepts, new_syllabus_concepts)
                for b in discovered[:2]:
                    src_id = b.get("source_node_id")
                    tgt_id = b.get("target_node_id")
                    # Match candidate concept IDs
                    src_match = next((c["id"] for c in prior_concepts if c["id"] == src_id or (src_id and src_id in c["id"])), prior_concepts[0]["id"] if prior_concepts else None)
                    tgt_match = next((c["id"] for c in new_syllabus_concepts if c["id"] == tgt_id or (tgt_id and tgt_id in c["id"])), new_syllabus_concepts[0]["id"] if new_syllabus_concepts else None)

                    if src_match and tgt_match and src_match != tgt_match:
                        bridge_edge = {
                            "chapter_id": chapter_id,
                            "source_node_id": src_match,
                            "target_node_id": tgt_match,
                            "relationship_label": f"ISOMORPHISM: {b.get('bridge_label', 'Shared Mechanism')}",
                            "connection_reason": b.get("connection_reason", "Both concepts obey an identical governing mathematical balance equation across distinct physical media."),
                            "real_world_artifact": b.get("real_world_artifact", "Cross-Chapter Isomorphism: Discovered structural mathematical duality between both chapters."),
                            "is_cross_chapter": True,
                            "is_isomorphism_bridge": True
                        }
                        db.upsert_concept_edges([bridge_edge])
                        isomorphism_bridges.append(bridge_edge)
            except Exception as e:
                logger.error(f"Error discovering isomorphism bridges: {e}")

        # Reload graph in memory
        graph_engine.reload_user_graph(user_id)

        return {
            "chapter": chapter,
            "concepts_count": len(processed_concepts),
            "edges_count": len(processed_edges),
            "isomorphism_bridges": isomorphism_bridges
        }

ingestion_service = IngestionService()
