import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Video, Clock, Users, ArrowLeft, Shield, Sparkles } from 'lucide-react'
import { DuoVideoRoom } from './components/DuoVideoRoom'
import { OtterAvatarWithBadge } from '../../shared/components/OtterAvatarWithBadge'
import { useSessionStore } from '../../store/sessionStore'
import { useAuthStore } from '../../store/authStore'
import { DEMO_USERS, DEMO_CURRENT_USER } from '../../data/demoUsers'
import type { DemoUser, SessionDuration } from '../../types'

export const DuoPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const currentUser = profile || DEMO_CURRENT_USER

  const {
    isActive,
    partner,
    startSession,
    endSession,
  } = useSessionStore()

  // Selected partner fallback to location state or first demo candidate
  const initialPartner: DemoUser = location.state?.partner || DEMO_USERS[0]
  const [selectedPartner, setSelectedPartner] = useState<DemoUser>(initialPartner)
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>(30)

  const handleStartCall = () => {
    startSession(selectedPartner, selectedDuration)
  }

  const handleEndCall = () => {
    endSession()
    navigate('/history')
  }

  // If in active session, render the Duo video room
  if (isActive && partner) {
    return (
      <DuoVideoRoom
        partner={partner}
        duration={selectedDuration}
        onEndSession={handleEndCall}
      />
    )
  }

  // Session Launch / Duration Picker Screen
  return (
    <div className="relative w-full min-h-[100dvh] bg-[#FAF2E6] flex flex-col justify-between p-4 max-w-md mx-auto select-none text-[#2D1B11] pb-24">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-3 pt-2 mb-6">
          <button
            onClick={() => navigate('/discover')}
            className="w-10 h-10 rounded-2xl clay-btn clay-btn-circle-light flex items-center justify-center text-[#2D1B11]"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#875F49] block">
              Duo Mode
            </span>
            <h1 className="font-display font-black text-2xl text-[#2D1B11]">
              Launch Duo Call
            </h1>
          </div>
        </div>

        {/* Selected Partner Card - 3D Clay Card */}
        <div className="clay-card-floating p-5 mb-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#875F49] block mb-3">
            Study Partner
          </span>

          <div className="flex items-center gap-4">
            <div className="drop-shadow-md">
              <OtterAvatarWithBadge
                config={selectedPartner.otter}
                countryCode={selectedPartner.country_code}
                showDegree={false}
                size="md"
                bgCircleColor="clean"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-black text-lg text-[#2D1B11] truncate">
                {selectedPartner.display_name}
              </h3>
              <p className="text-xs text-[#7A5A46] font-semibold truncate">
                {selectedPartner.degree_program} · {selectedPartner.school}
              </p>
              <span className="inline-block mt-1.5 clay-pill bg-amber-100/90 text-[#8C471E] text-[10px] font-black px-2.5 py-0.5 border border-[#DFC3A6]">
                Available for Session
              </span>
            </div>
          </div>
        </div>

        {/* Duration Selection (15m, 30m, 1h) - 3D Clay Selectors */}
        <div className="clay-card-floating p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#875F49]">
              Session Duration
            </span>
            <span className="text-[10px] text-[#7A5A46] font-bold">Continuous timer</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { duration: 15 as SessionDuration, label: '15 Mins', tag: 'Sprint' },
              { duration: 30 as SessionDuration, label: '30 Mins', tag: 'Focused' },
              { duration: 60 as SessionDuration, label: '1 Hour', tag: 'Deep Dive' },
            ].map((item) => (
              <button
                key={item.duration}
                onClick={() => setSelectedDuration(item.duration)}
                className={`p-3 rounded-2xl text-center transition-all duration-200 active:scale-95 ${
                  selectedDuration === item.duration
                    ? 'clay-btn-primary shadow-lg scale-102'
                    : 'clay-inset text-[#2D1B11] hover:bg-[#EAE0D2]'
                }`}
              >
                <div className="font-display font-black text-sm">{item.label}</div>
                <div
                  className={`text-[10px] font-bold ${
                    selectedDuration === item.duration ? 'text-amber-200' : 'text-[#875F49]'
                  }`}
                >
                  {item.tag}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Start Video Conference CTA */}
      <div className="pt-4">
        <button
          onClick={handleStartCall}
          className="w-full py-4 clay-btn clay-btn-primary font-display font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2"
        >
          <Video className="w-5 h-5 fill-white" />
          <span>Start Duo Video Call</span>
        </button>
      </div>
    </div>
  )
}

export default DuoPage
