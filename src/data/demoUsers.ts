import type { DemoUser, Badge, StudyWorldMarker } from '../types'

// ============================================================
// BESIDE Seed & Demo Data - Deprecated & Emptied for Production Realtime
// ============================================================

export const DEMO_USERS: DemoUser[] = []

export const DEMO_CURRENT_USER: DemoUser = {
  id: '',
  email: '',
  display_name: 'Learner',
  education_status: 'College',
  degree_program: '',
  degree_code: '',
  year_level: '',
  school: '',
  subjects: [],
  learning_interests: [],
  skills: [],
  study_style: 'mixed',
  preferred_duration: 30,
  availability: [],
  accountability_pref: 'gentle',
  camera_pref: true,
  mic_pref: true,
  country: 'Philippines',
  country_code: 'PH',
  city: 'Manila',
  online_status: 'online',
  xp: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  onboarding_completed: true,
  otter: {
    fur: 'brown',
    eyes: 'happy',
    glasses: 'none',
    clothing: 'hoodie',
    accessory: 'none',
    background: 'cream',
  },
}

export const DEMO_BADGES: Badge[] = []

export const DEMO_MAP_MARKERS: StudyWorldMarker[] = []

export const isDemoMode = () => false
