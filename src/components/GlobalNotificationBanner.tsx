import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, UserCheck, Video, Users, Check, X } from 'lucide-react'
import { useNotificationStore } from '../store/notificationStore'
import { useAuthStore } from '../store/authStore'
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

export const GlobalNotificationBanner: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { activeNotification, dismissNotification, removeNotification } = useNotificationStore()
  const { startSessionLocally } = useSessionStore()

  // Auto-dismiss after 20 seconds if not interacted with
  useEffect(() => {
    if (!activeNotification) return
    const timer = setTimeout(() => {
      dismissNotification()
    }, 20000)
    return () => clearTimeout(timer)
  }, [activeNotification, dismissNotification])

  if (!activeNotification || !profile) return null

  const { id: notifId, type, fromUser, data } = activeNotification

  const handleAcceptConnect = async () => {
    await acceptLiveConnectRequest(fromUser, profile)
    await removeNotification(notifId)
    dismissNotification()
  }

  const handleAcceptDuo = async () => {
    const sessionId = data?.sessionId
    if (!sessionId) return

    const duration = (data?.duration as any) || 30
    const startedAt = new Date()
    const endsAt = new Date(startedAt.getTime() + duration * 60000)

    await acceptLiveDuoInvite({
      toUserId: fromUser.id,
      fromUser: profile,
      sessionId,
      duration,
      subject: data?.subject || '',
    })

    subscribeToActiveSession(sessionId)
    startSessionLocally(
      sessionId,
      fromUser,
      duration,
      startedAt,
      endsAt
    )
    await removeNotification(notifId)
    dismissNotification()
    navigate('/duo')
  }

  const handleDeclineDuo = async () => {
    await declineLiveDuoInvite({
      toUserId: fromUser.id,
      fromUser: profile,
      sessionId: data?.sessionId,
    })
    await removeNotification(notifId)
    dismissNotification()
  }

  const handleAcceptSquad = async () => {
    if (data?.lobbyId) {
      await joinLiveSquadLobby({
        hostUserId: fromUser.id,
        joiningUser: profile,
        lobbyId: data.lobbyId,
        slotIndex: data.slotIndex ?? 1,
      })
      await removeNotification(notifId)
      dismissNotification()
      navigate('/squad', { state: { lobbyId: data.lobbyId } })
    } else {
      await removeNotification(notifId)
      dismissNotification()
      navigate('/squad')
    }
  }

  const handleDeclineSquad = async () => {
    if (data?.lobbyId) {
      await declineLiveSquadInvite({
        hostUserId: fromUser.id,
        decliningUserId: profile.id,
        lobbyId: data.lobbyId,
        slotIndex: data.slotIndex ?? 1,
      })
    }
    await removeNotification(notifId)
    dismissNotification()
  }

  return (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-[9999] animate-slide-down">
      <div className="bg-[#FFF9F2] rounded-3xl p-3.5 border-2 border-[#7E4228]/30 shadow-[0_12px_32px_rgba(76,39,26,0.2)] flex items-center justify-between gap-3 text-[#4C271A]">
        {/* Left Avatar + Content */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <OtterAvatar config={fromUser.otter} size="sm" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#7E4228] text-white flex items-center justify-center shadow-xs">
              {type === 'connect_request' && <UserCheck className="w-3 h-3 stroke-[2.5]" />}
              {type === 'connect_accepted' && <Check className="w-3 h-3 stroke-[2.5]" />}
              {type === 'duo_invite' && <Video className="w-3 h-3 stroke-[2.5]" />}
              {type === 'squad_invite' && <Users className="w-3 h-3 stroke-[2.5]" />}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-display font-black text-xs text-[#2D1B11] truncate">
              {fromUser.display_name}
            </h4>
            <p className="text-[11px] text-[#7A5A46] font-semibold truncate leading-tight">
              {type === 'connect_request' && 'Sent you a study buddy request!'}
              {type === 'connect_accepted' && 'Accepted your study buddy request!'}
              {type === 'duo_invite' && `Invited you to a ${data?.duration || 30}m Duo session!`}
              {type === 'squad_invite' && 'Invited you to join their Squad lobby!'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {type === 'connect_request' && (
            <>
              <button
                onClick={handleAcceptConnect}
                className="w-8 h-8 rounded-full bg-[#7E4228] text-white flex items-center justify-center hover:bg-[#683520] active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Accept Request"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
              <button
                onClick={() => {
                  removeNotification(notifId)
                  dismissNotification()
                }}
                className="w-8 h-8 rounded-full bg-[#EAE0D2] text-[#7A5A46] flex items-center justify-center hover:bg-[#DFC3A6] active:scale-95 transition-all cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          )}

          {type === 'connect_accepted' && (
            <button
              onClick={() => {
                removeNotification(notifId)
                dismissNotification()
                navigate('/connections')
              }}
              className="px-3 py-1.5 rounded-full bg-[#7E4228] text-white text-[11px] font-black hover:bg-[#683520] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              View
            </button>
          )}

          {type === 'duo_invite' && (
            <>
              <button
                onClick={handleAcceptDuo}
                className="px-3 py-1.5 rounded-full bg-[#7E4228] text-white text-[11px] font-black flex items-center gap-1 hover:bg-[#683520] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Video className="w-3 h-3 stroke-[2.5]" />
                <span>Join</span>
              </button>
              <button
                onClick={handleDeclineDuo}
                className="w-8 h-8 rounded-full bg-[#EAE0D2] text-[#7A5A46] flex items-center justify-center hover:bg-[#DFC3A6] active:scale-95 transition-all cursor-pointer"
                title="Decline"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          )}

          {type === 'squad_invite' && (
            <>
              <button
                onClick={handleAcceptSquad}
                className="px-3 py-1.5 rounded-full bg-[#7E4228] text-white text-[11px] font-black flex items-center gap-1 hover:bg-[#683520] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Users className="w-3 h-3 stroke-[2.5]" />
                <span>Join</span>
              </button>
              <button
                onClick={handleDeclineSquad}
                className="w-8 h-8 rounded-full bg-[#EAE0D2] text-[#7A5A46] flex items-center justify-center hover:bg-[#DFC3A6] active:scale-95 transition-all cursor-pointer"
                title="Decline"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
