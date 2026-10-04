import React, { useState, useRef } from 'react'
import { Check, X, Star, Heart, MapPin, BookOpen, Clock, Sparkles } from 'lucide-react'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import { calculateCompatibility } from '../../../services/compatibility'
import { useAuthStore } from '../../../store/authStore'
import type { DemoUser } from '../../../types'

interface DuoSwipeCardProps {
  user: DemoUser
  isTopCard: boolean
  onSwipeLeft: (user: DemoUser) => void
  onSwipeRight: (user: DemoUser) => void
}

export const DuoSwipeCard: React.FC<DuoSwipeCardProps> = ({
  user,
  isTopCard,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const { profile } = useAuthStore()
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const compat = profile ? calculateCompatibility(profile, user) : { score: 92, breakdown: { subjects: 95, studyStyle: 90, availability: 90 } }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isTopCard) return
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isTopCard) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setDragOffset({ x: dx, y: dy })
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    const threshold = 100
    if (dragOffset.x > threshold) {
      onSwipeRight(user)
    } else if (dragOffset.x < -threshold) {
      onSwipeLeft(user)
    }
    setDragOffset({ x: 0, y: 0 })
  }

  // Calculate rotation and opacity
  const rotation = dragOffset.x * 0.08
  const isRight = dragOffset.x > 30
  const isLeft = dragOffset.x < -30
  const stampOpacity = Math.min(1, Math.abs(dragOffset.x) / 90)

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: isTopCard
          ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`
          : 'scale(0.96) translateY(12px)',
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        touchAction: 'none',
      }}
      className={`absolute inset-0 w-full h-[470px] clay-card-floating overflow-hidden select-none flex flex-col ${
        isTopCard ? 'cursor-grab active:cursor-grabbing z-20' : 'z-10 opacity-75'
      }`}
    >
      {/* Swipe Overlay Stamps - 3D Inflated Badges */}
      {isTopCard && isRight && (
        <div
          style={{ opacity: stampOpacity }}
          className="absolute top-8 right-6 z-30 clay-btn-green font-black text-2xl tracking-widest px-5 py-2 rounded-2xl rotate-12 uppercase shadow-2xl"
        >
          Study
        </div>
      )}
      {isTopCard && isLeft && (
        <div
          style={{ opacity: stampOpacity }}
          className="absolute top-8 left-6 z-30 clay-btn-red font-black text-2xl tracking-widest px-5 py-2 rounded-2xl -rotate-12 uppercase shadow-2xl"
        >
          Pass
        </div>
      )}

      {/* Top Section - Clean unified background (NO brown cover photo!), bigger avatar */}
      <div className="relative pt-6 pb-2 px-5 flex flex-col items-center justify-center">
        {/* Compatibility Badge Top Right - 3D Green Clay Pill */}
        <div className="absolute top-4 right-4 clay-btn-green text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 fill-white" />
          <span>{compat.score}% Match</span>
        </div>

        {/* Online Status Pill Top Left */}
        <div className="absolute top-4 left-4 clay-pill bg-[#F2E4D4] text-[#5C3A21] text-[11px] font-bold px-3 py-1 rounded-full border border-[#DFC3A6] capitalize">
          {user.online_status}
        </div>

        {/* Bigger Avatar - Clearly visible, NO yellow border, NO BSCS/degree note below */}
        <div className="my-2 drop-shadow-md">
          <OtterAvatarWithBadge
            config={user.otter}
            countryCode={user.country_code}
            showDegree={false}
            size="lg"
            bgCircleColor="clean"
          />
        </div>
      </div>

      {/* Content Info */}
      <div className="flex-1 p-5 flex flex-col justify-between text-[#2D1B11]">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display font-black text-2xl text-[#2D1B11] truncate">
              {user.display_name}
            </h2>
            <span className="text-xs font-black text-[#875F49] clay-pill px-2.5 py-0.5">{user.year_level}</span>
          </div>

          <p className="text-xs text-[#7A5A46] font-semibold mb-3">
            {user.degree_program} · {user.school}
          </p>

          {/* Subjects - Clay Pills */}
          <div className="mb-3">
            <span className="text-[10px] font-black text-[#875F49] uppercase tracking-wider block mb-1.5">
              Currently Studying
            </span>
            <div className="flex flex-wrap gap-1.5">
              {user.subjects.slice(0, 3).map((sub) => (
                <span
                  key={sub}
                  className="clay-pill bg-[#F5E8D7] text-[#4A2D1B] text-xs font-bold px-3 py-1 border border-white/60"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Interests - Clay Pills */}
          <div>
            <span className="text-[10px] font-black text-[#875F49] uppercase tracking-wider block mb-1.5">
              Interests
            </span>
            <div className="flex flex-wrap gap-1.5">
              {user.learning_interests.slice(0, 2).map((item) => (
                <span
                  key={item}
                  className="clay-pill bg-amber-100/90 text-amber-950 text-xs font-bold px-3 py-1 border border-amber-200/80"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="pt-3 border-t border-[#3D271D]/10 flex items-center justify-between text-xs text-[#7A5A46] font-bold">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#8C471E]" />
            <span>{user.preferred_duration} min session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#8C471E]" />
            <span>{user.city}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
