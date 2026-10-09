-- ============================================================================
-- ForgeHacks 2026: Supabase Database Schema Migration
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Students / Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    hobby_anchor TEXT NOT NULL DEFAULT 'Music Production',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Concept Nodes Table
CREATE TABLE IF NOT EXISTS public.concept_nodes (
    id TEXT PRIMARY KEY, -- e.g. "phys_ch1_drift_velocity"
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    core_invariant TEXT NOT NULL,
    jargon_blacklist TEXT[] DEFAULT '{}',
    is_hobby_anchor BOOLEAN DEFAULT FALSE,
    position_x FLOAT NOT NULL DEFAULT 0,
    position_y FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Causal & Cross-Subject Edges Table
CREATE TABLE IF NOT EXISTS public.concept_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    source_node_id TEXT REFERENCES public.concept_nodes(id) ON DELETE CASCADE,
    target_node_id TEXT REFERENCES public.concept_nodes(id) ON DELETE CASCADE,
    relationship_label TEXT NOT NULL,
    is_cross_chapter BOOLEAN DEFAULT FALSE,
    is_isomorphism_bridge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_edge UNIQUE (source_node_id, target_node_id)
);

-- 5. Student Bayesian Epistemic State Table
CREATE TABLE IF NOT EXISTS public.student_epistemic_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    concept_id TEXT REFERENCES public.concept_nodes(id) ON DELETE CASCADE,
    p_mastery FLOAT NOT NULL DEFAULT 0.15, -- P(L_t)
    status TEXT NOT NULL DEFAULT 'UNVERIFIED', -- 'UNVERIFIED', 'FRAGILE', 'MASTERED'
    active_misconceptions JSONB DEFAULT '[]'::jsonb,
    last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_concept UNIQUE (user_id, concept_id)
);

-- 6. Assessment Audit Logs Table (For RCA verification)
CREATE TABLE IF NOT EXISTS public.assessment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    concept_id TEXT REFERENCES public.concept_nodes(id) ON DELETE CASCADE,
    tier_1_passed BOOLEAN NOT NULL,
    tier_2_passed BOOLEAN NOT NULL,
    selected_distractor_id TEXT,
    jargon_failed BOOLEAN DEFAULT FALSE,
    rca_triggered BOOLEAN DEFAULT FALSE,
    blame_node_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
