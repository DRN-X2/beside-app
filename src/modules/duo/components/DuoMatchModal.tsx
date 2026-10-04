import React from 'react'
import { Video, MessageCircle, X, Sparkles } from 'lucide-react'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
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
  if (!partner) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm clay-card-floating p-6 shadow-2xl relative text-center text-[#2D1B11] animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#2D1B11]"
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

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => onStartVideoCall(partner)}
            className="w-full py-3.5 clay-btn clay-btn-primary font-black text-sm text-white shadow-lg flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4 fill-white" />
            <span>Start Duo Session</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 clay-btn bg-[#FAF2E6] border border-white/60 font-bold text-xs text-[#2D1B11] shadow-sm"
          >
            Keep Exploring
          </button>
        </div>
      </div>
    </div>
  )
}
