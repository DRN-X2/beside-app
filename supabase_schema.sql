-- BESIDE V2 - SHARED STATE DATABASE SCHEMA
-- Fully Idempotent, Zero Circular Dependencies, Safe to Run in Supabase SQL Editor

--------------------------------------------------------
-- 1. DROP DEPENDENT TABLES FIRST (Clean Slate)
--------------------------------------------------------
DROP TABLE IF EXISTS public.session_messages CASCADE;
DROP TABLE IF EXISTS public.session_objectives CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.session_participants CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.study_sessions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

--------------------------------------------------------
-- 2. CREATE ALL TABLES (All tables exist before policies)
--------------------------------------------------------

-- 2.1 NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, 
    read BOOLEAN NOT NULL DEFAULT false,
    data JSONB DEFAULT '{}'::jsonb
);

-- 2.2 SESSIONS TABLE (Duo & Squad Timers)
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'duo' or 'squad'
    status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'completed', 'cancelled'
    subject TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    started_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ
);

-- 2.3 SESSION PARTICIPANTS TABLE (Squad Slots & Duo Partners)
CREATE TABLE public.session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'invited', -- 'invited', 'joined', 'declined'
    slot_index INTEGER, -- Required for 5-slot Squad lobby
    joined_at TIMESTAMPTZ,
    UNIQUE(session_id, user_id)
);

-- 2.4 SESSION OBJECTIVES TABLE (Real-time Checklist)
CREATE TABLE public.session_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ
);

-- 2.5 CONNECTIONS TABLE (Peer Relationships)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(requester_id, recipient_id),
    CHECK (requester_id != recipient_id)
);

-- 2.6 SESSION MESSAGES TABLE (Real-time In-Call Chat)
CREATE TABLE IF NOT EXISTS public.session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY ON ALL TABLES
--------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------
-- 4. CREATE POLICIES (All referenced tables now exist!)
--------------------------------------------------------

-- 4.1 Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can insert notifications to others" ON public.notifications;
CREATE POLICY "Users can insert notifications to others"
    ON public.notifications FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- 4.2 Security Definer Helper Functions (Eliminate Mutual RLS Recursion)
CREATE OR REPLACE FUNCTION public.is_session_host(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions WHERE id = p_session_id AND host_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_session_participant(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.session_participants WHERE session_id = p_session_id AND user_id = p_user_id
  );
$$;

-- 4.3 Sessions Policies
DROP POLICY IF EXISTS "Users can view sessions they are part of" ON public.sessions;
CREATE POLICY "Users can view sessions they are part of"
    ON public.sessions FOR SELECT USING (
        auth.uid() = host_id
        OR public.is_session_participant(id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can create sessions" ON public.sessions;
CREATE POLICY "Users can create sessions"
    ON public.sessions FOR INSERT WITH CHECK (auth.uid() = host_id);
    
DROP POLICY IF EXISTS "Host can update session" ON public.sessions;
CREATE POLICY "Host can update session"
    ON public.sessions FOR UPDATE USING (auth.uid() = host_id);

-- 4.4 Session Participants Policies
DROP POLICY IF EXISTS "Participants can view their own session participants" ON public.session_participants;
CREATE POLICY "Participants can view their own session participants"
    ON public.session_participants FOR SELECT USING (
        auth.uid() = user_id 
        OR public.is_session_host(session_id, auth.uid())
    );

DROP POLICY IF EXISTS "Host can invite participants" ON public.session_participants;
CREATE POLICY "Host can invite participants"
    ON public.session_participants FOR INSERT WITH CHECK (
        public.is_session_host(session_id, auth.uid()) 
        OR auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Participants can update their own status" ON public.session_participants;
CREATE POLICY "Participants can update their own status"
    ON public.session_participants FOR UPDATE USING (
        auth.uid() = user_id 
        OR public.is_session_host(session_id, auth.uid())
    );

-- 4.5 Session Objectives Policies
DROP POLICY IF EXISTS "Session participants can view objectives" ON public.session_objectives;
CREATE POLICY "Session participants can view objectives"
    ON public.session_objectives FOR SELECT USING (
        public.is_session_host(session_id, auth.uid())
        OR public.is_session_participant(session_id, auth.uid())
    );

DROP POLICY IF EXISTS "Session participants can manage objectives" ON public.session_objectives;
CREATE POLICY "Session participants can manage objectives"
    ON public.session_objectives FOR ALL USING (
        public.is_session_host(session_id, auth.uid())
        OR public.is_session_participant(session_id, auth.uid())
    );

-- 4.5 Connections Policies
DROP POLICY IF EXISTS "connections_select" ON public.connections;
CREATE POLICY "connections_select" ON public.connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "connections_insert" ON public.connections;
CREATE POLICY "connections_insert" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "connections_update" ON public.connections;
CREATE POLICY "connections_update" ON public.connections FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "connections_delete" ON public.connections;
CREATE POLICY "connections_delete" ON public.connections FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- 4.6 Session Messages Policies (Non-recursive)
DROP POLICY IF EXISTS "session_messages_select" ON public.session_messages;
CREATE POLICY "session_messages_select" ON public.session_messages FOR SELECT USING (
    auth.uid() IN (SELECT host_id FROM public.sessions WHERE id = session_id)
    OR session_id IN (SELECT session_id FROM public.session_participants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "session_messages_insert" ON public.session_messages;
CREATE POLICY "session_messages_insert" ON public.session_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

--------------------------------------------------------
-- 5. REALTIME REPLICATION (Safe, Idempotent Loop)
--------------------------------------------------------
DO $$
DECLARE
    tbl text;
    tbls text[] := ARRAY[
        'notifications',
        'connections',
        'sessions',
        'session_participants',
        'session_objectives',
        'session_messages',
        'profiles'
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
