import { supabase } from '../lib/supabase'
import { normalizeProfile } from '../utils/profileNormalizer'
import { isValidUuid } from '../store/authStore'
import type { DemoUser } from '../types'

export type OpenWorldConnectionStatus =
  | 'NONE'
  | 'REQUEST_SENT'
  | 'REQUEST_RECEIVED'
  | 'CONNECTED'
  | 'DECLINED'

export interface OpenWorldUser extends DemoUser {
  openworld_visible: boolean
  connectionStatus: OpenWorldConnectionStatus
  connectionId?: string
}

export interface OpenWorldConnection {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  accepted_at?: string
}

/**
 * Fetch all OpenWorld-visible learners with their connection status relative to currentUserId.
 */
export async function fetchOpenWorldLearners(currentUserId: string): Promise<{
  learners: OpenWorldUser[]
  connections: OpenWorldConnection[]
  error: string | null
}> {
  try {
    // 1. Fetch current user visibility setting
    let myIsVisible = true
    if (currentUserId && isValidUuid(currentUserId)) {
      const { data: myProfile, error: myError } = await supabase
        .from('profiles')
        .select('openworld_visible, otter_config')
        .eq('id', currentUserId)
        .maybeSingle()

      if (myError) {
        console.warn('[OpenWorld] Could not fetch current user visibility:', myError.message)
      }

      if (myProfile) {
        myIsVisible = typeof myProfile.openworld_visible === 'boolean'
          ? myProfile.openworld_visible
          : myProfile.otter_config?.openworld_visible !== false
      }
    }

    // 2. Fetch all accepted connections involving current user
    let rawConnections = null
    if (currentUserId && isValidUuid(currentUserId)) {
      const { data, error: connError } = await supabase
        .from('connections')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)

      if (connError) {
        console.warn('[OpenWorld] Could not fetch connections:', connError.message)
      }
      rawConnections = data
    }

    const connections: OpenWorldConnection[] = (rawConnections || []) as OpenWorldConnection[]
    const connectedPartnerIds = new Set<string>()
    const connByUser: Record<string, OpenWorldConnection> = {}
    for (const c of connections) {
      const otherId = c.requester_id === currentUserId ? c.recipient_id : c.requester_id
      connectedPartnerIds.add(otherId)
      connByUser[otherId] = c
    }

    // 3. Fetch all other profiles from Supabase
    let query = supabase.from('profiles').select('*')
    if (currentUserId && isValidUuid(currentUserId)) {
      query = query.neq('id', currentUserId)
    }

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      return { learners: [], connections: [], error: profilesError.message }
    }

    // 4. Filter and map according to privacy rules:
    // - Connected study buddies are ALWAYS visible to each other (even if either is in hidden mode)
    // - Unconnected learners are visible ONLY IF both current user and other user are VISIBLE
    const learners: OpenWorldUser[] = (profiles || [])
      .map((raw) => {
        const profile = normalizeProfile(raw)
        if (!profile) return null

        const otherIsVisible = typeof raw.openworld_visible === 'boolean'
          ? raw.openworld_visible
          : raw.otter_config?.openworld_visible !== false

        const isConnected = connectedPartnerIds.has(profile.id)
        const conn = connByUser[profile.id]

        let shouldBeVisible = false
        if (isConnected) {
          // Connected buddy: always visible
          shouldBeVisible = true
        } else {
          // Stranger / unconnected: visible only if both users enabled public visibility
          shouldBeVisible = myIsVisible && otherIsVisible
        }

        if (!shouldBeVisible) return null

        return {
          ...profile,
          openworld_visible: otherIsVisible,
          connectionStatus: isConnected ? ('CONNECTED' as const) : ('NONE' as const),
          connectionId: conn?.id,
        } as OpenWorldUser
      })
      .filter((u): u is OpenWorldUser => u !== null)

    return { learners, connections, error: null }
  } catch (err: any) {
    return { learners: [], connections: [], error: err?.message || 'Unknown error' }
  }
}

/**
 * Send a connection request from currentUserId to recipientId.
 */
export async function sendConnectionRequest(
  currentUserId: string,
  recipientId: string
): Promise<{ error: string | null }> {
  try {
    // Check for existing connection first
    const { data: existing } = await supabase
      .from('connections')
      .select('id, status')
      .or(
        `and(requester_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${currentUserId})`
      )
      .maybeSingle()

    if (existing) {
      return { error: 'Connection already exists' }
    }

    const { error } = await supabase.from('connections').insert({
      requester_id: currentUserId,
      recipient_id: recipientId,
      status: 'pending',
      created_at: new Date().toISOString(),
    })

    return { error: error?.message || null }
  } catch (err: any) {
    return { error: err?.message || 'Failed to send request' }
  }
}

/**
 * Accept a connection request.
 */
export async function acceptConnectionRequest(
  connectionId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('connections')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', connectionId)

    return { error: error?.message || null }
  } catch (err: any) {
    return { error: err?.message || 'Failed to accept' }
  }
}

/**
 * Decline a connection request.
 */
export async function declineConnectionRequest(
  connectionId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'declined' })
      .eq('id', connectionId)

    return { error: error?.message || null }
  } catch (err: any) {
    return { error: err?.message || 'Failed to decline' }
  }
}

/**
 * Update the current user's OpenWorld visibility setting.
 */
export async function updateOpenWorldVisibility(
  userId: string,
  visible: boolean
): Promise<{ error: string | null }> {
  if (!isValidUuid(userId)) {
    return { error: 'Invalid user ID' }
  }
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('otter_config')
      .eq('id', userId)
      .maybeSingle()

    const currentConfig = existing?.otter_config || {}
    const { error } = await supabase
      .from('profiles')
      .update({
        openworld_visible: visible,
        otter_config: { ...currentConfig, openworld_visible: visible },
      })
      .eq('id', userId)

    return { error: error?.message || null }
  } catch (err: any) {
    return { error: err?.message || 'Failed to update visibility' }
  }
}

/**
 * Fetch connections for the current user from Supabase.
 */
export async function fetchMyConnections(currentUserId: string): Promise<OpenWorldConnection[]> {
  if (!isValidUuid(currentUserId)) return []
  try {
    const { data } = await supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)

    return (data || []) as OpenWorldConnection[]
  } catch {
    return []
  }
}
