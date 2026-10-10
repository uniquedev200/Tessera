import os
import json
import logging
import re
from typing import Dict, Any, List, Optional
from groq import Groq
from app.config import settings

logger = logging.getLogger(__name__)

def clean_json_response(content: str) -> Dict[str, Any]:
    """
    Cleans markdown formatting, <think> tags, fences, and whitespace to extract valid JSON.
    """
    content = re.sub(r"<think>[\s\S]*?</think>", "", content, flags=re.IGNORECASE).strip()
    # Match ```json ... ``` or ``` ... ```
    fence_pattern = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
    if fence_pattern:
        content = fence_pattern.group(1).strip()
    
    # Try direct parse
    try:
        return json.loads(content)
    except Exception:
        # Try finding outer braces
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            snippet = content[start:end+1]
            return json.loads(snippet)
        raise

class LLMService:
    def __init__(self):
        # 1. High-Reasoning / Synthesis Client (70B / 120B)
        self.key_70b = settings.GROQ_API_KEY_70B
        self.client_70b = Groq(api_key=self.key_70b) if self.key_70b else None
        self.model_70b = settings.GROQ_MODEL_70B

        # 2. Ultra-Fast Interactive Client (32B / 27B)
        self.key_32b = settings.GROQ_API_KEY_32B
        self.client_32b = Groq(api_key=self.key_32b) if self.key_32b else None
        self.model_32b = settings.GROQ_MODEL_32B

        # Candidate models for fallback (verified valid on Groq account)
        self.candidates_70b = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
        self.candidates_32b = ["qwen/qwen3.8-27b", "openai/gpt-oss-20b", "openai/gpt-oss-120b"]

    def _ensure_clients(self):
        if not self.client_70b and settings.GROQ_API_KEY_70B:
            self.key_70b = settings.GROQ_API_KEY_70B
            self.client_70b = Groq(api_key=self.key_70b)
        if not self.client_32b and settings.GROQ_API_KEY_32B:
            self.key_32b = settings.GROQ_API_KEY_32B
            self.client_32b = Groq(api_key=self.key_32b)

    def _call_70b(self, system_prompt: str, user_content: str, json_mode: bool = True, max_tokens: int = 4096) -> Dict[str, Any]:
        self._ensure_clients()
        if not self.client_70b and not self.client_32b:
            raise ValueError("Groq API keys are not configured. Please set GROQ_API_KEY_70B and/or GROQ_API_KEY_32B in your .env file.")
        last_error = None
        clients = [c for c in [self.client_70b, self.client_32b] if c is not None]
        for client in clients:
            for model in self.candidates_70b:
                for use_json_format in ([True, False] if json_mode else [False]):
                    try:
                        kwargs: Dict[str, Any] = {
                            "model": model,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_content}
                            ],
                            "temperature": 0.15,
                            "max_tokens": max_tokens
                        }
                        if use_json_format:
                            kwargs["response_format"] = {"type": "json_object"}
                        response = client.chat.completions.create(**kwargs)
                        raw = response.choices[0].message.content or "{}"
                        return clean_json_response(raw) if json_mode else {"text": raw}
                    except Exception as e:
                        logger.warning(f"70B call failed with model {model} (json_format={use_json_format}): {e}")
                        last_error = e
                        continue
        raise RuntimeError(f"All LLM candidate models failed: {last_error}")

    def _call_32b(self, system_prompt: str, user_content: str, json_mode: bool = True, max_tokens: int = 4096) -> Dict[str, Any]:
        self._ensure_clients()
        if not self.client_32b and not self.client_70b:
            raise ValueError("Groq API keys are not configured. Please set GROQ_API_KEY_32B and/or GROQ_API_KEY_70B in your .env file.")
        last_error = None
        clients = [c for c in [self.client_32b, self.client_70b] if c is not None]
        for client in clients:
            for model in self.candidates_32b:
                for use_json_format in ([True, False] if json_mode else [False]):
                    try:
                        kwargs: Dict[str, Any] = {
                            "model": model,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_content}
                            ],
                            "temperature": 0.1,
                            "max_tokens": max_tokens
                        }
                        if use_json_format:
                            kwargs["response_format"] = {"type": "json_object"}
                        response = client.chat.completions.create(**kwargs)
                        raw = response.choices[0].message.content or "{}"
                        return clean_json_response(raw) if json_mode else {"text": raw}
                    except Exception as e:
                        logger.warning(f"32B call failed with model {model} (json_format={use_json_format}): {e}")
                        last_error = e
                        continue
        raise RuntimeError(f"All 32B LLM models failed: {last_error}")

    # =========================================================================
    # 70B WORKLOADS: High Token Context, Structural Extraction, Deep Synthesis
    # =========================================================================

    def extract_chapter_graph(self, pdf_text_sample: str, hobby_anchor: str, chapter_title: str = "Chapter", subject: str = "Physics") -> Dict[str, Any]:
        """
        Uses 70B/32B: Requires deep structural comprehension across thousands of tokens 
        to extract clean atomic concept DAGs and formulate non-obvious, individual hobby analogies.
        """
        system_prompt = (
            "You are a principal cognitive curriculum architect.\n"
            "CRITICAL REQUIREMENT: Extract AT LEAST 6 to 7 distinct atomic concepts (is_hobby_anchor=false) from the provided textbook text, PLUS 1 Hobby Anchor node (is_hobby_anchor=true), for a total of 7 to 8 nodes in 'concepts'.\n"
            "NEVER return fewer than 6 non-hobby concepts! Even if the text is brief, decompose its physical mechanisms, governing equations, variables, and conservation laws into at least 6 distinct concept nodes.\n"
            "MANDATORY TOPOLOGY: Build a TRUE MULTI-BRANCHING DAG SKILL TREE with branching and converging causal paths (e.g. Diamond pattern: Concept A branches into B and C; both B and C converge into D; D branches into E and F).\n"
            "CRITICAL: DO NOT create a single linear 1D chain (A -> B -> C -> D). Real physical/system dynamics feature parallel causal tracks that synthesize together.\n"
            "- At least 1 foundational concept must branch to multiple downstream concepts (out-degree >= 2).\n"
            "- At least 2 concepts must have multiple upstream causal prerequisites converging into them (in-degree >= 2).\n"
            "Every non-hobby concept must be connected in the DAG. Avoid directed cycles.\n"
            "MANDATORY: You MUST include BOTH the 'concepts' array (7-8 nodes) AND the 'edges' array (7-10 edges) in the JSON output. Never omit 'edges'.\n"
            "MANDATORY: For EVERY edge, 'connection_reason' MUST be a specific, authentic physical/causal mechanism (1-2 sentences) explaining why source directly drives, constrains, or mathematically necessitates target. DO NOT write generic phrases.\n\n"
            f"When extracting concepts from text, produce a DISTINCT, non-obvious, concise 1-sentence hobby analogy for EVERY individual concept node grounded in '{hobby_anchor}'.\n"
            "NEVER repeat the same analogy across concepts.\n\n"
            "Output strict JSON with schema:\n"
            "{\n"
            f'  "chapter_title": "{chapter_title}",\n'
            f'  "subject": "{subject}",\n'
            '  "concepts": [\n'
            '    {\n'
            '      "id": "snake_case_id",\n'
            '      "label": "Concept Title",\n'
            '      "core_invariant": "Fundamental physical/logical conservation law",\n'
            '      "jargon_blacklist": ["noun1", "noun2"],\n'
            '      "is_hobby_anchor": false,\n'
            f'      "hobby_analogy": "Specific 1-sentence mechanical analogy in {hobby_anchor}"\n'
            '    }\n'
            '  ],\n'
            '  "edges": [\n'
            '    {\n'
            '      "source": "concept_id",\n'
            '      "target": "concept_id",\n'
            '      "relationship_label": "drives / establishes",\n'
            '      "connection_reason": "Specific physical reason (1-2 sentences) of how source physically governs or enables target."\n'
            '    }\n'
            '  ]\n'
            "}\n"
            "Also synthesize EXACTLY 1 Hobby Anchor Node in 'concepts':\n"
            "{\n"
            f'  "id": "hobby_anchor_{hobby_anchor.lower().replace(" ", "_")}",\n'
            f'  "label": "{hobby_anchor} Cognitive Anchor",\n'
            f'  "core_invariant": "Primary world-model grounding for {hobby_anchor}",\n'
            '  "jargon_blacklist": [],\n'
            '  "is_hobby_anchor": true,\n'
            f'  "hobby_analogy": "Primary world model anchor in {hobby_anchor}"\n'
            "}"
        )
        user_content = f"Chapter Title: {chapter_title}\nSubject: {subject}\nStudent Hobby Anchor: {hobby_anchor}\n\nTextbook Context:\n{pdf_text_sample[:7000]}"
        res = self._call_70b(system_prompt, user_content, json_mode=True, max_tokens=6000)
        non_hobby = [c for c in res.get("concepts", []) if not c.get("is_hobby_anchor")]
        if len(non_hobby) < 5:
            logger.warning(f"Initial extraction returned only {len(non_hobby)} non-hobby concepts; retrying with explicit expansion...")
            retry_content = (
                user_content
                + f"\n\nIMPORTANT: Your previous attempt only returned {len(non_hobby)} concepts. "
                "You MUST return at least 6 distinct non-hobby concepts (plus 1 hobby anchor = 7+ total nodes) and 7+ causal edges!"
            )
            try:
                res2 = self._call_70b(system_prompt, retry_content, json_mode=True, max_tokens=6000)
                if len([c for c in res2.get("concepts", []) if not c.get("is_hobby_anchor")]) > len(non_hobby):
                    res = res2
            except Exception as e:
                logger.warning(f"Retry extraction failed: {e}")
        return res

    def batch_regenerate_analogies(self, concepts: List[Dict[str, Any]], new_hobby: str) -> List[Dict[str, Any]]:
        """
        Batch regenerates unique, concept-specific analogies for a new hobby anchor using 70B.
        """
        system_prompt = (
            f"You are an expert cognitive curriculum architect specializing in analogical learning.\n"
            f"For the world-model domain '{new_hobby}', generate a DISTINCT, concrete analogy for each concept below.\n"
            f"Each analogy must ground that concept's specific core invariant into a concrete mechanical mechanism of '{new_hobby}'.\n"
            f"NEVER repeat the same analogy across concepts.\n"
            f"Return strict JSON:\n"
            f'{{"updated_nodes": [\n'
            f'  {{"id": "concept_id", "hobby_analogy": "Concrete mechanical analogy in {new_hobby}..."}}\n'
            f']}}'
        )
        concept_summaries = [
            {"id": c["id"], "label": c["label"], "core_invariant": c.get("core_invariant", "")}
            for c in concepts if not c.get("is_hobby_anchor")
        ]
        user_content = f"New Hobby Anchor: {new_hobby}\n\nConcepts:\n" + json.dumps(concept_summaries, indent=2)
        try:
            res = self._call_32b(system_prompt, user_content, json_mode=True)
            return res.get("updated_nodes", [])
        except Exception as e:
            logger.warning(f"32B failed in batch_regenerate_analogies, trying fallback: {e}")
            try:
                res = self._call_70b(system_prompt, user_content, json_mode=True)
                return res.get("updated_nodes", [])
            except Exception as e2:
                logger.error(f"Fallback also failed: {e2}")
                return [
                {
                    "id": c["id"],
                    "hobby_analogy": f"In {new_hobby}, {c['label']} acts like a localized element maintaining {c.get('core_invariant', 'throughput equilibrium')}."
                }
                for c in concepts if not c.get("is_hobby_anchor")
            ]

    def generate_two_tier_diagnostic(
        self, concept_label: str, invariant: str, textbook_context: str, ancestor_nodes: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Uses 70B: Formulates authentic student misconceptions for Tier 2 distractors.
        Smaller models generate trivial wrong answers; 70B creates authentic traps.
        """
        ancestor_info = ""
        if ancestor_nodes:
            ancestor_info = "Upstream Ancestor Concepts in DAG:\n" + "\n".join(
                [f"- ID: {a['id']}, Label: {a['label']}, Invariant: {a['core_invariant']}" for a in ancestor_nodes]
            )

        system_prompt = (
            "You are an expert psychometrician specializing in David Treagust's Two-Tier Diagnostic Instruments. "
            "Generate a rigorous two-tier diagnostic test for this concept.\n"
            "Tier 1: Phenomenological/predictive scenario with 3-4 qualitative choices (tier_1_options) and tier_1_correct_index (0-indexed).\n"
            "Tier 2: Mechanistic causal reasoning justifications with exactly 4 options (Tier2Option):\n"
            "  - 1 correct justification (is_correct=true, error_type='NONE')\n"
            "  - 1-2 local misconceptions (is_correct=false, error_type='LOCAL_MISCONCEPTION', misconception_label='...')\n"
            "  - 1 UPSTREAM INVARIANT VIOLATION distractor that looks plausible but secretly violates a fundamental rule from an upstream ancestor concept! (is_correct=false, error_type='UPSTREAM_INVARIANT_VIOLATION', blame_node_id='<ancestor_node_id>', misconception_label='...')\n"
            "Output strict JSON:\n"
            "{\n"
            '  "target_concept_id": "...",\n'
            '  "tier_1_scenario": "...",\n'
            '  "tier_1_options": ["Option A", "Option B", "Option C", "Option D"],\n'
            '  "tier_1_correct_index": 0,\n'
            '  "tier_2_justifications": [\n'
            '    {\n'
            '      "option_id": "opt_correct",\n'
            '      "text": "...",\n'
            '      "is_correct": true,\n'
            '      "error_type": "NONE"\n'
            '    },\n'
            '    {\n'
            '      "option_id": "opt_upstream",\n'
            '      "text": "...",\n'
            '      "is_correct": false,\n'
            '      "error_type": "UPSTREAM_INVARIANT_VIOLATION",\n'
            '      "blame_node_id": "ancestor_node_id",\n'
            '      "misconception_label": "..."\n'
            '    },\n'
            '    {\n'
            '      "option_id": "opt_local",\n'
            '      "text": "...",\n'
            '      "is_correct": false,\n'
            '      "error_type": "LOCAL_MISCONCEPTION",\n'
            '      "misconception_label": "..."\n'
            '    }\n'
            '  ]\n'
            "}"
        )
        user_content = f"Concept: {concept_label}\nInvariant: {invariant}\n\n{ancestor_info}\n\nContext:\n{textbook_context[:4000]}"
        return self._call_70b(system_prompt, user_content, json_mode=True)

    def synthesize_isomorphism_bridge(
        self, concept_a: Dict[str, Any], concept_b: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Uses 70B/32B: Identifies deep structural and mathematical parallels across two different subjects/chapters.
        """
        system_prompt = (
            "Analyze these two concepts from different chapters or subjects. Identify the common mathematical/causal "
            "invariant bridging them, a detailed reason explaining the mathematical isomorphism, and a concrete real-world engineering artifact. "
            "Return JSON:\n"
            "{\n"
            '  "bridge_label": "e.g. Dual Potential-Driven Flow",\n'
            '  "shared_invariant": "...",\n'
            '  "connection_reason": "Detailed physical/mathematical explanation (2-3 sentences) showing why both phenomena share the identical governing equation or conservation invariant.",\n'
            '  "real_world_artifact": "e.g. Why fast-charging your smartphone heats up both the lithium matrix and the charging cable",\n'
            '  "similarity_score": 0.88\n'
            "}"
        )
        user_content = f"Concept A ({concept_a.get('label')}): {concept_a.get('core_invariant')}\nConcept B ({concept_b.get('label')}): {concept_b.get('core_invariant')}"
        return self._call_70b(system_prompt, user_content, json_mode=True)

    def discover_cross_chapter_bridges(
        self, prior_concepts: List[Dict[str, Any]], new_concepts: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Fast batch discovery: synthesizes the top 1-2 cross-chapter isomorphism bridges
        in a single high-speed call instead of N x M slow serial loops.
        """
        prior_summary = "\n".join([f"- ID: {c['id']}, Label: {c['label']}, Invariant: {c.get('core_invariant', '')}" for c in prior_concepts[:8]])
        new_summary = "\n".join([f"- ID: {c['id']}, Label: {c['label']}, Invariant: {c.get('core_invariant', '')}" for c in new_concepts[:8]])
        
        system_prompt = (
            "You are a principal theoretical physicist and cognitive curriculum architect.\n"
            "Compare concepts from Chapter A with concepts from Chapter B. Identify up to 2 profound mathematical or causal isomorphism bridges (where both concepts share the exact same underlying differential equation, conservation law, or flow mechanism).\n"
            "CRITICAL: The 'connection_reason' MUST be a UNIQUE, deeply specific physical and mathematical explanation (2-3 sentences) detailing the exact mathematical duality or shared conservation invariant between the two specific concepts. DO NOT use generic or templated boilerplate sentences. You MUST explicitly name both concepts and their specific governing equations or physical laws.\n"
            "Return JSON:\n"
            "{\n"
            '  "bridges": [\n'
            '    {\n'
            '      "source_node_id": "id_from_chapter_a",\n'
            '      "target_node_id": "id_from_chapter_b",\n'
            '      "bridge_label": "Short label (e.g. Dual Potential-Driven Flow)",\n'
            '      "connection_reason": "Specific physical/mathematical explanation (2-3 sentences) naming both concepts and explaining why they share an identical governing balance law.",\n'
            '      "real_world_artifact": "A concrete real-world engineering artifact or system where both physical principles operate simultaneously."\n'
            '    }\n'
            '  ]\n'
            "}"
        )
        user_content = f"Chapter A Concepts:\n{prior_summary}\n\nChapter B Concepts:\n{new_summary}"
        try:
            res = self._call_32b(system_prompt, user_content, json_mode=True)
            return res.get("bridges", [])
        except Exception as e:
            logger.error(f"Error in discover_cross_chapter_bridges: {e}")
            return []

    # =========================================================================
    # 32B WORKLOADS: Sub-Second Latency, High Frequency, Real-Time Probes
    # =========================================================================

    def evaluate_anti_jargon(
        self, student_text: str, banned_words: List[str], concept_invariant: str
    ) -> Dict[str, Any]:
        """
        Uses 32B: Evaluates within 300-500ms to maintain real-time responsiveness 
        on the 45-second timer modal without burning 70B rate limits.
        """
        prompt = (
            "You are an anti-jargon epistemic evaluator. Determine if the student explained the underlying "
            "physical/causal mechanism using physical, operational action verbs (e.g. 'pushes', 'collides', 'resists', 'heats') "
            "without using formal textbook labels or the banned words. "
            "Return JSON: { \"passed\": boolean, \"reasoning\": string }"
        )
        user_content = (
            f"Banned Words: {banned_words}\n"
            f"Target Invariant: {concept_invariant}\n"
            f"Student Explanation:\n{student_text}"
        )
        return self._call_32b(prompt, user_content, json_mode=True)

    def generate_and_grade_rca_micro_probe(
        self, ancestor_invariant: str, student_answer: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uses 32B: Generates or rapidly grades a 15-second zero-context confirmation check.
        Must run instantly so the UI trace animation triggers without pause.
        """
        if student_answer is None:
            prompt = (
                "You are a rapid psychometric probe engine. Generate a 1-sentence zero-context everyday physical test "
                f"for this invariant: '{ancestor_invariant}'. "
                "Strip ALL domain nouns, formal chapter terms, and formulas. Make it purely intuitive (e.g., about water pipes, marbles, or rubber bands). "
                "Return JSON with: { \"question\": string, \"options\": [\"Option A\", \"Option B\", \"Option C\"], \"correct_index\": int }"
            )
            return self._call_32b(prompt, "Generate rapid 15s invariant probe", json_mode=True)
        else:
            prompt = (
                f"Grade student answer '{student_answer}' for invariant: '{ancestor_invariant}'. "
                "Return JSON: { \"passed\": boolean, \"explanation\": string }"
            )
            return self._call_32b(prompt, "Grade rapid probe", json_mode=True)

    def socratic_chat_explain(
        self,
        user_question: str,
        hobby_anchor: str,
        active_concept: Optional[Dict[str, Any]] = None,
        all_concepts: Optional[List[Dict[str, Any]]] = None,
        retrieved_chunks: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """
        Tessella (Tess) — Cognitive Companion:
        Answers questions across the syllabus grounded in causal mechanisms,
        physical invariants, and vivid analogies to the user's hobby_anchor.
        """
        self._ensure_clients()

        concept_context = ""
        if active_concept:
            existing_analogy = active_concept.get("hobby_analogy") or ""
            concept_context = (
                f"Active Concept: '{active_concept.get('label')}'\n"
                f"Core Invariant: {active_concept.get('core_invariant', '')}\n"
            )
            if existing_analogy:
                concept_context += f"Reference {hobby_anchor} Analogy: {existing_analogy}\n"

        curriculum_overview = ""
        if all_concepts:
            concept_names = [c.get('label', '') for c in all_concepts[:8] if c.get('label')]
            curriculum_overview = f"Chapter Concepts: {', '.join(concept_names)}\n"

        sources_context = ""
        if retrieved_chunks:
            sources_context = "Relevant Context:\n"
            for idx, chk in enumerate(retrieved_chunks[:2]):
                ch_title = chk.get("chapter_title", "Chapter")
                sec_name = chk.get("section_title") or chk.get("subject", "Physics")
                sec_text = chk.get("text", "")[:250].strip()
                sources_context += f"[{idx+1}] {ch_title} ({sec_name}): {sec_text}\n"

        q_lower = (user_question or "").lower()
        wants_analogy = any(
            kw in q_lower
            for kw in ["analogy", "analogies", "hobby", "like in", "relate", "example", "yes", "sure", hobby_anchor.lower()]
        )

        if wants_analogy:
            analogy_instruction = (
                f"5. {hobby_anchor.upper()} ANALOGY (HIGHEST PRIORITY): The student is asking for an analogy or connection to '{hobby_anchor}'. "
                f"You MUST provide a vivid, concrete, step-by-step **{hobby_anchor} Analogy** that maps the exact physical variables and causal mechanism onto '{hobby_anchor}'. Never defer or ask if they want an analogy—give the full analogy immediately!\n"
            )
        else:
            analogy_instruction = (
                f"5. {hobby_anchor.upper()} GROUNDING: After explaining the physical mechanism, include a brief, intuitive **{hobby_anchor} Analogy** paragraph showing how this exact mechanism behaves in '{hobby_anchor}'.\n"
            )

        system_prompt = (
            "You are Tessella (or just Tess), the Tessera Cognitive Companion and AI Physics/STEM Mentor.\n"
            f"Student's Cognitive Hobby Anchor: '{hobby_anchor}'.\n"
            "RULES (MANDATORY):\n"
            "1. NO '#' HEADINGS: Use clean bold titles like **Core Mechanism** and "
            f"**{hobby_anchor} Analogy**.\n"
            "2. NO RAW LATEX OR '$': Use plain unicode math (e.g. E = -ΔV/Δx, F = q·E, vd = μ·E, J = n·q·vd, ∇·J = 0).\n"
            "3. NO '//' CODE SLASHES.\n"
            "4. CLEAR & CAUSAL: Explain the physical mechanism clearly in 1-2 short paragraphs, followed by the hobby analogy, and end with 1 short thought-provoking follow-up question.\n"
            + analogy_instruction
        )

        user_prompt = f"{concept_context}{curriculum_overview}{sources_context}Student Question: {user_question}"
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for h in history[-4:]:
                role = h.get("role", "user")
                content = h.get("content", "")
                if role == "assistant" and len(content) > 600:
                    content = content[:600] + "..."
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": user_prompt})

        raw_reply = ""
        for model in self.candidates_32b:
            try:
                res = self.client_32b.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.35,
                    max_tokens=800
                )
                raw_reply = res.choices[0].message.content or ""
                if raw_reply.strip():
                    break
            except Exception as e:
                logger.warning(f"Tessella chat call failed with {model}: {e}")
                continue

        if not raw_reply:
            return "I apologize, Tessella is momentarily recalibrating. Please try asking again."

        import re

        def sanitize_socratic_output(text: str) -> str:
            # 0. Remove any <think>...</think> blocks from reasoning models
            text = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.IGNORECASE).strip()

            # 1. Convert markdown headers (### Heading) to bold (**Heading**)
            text = re.sub(r'^(#{1,6})\s+(.+)$', r'**\2**\n', text, flags=re.MULTILINE)

            # 2. Strip raw latex delimiters and commands
            text = text.replace('$$', '').replace('$', '')
            text = re.sub(r'\\mathbf\{([^}]+)\}', r'\1', text)
            text = re.sub(r'\\mathit\{([^}]+)\}', r'\1', text)
            text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
            text = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'\1 / \2', text)
            text = re.sub(r'\\bigg\|_\{[^}]+\}', '', text)
            text = text.replace('\\nabla', '∇').replace('\\tau', 'τ').replace('\\Delta', 'Δ')
            text = text.replace('\\cdot', '·').replace('\\mu', 'μ').replace('\\oint', '∮')
            text = text.replace('\\partial', '∂').replace('\\rho', 'ρ').replace('\\sigma', 'σ')

            # 3. Strip stray code comment slashes (leaving web links intact)
            text = re.sub(r'(?<!https:)(?<!http:)//\s*', '', text)

            return text.strip()

        return sanitize_socratic_output(raw_reply)

llm_service = LLMService()
