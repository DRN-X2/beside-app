import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  X,
  UserCheck,
  Video,
  Users,
  Check,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useNotificationStore, type LiveNotification } from '../store/notificationStore'
import { useAuthStore } from '../store/authStore'
import { useConnectionStore } from '../store/connectionStore'
import { useSessionStore } from '../store/sessionStore'
import {
  acceptLiveConnectRequest,
  acceptLiveDuoInvite,
  declineLiveDuoInvite,
  joinLiveSquadLobby,
  declineLiveSquadInvite,
  subscribeToActiveSession,
} from '../services/realtimeHub'
import OtterAvatar from './OtterAvatar'
import { supabase } from '../lib/supabase'

export const NotificationCenterModal: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const {
    notifications,
    isPanelOpen,
    setPanelOpen,
    removeNotification,
    updateNotificationStatus,
    clearAll,
  } = useNotificationStore()
  const { addSessionConnection } = useConnectionStore()
  const { startSessionLocally } = useSessionStore()

  // Real-time ticking every 5 seconds so ages and expiration update live
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(timer)
  }, [])

  if (!isPanelOpen || !profile) return null
  const currentUser = profile

  const handleAcceptConnect = async (notif: LiveNotification) => {
    await acceptLiveConnectRequest(notif.fromUser, currentUser)
    addSessionConnection(
      notif.fromUser,
      {
        score: 90,
        reasons: ['Connected peer'],
        breakdown: {
          subjects: 90,
          studyStyle: 90,
          availability: 90,
          location: 90,
          goals: 90,
        },
      },
      0,
      0
    )
    removeNotification(notif.id)
  }

  const handleAcceptDuo = async (notif: LiveNotification) => {
    const sessionId = notif.data?.sessionId;
    if (!sessionId) return;

    const startedAt = new Date();
    const duration = (notif.data?.duration as any) || 30;
    const endsAt = new Date(startedAt.getTime() + duration * 60000);

    // Update DB Session
    await supabase.from('sessions').update({
       status: 'active',
       started_at: startedAt.toISOString(),
       ends_at: endsAt.toISOString(),
    }).eq('id', sessionId)
    
    // Create DB participant
    await supabase.from('session_participants').insert({
       session_id: sessionId,
       user_id: currentUser.id,
       status: 'joined'
    })

    await acceptLiveDuoInvite({
      toUserId: notif.fromUser.id,
      fromUser: currentUser,
      sessionId,
      duration,
      subject: notif.data?.subject || '',
    })

    subscribeToActiveSession(sessionId)
    startSessionLocally(
      sessionId,
      notif.fromUser,
      duration,
      startedAt,
      endsAt
    )
    removeNotification(notif.id)
    setPanelOpen(false)
    navigate('/duo')
  }

  const handleDeclineDuo = async (notif: LiveNotification) => {
    await declineLiveDuoInvite({
      toUserId: notif.fromUser.id,
      fromUser: currentUser,
    })
    removeNotification(notif.id)
  }

  const handleAcceptSquad = async (notif: LiveNotification) => {
    if (notif.data?.lobbyId) {
      await supabase.from('session_participants').upsert({
         session_id: notif.data.lobbyId,
         user_id: currentUser.id,
         status: 'joined',
         slot_index: notif.data.slotIndex ?? 1
      }, { onConflict: 'session_id,user_id' })

      await joinLiveSquadLobby({
        hostUserId: notif.fromUser.id,
        joiningUser: currentUser,
        lobbyId: notif.data.lobbyId,
        slotIndex: notif.data.slotIndex ?? 1,
      })
    }
    removeNotification(notif.id)
    setPanelOpen(false)
    navigate('/squad', { state: { lobbyId: notif.data?.lobbyId } })
  }

  const handleDeclineSquad = async (notif: LiveNotification) => {
    if (notif.data?.lobbyId) {
      await supabase.from('session_participants').delete().match({
         session_id: notif.data.lobbyId,
         user_id: currentUser.id
      })

      await declineLiveSquadInvite({
        hostUserId: notif.fromUser.id,
        decliningUserId: currentUser.id,
        lobbyId: notif.data.lobbyId,
        slotIndex: notif.data.slotIndex ?? 1,
      })
    }
    removeNotification(notif.id)
  }

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  const isNotificationPastOrExpired = (notif: LiveNotification) => {
    if (notif.status === 'expired' || notif.status === 'declined' || notif.status === 'accepted') return true
    if (['duo_invite', 'squad_invite'].includes(notif.type)) {
      return Date.now() - notif.createdAt > 5 * 60 * 1000
    }
    return false
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#FAF2E6] rounded-3xl border-2 border-[#7E4228]/25 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up text-[#4C271A]">
        {/* Header */}
        <div className="p-4 border-b border-[#7E4228]/15 flex items-center justify-between bg-[#FFF9F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7E4228] text-white flex items-center justify-center shadow-sm">
              <Bell className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#4C271A] leading-tight">
                Notifications
              </h2>
              <p className="text-[10px] font-bold text-[#7E4228] uppercase tracking-wider">
                {notifications.length} {notifications.length === 1 ? 'Alert' : 'Alerts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="px-2.5 py-1 rounded-xl bg-[#E5DFD9] hover:bg-[#D8D0C7] text-[#4C271A] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={() => setPanelOpen(false)}
              className="w-8 h-8 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#4C271A] cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EFE6D8] border border-[#7E4228]/20 flex items-center justify-center mb-3 text-[#7E4228]/60 shadow-inner">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="font-display font-black text-base text-[#4C271A] mb-1">
                No Notifications Yet
              </h3>
              <p className="text-xs text-[#7E4228] max-w-[220px]">
                When study buddies invite you to Duo calls or Squad lobbies, they will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isPast = isNotificationPastOrExpired(notif)
              return (
                <div
                  key={notif.id}
                  className={`bg-[#FFF9F2] rounded-2xl p-3.5 border border-[#7E4228]/20 shadow-sm flex flex-col gap-2.5 transition-all ${
                    isPast ? 'opacity-85' : ''
                  }`}
                >
                  {/* Top Row: User + Type */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#7E4228] p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                        <OtterAvatar config={notif.fromUser.otter} size="sm" animate={false} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-black text-sm text-[#4C271A] truncate">
                          {notif.fromUser.display_name}
                        </p>
                        <p className="text-[11px] text-[#7E4228] font-medium leading-tight truncate">
                          {notif.type === 'connect_request' && 'Sent you a connection request'}
                          {notif.type === 'duo_invite' && `Invited you to a ${notif.data?.duration || 30}m Duo Study Session`}
                          {notif.type === 'squad_invite' && 'Invited you to join their Squad lobby'}
                          {notif.type === 'connect_accepted' && 'Accepted your connection request!'}
                        </p>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold text-[#875F49] flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTime(notif.createdAt)}</span>
                    </span>
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#7E4228]/10">
                    {isPast ? (
                      <div className="flex items-center justify-between w-full">
                        <div>
                          {notif.status === 'declined' ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-red-100 text-red-700 text-[10px] font-bold">
                              Declined
                            </span>
                          ) : notif.status === 'accepted' ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Joined
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#EFE6D8] text-[#7E4228] text-[10px] font-bold">
                              Expired
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeNotification(notif.id)}
                          className="p-1 rounded-lg text-[#7E4228] hover:bg-[#E5DFD9] transition-colors cursor-pointer"
                          title="Remove notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {notif.type === 'connect_request' && (
                          <>
                            <button
                              onClick={() => {
                                updateNotificationStatus(notif.id, 'declined')
                                removeNotification(notif.id)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#E5DFD9] hover:bg-[#D8D0C7] text-xs font-bold text-[#4C271A] cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => {
                                updateNotificationStatus(notif.id, 'accepted')
                                handleAcceptConnect(notif)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#7E4228] hover:bg-[#6D3821] text-xs font-black text-white shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                          </>
                        )}

                        {notif.type === 'duo_invite' && (
                          <>
                            <button
                              onClick={() => {
                                updateNotificationStatus(notif.id, 'declined')
                                handleDeclineDuo(notif)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#E5DFD9] hover:bg-[#D8D0C7] text-xs font-bold text-[#4C271A] cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => {
                                updateNotificationStatus(notif.id, 'accepted')
                                handleAcceptDuo(notif)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#7E4228] hover:bg-[#6D3821] text-xs font-black text-white shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                            >
                              <Video className="w-3.5 h-3.5 fill-white" />
                              <span>Join Call</span>
                            </button>
                          </>
                        )}

                        {notif.type === 'squad_invite' && (
                          <>
                            <button
                              onClick={() => {
                                updateNotificationStatus(notif.id, 'declined')
                                handleDeclineSquad(notif)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#E5DFD9] hover:bg-[#D8D0C7] text-xs font-bold text-[#4C271A] cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => {
                                updateNotificationStatus(notif.id, 'accepted')
                                handleAcceptSquad(notif)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#7E4228] hover:bg-[#6D3821] text-xs font-black text-white shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Join Lobby</span>
                            </button>
                          </>
                        )}

                        {notif.type === 'connect_accepted' && (
                          <button
                            onClick={() => removeNotification(notif.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#7E4228] text-white text-xs font-bold cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
