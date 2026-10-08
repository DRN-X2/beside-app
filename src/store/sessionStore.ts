import { create } from 'zustand'
import type { SessionDuration, GoalCompletion, DuoObjective, DemoUser } from '../types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'
import { awardXP } from '../services/xpService'

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
}

interface SessionState {
  sessionId: string | null
  isActive: boolean
  partner: DemoUser | null
  subject: string
  duration: SessionDuration
  timeLeft: number
  startedAt: Date | null
  endsAt: Date | null
  objectives: DuoObjective[]
  messages: ChatMessage[]
  isCompleted: boolean
  completionStatus: GoalCompletion | null
  isSquadActive: boolean

  setSquadActive: (active: boolean) => void
  startSessionLocally: (sessionId: string, partner: DemoUser | null, duration: SessionDuration, startedAt: Date, endsAt: Date) => void
  syncSessionData: (data: Partial<SessionState>) => void
  setSubject: (subject: string) => void
  setSubjectDB: (subject: string) => Promise<void>
  setObjectives: (objectives: DuoObjective[]) => void
  addObjectiveDB: (text: string) => Promise<void>
  toggleObjectiveDB: (id: string, currentStatus: boolean) => Promise<void>
  removeObjectiveDB: (id: string) => Promise<void>
  fetchMessagesDB: (sessionId: string) => Promise<void>
  sendMessageDB: (content: string, senderId: string, senderName: string) => Promise<void>
  addMessageRealtime: (msg: ChatMessage) => void
  tick: () => void
  completeSession: (status: GoalCompletion) => void
  endSession: () => void
  endSessionDB: () => Promise<void>
  setSessionId: (id: string) => void
  setEndsAt: (endsAt: Date) => void
}

const loadPersistedSession = () => {
  try {
    const raw = localStorage.getItem('beside_active_session')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const endsAt = new Date(parsed.endsAt)
    if (endsAt.getTime() > Date.now()) {
      return {
        sessionId: parsed.sessionId as string,
        isActive: true,
        partner: parsed.partner as DemoUser,
        duration: parsed.duration as SessionDuration,
        startedAt: new Date(parsed.startedAt),
        endsAt,
        timeLeft: Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000)),
      }
    }
    localStorage.removeItem('beside_active_session')
    return null
  } catch {
    return null
  }
}

const initialPersisted = loadPersistedSession()

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessionId: initialPersisted?.sessionId || null,
  isActive: initialPersisted?.isActive || false,
  partner: initialPersisted?.partner || null,
  subject: '',
  duration: initialPersisted?.duration || 30,
  timeLeft: initialPersisted?.timeLeft || 30 * 60,
  startedAt: initialPersisted?.startedAt || null,
  endsAt: initialPersisted?.endsAt || null,
  objectives: [],
  messages: [],
  isCompleted: false,
  completionStatus: null,
  isSquadActive: false,

  setSquadActive: (isSquadActive) => set({ isSquadActive }),

  startSessionLocally: (sessionId, partner, duration, startedAt, endsAt) => {
    try {
      localStorage.setItem(
        'beside_active_session',
        JSON.stringify({
          sessionId,
          partner,
          duration,
          startedAt: startedAt.toISOString(),
          endsAt: endsAt.toISOString(),
        })
      )
    } catch {}

    set({
      sessionId,
      isActive: true,
      partner,
      duration,
      startedAt,
      endsAt,
      timeLeft: Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000)),
      objectives: [],
      messages: [],
      isCompleted: false,
      completionStatus: null,
    })
  },

  syncSessionData: (data) => set((state) => ({ ...state, ...data })),

  setSubject: (subject) => set({ subject }),

  setSubjectDB: async (subject: string) => {
    const { sessionId } = get()
    set({ subject })
    if (sessionId) {
      await supabase.from('sessions').update({ subject }).eq('id', sessionId)
    }
  },

  setObjectives: (objectives) => set({ objectives: objectives.slice(0, 3) }),

  addObjectiveDB: async (text) => {
    const { sessionId, objectives } = get()
    if (!sessionId || objectives.length >= 3) return
    await supabase.from('session_objectives').insert({
      session_id: sessionId,
      text,
      completed: false
    })
  },

  toggleObjectiveDB: async (id, currentStatus) => {
    const isNowCompleted = !currentStatus
    await supabase.from('session_objectives').update({
      completed: isNowCompleted,
      completed_at: isNowCompleted ? new Date().toISOString() : null
    }).eq('id', id)

    // Award +10 XP for accomplishing an objective!
    if (isNowCompleted) {
      const currentUserId = useAuthStore.getState().profile?.id
      if (currentUserId) {
        awardXP(currentUserId, 10, 'Objective accomplished')
      }
    }
  },

  removeObjectiveDB: async (id) => {
    await supabase.from('session_objectives').delete().eq('id', id)
  },

  fetchMessagesDB: async (sessionId: string) => {
    if (!sessionId) return
    const { data } = await supabase
      .from('session_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (data) {
      const msgs: ChatMessage[] = data.map((row: any) => ({
        id: row.id,
        senderId: row.sender_id,
        senderName: row.sender_name,
        content: row.content,
        timestamp: new Date(row.created_at)
      }))
      set({ messages: msgs })
    }
  },

  sendMessageDB: async (content: string, senderId: string, senderName: string) => {
    const { sessionId } = get()
    if (!sessionId || !content.trim()) return

    // Optimistic local add
    const tempId = `temp-${Date.now()}`
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: tempId,
          senderId,
          senderName,
          content: content.trim(),
          timestamp: new Date()
        }
      ]
    }))

    // Real DB insertion
    const { data, error } = await supabase.from('session_messages').insert({
      session_id: sessionId,
      sender_id: senderId,
      sender_name: senderName,
      content: content.trim()
    }).select().single()

    if (data) {
      set((state) => ({
        messages: state.messages.map((m) => m.id === tempId ? {
          id: data.id,
          senderId: data.sender_id,
          senderName: data.sender_name,
          content: data.content,
          timestamp: new Date(data.created_at)
        } : m)
      }))
    }
  },

  addMessageRealtime: (msg: ChatMessage) => set((state) => {
    if (state.messages.some((m) => m.id === msg.id)) {
      return state
    }
    return { messages: [...state.messages, msg] }
  }),

  tick: () => set((state) => {
    if (!state.isActive || !state.endsAt) return state
    
    const timeLeft = Math.max(0, Math.floor((state.endsAt.getTime() - Date.now()) / 1000))
    
    if (timeLeft <= 0) {
      return { timeLeft: 0, isActive: false, isCompleted: true, completionStatus: 'completed' }
    }
    return { timeLeft }
  }),

  completeSession: (status) => set({
    isActive: false,
    isCompleted: true,
    completionStatus: status,
  }),

  endSession: () => {
    try {
      localStorage.removeItem('beside_active_session')
    } catch {}
    set({
      sessionId: null,
      isActive: false,
      partner: null,
      subject: '',
      timeLeft: 30 * 60,
      startedAt: null,
      endsAt: null,
      messages: [],
      isCompleted: false,
      completionStatus: null,
    })
  },

  endSessionDB: async () => {
    const { sessionId } = get()
    if (sessionId) {
      await supabase.from('sessions').update({
        status: 'completed',
        ends_at: new Date().toISOString()
      }).eq('id', sessionId)

      // Award +10 XP for completing a successful study session!
      const currentUserId = useAuthStore.getState().profile?.id
      if (currentUserId) {
        awardXP(currentUserId, 10, 'Successful study session completed')
      }
    }
    get().endSession()
  },

  setSessionId: (id: string) => set({ sessionId: id }),

  setEndsAt: (endsAt: Date) => set({
    endsAt,
    isActive: true,
    timeLeft: Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000)),
  }),
}))
