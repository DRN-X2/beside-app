import React from 'react'
import { ArrowLeft, Check, X, Users, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import OtterAvatar from '../components/OtterAvatar'
import { useConnectionStore } from '../store/connectionStore'
import { useAuthStore } from '../store/authStore'
import { getRelationshipLevel, getRelationshipColor } from '../services/relationships'

export default function ConnectionsPage() {
  const { connections, acceptRequest, rejectRequest } = useConnectionStore()
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  if (!profile) return null

  const accepted = Object.values(connections).filter((c) => c.status === 'accepted')
  const pendingReceived = Object.values(connections).filter((c) => c.status === 'pending_received')
  const pendingSent = Object.values(connections).filter((c) => c.status === 'pending_sent')

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
          <h1 className="font-display text-2xl font-black text-[#4C271A] tracking-tight">Connections</h1>
          <p className="text-xs text-[#7E4228] font-bold">Your network of study buddies</p>
        </div>
      </div>

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-black text-[#7E4228] uppercase tracking-wider mb-3">
            Study Requests ({pendingReceived.length})
          </h2>
          <div className="space-y-3">
            {pendingReceived.map((conn) => (
              <div key={conn.user.id} className="neu-card p-4 flex items-center gap-3">
                <OtterAvatar config={conn.user.otter} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#4C271A] truncate">{conn.user.display_name}</p>
                  <p className="text-xs text-[#7E4228] font-semibold">{conn.compatibility.score}% compatible</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => rejectRequest(conn.user.id)}
                    className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center active:scale-95 border border-red-200"
                    title="Decline"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => acceptRequest(conn.user.id)}
                    className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center active:scale-95 shadow-sm"
                    title="Accept"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted connections */}
      {accepted.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-black text-[#7E4228] uppercase tracking-wider mb-3">
            Study Buddies ({accepted.length})
          </h2>
          <div className="space-y-3">
            {accepted.map((conn) => {
              const level = getRelationshipLevel(conn.sessionCount)
              const levelColor = getRelationshipColor(level)
              return (
                <div key={conn.user.id} className="neu-card p-4 flex items-center gap-3">
                  <OtterAvatar config={conn.user.otter} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-[#4C271A] truncate">{conn.user.display_name}</p>
                    <p className="text-xs text-[#7E4228] truncate">{conn.user.degree_program}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${levelColor}`}>
                        {level}
                      </span>
                      <span className="text-[10px] text-[#7E4228] font-bold">
                        {conn.sessionCount} {conn.sessionCount === 1 ? 'session' : 'sessions'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/duo', { state: { partner: conn.user } })}
                    className="px-3.5 py-2 rounded-xl bg-[#7E4228] text-white text-xs font-black flex items-center gap-1.5 shadow-sm hover:bg-[#6D3821] active:scale-95 transition-all"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Study</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-black text-[#7E4228] uppercase tracking-wider mb-3">
            Sent Requests ({pendingSent.length})
          </h2>
          <div className="space-y-3">
            {pendingSent.map((conn) => (
              <div key={conn.user.id} className="neu-card p-3.5 flex items-center gap-3 opacity-80">
                <OtterAvatar config={conn.user.otter} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-[#4C271A] truncate">{conn.user.display_name}</p>
                  <p className="text-[11px] text-[#7E4228]">Waiting for response...</p>
                </div>
                <span className="text-[10px] font-black text-[#7E4228] bg-[#E5DFD9] px-2.5 py-1 rounded-full border border-[#7E4228]/15">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clean Zero / Empty State */}
      {accepted.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && (
        <div className="neu-card p-8 flex flex-col items-center py-12 text-center my-6">
          <div className="w-24 h-24 rounded-full bg-[#E5DFD9] p-2 flex items-center justify-center mb-4 shadow-inner">
            <OtterAvatar config={profile.otter} size="lg" animate />
          </div>
          <h3 className="font-display font-black text-lg text-[#4C271A] mb-1">No connections yet</h3>
          <p className="text-xs text-[#7E4228] font-semibold mb-6 max-w-[240px]">
            Start discovering compatible peers and invite them for a Duo study session!
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="px-6 py-3 rounded-2xl bg-[#7E4228] text-white text-xs font-black shadow-md hover:bg-[#6D3821] active:scale-95 transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Discover Study Partners</span>
          </button>
        </div>
      )}
    </div>
  )
}
