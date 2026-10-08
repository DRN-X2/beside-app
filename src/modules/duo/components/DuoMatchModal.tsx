import React, { useState, useEffect } from 'react'
import { Video, X, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import { sendLiveDuoInvite, onHubEvent } from '../../../services/realtimeHub'
import type { DemoUser } from '../../../types'

interface DuoMatchModalProps {
  partner: DemoUser | null
  currentUser: DemoUser
  onStartVideoCall: (partner: DemoUser) => void
  onClose: () => void
}

export const DuoMatchModal: React.FC<DuoMatchModalProps> = ({
  partner,
  currentUser,
  onStartVideoCall,
  onClose,
}) => {
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'waiting' | 'declined'>('idle')

  useEffect(() => {
    if (!partner) return

    const unsubAccept = onHubEvent('duo_accepted', (payload) => {
      if (payload.toUserId === currentUser.id && payload.fromUser?.id === partner.id) {
        onStartVideoCall(partner)
      }
    })

    const unsubDecline = onHubEvent('duo_declined', (payload) => {
      if (payload.toUserId === currentUser.id && payload.fromUser?.id === partner.id) {
        setInviteStatus('declined')
      }
    })

    return () => {
      unsubAccept()
      unsubDecline()
    }
  }, [partner, currentUser.id, onStartVideoCall])

  if (!partner) return null

  const handleSendInvite = async () => {
    setInviteStatus('waiting')
    await sendLiveDuoInvite({
      toUserId: partner.id,
      fromUser: currentUser,
      sessionId: `duo-${Date.now()}`,
      duration: 30,
      subject: partner.subjects[0] || 'General Focus',
    })
  }

  const handleClose = () => {
    setInviteStatus('idle')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm clay-card-floating p-6 shadow-2xl relative text-center text-[#2D1B11] animate-slide-up">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#2D1B11] cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Badge & Title */}
        <div className="inline-flex items-center gap-1.5 clay-btn-green text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-3 shadow-md">
          <Sparkles className="w-3.5 h-3.5 fill-white" />
          <span>Study Match Found</span>
        </div>

        <h2 className="font-display font-black text-2xl text-[#2D1B11] mb-1">
          Study Match!
        </h2>
        <p className="text-xs text-[#7A5A46] font-semibold mb-6">
          You and <span className="font-black text-[#2D1B11]">{partner.display_name}</span> are compatible study partners.
        </p>

        {/* Dual Avatars Presentation with 3D Depth */}
        <div className="flex items-center justify-center -space-x-4 mb-6">
          <div className="relative z-10 scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
            <OtterAvatarWithBadge
              config={currentUser.otter}
              countryCode={currentUser.country_code}
              showDegree={false}
              size="md"
              bgCircleColor="clean"
            />
          </div>
          <div className="relative z-20 scale-110 drop-shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
            <OtterAvatarWithBadge
              config={partner.otter}
              countryCode={partner.country_code}
              showDegree={false}
              size="md"
              bgCircleColor="clean"
            />
          </div>
        </div>

        {/* Shared Subject Highlight */}
        <div className="clay-inset p-3.5 mb-6 text-xs">
          <span className="text-[#875F49] block text-[10px] uppercase font-black tracking-wider mb-1">
            Shared Learning Field
          </span>
          <span className="font-black text-[#2D1B11]">
            {partner.subjects[0] || 'Computer Science & Software Development'}
          </span>
        </div>

        {/* Action States */}
        {inviteStatus === 'idle' && (
          <div className="space-y-2.5">
            <button
              onClick={handleSendInvite}
              className="w-full py-3.5 clay-btn clay-btn-primary font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-transform"
            >
              <Video className="w-4 h-4 fill-white" />
              <span>Send Duo Invite</span>
            </button>

            <button
              onClick={handleClose}
              className="w-full py-3 clay-btn bg-[#FAF2E6] border border-white/60 font-bold text-xs text-[#2D1B11] shadow-sm cursor-pointer"
            >
              Keep Exploring
            </button>
          </div>
        )}

        {inviteStatus === 'waiting' && (
          <div className="clay-inset p-4 rounded-2xl text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-[#7E4228]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs font-black">Waiting for {partner.display_name}...</span>
            </div>
            <p className="text-[11px] text-[#7A5A46] leading-tight">
              An invitation was sent to {partner.display_name}. Session starts automatically once accepted.
            </p>
            <button
              onClick={() => setInviteStatus('idle')}
              className="w-full py-2.5 clay-btn bg-[#FAF2E6] border border-black/10 font-bold text-xs text-[#4C271A] cursor-pointer"
            >
              Cancel Invite
            </button>
          </div>
        )}

        {inviteStatus === 'declined' && (
          <div className="clay-inset p-4 rounded-2xl text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-xs font-black">{partner.display_name} is unavailable</span>
            </div>
            <p className="text-[11px] text-[#7A5A46] leading-tight">
              They couldn't accept the study invite right now. Try connecting with other active learners!
            </p>
            <button
              onClick={handleClose}
              className="w-full py-2.5 clay-btn clay-btn-primary font-bold text-xs text-white cursor-pointer"
            >
              Keep Exploring
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
