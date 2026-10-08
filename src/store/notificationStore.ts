import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { DemoUser } from '../types'

export type LiveNotificationType =
  | 'connect_request'
  | 'connect_accepted'
  | 'duo_invite'
  | 'squad_invite'

export interface LiveNotification {
  id: string
  type: LiveNotificationType
  fromUser: DemoUser
  createdAt: number
  read?: boolean
  status?: 'pending' | 'accepted' | 'declined' | 'expired'
  data?: {
    sessionId?: string
    duration?: number
    subject?: string
    lobbyId?: string
    slotIndex?: number
    status?: string
  }
}

interface NotificationState {
  notifications: LiveNotification[]
  activeNotification: LiveNotification | null
  isPanelOpen: boolean
  setNotifications: (notifications: LiveNotification[]) => void
  addOrUpdateNotification: (notif: LiveNotification) => void
  dismissNotification: () => void
  removeNotification: (id: string) => Promise<void>
  updateNotificationStatus: (id: string, status: 'accepted' | 'declined' | 'expired') => void
  markAllAsRead: () => void
  clearAll: () => Promise<void>
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  activeNotification: null,
  isPanelOpen: false,

  setNotifications: (notifications) => set({ notifications }),

  addOrUpdateNotification: (notif) => set((state) => {
    const exists = state.notifications.some(n => n.id === notif.id)
    let newNotifs = state.notifications
    if (exists) {
      newNotifs = state.notifications.map(n => n.id === notif.id ? notif : n)
    } else {
      newNotifs = [notif, ...state.notifications]
    }
    return {
      notifications: newNotifs,
      activeNotification: !exists ? notif : state.activeNotification
    }
  }),

  dismissNotification: () => set({ activeNotification: null }),

  removeNotification: async (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      activeNotification: state.activeNotification?.id === id ? null : state.activeNotification,
    }))
    try {
      await supabase.from('notifications').delete().eq('id', id)
    } catch (e) {
      console.error(e)
    }
  },

  updateNotificationStatus: (id, status) => {
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === id ? { ...n, status } : n),
      activeNotification: state.activeNotification?.id === id
        ? { ...state.activeNotification, status }
        : state.activeNotification,
    }))
  },

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),

  clearAll: async () => {
    set({ notifications: [], activeNotification: null })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
         await supabase.from('notifications').delete().eq('recipient_id', session.user.id)
      }
    } catch (e) {
      console.error(e)
    }
  },

  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
}))
