import React, { useState, useRef } from 'react'
import { Search, MapPin, BookOpen, Clock, Heart, X, ChevronRight, CheckCircle, Star, Check } from 'lucide-react'
import OtterAvatar from '../components/OtterAvatar'
import { DEMO_USERS } from '../data/demoUsers'
import { calculateCompatibility, getCompatibilityColor, getCompatibilityLabel } from '../services/compatibility'
import { useAuthStore } from '../store/authStore'
import { useConnectionStore } from '../store/connectionStore'
import { useNavigate } from 'react-router-dom'
import type { DemoUser } from '../types'

const STUDY_STYLE_LABELS: Record<string, string> = {
  quiet: 'Quiet focus',
  discussion: 'Discussion',
  mixed: 'Mixed style',
  flexible: 'Flexible',
}

const DURATION_LABELS: Record<number, string> = {
  15: '15-min sessions',
  30: '30-min sessions',
  60: '60-min sessions',
}

export default function DiscoverPage() {
  const { profile } = useAuthStore()
  const { connections, sendRequest } = useConnectionStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  if (!profile) return null

  const users = DEMO_USERS
    .filter(u => {
      // Filter out already connected/pending
      const conn = connections[u.id]
      if (conn && (conn.status === 'accepted' || conn.status === 'pending_sent')) return false
      // Search
      if (search) {
        const q = search.toLowerCase()
        return u.display_name.toLowerCase().includes(q) ||
          u.degree_program.toLowerCase().includes(q) ||
          u.subjects.some(s => s.toLowerCase().includes(q)) ||
          u.city.toLowerCase().includes(q)
      }
      return true
    })
    .map(u => ({ user: u, compat: calculateCompatibility(profile, u) }))
    .sort((a, b) => b.compat.score - a.compat.score)

  const handleConnect = (user: DemoUser) => {
    const compat = calculateCompatibility(profile, user)
    sendRequest(user, compat)
    setSentIds(prev => new Set([...prev, user.id]))
    // Simulate auto-accept after 1 second for demo flow
    setTimeout(() => {
      useConnectionStore.getState().acceptRequest(user.id)
    }, 1500)
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="font-display text-xl font-bold text-beside-text">Find Your Study Beside</h1>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-3 w-4 h-4 text-beside-muted" />
          <input
            type="text"
            placeholder="Search by name, subject, program..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-10 text-sm"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-beside-secondary" />
          <span className="font-semibold text-beside-text text-sm">
            {search ? `${users.length} results` : 'Recommended for you'}
          </span>
        </div>

        {users.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <OtterAvatar config={profile.otter} size="lg" animate />
            <p className="mt-4 font-semibold text-beside-text">No learners found</p>
            <p className="text-sm text-beside-muted mt-1">Try a different search</p>
          </div>
        )}

        {users.map(({ user, compat }) => (
          <LearnerCard
            key={user.id}
            user={user}
            compat={compat}
            expanded={expandedId === user.id}
            onExpand={() => setExpandedId(expandedId === user.id ? null : user.id)}
            onConnect={() => handleConnect(user)}
            sent={sentIds.has(user.id) || connections[user.id]?.status === 'pending_sent'}
            accepted={connections[user.id]?.status === 'accepted'}
            onStartDuo={() => navigate('/duo', { state: { partner: user } })}
          />
        ))}
      </div>
    </div>
  )
}

interface LearnerCardProps {
  user: DemoUser
  compat: ReturnType<typeof calculateCompatibility>
  expanded: boolean
  onExpand: () => void
  onConnect: () => void
  sent: boolean
  accepted: boolean
  onStartDuo: () => void
}

function LearnerCard({ user, compat, expanded, onExpand, onConnect, sent, accepted, onStartDuo }: LearnerCardProps) {
  const compatColorClass = getCompatibilityColor(compat.score)
  const statusColor: Record<string, string> = {
    online: 'bg-green-400',
    studying: 'bg-blue-400',
    looking: 'bg-orange-400',
    away: 'bg-yellow-400',
    offline: 'bg-gray-300',
    available: 'bg-green-300',
  }
  const dotColor = statusColor[user.online_status] ?? 'bg-gray-300'

  return (
    <div className={`card transition-all duration-300 ${accepted ? 'ring-2 ring-green-400' : ''}`}>
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Avatar + status */}
        <div className="relative flex-shrink-0">
          <OtterAvatar config={user.otter} size="md" />
          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${dotColor} rounded-full border-2 border-white`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-beside-text">{user.display_name}</h3>
              <p className="text-xs text-beside-muted flex items-center gap-1">
                <MapPin className="w-3 h-3" />{user.city}, {user.country}
              </p>
            </div>
            {/* Compat score */}
            <div className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${compatColorClass}`}>
              {compat.score}% match
            </div>
          </div>

          {/* Program */}
          <p className="text-xs font-medium text-beside-secondary mt-1">
            {user.degree_program} · {user.year_level}
          </p>

          {/* Subjects */}
          <div className="flex flex-wrap gap-1 mt-2">
            {user.subjects.slice(0, 3).map(s => (
              <span key={s} className="text-xs bg-cocoa-100 text-beside-primary px-2 py-0.5 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>

          {/* Quick info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-beside-muted">
            <span>{STUDY_STYLE_LABELS[user.study_style]}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {DURATION_LABELS[user.preferred_duration]}
            </span>
          </div>
        </div>
      </div>

      {/* Compatibility reasons */}
      {compat.reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {compat.reasons.map(r => (
            <span key={r} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-tan-light animate-fade-in space-y-2">
          <div>
            <p className="text-xs font-semibold text-beside-muted uppercase tracking-wide mb-1">School</p>
            <p className="text-sm text-beside-text">{user.school}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-beside-muted uppercase tracking-wide mb-1">Interests</p>
            <div className="flex flex-wrap gap-1">
              {user.learning_interests.map(i => (
                <span key={i} className="text-xs bg-cocoa-100 text-beside-primary px-2 py-0.5 rounded-full">{i}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center bg-cream rounded-xl p-2">
              <div className="font-bold text-beside-primary">{compat.breakdown.subjects}%</div>
              <div className="text-beside-muted">Subjects</div>
            </div>
            <div className="text-center bg-cream rounded-xl p-2">
              <div className="font-bold text-beside-primary">{compat.breakdown.studyStyle}%</div>
              <div className="text-beside-muted">Style</div>
            </div>
            <div className="text-center bg-cream rounded-xl p-2">
              <div className="font-bold text-beside-primary">{compat.breakdown.availability}%</div>
              <div className="text-beside-muted">Schedule</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onExpand}
          className="btn-ghost flex-1 text-sm py-2"
        >
          {expanded ? 'Less' : 'View Profile'}
        </button>

        {accepted ? (
          <button
            onClick={onStartDuo}
            className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-1"
          >
            <Heart className="w-4 h-4" />
            Study Together
          </button>
        ) : sent ? (
          <div className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-beside-muted bg-cream rounded-xl font-medium">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Request Sent</span>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1"
          >
            Connect
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
