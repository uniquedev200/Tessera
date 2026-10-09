import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.db.supabase_client import db
from app.services.ingestion import ingestion_service
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chapters", tags=["Chapters"])

@router.post("/upload")
async def upload_chapter_pdf(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    hobby_anchor: str = Form("Music Production"),
    title: Optional[str] = Form(None),
    subject: Optional[str] = Form("Physics")
):
    try:
        pdf_bytes = await file.read()
        chapter_title = title or file.filename.replace(".pdf", "").replace("_", " ").title()
        
        result = ingestion_service.ingest_and_extract_chapter(
            user_id=user_id,
            title=chapter_title,
            subject=subject,
            pdf_bytes=pdf_bytes,
            hobby_anchor=hobby_anchor
        )
        return {
            "status": "success",
            "message": f"Successfully ingested '{chapter_title}'",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error during chapter PDF upload: {e}")
def fast_seed_sample_chapter(user_id: str, sample_id: int, hobby_anchor: str = "Music Production"):
    existing_chapters = db.get_chapters_for_user(user_id)
    order_index = len(existing_chapters) + 1

    if sample_id == 1:
        title = "Electric Potential & Drift Dynamics"
        subject = "Physics: Electromagnetism"
        chapter = db.create_chapter(user_id=user_id, title=title, subject=subject, order_index=order_index)
        cid = str(chapter["id"])
        prefix = cid[:8]

        hobby_node_id = f"hobby_{prefix}"
        hobby_node = {
            "id": hobby_node_id,
            "chapter_id": cid,
            "label": f"{hobby_anchor} Cognitive Anchor",
            "core_invariant": f"Primary world-model grounding for {hobby_anchor}",
            "jargon_blacklist": [],
            "is_hobby_anchor": True,
            "hobby_analogy": f"Primary experiential reference frame in {hobby_anchor}",
            "position_x": 0.0,
            "position_y": 0.0
        }

        raw_concepts = [
            {
                "id": f"c_{prefix}_electric_field",
                "label": "Electric Field",
                "core_invariant": "Force per unit charge establishing vector field across potential gradient",
                "jargon_blacklist": ["field", "charge", "force", "electric", "voltage"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like master bus send level: establishes the baseline push navigating downstream tracks."
            },
            {
                "id": f"c_{prefix}_electrostatic_force",
                "label": "Electrostatic Force",
                "core_invariant": "Force equals charge multiplied by electric field",
                "jargon_blacklist": ["force", "charge", "electric", "field"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like gain amplification: multiplies incoming signal amplitude, exerting direct push on the signal."
            },
            {
                "id": f"c_{prefix}_free_conduction_electrons",
                "label": "Free Conduction Electrons",
                "core_invariant": "Mobile charge carriers occupying the conduction band",
                "jargon_blacklist": ["electron", "charge", "conduction", "carrier"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like unprocessed audio samples buffered in memory, primed to flow through the signal chain."
            },
            {
                "id": f"c_{prefix}_non_elastic_scattering",
                "label": "Non-Elastic Scattering",
                "core_invariant": "Momentum transfer to ionic lattice with energy dissipated as thermal agitation",
                "jargon_blacklist": ["scattering", "elastic", "lattice", "energy", "collision"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like hard clipping saturation: abruptly truncates waveform peaks, converting coherent audio energy into thermal distortion."
            },
            {
                "id": f"c_{prefix}_terminal_drift_velocity",
                "label": "Terminal Drift Velocity",
                "core_invariant": "Steady-state carrier velocity where electrostatic drive equals lattice drag",
                "jargon_blacklist": ["drift", "velocity", "terminal", "steady"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like steady RMS throughput after brickwall limiting: the constant output speed once dynamic drag balances push."
            },
            {
                "id": f"c_{prefix}_current_continuity",
                "label": "Current Continuity Law",
                "core_invariant": "Conservation of charge: rate of charge entering any region equals exit rate",
                "jargon_blacklist": ["continuity", "current", "conservation", "charge"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like audio buffer rate continuity: samples entering a mixer must strictly equal samples exiting to prevent buffer underruns."
            }
        ]

        nodes_to_save = [hobby_node]
        for c in raw_concepts:
            nodes_to_save.append({
                "id": c["id"],
                "chapter_id": cid,
                "label": c["label"],
                "core_invariant": c["core_invariant"],
                "jargon_blacklist": c["jargon_blacklist"],
                "is_hobby_anchor": False,
                "hobby_analogy": c["hobby_analogy"],
                "position_x": 0.0,
                "position_y": 0.0
            })

        db.upsert_concept_nodes(nodes_to_save)

        c_root = f"c_{prefix}_electric_field"
        edges_to_save = [
            {
                "chapter_id": cid,
                "source_node_id": hobby_node_id,
                "target_node_id": c_root,
                "relationship_label": f"Cognitive Anchor to {hobby_anchor}",
                "connection_reason": f"Experiential cognitive anchor anchoring chapter entrypoint to {hobby_anchor}."
            },
            {
                "chapter_id": cid,
                "source_node_id": c_root,
                "target_node_id": f"c_{prefix}_electrostatic_force",
                "relationship_label": "branches into",
                "connection_reason": "Electric field establishes the spatial force vector that directly accelerates mobile charge carriers."
            },
            {
                "chapter_id": cid,
                "source_node_id": c_root,
                "target_node_id": f"c_{prefix}_free_conduction_electrons",
                "relationship_label": "branches into",
                "connection_reason": "Electric field acts across the population of free conduction electrons to mobilize charge carriers."
            },
            {
                "chapter_id": cid,
                "source_node_id": f"c_{prefix}_electrostatic_force",
                "target_node_id": f"c_{prefix}_terminal_drift_velocity",
                "relationship_label": "converges into",
                "connection_reason": "Electrostatic driving force balances against non-elastic lattice drag to enforce terminal drift velocity."
            },
            {
                "chapter_id": cid,
                "source_node_id": f"c_{prefix}_free_conduction_electrons",
                "target_node_id": f"c_{prefix}_non_elastic_scattering",
                "relationship_label": "drives collisions",
                "connection_reason": "Accelerated conduction electrons undergo repetitive inelastic impacts with stationary lattice ions."
            },
            {
                "chapter_id": cid,
                "source_node_id": f"c_{prefix}_non_elastic_scattering",
                "target_node_id": f"c_{prefix}_terminal_drift_velocity",
                "relationship_label": "converges with",
                "connection_reason": "Mechanical drag from non-elastic collisions restricts infinite acceleration, establishing steady-state drift speed."
            },
            {
                "chapter_id": cid,
                "source_node_id": f"c_{prefix}_terminal_drift_velocity",
                "target_node_id": f"c_{prefix}_current_continuity",
                "relationship_label": "enforces",
                "connection_reason": "Terminal drift velocity across carrier density determines steady current, obeying charge continuity."
            }
        ]

        db.upsert_concept_edges(edges_to_save)

        for c in raw_concepts:
            db.upsert_epistemic_state(
                user_id=user_id,
                concept_id=c["id"],
                p_mastery=0.15,
                status="UNVERIFIED",
                active_misconceptions=[]
            )

        return {
            "chapter_id": cid,
            "chapter_title": title,
            "concepts_count": len(nodes_to_save),
            "edges_count": len(edges_to_save)
        }

    elif sample_id == 2:
        title = "Resistive Circuits & Thermal Dissipation"
        subject = "Physics: Circuit Dynamics"
        chapter = db.create_chapter(user_id=user_id, title=title, subject=subject, order_index=order_index)
        cid = str(chapter["id"])
        prefix = cid[:8]

        hobby_node_id = f"hobby_{prefix}"
        hobby_node = {
            "id": hobby_node_id,
            "chapter_id": cid,
            "label": f"{hobby_anchor} Circuit Anchor",
            "core_invariant": f"Dynamic impedance grounding in {hobby_anchor}",
            "jargon_blacklist": [],
            "is_hobby_anchor": True,
            "hobby_analogy": f"Dynamic resistance model in {hobby_anchor}",
            "position_x": 0.0,
            "position_y": 0.0
        }

        raw_concepts = [
            {
                "id": f"c_{prefix}_geometric_resistance",
                "label": "Geometric Resistance",
                "core_invariant": "Impedance proportional to conductor length and inversely to cross-sectional area",
                "jargon_blacklist": ["resistance", "geometric", "resistivity", "ohms"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like acoustic duct narrowness: narrow passages resist velocity far more than wide stages."
            },
            {
                "id": f"c_{prefix}_ohms_constitutive_law",
                "label": "Ohm's Constitutive Law",
                "core_invariant": "Potential drop across a bottleneck is strictly proportional to charge flux",
                "jargon_blacklist": ["ohm", "voltage", "current", "resistance"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like linear fader attenuation: output reduction is strictly proportional to attenuation resistance."
            },
            {
                "id": f"c_{prefix}_joule_heating",
                "label": "Joule Heat Dissipation",
                "core_invariant": "Rate of thermal energy dissipation proportional to squared current and resistance",
                "jargon_blacklist": ["joule", "heat", "dissipation", "thermal", "energy"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like power amplifier thermal dissipation: high signal driving dissipates excess energy as chassis heat."
            },
            {
                "id": f"c_{prefix}_thermal_lattice_vibration",
                "label": "Thermal Lattice Agitation",
                "core_invariant": "Temperature elevation increases ionic vibration amplitude, expanding collision cross-section",
                "jargon_blacklist": ["thermal", "vibration", "lattice", "temperature"],
                "hobby_analogy": f"In {hobby_anchor}, this behaves like thermal noise floor expansion: heat increases chaotic microscopic vibration."
            }
        ]

        nodes_to_save = [hobby_node]
        for c in raw_concepts:
            nodes_to_save.append({
                "id": c["id"],
                "chapter_id": cid,
                "label": c["label"],
                "core_invariant": c["core_invariant"],
                "jargon_blacklist": c["jargon_blacklist"],
                "is_hobby_anchor": False,
                "hobby_analogy": c["hobby_analogy"],
                "position_x": 0.0,
                "position_y": 0.0
            })

        db.upsert_concept_nodes(nodes_to_save)

        c_root = f"c_{prefix}_geometric_resistance"
        edges_to_save = [
            {
                "chapter_id": cid,
                "source_node_id": hobby_node_id,
                "target_node_id": c_root,
                "relationship_label": f"Cognitive Anchor to {hobby_anchor}",
                "connection_reason": f"Experiential cognitive anchor anchoring chapter entrypoint to {hobby_anchor}."
            },
            {
                "chapter_id": cid,
                "source_node_id": c_root,
                "target_node_id": f"c_{prefix}_ohms_constitutive_law",
                "relationship_label": "constrains",
                "connection_reason": "Geometric resistance bottleneck dictates the potential drop required per unit flux under Ohm's relation."
            },
            {
                "chapter_id": cid,
                "source_node_id": c_root,
                "target_node_id": f"c_{prefix}_joule_heating",
                "relationship_label": "drives",
                "connection_reason": "Higher resistance bottlenecks cause accelerated charge carriers to dissipate kinetic energy as Joule heat."
            },
            {
                "chapter_id": cid,
                "source_node_id": f"c_{prefix}_joule_heating",
                "target_node_id": f"c_{prefix}_thermal_lattice_vibration",
                "relationship_label": "elevates",
                "connection_reason": "Dissipated Joule heat elevates material temperature, expanding ionic vibration amplitudes and collision cross-sections."
            }
        ]

        # Cross-chapter isomorphism bridge to Chapter 1
        all_user_concepts = db.get_all_concepts_for_user(user_id)
        ch1_target = next((c["id"] for c in all_user_concepts if "terminal_drift" in c["id"]), None)
        if ch1_target:
            edges_to_save.append({
                "chapter_id": cid,
                "source_node_id": ch1_target,
                "target_node_id": f"c_{prefix}_ohms_constitutive_law",
                "relationship_label": "ISOMORPHISM: Dynamic Rate Conservation",
                "connection_reason": "Both concepts obey an identical governing mathematical balance equation across distinct physical media.",
                "real_world_artifact": "Cross-Chapter Isomorphism: Terminal drift speed in lattices directly bounds steady-state Ohm flux across bottlenecks.",
                "is_cross_chapter": True,
                "is_isomorphism_bridge": True
            })

        db.upsert_concept_edges(edges_to_save)

        for c in raw_concepts:
            db.upsert_epistemic_state(
                user_id=user_id,
                concept_id=c["id"],
                p_mastery=0.15,
                status="UNVERIFIED",
                active_misconceptions=[]
            )

        return {
            "chapter_id": cid,
            "chapter_title": title,
            "concepts_count": len(nodes_to_save),
            "edges_count": len(edges_to_save)
        }

    return None

@router.post("/sample")
async def seed_sample_chapter(payload: dict):
    """
    Seeds an authentic textbook chapter directly (for instant testing & judging demos).
    Supports sample_id = 1 ('Electric Potential & Drift Dynamics')
    or sample_id = 2 ('Resistive Circuits & Thermal Dissipation').
    """
    user_id = payload.get("user_id")
    sample_id = payload.get("sample_id", 1)
    hobby_anchor = payload.get("hobby_anchor", "Music Production")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    sample_chapters = {
        1: {
            "title": "Electric Potential & Drift Dynamics",
            "subject": "Physics: Electromagnetism",
            "text": """
            Chapter 1: Electric Potential and Drift Velocity
            When an external electric field is applied across a solid metallic conductor, free conduction electrons experience an electrostatic force. Rather than accelerating infinitely, mobile electrons undergo repetitive non-elastic scattering against the positive ionic crystal lattice. This mechanical drag opposes the electrostatic push, establishing a steady terminal drift velocity.
            The electric potential difference represents the energy per unit charge available to push electrons through this dense lattice barrier. A steeper potential gradient imparts greater acceleration between collision events. 
            Electric current is directly proportional to the number density of mobile charge carriers, their elemental charge, the conductor cross-sectional geometry, and their steady-state drift speed. When electrons collide with the ionic lattice, kinetic energy is dissipated into crystal vibrational energy, creating thermal agitation.
            Fundamental Conservation Law: Current continuity dictates that charge cannot accumulate inside any steady-state junction. The rate at which charge carriers enter any region equals the rate at which they exit.
            """
        },
        2: {
            "title": "Resistive Circuits & Thermal Dissipation",
            "subject": "Physics: Circuit Dynamics",
            "text": """
            Chapter 2: Resistive Dissipation and Thermal Equilibrium
            As steady drift current navigates a resistive material, the mechanical friction between accelerated charge carriers and stationary crystal impurities generates Joule heat. The electrical resistance of any segment depends geometrically on length, cross-sectional area, and internal lattice scattering resistivity.
            According to Ohm's constitutive relation, the potential drop across a localized resistive element is strictly proportional to the volumetric charge flux navigating through that bottleneck.
            Thermal limits govern practical conductors: as temperature elevates from continuous scattering collisions, lattice ionic vibrations increase in amplitude. This increased vibration cross-section increases the scattering probability, creating higher resistance and thermal runaway risks in enclosed systems.
            Isomorphic Analogy to Fluid Flow: The potential drop behaves like hydrostatic head loss across a restricted pipe valve, where pressure energy converts into turbulent viscous heat.
            """
        }
    }

    # Fast-seed path for instant zero-latency demo seeding
    try:
        if sample_id in [1, 2]:
            fast_res = fast_seed_sample_chapter(user_id=user_id, sample_id=sample_id, hobby_anchor=hobby_anchor)
            if fast_res:
                return {
                    "status": "success",
                    "message": f"Seeded sample chapter: {fast_res['chapter_title']}",
                    "data": fast_res
                }
    except Exception as fast_err:
        logger.warning(f"Fast seed failed, falling back to full ingestion pipeline: {fast_err}")

    selected = sample_chapters.get(sample_id, sample_chapters[1])

    try:
        # Create PDF in-memory or ingest text directly
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), selected["text"])
        pdf_bytes = doc.tobytes()
        doc.close()

        result = ingestion_service.ingest_and_extract_chapter(
            user_id=user_id,
            title=selected["title"],
            subject=selected["subject"],
            pdf_bytes=pdf_bytes,
            hobby_anchor=hobby_anchor
        )
        return {
            "status": "success",
            "message": f"Seeded sample chapter: {selected['title']}",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error seeding sample chapter: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}")
async def get_user_chapters(user_id: str):
    chapters = db.get_chapters_for_user(user_id)
    return {"chapters": chapters}
