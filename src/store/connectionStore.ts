import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { normalizeProfile } from '../utils/profileNormalizer'
import { calculateCompatibility } from '../services/compatibility'
import { useAuthStore } from './authStore'
import type { DemoUser, CompatibilityResult } from '../types'

export interface ConnectionEntry {
  user: DemoUser
  status: 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'
  compatibility: CompatibilityResult
  connectedAt: string
  sessionCount: number
  totalMinutes: number
  goalsCompleted: number
}

export interface PartnerStats {
  sessionCount: number
  totalMinutes: number
  goalsCompleted: number
}

export function getStoredPartnerStats(userId?: string): Record<string, PartnerStats> {
  try {
    const auth = useAuthStore.getState()
    const pId = auth.profile?.id
    const uId = auth.user?.id
    const targetId = userId || pId || uId || 'default'

    const keys = Array.from(
      new Set([
        `beside_partner_stats_${targetId}`,
        pId ? `beside_partner_stats_${pId}` : '',
        uId ? `beside_partner_stats_${uId}` : '',
        'beside_partner_stats_default',
      ].filter(Boolean))
    )

    const merged: Record<string, PartnerStats> = {}
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          for (const [pid, st] of Object.entries(parsed as Record<string, PartnerStats>)) {
            if (!merged[pid]) {
              merged[pid] = { sessionCount: 0, totalMinutes: 0, goalsCompleted: 0 }
            }
            merged[pid] = {
              sessionCount: Math.max(merged[pid].sessionCount, st.sessionCount || 0),
              totalMinutes: Math.max(merged[pid].totalMinutes, st.totalMinutes || 0),
              goalsCompleted: Math.max(merged[pid].goalsCompleted, st.goalsCompleted || 0),
            }
          }
        } catch {}
      }
    }
    return merged
  } catch {
    return {}
  }
}

export function saveStoredPartnerStats(userId: string, stats: Record<string, PartnerStats>) {
  try {
    const auth = useAuthStore.getState()
    const pId = auth.profile?.id
    const uId = auth.user?.id
    const keys = Array.from(
      new Set([
        userId ? `beside_partner_stats_${userId}` : '',
        pId ? `beside_partner_stats_${pId}` : '',
        uId ? `beside_partner_stats_${uId}` : '',
        'beside_partner_stats_default',
      ].filter(Boolean))
    )

    const json = JSON.stringify(stats)
    for (const key of keys) {
      localStorage.setItem(key, json)
    }
  } catch {}
}

export function hasCompletedSessionWith(userId: string): boolean {
  if (!userId) return false
  try {
    const past = JSON.parse(localStorage.getItem('beside_completed_sessions') || '[]')
    return Array.isArray(past) && past.includes(userId)
  } catch {
    return false
  }
}

export function recordCompletedSessionPartner(partnerId: string, minutes = 30, goalsCompleted = 0): void {
  if (!partnerId) return
  const auth = useAuthStore.getState()
  const currentUserId = auth.profile?.id || auth.user?.id || 'default'

  try {
    const past = JSON.parse(localStorage.getItem('beside_completed_sessions') || '[]')
    if (Array.isArray(past) && !past.includes(partnerId)) {
      past.push(partnerId)
      localStorage.setItem('beside_completed_sessions', JSON.stringify(past))
    }
  } catch {}

  const allStats = getStoredPartnerStats(currentUserId)
  const current = allStats[partnerId] || { sessionCount: 0, totalMinutes: 0, goalsCompleted: 0 }
  allStats[partnerId] = {
    sessionCount: current.sessionCount + 1,
    totalMinutes: current.totalMinutes + minutes,
    goalsCompleted: current.goalsCompleted + goalsCompleted,
  }
  saveStoredPartnerStats(currentUserId, allStats)

  useConnectionStore.getState().updateStats(partnerId, minutes, goalsCompleted > 0)
}

interface ConnectionState {
  connections: Record<string, ConnectionEntry>
  isLoading: boolean
  setConnections: (connections: Record<string, ConnectionEntry>) => void
  fetchConnections: (currentUserId: string) => Promise<void>
  handleRealtimeConnection: (payload: any, currentUserId: string) => Promise<void>
  sendRequestDB: (toUser: DemoUser) => Promise<void>
  acceptRequestDB: (partnerId: string) => Promise<void>
  rejectRequestDB: (partnerId: string) => Promise<void>
  unmatchDB: (partnerId: string) => Promise<void>
  updateStats: (userId: string, minutes: number, goalCompleted: boolean) => void
  getConnection: (userId: string) => ConnectionEntry | undefined
  addSessionConnection: (user: DemoUser, compat: CompatibilityResult, minutes: number, goalsCompleted: number) => void
  clearConnections: () => void
}

export const useConnectionStore = create<ConnectionState>()((set, get) => ({
  connections: {},
  isLoading: false,

  setConnections: (connections) => set({ connections }),

  clearConnections: () => set({ connections: {} }),

  fetchConnections: async (currentUserId: string) => {
    if (!currentUserId) return
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          recipient_id,
          status,
          created_at,
          accepted_at,
          requester:profiles!requester_id(*),
          recipient:profiles!recipient_id(*)
        `)
        .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)

      if (error) {
        console.error('[connectionStore] Error fetching connections:', error.message)
        set({ isLoading: false })
        return
      }

      const currentUser = useAuthStore.getState().profile
      const newMap: Record<string, ConnectionEntry> = {}

      if (data) {
        for (const row of data as any[]) {
          const isRequester = row.requester_id === currentUserId
          const peerRaw = isRequester ? row.recipient : row.requester
          if (!peerRaw) continue

          const peer = normalizeProfile(peerRaw)
          if (!peer) continue

          let entryStatus: ConnectionEntry['status'] = 'pending_sent'
          if (row.status === 'accepted') {
            entryStatus = 'accepted'
          } else if (row.status === 'rejected') {
            entryStatus = 'rejected'
          } else {
            entryStatus = isRequester ? 'pending_sent' : 'pending_received'
          }

          const compat = currentUser
            ? calculateCompatibility(currentUser, peer)
            : { score: 85, reasons: ['Study peer'], breakdown: { subjects: 85, studyStyle: 85, availability: 85, location: 85, goals: 85 } }

          const partnerStatsMap = getStoredPartnerStats(currentUserId)
          let pStats = partnerStatsMap[peer.id] || {
            sessionCount: get().connections[peer.id]?.sessionCount || 0,
            totalMinutes: get().connections[peer.id]?.totalMinutes || 0,
            goalsCompleted: get().connections[peer.id]?.goalsCompleted || 0,
          }

          // Auto-heal: If stored stats are 0 but user has completed study sessions in database
          if (pStats.sessionCount === 0 && entryStatus === 'accepted') {
            try {
              const { data: dbSessions } = await supabase
                .from('sessions')
                .select('id, duration_minutes, status')
                .eq('status', 'completed')

              if (dbSessions && dbSessions.length > 0) {
                const acceptedRows = (data as any[]).filter((r: any) => r.status === 'accepted')
                if (acceptedRows.length === 1) {
                  const totalDbMinutes = dbSessions.reduce((acc: number, s: any) => acc + (s.duration_minutes || 30), 0)
                  pStats = {
                    sessionCount: dbSessions.length,
                    totalMinutes: totalDbMinutes,
                    goalsCompleted: 1,
                  }
                  partnerStatsMap[peer.id] = pStats
                  saveStoredPartnerStats(currentUserId, partnerStatsMap)
                }
              }
            } catch {}
          }

          newMap[peer.id] = {
            user: peer,
            status: entryStatus,
            compatibility: compat,
            connectedAt: row.accepted_at || row.created_at,
            sessionCount: pStats.sessionCount,
            totalMinutes: pStats.totalMinutes,
            goalsCompleted: pStats.goalsCompleted,
          }
        }
      }

      set({ connections: newMap, isLoading: false })
    } catch (err) {
      console.error('[connectionStore] Exception in fetchConnections:', err)
      set({ isLoading: false })
    }
  },

  handleRealtimeConnection: async (payload: any, currentUserId: string) => {
    const { eventType, new: newRow, old: oldRow } = payload
    const currentUser = useAuthStore.getState().profile

    if (eventType === 'DELETE') {
      const row = oldRow
      if (!row) return
      const peerId = row.requester_id === currentUserId ? row.recipient_id : row.requester_id
      set((state) => {
        const next = { ...state.connections }
        delete next[peerId]
        return { connections: next }
      })
      return
    }

    const row = newRow
    if (!row) return
    const isRequester = row.requester_id === currentUserId
    const peerId = isRequester ? row.recipient_id : row.requester_id

    // Fetch peer profile from DB
    const { data: peerData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', peerId)
      .single()

    if (!peerData) return
    const peer = normalizeProfile(peerData)
    if (!peer) return

    let entryStatus: ConnectionEntry['status'] = 'pending_sent'
    if (row.status === 'accepted') {
      entryStatus = 'accepted'
    } else if (row.status === 'rejected') {
      entryStatus = 'rejected'
    } else {
      entryStatus = isRequester ? 'pending_sent' : 'pending_received'
    }

    const compat = currentUser
      ? calculateCompatibility(currentUser, peer)
      : { score: 85, reasons: ['Study peer'], breakdown: { subjects: 85, studyStyle: 85, availability: 85, location: 85, goals: 85 } }

    set((state) => ({
      connections: {
        ...state.connections,
        [peer.id]: {
          user: peer,
          status: entryStatus,
          compatibility: compat,
          connectedAt: row.accepted_at || row.created_at || new Date().toISOString(),
          sessionCount: state.connections[peer.id]?.sessionCount || 0,
          totalMinutes: state.connections[peer.id]?.totalMinutes || 0,
          goalsCompleted: state.connections[peer.id]?.goalsCompleted || 0,
        },
      },
    }))
  },

  sendRequestDB: async (toUser: DemoUser) => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser) return

    // Clean DB write
    await supabase.from('connections').upsert({
      requester_id: currentUser.id,
      recipient_id: toUser.id,
      status: 'pending',
    }, { onConflict: 'requester_id,recipient_id' })

    // Insert notification to target user
    await supabase.from('notifications').insert({
      recipient_id: toUser.id,
      sender_id: currentUser.id,
      type: 'connect_request',
      data: {},
    })
  },

  acceptRequestDB: async (partnerId: string) => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser) return

    // Update connection status in DB
    await supabase
      .from('connections')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .or(`and(requester_id.eq.${partnerId},recipient_id.eq.${currentUser.id}),and(requester_id.eq.${currentUser.id},recipient_id.eq.${partnerId})`)

    // Notify requester that it's accepted
    await supabase.from('notifications').insert({
      recipient_id: partnerId,
      sender_id: currentUser.id,
      type: 'connect_accepted',
      data: {},
    })

    // Award +50 XP for gaining a new study buddy connection to both learners!
    const { awardXP } = await import('../services/xpService')
    await awardXP(currentUser.id, 50, 'New connection gained')
    await awardXP(partnerId, 50, 'New connection gained')
    get().fetchConnections(currentUser.id)
  },

  rejectRequestDB: async (partnerId: string) => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser) return

    await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .or(`and(requester_id.eq.${partnerId},recipient_id.eq.${currentUser.id}),and(requester_id.eq.${currentUser.id},recipient_id.eq.${partnerId})`)
  },

  unmatchDB: async (partnerId: string) => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser) return

    await supabase
      .from('connections')
      .delete()
      .or(`and(requester_id.eq.${partnerId},recipient_id.eq.${currentUser.id}),and(requester_id.eq.${currentUser.id},recipient_id.eq.${partnerId})`)
  },

  addSessionConnection: (user, compat, minutes, goalsCompleted) => {
    const auth = useAuthStore.getState()
    const currentUserId = auth.profile?.id || auth.user?.id || 'default'
    const allStats = getStoredPartnerStats(currentUserId)
    const current = allStats[user.id] || { sessionCount: 0, totalMinutes: 0, goalsCompleted: 0 }
    allStats[user.id] = {
      sessionCount: current.sessionCount + 1,
      totalMinutes: current.totalMinutes + minutes,
      goalsCompleted: current.goalsCompleted + goalsCompleted,
    }
    saveStoredPartnerStats(currentUserId, allStats)

    set((state) => ({
      connections: {
        ...state.connections,
        [user.id]: {
          user,
          status: 'accepted',
          compatibility: compat,
          connectedAt: new Date().toISOString(),
          sessionCount: allStats[user.id].sessionCount,
          totalMinutes: allStats[user.id].totalMinutes,
          goalsCompleted: allStats[user.id].goalsCompleted,
        },
      },
    }))
  },

  updateStats: (userId, minutes, goalCompleted) => {
    const auth = useAuthStore.getState()
    const currentUserId = auth.profile?.id || auth.user?.id || 'default'
    const allStats = getStoredPartnerStats(currentUserId)
    const current = allStats[userId] || { sessionCount: 0, totalMinutes: 0, goalsCompleted: 0 }
    allStats[userId] = {
      sessionCount: current.sessionCount + 1,
      totalMinutes: current.totalMinutes + minutes,
      goalsCompleted: current.goalsCompleted + (goalCompleted ? 1 : 0),
    }
    saveStoredPartnerStats(currentUserId, allStats)

    set((state) => {
      const conn = state.connections[userId]
      if (!conn) return state
      return {
        connections: {
          ...state.connections,
          [userId]: {
            ...conn,
            sessionCount: allStats[userId].sessionCount,
            totalMinutes: allStats[userId].totalMinutes,
            goalsCompleted: allStats[userId].goalsCompleted,
          },
        },
      }
    })
  },

  getConnection: (userId) => get().connections[userId],
}))
