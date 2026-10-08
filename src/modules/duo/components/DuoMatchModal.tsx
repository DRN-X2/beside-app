import React, { useState, useEffect } from 'react'
import { Video, X, Sparkles, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import { sendLiveDuoInvite, onHubEvent } from '../../../services/realtimeHub'
import { ConfirmationModal } from '../../../components/ConfirmationModal'
import type { DemoUser } from '../../../types'

interface DuoMatchModalProps {
  partner: DemoUser | null
  currentUser: DemoUser
  onStartVideoCall: (partner: DemoUser) => void
  onClose: () => void
  onVisitProfile?: (partner: DemoUser) => void
}

export const DuoMatchModal: React.FC<DuoMatchModalProps> = ({
  partner,
  currentUser,
  onStartVideoCall,
  onVisitProfile,
  onClose,
}) => {
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'waiting' | 'declined'>('idle')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const isBusyOrOffline = partner ? ['studying', 'looking', 'offline'].includes(partner.online_status || '') : false

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
            {isBusyOrOffline && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {partner.display_name} is currently {partner.online_status || 'offline'}. You cannot send a session invite right now.
                </span>
              </div>
            )}

            <button
              onClick={handleSendInvite}
              disabled={isBusyOrOffline}
              className={`w-full py-3.5 font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-transform ${
                isBusyOrOffline
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none rounded-2xl'
                  : 'clay-btn clay-btn-primary cursor-pointer active:scale-98'
              }`}
            >
              <Video className="w-4 h-4 fill-white" />
              <span>{isBusyOrOffline ? 'Learner Unavailable' : 'Send Duo Invite'}</span>
            </button>

            {onVisitProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onVisitProfile(partner)
                }}
                className="w-full py-3 clay-btn bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/25 font-black text-xs text-[#4C271A] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#7E4228]" />
                <span>Visit Profile</span>
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-full py-2.5 clay-btn bg-[#FAF2E6] border border-white/60 font-bold text-xs text-[#2D1B11] shadow-sm cursor-pointer"
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
              onClick={() => setShowCancelConfirm(true)}
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

        <ConfirmationModal
          isOpen={showCancelConfirm}
          title="Cancel Study Invite?"
          message={`Are you sure you want to cancel your study session invite to ${partner.display_name}?`}
          confirmText="Yes, Cancel"
          cancelText="Keep Waiting"
          variant="warning"
          onConfirm={() => {
            setShowCancelConfirm(false)
            setInviteStatus('idle')
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      </div>
    </div>
  )
}
