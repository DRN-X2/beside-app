import React from 'react'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import type { StudyWorldMarker } from '../../../types'

interface MapMarkerProps {
  marker: StudyWorldMarker
  isSelected?: boolean
  onClick: (marker: StudyWorldMarker) => void
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  marker,
  isSelected = false,
  onClick,
}) => {
  const { user, subject, status } = marker

  // Color code background circle based on status as in wireframe:
  // Green = available, Blue = studying / in session, Neutral/Grey = offline
  const bgCircleColor =
    status === 'available' || status === 'online'
      ? 'green'
      : status === 'studying'
      ? 'blue'
      : 'neutral'

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onClick(marker)
      }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 select-none z-20 group ${
        isSelected ? 'scale-110 z-30' : 'hover:scale-105'
      }`}
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
    >
      {/* Subject Note Bubble */}
      <div className="flex flex-col items-center">
        <div className="relative mb-1">
          <div className="bg-[#1D4ED8] text-white text-[11px] font-black tracking-wider px-2.5 py-0.5 rounded-full shadow-md border border-[#3B82F6] flex items-center justify-center">
            {subject}
          </div>
          {/* Bubble tail arrow */}
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#1D4ED8] mx-auto" />
        </div>

        {/* Otter Avatar with status ring, country flag, and degree code */}
        <OtterAvatarWithBadge
          config={user.otter}
          countryCode={user.country_code}
          degreeCode={user.degree_code}
          showDegree={true}
          bgCircleColor={bgCircleColor}
          size="sm"
          status={status}
        />
      </div>
    </div>
  )
}
