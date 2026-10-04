import type { DemoUser, OtterConfig } from '../types'

export const DEFAULT_OTTER: OtterConfig = {
  fur: 'brown',
  eyes: 'happy',
  glasses: 'none',
  clothing: 'hoodie',
  accessory: 'none',
  background: 'cream',
}

/**
 * Normalizes any profile coming from Supabase database or local storage
 * so that both `otter` and `otter_config` are always populated,
 * and all array/string fields have safe default fallbacks.
 */
export function normalizeProfile(raw: any): DemoUser | null {
  if (!raw) return null

  const resolvedOtter: OtterConfig = {
    fur: raw.otter?.fur || raw.otter_config?.fur || 'brown',
    eyes: raw.otter?.eyes || raw.otter_config?.eyes || 'happy',
    glasses: raw.otter?.glasses || raw.otter_config?.glasses || 'none',
    clothing: raw.otter?.clothing || raw.otter_config?.clothing || 'hoodie',
    accessory: raw.otter?.accessory || raw.otter_config?.accessory || 'none',
    background: raw.otter?.background || raw.otter_config?.background || 'cream',
  }

  return {
    id: raw.id || `user-${Date.now()}`,
    user_id: raw.id,
    email: raw.email || '',
    display_name: raw.display_name || raw.username || 'Study Buddy',
    username: raw.username || raw.display_name || 'student',
    education_status: raw.education_status || 'College',
    degree_program: raw.degree_program || 'Student',
    degree_code: raw.degree_code || 'STU',
    year_level: raw.year_level || '1st Year',
    school: raw.school || 'University',
    subjects: Array.isArray(raw.subjects) ? raw.subjects : [],
    learning_interests: Array.isArray(raw.learning_interests)
      ? raw.learning_interests
      : Array.isArray(raw.interests)
      ? raw.interests
      : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    study_style: raw.study_style || 'mixed',
    preferred_duration: raw.preferred_duration === 50 ? 30 : (raw.preferred_duration || 30),
    availability: Array.isArray(raw.availability) ? raw.availability : [],
    accountability_pref: raw.accountability_pref || 'gentle',
    camera_pref: raw.camera_pref ?? true,
    mic_pref: raw.mic_pref ?? true,
    country: raw.country || 'Philippines',
    country_code: raw.country_code || 'PH',
    city: raw.city || 'Manila',
    online_status: raw.online_status || 'online',
    xp: typeof raw.xp === 'number' ? raw.xp : 0,
    streak: typeof raw.streak === 'number' ? raw.streak : 0,
    onboarding_completed: raw.onboarding_completed !== undefined
      ? Boolean(raw.onboarding_completed)
      : (Array.isArray(raw.learning_interests) && raw.learning_interests.length >= 3 && Array.isArray(raw.skills) && raw.skills.length >= 1),
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    otter: resolvedOtter,
    // Add otter_config as alias for backwards compatibility
    ...({ otter_config: resolvedOtter }),
  } as DemoUser
}
