import React, { useState, useEffect } from 'react'
import {
  Users,
  Clock,
  Target,
  BookOpen,
  ChevronRight,
  Sparkles,
  Zap,
  Bell,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useConnectionStore } from '../store/connectionStore'
import { useSessionStore } from '../store/sessionStore'
import { useNotificationStore } from '../store/notificationStore'
import { useNavigate } from 'react-router-dom'
import OtterAvatar from '../components/OtterAvatar'
import { getRelationshipLevel } from '../services/relationships'
import { calculateCompatibility } from '../services/compatibility'
import { fetchLearners } from '../services/userService'
import { fetchUserDashboardStats, type UserDashboardStats } from '../services/xpService'
import { supabase } from '../lib/supabase'
import type { DemoUser } from '../types'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const { profile } = useAuthStore()
  const { connections, fetchConnections } = useConnectionStore()
  const { isActive, partner } = useSessionStore()
  const { notifications, togglePanel } = useNotificationStore()
  const navigate = useNavigate()
  const [learners, setLearners] = useState<DemoUser[]>([])
  const [stats, setStats] = useState<UserDashboardStats>({
    connectionsCount: 0,
    sessionsCount: 0,
    totalHours: 0,
    totalMinutes: 0,
    goalsCompleted: 0,
    streakDays: 0,
    sessionDates: [],
  })

  const loadDashboardStats = React.useCallback(async () => {
    if (!profile?.id) return
    const s = await fetchUserDashboardStats(profile.id)
    setStats(s)
  }, [profile?.id])

  useEffect(() => {
    if (profile?.id) {
      fetchConnections(profile.id)
      fetchLearners(profile.id).then(({ data }) => {
        setLearners(data)
      })
      loadDashboardStats()
    }
  }, [profile?.id, fetchConnections, loadDashboardStats])

  // Real-time synchronization for stats across users and sessions
  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase
      .channel(`home-stats-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => {
        loadDashboardStats()
        fetchConnections(profile.id)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        loadDashboardStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_objectives' }, () => {
        loadDashboardStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` }, () => {
        loadDashboardStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, loadDashboardStats, fetchConnections])

  if (!profile) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
        <OtterAvatar config={{ fur: 'brown', eyes: 'sleepy', glasses: 'none', clothing: 'hoodie', accessory: 'none', background: 'cream' }} size="lg" />
        <p className="mt-4 text-center">Your profile data is incomplete or loading.</p>
        <button onClick={() => useAuthStore.getState().signOut()} className="mt-6 px-6 py-3 bg-[#7E4228] text-white rounded-full font-bold">
          Log Out and Try Again
        </button>
      </div>
    )
  }

  const accepted = Object.values(connections).filter((c) => c.status === 'accepted')

  // Real recommendations computed from other registered learners
  const recommendations = learners
    .filter((u) => u.id !== profile.id && connections[u.id]?.status !== 'accepted')
    .map((u) => ({ user: u, compat: calculateCompatibility(profile, u) }))
    .sort((a, b) => b.compat.score - a.compat.score)
    .slice(0, 3)

  const xpEarned = typeof profile.xp === 'number' ? profile.xp : 0
  const currentLevel = Math.floor(xpEarned / 500) + 1
  const xpInCurrentLevel = xpEarned % 500
  const xpNeeded = 500 - xpInCurrentLevel

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#F1F1F1] flex flex-col justify-between p-4 max-w-md mx-auto select-none text-[#4C271A] pb-28">
      <div>
        {/* 1. App Top Header: Logo with matching brown background + "Beside" brand name */}
        <div className="flex items-center justify-between pt-2 pb-3 mb-4 border-b border-[#7E4228]/15">
          <div className="flex items-center gap-2.5">
            {/* Logo on #7E4228 brown background */}
            <div className="w-10 h-10 rounded-2xl bg-[#7E4228] p-1 flex items-center justify-center shadow-sm overflow-hidden border border-[#4C271A]/20">
              <img
                src="/beside-logo.png"
                alt="Beside Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xl text-[#4C271A] tracking-tight leading-tight">
                Beside
              </span>
              <span className="text-[10px] font-bold text-[#7E4228] tracking-wider uppercase">
                Study Together
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell Button */}
            <button
              onClick={togglePanel}
              className="w-10 h-10 rounded-2xl neu-card flex items-center justify-center text-[#4C271A] hover:text-[#7E4228] active:scale-95 transition-all relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5 stroke-[2.2]" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E0533C] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#F1F1F1] animate-bounce shadow-sm">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* User Profile Avatar Quick Access */}
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-2xl neu-card flex items-center justify-center p-0.5 active:scale-95 transition-transform relative cursor-pointer"
              title="View Profile"
            >
              <OtterAvatar config={(profile as any).otter_config || profile.otter || { fur: 'brown', eyes: 'happy', glasses: 'none', clothing: 'hoodie', accessory: 'none', background: 'cream' }} size="xs" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#15803D] ring-2 ring-[#F1F1F1]" />
            </button>
          </div>
        </div>

        {/* User Greeting */}
        <div className="mb-4">
          <p className="text-[11px] font-bold text-[#7E4228] uppercase tracking-wider">
            {getGreeting()},
          </p>
          <h1 className="font-display font-black text-2xl text-[#4C271A] tracking-tight">
            {profile.display_name}
          </h1>
        </div>

        {/* Active Session Banner */}
        {isActive && partner && (
          <button
            onClick={() => navigate('/duo')}
            className="w-full neu-btn-primary rounded-2xl p-4 mb-4 flex items-center justify-between shadow-md active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left text-white">
                <p className="font-black text-xs uppercase tracking-wider opacity-90">
                  Active Study Session
                </p>
                <p className="text-sm font-bold">
                  with {partner.display_name}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
        )}

        {/* 2. "Find Your Study Beside" Hero CTA Card (Secondary Brown #7E4228) */}
        <button
          onClick={() => navigate('/discover')}
          className="w-full bg-[#7E4228] text-white rounded-3xl p-5 mb-4 text-left shadow-[0_8px_20px_-4px_rgba(76,39,26,0.24)] border border-[#4C271A]/20 active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-display text-xl font-black mb-1 text-white">
                Find Your Study Partner
              </p>
              <p className="text-xs text-white/85 font-medium">
                Ready to learn beside someone?
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/15 p-1 flex items-center justify-center border border-white/20 drop-shadow-sm">
              <OtterAvatar config={{ ...profile.otter, background: 'cream' }} size="md" animate />
            </div>
          </div>
          <div className="mt-4 bg-white/20 text-white hover:bg-white/25 px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-black border border-white/30 shadow-sm transition-colors">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Discover Partners</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>

        {/* 3. Study XP Card (Directly BELOW "Find Your Study Beside" Card) */}
        <div className="neu-card-floating p-4 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#7E4228] fill-[#7E4228]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7E4228]">
                Study XP
              </span>
            </div>
            <span className="text-xs font-black text-[#7E4228] neu-pill px-2.5 py-0.5 border border-[#7E4228]/20">
              Level {currentLevel}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-display font-black text-3xl text-[#4C271A]">
              {xpEarned}
            </span>
            <span className="text-xs font-bold text-[#7E4228]">
              XP earned · {xpNeeded} XP to Level {currentLevel + 1}
            </span>
          </div>

          {/* Inset Progress Bar Track with Brown Fill */}
          <div className="w-full h-3 neu-inset p-0.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7E4228] rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, (xpInCurrentLevel / 500) * 100)}%` }}
            />
          </div>
        </div>

        {/* 4. Stats Grid (Sessions, Goals, Connections) */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            { label: 'Sessions', value: stats.sessionsCount, icon: <Clock className="w-4 h-4 stroke-[2.5]" /> },
            { label: 'Goals', value: stats.goalsCompleted, icon: <Target className="w-4 h-4 stroke-[2.5]" /> },
            { label: 'Connections', value: stats.connectionsCount, icon: <Users className="w-4 h-4 stroke-[2.5]" /> },
          ].map((stat) => (
            <div key={stat.label} className="neu-card p-3 text-center">
              <div className="text-[#7E4228] mb-1 flex justify-center">{stat.icon}</div>
              <div className="font-display text-2xl font-black text-[#4C271A]">{stat.value}</div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#7E4228] mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* 5. Study Partners Section */}
        {accepted.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-display font-black text-base text-[#4C271A]">
                Study Partners
              </h2>
              <button
                onClick={() => navigate('/history')}
                className="text-xs text-[#7E4228] font-black hover:underline"
              >
                See all
              </button>
            </div>
            <div className="space-y-2.5">
              {accepted.slice(0, 2).map((conn) => (
                <div key={conn.user.id} className="neu-card p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-[#4C271A]/10 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                    <OtterAvatar config={conn.user.otter} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-[#4C271A] truncate">
                      {conn.user.display_name}
                    </p>
                    <p className="text-[11px] text-[#7E4228] font-semibold truncate">
                      {getRelationshipLevel(conn.sessionCount)} · {conn.sessionCount} sessions
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/duo', { state: { partner: conn.user } })}
                    className="neu-btn-primary rounded-xl text-xs font-black py-2 px-3.5 whitespace-nowrap cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    Study Again
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Recommended Learners Section */}
        {recommendations.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-display font-black text-base text-[#4C271A]">
                Recommended
              </h2>
              <button
                onClick={() => navigate('/discover')}
                className="text-xs text-[#7E4228] font-black hover:underline"
              >
                See all
              </button>
            </div>
            <div className="space-y-2.5">
              {recommendations.map(({ user, compat }) => (
                <MiniMatchCard
                  key={user.id}
                  user={user}
                  compat={compat.score}
                  onConnect={() => navigate('/duo', { state: { partner: user } })}
                />
              ))}
            </div>
          </div>
        )}

        {/* 7. Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <button
            onClick={() => navigate('/history')}
            className="neu-card p-3.5 flex items-center gap-3 active:scale-95 transition-transform text-left"
          >
            <div className="w-10 h-10 neu-inset rounded-2xl flex items-center justify-center text-[#7E4228] flex-shrink-0">
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-black text-xs text-[#4C271A]">Study History</span>
          </button>
          <button
            onClick={() => navigate('/connections')}
            className="neu-card p-3.5 flex items-center gap-3 active:scale-95 transition-transform text-left"
          >
            <div className="w-10 h-10 neu-inset rounded-2xl flex items-center justify-center text-[#7E4228] flex-shrink-0">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-black text-xs text-[#4C271A]">Connections</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function MiniMatchCard({
  user,
  compat,
  onConnect,
}: {
  user: DemoUser
  compat: number
  onConnect: () => void
}) {
  return (
    <div className="neu-card p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-[#4C271A]/10 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
        <OtterAvatar config={user.otter} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-[#4C271A] truncate">{user.display_name}</p>
        <p className="text-[11px] text-[#7E4228] font-medium truncate">
          {user.degree_program} · {user.city}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] font-black text-emerald-800 neu-pill bg-emerald-50 px-2 py-0.5 border border-emerald-200">
          {compat}%
        </span>
        <button
          onClick={onConnect}
          className="neu-btn-primary rounded-xl text-xs font-black py-1.5 px-3.5 whitespace-nowrap cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          Study in Duo
        </button>
      </div>
    </div>
  )
}
