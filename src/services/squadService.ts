import { supabase } from '../lib/supabase'
import type { DemoUser, DemoUser as UserProfile, OtterConfig } from '../types'
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

// ═══════════════════ SAMPLE USERS FOR SQUAD LOBBIES ═══════════════════
function createSampleUser(
  id: string,
  display_name: string,
  school: string,
  degree_program: string,
  otter: OtterConfig,
  subjects: string[] = [],
  skills: string[] = [],
  learning_interests: string[] = []
): DemoUser {
  return {
    id,
    email: `${id}@beside.app`,
    display_name,
    school,
    degree_program,
    degree_code: degree_program.slice(0, 4).toUpperCase(),
    education_status: 'College',
    year_level: '3rd Year',
    subjects,
    skills,
    learning_interests,
    study_style: 'flexible',
    preferred_duration: 30,
    availability: ['Afternoon', 'Evening'],
    accountability_pref: 'gentle',
    camera_pref: true,
    mic_pref: true,
    country: 'United States',
    country_code: 'US',
    city: 'Boston',
    otter,
    online_status: 'online',
    xp: 450,
    streak: 5,
    onboarding_completed: true,
    openworld_visible: true,
    connections_private: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export const SAMPLE_SQUAD_USERS: DemoUser[] = [
  createSampleUser('sample-user-maya', 'Maya Chen', 'MIT', 'Computer Science & AI', {
    fur: 'brown',
    eyes: 'happy',
    glasses: 'round',
    clothing: 'hoodie',
    accessory: 'headphones',
    background: 'cream',
  }, ['Algorithms', 'Data Structures', 'Python'], ['Algorithms', 'Full Stack'], ['Competitive Programming', 'Graph Theory']),

  createSampleUser('sample-user-lucas', 'Lucas Vance', 'Stanford', 'Software Engineering', {
    fur: 'dark',
    eyes: 'focused',
    glasses: 'none',
    clothing: 'sweater',
    accessory: 'coffee',
    background: 'library',
  }, ['System Design', 'Algorithms', 'Go'], ['Backend', 'Distributed Systems'], ['Cloud Architecture', 'LeetCode']),

  createSampleUser('sample-user-elena', 'Elena Rostova', 'UC Berkeley', 'Applied Mathematics', {
    fur: 'tan',
    eyes: 'curious',
    glasses: 'none',
    clothing: 'hoodie',
    accessory: 'none',
    background: 'forest',
  }, ['Calculus', 'Linear Algebra', 'Algorithms'], ['Mathematical Modeling', 'Python'], ['Machine Learning Math', 'Combinatorics']),

  createSampleUser('sample-user-jin', 'Jin Woo', 'Seoul National University', 'Computer Engineering', {
    fur: 'cream',
    eyes: 'curious',
    glasses: 'square',
    clothing: 'casual',
    accessory: 'none',
    background: 'sky',
  }, ['Operating Systems', 'C++', 'Computer Architecture'], ['C++', 'Low-Level Dev'], ['Kernel Programming', 'Hardware Emulation']),

  createSampleUser('sample-user-sophia', 'Sophia Patel', 'Johns Hopkins', 'Biochemistry & Pre-Med', {
    fur: 'brown',
    eyes: 'happy',
    glasses: 'round',
    clothing: 'sweater',
    accessory: 'none',
    background: 'sunset',
  }, ['Organic Chemistry', 'Biochemistry', 'Cell Biology'], ['Lab Research', 'Spectroscopy'], ['Medical Synthesis', 'Drug Discovery']),

  createSampleUser('sample-user-aiden', 'Aiden Brooks', 'Harvard University', 'Molecular Biology', {
    fur: 'tan',
    eyes: 'focused',
    glasses: 'none',
    clothing: 'hoodie',
    accessory: 'headphones',
    background: 'library',
  }, ['Genetics', 'Organic Chemistry', 'Physiology'], ['CRISPR Protocols', 'Data Analysis'], ['Immuno-Oncology', 'Biotech Ventures']),

  createSampleUser('sample-user-chloe', 'Chloe Martin', 'McGill University', 'Chemical Engineering', {
    fur: 'grey',
    eyes: 'curious',
    glasses: 'none',
    clothing: 'casual',
    accessory: 'backpack',
    background: 'cream',
  }, ['Thermodynamics', 'Organic Synthesis', 'Kinetics'], ['Reaction Engineering', 'Matlab'], ['Sustainable Polymers', 'Clean Energy']),

  createSampleUser('sample-user-marcus', 'Marcus Rivera', 'RISD', 'Interaction Design', {
    fur: 'dark',
    eyes: 'cool',
    glasses: 'round',
    clothing: 'hoodie',
    accessory: 'none',
    background: 'sky',
  }, ['UI/UX Design', 'Design Systems', 'Figma Prototyping'], ['Design Systems', 'User Research'], ['Spatial Computing UI', 'Motion Graphics']),

  createSampleUser('sample-user-liam', 'Liam Walker', 'UW', 'Informatics & Design', {
    fur: 'brown',
    eyes: 'happy',
    glasses: 'none',
    clothing: 'sweater',
    accessory: 'headphones',
    background: 'forest',
  }, ['Information Architecture', 'Web Standards', 'Accessibility'], ['Design Tokens', 'Tailwind'], ['Micro-Interactions', 'Design Ethics']),

  createSampleUser('sample-user-hana', 'Hana Tanaka', 'Tokyo Tech', 'Frontend Engineering', {
    fur: 'cream',
    eyes: 'focused',
    glasses: 'square',
    clothing: 'casual',
    accessory: 'none',
    background: 'sunset',
  }, ['React', 'CSS Architecture', 'TypeScript'], ['Frontend Architecture', 'Canvas & WebGL'], ['Neumorphism', 'Creative Coding']),

  createSampleUser('sample-user-noah', 'Noah Sterling', 'CMU', 'Artificial Intelligence', {
    fur: 'tan',
    eyes: 'focused',
    glasses: 'none',
    clothing: 'hoodie',
    accessory: 'backpack',
    background: 'library',
  }, ['Machine Learning', 'Deep Learning', 'PyTorch'], ['Transformer Architectures', 'LLM Fine-tuning'], ['Multimodal Models', 'Neural Radiance Fields']),

  createSampleUser('sample-user-fatima', 'Fatima Al-Zahra', 'Oxford University', 'Computational Neuroscience', {
    fur: 'brown',
    eyes: 'cool',
    glasses: 'round',
    clothing: 'sweater',
    accessory: 'none',
    background: 'cream',
  }, ['Neural Computation', 'Statistics', 'Python'], ['Scientific Computing', 'Data Analysis'], ['Spiking Neural Nets', 'Bio-inspired AI']),
]

/**
 * Creates diverse sample squads with realistic objectives and populated member slots.
 */
function getSampleCommunitySquads(userProfile?: UserProfile | null): Squad[] {
  const maya = SAMPLE_SQUAD_USERS[0]
  const lucas = SAMPLE_SQUAD_USERS[1]
  const elena = SAMPLE_SQUAD_USERS[2]
  const jin = SAMPLE_SQUAD_USERS[3]
  const sophia = SAMPLE_SQUAD_USERS[4]
  const aiden = SAMPLE_SQUAD_USERS[5]
  const chloe = SAMPLE_SQUAD_USERS[6]
  const marcus = SAMPLE_SQUAD_USERS[7]
  const liam = SAMPLE_SQUAD_USERS[8]
  const hana = SAMPLE_SQUAD_USERS[9]
  const noah = SAMPLE_SQUAD_USERS[10]
  const fatima = SAMPLE_SQUAD_USERS[11]

  const squads: Squad[] = [
    {
      id: 'sample-squad-algo',
      creator_id: maya.id,
      name: 'Algorithm Sprints',
      description: 'Collaborative algorithmic problem solving and optimization',
      focus: 'Data Structures & Algorithms',
      objective: 'Solve 2 LeetCode Medium tree/graph problems',
      objectives: [
        'Solve 2 LeetCode Medium tree/graph problems',
        'Analyze Big-O time and space trade-offs',
        'Discuss optimal recursion vs iterative approaches',
      ],
      duration: 30,
      max_members: 5,
      min_members: 3,
      privacy: 'public',
      status: 'gathering',
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      tags: ['Algorithms', 'LeetCode', '30-min Focus'],
      creator: maya,
      match: calculateSquadMatch(userProfile || null, 'Data Structures & Algorithms', 'Solve 2 LeetCode Medium tree/graph problems', ['Algorithms', 'LeetCode'], 30),
      members: [
        { id: 'm-maya', squad_id: 'sample-squad-algo', user_id: maya.id, role: 'leader', ready: true, slot_index: 0, joined_at: new Date().toISOString(), profile: maya },
        { id: 'm-lucas', squad_id: 'sample-squad-algo', user_id: lucas.id, role: 'member', ready: true, slot_index: 1, joined_at: new Date().toISOString(), profile: lucas },
        { id: 'm-elena', squad_id: 'sample-squad-algo', user_id: elena.id, role: 'member', ready: true, slot_index: 2, joined_at: new Date().toISOString(), profile: elena },
        { id: 'm-jin', squad_id: 'sample-squad-algo', user_id: jin.id, role: 'member', ready: false, slot_index: 3, joined_at: new Date().toISOString(), profile: jin },
      ],
    },
    {
      id: 'sample-squad-orgo',
      creator_id: sophia.id,
      name: 'Organic Chemistry Review',
      description: 'Mechanisms, retrosynthesis, and spectroscopic problem sets',
      focus: 'Organic Chemistry',
      objective: 'Map out electrophilic aromatic substitution mechanisms',
      objectives: [
        'Map out electrophilic aromatic substitution mechanisms',
        'Practice retro-synthetic analysis for multi-step reactions',
        'Review NMR and IR spectroscopy identification charts',
      ],
      duration: 60,
      max_members: 5,
      min_members: 3,
      privacy: 'public',
      status: 'gathering',
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      tags: ['Chemistry', 'Mechanisms', '1-hr Deep Study'],
      creator: sophia,
      match: calculateSquadMatch(userProfile || null, 'Organic Chemistry', 'Map out electrophilic aromatic substitution mechanisms', ['Chemistry', 'Pre-Med'], 60),
      members: [
        { id: 'm-sophia', squad_id: 'sample-squad-orgo', user_id: sophia.id, role: 'leader', ready: true, slot_index: 0, joined_at: new Date().toISOString(), profile: sophia },
        { id: 'm-aiden', squad_id: 'sample-squad-orgo', user_id: aiden.id, role: 'member', ready: true, slot_index: 1, joined_at: new Date().toISOString(), profile: aiden },
        { id: 'm-chloe', squad_id: 'sample-squad-orgo', user_id: chloe.id, role: 'member', ready: false, slot_index: 2, joined_at: new Date().toISOString(), profile: chloe },
      ],
    },
    {
      id: 'sample-squad-design',
      creator_id: marcus.id,
      name: 'UI/UX Design Systems',
      description: 'Building accessible design tokens and component libraries',
      focus: 'Product & Interaction Design',
      objective: 'Audit Figma component variants & token naming',
      objectives: [
        'Audit Figma component variants & token naming',
        'Review WCAG AA color contrast accessibility standards',
        'Test micro-interaction motion timing on mobile',
      ],
      duration: 15,
      max_members: 5,
      min_members: 3,
      privacy: 'public',
      status: 'gathering',
      created_at: new Date(Date.now() - 8 * 60000).toISOString(),
      tags: ['UI/UX', 'Design', '15-min Sprint'],
      creator: marcus,
      match: calculateSquadMatch(userProfile || null, 'Product & Interaction Design', 'Audit Figma component variants & token naming', ['Design', 'Figma'], 15),
      members: [
        { id: 'm-marcus', squad_id: 'sample-squad-design', user_id: marcus.id, role: 'leader', ready: true, slot_index: 0, joined_at: new Date().toISOString(), profile: marcus },
        { id: 'm-liam', squad_id: 'sample-squad-design', user_id: liam.id, role: 'member', ready: true, slot_index: 1, joined_at: new Date().toISOString(), profile: liam },
        { id: 'm-hana', squad_id: 'sample-squad-design', user_id: hana.id, role: 'member', ready: false, slot_index: 2, joined_at: new Date().toISOString(), profile: hana },
      ],
    },
    {
      id: 'sample-squad-ai',
      creator_id: noah.id,
      name: 'Neural Networks & Deep Learning',
      description: 'Paper reading and PyTorch model architecture debugging',
      focus: 'Artificial Intelligence',
      objective: 'Derive backpropagation gradient mathematics',
      objectives: [
        'Derive backpropagation gradient mathematics',
        'Compare Transformer attention heads vs CNN architectures',
        'Debug PyTorch training loss divergence issues',
      ],
      duration: 60,
      max_members: 5,
      min_members: 3,
      privacy: 'public',
      status: 'gathering',
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      tags: ['AI', 'DeepLearning', '1-hr Deep Study'],
      creator: noah,
      match: calculateSquadMatch(userProfile || null, 'Artificial Intelligence', 'Derive backpropagation gradient mathematics', ['AI', 'PyTorch'], 60),
      members: [
        { id: 'm-noah', squad_id: 'sample-squad-ai', user_id: noah.id, role: 'leader', ready: true, slot_index: 0, joined_at: new Date().toISOString(), profile: noah },
        { id: 'm-fatima', squad_id: 'sample-squad-ai', user_id: fatima.id, role: 'member', ready: true, slot_index: 1, joined_at: new Date().toISOString(), profile: fatima },
        { id: 'm-lucas-ai', squad_id: 'sample-squad-ai', user_id: lucas.id, role: 'member', ready: true, slot_index: 2, joined_at: new Date().toISOString(), profile: lucas },
        { id: 'm-maya-ai', squad_id: 'sample-squad-ai', user_id: maya.id, role: 'member', ready: false, slot_index: 3, joined_at: new Date().toISOString(), profile: maya },
      ],
    },
    {
      id: 'sample-squad-web',
      creator_id: lucas.id,
      name: 'Fullstack Web Engineering',
      description: 'REST API architecture, caching, and database schemas',
      focus: 'Web Architecture & APIs',
      objective: 'Design and document RESTful endpoints',
      objectives: [
        'Design and document RESTful endpoints',
        'Implement JWT session authorization middleware',
        'Write test cases for edge-case error statuses',
      ],
      duration: 30,
      max_members: 5,
      min_members: 3,
      privacy: 'public',
      status: 'gathering',
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      tags: ['WebDev', 'Backend', '30-min Focus'],
      creator: lucas,
      match: calculateSquadMatch(userProfile || null, 'Web Architecture & APIs', 'Design and document RESTful endpoints', ['WebDev', 'Backend'], 30),
      members: [
        { id: 'm-lucas-web', squad_id: 'sample-squad-web', user_id: lucas.id, role: 'leader', ready: true, slot_index: 0, joined_at: new Date().toISOString(), profile: lucas },
        { id: 'm-hana-web', squad_id: 'sample-squad-web', user_id: hana.id, role: 'member', ready: true, slot_index: 1, joined_at: new Date().toISOString(), profile: hana },
        { id: 'm-jin-web', squad_id: 'sample-squad-web', user_id: jin.id, role: 'member', ready: false, slot_index: 2, joined_at: new Date().toISOString(), profile: jin },
      ],
    },
  ]

  return squads
}

/**
 * Fetch all public squads available for discovery.
 * Combines active squads from Supabase with realistic, varied sample squads.
 */
export async function fetchPublicSquads(
  currentUserId?: string,
  userProfile?: UserProfile | null
): Promise<Squad[]> {
  try {
    const sampleSquads = getSampleCommunitySquads(userProfile)

    // 1. Query active / waiting squad sessions from Supabase sessions table
    const { data: dbSessions, error } = await supabase
      .from('sessions')
      .select('*, host:profiles!host_id(*), session_participants(*, user:profiles!user_id(*))')
      .eq('type', 'squad')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })

    if (error || !dbSessions || dbSessions.length === 0) {
      return sampleSquads
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

    const realSquads: Squad[] = []

    dbSessions.forEach((s: any) => {
      const creator = normalizeProfile(s.host)
      let participants: SquadMember[] = (s.session_participants || []).map((p: any, idx: number) => ({
        id: p.id,
        squad_id: s.id,
        user_id: p.user_id,
        role: p.user_id === s.host_id ? ('leader' as const) : ('member' as const),
        ready: p.status === 'joined',
        slot_index: p.slot_index ?? idx,
        joined_at: p.joined_at || s.created_at,
        profile: normalizeProfile(p.user) || creator,
      }))

      // Guarantee the host is in slot 0 if participants table was empty
      if (participants.length === 0 && creator) {
        participants = [
          {
            id: `member-${creator.id}`,
            squad_id: s.id,
            user_id: creator.id,
            role: 'leader',
            ready: true,
            slot_index: 0,
            joined_at: s.created_at,
            profile: creator,
          },
        ]
      }

      const focus = s.subject || 'Collaborative Study'
      const duration = s.duration_minutes || 30
      const squadObjectives = objectivesBySession[s.id] || []
      const primaryObjective = squadObjectives[0] || 'Learn and review concepts together'
      const match = calculateSquadMatch(userProfile || null, focus, primaryObjective, [focus], duration)

      realSquads.push({
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

    // Deduplicate repetitive tests and combine real squads with sample squads
    // Keep user's own created squad or distinct real squads at top
    const userRealSquads = realSquads.filter((s) => s.creator_id === currentUserId)
    const otherRealSquads = realSquads.filter((s) => s.creator_id !== currentUserId)

    // Deduplicate other real squads by name to avoid 10 identical "Tech explorers"
    const seenNames = new Set<string>()
    const dedupedOtherReal = otherRealSquads.filter((s) => {
      const lower = s.name.trim().toLowerCase()
      if (seenNames.has(lower) || lower === 'gfgfgfg') return false
      seenNames.add(lower)
      return true
    })

    const combined = [...userRealSquads, ...sampleSquads, ...dedupedOtherReal]

    return combined
  } catch (err) {
    console.warn('[squadService] fetchPublicSquads error:', err)
    return getSampleCommunitySquads(userProfile)
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
    if (squad.id.startsWith('sample-')) {
      // Sample squad preview simulation: return immediate success
      return { error: null }
    }

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
