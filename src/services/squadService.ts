import { supabase } from '../lib/supabase'
import type { DemoUser, DemoUser as UserProfile } from '../types'
import { normalizeProfile } from '../utils/profileNormalizer'

export interface SquadMember {
  id: string
  squad_id: string
  user_id: string
  role: 'leader' | 'member'
  ready: boolean
  slot_index: number // 0 to 4
  joined_at: string
  profile: DemoUser
}

export interface SquadMatchInfo {
  score: number // e.g. 92 (meaning 92%)
  reasons: string[] // e.g. ['Web Development', 'React', '30-min session']
}

export interface Squad {
  id: string
  creator_id: string
  name: string
  description?: string
  focus: string
  objective: string // Primary objective
  objectives: string[] // Up to 3 learning objectives
  duration: number // 15, 30, 60 min
  max_members: number // Always 5
  min_members: number // Always 3
  privacy: 'public' | 'private'
  status: 'gathering' | 'starting_soon' | 'active' | 'completed' | 'cancelled'
  created_at: string
  started_at?: string
  ended_at?: string
  tags: string[]
  members: SquadMember[]
  creator?: DemoUser
  match?: SquadMatchInfo
}

export interface SquadInvite {
  id: string
  squad_id: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  squad?: Squad
  inviter?: DemoUser
}

export interface SquadJoinRequest {
  id: string
  squad_id: string
  requester_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  squad?: Squad
  requester?: DemoUser
  matchScore?: number
}

/**
 * Calculates matching compatibility between a learner and a Squad focus.
 * Uses academic interests, skills, subjects, degree program, and session length.
 * Does NOT factor in appearance or avatar.
 */
export function calculateSquadMatch(
  profile: DemoUser | null,
  squadFocus: string,
  squadObjective: string,
  tags: string[] = [],
  duration: number = 30
): SquadMatchInfo {
  if (!profile) {
    return { score: 75, reasons: ['General Study Match'] }
  }

  const reasons: string[] = []
  let score = 65 // Baseline compatibility

  const userKeywords = new Set<string>([
    ...(profile.subjects || []).map((s: string) => s.toLowerCase()),
    ...(profile.skills || []).map((s: string) => s.toLowerCase()),
    ...(profile.learning_interests || []).map((i: string) => i.toLowerCase()),
    (profile.degree_program || '').toLowerCase(),
  ].filter(Boolean))

  const squadText = `${squadFocus} ${squadObjective} ${tags.join(' ')}`.toLowerCase()

  // 1. Topic & Interests overlap
  userKeywords.forEach((k) => {
    if (k.length > 2 && squadText.includes(k)) {
      score += 8
      if (reasons.length < 3) {
        const displayWord = k.charAt(0).toUpperCase() + k.slice(1)
        reasons.push(displayWord)
      }
    }
  })

  // 2. Session duration preference
  if (duration === 15) {
    score += 5
    reasons.push('15-min Sprint')
  } else if (duration === 30) {
    score += 6
    reasons.push('30-min Focus')
  } else if (duration === 60) {
    score += 5
    reasons.push('1-hr Deep Study')
  }

  // 3. Collaborative preference
  if ((profile as any).learning_goals?.length) {
    score += 5
  }

  // Clamp score between 70% and 98%
  const finalScore = Math.min(98, Math.max(70, score))

  if (reasons.length === 0) {
    reasons.push(squadFocus.split(' ')[0] || 'Learning Goals')
    reasons.push(`${duration}-min Session`)
  }

  return {
    score: finalScore,
    reasons,
  }
}

/**
 * Fetch all public squads available for discovery.
 * Strictly queries real sessions from Supabase. Zero mock or demo squads.
 */
export async function fetchPublicSquads(
  currentUserId?: string,
  userProfile?: UserProfile | null
): Promise<Squad[]> {
  try {
    // 1. Query active / waiting squad sessions from Supabase sessions table
    const { data: dbSessions, error } = await supabase
      .from('sessions')
      .select('*, host:profiles!host_id(*), session_participants(*, user:profiles!user_id(*))')
      .eq('type', 'squad')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })

    if (error || !dbSessions) {
      return []
    }

    // 2. Query session objectives for all found squads
    const sessionIds = dbSessions.map((s: any) => s.id)
    let objectivesBySession: Record<string, string[]> = {}
    if (sessionIds.length > 0) {
      const { data: objs } = await supabase
        .from('session_objectives')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true })

      if (objs) {
        objs.forEach((o: any) => {
          if (!objectivesBySession[o.session_id]) {
            objectivesBySession[o.session_id] = []
          }
          objectivesBySession[o.session_id].push(o.text)
        })
      }
    }

    const squads: Squad[] = []

    dbSessions.forEach((s: any) => {
      const creator = normalizeProfile(s.host)
      const participants: SquadMember[] = (s.session_participants || []).map((p: any, idx: number) => ({
        id: p.id,
        squad_id: s.id,
        user_id: p.user_id,
        role: p.user_id === s.host_id ? ('leader' as const) : ('member' as const),
        ready: p.status === 'joined',
        slot_index: p.slot_index ?? idx,
        joined_at: p.joined_at || s.created_at,
        profile: normalizeProfile(p.user) || creator,
      }))

      const focus = s.subject || 'Collaborative Study'
      const duration = s.duration_minutes || 30
      const squadObjectives = objectivesBySession[s.id] || []
      const primaryObjective = squadObjectives[0] || 'Learn and review concepts together'
      const match = calculateSquadMatch(userProfile || null, focus, primaryObjective, [focus], duration)

      squads.push({
        id: s.id,
        creator_id: s.host_id,
        name: s.subject || 'Study Squad',
        description: 'Collaborative group study lobby',
        focus,
        objective: primaryObjective,
        objectives: squadObjectives,
        duration,
        max_members: 5,
        min_members: 3,
        privacy: 'public',
        status: s.status === 'waiting' ? 'gathering' : 'active',
        created_at: s.created_at,
        tags: [focus.split(' ')[0] || 'Study', 'Collaboration'],
        members: participants,
        creator: creator || undefined,
        match,
      })
    })

    // Rank squads by compatibility score (descending)
    squads.sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0))

    return squads
  } catch (err) {
    console.warn('[squadService] fetchPublicSquads error:', err)
    return []
  }
}

/**
 * Creates a brand new Squad in Supabase with up to 3 objectives.
 * Member capacity is fixed to min 3, max 5.
 */
export async function createSquadDB(
  creator: DemoUser,
  params: {
    name: string
    focus: string
    objectives: string[] // Up to 3 learning objectives
    description?: string
    duration: number // 15, 30, 60
    privacy: 'public' | 'private'
    tags?: string[]
  }
): Promise<{ squad: Squad | null; error: string | null }> {
  try {
    const validObjectives = params.objectives
      .map((o) => o.trim())
      .filter((o) => o.length > 0)
      .slice(0, 3)

    const primaryObjective = validObjectives[0] || 'Collaborative study sprint'

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        host_id: creator.id,
        type: 'squad',
        status: 'waiting',
        subject: params.name,
        duration_minutes: params.duration,
      })
      .select()
      .single()

    if (error || !session) {
      return { squad: null, error: error?.message || 'Could not create squad session' }
    }

    // Insert Leader as Slot 0 participant
    await supabase.from('session_participants').insert({
      session_id: session.id,
      user_id: creator.id,
      status: 'joined',
      slot_index: 0,
      joined_at: new Date().toISOString(),
    })

    // Insert up to 3 objectives into session_objectives table
    if (validObjectives.length > 0) {
      const objRows = validObjectives.map((text) => ({
        session_id: session.id,
        text,
        completed: false,
      }))
      await supabase.from('session_objectives').insert(objRows)
    }

    const newSquad: Squad = {
      id: session.id,
      creator_id: creator.id,
      name: params.name,
      description: params.description,
      focus: params.focus,
      objective: primaryObjective,
      objectives: validObjectives,
      duration: params.duration,
      max_members: 5,
      min_members: 3,
      privacy: params.privacy,
      status: 'gathering',
      created_at: session.created_at,
      tags: params.tags || [params.focus.split(' ')[0] || 'Study'],
      members: [
        {
          id: `member-${creator.id}`,
          squad_id: session.id,
          user_id: creator.id,
          role: 'leader',
          ready: true,
          slot_index: 0,
          joined_at: new Date().toISOString(),
          profile: creator,
        },
      ],
      creator,
      match: { score: 100, reasons: ['Your Squad (Leader)'] },
    }

    return { squad: newSquad, error: null }
  } catch (err: any) {
    return { squad: null, error: err?.message || 'Unexpected error' }
  }
}

/**
 * Sends a Join Request from a non-connected user to the Squad Leader.
 */
export async function sendJoinRequestDB(
  squad: Squad,
  requester: DemoUser
): Promise<{ error: string | null }> {
  try {
    // Deliver notification to squad creator
    const { error } = await supabase.from('notifications').insert({
      recipient_id: squad.creator_id,
      sender_id: requester.id,
      type: 'squad_join_request',
      data: {
        squadId: squad.id,
        squadName: squad.name,
        requesterName: requester.display_name,
        requesterSchool: requester.school,
        requesterDegree: requester.degree_program,
        matchScore: squad.match?.score || 90,
      },
    })

    if (error) {
      console.warn('[squadService] Could not insert join request notification:', error)
    }

    // Broadcast real-time event to the squad lobby channel
    const channel = supabase.channel(`squad-lobby-${squad.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'join_request_received',
      payload: {
        squadId: squad.id,
        requester,
        matchScore: squad.match?.score || 90,
      },
    })

    return { error: null }
  } catch (err: any) {
    return { error: err?.message || 'Could not send join request' }
  }
}

/**
 * Sends an Invitation to a connected friend.
 */
export async function sendSquadInviteDB(
  squad: Squad,
  inviter: DemoUser,
  inviteeId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('notifications').insert({
      recipient_id: inviteeId,
      sender_id: inviter.id,
      type: 'squad_invite',
      data: {
        lobbyId: squad.id,
        squadName: squad.name,
        focus: squad.focus,
        duration: squad.duration,
        membersCount: squad.members.length,
      },
    })

    return { error: error ? error.message : null }
  } catch (err: any) {
    return { error: err?.message || 'Could not send invite' }
  }
}
