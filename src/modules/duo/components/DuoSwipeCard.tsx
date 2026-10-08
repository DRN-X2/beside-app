import React, { useState, useRef } from 'react'
import { MapPin, Clock, Sparkles, Check, UserCheck, ExternalLink, AlertCircle } from 'lucide-react'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import { CountryFlag } from '../../../shared/components/CountryFlag'
import { calculateCompatibility } from '../../../services/compatibility'
import { useAuthStore } from '../../../store/authStore'
import { useConnectionStore } from '../../../store/connectionStore'
import type { DemoUser } from '../../../types'

interface DuoSwipeCardProps {
  user: DemoUser
  isTopCard: boolean
  onSwipeLeft: (user: DemoUser) => void
  onSwipeRight: (user: DemoUser) => void
  onVisitProfile?: (user: DemoUser) => void
}

export const DuoSwipeCard: React.FC<DuoSwipeCardProps> = ({
  user,
  isTopCard,
  onSwipeLeft,
  onSwipeRight,
  onVisitProfile,
}) => {
  const { profile } = useAuthStore()
  const { connections } = useConnectionStore()
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const isConnected = connections[user.id]?.status === 'accepted'
  const isBusyOrOffline = ['studying', 'looking', 'offline'].includes(user.online_status || '')

  const compat = profile
    ? calculateCompatibility(profile, user)
    : { score: 92, breakdown: { subjects: 95, studyStyle: 90, availability: 90 } }

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
      className={`absolute inset-0 w-full h-[470px] clay-card-floating overflow-hidden select-none flex flex-col justify-between ${
        isTopCard ? 'cursor-grab active:cursor-grabbing z-20' : 'z-10 opacity-75'
      }`}
    >
      {/* Swipe Overlay Stamps */}
      {isTopCard && isRight && (
        <div
          style={{ opacity: stampOpacity }}
          className="absolute top-8 right-6 z-30 clay-btn-green font-black text-2xl tracking-widest px-5 py-2 rounded-2xl rotate-12 uppercase shadow-2xl text-white"
        >
          Study
        </div>
      )}
      {isTopCard && isLeft && (
        <div
          style={{ opacity: stampOpacity }}
          className="absolute top-8 left-6 z-30 clay-btn-red font-black text-2xl tracking-widest px-5 py-2 rounded-2xl -rotate-12 uppercase shadow-2xl text-white"
        >
          Pass
        </div>
      )}

      {/* Top Section - Badges & Avatar */}
      <div className="relative pt-6 pb-2 px-5 flex flex-col items-center justify-center">
        {/* Compatibility Pill Top Right */}
        <div className="absolute top-4 right-4 clay-btn-green text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 fill-white" />
          <span>{compat.score}% Match</span>
        </div>

        {/* Online Status / Connected Pill Top Left */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5">
          <span
            className={`text-[11px] font-black px-3 py-1 rounded-full capitalize shadow-2xs ${
              user.online_status === 'studying'
                ? 'bg-blue-100 text-blue-800'
                : user.online_status === 'looking'
                ? 'bg-purple-100 text-purple-800'
                : user.online_status === 'offline'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {user.online_status || 'Offline'}
          </span>
          {isConnected && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1 shadow-2xs">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Connected</span>
            </span>
          )}
        </div>

        {/* Big Otter Avatar with Country Flag Badge */}
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

      {/* Minimal Content Info (NO interests/skills on card - implied by match!) */}
      <div className="flex-1 px-5 py-3 flex flex-col justify-between text-[#2D1B11]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="font-display font-black text-2xl text-[#2D1B11] truncate">
              {user.display_name}
            </h2>
            {user.country_code && (
              <div className="scale-90">
                <CountryFlag countryCode={user.country_code} size="xs" />
              </div>
            )}
          </div>

          <p className="text-xs text-[#7A5A46] font-bold">
            {user.degree_program} · {user.school}
          </p>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[11px] font-bold text-[#875F49] clay-pill px-3 py-0.5">
              {user.year_level || 'Student'}
            </span>
            <span className="text-[11px] font-bold text-[#875F49] clay-pill px-3 py-0.5 capitalize">
              {user.study_style || 'Flexible'} style
            </span>
          </div>

          {/* Busy or offline alert note */}
          {isBusyOrOffline && (
            <div className="mt-3 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Currently {user.online_status}. You can visit their profile below.</span>
            </div>
          )}
        </div>

        {/* Visit Profile Action Button */}
        <div className="my-2">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onVisitProfile && onVisitProfile(user)}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-xs font-black text-[#4C271A] shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#7E4228]" />
            <span>Visit Full Profile</span>
          </button>
        </div>

        {/* Footer Metrics */}
        <div className="pt-2.5 border-t border-[#3D271D]/10 flex items-center justify-between text-xs text-[#7A5A46] font-bold">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#8C471E]" />
            <span>{user.preferred_duration || 30} min session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#8C471E]" />
            <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
