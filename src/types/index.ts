// Core application types for BESIDE

export type OtterFur = 'brown' | 'tan' | 'dark' | 'cream' | 'grey'
export type OtterEyes = 'happy' | 'curious' | 'sleepy' | 'focused' | 'cool'
export type OtterGlasses = 'none' | 'round' | 'square' | 'aviator' | 'star'
export type OtterClothing = 'none' | 'hoodie' | 'uniform' | 'casual' | 'formal' | 'sweater'
export type OtterAccessory = 'none' | 'headphones' | 'pencil' | 'book' | 'coffee' | 'backpack'
export type OtterBackground = 'cream' | 'sky' | 'forest' | 'library' | 'night' | 'sunset'

export interface OtterConfig {
  fur: OtterFur
  eyes: OtterEyes
  glasses: OtterGlasses
  clothing: OtterClothing
  accessory: OtterAccessory
  background: OtterBackground
}

export type EducationStatus =
  | 'College'
  | 'Senior High'
  | 'High School'
  | 'Graduated'
  | 'College/University'
  | 'Senior High School'

export type StudyStyle = 'quiet' | 'discussion' | 'mixed' | 'flexible'
export type SessionDuration = 15 | 30 | 60
export type AccountabilityPref = 'strict' | 'gentle' | 'flexible'
export type OnlineStatus = 'online' | 'studying' | 'looking' | 'away' | 'offline' | 'available'

export interface Profile {
  id: string
  user_id?: string
  username?: string
  display_name: string
  education_status: EducationStatus
  degree_program: string
  degree_code: string
  year_level: string
  school: string
  subjects: string[]
  learning_interests: string[]
  skills: string[]
  study_style: StudyStyle
  preferred_duration: SessionDuration
  availability: string[]
  accountability_pref: AccountabilityPref
  camera_pref: boolean
  mic_pref: boolean
  country: string
  country_code: string
  city: string
  otter: OtterConfig
  online_status: OnlineStatus
  xp: number
  streak?: number
  onboarding_completed?: boolean
  openworld_visible?: boolean
  connections_private?: boolean
  otter_config?: any
  created_at: string
  updated_at: string
}

export interface DemoUser extends Profile {}

export interface Badge {
  id: string
  title: string
  tier: 'gold' | 'silver' | 'bronze'
  category: 'duo_streak' | 'squad_streak' | 'daily_active'
  description: string
  unlocked: boolean
  progress: number
  target: number
}

export interface DuoObjective {
  id: string
  text: string
  completed: boolean
}

export interface SquadMember {
  user: DemoUser
  isHost: boolean
  isReady: boolean
  slotIndex: number
}

export interface SquadRoom {
  id: string
  name: string
  subject: string
  maxMembers: number
  members: SquadMember[]
  hostId: string
  status: 'lobby' | 'in_session'
}

export interface StudyWorldMarker {
  id: string
  userId: string
  user: DemoUser
  x: number // percentage 0-100 on map
  y: number // percentage 0-100 on map
  subject: string
  mode: 'duo' | 'squad'
  status: OnlineStatus
}

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'unmatched'

export interface Connection {
  id: string
  requester_id: string
  receiver_id: string
  status: ConnectionStatus
  created_at: string
  updated_at: string
}

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned'
export type GoalCompletion = 'completed' | 'partial' | 'not_completed'

export interface StudySession {
  id: string
  connection_id: string
  participants: string[]
  subject: string
  goal: string
  duration_minutes: SessionDuration
  started_at: string
  ended_at?: string
  status: SessionStatus
  goal_completion?: GoalCompletion
}

export interface Message {
  id: string
  session_id: string
  sender_id: string
  content: string
  created_at: string
}

export type RelationshipLevel =
  | 'New Connection'
  | 'Study Buddies'
  | 'Consistent Partners'
  | 'Learning Partners'
  | 'Trusted Study Partners'

export interface StudyHistory {
  partner_id: string
  partner: Profile
  session_count: number
  total_hours: number
  goals_completed: number
  relationship_level: RelationshipLevel
  last_session_at: string
  shared_subjects: string[]
}

export interface CompatibilityResult {
  score: number
  reasons: string[]
  breakdown: {
    subjects: number
    studyStyle: number
    availability: number
    location: number
    goals: number
  }
}

// Seed/demo data types
export interface DemoUser extends Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  id: string
  email: string
  compatibility?: CompatibilityResult
}
