import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, Earth, Shield } from 'lucide-react'
import OtterAvatar from './OtterAvatar'
import { useAuthStore } from '../store/authStore'
import { DEMO_CURRENT_USER } from '../data/demoUsers'

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { profile } = useAuthStore()
  const currentUser = profile || DEMO_CURRENT_USER

  const isHomeActive = pathname === '/'
  const isDuoActive = pathname.startsWith('/discover') || pathname.startsWith('/duo')
  const isWorldActive = pathname.startsWith('/world')
  const isSquadActive = pathname.startsWith('/squad')
  const isProfileActive = pathname.startsWith('/profile')

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 safe-bottom pointer-events-none select-none">
      <div className="mx-3 mb-2 relative flex items-center justify-center pointer-events-auto">
        {/* Sleek Neumorphic Dock Bar with 5 evenly balanced slots */}
        <div className="w-full h-[64px] bg-[#F1F1F1] border border-black/5 rounded-[32px] shadow-[5px_5px_14px_rgba(76,39,26,0.08),-5px_-5px_14px_rgba(255,255,255,0.9)] grid grid-cols-5 items-center px-2 relative">
          
          {/* Slot 1: HOME Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate('/')}
              className={`w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
                isHomeActive
                  ? 'bg-[#E5DFD9] text-[#7E4228] shadow-[inset_2px_2px_4px_rgba(76,39,26,0.14),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] border border-[#7E4228]/30'
                  : 'text-[#7E4228]/70 hover:text-[#4C271A] shadow-[2px_2px_5px_rgba(76,39,26,0.06),-2px_-2px_5px_rgba(255,255,255,0.9)] border border-white/60'
              }`}
              title="Home"
            >
              <Home className={`w-5 h-5 transition-transform duration-150 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
            </button>
          </div>

          {/* Slot 2: DUO Button (2-People Icon) */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate('/discover')}
              className={`w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
                isDuoActive
                  ? 'bg-[#E5DFD9] text-[#7E4228] shadow-[inset_2px_2px_4px_rgba(76,39,26,0.14),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] border border-[#7E4228]/30'
                  : 'text-[#7E4228]/70 hover:text-[#4C271A] shadow-[2px_2px_5px_rgba(76,39,26,0.06),-2px_-2px_5px_rgba(255,255,255,0.9)] border border-white/60'
              }`}
              title="Duo Matching & Partner Session"
            >
              <Users className={`w-5 h-5 transition-transform duration-150 ${isDuoActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
            </button>
          </div>

          {/* Slot 3: Centerpiece EARTH Button (Secondary Brown #7E4228) */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate('/world')}
              className={`w-[46px] h-[46px] rounded-full cursor-pointer transition-all duration-150 active:scale-95 flex items-center justify-center ${
                isWorldActive
                  ? 'bg-[#6E3821] text-white shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.35),0_4px_12px_rgba(76,39,26,0.25)] border border-white/20'
                  : 'bg-[#7E4228] text-white shadow-[0_4px_10px_rgba(76,39,26,0.22)] border border-white/10 hover:bg-[#6E3821]'
              }`}
              title="StudyWorld Global Map"
            >
              <Earth className="w-5 h-5 stroke-[2.2] text-white" />
            </button>
          </div>

          {/* Slot 4: SQUAD Button (Shield Icon) */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate('/squad')}
              className={`w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
                isSquadActive
                  ? 'bg-[#E5DFD9] text-[#7E4228] shadow-[inset_2px_2px_4px_rgba(76,39,26,0.14),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] border border-[#7E4228]/30'
                  : 'text-[#7E4228]/70 hover:text-[#4C271A] shadow-[2px_2px_5px_rgba(76,39,26,0.06),-2px_-2px_5px_rgba(255,255,255,0.9)] border border-white/60'
              }`}
              title="Squad Team Lobby"
            >
              <Shield className={`w-5 h-5 transition-transform duration-150 ${isSquadActive ? 'stroke-[2.5] fill-[#7E4228]/20' : 'stroke-[2]'}`} />
            </button>
          </div>

          {/* Slot 5: PROFILE Button (User's Otter Avatar) */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate('/profile')}
              className={`w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 overflow-hidden p-0.5 cursor-pointer ${
                isProfileActive
                  ? 'bg-[#E5DFD9] shadow-[inset_2px_2px_4px_rgba(76,39,26,0.14),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] border-2 border-[#7E4228]'
                  : 'shadow-[2px_2px_5px_rgba(76,39,26,0.06),-2px_-2px_5px_rgba(255,255,255,0.9)] border border-white/60'
              }`}
              title="Profile & Otter"
            >
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white/80">
                <OtterAvatar config={(currentUser as any).otter_config || currentUser.otter || { fur: 'brown', eyes: 'happy', glasses: 'none', clothing: 'hoodie', accessory: 'none', background: 'cream' }} size="xs" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
