-- ========================================================
-- BESIDE SQUAD MODE - DATABASE SCHEMA & RLS MIGRATION
-- Run in Supabase SQL Editor to enable dedicated Squad tables
-- ========================================================

-- 1. SQUADS TABLE
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    focus TEXT NOT NULL,
    objective TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 50,
    max_members INTEGER NOT NULL DEFAULT 5,
    min_members INTEGER NOT NULL DEFAULT 3,
    privacy TEXT NOT NULL DEFAULT 'public', -- 'public' or 'private'
    status TEXT NOT NULL DEFAULT 'gathering', -- 'gathering', 'starting_soon', 'active', 'completed', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- 2. SQUAD MEMBERS TABLE (Team slots & ready states)
CREATE TABLE IF NOT EXISTS public.squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- 'leader' or 'member'
    ready BOOLEAN NOT NULL DEFAULT false,
    slot_index INTEGER NOT NULL DEFAULT 0, -- 0 to 4
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(squad_id, user_id)
);

-- 3. SQUAD INVITES TABLE (Inviting connected friends)
CREATE TABLE IF NOT EXISTS public.squad_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. SQUAD JOIN REQUESTS TABLE (Non-connected users requesting to join public squads)
CREATE TABLE IF NOT EXISTS public.squad_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id)
);

-- 5. SQUAD SESSIONS TABLE (Post-session records & outcomes)
CREATE TABLE IF NOT EXISTS public.squad_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 50,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    outcome TEXT DEFAULT 'completed' -- 'completed', 'partially_completed', 'cancelled'
);

-- ========================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================================
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_sessions ENABLE ROW LEVEL SECURITY;

-- 6.1 Squads Policies
DROP POLICY IF EXISTS "Public squads are viewable by everyone" ON public.squads;
CREATE POLICY "Public squads are viewable by everyone"
    ON public.squads FOR SELECT
    USING (privacy = 'public' OR auth.uid() = creator_id OR EXISTS (
        SELECT 1 FROM public.squad_members WHERE squad_id = id AND user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Authenticated users can create squads" ON public.squads;
CREATE POLICY "Authenticated users can create squads"
    ON public.squads FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Leaders can update their squads" ON public.squads;
CREATE POLICY "Leaders can update their squads"
    ON public.squads FOR UPDATE USING (auth.uid() = creator_id);

-- 6.2 Squad Members Policies
DROP POLICY IF EXISTS "Members can view members of their squads" ON public.squad_members;
CREATE POLICY "Members can view members of their squads"
    ON public.squad_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert themselves or leaders can add" ON public.squad_members;
CREATE POLICY "Users can insert themselves or leaders can add"
    ON public.squad_members FOR INSERT WITH CHECK (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.squads WHERE id = squad_id AND creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can update their ready state" ON public.squad_members;
CREATE POLICY "Members can update their ready state"
    ON public.squad_members FOR UPDATE USING (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.squads WHERE id = squad_id AND creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can leave or leader can remove" ON public.squad_members;
CREATE POLICY "Members can leave or leader can remove"
    ON public.squad_members FOR DELETE USING (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.squads WHERE id = squad_id AND creator_id = auth.uid()
        )
    );

-- 6.3 Squad Invites Policies
DROP POLICY IF EXISTS "Users can view invites sent or received" ON public.squad_invites;
CREATE POLICY "Users can view invites sent or received"
    ON public.squad_invites FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

DROP POLICY IF EXISTS "Users can create invites" ON public.squad_invites;
CREATE POLICY "Users can create invites"
    ON public.squad_invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Invitees can update invite status" ON public.squad_invites;
CREATE POLICY "Invitees can update invite status"
    ON public.squad_invites FOR UPDATE USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

-- 6.4 Squad Join Requests Policies
DROP POLICY IF EXISTS "Requesters and leaders can view join requests" ON public.squad_join_requests;
CREATE POLICY "Requesters and leaders can view join requests"
    ON public.squad_join_requests FOR SELECT USING (
        auth.uid() = requester_id OR EXISTS (
            SELECT 1 FROM public.squads WHERE id = squad_id AND creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Requesters can insert join requests" ON public.squad_join_requests;
CREATE POLICY "Requesters can insert join requests"
    ON public.squad_join_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Leaders can update join requests" ON public.squad_join_requests;
CREATE POLICY "Leaders can update join requests"
    ON public.squad_join_requests FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.squads WHERE id = squad_id AND creator_id = auth.uid()
        )
    );

-- ========================================================
-- 7. ENABLE REALTIME REPLICATION
-- ========================================================
DO $$
DECLARE
    tbl text;
    tbls text[] := ARRAY[
        'squads',
        'squad_members',
        'squad_invites',
        'squad_join_requests',
        'squad_sessions'
    ];
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        FOREACH tbl IN ARRAY tbls LOOP
            IF NOT EXISTS (
                SELECT 1 FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime' 
                  AND schemaname = 'public' 
                  AND tablename = tbl
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
            END IF;
        END LOOP;
    END IF;
END $$;
