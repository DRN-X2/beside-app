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
  reasons: string[] // e.g. ['Web Development', 'React', '50-min sessions']
}

export interface Squad {
  id: string
  creator_id: string
  name: string
  description?: string
  focus: string
  objective: string
  duration: number // 30, 50, 60
  max_members: number // 3, 4, 5 (default 5)
  min_members: number // 3
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
  duration: number = 50
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
  userKeywords.forEach(k => {
    if (k.length > 2 && squadText.includes(k)) {
      score += 8
      if (reasons.length < 3) {
        // Capitalize for display
        const displayWord = k.charAt(0).toUpperCase() + k.slice(1)
        reasons.push(displayWord)
      }
    }
  })

  // 2. Session duration preference
  if (profile.study_style?.includes('sprint') && duration <= 30) {
    score += 5
    reasons.push('Sprint Duration')
  } else if (duration === 50) {
    score += 5
    reasons.push('50-min Focus')
  }

  // 3. Collaborative preference
  if ((profile as any).learning_goals?.length) {
    score += 5
  }

  // Clamp score between 72% and 98%
  const finalScore = Math.min(98, Math.max(72, score))

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
 */
export async function fetchPublicSquads(currentUserId?: string, userProfile?: UserProfile | null): Promise<Squad[]> {
  try {
    // 1. Query active / waiting squad sessions from Supabase sessions table
    const { data: dbSessions, error } = await supabase
      .from('sessions')
      .select('*, host:profiles!host_id(*), session_participants(*, user:profiles!user_id(*))')
      .eq('type', 'squad')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })

    const squads: Squad[] = []

    if (!error && dbSessions && dbSessions.length > 0) {
      dbSessions.forEach((s: any) => {
        const creator = normalizeProfile(s.host)
        const participants = (s.session_participants || []).map((p: any, idx: number) => ({
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
        const duration = s.duration_minutes || 50
        const match = calculateSquadMatch(userProfile || null, focus, '', [focus], duration)

        squads.push({
          id: s.id,
          creator_id: s.host_id,
          name: s.subject || 'Study Squad',
          description: 'Collaborative group study lobby',
          focus,
          objective: 'Learn and review concepts together',
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
    }

    // 2. If no squads exist in database yet, provide dynamic community squads
    // to give learners an immediate lively game-lobby browsing experience.
    if (squads.length === 0) {
      const demoCommunitySquads: Omit<Squad, 'match'>[] = [
        {
          id: 'squad-community-1',
          creator_id: 'creator-tech',
          name: 'TECH EXPLORERS',
          description: 'Review REST APIs, backend architecture, and endpoint best practices.',
          focus: 'Web Development',
          objective: 'Review REST APIs and build a simple endpoint.',
          duration: 50,
          max_members: 5,
          min_members: 3,
          privacy: 'public',
          status: 'gathering',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          tags: ['Web Development', 'Databases', 'APIs'],
          members: [
            {
              id: 'm1',
              squad_id: 'squad-community-1',
              user_id: 'u-maria',
              role: 'leader',
              ready: true,
              slot_index: 0,
              joined_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              profile: {
                id: 'u-maria',
                username: 'maria_s',
                display_name: 'Maria Santos',
                school: 'UST',
                degree_program: 'BS Information Technology',
                education_level: 'Undergraduate',
                year_of_study: '3rd Year',
                online_status: 'available',
                otter: { furColor: '#C49A45', earType: 'round', clothing: 'hoodie', accessory: 'glasses', expression: 'happy' },
              } as any,
            },
            {
              id: 'm2',
              squad_id: 'squad-community-1',
              user_id: 'u-james',
              role: 'member',
              ready: true,
              slot_index: 1,
              joined_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
              profile: {
                id: 'u-james',
                username: 'james_r',
                display_name: 'James Reyes',
                school: 'DLSU',
                degree_program: 'BS Computer Science',
                education_level: 'Undergraduate',
                year_of_study: '2nd Year',
                online_status: 'available',
                otter: { furColor: '#8C5835', earType: 'curled', clothing: 'jacket', accessory: 'headphones', expression: 'calm' },
              } as any,
            },
            {
              id: 'm3',
              squad_id: 'squad-community-1',
              user_id: 'u-rhea',
              role: 'member',
              ready: false,
              slot_index: 2,
              joined_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
              profile: {
                id: 'u-rhea',
                username: 'rhea_o',
                display_name: 'Rhea Ortiz',
                school: 'UP Diliman',
                degree_program: 'BS Computer Engineering',
                education_level: 'Undergraduate',
                year_of_study: '3rd Year',
                online_status: 'available',
                otter: { furColor: '#E6D7C3', earType: 'pointed', clothing: 'sweater', accessory: 'book', expression: 'focused' },
              } as any,
            },
          ],
        },
        {
          id: 'squad-community-2',
          creator_id: 'creator-data',
          name: 'DATA MINING FORUM',
          description: 'Hands-on sprint studying classification algorithms and decision trees.',
          focus: 'Data Mining',
          objective: 'Classification algorithms, decision trees, and model evaluation.',
          duration: 50,
          max_members: 5,
          min_members: 3,
          privacy: 'public',
          status: 'gathering',
          created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
          tags: ['Data Science', 'Machine Learning', 'Python'],
          members: [
            {
              id: 'm4',
              squad_id: 'squad-community-2',
              user_id: 'u-kenji',
              role: 'leader',
              ready: true,
              slot_index: 0,
              joined_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
              profile: {
                id: 'u-kenji',
                username: 'kenji_t',
                display_name: 'Kenji Tanaka',
                school: 'Ateneo de Manila',
                degree_program: 'BS Applied Mathematics',
                education_level: 'Undergraduate',
                year_of_study: '4th Year',
                online_status: 'available',
                otter: { furColor: '#A47551', earType: 'round', clothing: 'hoodie', accessory: 'coffee', expression: 'happy' },
              } as any,
            },
            {
              id: 'm5',
              squad_id: 'squad-community-2',
              user_id: 'u-elena',
              role: 'member',
              ready: true,
              slot_index: 1,
              joined_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
              profile: {
                id: 'u-elena',
                username: 'elena_v',
                display_name: 'Elena Vance',
                school: 'FEU',
                degree_program: 'BS Information Systems',
                education_level: 'Undergraduate',
                year_of_study: '3rd Year',
                online_status: 'available',
                otter: { furColor: '#5C3826', earType: 'curled', clothing: 'coat', accessory: 'glasses', expression: 'focused' },
              } as any,
            },
            {
              id: 'm6',
              squad_id: 'squad-community-2',
              user_id: 'u-marcus',
              role: 'member',
              ready: true,
              slot_index: 2,
              joined_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
              profile: {
                id: 'u-marcus',
                username: 'marcus_c',
                display_name: 'Marcus Chen',
                school: 'Mapua University',
                degree_program: 'BS Computer Science',
                education_level: 'Undergraduate',
                year_of_study: '2nd Year',
                online_status: 'available',
                otter: { furColor: '#C49A45', earType: 'pointed', clothing: 'vest', accessory: 'none', expression: 'calm' },
              } as any,
            },
            {
              id: 'm7',
              squad_id: 'squad-community-2',
              user_id: 'u-chloe',
              role: 'member',
              ready: false,
              slot_index: 3,
              joined_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
              profile: {
                id: 'u-chloe',
                username: 'chloe_b',
                display_name: 'Chloe Bennett',
                school: 'PUP',
                degree_program: 'BS Statistics',
                education_level: 'Undergraduate',
                year_of_study: '3rd Year',
                online_status: 'available',
                otter: { furColor: '#E6D7C3', earType: 'round', clothing: 'sweater', accessory: 'flower', expression: 'happy' },
              } as any,
            },
          ],
        },
        {
          id: 'squad-community-3',
          creator_id: 'creator-algo',
          name: 'ALGORITHM SPRINT',
          description: 'Fast-paced review of graph traversals (BFS, DFS, Dijkstra).',
          focus: 'Data Structures',
          objective: 'Solve 2 graph traversal problems collaboratively.',
          duration: 30,
          max_members: 4,
          min_members: 3,
          privacy: 'public',
          status: 'gathering',
          created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          tags: ['Algorithms', 'LeetCode', 'Interview Prep'],
          members: [
            {
              id: 'm8',
              squad_id: 'squad-community-3',
              user_id: 'u-alex',
              role: 'leader',
              ready: true,
              slot_index: 0,
              joined_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
              profile: {
                id: 'u-alex',
                username: 'alex_kim',
                display_name: 'Alex Kim',
                school: 'UST',
                degree_program: 'BS Computer Science',
                education_level: 'Undergraduate',
                year_of_study: '4th Year',
                online_status: 'available',
                otter: { furColor: '#8C5835', earType: 'curled', clothing: 'hoodie', accessory: 'headphones', expression: 'focused' },
              } as any,
            },
            {
              id: 'm9',
              squad_id: 'squad-community-3',
              user_id: 'u-pat',
              role: 'member',
              ready: false,
              slot_index: 1,
              joined_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
              profile: {
                id: 'u-pat',
                username: 'pat_g',
                display_name: 'Patricia Gomez',
                school: 'De La Salle Lipa',
                degree_program: 'BS Information Technology',
                education_level: 'Undergraduate',
                year_of_study: '2nd Year',
                online_status: 'available',
                otter: { furColor: '#A47551', earType: 'round', clothing: 'jacket', accessory: 'glasses', expression: 'calm' },
              } as any,
            },
          ],
        },
      ]

      demoCommunitySquads.forEach(ds => {
        const match = calculateSquadMatch(userProfile || null, ds.focus, ds.objective, ds.tags, ds.duration)
        squads.push({ ...ds, match })
      })
    }

    // Rank squads by compatibility score (descending)
    squads.sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0))

    return squads
  } catch (err) {
    console.warn('[squadService] fetchPublicSquads error:', err)
    return []
  }
}

/**
 * Creates a brand new Squad in Supabase.
 */
export async function createSquadDB(
  creator: UserProfile | DemoUser,
  params: {
    name: string
    focus: string
    objective: string
    description?: string
    duration: number
    max_members: number
    privacy: 'public' | 'private'
    tags?: string[]
  }
): Promise<{ squad: Squad | null; error: string | null }> {
  try {
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

    const newSquad: Squad = {
      id: session.id,
      creator_id: creator.id,
      name: params.name,
      description: params.description,
      focus: params.focus,
      objective: params.objective,
      duration: params.duration,
      max_members: params.max_members,
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
  requester: UserProfile | DemoUser
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
  inviter: UserProfile | DemoUser,
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
