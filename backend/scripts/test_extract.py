import json
from app.services.llm_service import llm_service

sample_text = """
Chapter 1: Electric Potential and Drift Velocity
When an external electric field is applied across a solid metallic conductor, free conduction electrons experience an electrostatic force. Rather than accelerating infinitely, mobile electrons undergo repetitive non-elastic scattering against the positive ionic crystal lattice. This mechanical drag opposes the electrostatic push, establishing a steady terminal drift velocity.
The electric potential difference represents the energy per unit charge available to push electrons through this dense lattice barrier. A steeper potential gradient imparts greater acceleration between collision events. 
Electric current is directly proportional to the number density of mobile charge carriers, their elemental charge, the conductor cross-sectional geometry, and their steady-state drift speed. When electrons collide with the ionic lattice, kinetic energy is dissipated into crystal vibrational energy, creating thermal agitation.
Fundamental Conservation Law: Current continuity dictates that charge cannot accumulate inside any steady-state junction. The rate at which charge carriers enter any region equals the rate at which they exit.
"""

res = llm_service.extract_chapter_graph(
    pdf_text_sample=sample_text,
    hobby_anchor="Music Production",
    chapter_title="Electric Potential & Drift Dynamics",
    subject="Physics: Electromagnetism"
)

with open("extraction_output.json", "w", encoding="utf-8") as f:
    json.dump(res, f, indent=2)

print("Saved extraction_output.json")
