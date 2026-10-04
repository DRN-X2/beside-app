import { create } from 'zustand'
import type { SessionDuration, GoalCompletion, DuoObjective, DemoUser } from '../types'

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
}

interface SessionState {
  isActive: boolean
  partner: DemoUser | null
  subject: string
  duration: SessionDuration
  timeLeft: number
  startedAt: Date | null
  objectives: DuoObjective[]
  messages: ChatMessage[]
  isCompleted: boolean
  completionStatus: GoalCompletion | null
  isSquadActive: boolean

  setSquadActive: (active: boolean) => void
  startSession: (partner: DemoUser, duration: SessionDuration, initialSubject?: string) => void
  setSubject: (subject: string) => void
  setObjectives: (objectives: DuoObjective[]) => void
  addObjective: (text: string) => void
  toggleObjective: (id: string) => void
  removeObjective: (id: string) => void
  tick: () => void
  sendMessage: (content: string, senderId: string, senderName: string) => void
  completeSession: (status: GoalCompletion) => void
  endSession: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  isActive: false,
  partner: null,
  subject: 'Collaborative Study',
  duration: 30,
  timeLeft: 30 * 60,
  startedAt: null,
  objectives: [
    { id: 'obj-1', text: 'Agree on core topic & scope', completed: true },
    { id: 'obj-2', text: 'Review key concept notes', completed: false },
    { id: 'obj-3', text: 'Solve 3 practice questions', completed: false },
  ],
  messages: [],
  isCompleted: false,
  completionStatus: null,
  isSquadActive: false,

  setSquadActive: (isSquadActive) => set({ isSquadActive }),

  startSession: (partner, duration, initialSubject) => set({
    isActive: true,
    partner,
    subject: initialSubject || 'Topic Discussion',
    duration,
    timeLeft: duration * 60,
    startedAt: new Date(),
    objectives: [
      { id: 'obj-1', text: 'Define today’s study focus', completed: false },
      { id: 'obj-2', text: 'Review key concepts & exchange notes', completed: false },
      { id: 'obj-3', text: 'Solve challenge problems together', completed: false },
    ],
    messages: [
      {
        id: 'msg-welcome',
        senderId: partner.id,
        senderName: partner.display_name,
        content: `Hey! Excited to study together for this ${duration}m block. What should we tackle first?`,
        timestamp: new Date(),
      },
    ],
    isCompleted: false,
    completionStatus: null,
  }),

  setSubject: (subject) => set({ subject }),

  setObjectives: (objectives) => set({ objectives: objectives.slice(0, 3) }),

  addObjective: (text) => set((state) => {
    if (state.objectives.length >= 3) return state
    const newObj: DuoObjective = {
      id: `obj-${Date.now()}`,
      text,
      completed: false,
    }
    return { objectives: [...state.objectives, newObj] }
  }),

  toggleObjective: (id) => set((state) => ({
    objectives: state.objectives.map((obj) =>
      obj.id === id ? { ...obj, completed: !obj.completed } : obj
    ),
  })),

  removeObjective: (id) => set((state) => ({
    objectives: state.objectives.filter((obj) => obj.id !== id),
  })),

  tick: () => set((state) => {
    if (!state.isActive) return state
    if (state.timeLeft <= 1) {
      return { timeLeft: 0, isActive: false, isCompleted: true, completionStatus: 'completed' }
    }
    return { timeLeft: state.timeLeft - 1 }
  }),

  sendMessage: (content, senderId, senderName) => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: `msg-${Date.now()}`,
        senderId,
        senderName,
        content,
        timestamp: new Date(),
      },
    ],
  })),

  completeSession: (status) => set({
    isActive: false,
    isCompleted: true,
    completionStatus: status,
  }),

  endSession: () => set({
    isActive: false,
    partner: null,
    subject: '',
    timeLeft: 30 * 60,
    startedAt: null,
    messages: [],
    isCompleted: false,
    completionStatus: null,
  }),
}))
