import React from 'react'
import { X, MapPin, BookOpen, Zap, Star, UserCheck } from 'lucide-react'
import OtterAvatar from '../../../components/OtterAvatar'
import type { OpenWorldUser } from '../../../services/openWorldService'

const NEU_BASE = '#2B1C13'
const NEU_DARK = '#180D08'
const NEU_LIGHT = '#3E2A1E'
const NEU_SHADOW = `4px 4px 10px ${NEU_DARK}, -3px -3px 8px ${NEU_LIGHT}`
const NEU_INSET = `inset 3px 3px 7px ${NEU_DARK}, inset -2px -2px 6px ${NEU_LIGHT}`

interface ConnectedProfileModalProps {
  user: OpenWorldUser
  onClose: () => void
}

export const ConnectedProfileModal: React.FC<ConnectedProfileModalProps> = ({ user, onClose }) => {
  const interests = user.learning_interests || user.subjects || []
  const skills = user.skills || []

  const statusDotColor = user.online_status === 'studying' ? '#3b82f6'
    : user.online_status === 'looking' ? '#8b5cf6'
    : user.online_status === 'offline' ? '#6b7280'
    : '#22c55e'

  return (
    <div className="fixed inset-0 z-[700] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden max-h-[85vh] overflow-y-auto"
        style={{ background: NEU_BASE, boxShadow: '0 -8px 40px rgba(0,0,0,0.7), ' + NEU_SHADOW, borderRadius: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gold bar */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#7E4228,#C68642,#7E4228)' }} />

        {/* Connected badge */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-1.5 px-3 py-1"
            style={{
              background: 'linear-gradient(135deg,rgba(198,134,66,0.15),rgba(126,66,40,0.15))',
              boxShadow: NEU_INSET,
              borderRadius: '20px',
            }}>
            <UserCheck className="w-3 h-3 text-[#C68642]" />
            <span className="text-[10px] font-black text-[#C68642] uppercase tracking-wider">Connected</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#9B7B5A] transition-all active:scale-95"
            style={{ background: NEU_BASE, boxShadow: NEU_SHADOW, borderRadius: '50%' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-3xl overflow-hidden"
                style={{ background: '#1A0D07', boxShadow: '0 0 0 2.5px #C68642, ' + NEU_INSET }}>
                <OtterAvatar config={user.otter || user.otter_config} size="xl" animate />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2"
                style={{ backgroundColor: statusDotColor, borderColor: NEU_BASE, boxShadow: `0 0 8px ${statusDotColor}` }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-black text-[#F5E8D0] text-xl leading-tight">
                {user.display_name}
              </h2>
              {user.school && (
                <p className="text-[11px] text-[#C68642] font-bold mt-0.5">{user.school}</p>
              )}
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-[#8B5E3C]" />
                <span className="text-[11px] text-[#9B7B5A]">
                  {[user.city, user.country].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* Academic info */}
          <div className="mb-4 p-3.5 flex items-start gap-2"
            style={{ background: NEU_BASE, boxShadow: NEU_INSET, borderRadius: '18px' }}>
            <BookOpen className="w-4 h-4 text-[#C68642] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-black text-[#F5E8D0]">
                {user.degree_program || user.degree_code}
              </p>
              <p className="text-[10px] text-[#9B7B5A] mt-0.5">
                {[user.year_level, user.education_status].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          {/* Interests */}
          {interests.length > 0 && (
            <div className="mb-4">
              <p className="text-[9px] font-black text-[#C68642] uppercase tracking-widest mb-2">Learning Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {interests.map(i => (
                  <span key={i} className="px-2.5 py-1 text-[10px] font-semibold text-[#D89A53]"
                    style={{ background: NEU_BASE, boxShadow: NEU_SHADOW, borderRadius: '10px' }}>
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mb-4">
              <p className="text-[9px] font-black text-[#C68642] uppercase tracking-widest mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => (
                  <span key={s} className="px-2.5 py-1 text-[10px] font-semibold text-[#C68642] flex items-center gap-1"
                    style={{ background: NEU_BASE, boxShadow: NEU_SHADOW, borderRadius: '10px' }}>
                    <Zap className="w-2.5 h-2.5" />{s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Study style */}
          {user.study_style && (
            <div className="p-3 flex items-center gap-2"
              style={{ background: NEU_BASE, boxShadow: NEU_INSET, borderRadius: '14px' }}>
              <Star className="w-3.5 h-3.5 text-[#C68642]" />
              <span className="text-[10px] font-bold text-[#F5E8D0] capitalize">
                {user.study_style} study style
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
