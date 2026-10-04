import React from 'react'
import { MapMarker } from './MapMarker'
import type { StudyWorldMarker } from '../../../types'

interface WorldMapCanvasProps {
  markers: StudyWorldMarker[]
  selectedMarkerId?: string
  onSelectMarker: (marker: StudyWorldMarker) => void
  onCanvasClick: () => void
}

export const WorldMapCanvas: React.FC<WorldMapCanvasProps> = ({
  markers,
  selectedMarkerId,
  onSelectMarker,
  onCanvasClick,
}) => {
  return (
    <div
      onClick={onCanvasClick}
      className="relative w-full h-full min-h-[500px] overflow-hidden bg-[#5B3E2B] select-none flex items-center justify-center"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, #6E4D36 0%, #4A3020 100%)`,
      }}
    >
      {/* Subtle coordinate lines / parchment grid */}
      <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F5E8D0" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Stylized Vector World Map Landmass (Warm Ochre / Tan silhouette) */}
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-full object-cover pointer-events-none opacity-90 drop-shadow-md"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="#D89A53" stroke="#8A5A2B" strokeWidth="2">
          {/* North America */}
          <path d="M 120 120 Q 200 100 280 140 Q 320 200 270 280 Q 230 320 180 300 Q 130 260 110 200 Z" />
          {/* Central America & Caribbean */}
          <path d="M 230 310 Q 250 340 280 370 Q 260 380 240 340 Z" />
          {/* South America */}
          <path d="M 280 370 Q 380 390 350 480 Q 310 550 290 580 Q 260 520 270 430 Z" />
          {/* Europe */}
          <path d="M 450 140 Q 520 120 560 160 Q 550 220 500 240 Q 440 220 430 170 Z" />
          {/* Africa */}
          <path d="M 450 250 Q 570 250 560 360 Q 530 460 480 490 Q 420 400 430 310 Z" />
          {/* Asia / Eurasia */}
          <path d="M 540 130 Q 750 90 850 160 Q 890 260 800 320 Q 720 310 650 260 Q 570 240 550 170 Z" />
          {/* Southeast Asia */}
          <path d="M 720 320 Q 770 340 760 380 Q 730 390 710 350 Z" />
          {/* Philippines / Archipelago */}
          <circle cx="800" cy="350" r="14" />
          <circle cx="815" cy="380" r="10" />
          <circle cx="790" cy="390" r="12" />
          {/* Australia */}
          <path d="M 760 430 Q 860 420 870 490 Q 830 550 770 530 Q 730 480 760 430 Z" />
          {/* Japan */}
          <path d="M 860 210 Q 880 230 870 260 Q 850 240 860 210 Z" />
        </g>
      </svg>

      {/* Pinned User Markers */}
      {markers.map((marker) => (
        <MapMarker
          key={marker.id}
          marker={marker}
          isSelected={selectedMarkerId === marker.id}
          onClick={onSelectMarker}
        />
      ))}
    </div>
  )
}
