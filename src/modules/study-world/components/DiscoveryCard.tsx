import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  MapPin,
  Clock,
  Video,
  UserPlus,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import { CountryFlag } from '../../../shared/components/CountryFlag'
import type { OpenWorldUser } from '../../../services/openWorldService'
import { sendConnectionRequest } from '../../../services/openWorldService'
import { useAuthStore } from '../../../store/authStore'
import { useConnectionStore, hasCompletedSessionWith } from '../../../store/connectionStore'
import { usePresenceStore, getEffectiveOnlineStatus } from '../../../store/presenceStore'

interface DiscoveryCardProps {
  user: OpenWorldUser
  onClose: () => void
  onConnected: () => void
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  online: 'Available',
  studying: 'In Duo Call',
  looking: 'In Squad',
  away: 'Away',
  offline: 'Offline',
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ user, onClose, onConnected }) => {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuthStore()
  const { connections, sendRequestDB } = useConnectionStore()

  const [loading, setLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const isMe = currentUser?.id === user.id
  const isAlreadyConnected = connections[user.id]?.status === 'accepted' || user.connectionStatus === 'CONNECTED'
  const hasHadSession = hasCompletedSessionWith(user.id)
  const isPending = connections[user.id]?.status === 'pending_sent' || requestSent

  const isTargetOnline = usePresenceStore((s) => s.isUserOnline(user.id))
  const effectiveStatus = getEffectiveOnlineStatus(user, currentUser?.id, isTargetOnline)
  const isBusyOrOffline = ['studying', 'looking', 'offline'].includes(effectiveStatus)

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

  const handleVisitProfile = () => {
    onClose()
    navigate(`/profile/${user.id}`, { state: { viewUser: user } })
  }

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm clay-card-floating overflow-hidden select-none flex flex-col justify-between text-[#2D1B11] relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Badges & Close Button */}
        <div className="relative pt-5 pb-2 px-5 flex flex-col items-center justify-center">
          {/* Close Button Top Right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#4C271A] hover:bg-[#E5DFD9] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Online Status / Connected Pill Top Left */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
            <span
              className={`text-[11px] font-black px-3 py-1 rounded-full capitalize shadow-2xs ${
                effectiveStatus === 'studying'
                  ? 'bg-blue-100 text-blue-800'
                  : effectiveStatus === 'looking'
                  ? 'bg-purple-100 text-purple-800'
                  : effectiveStatus === 'offline'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {STATUS_LABEL[effectiveStatus] || 'Available'}
            </span>
            {isAlreadyConnected && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1 shadow-2xs">
                <UserCheck className="w-3 h-3 stroke-[3]" />
                <span>Connected</span>
              </span>
            )}
          </div>

          {/* Centered Large Circular Avatar with Country Flag Badge (Matching Duo Card) */}
          <div className="mt-8 mb-2 drop-shadow-md">
            <OtterAvatarWithBadge
              config={user.otter || user.otter_config}
              countryCode={user.country_code}
              showDegree={false}
              size="lg"
              bgCircleColor="clean"
            />
          </div>
        </div>

        {/* Minimal Content Info (Matching Duo Card: Centered name, degree, pills) */}
        <div className="px-5 py-2 flex flex-col justify-between text-[#2D1B11]">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="font-display font-black text-2xl text-[#2D1B11] truncate">
                {user.display_name}
              </h2>
              {user.country_code && (
                <div className="scale-90">
                  <CountryFlag countryCode={user.country_code} size="xs" />
                </div>
              )}
            </div>

            <p className="text-xs text-[#7A5A46] font-bold">
              {user.degree_program || user.degree_code || 'Learner'} · {user.school || 'Student'}
            </p>

            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[11px] font-bold text-[#875F49] clay-pill px-3 py-0.5">
                {user.year_level || 'Student'}
              </span>
              <span className="text-[11px] font-bold text-[#875F49] clay-pill px-3 py-0.5 capitalize">
                {user.study_style || 'Flexible'} style
              </span>
            </div>

            {/* Busy / Offline warning notice */}
            {isBusyOrOffline && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center justify-center gap-1.5 text-center">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Currently {STATUS_LABEL[effectiveStatus].toLowerCase()}. You can visit their profile below.
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="my-3 space-y-2">
            {/* Visit Profile Action Button */}
            <button
              type="button"
              onClick={handleVisitProfile}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-xs font-black text-[#4C271A] shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#7E4228]" />
              <span>Visit Full Profile</span>
            </button>

            {/* Connect Button: Only if session completed with this user and not yet connected */}
            {!isAlreadyConnected && hasHadSession && !isMe && (
              <button
                type="button"
                onClick={handleConnect}
                disabled={loading || isPending}
                className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isPending ? 'Connection Request Sent' : loading ? 'Connecting...' : 'Connect'}</span>
              </button>
            )}

            {/* Study in Duo Button */}
            {!isMe && (
              <button
                type="button"
                onClick={handleStudy}
                disabled={isBusyOrOffline}
                className={`w-full py-3 px-4 rounded-2xl font-black text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
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

          {/* Footer Metrics (Matching Duo Card) */}
          <div className="pt-2.5 border-t border-[#3D271D]/10 flex items-center justify-between text-xs text-[#7A5A46] font-bold">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8C471E]" />
              <span>{user.preferred_duration || 30} min session</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#8C471E]" />
              <span>{[user.city, user.country].filter(Boolean).join(', ') || 'Global'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
