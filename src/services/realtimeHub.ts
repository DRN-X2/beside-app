import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore, type LiveNotification } from '../store/notificationStore'
import { useConnectionStore } from '../store/connectionStore'
import { useSessionStore } from '../store/sessionStore'
import type { DemoUser } from '../types'
import { normalizeProfile } from '../utils/profileNormalizer'
import { awardXP } from './xpService'

let notificationsChannel: ReturnType<typeof supabase.channel> | null = null
let connectionsChannel: ReturnType<typeof supabase.channel> | null = null
let sessionChannel: ReturnType<typeof supabase.channel> | null = null
let activeSubscribedSessionId: string | null = null

const eventListeners: Record<string, Set<(payload: any) => void>> = {}

async function fetchInitialNotifications(userId: string) {
  try {
    const { data } = await supabase
      .from('notifications')
      .select('*, sender:profiles!sender_id(*)')
      .eq('recipient_id', userId)
      .in('type', ['connect_request', 'connect_accepted', 'duo_invite', 'squad_invite'])
      .order('created_at', { ascending: false })

    if (data) {
      const notifs: LiveNotification[] = []
      for (const row of data as any[]) {
        const fromUser = normalizeProfile(row.sender)
        if (!fromUser) continue
        notifs.push({
          id: row.id,
          type: row.type,
          fromUser,
          createdAt: new Date(row.created_at).getTime(),
          read: Boolean(row.read),
          data: row.data,
        })
      }
      useNotificationStore.getState().setNotifications(notifs)
    }
  } catch (err) {
    console.error('[realtimeHub] fetchInitialNotifications error:', err)
  }
}

export async function fetchSessionObjectives(sessionId: string) {
  try {
    const { data } = await supabase
      .from('session_objectives')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (data) {
      const objs = data.map((row: any) => ({
        id: row.id,
        text: row.text,
        completed: row.completed,
      }))
      useSessionStore.getState().setObjectives(objs)
    }
  } catch (err) {
    console.error('[realtimeHub] fetchSessionObjectives error:', err)
  }
}

/**
 * Initializes all real-time subscriptions for the authenticated user.
 */
export function getOrCreateHubChannel() {
  const currentUserId = useAuthStore.getState().user?.id
  if (!currentUserId) return null

  if (notificationsChannel) return notificationsChannel

  // 1. Fetch initial notifications & connections from DB
  fetchInitialNotifications(currentUserId)
  useConnectionStore.getState().fetchConnections(currentUserId)

  // 2. Real-time subscription for NOTIFICATIONS
  notificationsChannel = supabase
    .channel(`user-notifications-${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      async (payload) => {
        const notifRow = payload.new as any
        if (!notifRow || notifRow.recipient_id !== currentUserId) return

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', notifRow.sender_id)
          .single()

        if (!profileData) return
        const fromUser = normalizeProfile(profileData)
        if (!fromUser) return

        if (['connect_request', 'connect_accepted', 'duo_invite', 'squad_invite'].includes(notifRow.type)) {
          const notif: LiveNotification = {
            id: notifRow.id,
            type: notifRow.type,
            fromUser,
            createdAt: new Date(notifRow.created_at).getTime(),
            read: notifRow.read,
            data: notifRow.data,
          }
          useNotificationStore.getState().addOrUpdateNotification(notif)
          
          // Re-fetch connections if connection event
          if (['connect_request', 'connect_accepted'].includes(notifRow.type)) {
            useConnectionStore.getState().fetchConnections(currentUserId)
            if (notifRow.type === 'connect_accepted') {
              awardXP(currentUserId, 50, 'New connection gained')
            }
          }
        } else {
          // System event
          const eventPayload = {
            toUserId: notifRow.recipient_id,
            fromUser,
            joiningUser: fromUser,
            decliningUserId: fromUser.id,
            hostUserId: notifRow.recipient_id,
            ...notifRow.data,
          }
          const listeners = eventListeners[notifRow.type]
          if (listeners) {
            listeners.forEach((fn) => fn(eventPayload))
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        const notifRow = payload.new as any
        if (notifRow && notifRow.id) {
          useNotificationStore.setState((prev) => ({
            notifications: prev.notifications.map((n) =>
              n.id === notifRow.id
                ? {
                    ...n,
                    read: notifRow.read,
                    status: notifRow.data?.status || (notifRow.read ? 'accepted' : n.status),
                    data: notifRow.data || n.data,
                  }
                : n
            ),
          }))
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        const deletedId = (payload.old as any)?.id
        if (deletedId) {
          useNotificationStore.setState((prev) => ({
            notifications: prev.notifications.filter((n) => n.id !== deletedId),
            activeNotification: prev.activeNotification?.id === deletedId ? null : prev.activeNotification,
          }))
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[RealtimeHub] Subscribed to notifications channel')
      }
    })

  // 3. Real-time subscription for CONNECTIONS
  connectionsChannel = supabase
    .channel(`user-connections-${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'connections',
      },
      (payload) => {
        const row = (payload.new as any) || (payload.old as any)
        if (row && (row.requester_id === currentUserId || row.recipient_id === currentUserId)) {
          useConnectionStore.getState().handleRealtimeConnection(payload, currentUserId)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[RealtimeHub] Subscribed to connections channel')
      }
    })

  return notificationsChannel
}

/**
 * Subscribes to an active session's real-time events (status changes, objectives, chat messages).
 */
export function subscribeToActiveSession(sessionId: string) {
  if (!sessionId || activeSubscribedSessionId === sessionId) return

  if (sessionChannel) {
    supabase.removeChannel(sessionChannel)
    sessionChannel = null
  }

  activeSubscribedSessionId = sessionId
  fetchSessionObjectives(sessionId)
  useSessionStore.getState().fetchMessagesDB(sessionId)

  sessionChannel = supabase
    .channel(`active-session-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        const updated = payload.new as any
        if (updated.status === 'completed' || updated.status === 'cancelled') {
          useSessionStore.getState().endSession()
        } else if (updated.status === 'active' && updated.ends_at) {
          useSessionStore.getState().setEndsAt(new Date(updated.ends_at))
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_objectives',
        filter: `session_id=eq.${sessionId}`,
      },
      () => {
        fetchSessionObjectives(sessionId)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'session_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const msg = payload.new as any
        if (msg) {
          useSessionStore.getState().addMessageRealtime({
            id: msg.id,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          })
        }
      }
    )
    .subscribe()
}

export function unsubscribeFromActiveSession() {
  if (sessionChannel) {
    supabase.removeChannel(sessionChannel)
    sessionChannel = null
    activeSubscribedSessionId = null
  }
}

export function cleanupRealtimeHub() {
  if (notificationsChannel) {
    supabase.removeChannel(notificationsChannel)
    notificationsChannel = null
  }
  if (connectionsChannel) {
    supabase.removeChannel(connectionsChannel)
    connectionsChannel = null
  }
  unsubscribeFromActiveSession()
}

export function onHubEvent(event: string, callback: (payload: any) => void) {
  if (!eventListeners[event]) {
    eventListeners[event] = new Set()
  }
  eventListeners[event].add(callback)

  return () => {
    eventListeners[event]?.delete(callback)
  }
}

// ----------------------------------------------------------------------
// DATABASE MUTATIONS: Perform clean writes directly to DB tables
// ----------------------------------------------------------------------

export async function sendLiveConnectRequest(toPeer: DemoUser, fromUser: DemoUser) {
  await supabase.from('connections').upsert(
    {
      requester_id: fromUser.id,
      recipient_id: toPeer.id,
      status: 'pending',
    },
    { onConflict: 'requester_id,recipient_id' }
  )

  return supabase.from('notifications').insert({
    recipient_id: toPeer.id,
    sender_id: fromUser.id,
    type: 'connect_request',
    data: {},
  })
}

export async function acceptLiveConnectRequest(toPeer: DemoUser, fromUser: DemoUser) {
  await supabase
    .from('connections')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .or(
      `and(requester_id.eq.${toPeer.id},recipient_id.eq.${fromUser.id}),and(requester_id.eq.${fromUser.id},recipient_id.eq.${toPeer.id})`
    )

  await supabase.from('notifications').insert({
    recipient_id: toPeer.id,
    sender_id: fromUser.id,
    type: 'connect_accepted',
    data: {},
  })

  // Award +50 XP to both learners
  await awardXP(fromUser.id, 50, 'New connection gained')
  await awardXP(toPeer.id, 50, 'New connection gained')

  useConnectionStore.getState().fetchConnections(fromUser.id)
}

export async function sendLiveDuoInvite(params: {
  toUserId: string
  fromUser: DemoUser
  sessionId: string
  duration: number
  subject?: string
}) {
  // Ensure session exists & invite participant in DB
  await supabase.from('session_participants').upsert(
    {
      session_id: params.sessionId,
      user_id: params.toUserId,
      status: 'invited',
    },
    { onConflict: 'session_id,user_id' }
  )

  return supabase.from('notifications').insert({
    recipient_id: params.toUserId,
    sender_id: params.fromUser.id,
    type: 'duo_invite',
    data: {
      sessionId: params.sessionId,
      duration: params.duration,
      subject: params.subject,
    },
  })
}

export async function acceptLiveDuoInvite(params: {
  toUserId: string
  fromUser: DemoUser
  sessionId: string
  duration: number
  subject: string
}) {
  const startedAt = new Date()
  const endsAt = new Date(startedAt.getTime() + params.duration * 60000)

  // 1. Mark session as active with synchronized start/end timestamps
  await supabase
    .from('sessions')
    .update({
      status: 'active',
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      subject: params.subject,
    })
    .eq('id', params.sessionId)

  // 2. Mark accepting user as joined
  await supabase.from('session_participants').upsert(
    {
      session_id: params.sessionId,
      user_id: params.fromUser.id,
      status: 'joined',
      joined_at: startedAt.toISOString(),
    },
    { onConflict: 'session_id,user_id' }
  )

  // 3. Notify host that invite was accepted
  return supabase.from('notifications').insert({
    recipient_id: params.toUserId,
    sender_id: params.fromUser.id,
    type: 'duo_accepted',
    data: {
      sessionId: params.sessionId,
      duration: params.duration,
      subject: params.subject,
    },
  })
}

export async function declineLiveDuoInvite(params: {
  toUserId: string
  fromUser: DemoUser
  sessionId?: string
}) {
  if (params.sessionId) {
    await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', params.sessionId)

    await supabase
      .from('session_participants')
      .update({ status: 'declined' })
      .match({ session_id: params.sessionId, user_id: params.fromUser.id })
  }

  return supabase.from('notifications').insert({
    recipient_id: params.toUserId,
    sender_id: params.fromUser.id,
    type: 'duo_declined',
    data: { sessionId: params.sessionId },
  })
}

export async function sendLiveSquadInvite(params: {
  toUserId: string
  fromUser: DemoUser
  lobbyId: string
  slotIndex: number
}) {
  // DB record of participant invited
  await supabase.from('session_participants').upsert(
    {
      session_id: params.lobbyId,
      user_id: params.toUserId,
      status: 'invited',
      slot_index: params.slotIndex,
    },
    { onConflict: 'session_id,user_id' }
  )

  return supabase.from('notifications').insert({
    recipient_id: params.toUserId,
    sender_id: params.fromUser.id,
    type: 'squad_invite',
    data: {
      lobbyId: params.lobbyId,
      slotIndex: params.slotIndex,
    },
  })
}

export async function joinLiveSquadLobby(params: {
  hostUserId: string
  joiningUser: DemoUser
  lobbyId: string
  slotIndex: number
}) {
  // DB record of participant officially joined
  await supabase.from('session_participants').upsert(
    {
      session_id: params.lobbyId,
      user_id: params.joiningUser.id,
      status: 'joined',
      slot_index: params.slotIndex,
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'session_id,user_id' }
  )

  return supabase.from('notifications').insert({
    recipient_id: params.hostUserId,
    sender_id: params.joiningUser.id,
    type: 'squad_joined',
    data: {
      lobbyId: params.lobbyId,
      slotIndex: params.slotIndex,
    },
  })
}

export async function declineLiveSquadInvite(params: {
  hostUserId: string
  decliningUserId: string
  lobbyId: string
  slotIndex: number
}) {
  await supabase
    .from('session_participants')
    .delete()
    .match({ session_id: params.lobbyId, user_id: params.decliningUserId })

  return supabase.from('notifications').insert({
    recipient_id: params.hostUserId,
    sender_id: params.decliningUserId,
    type: 'squad_declined',
    data: {
      lobbyId: params.lobbyId,
      slotIndex: params.slotIndex,
    },
  })
}
