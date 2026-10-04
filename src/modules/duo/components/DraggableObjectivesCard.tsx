import React, { useState, useRef, useEffect } from 'react'
import { Check, Plus, Trash2, ChevronRight, ChevronLeft, Target, GripVertical } from 'lucide-react'
import type { DuoObjective } from '../../../types'

interface DraggableObjectivesCardProps {
  topic: string
  onUpdateTopic: (topic: string) => void
  objectives: DuoObjective[]
  onToggleObjective: (id: string) => void
  onAddObjective: (text: string) => void
  onRemoveObjective: (id: string) => void
}

export const DraggableObjectivesCard: React.FC<DraggableObjectivesCardProps> = ({
  topic,
  onUpdateTopic,
  objectives,
  onToggleObjective,
  onAddObjective,
  onRemoveObjective,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [newText, setNewText] = useState('')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const posStartRef = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    posStartRef.current = { ...position }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    const newX = Math.max(-120, Math.min(180, posStartRef.current.x + dx))
    const newY = Math.max(-20, Math.min(260, posStartRef.current.y + dy))
    setPosition({ x: newX, y: newY })

    // If dragged right towards the edge, trigger collapse
    if (newX > 80) {
      setIsCollapsed(true)
      setIsDragging(false)
      setPosition({ x: 0, y: newY })
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newText.trim() || objectives.length >= 3) return
    onAddObjective(newText.trim())
    setNewText('')
  }

  const completedCount = objectives.filter((o) => o.completed).length

  return (
    <div
      style={{
        top: '64px',
        right: '0px',
        transform: isCollapsed
          ? 'translateX(calc(100% - 44px))'
          : `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="absolute z-50 w-72 max-w-[85vw] select-none pointer-events-auto"
    >
      <div className="relative flex items-start">
        {/* Slidable Tab Handle (Always anchored to the left of the card border) */}
        {isCollapsed && (
          <button
            onClick={() => {
              setIsCollapsed(false)
              setPosition({ x: 0, y: position.y })
            }}
            className="w-10 h-36 clay-btn-amber rounded-l-3xl shadow-2xl flex flex-col items-center justify-center gap-2 text-[#2D1B11] active:scale-95 transition-transform cursor-pointer border-r-0 border-white/40"
            title="Pull out Objectives"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" />
            <span className="[writing-mode:vertical-rl] text-[10px] font-black tracking-widest uppercase rotate-180">
              Goals ({completedCount}/3)
            </span>
          </button>
        )}

        {/* Floating Card Body - Pillowy Clay Container */}
        <div
          className={`flex-1 clay-card-floating overflow-hidden text-[#2D1B11] mr-3 ${
            isCollapsed ? 'opacity-90 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Draggable Header - Tactile 3D Bar */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="bg-gradient-to-r from-[#F2AA52] to-[#DF8C30] px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-black/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-[#5C3A1A]" />
              <Target className="w-4 h-4 text-[#2D1B11]" />
              <span className="font-display font-black text-xs uppercase tracking-wider text-[#2D1B11]">
                Session Goals
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black bg-[#FAF2E6] text-[#2D1B11] px-2 py-0.5 rounded-full clay-pill">
                {completedCount}/3
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCollapsed(true)
                }}
                className="w-6 h-6 rounded-full clay-btn-circle-light flex items-center justify-center text-[#2D1B11]"
                title="Slide to hide"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          <div className="p-3.5 space-y-3">
            {/* Live Editable Topic */}
            <div>
              <label className="text-[9px] font-black text-[#875F49] uppercase tracking-wider block mb-1">
                Topic for Today
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => onUpdateTopic(e.target.value)}
                placeholder="e.g. Chapter 3: Trees & Graphs"
                className="w-full clay-inset px-3 py-2 text-xs font-bold text-[#2D1B11] focus:outline-none focus:ring-2 focus:ring-[#8C471E]/40"
              />
            </div>

            {/* Checklist items (up to 3) */}
            <div className="space-y-2">
              {objectives.map((obj) => (
                <div
                  key={obj.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-2xl text-xs transition-all ${
                    obj.completed
                      ? 'bg-emerald-100/80 border border-emerald-400 text-emerald-950 shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.8),inset_-1.5px_-1.5px_3px_rgba(0,100,50,0.15)]'
                      : 'clay-inset text-[#2D1B11]'
                  }`}
                >
                  <button
                    onClick={() => onToggleObjective(obj.id)}
                    className={`mt-0.5 w-4 h-4 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                      obj.completed
                        ? 'clay-btn-green text-white scale-105'
                        : 'bg-white/90 border border-[#875F49]/40 shadow-sm'
                    }`}
                  >
                    {obj.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  <span
                    onClick={() => onToggleObjective(obj.id)}
                    className={`flex-1 text-[11px] leading-tight cursor-pointer ${
                      obj.completed ? 'line-through text-emerald-800 font-semibold' : 'font-bold'
                    }`}
                  >
                    {obj.text}
                  </span>
                  <button
                    onClick={() => onRemoveObjective(obj.id)}
                    className="text-[#875F49] hover:text-rose-600 p-0.5 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Objective input if < 3 */}
            {objectives.length < 3 ? (
              <form onSubmit={handleAdd} className="flex gap-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Add target..."
                  className="flex-1 clay-inset px-3 py-1.5 text-[11px] font-medium text-[#2D1B11] focus:outline-none focus:ring-2 focus:ring-[#8C471E]/40"
                />
                <button
                  type="submit"
                  disabled={!newText.trim()}
                  className="px-3 py-1.5 clay-btn clay-btn-primary font-black text-xs disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="text-[10px] text-center font-bold text-[#875F49] py-1.5 clay-inset">
                3/3 Free Tier Limit Reached
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
