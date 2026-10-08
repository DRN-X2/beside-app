-- BESIDE OpenWorld - Database Migration
-- Run this in Supabase SQL Editor
-- Safe & idempotent: handles all table creation, RLS, indexes, and realtime

--------------------------------------------------------
-- 1. PROFILES: Add location & missing taxonomy columns
--------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Philippines',
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'PH',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Manila',
  ADD COLUMN IF NOT EXISTS openworld_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS course_grade TEXT;

--------------------------------------------------------
-- 2. CONNECTIONS TABLE (Drop + Recreate clean state)
--------------------------------------------------------
DROP TABLE IF EXISTS public.connections CASCADE;

CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(requester_id, recipient_id),
    CHECK (requester_id != recipient_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_select"
    ON public.connections FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "connections_insert"
    ON public.connections FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "connections_update"
    ON public.connections FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "connections_delete"
    ON public.connections FOR DELETE
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

--------------------------------------------------------
-- 3. INDEXES
--------------------------------------------------------
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_recipient ON public.connections(recipient_id);
CREATE INDEX idx_connections_status ON public.connections(status);

CREATE INDEX IF NOT EXISTS idx_profiles_openworld
    ON public.profiles(openworld_visible) WHERE openworld_visible = true;
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

--------------------------------------------------------
-- 4. REALTIME (Safe idempotent addition)
--------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

--------------------------------------------------------
-- 5. OPENWORLD VIEW
--------------------------------------------------------
DROP VIEW IF EXISTS public.openworld_learners;

CREATE VIEW public.openworld_learners AS
SELECT
    p.id,
    p.display_name,
    p.otter_config,
    p.country,
    p.country_code,
    p.city,
    p.interests,
    p.skills,
    p.category,
    p.course_grade,
    p.openworld_visible
FROM public.profiles p
WHERE (p.openworld_visible IS NULL OR p.openworld_visible = true);

GRANT SELECT ON public.openworld_learners TO authenticated;
GRANT SELECT ON public.openworld_learners TO anon;
