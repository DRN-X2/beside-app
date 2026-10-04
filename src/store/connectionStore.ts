import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DemoUser, CompatibilityResult } from '../types'
import { DEMO_USERS } from '../data/demoUsers'

export interface ConnectionEntry {
  user: DemoUser
  status: 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'
  compatibility: CompatibilityResult
  connectedAt: string
  sessionCount: number
  totalMinutes: number
  goalsCompleted: number
}

interface ConnectionState {
  connections: Record<string, ConnectionEntry>
  sendRequest: (user: DemoUser, compat: CompatibilityResult) => void
  acceptRequest: (userId: string) => void
  rejectRequest: (userId: string) => void
  unmatch: (userId: string) => void
  updateStats: (userId: string, minutes: number, goalCompleted: boolean) => void
  getConnection: (userId: string) => ConnectionEntry | undefined
  addSessionConnection: (user: DemoUser, compat: CompatibilityResult, minutes: number, goalsCompleted: number) => void
  loadDemoConnections: () => void
  clearConnections: () => void
}

export const DEMO_CONNECTIONS: Record<string, ConnectionEntry> = {
  'demo-maria': {
    user: DEMO_USERS[0],
    status: 'accepted',
    compatibility: { score: 92, reasons: ['Web Development'], breakdown: { subjects: 25, studyStyle: 20, availability: 20, location: 15, goals: 12 } },
    connectedAt: '2026-03-01T10:00:00Z',
    sessionCount: 3,
    totalMinutes: 90,
    goalsCompleted: 7,
  },
  'demo-carlos': {
    user: DEMO_USERS[1],
    status: 'accepted',
    compatibility: { score: 88, reasons: ['Algorithms'], breakdown: { subjects: 25, studyStyle: 20, availability: 18, location: 15, goals: 10 } },
    connectedAt: '2026-03-02T14:00:00Z',
    sessionCount: 2,
    totalMinutes: 60,
    goalsCompleted: 5,
  },
  'demo-sofia': {
    user: DEMO_USERS[2],
    status: 'accepted',
    compatibility: { score: 85, reasons: ['Mathematics'], breakdown: { subjects: 22, studyStyle: 20, availability: 18, location: 15, goals: 10 } },
    connectedAt: '2026-03-03T16:00:00Z',
    sessionCount: 1,
    totalMinutes: 30,
    goalsCompleted: 3,
  },
  'demo-miguel': {
    user: DEMO_USERS[3],
    status: 'accepted',
    compatibility: { score: 80, reasons: ['Chemistry'], breakdown: { subjects: 20, studyStyle: 20, availability: 18, location: 12, goals: 10 } },
    connectedAt: '2026-03-04T12:00:00Z',
    sessionCount: 1,
    totalMinutes: 45,
    goalsCompleted: 3,
  },
  'demo-elena': {
    user: DEMO_USERS[4],
    status: 'accepted',
    compatibility: { score: 95, reasons: ['Data Science'], breakdown: { subjects: 28, studyStyle: 20, availability: 20, location: 15, goals: 12 } },
    connectedAt: '2026-03-05T18:00:00Z',
    sessionCount: 4,
    totalMinutes: 120,
    goalsCompleted: 9,
  },
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      // Real accounts start with 0 connections!
      connections: {},

      loadDemoConnections: () => set({ connections: DEMO_CONNECTIONS }),

      clearConnections: () => set({ connections: {} }),

      addSessionConnection: (user, compat, minutes, goalsCompleted) => set((state) => ({
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

      sendRequest: (user, compat) => set((state) => ({
        connections: {
          ...state.connections,
          [user.id]: {
            user,
            status: 'pending_sent',
            compatibility: compat,
            connectedAt: new Date().toISOString(),
            sessionCount: 0,
            totalMinutes: 0,
            goalsCompleted: 0,
          },
        },
      })),

      acceptRequest: (userId) => set((state) => ({
        connections: {
          ...state.connections,
          [userId]: {
            ...state.connections[userId],
            status: 'accepted',
            connectedAt: new Date().toISOString(),
          },
        },
      })),

      rejectRequest: (userId) => set((state) => ({
        connections: {
          ...state.connections,
          [userId]: { ...state.connections[userId], status: 'rejected' },
        },
      })),

      unmatch: (userId) => set((state) => {
        const { [userId]: _, ...rest } = state.connections
        return { connections: rest }
      }),

      updateStats: (userId, minutes, goalCompleted) => set((state) => {
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
    }),
    {
      name: 'beside-connections',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
