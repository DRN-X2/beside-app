import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, isValidUuid } from './store/authStore'
import { useConnectionStore } from './store/connectionStore'
import { supabase } from './lib/supabase'
import { normalizeProfile } from './utils/profileNormalizer'

import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import { DuoDiscoveryPage, DuoPage } from './modules/duo'
import { StudyWorldPage } from './modules/study-world'
import { SquadLobbyPage } from './modules/squad'
import StudyHistoryPage from './pages/StudyHistoryPage'
import ConnectionsPage from './pages/ConnectionsPage'
import ProfilePage from './pages/ProfilePage'
import BottomNav from './components/BottomNav'

import { useLocation } from 'react-router-dom'
import { useSessionStore } from './store/sessionStore'

import OnboardingPage from './pages/OnboardingPage'
import { GlobalNotificationBanner } from './components/GlobalNotificationBanner'
import { NotificationCenterModal } from './components/NotificationCenterModal'
import { getOrCreateHubChannel, onHubEvent, subscribeToActiveSession, cleanupRealtimeHub } from './services/realtimeHub'
import { useNavigate } from 'react-router-dom'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isNewSignUp } = useAuthStore()
  const { isActive, isSquadActive } = useSessionStore()
  const location = useLocation()

  if (!user) return <Navigate to="/auth" replace />

  if (isNewSignUp && profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  const hideBottomNav =
    (location.pathname.startsWith('/duo') && isActive) ||
    (location.pathname.startsWith('/squad') && isSquadActive) ||
    location.pathname === '/onboarding'

  return (
    <>
      {children}
      {!hideBottomNav && <BottomNav />}
    </>
  )
}

function GlobalListeners() {
  const navigate = useNavigate()
  const { startSessionLocally } = useSessionStore()
  const { profile } = useAuthStore()

  useEffect(() => {
    if (!profile?.id) return

    const unsubDuoAccept = onHubEvent('duo_accepted', async (payload) => {
      if (payload.toUserId === profile.id) {
        // Fetch session from DB to get EXACT startedAt and endsAt that the partner generated!
        const { data: session } = await supabase.from('sessions').select('*').eq('id', payload.sessionId).single()
        
        if (session) {
          subscribeToActiveSession(payload.sessionId)
          startSessionLocally(
            payload.sessionId,
            payload.fromUser,
            session.duration_minutes,
            new Date(session.started_at || Date.now()),
            new Date(session.ends_at || Date.now() + session.duration_minutes * 60000)
          )
          navigate('/duo')
        }
      }
    })

    return () => {
      unsubDuoAccept()
    }
  }, [profile?.id, navigate, startSessionLocally])

  return null
}

export default function App() {
  const { user } = useAuthStore()

  useEffect(() => {
    // Purge any legacy non-UUID demo profiles from persisted storage
    const currentProfile = useAuthStore.getState().profile
    const currentUser = useAuthStore.getState().user
    if (
      (currentProfile && !isValidUuid(currentProfile.id)) ||
      (currentUser && !isValidUuid(currentUser.id))
    ) {
      console.warn('[App] Purging stale non-UUID credentials from localStorage')
      useAuthStore.setState({ user: null, profile: null, isDemo: false })
      try {
        localStorage.removeItem('beside-auth')
      } catch {}
      supabase.auth.signOut().catch(() => {})
    }

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) {
        useAuthStore.setState({ profile: normalizeProfile(data) })
      } else {
        // Failsafe: if profile is completely missing from database, sign out
        await supabase.auth.signOut()
        useAuthStore.setState({ user: null, profile: null })
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        useAuthStore.setState({ user: session.user })
        // Always re-fetch on SIGNED_IN so DB is always source of truth.
        // Prevents stale localStorage profile from overriding real DB state.
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || !useAuthStore.getState().profile) {
          fetchProfile(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, profile: null, isNewSignUp: false })
      }
    })
    
    // Check initial session — always re-fetch profile from DB on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
       if (session?.user) {
          fetchProfile(session.user.id)
       }
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAuthed = !!user

  useEffect(() => {
    if (user) {
      getOrCreateHubChannel()
    } else {
      cleanupRealtimeHub()
    }
  }, [user])

  return (
    <BrowserRouter>
      <GlobalListeners />
      <div className="min-h-screen bg-beside-bg">
        <GlobalNotificationBanner />
        <NotificationCenterModal />
        <Routes>
          <Route path="/auth" element={
            isAuthed ? <Navigate to="/" replace /> : <AuthPage />
          } />
          <Route path="/" element={
            <ProtectedLayout><HomePage /></ProtectedLayout>
          } />
          <Route path="/discover" element={
            <ProtectedLayout><DuoDiscoveryPage /></ProtectedLayout>
          } />
          <Route path="/world" element={
            <ProtectedLayout><StudyWorldPage /></ProtectedLayout>
          } />
          <Route path="/squad" element={
            <ProtectedLayout><SquadLobbyPage /></ProtectedLayout>
          } />
          <Route path="/duo" element={
            <ProtectedLayout><DuoPage /></ProtectedLayout>
          } />
          <Route path="/history" element={
            <ProtectedLayout><StudyHistoryPage /></ProtectedLayout>
          } />
          <Route path="/connections" element={
            <ProtectedLayout><ConnectionsPage /></ProtectedLayout>
          } />
          <Route path="/profile" element={
            <ProtectedLayout><ProfilePage /></ProtectedLayout>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedLayout><ProfilePage /></ProtectedLayout>
          } />
          <Route path="/onboarding" element={
            <ProtectedLayout><OnboardingPage /></ProtectedLayout>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
