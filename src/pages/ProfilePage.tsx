import React, { useState, useMemo, useEffect } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Edit3,
  Users,
  LogOut,
  MapPin,
  Flame,
  Check,
  X,
  HelpCircle,
  Sparkles,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Video,
  UserPlus,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import OtterAvatar from '../components/OtterAvatar'
import { CountryFlag } from '../shared/components/CountryFlag'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { useAuthStore } from '../store/authStore'
import { useConnectionStore, hasCompletedSessionWith } from '../store/connectionStore'
import { supabase } from '../lib/supabase'
import { normalizeProfile } from '../utils/profileNormalizer'
import { fetchUserDashboardStats, type UserDashboardStats } from '../services/xpService'
import type {
  OtterFur,
  OtterEyes,
  OtterGlasses,
  OtterClothing,
  OtterAccessory,
  OtterBackground,
  EducationStatus,
  StudyStyle,
} from '../types'

const FUR_OPTIONS: OtterFur[] = ['brown', 'tan', 'dark', 'cream', 'grey']
const EYE_OPTIONS: OtterEyes[] = ['happy', 'curious', 'sleepy', 'focused', 'cool']
const GLASSES_OPTIONS: OtterGlasses[] = ['none', 'round', 'square', 'aviator', 'star']
const CLOTHING_OPTIONS: OtterClothing[] = ['none', 'hoodie', 'uniform', 'casual', 'formal', 'sweater']
const ACCESSORY_OPTIONS: OtterAccessory[] = ['none', 'headphones', 'pencil', 'book', 'coffee', 'backpack']
const BG_OPTIONS: OtterBackground[] = ['cream', 'sky', 'forest', 'library', 'night', 'sunset']

const CATEGORY_OPTIONS: EducationStatus[] = [
  'College',
  'Senior High',
  'High School',
  'Graduated',
]

const STUDY_STYLE_OPTIONS: { id: StudyStyle; label: string }[] = [
  { id: 'quiet', label: 'Quiet Focus' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'mixed', label: 'Mixed Focus' },
  { id: 'flexible', label: 'Flexible' },
]

const POPULAR_INTERESTS = [
  'Web Development',
  'Machine Learning',
  'Data Science',
  'UI/UX Design',
  'Database Systems',
  'Cloud Computing',
  'Algorithms',
  'Mobile Development',
  'Cybersecurity',
  'Artificial Intelligence',
  'Operating Systems',
  'Linear Algebra',
  'Software Architecture',
  'Game Development',
]

const POPULAR_SKILLS = [
  'JavaScript',
  'Python',
  'React',
  'TypeScript',
  'SQL',
  'C++',
  'Java',
  'Node.js',
  'HTML/CSS',
  'Figma',
  'Git',
  'Docker',
  'Linux',
  'R',
]

const LABELS: Record<string, string> = {
  brown: 'Brown', tan: 'Tan', dark: 'Dark', grey: 'Grey',
  happy: 'Happy', curious: 'Curious', sleepy: 'Sleepy', focused: 'Focused', cool: 'Cool',
  none: 'None', round: 'Round', square: 'Square', aviator: 'Aviator', star: 'Star',
  hoodie: 'Hoodie', uniform: 'Uniform', casual: 'Casual', formal: 'Formal', sweater: 'Sweater',
  headphones: 'Headphones', pencil: 'Pencil', book: 'Book', coffee: 'Coffee', backpack: 'Backpack',
  cream: 'Cream', sky: 'Sky', forest: 'Forest', library: 'Library', night: 'Night', sunset: 'Sunset',
}

function VisitorProfileView({
  targetUserId,
  initialUser,
}: {
  targetUserId: string
  initialUser?: any
}) {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuthStore()
  const { connections, sendRequestDB } = useConnectionStore()

  const [targetProfile, setTargetProfile] = useState<any>(initialUser || null)
  const [loading, setLoading] = useState(!initialUser)
  const [stats, setStats] = useState<UserDashboardStats | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  // Public connections list state
  const [otherConnections, setOtherConnections] = useState<any[]>([])
  const [showConnectionsModal, setShowConnectionsModal] = useState(false)
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [privateAlert, setPrivateAlert] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadTarget = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .single()

        if (data && isMounted) {
          setTargetProfile(normalizeProfile(data))
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadTarget()
    fetchUserDashboardStats(targetUserId).then((res) => {
      if (isMounted) setStats(res)
    })

    return () => {
      isMounted = false
    }
  }, [targetUserId])

  const isConnected = connections[targetUserId]?.status === 'accepted'
  const isPending = connections[targetUserId]?.status === 'pending_sent' || requestSent
  const hasHadSession = hasCompletedSessionWith(targetUserId)
  const isBusyOrOffline = ['studying', 'looking', 'offline'].includes(targetProfile?.online_status || '')

  const isConnectionsPrivate = Boolean(
    targetProfile?.connections_private ||
    targetProfile?.otter_config?.connections_private
  )

  const handleOpenConnections = async () => {
    if (isConnectionsPrivate) {
      setPrivateAlert(true)
      return
    }
    setShowConnectionsModal(true)
    if (otherConnections.length === 0) {
      setLoadingConnections(true)
      try {
        const { data } = await supabase
          .from('connections')
          .select(`
            requester_id,
            recipient_id,
            status,
            requester:profiles!requester_id(*),
            recipient:profiles!recipient_id(*)
          `)
          .or(`requester_id.eq.${targetUserId},recipient_id.eq.${targetUserId}`)
          .eq('status', 'accepted')

        const peers: any[] = []
        if (data) {
          for (const row of data as any[]) {
            const isRequester = row.requester_id === targetUserId
            const peerRaw = isRequester ? row.recipient : row.requester
            if (!peerRaw) continue
            const peer = normalizeProfile(peerRaw)
            if (peer && peer.id !== targetUserId) {
              peers.push(peer)
            }
          }
        }
        setOtherConnections(peers)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingConnections(false)
      }
    }
  }

  const handleConnect = async () => {
    if (!currentUser?.id || isConnected || isPending || !targetProfile) return
    setConnecting(true)
    try {
      await sendRequestDB(targetProfile)
      setRequestSent(true)
    } catch (err) {
      console.error(err)
    } finally {
      setConnecting(false)
    }
  }

  const handleStudy = () => {
    if (isBusyOrOffline || !targetProfile) return
    navigate('/duo', { state: { partner: targetProfile, initiated: true } })
  }

  // Calculate streak activity
  const userStreak = stats ? stats.streakDays : (targetProfile?.streak ?? 0)
  const streakGrid = useMemo(() => {
    const weeks: { date: string; count: number; dayOfWeek: number }[][] = []
    const today = new Date()
    const numWeeks = 24
    const sessionsByDate: Record<string, number> = {}
    if (stats?.sessionDates) {
      for (const d of stats.sessionDates) {
        sessionsByDate[d] = (sessionsByDate[d] || 0) + 1
      }
    }
    for (let w = numWeeks - 1; w >= 0; w--) {
      const weekDays: { date: string; count: number; dayOfWeek: number }[] = []
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(today)
        dateObj.setDate(today.getDate() - (w * 7 + (6 - d)))
        const dateStr = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
        const isoDate = dateObj.toISOString().slice(0, 10)
        const count = sessionsByDate[isoDate] || 0
        weekDays.push({ date: dateStr, count, dayOfWeek: d })
      }
      weeks.push(weekDays)
    }
    return weeks
  }, [stats])

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F1F1F1] flex items-center justify-center text-[#4C271A]">
        <div className="w-8 h-8 rounded-full border-3 border-[#7E4228] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!targetProfile) {
    return (
      <div className="min-h-[100dvh] bg-[#F1F1F1] flex flex-col items-center justify-center p-6 text-center text-[#4C271A]">
        <h2 className="font-display font-black text-xl mb-2">Learner Profile Not Found</h2>
        <p className="text-xs text-[#7E4228] mb-4">This user profile may have been removed or is unavailable.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 neu-btn-primary rounded-2xl text-xs font-black text-white"
        >
          Go Back
        </button>
      </div>
    )
  }

  const targetOtter = targetProfile.otter_config || targetProfile.otter || {
    fur: 'brown',
    eyes: 'happy',
    glasses: 'none',
    clothing: 'hoodie',
    accessory: 'none',
    background: 'cream',
  }

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#F1F1F1] flex flex-col justify-between p-4 max-w-md mx-auto select-none text-[#4C271A] pb-32">
      <div>
        {/* Top Header: Back button + Title, NO settings, NO edit button */}
        <div className="flex items-center justify-between pt-2 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl neu-btn-circle-light flex items-center justify-center text-[#4C271A] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <h1 className="font-display font-black text-2xl text-[#4C271A]">
            Profile
          </h1>
          <div className="w-10 h-10" />
        </div>

        <div className="space-y-4">
          {/* Profile Header Card (Image 5 style) */}
          <div className="neu-card-floating p-4 relative overflow-hidden">
            {/* Warm Secondary Brown Top Banner */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-[#7E4228] border-b border-[#4C271A]/20" />

            <div className="relative pt-6 flex items-end justify-between gap-3">
              {/* Otter Avatar with Dark Brown Circle Background & Flag Pin (NO edit button) */}
              <div className="relative drop-shadow-md">
                <div className="w-20 h-20 rounded-full bg-[#4C271A] p-1 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                  <OtterAvatar config={targetOtter} size="lg" />
                </div>
                {targetProfile.country_code && (
                  <div className="absolute -bottom-1 -right-1 z-10 rounded-full ring-2 ring-white drop-shadow-sm">
                    <CountryFlag countryCode={targetProfile.country_code} size="xs" />
                  </div>
                )}
              </div>

              {/* Connections Counter Button */}
              <div className="flex flex-col items-end pb-1">
                <button
                  onClick={handleOpenConnections}
                  className="neu-pill bg-[#EFE7E2] text-[#7E4228] px-3 py-1.5 text-[11px] font-black border border-[#7E4228]/20 flex items-center gap-1.5 active:scale-95 transition-all hover:bg-[#E5DFD9] cursor-pointer"
                >
                  {isConnectionsPrivate ? (
                    <>
                      <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Private connections</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>
                        {otherConnections.length > 0 ? otherConnections.length : (targetProfile.connections_count ?? '0')} connections
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* User Identity Info */}
            <div className="mt-3.5">
              <div className="flex items-baseline gap-2">
                <h2 className="font-display font-black text-2xl text-[#4C271A]">
                  {targetProfile.display_name}
                </h2>
                <span className="text-xs font-black text-[#7E4228]">
                  @{targetProfile.username || 'learner'}
                </span>
              </div>

              <p className="text-xs text-[#7E4228] font-semibold mt-1">
                <span className="font-black text-[#4C271A]">{targetProfile.education_status || 'Student'}</span> · {targetProfile.degree_program || 'General Studies'}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-[#7E4228] font-medium mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#7E4228] stroke-[2.5]" />
                <span>
                  {[targetProfile.city, targetProfile.country].filter(Boolean).join(', ') || 'Global'}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Background Card */}
          <div className="neu-card-floating p-4 space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7E4228] block">
              Academic Background
            </span>
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#7E4228]/15">
              <span className="text-[#7E4228] font-bold">School / University</span>
              <span className="font-black text-[#4C271A]">{targetProfile.school || 'University'}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#7E4228]/15">
              <span className="text-[#7E4228] font-bold">Year Level / Grade</span>
              <span className="font-black text-[#4C271A]">{targetProfile.year_level || 'Student'}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5">
              <span className="text-[#7E4228] font-bold">Study Style</span>
              <span className="font-black text-[#4C271A] capitalize">
                {{ quiet: 'Quiet Focus', discussion: 'Discussion', mixed: 'Mixed Focus', flexible: 'Flexible' }[targetProfile.study_style as StudyStyle] || 'Flexible'}
              </span>
            </div>
          </div>

          {/* Interests to Learn Card */}
          {targetProfile.learning_interests && targetProfile.learning_interests.length > 0 && (
            <div className="neu-card-floating p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7E4228]">
                  Interests to Learn
                </span>
                <span className="text-[10px] font-black neu-pill bg-[#EFE7E2] text-[#7E4228] px-2.5 py-0.5 border border-[#7E4228]/20 shadow-sm">
                  {targetProfile.learning_interests.length} Selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {targetProfile.learning_interests.map((item: string) => (
                  <span
                    key={item}
                    className="neu-pill bg-[#EAE5E0] text-[#4C271A] text-xs font-black px-3.5 py-1.5 border border-[#7E4228]/20 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7E4228] stroke-[2.5]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Expertise Card */}
          {targetProfile.skills && targetProfile.skills.length > 0 && (
            <div className="neu-card-floating p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7E4228]">
                  Skills & Expertise
                </span>
                <span className="text-[10px] font-black neu-pill bg-emerald-50 text-emerald-800 px-2.5 py-0.5 border border-emerald-200 shadow-sm">
                  {targetProfile.skills.length} Selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {targetProfile.skills.map((item: string) => (
                  <span
                    key={item}
                    className="neu-pill bg-emerald-50/70 text-emerald-900 text-xs font-black px-3.5 py-1.5 border border-emerald-300 flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Study Streak Activity Card */}
          <div className="neu-card-floating p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#7E4228] fill-[#7E4228]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#4C271A]">
                  Study Streak Activity
                </span>
              </div>
              <div className="flex items-center gap-1 neu-pill bg-[#EFE7E2] text-[#7E4228] px-2.5 py-0.5 border border-[#7E4228]/20 text-[10px] font-black">
                <Flame className="w-3 h-3 text-[#7E4228] fill-[#7E4228]" />
                <span>{userStreak}-Day Streak</span>
              </div>
            </div>

            <p className="text-[11px] text-[#7E4228] font-medium mb-3">
              Daily study sessions conducted in Duo and Squad
            </p>

            <div className="bg-[#4C271A] text-[#F1F1F1] rounded-2xl p-3.5 shadow-md border border-white/10 overflow-x-auto no-scrollbar">
              <div className="flex justify-between text-[9px] font-black text-[#D4B8A6] mb-2 px-6 min-w-[300px]">
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
              </div>

              <div className="flex items-center gap-2 min-w-[300px]">
                <div className="flex flex-col justify-between text-[8px] font-bold text-[#D4B8A6] h-[88px] pr-1 select-none">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>

                <div className="flex gap-1">
                  {streakGrid.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {week.map((day, dIdx) => {
                        const intensityColor =
                          day.count === 0
                            ? 'bg-[#3B1E14]'
                            : day.count === 1
                            ? 'bg-[#15803D]'
                            : day.count === 2
                            ? 'bg-[#16A34A]'
                            : day.count === 3
                            ? 'bg-[#22C55E]'
                            : 'bg-[#4ADE80]'

                        return (
                          <div
                            key={dIdx}
                            className={`w-2.5 h-2.5 rounded-[3px] shadow-sm ${intensityColor}`}
                            title={`${day.date}: ${day.count} sessions`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-4 z-30 pt-3">
        <div className="neu-card-floating p-3 space-y-2 bg-[#F1F1F1]/95 backdrop-blur-md border border-white/80">
          {/* In-Call / Offline Warning Alert */}
          {isBusyOrOffline && (
            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {targetProfile.display_name} is currently {targetProfile.online_status || 'offline'}. Session invites cannot be sent right now.
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* If connected: display Connected badge */}
            {isConnected ? (
              <div className="flex-1 py-3 px-4 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Connected</span>
              </div>
            ) : hasHadSession ? (
              /* If NOT connected, but session has completed: show Connect button */
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting || isPending}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isPending ? 'Request Sent' : connecting ? 'Connecting...' : 'Connect'}</span>
              </button>
            ) : null}

            {/* Study in Duo Button (Always present per rule) */}
            <button
              type="button"
              onClick={handleStudy}
              disabled={isBusyOrOffline}
              className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                isBusyOrOffline
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'neu-btn-primary bg-[#7E4228] hover:bg-[#6D3821]'
              }`}
            >
              <Video className="w-4 h-4 fill-white" />
              <span>Study in Duo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Private Connections Notice Modal */}
      {privateAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
          onClick={() => setPrivateAlert(false)}
        >
          <div
            className="w-full max-w-sm bg-[#F1F1F1] rounded-3xl neu-card-floating p-6 border border-white/80 shadow-2xl text-[#4C271A] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl neu-btn-circle-light flex items-center justify-center mx-auto mb-3 text-[#7E4228]">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="font-display font-black text-lg text-[#4C271A] mb-1">
              Private Connections
            </h3>
            <p className="text-xs text-[#7E4228] mb-5 leading-relaxed">
              This learner has set their connections to private. You can still study with them in Duo to build a connection!
            </p>
            <button
              onClick={() => setPrivateAlert(false)}
              className="w-full py-3 rounded-2xl neu-btn-primary text-white font-black text-xs cursor-pointer shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Public Connections Modal */}
      {showConnectionsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
          onClick={() => setShowConnectionsModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#F1F1F1] rounded-3xl neu-card-floating p-5 border border-white/80 shadow-2xl animate-scale-up text-[#4C271A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl neu-btn-circle-light flex items-center justify-center text-[#7E4228]">
                  <Users className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-[#4C271A]">
                    {targetProfile.display_name}&apos;s Connections
                  </h3>
                  <p className="text-[10px] font-bold text-[#7E4228] uppercase">
                    Public Network
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectionsModal(false)}
                className="w-8 h-8 rounded-full neu-btn-circle-light flex items-center justify-center text-[#4C271A] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {loadingConnections ? (
                <div className="py-8 text-center text-xs text-[#7E4228]">
                  Loading connections...
                </div>
              ) : otherConnections.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7E4228]">
                  No connections visible.
                </div>
              ) : (
                otherConnections.map((peer) => {
                  const isPeerConnected = connections[peer.id]?.status === 'accepted'
                  return (
                    <div
                      key={peer.id}
                      className="p-3 rounded-2xl neu-card bg-[#F1F1F1] border border-white/70 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#4C271A] p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <OtterAvatar config={peer.otter_config || peer.otter} size="xs" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs text-[#4C271A] truncate">{peer.display_name}</p>
                          <p className="text-[10px] text-[#7E4228] font-semibold truncate">
                            {isPeerConnected ? 'Connected with you ✓' : 'Not in your network'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowConnectionsModal(false)
                          navigate(`/profile/${peer.id}`, { state: { viewUser: peer } })
                        }}
                        className="px-2.5 py-1.5 rounded-xl neu-btn-raised text-[10px] font-black text-[#7E4228] cursor-pointer"
                      >
                        Visit
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { profile, setProfile, signOut } = useAuthStore()
  const { connections } = useConnectionStore()
  const navigate = useNavigate()
  const { userId: paramUserId } = useParams<{ userId?: string }>()
  const location = useLocation()

  const isOtherUser = Boolean(paramUserId && paramUserId !== profile?.id)

  if (isOtherUser && paramUserId) {
    return (
      <VisitorProfileView
        targetUserId={paramUserId}
        initialUser={(location.state as any)?.viewUser || (location.state as any)?.user}
      />
    )
  }

  const [tab, setTab] = useState<'profile' | 'otter'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [mapVisible, setMapVisible] = useState(
    profile?.openworld_visible !== false && profile?.otter_config?.openworld_visible !== false
  )
  const [connectionsPrivate, setConnectionsPrivate] = useState(
    Boolean((profile as any)?.connections_private || profile?.otter_config?.connections_private)
  )

  useEffect(() => {
    if (profile) {
      setMapVisible(profile.openworld_visible !== false && profile.otter_config?.openworld_visible !== false)
      setConnectionsPrivate(Boolean((profile as any)?.connections_private || profile.otter_config?.connections_private))
    }
  }, [profile])

  const handleToggleMapVisibility = async () => {
    if (!profile?.id) return
    const next = !mapVisible
    setMapVisible(next)
    const updated = {
      ...profile,
      openworld_visible: next,
      otter_config: { ...profile.otter_config, openworld_visible: next },
    }
    setProfile(updated)
    await supabase.from('profiles').update({
      openworld_visible: next,
      otter_config: updated.otter_config,
    }).eq('id', profile.id)
  }

  const handleToggleConnectionsPrivate = async () => {
    if (!profile?.id) return
    const next = !connectionsPrivate
    setConnectionsPrivate(next)
    const updated = {
      ...profile,
      connections_private: next,
      otter_config: { ...profile.otter_config, connections_private: next },
    }
    setProfile(updated)
    await supabase.from('profiles').update({
      connections_private: next,
      otter_config: updated.otter_config,
    }).eq('id', profile.id)
  }

  const [otter, setOtter] = useState((profile as any)?.otter_config || profile?.otter || { fur: 'brown', eyes: 'happy', glasses: 'none', clothing: 'hoodie', accessory: 'none', background: 'cream' })

  // Edit Form State (Mandatory & Optional fields)
  const [username, setUsername] = useState(profile?.username || 'user')
  const [displayName, setDisplayName] = useState(profile?.display_name || 'Student')
  const [category, setCategory] = useState<EducationStatus>(
    (['College', 'Senior High', 'High School', 'Graduated'].includes(profile?.education_status as any)
      ? (profile?.education_status as EducationStatus)
      : 'College')
  )
  const [courseGrade, setCourseGrade] = useState(profile?.degree_program || 'BS Information Technology')
  const [country, setCountry] = useState(profile?.country || 'Philippines')
  const [city, setCity] = useState(profile?.city || 'Manila')

  // Optional fields
  const [school, setSchool] = useState(profile?.school || 'University')
  const [yearLevel, setYearLevel] = useState(profile?.year_level || '1st Year')
  const [studyStyle, setStudyStyle] = useState<StudyStyle>(profile?.study_style || 'mixed')

  // Ensure default exactly 5 Interests to Learn & 3 Skills
  const [interests, setInterests] = useState<string[]>(() => {
    if (profile?.learning_interests && profile.learning_interests.length === 5) {
      return profile.learning_interests
    }
    const base = profile?.learning_interests || []
    const defaults = ['Web Development', 'Machine Learning', 'Data Science', 'UI/UX Design', 'Cloud Computing']
    const combined = [...base, ...defaults.filter((d) => !base.includes(d))]
    return combined.slice(0, 5)
  })

  const [skills, setSkills] = useState<string[]>(() => {
    if (profile?.skills && profile.skills.length === 3) {
      return profile.skills
    }
    const base = profile?.skills || []
    const defaults = ['JavaScript', 'Python', 'React']
    const combined = [...base, ...defaults.filter((d) => !base.includes(d))]
    return combined.slice(0, 3)
  })

  const [customInterest, setCustomInterest] = useState('')
  const [customSkill, setCustomSkill] = useState('')
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null)

  if (!profile || !otter) return null

  // Connected study buddies list
  const connectedList = Object.values(connections).filter((c) => c.status === 'accepted')
  const connectionCount = connectedList.length

  const [userStats, setUserStats] = useState<UserDashboardStats | null>(null)

  React.useEffect(() => {
    if (profile?.id) {
      fetchUserDashboardStats(profile.id).then(setUserStats)
    }
  }, [profile?.id])

  // User's actual streak from sessions
  const userStreak = userStats ? userStats.streakDays : (profile.streak ?? 0)

  // GitHub Streak Heatmap calculation (24 weeks of study sessions reflecting real user activity)
  const streakGrid = useMemo(() => {
    const weeks: { date: string; count: number; dayOfWeek: number }[][] = []
    const today = new Date()
    const numWeeks = 24

    // Map real sessions count by YYYY-MM-DD
    const sessionsByDate: Record<string, number> = {}
    if (userStats?.sessionDates) {
      for (const d of userStats.sessionDates) {
        sessionsByDate[d] = (sessionsByDate[d] || 0) + 1
      }
    }

    for (let w = numWeeks - 1; w >= 0; w--) {
      const weekDays: { date: string; count: number; dayOfWeek: number }[] = []
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(today)
        dateObj.setDate(today.getDate() - (w * 7 + (6 - d)))
        const dateStr = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
        const isoDate = dateObj.toISOString().slice(0, 10)
        const count = sessionsByDate[isoDate] || 0

        weekDays.push({
          date: dateStr,
          count,
          dayOfWeek: d,
        })
      }
      weeks.push(weekDays)
    }
    return weeks
  }, [userStats])

  const toggleInterest = (item: string) => {
    if (interests.includes(item)) {
      setInterests(interests.filter((i) => i !== item))
    } else {
      if (interests.length >= 5) return
      setInterests([...interests, item])
    }
  }

  const addCustomInterest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customInterest.trim() || interests.length >= 5) return
    if (!interests.includes(customInterest.trim())) {
      setInterests([...interests, customInterest.trim()])
    }
    setCustomInterest('')
  }

  const toggleSkill = (item: string) => {
    if (skills.includes(item)) {
      setSkills(skills.filter((s) => s !== item))
    } else {
      if (skills.length >= 3) return
      setSkills([...skills, item])
    }
  }

  const addCustomSkill = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customSkill.trim() || skills.length >= 3) return
    if (!skills.includes(customSkill.trim())) {
      setSkills([...skills, customSkill.trim()])
    }
    setCustomSkill('')
  }

  const updateOtter = (key: string, value: string) => {
    setOtter((prev: any) => (prev ? { ...prev, [key]: value } : prev))
  }

  const isFormValid =
    username.trim().length > 0 &&
    displayName.trim().length > 0 &&
    category.trim().length > 0 &&
    courseGrade.trim().length > 0 &&
    country.trim().length > 0 &&
    city.trim().length > 0 &&
    interests.length === 5 &&
    skills.length === 3

  const handleSaveProfile = () => {
    if (!isFormValid) return
    const mergedOtterConfig = {
      ...(profile?.otter_config || {}),
      ...otter,
      education_status: category,
      degree_program: courseGrade.trim(),
      school: school.trim(),
      year_level: yearLevel.trim(),
      study_style: studyStyle,
      onboarding_completed: true,
    }
    const updated = {
      ...profile,
      username: username.trim(),
      display_name: displayName.trim(),
      education_status: category,
      degree_program: courseGrade.trim(),
      country: country.trim(),
      city: city.trim(),
      school: school.trim(),
      year_level: yearLevel.trim(),
      study_style: studyStyle,
      learning_interests: interests,
      subjects: interests,
      skills,
      otter,
      otter_config: mergedOtterConfig,
      onboarding_completed: true,
    }
    setProfile(updated)
    setIsEditing(false)

    if (profile?.id) {
      (supabase.from('profiles') as any).update({
        username: username.trim(),
        display_name: displayName.trim(),
        category: category,
        course_grade: courseGrade.trim(),
        interests: interests,
        skills: skills,
        country: country.trim(),
        city: city.trim(),
        otter_config: mergedOtterConfig,
      }).eq('id', profile.id).then(({ error }: any) => {
        if (error) console.error('Failed to update profile in database:', error.message)
      })
    }
  }

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#F1F1F1] flex flex-col justify-between p-4 max-w-md mx-auto select-none text-[#4C271A] pb-32">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pt-2 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl neu-btn-circle-light flex items-center justify-center text-[#4C271A]"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <h1 className="font-display font-black text-2xl text-[#4C271A]">
            Profile
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-10 h-10 rounded-2xl neu-btn-circle-light flex items-center justify-center text-[#7E4228] transition-all cursor-pointer"
              title="Settings & Privacy"
            >
              <Settings className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`w-10 h-10 rounded-2xl neu-btn flex items-center justify-center transition-all ${
                isEditing ? 'neu-btn-green text-white' : 'neu-btn-circle-light text-[#7E4228]'
              }`}
              title={isEditing ? 'Cancel Edit' : 'Edit Profile Info'}
            >
              <Edit3 className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Tab switcher: Profile Info / My Otter */}
        <div className="flex neu-dock p-1.5 mb-5">
          {(['profile', 'otter'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-black capitalize transition-all ${
                tab === t
                  ? 'bg-[#7E4228] text-white shadow-sm'
                  : 'text-[#7E4228]/70 hover:text-[#4C271A]'
              }`}
            >
              {t === 'otter' ? 'My Otter' : 'Profile Info'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="space-y-4">
            {/* 1. LinkedIn-Inspired Profile Header Card with Stacked Connections (Image 2 Inspired) */}
            <div className="neu-card-floating p-4 relative overflow-hidden">
              {/* Warm Secondary Brown Top Banner */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-[#7E4228] border-b border-[#4C271A]/20" />

              {/* Avatar + Connections Stack Row (Matching Image 2) */}
              <div className="relative pt-6 flex items-end justify-between gap-3">
                {/* Otter Avatar with Dark Brown Circle Background & Flag Pin */}
                <div className="relative drop-shadow-md">
                  <div className="w-20 h-20 rounded-full bg-[#4C271A] p-1 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                    <OtterAvatar config={otter} size="lg" />
                  </div>
                  {profile.country_code && (
                    <div className="absolute -bottom-1 -right-1 z-10 rounded-full ring-2 ring-white drop-shadow-sm">
                      <CountryFlag countryCode={profile.country_code} size="xs" />
                    </div>
                  )}
                </div>

                {/* Overlapping Connected Study Buddies Stack (Image 2 style) */}
                <div className="flex flex-col items-end pb-1">
                  <div className="flex items-center -space-x-3 py-1">
                    {connectedList.slice(0, 4).map((conn, idx) => {
                      const bgColors = ['bg-[#15803D]', 'bg-[#2563EB]', 'bg-[#7E4228]', 'bg-[#4C271A]']
                      return (
                        <div
                          key={conn.user.id}
                          className={`relative inline-block rounded-full ring-2 ring-[#F1F1F1] drop-shadow-sm p-0.5 ${
                            bgColors[idx % bgColors.length]
                          }`}
                          title={conn.user.display_name}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                            <OtterAvatar config={conn.user.otter} size="xs" />
                          </div>
                          {conn.user.country_code && (
                            <div className="absolute -bottom-0.5 -right-0.5 scale-75 rounded-full ring-1 ring-white">
                              <CountryFlag countryCode={conn.user.country_code} size="xs" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* LinkedIn-style Connections Counter Button */}
                  <button
                    onClick={() => navigate('/connections')}
                    className="neu-pill bg-[#EFE7E2] text-[#7E4228] px-2.5 py-1 text-[11px] font-black border border-[#7E4228]/20 flex items-center gap-1.5 active:scale-95 transition-all mt-1 hover:bg-[#E5DFD9]"
                  >
                    <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {connectionCount} {connectionCount === 1 ? 'connection' : 'connections'}
                    </span>
                  </button>
                </div>
              </div>

              {/* User Identity Info */}
              <div className="mt-3.5">
                <div className="flex items-baseline gap-2">
                  <h2 className="font-display font-black text-2xl text-[#4C271A]">
                    {profile.display_name}
                  </h2>
                  <span className="text-xs font-black text-[#7E4228]">
                    @{profile.username || 'Adrian12'}
                  </span>
                </div>

                {/* Category & Course/Grade */}
                <p className="text-xs text-[#7E4228] font-semibold mt-1">
                  <span className="font-black text-[#4C271A]">{profile.education_status}</span> · {profile.degree_program}
                </p>

                {/* Location (City & Country only) */}
                <div className="flex items-center gap-1.5 text-xs text-[#7E4228] font-medium mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#7E4228] stroke-[2.5]" />
                  <span>
                    {profile.city}, {profile.country}
                  </span>
                </div>
              </div>
            </div>

            {/* Duolingo-style Match Quiz & Onboarding Prompt Card */}
            <div className="neu-card-floating p-3.5 bg-gradient-to-r from-[#FAF6F0] to-[#F3EDE5] border border-[#7E4228]/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#7E4228] text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-black text-xs sm:text-sm text-[#4C271A]">
                    {(!profile.learning_interests || profile.learning_interests.length < 3) ? 'Complete Your Match Quiz' : 'Retake Match Quiz'}
                  </h4>
                  <p className="text-[11px] text-[#7E4228] font-semibold truncate">
                    {(!profile.learning_interests || profile.learning_interests.length < 3) ? 'Duolingo-style setup for instant study buddy pairing' : 'Update your interests & study habits anytime'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/onboarding')}
                className="px-3 py-2 rounded-xl bg-[#7E4228] text-white text-xs font-black shadow-sm active:scale-95 transition-transform flex-shrink-0 flex items-center gap-1 hover:bg-[#6D3821] cursor-pointer"
              >
                <span>Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Education & Study Info Card (NO Session Length) */}
            <div className="neu-card-floating p-4 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7E4228] block">
                Academic Background
              </span>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#7E4228]/15">
                <span className="text-[#7E4228] font-bold">School / University</span>
                <span className="font-black text-[#4C271A]">{profile.school || 'MSU-IIT'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#7E4228]/15">
                <span className="text-[#7E4228] font-bold">Year Level / Grade</span>
                <span className="font-black text-[#4C271A]">{profile.year_level || '3rd Year'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-[#7E4228] font-bold">Study Style</span>
                <span className="font-black text-[#4C271A] capitalize">
                  {{ quiet: 'Quiet Focus', discussion: 'Discussion', mixed: 'Mixed Focus', flexible: 'Flexible' }[profile.study_style] || 'Mixed'}
                </span>
              </div>
            </div>

            {/* 3. Mandatory 5 Interests to Learn (Replaces Subjects) */}
            <div className="neu-card-floating p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7E4228]">
                  Interests to Learn
                </span>
                <span className="text-[10px] font-black neu-pill bg-[#EFE7E2] text-[#7E4228] px-2.5 py-0.5 border border-[#7E4228]/20 shadow-sm">
                  {Math.min(5, (profile.learning_interests || []).length)}/5 Selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.learning_interests || []).slice(0, 5).map((item) => (
                  <span
                    key={item}
                    className="neu-pill bg-[#EAE5E0] text-[#4C271A] text-xs font-black px-3.5 py-1.5 border border-[#7E4228]/20 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7E4228] stroke-[2.5]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Mandatory 3 Skills */}
            <div className="neu-card-floating p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7E4228]">
                  Skills & Expertise
                </span>
                <span className="text-[10px] font-black neu-pill bg-emerald-50 text-emerald-800 px-2.5 py-0.5 border border-emerald-200 shadow-sm">
                  {Math.min(3, (profile.skills || []).length)}/3 Selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.skills || []).slice(0, 3).map((item) => (
                  <span
                    key={item}
                    className="neu-pill bg-emerald-50/70 text-emerald-900 text-xs font-black px-3.5 py-1.5 border border-emerald-300 flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 5. GitHub-like Daily Sessions Conducted Streak Table (Matching Image 3) */}
            <div className="neu-card-floating p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#7E4228] fill-[#7E4228]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#4C271A]">
                    Study Streak Activity
                  </span>
                </div>
                <div className="flex items-center gap-1 neu-pill bg-[#EFE7E2] text-[#7E4228] px-2.5 py-0.5 border border-[#7E4228]/20 text-[10px] font-black">
                  <Flame className="w-3 h-3 text-[#7E4228] fill-[#7E4228]" />
                  <span>{userStreak}-Day Streak</span>
                </div>
              </div>

              <p className="text-[11px] text-[#7E4228] font-medium mb-3">
                Daily study sessions conducted in Duo and Squad
              </p>

              {/* GitHub Heatmap Grid Container with 10% Accent Dark Brown Background (#4C271A) */}
              <div className="bg-[#4C271A] text-[#F1F1F1] rounded-2xl p-3.5 shadow-md border border-white/10 overflow-x-auto no-scrollbar">
                {/* Month labels header */}
                <div className="flex justify-between text-[9px] font-black text-[#D4B8A6] mb-2 px-6 min-w-[300px]">
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                </div>

                <div className="flex items-center gap-2 min-w-[300px]">
                  {/* Day of week labels */}
                  <div className="flex flex-col justify-between text-[8px] font-bold text-[#D4B8A6] h-[88px] pr-1 select-none">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                  </div>

                  {/* 7-Row Grid of Contribution Squares */}
                  <div className="flex gap-1">
                    {streakGrid.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1">
                        {week.map((day, dIdx) => {
                          const intensityColor =
                            day.count === 0
                              ? 'bg-[#3B1E14]'
                              : day.count === 1
                              ? 'bg-[#15803D]'
                              : day.count === 2
                              ? 'bg-[#16A34A]'
                              : day.count === 3
                              ? 'bg-[#22C55E]'
                              : 'bg-[#4ADE80]'

                          return (
                            <div
                              key={dIdx}
                              onMouseEnter={() => setHoveredDay(day)}
                              onClick={() => setHoveredDay(day)}
                              className={`w-2.5 h-2.5 rounded-[3px] transition-all hover:scale-135 cursor-pointer shadow-sm ${intensityColor}`}
                              title={`${day.count} sessions on ${day.date}`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heatmap Footer matching Image 3: Learn how we count contributions + Less ... More */}
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[9px] text-[#D4B8A6]">
                  <div className="flex items-center gap-1 hover:text-white cursor-pointer">
                    <HelpCircle className="w-3 h-3 text-[#D4B8A6]" />
                    <span>
                      {hoveredDay ? (
                        <strong className="text-white">
                          {hoveredDay.count} {hoveredDay.count === 1 ? 'session' : 'sessions'} on {hoveredDay.date}
                        </strong>
                      ) : (
                        'Learn how we count contributions'
                      )}
                    </span>
                  </div>

                  {/* GitHub Legend: Less ... More */}
                  <div className="flex items-center gap-1 select-none">
                    <span>Less</span>
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3B1E14]" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#15803D]" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#16A34A]" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#22C55E]" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#4ADE80]" />
                    <span>More</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Solid Red Sign Out Button with Tasteful Shadow */}
            <div className="pt-2">
              <button
                onClick={() => setShowSignOutConfirm(true)}
                className="w-full py-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-display font-black text-sm rounded-2xl shadow-[0_4px_14px_rgba(220,38,38,0.25)] flex items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: My Otter Customizer */}
        {tab === 'otter' && (
          <div className="space-y-4">
            {/* Preview Card */}
            <div className="clay-card-floating flex flex-col items-center py-6">
              <div className="relative drop-shadow-2xl">
                <OtterAvatar config={otter} size="2xl" animate showBorder={false} />
              </div>
              <p className="mt-3 text-xs font-black text-[#875F49] uppercase tracking-wider">
                Interactive Study Mascot
              </p>
            </div>

            {/* Mascot Customizer Options */}
            {([
              { key: 'fur', label: 'Fur Tone', options: FUR_OPTIONS },
              { key: 'eyes', label: 'Eye Expression', options: EYE_OPTIONS },
              { key: 'glasses', label: 'Glasses', options: GLASSES_OPTIONS },
              { key: 'clothing', label: 'Outfit', options: CLOTHING_OPTIONS },
              { key: 'accessory', label: 'Accessory', options: ACCESSORY_OPTIONS },
              { key: 'background', label: 'Backdrop', options: BG_OPTIONS },
            ] as const).map(({ key, label, options }) => (
              <div key={key} className="clay-card-floating p-3.5">
                <p className="text-xs font-black text-[#2D1B11] mb-2">{label}</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {(options as readonly string[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateOtter(key, opt)}
                      className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                        (otter as any)[key] === opt
                          ? 'clay-btn-amber text-[#2D1B11] shadow-sm scale-102'
                          : 'clay-inset text-[#5D3D2B] hover:bg-[#EAE0D2]'
                      }`}
                    >
                      {LABELS[opt] || opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                const mergedOtterConfig = {
                  ...(profile?.otter_config || {}),
                  ...otter,
                  onboarding_completed: true,
                }
                const updated = { ...profile, otter, otter_config: mergedOtterConfig }
                setProfile(updated)
                setTab('profile')
                if (profile?.id) {
                  (supabase.from('profiles') as any)
                    .update({ otter_config: mergedOtterConfig })
                    .eq('id', profile.id)
                    .then(({ error }: any) => {
                      if (error) console.error('Failed to update avatar in database:', error.message)
                    })
                }
              }}
              className="w-full py-4 clay-btn clay-btn-green text-white font-display font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Save Otter Avatar</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal (Mandatory & Optional Fields with Rich Claymorphism) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-sm clay-card-floating p-5 shadow-2xl relative text-[#2D1B11] animate-slide-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DFC3A6]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#875F49] block">
                  Profile Settings
                </span>
                <h3 className="font-display font-black text-lg text-[#2D1B11]">
                  Edit Your Info
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#2D1B11]"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Form Fields Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3.5 no-scrollbar text-xs">
              {/* 1. Mandatory Identity Fields */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase text-[#875F49] block">
                  Mandatory Info
                </span>

                <div>
                  <label className="text-[11px] font-bold text-[#2D1B11] block mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-black text-[#2D1B11] focus:outline-none"
                    placeholder="e.g. Adrian12"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#2D1B11] block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-black text-[#2D1B11] focus:outline-none"
                    placeholder="e.g. Adrian"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#2D1B11] block mb-1">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-2 rounded-xl text-[11px] font-black transition-all ${
                          category === cat
                            ? 'clay-btn-amber text-[#2D1B11] shadow-sm'
                            : 'clay-inset text-[#5D3D2B]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#2D1B11] block mb-1">
                    Course / Grade *
                  </label>
                  <input
                    type="text"
                    value={courseGrade}
                    onChange={(e) => setCourseGrade(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-black text-[#2D1B11] focus:outline-none"
                    placeholder="e.g. BS Information Technology or Grade 12 STEM"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#2D1B11] block mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-xs font-black text-[#2D1B11] focus:outline-none"
                      placeholder="e.g. Philippines"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#2D1B11] block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-xs font-black text-[#2D1B11] focus:outline-none"
                      placeholder="e.g. Cagayan de Oro"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Mandatory 5 Interests to Learn */}
              <div className="pt-2 border-t border-[#DFC3A6]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-[#2D1B11]">
                    Pick 5 Interests to Learn *
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      interests.length === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {interests.length}/5 Selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_INTERESTS.map((item) => {
                    const selected = interests.includes(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 ${
                          selected
                            ? 'clay-btn-amber text-[#2D1B11] shadow-sm scale-102'
                            : 'clay-inset text-[#5D3D2B] hover:bg-[#EAE0D2]'
                        }`}
                      >
                        {selected ? (
                          <Check className="w-2.5 h-2.5 stroke-[3] text-[#2D1B11]" />
                        ) : (
                          <span>+</span>
                        )}
                        <span>{item}</span>
                      </button>
                    )
                  })}
                </div>
                <form onSubmit={addCustomInterest} className="flex gap-1.5">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add custom interest..."
                    className="flex-1 clay-inset px-3 py-1.5 text-xs text-[#2D1B11] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={interests.length >= 5 || !customInterest.trim()}
                    className="clay-btn clay-btn-amber px-3 py-1.5 rounded-xl text-[10px] font-black disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* 3. Mandatory 3 Skills */}
              <div className="pt-2 border-t border-[#DFC3A6]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-[#2D1B11]">
                    Pick 3 Skills You Have *
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      skills.length === 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {skills.length}/3 Selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_SKILLS.map((item) => {
                    const selected = skills.includes(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleSkill(item)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 ${
                          selected
                            ? 'clay-btn-green text-white shadow-sm scale-102'
                            : 'clay-inset text-[#5D3D2B] hover:bg-[#EAE0D2]'
                        }`}
                      >
                        {selected ? (
                          <Check className="w-2.5 h-2.5 stroke-[3] text-white" />
                        ) : (
                          <span>+</span>
                        )}
                        <span>{item}</span>
                      </button>
                    )
                  })}
                </div>
                <form onSubmit={addCustomSkill} className="flex gap-1.5">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add custom skill..."
                    className="flex-1 clay-inset px-3 py-1.5 text-xs text-[#2D1B11] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={skills.length >= 3 || !customSkill.trim()}
                    className="clay-btn clay-btn-green text-white px-3 py-1.5 rounded-xl text-[10px] font-black disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* 4. Optional Academic Details */}
              <div className="pt-2 border-t border-[#DFC3A6] space-y-2">
                <span className="text-[10px] font-black uppercase text-[#875F49] block">
                  Optional Details
                </span>
                <div>
                  <label className="text-[11px] font-bold text-[#2D1B11] block mb-1">
                    School / University
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-black text-[#2D1B11] focus:outline-none"
                    placeholder="e.g. MSU-IIT"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#2D1B11] block mb-1">
                    Year Level
                  </label>
                  <input
                    type="text"
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="w-full clay-inset px-3 py-2 text-xs font-black text-[#2D1B11] focus:outline-none"
                    placeholder="e.g. 3rd Year"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#2D1B11] block mb-1">
                    Study Style
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STUDY_STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setStudyStyle(style.id)}
                        className={`p-2 rounded-xl text-[10px] font-black transition-all ${
                          studyStyle === style.id
                            ? 'clay-btn-amber text-[#2D1B11] shadow-sm'
                            : 'clay-inset text-[#5D3D2B]'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#DFC3A6] space-y-1.5">
              <button
                onClick={handleSaveProfile}
                disabled={!isFormValid}
                className="w-full py-3.5 clay-btn clay-btn-primary text-white font-display font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
              {!isFormValid && (
                <p className="text-[10px] text-red-600 font-bold text-center">
                  Please complete all mandatory fields, 5 interests, and 3 skills.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Settings & Privacy Modal (Authentic Neumorphic Design) */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#F1F1F1] rounded-3xl neu-card-floating p-6 border border-white/80 shadow-[10px_10px_30px_rgba(76,39,26,0.18),-10px_-10px_30px_rgba(255,255,255,0.9)] animate-scale-up text-[#4C271A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl neu-btn-circle-light flex items-center justify-center text-[#7E4228]">
                  <Settings className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-[#4C271A]">
                    Settings & Privacy
                  </h3>
                  <p className="text-[10px] font-black text-[#7E4228] uppercase tracking-wider">
                    OpenWorld & Connections
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-9 h-9 rounded-2xl neu-btn-circle-light flex items-center justify-center text-[#4C271A] hover:text-[#7E4228] transition-all cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Toggle 1: OpenWorld Map Visibility */}
              <div className="p-4 rounded-2xl neu-card bg-[#F1F1F1] border border-white/80 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#7E4228] stroke-[2.5]" />
                    <span className="font-display font-black text-sm text-[#4C271A]">
                      Visible on OpenMap
                    </span>
                  </div>
                  {/* Neumorphic Toggle Switch */}
                  <button
                    type="button"
                    onClick={handleToggleMapVisibility}
                    className={`w-13 h-7 rounded-full p-1 transition-all duration-200 cursor-pointer flex items-center ${
                      mapVisible
                        ? 'bg-[#7E4228] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.35),inset_-1px_-1px_3px_rgba(255,255,255,0.15)] justify-end'
                        : 'bg-[#E4E4E4] shadow-[inset_2px_2px_5px_rgba(76,39,26,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] justify-start'
                    }`}
                    aria-label="Toggle OpenMap Visibility"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#F1F1F1] border border-white/70 shadow-[2px_2px_5px_rgba(76,39,26,0.22),-1px_-1px_3px_rgba(255,255,255,0.95)] transition-all duration-200" />
                  </button>
                </div>
                <p className="text-[11px] text-[#7E4228] font-medium leading-relaxed">
                  {mapVisible
                    ? 'Visible: Other learners can discover your pin on the live OpenWorld map.'
                    : 'Invisible: You are hidden from other learners on the OpenWorld map.'}
                </p>
              </div>

              {/* Toggle 2: Connections Privacy */}
              <div className="p-4 rounded-2xl neu-card bg-[#F1F1F1] border border-white/80 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#7E4228] stroke-[2.5]" />
                    <span className="font-display font-black text-sm text-[#4C271A]">
                      Connections Privacy
                    </span>
                  </div>
                  {/* Neumorphic Toggle Switch */}
                  <button
                    type="button"
                    onClick={handleToggleConnectionsPrivate}
                    className={`w-13 h-7 rounded-full p-1 transition-all duration-200 cursor-pointer flex items-center ${
                      connectionsPrivate
                        ? 'bg-[#7E4228] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.35),inset_-1px_-1px_3px_rgba(255,255,255,0.15)] justify-end'
                        : 'bg-[#E4E4E4] shadow-[inset_2px_2px_5px_rgba(76,39,26,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] justify-start'
                    }`}
                    aria-label="Toggle Connections Privacy"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#F1F1F1] border border-white/70 shadow-[2px_2px_5px_rgba(76,39,26,0.22),-1px_-1px_3px_rgba(255,255,255,0.95)] transition-all duration-200" />
                  </button>
                </div>
                <p className="text-[11px] text-[#7E4228] font-medium leading-relaxed">
                  {connectionsPrivate
                    ? 'Private: Visitors to your profile cannot view your connections list.'
                    : 'Public: Anyone who visits your profile can browse your study buddies.'}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-3.5 rounded-2xl neu-btn-primary font-black text-xs uppercase tracking-wider text-white shadow-warm active:scale-95 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSignOutConfirm}
        title="Sign Out of Beside?"
        message="Are you sure you want to end your current session and sign out of your account?"
        confirmText="Yes, Sign Out"
        cancelText="Stay Signed In"
        variant="danger"
        onConfirm={async () => {
          setShowSignOutConfirm(false)
          await signOut()
          navigate('/auth')
        }}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </div>
  )
}
