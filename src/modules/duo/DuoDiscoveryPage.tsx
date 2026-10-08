import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Heart, RotateCcw, Sparkles, RefreshCw, AlertCircle, Bell } from 'lucide-react'
import { DuoSwipeCard } from './components/DuoSwipeCard'
import { DuoMatchModal } from './components/DuoMatchModal'
import { LearnerProfileModal } from '../../components/LearnerProfileModal'
import { useConnectionStore } from '../../store/connectionStore'
import { useAuthStore, isValidUuid } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { fetchLearners } from '../../services/userService'
import type { DemoUser } from '../../types'

export const DuoDiscoveryPage: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { connections, sendRequestDB, fetchConnections } = useConnectionStore()
  const { notifications, togglePanel } = useNotificationStore()

  const [candidates, setCandidates] = useState<DemoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matchedPartner, setMatchedPartner] = useState<DemoUser | null>(null)
  const [history, setHistory] = useState<DemoUser[]>([])
  const [visitedUser, setVisitedUser] = useState<DemoUser | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const loadCandidates = async () => {
    if (!profile?.id || !isValidUuid(profile.id)) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    await fetchConnections(profile.id)
    const { data, error: err } = await fetchLearners(profile.id)
    if (err) {
      setError(err)
    } else {
      const otherLearners = data.filter((u) => u.id !== profile.id)
      setCandidates(otherLearners)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCandidates()
  }, [profile?.id])

  const currentUser = profile

  const currentCard = candidates[0]
  const nextCard = candidates[1]

  const handleSwipeLeft = (user: DemoUser) => {
    setHistory((prev) => [user, ...prev])
    setCandidates((prev) => prev.slice(1))
  }

  const handleSwipeRight = async (user: DemoUser) => {
    if (currentUser) {
      await sendRequestDB(user)
    }
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
      {/* Top Navigation Bar */}
      <div className="pt-2 pb-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#875F49] block">
            Duo Mode
          </span>
          <h1 className="font-display font-black text-2xl text-[#2D1B11]">
            Find Study Partner
          </h1>
        </div>
        <div className="flex items-center gap-2">

          <button
            onClick={loadCandidates}
            disabled={loading}
            className="w-9 h-9 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#2D1B11] active:scale-95 transition-all cursor-pointer"
            title="Refresh learners"
          >
            <RefreshCw className={`w-4 h-4 text-[#6B3410] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Card Stack Viewport */}
      <div className="relative flex-1 flex items-center justify-center min-h-[480px]">
        {loading ? (
          <div className="text-center p-8 clay-card-floating w-full text-[#2D1B11] flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#7E4228]/20 border-t-[#7E4228] rounded-full animate-spin mb-4" />
            <h3 className="font-display font-black text-base text-[#4C271A]">Finding Learners...</h3>
            <p className="text-xs text-[#7E4228] mt-1">Connecting to live student community</p>
          </div>
        ) : error ? (
          <div className="text-center p-8 clay-card-floating w-full text-[#2D1B11]">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 text-red-600">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="font-display font-black text-lg mb-1 text-red-700">Failed to Load</h3>
            <p className="text-xs text-[#7A5A46] font-medium mb-5">{error}</p>
            <button
              onClick={loadCandidates}
              className="py-3 px-6 clay-btn clay-btn-primary text-xs font-black cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : currentCard ? (
          <>
            {nextCard && (
              <DuoSwipeCard
                key={nextCard.id}
                user={nextCard}
                isTopCard={false}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onVisitProfile={(u) => {
                  setVisitedUser(u)
                  setShowProfileModal(true)
                }}
              />
            )}
            <DuoSwipeCard
              key={currentCard.id}
              user={currentCard}
              isTopCard={true}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onVisitProfile={(u) => {
                setVisitedUser(u)
                setShowProfileModal(true)
              }}
            />
          </>
        ) : (
          <div className="text-center p-8 clay-card-floating w-full text-[#2D1B11]">
            <div className="w-16 h-16 rounded-full clay-btn-amber flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Sparkles className="w-8 h-8 text-[#261408]" />
            </div>
            <h3 className="font-display font-black text-lg mb-1">
              No Other Learners Yet
            </h3>
            <p className="text-xs text-[#7A5A46] font-medium mb-5">
              You are among the first registered learners! When other students sign up, their profiles will appear here.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={loadCandidates}
                className="flex-1 py-3.5 clay-btn clay-btn-primary text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => navigate('/world')}
                className="flex-1 py-3.5 clay-btn clay-btn-circle-dark text-xs font-black cursor-pointer"
              >
                Explore Map
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Swiper Action Buttons */}
      <div className="flex items-center justify-center gap-5 pt-4">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-12 h-12 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#2D1B11] disabled:opacity-40 cursor-pointer"
          title="Undo last swipe"
        >
          <RotateCcw className="w-5 h-5 text-[#6B3410]" />
        </button>

        {/* Pass Button */}
        <button
          onClick={() => currentCard && handleSwipeLeft(currentCard)}
          disabled={!currentCard || loading}
          className="w-16 h-16 rounded-full clay-btn clay-btn-red flex items-center justify-center disabled:opacity-40 shadow-xl cursor-pointer"
          title="Pass profile"
        >
          <X className="w-8 h-8 stroke-[3.5] text-white" />
        </button>

        {/* Connect Button */}
        <button
          onClick={() => currentCard && handleSwipeRight(currentCard)}
          disabled={!currentCard || loading}
          className="w-16 h-16 rounded-full clay-btn clay-btn-green flex items-center justify-center disabled:opacity-40 shadow-xl cursor-pointer"
          title="Connect with learner"
        >
          <Heart className="w-8 h-8 fill-white stroke-[1.5] text-white" />
        </button>
      </div>

      {/* Match Confirmation Modal */}
      {currentUser && (
        <DuoMatchModal
          partner={matchedPartner}
          currentUser={currentUser}
          onStartVideoCall={handleStartVideoCall}
          onClose={() => setMatchedPartner(null)}
          onVisitProfile={(u) => {
            setVisitedUser(u)
            setShowProfileModal(true)
          }}
        />
      )}

      {/* Visited Learner Profile Modal */}
      {showProfileModal && (
        <LearnerProfileModal
          user={visitedUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onOpenAnotherProfile={(newUser) => setVisitedUser(newUser)}
        />
      )}
    </div>
  )
}

export default DuoDiscoveryPage
