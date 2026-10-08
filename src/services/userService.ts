import { supabase } from '../lib/supabase'
import { normalizeProfile } from '../utils/profileNormalizer'
import { isValidUuid } from '../store/authStore'
import type { DemoUser } from '../types'

/**
 * Fetches all registered learner profiles from Supabase,
 * excluding the currently logged-in user.
 * Each profile is normalized so it contains complete avatar, degree,
 * interests, and skills configurations.
 */
export async function fetchLearners(excludeUserId?: string): Promise<{ data: DemoUser[]; error: string | null }> {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (excludeUserId && isValidUuid(excludeUserId)) {
      query = query.neq('id', excludeUserId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[userService] Error fetching learners from Supabase:', error.message)
      return { data: [], error: error.message }
    }

    if (!data || data.length === 0) {
      return { data: [], error: null }
    }

    const normalized = data
      .map((item) => normalizeProfile(item))
      .filter((user): user is DemoUser => user !== null && (!excludeUserId || user.id !== excludeUserId))

    return { data: normalized, error: null }
  } catch (err: any) {
    console.error('[userService] Unexpected exception in fetchLearners:', err)
    return { data: [], error: err?.message || 'Failed to connect to database' }
  }
}

/**
 * Fetches a single user profile by their ID.
 */
export async function fetchUserProfile(userId: string): Promise<DemoUser | null> {
  if (!isValidUuid(userId)) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return normalizeProfile(data)
  } catch {
    return null
  }
}
