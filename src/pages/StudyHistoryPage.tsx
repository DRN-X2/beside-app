import React from 'react'
import { ArrowLeft, Clock, Target, Users, ChevronRight, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import OtterAvatar from '../components/OtterAvatar'
import { useConnectionStore, getStoredPartnerStats, saveStoredPartnerStats } from '../store/connectionStore'
import { useAuthStore } from '../store/authStore'
import { getRelationshipLevel, getRelationshipColor, getRelationshipProgress, getNextLevelInfo } from '../services/relationships'
import { fetchUserDashboardStats, type UserDashboardStats } from '../services/xpService'

export default function StudyHistoryPage() {
  const { connections, fetchConnections } = useConnectionStore()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = React.useState<UserDashboardStats>({
    connectionsCount: 0,
    sessionsCount: 0,
    totalHours: 0,
    totalMinutes: 0,
    goalsCompleted: 0,
    streakDays: 0,
    sessionDates: [],
  })

  React.useEffect(() => {
    if (profile?.id) {
      fetchUserDashboardStats(profile.id).then(setStats)
      fetchConnections(profile.id)
    }
  }, [profile?.id, fetchConnections])

  // Auto-sync single partner stats with overall completed sessions if local session count was 0
  React.useEffect(() => {
    if (profile?.id && stats.sessionsCount > 0) {
      const acceptedList = Object.values(connections).filter((c) => c.status === 'accepted')
      if (acceptedList.length === 1) {
        const p = acceptedList[0]
        if (p.sessionCount < stats.sessionsCount) {
          const stored = getStoredPartnerStats(profile.id)
          stored[p.user.id] = {
            sessionCount: stats.sessionsCount,
            totalMinutes: stats.totalMinutes,
            goalsCompleted: stats.goalsCompleted,
          }
          saveStoredPartnerStats(profile.id, stored)
        }
      }
    }
  }, [connections, stats, profile?.id])

  if (!profile) return null

  const partners = Object.values(connections)
    .filter((c) => c.status === 'accepted')
    .sort((a, b) => b.sessionCount - a.sessionCount)

  const totalSessions = Math.max(stats.sessionsCount, partners.reduce((s, c) => s + c.sessionCount, 0))
  const totalHours = Math.max(stats.totalHours, partners.reduce((s, c) => s + c.totalMinutes, 0) / 60)
  const totalGoals = Math.max(stats.goalsCompleted, partners.reduce((s, c) => s + c.goalsCompleted, 0))

  return (
    <div className="min-h-[100dvh] bg-[#F1F1F1] text-[#4C271A] p-4 max-w-md mx-auto select-none pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl neu-btn-circle-light flex items-center justify-center text-[#4C271A] active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-black text-[#4C271A] tracking-tight">Learning Journey</h1>
          <p className="text-xs text-[#7E4228] font-bold">Every session builds your progress</p>
        </div>
      </div>

      {/* Overall stats Card in Secondary Brown #7E4228 */}
      <div className="bg-[#7E4228] text-white rounded-3xl p-5 mb-6 shadow-[0_8px_20px_-4px_rgba(76,39,26,0.22)] border border-[#4C271A]/20">
        <p className="text-xs font-black uppercase tracking-wider text-white/80 mb-3">Overall Progress</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="font-display text-2xl font-black text-white">{totalSessions}</div>
            <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-0.5">Sessions</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="font-display text-2xl font-black text-white">{totalHours.toFixed(1)}h</div>
            <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-0.5">Studied</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="font-display text-2xl font-black text-white">{totalGoals}</div>
            <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-0.5">Goals</div>
          </div>
        </div>
      </div>

      {/* Clean Zero / Empty State */}
      {partners.length === 0 && (
        <div className="neu-card p-8 flex flex-col items-center py-12 text-center my-6">
          <div className="w-24 h-24 rounded-full bg-[#E5DFD9] p-2 flex items-center justify-center mb-4 shadow-inner">
            <OtterAvatar config={profile.otter} size="lg" animate />
          </div>
          <h3 className="font-display font-black text-lg text-[#4C271A] mb-1">No sessions yet</h3>
          <p className="text-xs text-[#7E4228] font-semibold mb-6 max-w-[240px]">
            Connect with a learner and start your first Duo or Squad study session!
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="px-6 py-3 rounded-2xl bg-[#7E4228] text-white text-xs font-black shadow-md hover:bg-[#6D3821] active:scale-95 transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Find a Study Partner</span>
          </button>
        </div>
      )}

      {/* Partner cards */}
      {partners.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-[#7E4228] uppercase tracking-wider">
            Study History ({partners.length})
          </h2>
          {partners.map((conn) => {
            const effectiveSessionCount = Math.max(
              conn.sessionCount,
              partners.length === 1 && stats.sessionsCount > 0 ? stats.sessionsCount : 0
            )
            const effectiveTotalMinutes = Math.max(
              conn.totalMinutes,
              partners.length === 1 && stats.totalMinutes > 0 ? stats.totalMinutes : effectiveSessionCount * 30
            )
            const effectiveGoals = Math.max(
              conn.goalsCompleted,
              partners.length === 1 && stats.goalsCompleted > 0 ? stats.goalsCompleted : 0
            )

            const level = getRelationshipLevel(effectiveSessionCount)
            const progress = getRelationshipProgress(effectiveSessionCount)
            const next = getNextLevelInfo(effectiveSessionCount)
            const levelColor = getRelationshipColor(level)

            return (
              <div key={conn.user.id} className="neu-card p-4 space-y-3">
                {/* Partner header */}
                <div className="flex items-center gap-3">
                  <OtterAvatar config={conn.user.otter} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-black text-sm text-[#4C271A] truncate">{conn.user.display_name}</h3>
                    <p className="text-xs text-[#7E4228] truncate">{conn.user.degree_program}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${levelColor}`}>
                      {level}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-black text-[#7E4228] text-lg">{conn.compatibility.score}%</p>
                    <p className="text-[10px] font-bold text-[#7E4228]/80">match</p>
                  </div>
                </div>

                {/* Relationship progress */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#7E4228] font-bold mb-1">
                    <span>Relationship Progress</span>
                    {next ? (
                      <span>{next.sessionsNeeded} sessions to {next.nextLevel}</span>
                    ) : (
                      <span className="text-emerald-700 font-black">Max Level Achieved ✨</span>
                    )}
                  </div>
                  <div className="h-2.5 bg-[#E5DFD9] rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                      className="h-full bg-[#7E4228] rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#EAE5E0] rounded-xl p-2 border border-[#7E4228]/15">
                    <div className="font-black text-sm text-[#4C271A]">{effectiveSessionCount}</div>
                    <div className="text-[10px] text-[#7E4228] font-bold">Sessions</div>
                  </div>
                  <div className="bg-[#EAE5E0] rounded-xl p-2 border border-[#7E4228]/15">
                    <div className="font-black text-sm text-[#4C271A]">{(effectiveTotalMinutes / 60).toFixed(1)}h</div>
                    <div className="text-[10px] text-[#7E4228] font-bold">Hours</div>
                  </div>
                  <div className="bg-[#EAE5E0] rounded-xl p-2 border border-[#7E4228]/15">
                    <div className="font-black text-sm text-[#4C271A]">{effectiveGoals}</div>
                    <div className="text-[10px] text-[#7E4228] font-bold">Goals</div>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => navigate('/duo', { state: { partner: conn.user } })}
                  className="w-full py-2.5 rounded-xl bg-[#7E4228] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#6D3821] active:scale-95 transition-all"
                >
                  <span>Study Again</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
