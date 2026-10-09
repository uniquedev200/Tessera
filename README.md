# 🧭 Tessera: A Psychometrically Grounded Cognitive Compiler

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License MIT" />
  <img src="https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Inference-Groq%20Llama%203.3%20%7C%20Qwen%202.5-F55036?style=for-the-badge" alt="Groq" />
  <img src="https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome" />
</p>

---

## 📖 Overview

**Tessera** replaces rote learning mechanisms (flashcards, single-tier multiple-choice questions, and linear chapter summaries) with a psychometrically grounded **cognitive compiler**. 

When students struggle with complex STEM subjects, traditional platforms offer superficial remedies: re-reading notes or grinding flashcards. Tessera operationalizes foundational research across cognitive psychology, psychometrics, analogical reasoning, and cognitive load theory to:

1. **Model human understanding as a Hidden Markov Model** using **Bayesian Knowledge Tracing (BKT)**.
2. **Dismantle false-positive guesswork** using **Treagust Two-Tier Diagnostics**.
3. **Anchor abstract concepts to personal student schemas** using **Gentner's Structure-Mapping Theory**.
4. **Defeat the Illusion of Explanatory Depth** via an automated **Anti-Jargon Lexical Interceptor**.
5. **Diagnose historical prerequisite bugs** via **Topological Knowledge Spaces & 3-Gate Agentic Root Cause Analysis (RCA)**.
6. **Minimize extraneous cognitive load** via a tactile **Quest Map canvas** built on Bauhaus design principles.

---

## 🏛️ System Architecture

```
                                  [ CURRICULUM INGESTION ]
                                             │
                        PyMuPDF Chunking + Upstash Vector Embeddings
                                             │
                                             ▼
                                  [ TOPOLOGICAL SYNTHESIS ]
                           Groq (Llama-3.3-70B) + NetworkX DAG
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          [ HOBBY ANCHOR GROUNDING ]                 [ CROSS-CHAPTER ISOMORPHISMS ]
         Structure-Mapping to Schema                 Conserved Physical Invariants
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                                 [ INTERACTIVE QUEST MAP ]
                                 React Flow + Tactile Pavers
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
           [ TWO-TIER DIAGNOSTIC ]                     [ ANTI-JARGON GAUNTLET ]
        Tier 1: Phenomenological Pred.               HTTP 428 Precondition Required
        Tier 2: Mechanistic Distractors              45s Action-Verb Interception
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                             [ BAYESIAN KNOWLEDGE TRACING ]
                          Hidden Markov Model: P(L_t | Evidence)
                                             │
                                   [ FAILED WITH BUG? ]
                                      │             │
                                    [NO]          [YES]
                                      │             │
                               [LEVEL UP PIP]       ▼
                                            [ 3-GATE AGENTIC RCA ]
                                            Gate 1: DAG Lineage Verification
                                            Gate 2: Prior Vulnerability Check
                                            Gate 3: 15s Zero-Context Invariant Probe
                                                    │
                                                    ▼
                                            [ REVERSE FAULT TRACE ]
                                            Animated DAG Path to True Cause
```

---

## 🔬 Theoretical Foundations & Mathematical Formulations

### 1. Probabilistic Latent Mastery: Bayesian Knowledge Tracing (BKT)

#### Seminal Research
- **Corbett, A. T., & Anderson, J. R. (1994).** *"Knowledge tracing: Modeling the acquisition of procedural knowledge."* *User Modeling and User-Adapted Interaction*, 4(4), 253–278.

#### Theoretical Principle
Traditional grading computes static percentages (e.g., $82\%$), which conflate lucky guesses with genuine understanding and treat questions as independent observations. Bayesian Knowledge Tracing models learning as a **Hidden Markov Model (HMM)** where mastery of an atomic concept is a latent (unobservable) binary state: Learned ($L_t$) or Unlearned ($1 - L_t$).

```
                ┌────────────────────────────────┐
                │   Prior Knowledge: P(L_{t-1})  │
                └───────────────┬────────────────┘
                                │
                 Observation: Correct / Incorrect
                                │
                                ▼
                ┌────────────────────────────────┐
                │   Posterior Knowledge State    │
                │        P(L_t | Evidence)       │
                └───────────────┬────────────────┘
                                │  + P(T) [Transition / Learning]
                                ▼
                ┌────────────────────────────────┐
                │  Updated Concept Latent Prior  │
                │             P(L_t)             │
                └────────────────────────────────┘
```

#### Mathematical Parameters in Tessera
BKT models learning across four core probabilities:
- $P(L_0)$: Prior probability of knowing the concept before formal practice ($0.20$).
- $P(T)$: Probability of transitioning from unlearned to learned after an opportunity ($0.15$).
- $P(G)$: Probability of guessing correctly despite not knowing the skill ($0.05$ — kept exceptionally low via Two-Tier verification).
- $P(S)$: Probability of slipping (careless error despite mastering the skill) ($0.08$).

#### Bayesian Formulation
When an assessment event occurs, posterior mastery is calculated as:

$$\text{If Correct: } P(L_t \mid \text{correct}) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$

$$\text{If Incorrect: } P(L_t \mid \text{incorrect}) = \frac{P(L_{t-1}) \cdot P(S)}{P(L_{t-1}) \cdot P(S) + (1 - P(L_{t-1})) \cdot (1 - P(G))}$$

Factoring the learning transition rate:

$$P(L_t) = P(L_t \mid \text{evidence}) + (1 - P(L_t \mid \text{evidence})) \cdot P(T)$$

#### Implementation in Tessera
Rather than exposing clinical decimal outputs, Tessera maps $P(L_t)$ to visual, tactile **Mastery Pebbles**:
- $P(L_t) < 0.35 \implies$ **Level 1 Pip** (Trail Beginner / Sand)
- $0.35 \le P(L_t) < 0.75 \implies$ **Level 2 Pips** (In Progress / Amber)
- $P(L_t) \ge 0.75 \implies$ **Level 3 Pips** (Mastered / Moss Stone Green `#4B845C`)

---

### 2. Eliminating False Positives: Two-Tier Diagnostic Assessments

#### Seminal Research
- **Treagust, D. F. (1986).** *"Evaluating students' misconceptions by means of diagnostic tests based on multiple-choice items with reason alternatives."* *Research in Science Education*, 16(1), 199–207.
- **Treagust, D. F. (1988).** *"Development and use of diagnostic tests to evaluate students' misconceptions in science."* *International Journal of Science Education*, 10(2), 159–169.

#### Theoretical Principle
Standard Multiple Choice Questions (MCQs) reward superficial pattern recognition. A student can choose the correct outcome for the wrong mechanistic reason. Treagust’s Two-Tier Diagnostic structure enforces a cognitive split:

| Diagnostic Tier | Cognitive Target | Evaluation Mechanism |
| :--- | :--- | :--- |
| **Tier 1 (Phenomenon)** | Prediction & Observation | The student predicts what happens to a physical/computational system. |
| **Tier 2 (Causal Driver)** | Mechanistic Justification | The student justifies *why* that prediction holds, selecting among distractors embodying documented cognitive misconceptions. |

```
                       [ Question Presentation ]
                                   │
                                   ▼
         ┌───────────────────────────────────────────────────┐
         │       Tier 1: Phenomenological Prediction         │
         │         Isolates intuitive prediction             │
         └─────────────────────────┬─────────────────────────┘
                                   │ Locks selection
                                   ▼
         ┌───────────────────────────────────────────────────┐
         │           Tier 2: Causal Justification            │
         │  (Distractors = Documented Cognitive Flaws)       │
         └─────────────────────────┬─────────────────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
         [ Both Correct ]               [ Tier 2 Distractor Chosen ]
         Mastery Credited               Tagged with Active Misconception
         BKT Moves Forward              Triggers 3-Gate Agentic RCA
```

#### Implementation in Tessera
- LLM prompts synthesize distractors based on documented misconceptions from physics, chemistry, and computer science literature rather than trivial decoy options.
- Selecting an incorrect Tier 2 distractor tags the student's epistemic record with a specific misconception type (`LOCAL_MISCONCEPTION` or `UPSTREAM_INVARIANT_VIOLATION`), preventing lucky guesses from advancing the skill tree.
- Free-text plain language explanation is **compulsory**, ensuring mechanistic comprehension before evaluation submission.

---

### 3. Grounding Conceptual Schemas: Structure-Mapping Theory

#### Seminal Research
- **Gentner, D. (1983).** *"Structure-mapping: A theoretical framework for analogy."* *Cognitive Science*, 7(2), 155–170.
- **Gentner, D., & Markman, A. B. (1997).** *"Structure mapping in analogy and similarity."* *American Psychologist*, 52(1), 45–56.

#### Theoretical Principle
When encountering an abstract discipline (e.g., electromagnetic flux or redox potentials), novices struggle because they lack experiential schemas. Under Gentner’s Structure-Mapping Theory, learning occurs through **analogical transfer**: preserving relational systems across domains rather than surface attributes.

$$\text{Base Domain (Student Hobby)} \xrightarrow{\quad\text{Structural Isomorphism}\quad} \text{Target Domain (Scientific Concept)}$$

- **Surface Attributes** (color, physical materials, setting) are discarded.
- **Relational Systems** (governing laws, ratios, directional balance, conservation rules) are aligned.

```
Base Domain: Audio Engineering                 Target Domain: Electric Circuits
┌──────────────────────────────┐              ┌──────────────────────────────┐
│ Gain Staging (Preamp Push)   │ ────────────>│ Electric Potential (Voltage) │
│ Acoustic Damping (Resistance)│ ────────────>│ Circuit Resistance (Ohms)    │
│ Headroom Clipping            │ ────────────>│ Dielectric Breakdown         │
└──────────────────────────────┘              └──────────────────────────────┘
               ▲                                             ▲
               └───────── Conserved Causal Invariant ────────┘
```

#### Implementation in Tessera
- **The Cold-Start Anchor:** When Chapter 1 is uploaded in isolation, Tessera bridges the root concept to the student’s pre-existing schema (e.g., Music Production, Gaming, Cooking, Sports).
- **Cross-Chapter Isomorphism Bridges:** When subsequent chapters or subjects are indexed, high-reasoning models identify conserved mathematical invariants across domains (e.g., $V = IR \longleftrightarrow \Delta P = QR$), generating dashed bridge pathways across chapter territories with interactive real-world artifact explainers.

---

### 4. Defeating the Illusion of Explanatory Depth: Anti-Jargon Lexical Interception

#### Seminal Research
- **Rozenblit, L., & Keil, F. (2002).** *"The misunderstood limits of folk science: An illusion of explanatory depth."* *Cognitive Science*, 26(5), 521–562.
- **Feynman, R. P. (1969).** *"What is Science?"* *The Physics Teacher*, 7(6), 313–320 (Addressing the Nominal Fallacy / substituting names for mechanisms).

#### Theoretical Principle
The Illusion of Explanatory Depth (IOED) demonstrates that learners consistently overestimate their understanding of causal mechanisms until forced to explain them step-by-step. In academic settings, students exploit **Lexical Masking**: hiding behind formal domain nouns (e.g., *"because of electronegativity"*, *"due to Bernoulli's principle"*) without understanding the underlying physical interactions.

```
          Student Attempt: "The water rises because of capillary action."
                                         │
                   [ Lexical Interceptor: Masking Detected ]
                   [ Flagged Banned Token: "capillary action" ]
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │   45-Second Timed Action Gauntlet    │
                      │   "What is mechanically pushing or   │
                      │    pulling the liquid upward?"       │
                      └──────────────────────────────────────┘
```

#### Implementation in Tessera
- Every concept node maintains a `jargon_blacklist` containing textbook labels.
- Free-text student explanations are parsed in real time. Detecting blacklisted terms intercepts submission with an `HTTP 428 Precondition Required` response.
- An immediate **45-Second Action-Verb Gauntlet** requires the student to describe the physical mechanism using everyday operational verbs (`pushes`, `collides`, `drags`, `constricts`, `heats`). Sub-second LLM verification ensures physical causality was articulated without nominal crutches.

---

### 5. Topological Diagnostic Backtracking: Knowledge Space Theory & Cognitive Fault-Trees

#### Seminal Research
- **Doignon, J.-P., & Falmagne, J.-C. (1985).** *"Spaces for the assessment of knowledge."* *International Journal of Man-Machine Studies*, 23(2), 175–196.
- **Doignon, J.-P., & Falmagne, J.-C. (1999).** *Knowledge Spaces*. Springer-Verlag.
- **Vesely, W. E., et al. (1981).** *Fault Tree Handbook*. U.S. Nuclear Regulatory Commission (Applied to Cognitive Lineage Attribution).

#### Theoretical Principle
Human knowledge is a Partially Ordered Set (Poset) structured as a Directed Acyclic Graph (DAG) $\mathcal{G} = (\mathcal{V}, \mathcal{E})$. Under Knowledge Space Theory, mastering concept $v_j$ requires prior mastery of all concepts in its prerequisite lineage:

$$\text{Ancestors}(v_j) = \{ v_i \in \mathcal{V} \mid \exists \text{ path from } v_i \text{ to } v_j \}$$

When a student fails at node $v_j$, traditional platforms prescribe remedial practice on $v_j$. However, Cognitive Fault-Tree Analysis posits that failures on downstream nodes are often symptoms of unaddressed conceptual cracks in an upstream ancestor $v_i \in \text{Ancestors}(v_j)$ mastered earlier.

```
Week 1 (Foundations)                             Week 3 (Current)
   ┌──────────────┐                                ┌──────────────┐
   │   Node A     │ ─────────────────────────────> │   Node C     │ [FAILED!]
   │ Harmonic SHM │                                │ AC Reactance │
   └──────────────┘                                └──────────────┘
          ▲                                               │
          │                                               ▼
          └───────────── [ 3-Gate RCA Backtrack ] ────────┘
                         Gate 1: DAG Lineage Check
                         Gate 2: Prior Vulnerability Analysis
                         Gate 3: 15s Invariant Micro-Probe
```

#### Implementation in Tessera: The 3-Gate RCA Pipeline
1. **Gate 1 (Lineage Matching):** When an `UPSTREAM_INVARIANT_VIOLATION` distractor is chosen, NetworkX runs `nx.has_path(KG, blame_node, current_node)` to confirm ancestor validity.
2. **Gate 2 (Bayesian Prior Vulnerability & Semantic Alignment):** For all candidate upstream parents $Pa(V)$, Tessera computes:
   - Prior Vulnerability: $P(\text{vulnerable}) = 1.0 - P(M)$
   - Semantic Likelihood: $P(\text{symptom} \mid \text{invariant failure})$ matching the distractor against ancestor invariants.
   - Normalized Bayesian Attribution: $\sum P(\text{cause} = pa_i \mid \text{error}) = 1.0$.
3. **Gate 3 (Zero-Context Invariant Micro-Probe):** A 15-second rapid probe tests the ancestral invariant stripped of current-chapter variables.
4. **Transparent Explainability:** If confirmed, the platform displays the complete Bayesian DAG parent attribution breakdown and illuminates the persistent red reverse fault trail on the graph canvas.

---

### 6. Cognitive Load Optimization & Spatial Scaffolding

#### Seminal Research
- **Sweller, J. (1988).** *"Cognitive load during problem solving: Effects on learning."* *Cognitive Science*, 12(2), 257–285.
- **Sweller, J., van Merriënboer, J. J., & Paas, F. G. (1998).** *"Cognitive architecture and instructional design."* *Educational Psychology Review*, 10(3), 251–296.

#### Theoretical Principle
Cognitive Load Theory (CLT) partitions working memory allocation into three categories:

$$\text{Total Load} = \text{Intrinsic Load} + \text{Extraneous Load} + \text{Germane Load}$$

- **Intrinsic Load:** The inherent difficulty of the discipline (e.g., Maxwell's equations).
- **Extraneous Load:** Mental effort wasted parsing cluttered interfaces, circuit schematics, or intimidating notation.
- **Germane Load:** Productive mental effort directed toward constructing long-term cognitive schemas.

#### Implementation in Tessera
- **Extraneous Load Reduction:** Dense formulas and paragraphs are removed from the canvas surface and placed inside an on-demand slide-out inspection drawer.
- **Tactile River-Paver Quest Map:** Nodes are rendered as physical chiseled stone pavers with tactile bevels and debossed inlays, while connections render as trodden earthen paths with stepping stones.
- **Spatial Chunking via Dagre:** Hierarchical DAG layout isolates chapters into distinct geographical regions with clear entry points, preventing sensory overload while preserving topological structure.

---

## 🛠️ Technology Stack

| Layer | Technologies | Role & Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 15 (App Router)**, **React 19**, **TypeScript** | Responsive client application, server routes, static optimization |
| **Canvas & Physics** | **React Flow (`@xyflow/react` v12)**, **Dagre**, **Tailwind CSS** | Tactile river-paver quest map, cobblestone stepping edges, topological layout |
| **State Management** | **Zustand (with LocalStorage persistence)** | Epistemic state updates, modal management, persistent RCA fault traces |
| **Backend API** | **FastAPI**, **Uvicorn**, **AsyncIO**, **Pydantic v2** | High-performance asynchronous REST API, request schema validation |
| **Topological Engine** | **NetworkX**, **LangGraph** | DAG traversal, lineage cycle detection, diagnostic state machine |
| **Dual-Key LLM Routing** | **Groq API** (`Llama-3.3-70B` & `Qwen-2.5-32B`) | Isolated workloads: heavy synthesis (70B) vs sub-second interactive probes (32B) |
| **Vector Store (RAG)** | **Upstash Vector** (`openai/text-embedding-3-small`) | Serverless HTTP-based semantic chunk search (zero PyTorch/Torch runtime footprint) |
| **Relational Database** | **Supabase (PostgreSQL with `psycopg2` pool)** | Persistent profiles, chapters, concept nodes, edges, BKT states, audit logs |
| **Document Processing** | **PyMuPDF (`fitz`)** | Blazing-fast PDF parsing and structural text extraction |

---

## 📂 Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── db/
│   │   │   ├── migration.sql           # Complete Supabase schema and indexes
│   │   │   └── supabase_client.py      # Threaded connection pool & CRUD operations
│   │   ├── models/
│   │   │   └── schemas.py              # Pydantic request/response validation schemas
│   │   ├── routes/
│   │   │   ├── assessment.py           # Two-Tier evaluation, anti-jargon, & RCA grading
│   │   │   ├── chapters.py             # PDF upload, chunking, and DAG synthesis
│   │   │   ├── chat.py                 # Socratic assistant drawer chat
│   │   │   ├── graph.py                # Graph nodes, edges, and hobby realignment
│   │   │   ├── onboarding.py           # User profiles and cognitive hobby anchor setup
│   │   │   └── user.py                 # User state reset and debugging
│   │   ├── services/
│   │   │   ├── anti_jargon.py          # Nominal fallacy lexical interceptor
│   │   │   ├── bkt_engine.py           # Bayesian Knowledge Tracing HMM updates
│   │   │   ├── graph_engine.py         # NetworkX DAG compilation & isomorphism mapping
│   │   │   ├── ingestion.py            # PDF extraction and semantic chunking
│   │   │   ├── langgraph_flow.py       # Diagnostic agentic state machine
│   │   │   ├── llm_service.py          # Dual-key Groq client routing & resilience
│   │   │   ├── rca_engine.py           # 3-Gate Agentic RCA & Bayesian parent attribution
│   │   │   └── vector_store.py         # Upstash Vector indexing and RAG retrieval
│   │   ├── config.py                   # Pydantic environment configuration
│   │   └── main.py                     # FastAPI application entrypoint
│   ├── scripts/                        # Diagnostic and testing utility scripts
│   ├── Dockerfile                      # Container definition for backend service
│   ├── requirements.txt                # Python dependencies
│   ├── .env.example                    # Backend environment variables template
│   └── extraction_output.json          # Sample benchmark extraction
├── frontend/
│   ├── src/
│   │   ├── app/                        # Next.js App Router (Studio, Landing, Layout)
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   │   ├── edges/              # Tactile stepping-stone trail edges & label badges
│   │   │   │   ├── nodes/              # ConceptPillNode, ChapterHull, HobbyAnchorNode
│   │   │   │   ├── drawer/             # Socratic inspection drawer & AI tutor chat
│   │   │   │   └── ConceptCanvas.tsx   # React Flow interactive quest canvas
│   │   │   └── modals/
│   │   │       ├── TwoTierModal.tsx    # Treagust Two-Tier Diagnostic modal
│   │   │       ├── AntiJargonModal.tsx # 45-Second Action-Verb Gauntlet modal
│   │   │       ├── RcaMicroProbeModal.tsx # Gate 3 15-second Invariant Micro-Probe
│   │   │       └── RcaVerdictModal.tsx # RCA outcome & Bayesian selection explainability
│   │   ├── store/
│   │   │   └── useGraphStore.ts        # Zustand global store with persistent partialize
│   │   └── lib/
│   │       ├── api.ts                  # Typed client for backend REST API
│   │       └── types.ts                # TypeScript domain models
│   ├── package.json                    # Node.js dependencies and scripts
│   ├── tailwind.config.ts              # Custom design system configuration
│   ├── tsconfig.json                   # TypeScript compiler options
│   └── .env.example                    # Frontend environment variables template
├── sample_pdfs/                        # Demo curriculum documents
├── .gitignore                          # Comprehensive secret and artifact exclusions
├── LICENSE                             # MIT Open Source License
└── README.md                           # Documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**
- A free **Groq** API account
- A free **Supabase** project (PostgreSQL)
- (Optional) An **Upstash Vector** index

---

### 1. Environment Configuration

#### Backend Configuration
Copy `backend/.env.example` to `backend/.env` and supply your API credentials:

```bash
cd backend
cp .env.example .env
```

```ini
# Groq Dual-Key Routing
GROQ_API_KEY_70B=your_groq_70b_api_key
GROQ_API_KEY_32B=your_groq_32b_api_key
GROQ_MODEL_70B=openai/gpt-oss-120b
GROQ_MODEL_32B=qwen/qwen3.8-27b

# Upstash Vector (RAG)
UPSTASH_VECTOR_REST_URL=https://your-vector-instance.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token

# Supabase Persistence (PostgreSQL)
DATABASE_URL=postgresql://postgres.your_id:your_password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
SUPABASE_URL=https://your_id.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# App Environment
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=*
```

> **Database Initialization:** Run the SQL statements in `backend/app/db/migration.sql` inside your Supabase SQL Editor to create all necessary tables and foreign key constraints.

#### Frontend Configuration
Copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cd ../frontend
cp .env.example .env.local
```

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### 2. Backend Setup & Launch

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The FastAPI OpenAPI documentation will be live at `http://localhost:8000/docs`.

---

### 3. Frontend Setup & Launch

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Navigate to `http://localhost:3000` in your browser.

---

## 🎯 Interactive User Journey

1. **Cognitive Onboarding:** Select or enter your preferred hobby schema (e.g., *Music Production*, *Cooking*, *Competitive Gaming*, *Automotive Tuning*).
2. **Cold-Start Curriculum Ingestion:** Upload a chapter PDF or click **"Seed Demo Chapter 1"** (*Electric Potential & Drift Dynamics*). Watch Tessera extract atomic invariants and establish the initial **Hobby Anchor Bridge**.
3. **Cross-Chapter Isomorphism Weaving:** Upload a subsequent chapter (*Resistive Circuits*). The topological engine detects conserved mathematical isomorphisms and weaves animated dashed bridge edges between the chapters.
4. **Interactive Verification:**
   - Click any stone node to open the **Socratic Inspection Drawer**.
   - Attempt the **Two-Tier Diagnostic**: formulate a phenomenological prediction, then select its causal mechanism.
   - Enter textbook buzzwords (e.g., *"because of voltage"*) to trigger the **45-second Anti-Jargon Siren**.
   - If an upstream misconception distractor is selected, watch the **3-Gate Agentic RCA** fire: verify the ancestral invariant via the **15-second Micro-Probe**, and observe the reverse fault trail illuminate across the DAG.

---

## 🔒 Security & Privacy

- **Zero Secrets Committed:** All credentials, API tokens, and database connection strings are managed strictly through environment variables (`.env` and `.env.local`), protected by a strict `.gitignore`.
- **Isolated Workloads:** Groq client calls are decoupled into distinct keys to prevent rate-limit contention between real-time interactive student evaluations and background chapter synthesis.
- **Resilient Fallbacks:** Fallback logic handles transient network outages and model throttling gracefully without application crashes.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/uniquedev200/Tessera/issues).
