import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  MapPin,
  Flame,
  Users,
  Lock,
  Sparkles,
  Video,
  UserCheck,
  UserPlus,
  BookOpen,
  GraduationCap,
  Clock,
  Zap,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import OtterAvatar from './OtterAvatar'
import { CountryFlag } from '../shared/components/CountryFlag'
import { useAuthStore } from '../store/authStore'
import { useConnectionStore, hasCompletedSessionWith } from '../store/connectionStore'
import { sendConnectionRequest } from '../services/openWorldService'
import { sendLiveDuoInvite } from '../services/realtimeHub'
import { supabase } from '../lib/supabase'
import { normalizeProfile } from '../utils/profileNormalizer'
import type { DemoUser } from '../types'

interface LearnerProfileModalProps {
  user: DemoUser | null
  isOpen: boolean
  onClose: () => void
  onOpenAnotherProfile?: (user: DemoUser) => void
}

export const LearnerProfileModal: React.FC<LearnerProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenAnotherProfile,
}) => {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuthStore()
  const { connections, sendRequestDB } = useConnectionStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'connections'>('overview')
  const [userConnections, setUserConnections] = useState<DemoUser[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [connectionRequested, setConnectionRequested] = useState(false)

  // Reset tab on user change
  useEffect(() => {
    setActiveTab('overview')
    setInviteSent(false)
    setConnectionRequested(false)
  }, [user?.id])

  // Check if connections are private for this user
  const isConnectionsPrivate = Boolean(
    (user as any)?.connections_private ||
    (user as any)?.otter_config?.connections_private
  )

  // Fetch target user's connections if viewing connections tab and public
  useEffect(() => {
    if (!isOpen || !user?.id || isConnectionsPrivate) return

    let isMounted = true
    const fetchTargetConnections = async () => {
      setLoadingConnections(true)
      try {
        const { data, error } = await supabase
          .from('connections')
          .select(`
            requester_id,
            recipient_id,
            status,
            requester:profiles!requester_id(*),
            recipient:profiles!recipient_id(*)
          `)
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .eq('status', 'accepted')

        if (error) {
          console.error('[LearnerProfileModal] error fetching connections:', error)
          if (isMounted) setLoadingConnections(false)
          return
        }

        const peerList: DemoUser[] = []
        if (data) {
          for (const row of data as any[]) {
            const isRequester = row.requester_id === user.id
            const peerRaw = isRequester ? row.recipient : row.requester
            if (!peerRaw) continue
            const peer = normalizeProfile(peerRaw)
            if (peer && peer.id !== user.id) {
              peerList.push(peer)
            }
          }
        }

        if (isMounted) {
          setUserConnections(peerList)
          setLoadingConnections(false)
        }
      } catch (err) {
        console.error(err)
        if (isMounted) setLoadingConnections(false)
      }
    }

    fetchTargetConnections()
    return () => {
      isMounted = false
    }
  }, [isOpen, user?.id, isConnectionsPrivate])

  if (!isOpen || !user) return null

  const isMe = currentUser?.id === user.id
  const isAlreadyConnected = !isMe && connections[user.id]?.status === 'accepted'
  const hasPendingSent = !isMe && (connections[user.id]?.status === 'pending_sent' || connectionRequested)
  const hasHadSession = !isMe && hasCompletedSessionWith(user.id)

  const isBusyOrOffline = ['studying', 'looking', 'offline'].includes(user.online_status || '')
  const statusLabel =
    user.online_status === 'studying'
      ? 'In Duo Call'
      : user.online_status === 'looking'
      ? 'In Squad'
      : user.online_status === 'offline'
      ? 'Offline'
      : 'Available'

  const statusBg =
    user.online_status === 'studying'
      ? 'bg-blue-100 text-blue-800'
      : user.online_status === 'looking'
      ? 'bg-purple-100 text-purple-800'
      : user.online_status === 'offline'
      ? 'bg-gray-100 text-gray-700'
      : 'bg-emerald-100 text-emerald-800'

  const handleConnect = async () => {
    if (!currentUser?.id || isAlreadyConnected || hasPendingSent) return
    setConnecting(true)
    try {
      await sendRequestDB(user)
      await sendConnectionRequest(currentUser.id, user.id)
      setConnectionRequested(true)
    } catch (err) {
      console.error(err)
    } finally {
      setConnecting(false)
    }
  }

  const handleStudyInDuo = async () => {
    if (isBusyOrOffline || !currentUser) return
    setInviting(true)
    try {
      const sessionId = `duo-${Date.now()}`
      await sendLiveDuoInvite({
        toUserId: user.id,
        fromUser: currentUser,
        sessionId,
        duration: user.preferred_duration || 30,
        subject: user.subjects?.[0] || 'Study Session',
      })
      setInviteSent(true)
      setTimeout(() => {
        onClose()
        navigate('/duo', { state: { partner: user, initiated: true, sessionId } })
      }, 600)
    } catch (err) {
      console.error(err)
    } finally {
      setInviting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FAF2E6] rounded-3xl border-2 border-[#7E4228]/25 shadow-2xl overflow-hidden animate-scale-up text-[#4C271A] flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="relative bg-[#FFF9F2] p-5 border-b border-[#7E4228]/15 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            {/* Avatar with country flag badge */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#7E4228] p-1 flex items-center justify-center shadow-md overflow-hidden">
                <OtterAvatar config={user.otter || (user as any).otter_config} size="md" animate={false} />
              </div>
              {user.country_code && (
                <div className="absolute -bottom-1 -right-1 scale-90 rounded-full ring-2 ring-white shadow-xs">
                  <CountryFlag countryCode={user.country_code} size="xs" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-[#2D1B11] truncate">
                  {user.display_name}
                </h3>
                {isAlreadyConnected && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wide flex items-center gap-1 shadow-2xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    <span>Connected</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-[#7E4228] font-bold truncate">
                {user.degree_program || user.degree_code || 'Student'} · {user.school || 'University'}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-[11px] text-[#875F49] font-medium">
                  <MapPin className="w-3 h-3 text-[#7E4228]" />
                  <span>
                    {[user.city, user.country].filter(Boolean).join(', ') || 'Global'}
                  </span>
                </div>
                <span className="text-[#875F49]/40">·</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusBg}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#4C271A] cursor-pointer hover:bg-[#E5DFD9] transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#7E4228]/15 bg-[#FAF2E6] px-5 pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#7E4228] text-[#7E4228]'
                : 'border-transparent text-[#875F49] hover:text-[#4C271A]'
            }`}
          >
            Learner Overview
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'connections'
                ? 'border-[#7E4228] text-[#7E4228]'
                : 'border-transparent text-[#875F49] hover:text-[#4C271A]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Connections</span>
            {!isConnectionsPrivate && userConnections.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E5DFD9] text-[#7E4228] text-[10px] font-bold">
                {userConnections.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'overview' && (
            <>
              {/* Streak Card & Academic Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="clay-card-floating p-3 rounded-2xl flex items-center gap-2.5 bg-[#FFF9F2]">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
                    <Flame className="w-5 h-5 fill-amber-500 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#875F49] block uppercase tracking-wider">
                      Study Streak
                    </span>
                    <span className="text-sm font-black text-[#2D1B11]">
                      {user.streak || 1} Days Active
                    </span>
                  </div>
                </div>

                <div className="clay-card-floating p-3 rounded-2xl flex items-center gap-2.5 bg-[#FFF9F2]">
                  <div className="w-9 h-9 rounded-xl bg-[#7E4228]/10 text-[#7E4228] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#875F49] block uppercase tracking-wider">
                      Study Style
                    </span>
                    <span className="text-sm font-black text-[#2D1B11] capitalize">
                      {user.study_style || 'Flexible'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Learning Interests */}
              {user.learning_interests && user.learning_interests.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#7E4228]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#7E4228]">
                      Learning Interests
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {user.learning_interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 rounded-xl bg-[#FFF9F2] border border-[#7E4228]/20 text-xs font-bold text-[#4C271A] shadow-2xs"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {user.skills && user.skills.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-[#7E4228]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#7E4228]">
                      Skills & Subjects
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {user.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-xl bg-[#FFF9F2] border border-[#7E4228]/20 text-xs font-bold text-[#4C271A] shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'connections' && (
            <div className="space-y-3">
              {isConnectionsPrivate ? (
                <div className="text-center py-8 px-4 bg-[#FFF9F2] rounded-2xl border border-[#7E4228]/20">
                  <div className="w-12 h-12 rounded-2xl bg-[#EFE6D8] text-[#7E4228] flex items-center justify-center mx-auto mb-2.5">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-black text-sm text-[#2D1B11] mb-1">
                    Connections are Private
                  </h4>
                  <p className="text-xs text-[#7E4228]">
                    {user.display_name} has chosen to keep their study buddy connections private in their profile settings.
                  </p>
                </div>
              ) : loadingConnections ? (
                <div className="py-8 flex flex-col items-center justify-center text-[#7E4228]">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs font-bold">Loading study buddies...</span>
                </div>
              ) : userConnections.length === 0 ? (
                <div className="text-center py-8 px-4 bg-[#FFF9F2] rounded-2xl border border-[#7E4228]/20">
                  <p className="text-xs text-[#7E4228] font-bold">
                    No public connections yet.
                  </p>
                </div>
              ) : (
                userConnections.map((peer) => {
                  const isPeerConnectedToMe =
                    currentUser?.id === peer.id
                      ? false
                      : connections[peer.id]?.status === 'accepted'

                  return (
                    <div
                      key={peer.id}
                      className="bg-[#FFF9F2] p-3 rounded-2xl border border-[#7E4228]/20 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#7E4228] p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <OtterAvatar config={peer.otter} size="xs" animate={false} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-display font-black text-xs text-[#2D1B11] truncate">
                              {peer.display_name}
                            </p>
                            {peer.country_code && (
                              <div className="scale-75">
                                <CountryFlag countryCode={peer.country_code} size="xs" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-[#7E4228] truncate font-medium">
                            {peer.degree_program || peer.school || 'Student'}
                          </p>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                              isPeerConnectedToMe
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-[#E5DFD9] text-[#7E4228]'
                            }`}
                          >
                            {isPeerConnectedToMe ? 'Connected ✓' : 'Not Connected'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onOpenAnotherProfile) {
                            onOpenAnotherProfile(peer)
                          }
                        }}
                        className="py-1.5 px-3 rounded-xl bg-[#FAF2E6] hover:bg-[#E5DFD9] border border-[#7E4228]/20 text-[11px] font-black text-[#4C271A] transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        Visit Profile
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Footer Actions ("Interaction first, connection second") */}
        {!isMe && (
          <div className="p-4 bg-[#FFF9F2] border-t border-[#7E4228]/15 space-y-2">
            {isBusyOrOffline && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {user.display_name} is currently {statusLabel.toLowerCase()}. Session invites are unavailable right now.
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              {/* Connect Button: ONLY if user has completed a session and is not already connected */}
              {!isAlreadyConnected && hasHadSession && (
                <button
                  onClick={handleConnect}
                  disabled={connecting || hasPendingSent}
                  className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>
                    {hasPendingSent ? 'Request Sent' : connecting ? 'Connecting...' : 'Connect'}
                  </span>
                </button>
              )}

              {/* Study in Duo Button */}
              <button
                onClick={handleStudyInDuo}
                disabled={isBusyOrOffline || inviting || inviteSent}
                className={`py-3 px-4 rounded-2xl font-black text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  !isAlreadyConnected && hasHadSession ? 'flex-1' : 'w-full'
                } ${
                  isBusyOrOffline
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-[#7E4228] hover:bg-[#6D3821]'
                }`}
              >
                <Video className="w-4 h-4 fill-white" />
                <span>
                  {inviteSent ? 'Invite Sent!' : inviting ? 'Sending...' : 'Study in Duo'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
