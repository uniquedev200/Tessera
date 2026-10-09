import os
import json
from groq import Groq
from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY_70B or os.getenv("GROQ_API_KEY_70B", ""))

system_prompt = """You are a principal cognitive curriculum architect.
Extract exactly 5 to 7 key atomic concepts from the provided textbook text, plus 1 Hobby Anchor node.
MANDATORY: You MUST also generate at least 5 to 7 causal directed edges connecting these concepts into a clean DAG skill tree.

Output strict JSON with schema:
{
  "chapter_title": "Electric Potential & Drift Dynamics",
  "subject": "Physics: Electromagnetism",
  "concepts": [
    {
      "id": "electric_potential",
      "label": "Electric Potential Difference",
      "core_invariant": "Work done per unit charge across an energy gradient",
      "jargon_blacklist": ["voltage", "potential"],
      "is_hobby_anchor": false,
      "hobby_analogy": "Analogy in Music Production"
    },
    {
      "id": "hobby_anchor_music",
      "label": "Music Production Cognitive Anchor",
      "core_invariant": "Primary acoustic world-model grounding",
      "jargon_blacklist": [],
      "is_hobby_anchor": true,
      "hobby_analogy": "World model anchor"
    }
  ],
  "edges": [
    {
      "source": "electric_potential",
      "target": "electric_field",
      "relationship_label": "drives / establishes",
      "connection_reason": "Potential gradient mechanically creates the electric field."
    }
  ]
}
"""

user_text = """
Chapter 1: Electric Potential and Drift Velocity
When an external electric field is applied across a solid metallic conductor, free conduction electrons experience an electrostatic force. Rather than accelerating infinitely, mobile electrons undergo repetitive non-elastic scattering against the positive ionic crystal lattice. This mechanical drag opposes the electrostatic push, establishing a steady terminal drift velocity.
The electric potential difference represents the energy per unit charge available to push electrons through this dense lattice barrier. A steeper potential gradient imparts greater acceleration between collision events. 
Electric current is directly proportional to the number density of mobile charge carriers, their elemental charge, the conductor cross-sectional geometry, and their steady-state drift speed. When electrons collide with the ionic lattice, kinetic energy is dissipated into crystal vibrational energy, creating thermal agitation.
Fundamental Conservation Law: Current continuity dictates that charge cannot accumulate inside any steady-state junction. The rate at which charge carriers enter any region equals the rate at which they exit.
"""

for model in ["qwen/qwen3.8-27b", "openai/gpt-oss-120b"]:
    print(f"\n--- Testing {model} ---")
    try:
        res = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Text:\n{user_text}"}
            ],
            response_format={"type": "json_object"},
            max_tokens=3000,
            temperature=0.1
        )
        data = json.loads(res.choices[0].message.content)
        concepts = data.get("concepts", [])
        edges = data.get("edges", [])
        print(f"Success! Concepts: {len(concepts)}, Edges: {len(edges)}")
        for e in edges:
            print(f"  Edge: {e.get('source')} -> {e.get('target')}")
    except Exception as e:
        print(f"Failed: {e}")
