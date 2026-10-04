import React from 'react'
import { X, Sparkles, BookOpen, Clock, Heart } from 'lucide-react'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import type { StudyWorldMarker } from '../../../types'

interface StudyWorldSheetProps {
  marker: StudyWorldMarker | null
  onClose: () => void
  onStartStudy: (marker: StudyWorldMarker) => void
  onViewProfile: (userId: string) => void
}

export const StudyWorldSheet: React.FC<StudyWorldSheetProps> = ({
  marker,
  onClose,
  onStartStudy,
  onViewProfile,
}) => {
  if (!marker) return null

  const { user, subject, status } = marker

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 max-w-md mx-auto px-4 animate-slide-up">
      <div className="bg-[#FAF2E6] border-2 border-[#3D271D] rounded-3xl p-5 shadow-2xl relative text-[#2D1B11]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#EBD8C1] border border-[#3D271D] flex items-center justify-center text-[#2D1B11] active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <OtterAvatarWithBadge
            config={user.otter}
            countryCode={user.country_code}
            degreeCode={user.degree_code}
            showDegree={true}
            size="md"
            status={status}
          />
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="font-display font-bold text-lg text-[#2D1B11] truncate">
              {user.display_name}
            </h3>
            <p className="text-xs text-[#7A5A46] font-medium truncate">
              {user.degree_program} · {user.school}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-1 bg-[#1D4ED8] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              <span>Topic: {subject}</span>
            </div>
          </div>
        </div>

        {/* Subjects & Status Details */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="bg-[#F2E2CE] rounded-xl p-2.5 border border-[#DFC3A6]">
            <span className="text-[#875F49] block text-[10px] uppercase font-bold tracking-wider">Status</span>
            <span className="font-bold text-[#2D1B11] capitalize">{status}</span>
          </div>
          <div className="bg-[#F2E2CE] rounded-xl p-2.5 border border-[#DFC3A6]">
            <span className="text-[#875F49] block text-[10px] uppercase font-bold tracking-wider">Duration</span>
            <span className="font-bold text-[#2D1B11]">{user.preferred_duration} mins</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={() => onViewProfile(user.id)}
            className="flex-1 py-3 bg-[#EBD8C1] border-2 border-[#3D271D] rounded-2xl font-bold text-xs text-[#2D1B11] active:scale-95 transition-transform"
          >
            View Profile
          </button>
          <button
            onClick={() => onStartStudy(marker)}
            className="flex-1 py-3 bg-[#8B4513] hover:bg-[#A0522D] border-2 border-[#3D271D] rounded-2xl font-bold text-xs text-white shadow-warm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Study Together</span>
          </button>
        </div>
      </div>
    </div>
  )
}
