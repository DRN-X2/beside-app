import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, MapPin, Video, UserPlus, UserCheck, AlertCircle } from 'lucide-react'
import OtterAvatar from '../../../components/OtterAvatar'
import { CountryFlag } from '../../../shared/components/CountryFlag'
import type { OpenWorldUser } from '../../../services/openWorldService'
import { sendConnectionRequest } from '../../../services/openWorldService'
import { useAuthStore } from '../../../store/authStore'
import { useConnectionStore, hasCompletedSessionWith } from '../../../store/connectionStore'
import { LearnerProfileModal } from '../../../components/LearnerProfileModal'

interface DiscoveryCardProps {
  user: OpenWorldUser
  onClose: () => void
  onConnected: () => void
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  online:    'Available',
  studying:  'In Duo Call',
  looking:   'In Squad',
  away:      'Away',
  offline:   'Offline',
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ user, onClose, onConnected }) => {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuthStore()
  const { connections, sendRequestDB } = useConnectionStore()

  const [loading, setLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [visitedUser, setVisitedUser] = useState<any>(user)
  const [requestSent, setRequestSent] = useState(false)

  const isMe = currentUser?.id === user.id
  const isAlreadyConnected = connections[user.id]?.status === 'accepted' || user.connectionStatus === 'CONNECTED'
  const hasHadSession = hasCompletedSessionWith(user.id)
  const isPending = connections[user.id]?.status === 'pending_sent' || requestSent

  const isBusyOrOffline = ['studying', 'looking', 'offline'].includes(user.online_status || '')

  const handleConnect = async () => {
    if (!currentUser?.id || isAlreadyConnected || isPending) return
    setLoading(true)
    try {
      await sendRequestDB(user as any)
      await sendConnectionRequest(currentUser.id, user.id)
      setRequestSent(true)
      onConnected()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStudy = () => {
    if (isBusyOrOffline) return
    onClose()
    navigate('/duo', { state: { partner: user, initiated: true } })
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[700] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md bg-[#FAF2E6] rounded-3xl border-2 border-[#7E4228]/25 shadow-2xl overflow-hidden animate-slide-up text-[#4C271A]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Warm Terracotta Accent */}
          <div className="h-1.5 w-full bg-[#7E4228]" />

          <div className="p-5">
            {/* Header / Avatar Row */}
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar with country flag */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-[#7E4228] p-1 flex items-center justify-center shadow-md overflow-hidden">
                  <OtterAvatar config={user.otter || user.otter_config} size="md" animate={false} />
                </div>
                {user.country_code && (
                  <div className="absolute -bottom-1 -right-1 scale-90 rounded-full ring-2 ring-white shadow-xs">
                    <CountryFlag countryCode={user.country_code} size="xs" />
                  </div>
                )}
              </div>

              {/* Basic Learner Info Only (Minimal) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-lg text-[#2D1B11] truncate">
                    {user.display_name}
                  </h3>
                  {isAlreadyConnected && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                      <UserCheck className="w-2.5 h-2.5" />
                      <span>Connected</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#7E4228] font-bold mt-0.5 truncate">
                  {user.degree_program || user.degree_code || 'Learner'} · {user.school || 'Student'}
                </p>

                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#875F49] font-medium">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#7E4228]" />
                    <span>{[user.city, user.country].filter(Boolean).join(', ') || 'Global'}</span>
                  </div>
                  <span>·</span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                      user.online_status === 'studying'
                        ? 'bg-blue-100 text-blue-800'
                        : user.online_status === 'looking'
                        ? 'bg-purple-100 text-purple-800'
                        : user.online_status === 'offline'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {STATUS_LABEL[user.online_status || 'offline'] || 'Offline'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#4C271A] cursor-pointer hover:bg-[#E5DFD9] transition-colors"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Offline or in-call warning message */}
            {isBusyOrOffline && (
              <div className="mb-4 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {user.display_name} is currently {STATUS_LABEL[user.online_status || 'offline'].toLowerCase()}. Session invites cannot be sent right now.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                {/* Visit Profile Button */}
                <button
                  onClick={() => {
                    setVisitedUser(user)
                    setShowProfileModal(true)
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#FFF9F2] hover:bg-[#F3E7D5] text-[#2D1B11] font-black text-xs border border-[#7E4228]/25 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
                >
                  Visit Profile
                </button>

                {/* Connect Button: ONLY visible if a session has been completed with this user and not already connected */}
                {!isAlreadyConnected && hasHadSession && (
                  <button
                    onClick={handleConnect}
                    disabled={loading || isPending}
                    className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isPending ? 'Request Sent' : loading ? 'Connecting...' : 'Connect'}</span>
                  </button>
                )}
              </div>

              {/* Study in Duo Button */}
              {!isMe && (
                <button
                  onClick={handleStudy}
                  disabled={isBusyOrOffline}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                    isBusyOrOffline
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-[#7E4228] hover:bg-[#6D3821]'
                  }`}
                >
                  <Video className="w-4 h-4 fill-white" />
                  <span>Study in Duo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visited Profile Modal */}
      {showProfileModal && (
        <LearnerProfileModal
          user={visitedUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onOpenAnotherProfile={(newUser) => setVisitedUser(newUser)}
        />
      )}
    </>
  )
}
