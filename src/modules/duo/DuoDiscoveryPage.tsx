import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, X, Heart, Star, RotateCcw, Sparkles, Filter } from 'lucide-react'
import { DuoSwipeCard } from './components/DuoSwipeCard'
import { DuoMatchModal } from './components/DuoMatchModal'
import { DEMO_USERS, DEMO_CURRENT_USER } from '../../data/demoUsers'
import { useConnectionStore } from '../../store/connectionStore'
import { useAuthStore } from '../../store/authStore'
import { calculateCompatibility } from '../../services/compatibility'
import type { DemoUser } from '../../types'

export const DuoDiscoveryPage: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { sendRequest } = useConnectionStore()

  const currentUser = profile || DEMO_CURRENT_USER
  const [candidates, setCandidates] = useState<DemoUser[]>(DEMO_USERS)
  const [matchedPartner, setMatchedPartner] = useState<DemoUser | null>(null)
  const [history, setHistory] = useState<DemoUser[]>([])

  const currentCard = candidates[0]
  const nextCard = candidates[1]

  const handleSwipeLeft = (user: DemoUser) => {
    setHistory((prev) => [user, ...prev])
    setCandidates((prev) => prev.slice(1))
  }

  const handleSwipeRight = (user: DemoUser) => {
    setHistory((prev) => [user, ...prev])
    setCandidates((prev) => prev.slice(1))
    setMatchedPartner(user)
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const lastUser = history[0]
    setHistory((prev) => prev.slice(1))
    setCandidates((prev) => [lastUser, ...prev])
  }

  const handleStartVideoCall = (partner: DemoUser) => {
    setMatchedPartner(null)
    navigate('/duo', { state: { partner } })
  }

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#FAF2E6] flex flex-col justify-between p-4 max-w-md mx-auto select-none overflow-hidden pb-24">
      {/* Top Navigation Bar - Title Only, No Map Button */}
      <div className="pt-2 pb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#875F49] block">
          Duo Mode
        </span>
        <h1 className="font-display font-black text-2xl text-[#2D1B11]">
          Find Study Partner
        </h1>
      </div>

      {/* Card Stack Viewport */}
      <div className="relative flex-1 flex items-center justify-center min-h-[480px]">
        {currentCard ? (
          <>
            {nextCard && (
              <DuoSwipeCard
                key={nextCard.id}
                user={nextCard}
                isTopCard={false}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
            )}
            <DuoSwipeCard
              key={currentCard.id}
              user={currentCard}
              isTopCard={true}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          </>
        ) : (
          <div className="text-center p-8 clay-card-floating w-full text-[#2D1B11]">
            <div className="w-16 h-16 rounded-full clay-btn-amber flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Sparkles className="w-8 h-8 text-[#261408]" />
            </div>
            <h3 className="font-display font-black text-lg mb-1">No More Profiles</h3>
            <p className="text-xs text-[#7A5A46] font-medium mb-5">
              You've viewed all nearby learners. Check the StudyWorld map or reset candidates!
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setCandidates(DEMO_USERS)}
                className="flex-1 py-3.5 clay-btn clay-btn-primary text-xs font-black"
              >
                Reset Cards
              </button>
              <button
                onClick={() => navigate('/world')}
                className="flex-1 py-3.5 clay-btn clay-btn-circle-dark text-xs font-black"
              >
                Explore Map
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Swiper Action Buttons - Tactile 3D Clay Spheres */}
      <div className="flex items-center justify-center gap-5 pt-4">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-12 h-12 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#2D1B11] disabled:opacity-40"
          title="Undo last swipe"
        >
          <RotateCcw className="w-5 h-5 text-[#6B3410]" />
        </button>

        {/* Pass Button (Red 3D Clay Sphere) */}
        <button
          onClick={() => currentCard && handleSwipeLeft(currentCard)}
          disabled={!currentCard}
          className="w-16 h-16 rounded-full clay-btn clay-btn-red flex items-center justify-center disabled:opacity-40 shadow-xl"
          title="Pass profile"
        >
          <X className="w-8 h-8 stroke-[3.5] text-white" />
        </button>

        {/* Connect Button (Green 3D Clay Sphere) */}
        <button
          onClick={() => currentCard && handleSwipeRight(currentCard)}
          disabled={!currentCard}
          className="w-16 h-16 rounded-full clay-btn clay-btn-green flex items-center justify-center disabled:opacity-40 shadow-xl"
          title="Connect with learner"
        >
          <Heart className="w-8 h-8 fill-white stroke-[1.5] text-white" />
        </button>
      </div>

      {/* Match Confirmation Modal */}
      <DuoMatchModal
        partner={matchedPartner}
        currentUser={currentUser}
        onStartVideoCall={handleStartVideoCall}
        onClose={() => setMatchedPartner(null)}
      />
    </div>
  )
}

export default DuoDiscoveryPage
