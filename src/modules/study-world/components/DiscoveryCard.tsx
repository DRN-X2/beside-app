import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, MapPin, UserCheck, Clock, UserX, Check, Video } from 'lucide-react'
import OtterAvatar from '../../../components/OtterAvatar'
import type { OpenWorldUser } from '../../../services/openWorldService'
import { sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest } from '../../../services/openWorldService'
import { useAuthStore } from '../../../store/authStore'

const NEU_BASE = '#2B1C13'
const NEU_DARK = '#180D08'
const NEU_LIGHT = '#3E2A1E'
const NEU_SHADOW = `4px 4px 10px ${NEU_DARK}, -3px -3px 8px ${NEU_LIGHT}`
const NEU_INSET = `inset 3px 3px 7px ${NEU_DARK}, inset -2px -2px 6px ${NEU_LIGHT}`

interface DiscoveryCardProps {
  user: OpenWorldUser
  onClose: () => void
  onConnected: () => void
}

const STATUS_LABEL: Record<string, string> = {
  available: '🟢 Available',
  online:    '🟢 Available',
  studying:  '🔵 In Duo',
  looking:   '🟣 In Squad',
  away:      '🟡 Away',
  offline:   '⚫ Offline',
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ user, onClose, onConnected }) => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState(user.connectionStatus)

  const handleConnect = async () => {
    if (!profile?.id) return
    setLoading(true)
    const { error } = await sendConnectionRequest(profile.id, user.id)
    if (!error) setLocalStatus('REQUEST_SENT')
    setLoading(false)
  }

  const handleAccept = async () => {
    if (!user.connectionId) return
    setLoading(true)
    const { error } = await acceptConnectionRequest(user.connectionId)
    if (!error) { setLocalStatus('CONNECTED'); onConnected() }
    setLoading(false)
  }

  const handleDecline = async () => {
    if (!user.connectionId) return
    setLoading(true)
    const { error } = await declineConnectionRequest(user.connectionId)
    if (!error) setLocalStatus('DECLINED')
    setLoading(false)
  }

  const interests = (user.learning_interests || user.subjects || []).slice(0, 4)

  const statusDotColor = user.online_status === 'studying' ? '#3b82f6'
    : user.online_status === 'looking' ? '#8b5cf6'
    : user.online_status === 'offline' ? '#6b7280'
    : '#22c55e'

  return (
    <div className="fixed inset-0 z-[700] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden"
        style={{ background: NEU_BASE, boxShadow: '0 -8px 40px rgba(0,0,0,0.6), ' + NEU_SHADOW, borderRadius: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gold accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#7E4228,#C68642,#7E4228)' }} />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden"
                style={{ background: '#1E0F07', boxShadow: NEU_INSET }}>
                <OtterAvatar config={user.otter || user.otter_config} size="lg" />
              </div>
              {/* Status dot */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                style={{ backgroundColor: statusDotColor, borderColor: NEU_BASE, boxShadow: `0 0 6px ${statusDotColor}` }} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-display font-black text-[#F5E8D0] text-base leading-tight truncate">
                {user.display_name}
              </h3>
              <p className="text-[11px] text-[#C68642] font-bold mt-0.5 truncate">
                {user.degree_program || user.degree_code}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-[#8B5E3C]" />
                <span className="text-[10px] text-[#9B7B5A]">
                  {[user.city, user.country].filter(Boolean).join(', ')}
                </span>
              </div>
              <p className="text-[10px] text-[#8B8B6B] mt-0.5">
                {STATUS_LABEL[user.online_status || 'offline'] || '⚫ Offline'}
              </p>
            </div>

            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-[#9B7B5A] flex-shrink-0 transition-all active:scale-95"
              style={{ background: NEU_BASE, boxShadow: NEU_SHADOW, borderRadius: '50%' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interests */}
          {interests.length > 0 && (
            <div className="mb-4">
              <p className="text-[9px] font-black text-[#C68642] uppercase tracking-widest mb-1.5">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {interests.map(i => (
                  <span key={i} className="px-2.5 py-1 text-[10px] font-semibold text-[#C68642]"
                    style={{ background: NEU_BASE, boxShadow: NEU_SHADOW, borderRadius: '10px' }}>
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Privacy notice */}
          {localStatus !== 'CONNECTED' && (
            <div className="mb-4 p-2.5 text-center"
              style={{ background: NEU_BASE, boxShadow: NEU_INSET, borderRadius: '14px' }}>
              <p className="text-[10px] text-[#9B7B5A] leading-tight">
                Connect to unlock {user.display_name.split(' ')[0]}'s full learner profile
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {localStatus === 'NONE' && (
              <button
                onClick={() => {
                  onClose()
                  navigate('/duo')
                }}
                className="w-full py-3.5 flex items-center justify-center gap-2 font-display font-black text-sm text-[#F5E8D0] transition-all active:scale-98 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg,#7E4228,#A0562E)',
                  boxShadow: '0 4px 20px rgba(126,66,40,0.5), ' + NEU_SHADOW,
                  borderRadius: '18px',
                }}>
                <Video className="w-4 h-4" />
                Study in Duo
              </button>
            )}
            {localStatus === 'REQUEST_SENT' && (
              <div className="w-full py-3.5 flex items-center justify-center gap-2 text-[#9B7B5A] font-display font-black text-sm"
                style={{ background: NEU_BASE, boxShadow: NEU_INSET, borderRadius: '18px' }}>
                <Clock className="w-4 h-4" /> Request Sent
              </div>
            )}
            {localStatus === 'REQUEST_RECEIVED' && (
              <div className="flex gap-2">
                <button onClick={handleAccept} disabled={loading}
                  className="flex-1 py-3.5 flex items-center justify-center gap-2 text-white font-display font-black text-sm transition-all active:scale-98 disabled:opacity-50"
                  style={{ background: '#15803d', boxShadow: '0 4px 16px rgba(21,128,61,0.4)', borderRadius: '18px' }}>
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button onClick={handleDecline} disabled={loading}
                  className="flex-1 py-3.5 flex items-center justify-center gap-2 text-[#9B7B5A] font-display font-black text-sm transition-all active:scale-98"
                  style={{ background: NEU_BASE, boxShadow: NEU_SHADOW, borderRadius: '18px' }}>
                  <UserX className="w-4 h-4" /> Decline
                </button>
              </div>
            )}
            {localStatus === 'CONNECTED' && (
              <div className="w-full py-3.5 flex items-center justify-center gap-2 text-[#F5E8D0] font-display font-black text-sm"
                style={{ background: 'linear-gradient(135deg,#7E4228,#C68642)', boxShadow: '0 4px 20px rgba(198,134,66,0.3)', borderRadius: '18px' }}>
                <UserCheck className="w-4 h-4" /> Connected · Profile Unlocked
              </div>
            )}
            {localStatus === 'DECLINED' && (
              <div className="w-full py-3.5 flex items-center justify-center gap-2 text-[#6b7280] font-display font-bold text-sm"
                style={{ background: NEU_BASE, boxShadow: NEU_INSET, borderRadius: '18px' }}>
                <UserX className="w-4 h-4" /> Request Declined
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
