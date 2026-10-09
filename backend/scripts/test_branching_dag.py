import json
from app.services.llm_service import llm_service

system_prompt = """You are a principal cognitive curriculum architect.
Extract exactly 6 to 8 key atomic concepts plus 1 Hobby Anchor node.
MANDATORY: Build a TRUE MULTI-BRANCHING DAG SKILL TREE with branching and converging prerequisite paths (e.g. Diamond pattern: Concept A branches into B and C; both B and C converge into D; D branches into E and F).
DO NOT create a single linear chain or linked list!
Concepts must feature parallel branches and convergence so students face independent causal paths.
Every non-hobby concept must be connected in the DAG.

Output strict JSON:
{
  "chapter_title": "Chapter Title",
  "subject": "Subject",
  "concepts": [
    {"id": "id1", "label": "Title", "core_invariant": "Law", "jargon_blacklist": [], "is_hobby_anchor": false, "hobby_analogy": "..."}
  ],
  "edges": [
    {"source": "id1", "target": "id2", "relationship_label": "governs", "connection_reason": "..."}
  ]
}
"""

sample_text = """When an external electric field is applied across a solid metallic conductor, free conduction electrons experience an electrostatic force. Rather than accelerating infinitely, mobile electrons undergo repetitive non-elastic scattering against the positive ionic crystal lattice. This mechanical drag opposes the electrostatic push, establishing a steady terminal drift velocity.
The electric potential difference represents the energy per unit charge available to push electrons through this dense lattice barrier. A steeper potential gradient imparts greater acceleration between collision events. 
Electric current is directly proportional to the number density of mobile charge carriers, their elemental charge, the conductor cross-sectional geometry, and their steady-state drift speed.
Fundamental Conservation Law: Current continuity dictates that charge cannot accumulate inside any steady-state junction."""

for model in ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]:
    print(f"\n--- Testing {model} ---")
    try:
        res = llm_service.client_70b.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Textbook Context:\n{sample_text}\nStudent Hobby: Music Production"}
            ],
            response_format={"type": "json_object"},
            max_tokens=3000,
            temperature=0.1
        )
        data = json.loads(res.choices[0].message.content)
        concepts = data.get("concepts", [])
        edges = data.get("edges", [])
        print(f"Concepts ({len(concepts)}):", [c.get("id") for c in concepts])
        print(f"Edges ({len(edges)}):")
        for e in edges:
            print(" ", e.get("source"), "->", e.get("target"))
        
        # Check DAG in-degrees and out-degrees
        in_deg = {}
        out_deg = {}
        for e in edges:
            s, t = e.get("source"), e.get("target")
            out_deg[s] = out_deg.get(s, 0) + 1
            in_deg[t] = in_deg.get(t, 0) + 1
        has_branching = any(v > 1 for v in out_deg.values())
        has_convergence = any(v > 1 for v in in_deg.values())
        print(f"Has Branching (out > 1): {has_branching}, Has Convergence (in > 1): {has_convergence}")
    except Exception as ex:
        print(f"Failed: {ex}")
