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

export function hasCompletedSessionWith(userId: string): boolean {
  if (!userId) return false
  try {
    const past = JSON.parse(localStorage.getItem('beside_completed_sessions') || '[]')
    return Array.isArray(past) && past.includes(userId)
  } catch {
    return false
  }
}

export function recordCompletedSessionPartner(userId: string): void {
  if (!userId) return
  try {
    const past = JSON.parse(localStorage.getItem('beside_completed_sessions') || '[]')
    if (Array.isArray(past) && !past.includes(userId)) {
      past.push(userId)
      localStorage.setItem('beside_completed_sessions', JSON.stringify(past))
    }
  } catch {}
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

          newMap[peer.id] = {
            user: peer,
            status: entryStatus,
            compatibility: compat,
            connectedAt: row.accepted_at || row.created_at,
            sessionCount: get().connections[peer.id]?.sessionCount || 0,
            totalMinutes: get().connections[peer.id]?.totalMinutes || 0,
            goalsCompleted: get().connections[peer.id]?.goalsCompleted || 0,
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

  addSessionConnection: (user, compat, minutes, goalsCompleted) =>
    set((state) => ({
      connections: {
        ...state.connections,
        [user.id]: {
          user,
          status: 'accepted',
          compatibility: compat,
          connectedAt: new Date().toISOString(),
          sessionCount: (state.connections[user.id]?.sessionCount || 0) + 1,
          totalMinutes: (state.connections[user.id]?.totalMinutes || 0) + minutes,
          goalsCompleted: (state.connections[user.id]?.goalsCompleted || 0) + goalsCompleted,
        },
      },
    })),

  updateStats: (userId, minutes, goalCompleted) =>
    set((state) => {
      const conn = state.connections[userId]
      if (!conn) return state
      return {
        connections: {
          ...state.connections,
          [userId]: {
            ...conn,
            sessionCount: conn.sessionCount + 1,
            totalMinutes: conn.totalMinutes + minutes,
            goalsCompleted: conn.goalsCompleted + (goalCompleted ? 1 : 0),
          },
        },
      }
    }),

  getConnection: (userId) => get().connections[userId],
}))
