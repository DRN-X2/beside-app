import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

/**
 * Awards XP points to a user in Supabase and synchronizes the local auth store.
 * Rewards:
 * - Accomplished objective: +10 XP
 * - Successful study session: +10 XP
 * - Gaining a new connection: +50 XP
 */
export async function awardXP(userId: string, amount: number, reason = 'Study activity'): Promise<number> {
  if (!userId || amount <= 0) return 0

  try {
    const currentProfile = useAuthStore.getState().profile
    const currentXP = typeof currentProfile?.xp === 'number' ? currentProfile.xp : 0
    const newXP = currentXP + amount

    // Optimistically update local profile in Zustand
    if (currentProfile) {
      useAuthStore.getState().setProfile({
        ...currentProfile,
        xp: newXP,
        otter_config: { ...currentProfile.otter_config, xp: newXP },
      })
    }

    // Persist to Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXP })
      .eq('id', userId)

    if (error) {
      console.warn(`[XP] Could not update XP for ${userId}:`, error.message)
    } else {
      console.log(`[XP] Awarded +${amount} XP (${reason}). Total: ${newXP} XP`)
    }

    return newXP
  } catch (err) {
    console.error('[XP] Exception awarding XP:', err)
    return 0
  }
}

export interface UserDashboardStats {
  connectionsCount: number
  sessionsCount: number
  totalHours: number
  totalMinutes: number
  goalsCompleted: number
  streakDays: number
  sessionDates: string[] // 'YYYY-MM-DD' strings for GitHub-style heatmap
}

/**
 * Fetches real stats across connections, completed sessions, and objectives from Supabase.
 */
export async function fetchUserDashboardStats(userId: string): Promise<UserDashboardStats> {
  const fallback: UserDashboardStats = {
    connectionsCount: 0,
    sessionsCount: 0,
    totalHours: 0,
    totalMinutes: 0,
    goalsCompleted: 0,
    streakDays: 0,
    sessionDates: [],
  }

  if (!userId) return fallback

  try {
    // 1. Accepted Connections count
    const { data: conns } = await supabase
      .from('connections')
      .select('id, accepted_at, created_at')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)

    const connectionsCount = conns?.length || 0

    // 2. Completed sessions involving user
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, duration_minutes, started_at, ends_at, created_at, status')
      .eq('status', 'completed')

    const userSessions = sessions || []
    const sessionsCount = userSessions.length
    const totalMinutes = userSessions.reduce((acc, s) => acc + (s.duration_minutes || 30), 0)
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10

    // 3. Completed objectives
    const { data: objectives } = await supabase
      .from('session_objectives')
      .select('id')
      .eq('completed', true)

    const goalsCompleted = objectives?.length || 0

    // 4. Session dates for Heatmap
    const sessionDates = userSessions
      .map((s) => (s.started_at || s.created_at || '').slice(0, 10))
      .filter(Boolean)

    // Calculate streak days (consecutive days with study activity)
    const uniqueDates = Array.from(new Set(sessionDates)).sort()
    let streak = 0
    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10)
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const hasToday = uniqueDates.includes(todayStr)
      const hasYesterday = uniqueDates.includes(yesterdayStr)

      if (hasToday || hasYesterday) {
        streak = 1
        for (let i = uniqueDates.length - 2; i >= 0; i--) {
          const prev = new Date(uniqueDates[i]).getTime()
          const curr = new Date(uniqueDates[i + 1]).getTime()
          if (curr - prev <= 86400000 * 1.5) {
            streak++
          } else {
            break
          }
        }
      }
    }

    return {
      connectionsCount,
      sessionsCount,
      totalHours,
      totalMinutes,
      goalsCompleted,
      streakDays: streak,
      sessionDates,
    }
  } catch (err) {
    console.error('[XP] Exception fetching user stats:', err)
    return fallback
  }
}
