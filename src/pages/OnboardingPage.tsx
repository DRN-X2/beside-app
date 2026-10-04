import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  GraduationCap,
  Clock,
  BookOpen,
  Wrench,
  Smile,
  ShieldCheck,
  Award,
  Zap,
  Volume2,
  Users,
  Search,
  Plus,
  X,
} from 'lucide-react'
import OtterAvatar from '../components/OtterAvatar'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import type {
  EducationStatus,
  StudyStyle,
  SessionDuration,
  AccountabilityPref,
  OtterFur,
  OtterClothing,
  OtterAccessory,
  OtterConfig,
} from '../types'

const TOTAL_STEPS = 5

const EDUCATION_OPTIONS: { id: EducationStatus; label: string; desc: string }[] = [
  { id: 'College', label: 'College / University', desc: 'Undergraduate or degree student' },
  { id: 'Senior High', label: 'Senior High School', desc: 'Grade 11 - 12 preparing for college' },
  { id: 'High School', label: 'Junior High School', desc: 'Grade 7 - 10 foundational learning' },
  { id: 'Graduated', label: 'Graduated / Working', desc: 'Lifelong learner or certification prep' },
]

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']

const COMMON_SCHOOLS = [
  'MSU-IIT',
  'UP Diliman',
  'De La Salle University',
  'University of Santo Tomas',
  'Ateneo de Manila',
  'Mapúa University',
  'Polytechnic University of the Philippines',
  'Far Eastern University',
]

const STUDY_STYLES: { id: StudyStyle; label: string; desc: string; icon: any }[] = [
  {
    id: 'quiet',
    label: 'Quiet Focus',
    desc: 'Silent camera-on or pomodoro sprints with no voice chatting',
    icon: Volume2,
  },
  {
    id: 'discussion',
    label: 'Discussion',
    desc: 'Active speaking, explaining questions, and problem-solving together',
    icon: Users,
  },
  {
    id: 'mixed',
    label: 'Mixed Focus',
    desc: 'Quiet 25-minute sprints followed by 5-minute debriefs',
    icon: Zap,
  },
  {
    id: 'flexible',
    label: 'Flexible',
    desc: 'Adapts to whatever the session or partner needs today',
    icon: Smile,
  },
]

const DURATIONS: { id: SessionDuration; label: string; tag: string }[] = [
  { id: 15, label: '15 Mins', tag: 'Quick Sprint' },
  { id: 30, label: '30 Mins', tag: 'Standard Block' },
  { id: 60, label: '60 Mins', tag: 'Power Hour' },
]

const ACCOUNTABILITY_OPTIONS: { id: AccountabilityPref; label: string; desc: string }[] = [
  { id: 'gentle', label: 'Gentle Support', desc: 'Positive affirmations and friendly check-ins' },
  { id: 'strict', label: 'Strict Accountability', desc: 'Ensure goals are declared and strictly completed' },
  { id: 'flexible', label: 'Casual & Relaxed', desc: 'Zero pressure, just study alongside each other' },
]

interface TopicCategory {
  name: string
  topics: string[]
}

const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    name: 'Tech & CS',
    topics: [
      'Web Development',
      'Mobile App Development',
      'Machine Learning & AI',
      'Data Structures & Algorithms',
      'Database Systems',
      'Cloud Computing',
      'Cybersecurity',
      'DevOps & Systems',
      'Game Development',
      'UI/UX Design',
      'Data Science & Analytics',
      'Computer Networks',
    ],
  },
  {
    name: 'Sciences & Math',
    topics: [
      'Mathematics & Calculus',
      'Linear Algebra & Discrete Math',
      'Statistics & Probability',
      'Physics & Mechanics',
      'Organic Chemistry',
      'General Chemistry',
      'Biology & Genetics',
      'Neuroscience',
      'Astronomy & Space Science',
      'Environmental Science',
    ],
  },
  {
    name: 'Healthcare & Medicine',
    topics: [
      'Anatomy & Physiology',
      'Pharmacology & Drugs',
      'Nursing Care & Clinicals',
      'Biochemistry',
      'Pathology & Diseases',
      'Public Health & Epidemiology',
      'Medical Terminology',
      'Microbiology & Immunology',
    ],
  },
  {
    name: 'Business & Finance',
    topics: [
      'Accounting & Auditing',
      'Economics (Micro & Macro)',
      'Financial Management',
      'Marketing & Digital Strategy',
      'Business Law & Taxation',
      'Project Management',
      'Entrepreneurship',
      'Supply Chain & Operations',
    ],
  },
  {
    name: 'Engineering & Arch',
    topics: [
      'Civil & Structural Eng.',
      'Mechanical & Dynamics',
      'Electrical & Electronics',
      'Architecture & Spatial Design',
      'CAD & 3D Modeling',
      'Materials Engineering',
      'Robotics & Automation',
    ],
  },
  {
    name: 'Law & Humanities',
    topics: [
      'Constitutional & Civil Law',
      'Criminal Law & Evidence',
      'Psychology & Behavior',
      'Philosophy & Ethics',
      'History & Civilization',
      'Political Science',
      'Sociology & Anthropology',
      'Literature & Creative Writing',
    ],
  },
  {
    name: 'Languages & Arts',
    topics: [
      'English Academic Writing',
      'Japanese Language & JLPT',
      'Spanish Language',
      'Mandarin Chinese (HSK)',
      'French Language',
      'Graphic Design & Art',
      'Music Theory & Production',
      'Communications & Media',
    ],
  },
]

const ALL_PRESET_INTERESTS: string[] = Array.from(
  new Set(TOPIC_CATEGORIES.flatMap((c) => c.topics))
)

interface SkillCategory {
  name: string
  skills: string[]
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    name: 'Writing & Languages',
    skills: [
      'Essay Proofreading & Editing',
      'Grammar & Sentence Flow',
      'Academic Citations (APA / MLA)',
      'Language Conversation & Speaking',
      'Creative Writing & Storytelling',
      'Speech Writing & Debate',
      'Literature & Text Analysis',
      'Technical Report Writing',
    ],
  },
  {
    name: 'Math, Science & Logic',
    skills: [
      'Calculus & Math Tutoring',
      'Algebra & Equation Solving',
      'Statistics & Data Interpretation',
      'Physics Problem Solving',
      'Balancing Chemical Equations',
      'Mental Math & Fast Shortcuts',
      'Geometry & Trigonometry',
      'Logic & Truth Tables',
    ],
  },
  {
    name: 'Healthcare & Nursing',
    skills: [
      'Medical Terminology & Mnemonics',
      'Anatomy & Organ Systems',
      'Dosage & Unit Calculations',
      'Pharmacology Drug Classes',
      'Nursing Care Plans & Charting',
      'Biology Lab Protocols',
      'First Aid & Patient Care',
    ],
  },
  {
    name: 'Business & Finance',
    skills: [
      'Accounting & Ledger Balancing',
      'Financial Modeling & Excel Formulas',
      'Business Case Study Analysis',
      'Marketing & Campaign Strategy',
      'Pitch Decks & Presentation Slides',
      'Economics Graphs & Formulas',
      'Project Timelines & Planning',
    ],
  },
  {
    name: 'Law, Policy & Debate',
    skills: [
      'Legal Briefing (IRAC Method)',
      'Case Law & Statute Research',
      'Logical Argumentation & Debating',
      'Document Synthesis & Summaries',
      'Policy Analysis & Ethics',
      'Public Speaking Confidence',
    ],
  },
  {
    name: 'Design & Media',
    skills: [
      'Figma & UI Wireframing',
      'Canva & Social Graphics',
      'Photoshop & Photo Retouching',
      'Video Editing & Reels',
      'Slide Presentation Aesthetic',
      '3D Modeling & CAD Drafting',
      'Digital Illustration & Sketching',
    ],
  },
  {
    name: 'Coding & Tech',
    skills: [
      'Python Scripting & Automation',
      'JavaScript & Web Development',
      'React & Frontend Frameworks',
      'SQL & Database Queries',
      'Git & GitHub Collaboration',
      'Java & Object-Oriented Code',
      'C / C++ & Algorithm Practice',
      'Code Debugging & Review',
      'Linux Terminal & Bash Commands',
    ],
  },
  {
    name: 'Productivity & Study Habits',
    skills: [
      'Pomodoro & Focus Accountability',
      'Notion & Study Note Systems',
      'Flashcards & Anki Systems',
      'Mind Mapping & Visual Notes',
      'Time Management & Daily Scheduling',
      'Exam Cram & Revision Strategy',
      'Active Recall & Feynman Technique',
    ],
  },
]

const ALL_PRESET_SKILLS: string[] = Array.from(
  new Set(SKILL_CATEGORIES.flatMap((c) => c.skills))
)

const FUR_OPTIONS: OtterFur[] = ['brown', 'tan', 'dark', 'cream', 'grey']
const CLOTHING_OPTIONS: OtterClothing[] = ['hoodie', 'sweater', 'casual', 'uniform', 'formal']
const ACCESSORY_OPTIONS: OtterAccessory[] = ['headphones', 'coffee', 'book', 'pencil', 'backpack']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { profile, setProfile, isDemo } = useAuthStore()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Academic Background
  const [educationStatus, setEducationStatus] = useState<EducationStatus>(
    profile?.education_status || 'College'
  )
  const [school, setSchool] = useState(profile?.school === 'University' ? '' : (profile?.school || ''))
  const [degreeProgram, setDegreeProgram] = useState(
    profile?.degree_program === 'Student' ? '' : (profile?.degree_program || '')
  )
  const [yearLevel, setYearLevel] = useState(profile?.year_level || '1st Year')

  // Step 2: Study Habits
  const [studyStyle, setStudyStyle] = useState<StudyStyle>(profile?.study_style || 'mixed')
  const [duration, setDuration] = useState<SessionDuration>(
    profile?.preferred_duration || 30
  )
  const [accountability, setAccountability] = useState<AccountabilityPref>(
    profile?.accountability_pref || 'gentle'
  )

  // Step 3: Interests & Search state
  const [interestSearch, setInterestSearch] = useState('')
  const [activeTopicCat, setActiveTopicCat] = useState('All')
  const [customInterests, setCustomInterests] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>(
    profile?.learning_interests && profile.learning_interests.length > 0
      ? profile.learning_interests
      : []
  )

  // Step 4: Skills & Search state
  const [skillSearch, setSkillSearch] = useState('')
  const [activeSkillCat, setActiveSkillCat] = useState('All')
  const [customSkills, setCustomSkills] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>(
    profile?.skills && profile.skills.length > 0
      ? profile.skills
      : []
  )

  // Step 5: Mascot Starter Vibe
  const [otter, setOtter] = useState<OtterConfig>(
    profile?.otter || {
      fur: 'brown',
      eyes: 'happy',
      glasses: 'none',
      clothing: 'hoodie',
      accessory: 'headphones',
      background: 'cream',
    }
  )

  // Duolingo Mascot Speech Generator
  const getMascotSpeech = () => {
    const name = profile?.display_name || 'Study Buddy'
    switch (step) {
      case 1:
        return `Hey ${name}! Welcome to Beside. Let's start with where you study so we can match you with fellow campus peers.`
      case 2:
        return `Awesome! How do you work best? Let me know your study vibe so your partners match your focus pace.`
      case 3:
        return `Pick 3 to 5 topics you're diving into. I'll find study buddies working through the exact same subjects!`
      case 4:
        return `What are your secret superpowers? Pick up to 3 skills you can help a study buddy with — from writing, math, and healthcare to design, tech, and study habits!`
      case 5:
        return `Give me a signature look! Choose your fur, outfit, and study companion item.`
      default:
        return `You're all set! Let's explore your matched study buddies.`
    }
  }

  const toggleInterest = (item: string) => {
    if (interests.includes(item)) {
      setInterests(interests.filter((i) => i !== item))
    } else {
      if (interests.length < 5) {
        setInterests([...interests, item])
      }
    }
  }

  const addCustomInterest = (customTopic: string) => {
    const trimmed = customTopic.trim()
    if (!trimmed) return
    if (!customInterests.includes(trimmed)) {
      setCustomInterests((prev) => [trimmed, ...prev])
    }
    if (!interests.includes(trimmed)) {
      if (interests.length < 5) {
        setInterests((prev) => [...prev, trimmed])
      }
    }
    setInterestSearch('')
  }

  const toggleSkill = (item: string) => {
    if (skills.includes(item)) {
      setSkills(skills.filter((s) => s !== item))
    } else {
      if (skills.length < 3) {
        setSkills([...skills, item])
      }
    }
  }

  const addCustomSkill = (customSkillName: string) => {
    const trimmed = customSkillName.trim()
    if (!trimmed) return
    if (!customSkills.includes(trimmed)) {
      setCustomSkills((prev) => [trimmed, ...prev])
    }
    if (!skills.includes(trimmed)) {
      if (skills.length < 3) {
        setSkills((prev) => [...prev, trimmed])
      }
    }
    setSkillSearch('')
  }

  const filteredTopics = useMemo(() => {
    let list: string[] = []
    if (activeTopicCat === 'All') {
      list = [...customInterests, ...ALL_PRESET_INTERESTS]
    } else {
      const cat = TOPIC_CATEGORIES.find((c) => c.name === activeTopicCat)
      list = cat ? cat.topics : []
    }
    if (!interestSearch.trim()) return list
    const q = interestSearch.toLowerCase().trim()
    return list.filter((t) => t.toLowerCase().includes(q))
  }, [activeTopicCat, interestSearch, customInterests])

  const filteredSkills = useMemo(() => {
    let list: string[] = []
    if (activeSkillCat === 'All') {
      list = [...customSkills, ...ALL_PRESET_SKILLS]
    } else {
      const cat = SKILL_CATEGORIES.find((c) => c.name === activeSkillCat)
      list = cat ? cat.skills : []
    }
    if (!skillSearch.trim()) return list
    const q = skillSearch.toLowerCase().trim()
    return list.filter((s) => s.toLowerCase().includes(q))
  }, [activeSkillCat, skillSearch, customSkills])

  const canProceed = () => {
    switch (step) {
      case 1:
        return school.trim().length > 0 && degreeProgram.trim().length > 0
      case 2:
        return true
      case 3:
        return interests.length >= 3
      case 4:
        return skills.length >= 2
      case 5:
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/')
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)

    // Compute derived degree code (e.g. BSIT for BS Information Technology)
    const words = degreeProgram.trim().split(/\s+/)
    const degreeCode = words.length > 1
      ? words.map((w) => w[0]?.toUpperCase()).join('').slice(0, 5)
      : degreeProgram.slice(0, 4).toUpperCase()

    const fullOtterConfig = {
      ...otter,
      onboarding_completed: true,
      school: school.trim(),
      degree_program: degreeProgram.trim(),
      degree_code: degreeCode,
      year_level: yearLevel,
      education_status: educationStatus,
      study_style: studyStyle,
      preferred_duration: duration,
      accountability_pref: accountability,
      learning_interests: interests,
    }

    const updatedProfile = {
      ...(profile || {}),
      education_status: educationStatus,
      school: school.trim(),
      degree_program: degreeProgram.trim(),
      degree_code: degreeCode,
      year_level: yearLevel,
      study_style: studyStyle,
      preferred_duration: duration,
      accountability_pref: accountability,
      learning_interests: interests,
      subjects: interests,
      skills: skills,
      otter: otter,
      otter_config: fullOtterConfig,
      onboarding_completed: true,
      xp: (profile?.xp || 0) + 100, // +100 XP Onboarding bonus!
    }

    setProfile(updatedProfile)
    useAuthStore.setState({ isNewSignUp: false })

    // Persist directly to Supabase using only the columns that actually exist in the schema
    if (!isDemo && profile?.id && !profile.id.startsWith('demo-')) {
      await (supabase.from('profiles') as any).update({
        interests: interests,
        skills: skills,
        category: educationStatus,
        course_grade: `${yearLevel} - ${degreeProgram}${school ? ` (${school})` : ''}`,
        otter_config: fullOtterConfig,
        xp: updatedProfile.xp,
      }).eq('id', profile.id)
    }

    setIsSubmitting(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-[100dvh] bg-[#F1F1F1] flex flex-col justify-between text-[#4C271A] max-w-md mx-auto relative select-none">
      {/* Top Header & Duolingo-Style Progress Bar */}
      <header className="sticky top-0 z-30 bg-[#F1F1F1]/95 backdrop-blur-md px-4 pt-4 pb-2 border-b border-black/5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl neu-btn-circle-light flex items-center justify-center text-[#4C271A] flex-shrink-0 active:scale-95 transition-transform"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Animated Duolingo Progress Track */}
          <div className="flex-1 h-3.5 bg-[#E5DFD9] rounded-full p-0.5 shadow-[inset_1px_1px_3px_rgba(76,39,26,0.15)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7E4228] to-[#4C271A] rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* XP Reward Indicator */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E5DFD9] border border-[#7E4228]/20 shadow-inner flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#7E4228] animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-[11px] font-black text-[#7E4228]">+100 XP</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2 px-1 text-[11px] font-bold text-[#7E4228]/80">
          <span>Step {step} of {TOTAL_STEPS}</span>
          <span className="uppercase tracking-wider">Profile Matcher Setup</span>
        </div>
      </header>

      {/* Main Interactive Body */}
      <main className="flex-1 p-4 pb-28 flex flex-col">
        {/* Duolingo Mascot + Animated Speech Bubble */}
        <div className="flex items-start gap-3 mb-5 mt-2 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-[#7E4228] p-1 flex items-center justify-center shadow-[4px_4px_10px_rgba(76,39,26,0.12),-3px_-3px_8px_rgba(255,255,255,0.9)] flex-shrink-0">
            <OtterAvatar config={otter} size="sm" animate />
          </div>

          {/* Speech Bubble */}
          <div className="relative flex-1 bg-white rounded-2xl p-3.5 shadow-[3px_3px_10px_rgba(76,39,26,0.06),-2px_-2px_8px_rgba(255,255,255,0.9)] border border-black/5">
            {/* Bubble arrow */}
            <div className="absolute top-4 -left-2 w-0 h-0 border-t-[7px] border-t-transparent border-r-[8px] border-r-white border-b-[7px] border-b-transparent" />
            <p className="text-xs sm:text-sm font-bold text-[#4C271A] leading-relaxed">
              {getMascotSpeech()}
            </p>
          </div>
        </div>

        {/* STEP 1: Academic Background */}
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <div>
              <h2 className="text-lg font-black text-[#4C271A] tracking-tight">
                What's your academic stage?
              </h2>
              <p className="text-xs text-[#7E4228] font-semibold mt-0.5">
                Helps us pair you with peers in similar difficulty levels
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {EDUCATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setEducationStatus(opt.id)}
                  className={`p-3.5 rounded-2xl text-left transition-all duration-150 active:scale-98 flex items-center justify-between ${
                    educationStatus === opt.id
                      ? 'bg-[#E5DFD9] border-2 border-[#7E4228] shadow-[inset_2px_2px_5px_rgba(76,39,26,0.12)]'
                      : 'bg-[#F1F1F1] border border-white/80 shadow-[3px_3px_8px_rgba(76,39,26,0.06),-3px_-3px_8px_rgba(255,255,255,0.9)] hover:border-[#7E4228]/30'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#4C271A]">{opt.label}</h4>
                    <p className="text-[11px] text-[#7E4228]/80 font-medium">{opt.desc}</p>
                  </div>
                  {educationStatus === opt.id && (
                    <div className="w-5 h-5 rounded-full bg-[#7E4228] text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* School / University Input */}
            <div className="pt-2">
              <label className="text-xs font-bold text-[#4C271A] block mb-1">
                School or University *
              </label>
              <input
                type="text"
                placeholder="e.g. MSU-IIT, DLSU, UP Diliman"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full bg-[#F1F1F1] rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-[#4C271A] placeholder-[#7E4228]/50 shadow-[inset_2px_2px_5px_rgba(76,39,26,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] border border-[#7E4228]/20 focus:outline-none focus:border-[#7E4228]"
              />

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_SCHOOLS.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSchool(s)}
                    className="px-2.5 py-1 rounded-xl bg-white/70 text-[10px] font-bold text-[#7E4228] border border-black/5 shadow-sm hover:bg-[#E5DFD9]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Course / Degree Program */}
            <div>
              <label className="text-xs font-bold text-[#4C271A] block mb-1">
                Degree Program or Strand *
              </label>
              <input
                type="text"
                placeholder="e.g. BS Information Technology, STEM, BSCS"
                value={degreeProgram}
                onChange={(e) => setDegreeProgram(e.target.value)}
                className="w-full bg-[#F1F1F1] rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-[#4C271A] placeholder-[#7E4228]/50 shadow-[inset_2px_2px_5px_rgba(76,39,26,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] border border-[#7E4228]/20 focus:outline-none focus:border-[#7E4228]"
              />
            </div>

            {/* Year Level Chips */}
            <div>
              <label className="text-xs font-bold text-[#4C271A] block mb-1.5">
                Year Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {YEAR_LEVELS.map((yl) => (
                  <button
                    key={yl}
                    type="button"
                    onClick={() => setYearLevel(yl)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition-all ${
                      yearLevel === yl
                        ? 'bg-[#7E4228] text-white shadow-md'
                        : 'bg-white text-[#7E4228] border border-black/5 shadow-sm'
                    }`}
                  >
                    {yl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Study Habits & Pace */}
        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <div>
              <h2 className="text-lg font-black text-[#4C271A] tracking-tight">
                How do you study best?
              </h2>
              <p className="text-xs text-[#7E4228] font-semibold mt-0.5">
                We'll match you with partners who share your session rhythm
              </p>
            </div>

            {/* Study Style Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {STUDY_STYLES.map((style) => {
                const IconComponent = style.icon
                const isSelected = studyStyle === style.id
                return (
                  <button
                    key={style.id}
                    onClick={() => setStudyStyle(style.id)}
                    className={`p-3.5 rounded-2xl text-left transition-all duration-150 flex flex-col justify-between h-32 ${
                      isSelected
                        ? 'bg-[#E5DFD9] border-2 border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(76,39,26,0.12)]'
                        : 'bg-[#F1F1F1] border border-white/80 shadow-[3px_3px_8px_rgba(76,39,26,0.06),-3px_-3px_8px_rgba(255,255,255,0.9)] hover:border-[#7E4228]/30'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#7E4228] text-white flex items-center justify-center">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#4C271A]">{style.label}</h4>
                      <p className="text-[10px] text-[#7E4228]/80 line-clamp-2 leading-tight mt-0.5">
                        {style.desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Duration Preference */}
            <div className="pt-2">
              <label className="text-xs font-bold text-[#4C271A] block mb-1.5">
                Preferred Study Session Length
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDuration(d.id)}
                    className={`p-2.5 rounded-2xl text-center transition-all ${
                      duration === d.id
                        ? 'bg-[#7E4228] text-white shadow-md'
                        : 'bg-white text-[#7E4228] border border-black/5 shadow-sm'
                    }`}
                  >
                    <span className="block font-black text-xs">{d.label}</span>
                    <span className="block text-[9px] opacity-80">{d.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accountability Preference */}
            <div className="pt-2">
              <label className="text-xs font-bold text-[#4C271A] block mb-1.5">
                Accountability Style
              </label>
              <div className="space-y-2">
                {ACCOUNTABILITY_OPTIONS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountability(acc.id)}
                    className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between ${
                      accountability === acc.id
                        ? 'bg-[#E5DFD9] border-2 border-[#7E4228] shadow-inner'
                        : 'bg-white border border-black/5 shadow-sm'
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-xs text-[#4C271A]">{acc.label}</span>
                      <span className="block text-[10px] text-[#7E4228]/80">{acc.desc}</span>
                    </div>
                    {accountability === acc.id && (
                      <Check className="w-4 h-4 text-[#7E4228] stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Learning Interests (Pick 3 to 5) */}
        {step === 3 && (
          <div className="space-y-3.5 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#4C271A] tracking-tight">
                  What are you learning?
                </h2>
                <p className="text-xs text-[#7E4228] font-semibold mt-0.5">
                  Search or pick 3 to 5 areas you're currently working on
                </p>
              </div>
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors ${
                  interests.length >= 3
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-[#E5DFD9] border border-[#7E4228]/20 text-[#7E4228]'
                }`}
              >
                {interests.length}/5 Selected
              </div>
            </div>

            {/* Helper status badge */}
            {interests.length < 3 ? (
              <p className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-3 py-2 rounded-xl border border-amber-300">
                Please pick at least {3 - interests.length} more topic{3 - interests.length === 1 ? '' : 's'} to continue.
              </p>
            ) : (
              <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Great selections! You can add up to {5 - interests.length} more or proceed.</span>
              </p>
            )}

            {/* Selected Topics Tray */}
            {interests.length > 0 && (
              <div className="bg-[#E5DFD9]/60 p-2.5 rounded-2xl border border-[#7E4228]/15 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#7E4228]">
                  <span>Your Selected Topics</span>
                  <span>{interests.length} of 5</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#7E4228] text-white text-xs font-bold shadow-xs animate-scale-in"
                    >
                      <span className="truncate max-w-[170px]">{topic}</span>
                      <button
                        type="button"
                        onClick={() => toggleInterest(topic)}
                        className="hover:bg-white/20 p-0.5 rounded-full transition-colors cursor-pointer"
                        title="Remove topic"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#7E4228]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={interestSearch}
                onChange={(e) => setInterestSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomInterest(interestSearch)
                  }
                }}
                placeholder="Search or type any topic (e.g. Nursing, Law, CAD)..."
                className="w-full bg-white rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold text-[#4C271A] placeholder-[#7E4228]/50 border border-[#7E4228]/20 shadow-[inset_1px_1px_3px_rgba(76,39,26,0.06)] focus:outline-none focus:border-[#7E4228]"
              />
              {interestSearch && (
                <button
                  type="button"
                  onClick={() => setInterestSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7E4228]/60 hover:text-[#4C271A] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Add Custom Topic Button */}
            {interestSearch.trim().length > 0 && (
              <button
                type="button"
                onClick={() => addCustomInterest(interestSearch)}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-[#E5DFD9] hover:bg-[#D8D0C7] text-[#4C271A] border border-[#7E4228]/30 flex items-center justify-between text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Plus className="w-4 h-4 text-[#7E4228] shrink-0" />
                  <span>
                    Add as custom topic:{' '}
                    <strong className="text-[#7E4228]">"{interestSearch.trim()}"</strong>
                  </span>
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider text-[#7E4228] bg-white/80 px-2 py-0.5 rounded-lg shrink-0">
                  Press Enter
                </span>
              </button>
            )}

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
              {['All', ...TOPIC_CATEGORIES.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveTopicCat(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                    activeTopicCat === cat
                      ? 'bg-[#7E4228] text-white shadow-sm'
                      : 'bg-white text-[#7E4228] border border-black/5 hover:border-[#7E4228]/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Cloud of Topics */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-[240px] overflow-y-auto pr-1">
              {filteredTopics.length === 0 ? (
                <div className="w-full text-center py-6 px-4 bg-white/60 rounded-2xl border border-dashed border-[#7E4228]/30">
                  <p className="text-xs text-[#7E4228] font-bold">
                    No preset topic found for "{interestSearch}"
                  </p>
                  <button
                    type="button"
                    onClick={() => addCustomInterest(interestSearch)}
                    className="mt-2 text-xs font-black text-[#7E4228] underline underline-offset-2 hover:opacity-80 cursor-pointer"
                  >
                    + Add "{interestSearch}" as your custom topic
                  </button>
                </div>
              ) : (
                filteredTopics.map((item) => {
                  const isSelected = interests.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#7E4228] text-white shadow-md border border-[#4C271A]/30 scale-102'
                          : 'bg-white text-[#7E4228] border border-black/5 shadow-sm hover:border-[#7E4228]/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{item}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Skills & What You Can Teach (Pick 2 or 3) */}
        {step === 4 && (
          <div className="space-y-3.5 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#4C271A] tracking-tight">
                  Your Strongest Skills
                </h2>
                <p className="text-xs text-[#7E4228] font-semibold mt-0.5">
                  Search or pick up to 3 skills you can help a study buddy with
                </p>
              </div>
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors ${
                  skills.length >= 2
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-[#E5DFD9] border border-[#7E4228]/20 text-[#7E4228]'
                }`}
              >
                {skills.length}/3 Selected
              </div>
            </div>

            {skills.length < 2 ? (
              <p className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-3 py-2 rounded-xl border border-amber-300">
                Pick at least 2 skills to make peer matchmaking effective!
              </p>
            ) : (
              <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Ready to go! You can select 1 more skill if you wish.</span>
              </p>
            )}

            {/* Selected Skills Tray */}
            {skills.length > 0 && (
              <div className="bg-[#E5DFD9]/60 p-2.5 rounded-2xl border border-[#7E4228]/15 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#7E4228]">
                  <span>Your Selected Skills</span>
                  <span>{skills.length} of 3</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#7E4228] text-white text-xs font-bold shadow-xs animate-scale-in"
                    >
                      <span className="truncate max-w-[170px]">{skill}</span>
                      <button
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className="hover:bg-white/20 p-0.5 rounded-full transition-colors cursor-pointer"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#7E4228]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomSkill(skillSearch)
                  }
                }}
                placeholder="Search or type any skill (e.g. Python, SPSS, CAD)..."
                className="w-full bg-white rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold text-[#4C271A] placeholder-[#7E4228]/50 border border-[#7E4228]/20 shadow-[inset_1px_1px_3px_rgba(76,39,26,0.06)] focus:outline-none focus:border-[#7E4228]"
              />
              {skillSearch && (
                <button
                  type="button"
                  onClick={() => setSkillSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7E4228]/60 hover:text-[#4C271A] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Add Custom Skill Button */}
            {skillSearch.trim().length > 0 && (
              <button
                type="button"
                onClick={() => addCustomSkill(skillSearch)}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-[#E5DFD9] hover:bg-[#D8D0C7] text-[#4C271A] border border-[#7E4228]/30 flex items-center justify-between text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Plus className="w-4 h-4 text-[#7E4228] shrink-0" />
                  <span>
                    Add as custom skill:{' '}
                    <strong className="text-[#7E4228]">"{skillSearch.trim()}"</strong>
                  </span>
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider text-[#7E4228] bg-white/80 px-2 py-0.5 rounded-lg shrink-0">
                  Press Enter
                </span>
              </button>
            )}

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
              {['All', ...SKILL_CATEGORIES.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveSkillCat(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                    activeSkillCat === cat
                      ? 'bg-[#7E4228] text-white shadow-sm'
                      : 'bg-white text-[#7E4228] border border-black/5 hover:border-[#7E4228]/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Cloud of Skills */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-[240px] overflow-y-auto pr-1">
              {filteredSkills.length === 0 ? (
                <div className="w-full text-center py-6 px-4 bg-white/60 rounded-2xl border border-dashed border-[#7E4228]/30">
                  <p className="text-xs text-[#7E4228] font-bold">
                    No preset skill found for "{skillSearch}"
                  </p>
                  <button
                    type="button"
                    onClick={() => addCustomSkill(skillSearch)}
                    className="mt-2 text-xs font-black text-[#7E4228] underline underline-offset-2 hover:opacity-80 cursor-pointer"
                  >
                    + Add "{skillSearch}" as your custom skill
                  </button>
                </div>
              ) : (
                filteredSkills.map((skill) => {
                  const isSelected = skills.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#7E4228] text-white shadow-md border border-[#4C271A]/30 scale-102'
                          : 'bg-white text-[#7E4228] border border-black/5 shadow-sm hover:border-[#7E4228]/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{skill}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Mascot Starter Customization */}
        {step === 5 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-center">
              <h2 className="text-xl font-black text-[#4C271A] tracking-tight">
                Customize Your Otter Mascot
              </h2>
              <p className="text-xs text-[#7E4228] font-semibold mt-0.5">
                Your visual companion during silent sprints and group squads
              </p>
            </div>

            {/* Mascot Center Showcase */}
            <div className="flex justify-center my-3">
              <div className="w-28 h-28 rounded-full bg-[#4C271A] p-2 border-4 border-white shadow-[6px_6px_16px_rgba(76,39,26,0.15)] flex items-center justify-center overflow-hidden">
                <OtterAvatar config={otter} size="xl" animate />
              </div>
            </div>

            {/* Fur Tone Selection */}
            <div>
              <span className="text-xs font-bold text-[#4C271A] block mb-1.5">
                Fur Color
              </span>
              <div className="flex gap-2 justify-center">
                {FUR_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOtter({ ...otter, fur: f })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      otter.fur === f
                        ? 'bg-[#7E4228] text-white shadow-md'
                        : 'bg-white text-[#7E4228] border border-black/5'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Clothing Selection */}
            <div>
              <span className="text-xs font-bold text-[#4C271A] block mb-1.5">
                Outfit
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {CLOTHING_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setOtter({ ...otter, clothing: c })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      otter.clothing === c
                        ? 'bg-[#7E4228] text-white shadow-md'
                        : 'bg-white text-[#7E4228] border border-black/5'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessory Selection */}
            <div>
              <span className="text-xs font-bold text-[#4C271A] block mb-1.5">
                Accessory
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {ACCESSORY_OPTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setOtter({ ...otter, accessory: a })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      otter.accessory === a
                        ? 'bg-[#7E4228] text-white shadow-md'
                        : 'bg-white text-[#7E4228] border border-black/5'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Next/Finish Button */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#F1F1F1]/95 backdrop-blur-md p-4 border-t border-black/5 z-40">
        <button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="w-full py-4 rounded-2xl bg-[#7E4228] hover:bg-[#6D3821] text-white font-display font-black text-sm tracking-wide shadow-[0_4px_14px_rgba(76,39,26,0.25)] flex items-center justify-center gap-2 transition-all duration-150 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <span>Saving Your Profile...</span>
          ) : step === TOTAL_STEPS ? (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Unlock Study Buddies (+100 XP)</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </footer>
    </div>
  )
}
