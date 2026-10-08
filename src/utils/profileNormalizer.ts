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

  const config = (typeof raw.otter_config === 'object' && raw.otter_config !== null)
    ? raw.otter_config
    : (typeof raw.otter === 'object' && raw.otter !== null ? raw.otter : {})

  const resolvedOtter: OtterConfig = {
    fur: config.fur || 'brown',
    eyes: config.eyes || 'happy',
    glasses: config.glasses || 'none',
    clothing: config.clothing || 'hoodie',
    accessory: config.accessory || 'none',
    background: config.background || 'cream',
  }

  const rawInterests = Array.isArray(raw.interests) && raw.interests.length > 0
    ? raw.interests
    : (Array.isArray(raw.learning_interests) && raw.learning_interests.length > 0
      ? raw.learning_interests
      : (Array.isArray(config.learning_interests) ? config.learning_interests : []))

  const rawSkills = Array.isArray(raw.skills) && raw.skills.length > 0
    ? raw.skills
    : (Array.isArray(config.skills) ? config.skills : [])

  // ONLY trust the explicit database column. Never auto-infer completion
  // from data presence — that would let users bypass the onboarding flow.
  const isOnboardingDone =
    Boolean(raw.onboarding_completed) ||
    Boolean(config.onboarding_completed)

  return {
    id: raw.id || `user-${Date.now()}`,
    user_id: raw.id,
    email: raw.email || '',
    display_name: raw.display_name || raw.username || 'Study Buddy',
    username: raw.username || raw.display_name || 'student',
    education_status: raw.education_status || raw.category || config.education_status || 'College',
    degree_program: raw.degree_program || config.degree_program || 'BS Information Technology',
    degree_code: raw.degree_code || config.degree_code || 'BSIT',
    year_level: raw.year_level || config.year_level || '3rd Year',
    school: raw.school || config.school || 'MSU-IIT',
    subjects: rawInterests,
    learning_interests: rawInterests,
    skills: rawSkills,
    study_style: raw.study_style || config.study_style || 'mixed',
    preferred_duration: raw.preferred_duration === 50 ? 30 : (raw.preferred_duration || config.preferred_duration || 30),
    availability: Array.isArray(raw.availability) ? raw.availability : (config.availability || []),
    accountability_pref: raw.accountability_pref || config.accountability_pref || 'gentle',
    camera_pref: raw.camera_pref ?? config.camera_pref ?? true,
    mic_pref: raw.mic_pref ?? config.mic_pref ?? true,
    country: raw.country || config.country || 'Philippines',
    country_code: raw.country_code || config.country_code || 'PH',
    city: raw.city || config.city || 'Manila',
    online_status: raw.online_status || 'online',
    xp: typeof raw.xp === 'number' ? raw.xp : (config.xp || 0),
    streak: typeof raw.streak === 'number' ? raw.streak : (config.streak || 0),
    onboarding_completed: isOnboardingDone,
    openworld_visible: raw.openworld_visible !== false && config.openworld_visible !== false,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    otter: resolvedOtter,
    otter_config: {
      ...resolvedOtter,
      ...config,
      openworld_visible: raw.openworld_visible !== false && config.openworld_visible !== false,
    },
  } as DemoUser
}
