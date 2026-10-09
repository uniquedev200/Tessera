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
        raise HTTPException(status_code=500, detail=str(e))

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
