import React, { useEffect, useState } from 'react'
import { ArrowLeft, Check, X, Users, Heart, Bell, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import OtterAvatar from '../components/OtterAvatar'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { useConnectionStore } from '../store/connectionStore'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { getRelationshipLevel, getRelationshipColor } from '../services/relationships'
import type { DemoUser } from '../types'

export default function ConnectionsPage() {
  const { connections, acceptRequestDB, rejectRequestDB, fetchConnections } = useConnectionStore()
  const { profile } = useAuthStore()
  const { notifications, togglePanel } = useNotificationStore()
  const navigate = useNavigate()

  const [pendingDeclineId, setPendingDeclineId] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.id) {
      fetchConnections(profile.id)
    }
  }, [profile?.id, fetchConnections])

  if (!profile) return null

  const accepted = Object.values(connections).filter((c) => c.status === 'accepted')
  const pendingReceived = Object.values(connections).filter((c) => c.status === 'pending_received')
  const pendingSent = Object.values(connections).filter((c) => c.status === 'pending_sent')

  return (
    <div className="min-h-[100dvh] bg-[#F1F1F1] text-[#4C271A] p-4 max-w-md mx-auto select-none pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl neu-btn-circle-light flex items-center justify-center text-[#4C271A] active:scale-95 transition-transform cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-black text-[#4C271A] tracking-tight">Connections</h1>
            <p className="text-xs text-[#7E4228] font-bold">Your network of study buddies</p>
          </div>
        </div>

        <button
          onClick={togglePanel}
          className="w-10 h-10 rounded-2xl neu-card flex items-center justify-center text-[#4C271A] hover:text-[#7E4228] active:scale-95 transition-all relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[2.2]" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E0533C] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#F1F1F1] animate-bounce shadow-sm">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-black text-[#7E4228] uppercase tracking-wider mb-3">
            Study Requests
          </h2>
          <div className="space-y-3">
            {pendingReceived.map((conn) => (
              <div key={conn.user.id} className="neu-card p-4 flex items-center gap-3">
                <div
                  onClick={() => navigate(`/profile/${conn.user.id}`, { state: { viewUser: conn.user } })}
                  className="cursor-pointer"
                >
                  <OtterAvatar config={conn.user.otter} size="sm" />
                </div>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/profile/${conn.user.id}`, { state: { viewUser: conn.user } })}
                >
                  <p className="font-bold text-sm text-[#4C271A] truncate">{conn.user.display_name}</p>
                  <p className="text-xs text-[#7E4228] font-semibold">{conn.compatibility.score}% compatible</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingDeclineId(conn.user.id)}
                    className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center active:scale-95 border border-red-200 cursor-pointer"
                    title="Decline"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => acceptRequestDB(conn.user.id)}
                    className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center active:scale-95 shadow-sm cursor-pointer"
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
            Study Buddies
          </h2>
          <div className="space-y-3">
            {accepted.map((conn) => {
              const level = getRelationshipLevel(conn.sessionCount)
              const levelColor = getRelationshipColor(level)
              return (
                <div key={conn.user.id} className="neu-card p-4 flex items-center gap-3">
                  <div
                    onClick={() => navigate(`/profile/${conn.user.id}`, { state: { viewUser: conn.user } })}
                    className="cursor-pointer"
                  >
                    <OtterAvatar config={conn.user.otter} size="md" />
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/profile/${conn.user.id}`, { state: { viewUser: conn.user } })}
                  >
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
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/profile/${conn.user.id}`, { state: { viewUser: conn.user } })}
                      className="px-2.5 py-2 rounded-xl bg-[#FAF2E6] hover:bg-[#E5DFD9] text-[#7E4228] text-xs font-bold border border-[#7E4228]/20 transition-all cursor-pointer"
                      title="Visit Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate('/duo', { state: { partner: conn.user } })}
                      className="px-3.5 py-2 rounded-xl bg-[#7E4228] text-white text-xs font-black flex items-center gap-1.5 shadow-sm hover:bg-[#6D3821] active:scale-95 transition-all cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Study</span>
                    </button>
                  </div>
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
                  <p className="font-bold text-sm text-[#4C271A] truncate">{conn.user.display_name}</p>
                  <p className="text-xs text-[#7E4228]">Request pending acceptance...</p>
                </div>
                <span className="text-[10px] font-bold text-[#7E4228] bg-[#7E4228]/10 px-2.5 py-1 rounded-full">
                  Waiting
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {accepted.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && (
        <div className="neu-card p-8 text-center mt-6">
          <div className="w-16 h-16 rounded-full neu-inset flex items-center justify-center mx-auto mb-4 text-[#7E4228]">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-display font-black text-lg text-[#4C271A] mb-1">No connections yet</h3>
          <p className="text-xs text-[#7E4228] mb-6">
            Swipe through peers in Duo Discovery or explore Study World to build your study buddy network!
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="w-full py-3 rounded-2xl bg-[#7E4228] text-white font-black text-sm shadow-md active:scale-98 transition-transform cursor-pointer"
          >
            Find Study Buddies
          </button>
        </div>
      )}

      {/* Decline Request Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(pendingDeclineId)}
        title="Decline Connection Request?"
        message="Are you sure you want to decline this connection request?"
        confirmText="Yes, Decline"
        cancelText="Cancel"
        variant="warning"
        onConfirm={async () => {
          if (pendingDeclineId) {
            await rejectRequestDB(pendingDeclineId)
            setPendingDeclineId(null)
          }
        }}
        onCancel={() => setPendingDeclineId(null)}
      />
    </div>
  )
}
