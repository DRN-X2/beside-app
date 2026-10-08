import { create } from 'zustand'

interface PresenceState {
  onlineUserIds: Set<string>
  setOnlineUsers: (ids: Set<string>) => void
  addOnlineUser: (id: string) => void
  removeOnlineUser: (id: string) => void
  isUserOnline: (userId?: string | null) => boolean
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUserIds: new Set<string>(),
  setOnlineUsers: (ids) => set({ onlineUserIds: ids }),
  addOnlineUser: (id) =>
    set((state) => {
      const next = new Set(state.onlineUserIds)
      next.add(id)
      return { onlineUserIds: next }
    }),
  removeOnlineUser: (id) =>
    set((state) => {
      const next = new Set(state.onlineUserIds)
      next.delete(id)
      return { onlineUserIds: next }
    }),
  isUserOnline: (userId) => {
    if (!userId) return false
    return get().onlineUserIds.has(userId)
  },
}))

/**
 * Resolves whether a user should appear online, studying, or offline
 * based on live presence socket state and session status.
 */
export function getEffectiveOnlineStatus(
  user: { id: string; online_status?: string },
  currentUserId?: string,
  isOnlineInPresence?: boolean
): 'online' | 'studying' | 'looking' | 'offline' {
  if (user.id === currentUserId) return 'online'
  if (!isOnlineInPresence) return 'offline'
  if (user.online_status === 'studying') return 'studying'
  if (user.online_status === 'looking') return 'looking'
  return 'online'
}
