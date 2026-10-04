import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
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

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isDemo, profile, isNewSignUp } = useAuthStore()
  const { isActive, isSquadActive } = useSessionStore()
  const location = useLocation()

  if (!user && !isDemo) return <Navigate to="/auth" replace />

  // ONLY redirect to /onboarding if this was a fresh account creation (isNewSignUp === true)
  // and onboarding has not been completed.
  // Regular sign-ins and Demo Mode will NEVER be forced into onboarding.
  if (!isDemo && isNewSignUp && profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
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

export default function App() {
  const { user, isDemo } = useAuthStore()

  useEffect(() => {
    const purgeDemoConnectionsIfLive = () => {
      if (!useAuthStore.getState().isDemo) {
        const conns = useConnectionStore.getState().connections
        if (conns && Object.keys(conns).some((k) => k.startsWith('demo-'))) {
          useConnectionStore.getState().clearConnections()
        }
      }
    }

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) {
        useAuthStore.setState({ profile: normalizeProfile(data) })
        purgeDemoConnectionsIfLive()
      } else {
        // Failsafe: if profile is completely missing from database, sign out
        await supabase.auth.signOut()
        useAuthStore.setState({ user: null, profile: null, isDemo: false })
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        useAuthStore.setState({ user: session.user })
        purgeDemoConnectionsIfLive()
        if (!useAuthStore.getState().profile) {
           fetchProfile(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, profile: null, isDemo: false })
      }
    })
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
       if (session?.user) {
          purgeDemoConnectionsIfLive()
          if (!useAuthStore.getState().profile) {
            fetchProfile(session.user.id)
          }
       }
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAuthed = !!user || isDemo

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-beside-bg">
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
          <Route path="/onboarding" element={
            <ProtectedLayout><OnboardingPage /></ProtectedLayout>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
