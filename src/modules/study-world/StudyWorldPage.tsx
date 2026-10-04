import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal, Users, Sparkles, Filter, X } from 'lucide-react'
import { WorldMapCanvas } from './components/WorldMapCanvas'
import { StudyWorldSheet } from './components/StudyWorldSheet'
import { DEMO_MAP_MARKERS } from '../../data/demoUsers'
import type { StudyWorldMarker } from '../../types'

export const StudyWorldPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'duo' | 'squad'>('duo')
  const [selectedMarker, setSelectedMarker] = useState<StudyWorldMarker | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedDegree, setSelectedDegree] = useState<string>('all')

  const filteredMarkers = DEMO_MAP_MARKERS.filter((m) => {
    if (activeTab === 'duo' && m.mode !== 'duo') return false
    if (activeTab === 'squad' && m.mode !== 'squad') return false
    if (selectedDegree !== 'all' && m.user.degree_code !== selectedDegree) return false
    return true
  })

  const handleSelectMarker = (marker: StudyWorldMarker) => {
    setSelectedMarker(marker)
  }

  const handleStartStudy = (marker: StudyWorldMarker) => {
    if (activeTab === 'duo') {
      navigate('/duo', { state: { partner: marker.user } })
    } else {
      navigate('/squad')
    }
  }

  const handleViewProfile = (userId: string) => {
    navigate('/profile')
  }

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-[#2A1B14] overflow-hidden select-none">
      {/* Top FILTERS Bar matching wireframe */}
      <div className="absolute top-4 inset-x-4 z-30 max-w-md mx-auto">
        <button
          onClick={() => setShowFilterModal(true)}
          className="w-full py-3 px-6 bg-[#2B1C13]/90 backdrop-blur-md border-2 border-[#4A3022] rounded-2xl text-white font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-[#382418] active:scale-95 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#D89A53]" />
          <span>Filters</span>
          {selectedDegree !== 'all' && (
            <span className="ml-2 bg-[#D89A53] text-[#2A1B14] px-2 py-0.5 rounded-full text-[10px] font-black">
              {selectedDegree}
            </span>
          )}
        </button>
      </div>

      {/* Main Map Viewport */}
      <div className="flex-1 w-full h-full relative">
        <WorldMapCanvas
          markers={filteredMarkers}
          selectedMarkerId={selectedMarker?.id}
          onSelectMarker={handleSelectMarker}
          onCanvasClick={() => setSelectedMarker(null)}
        />
      </div>

      {/* Active Marker Bottom Preview Sheet */}
      <StudyWorldSheet
        marker={selectedMarker}
        onClose={() => setSelectedMarker(null)}
        onStartStudy={handleStartStudy}
        onViewProfile={handleViewProfile}
      />

      {/* Bottom Mode Switcher (DUO / SQUAD) matching wireframe */}
      <div className="absolute bottom-6 inset-x-4 z-30 max-w-md mx-auto">
        <div className="w-full p-1.5 bg-[#2B1C13]/95 backdrop-blur-md border-2 border-[#4A3022] rounded-3xl shadow-2xl flex items-center gap-2">
          {/* DUO Tab */}
          <button
            onClick={() => {
              setActiveTab('duo')
              setSelectedMarker(null)
            }}
            className={`flex-1 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
              activeTab === 'duo'
                ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30 border-2 border-[#A78BFA]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>Duo</span>
          </button>

          {/* SQUAD Tab */}
          <button
            onClick={() => {
              setActiveTab('squad')
              setSelectedMarker(null)
            }}
            className={`flex-1 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
              activeTab === 'squad'
                ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30 border-2 border-[#34D399]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>Squad</span>
          </button>
        </div>
      </div>

      {/* Filters Modal Sheet */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF2E6] border-2 border-[#3D271D] rounded-3xl p-6 shadow-2xl animate-slide-up text-[#2D1B11]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#2D1B11]">StudyWorld Filters</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-8 h-8 rounded-full bg-[#EBD8C1] border border-[#3D271D] flex items-center justify-center text-[#2D1B11]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-[#875F49] uppercase tracking-wider mb-2">Degree Program</p>
                <div className="flex flex-wrap gap-2">
                  {['all', 'BSCS', 'BSIT', 'BSIS', 'BSEE'].map((code) => (
                    <button
                      key={code}
                      onClick={() => setSelectedDegree(code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedDegree === code
                          ? 'bg-[#8B4513] text-white border-2 border-[#3D271D]'
                          : 'bg-[#EBD8C1] text-[#2D1B11] border border-[#DFC3A6]'
                      }`}
                    >
                      {code === 'all' ? 'All Degrees' : code}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#875F49] uppercase tracking-wider mb-2">Mode Context</p>
                <div className="p-3 bg-[#F2E2CE] rounded-xl text-xs text-[#5D3D2B]">
                  Currently viewing <span className="font-bold uppercase">{activeTab}</span> mode learners across the global StudyWorld grid.
                </div>
              </div>

              <button
                onClick={() => setShowFilterModal(false)}
                className="w-full py-3.5 bg-[#8B4513] hover:bg-[#A0522D] border-2 border-[#3D271D] rounded-2xl font-bold text-sm text-white shadow-warm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudyWorldPage
