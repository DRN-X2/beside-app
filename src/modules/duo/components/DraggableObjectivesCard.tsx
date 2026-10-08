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
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const DraggableObjectivesCard: React.FC<DraggableObjectivesCardProps> = ({
  topic,
  onUpdateTopic,
  objectives,
  onToggleObjective,
  onAddObjective,
  onRemoveObjective,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed

  const handleSetCollapsed = (val: boolean) => {
    if (onToggleCollapse && val !== isCollapsed) {
      onToggleCollapse()
    } else {
      setInternalCollapsed(val)
    }
  }

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
      handleSetCollapsed(true)
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
          ? 'translateX(calc(100% - 36px))'
          : `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="absolute z-50 w-72 max-w-[85vw] select-none pointer-events-auto"
    >
      <div className="relative flex items-start">
        {/* Sleek Minimalist Tab Handle when collapsed (No distracting vertical text) */}
        {isCollapsed && (
          <button
            onClick={() => {
              handleSetCollapsed(false)
              setPosition({ x: 0, y: position.y })
            }}
            className="w-9 h-11 bg-[#FAF2E6] border border-[#DFC3A6] rounded-l-2xl shadow-lg flex items-center justify-center gap-1 text-[#7E4228] hover:bg-[#F3E7D5] active:scale-95 transition-all cursor-pointer border-r-0"
            title="Open Goals"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <Target className="w-3.5 h-3.5 text-[#C68642]" />
          </button>
        )}

        {/* Floating Card Body - Clean Beside Warm Theme */}
        <div
          className={`flex-1 bg-white border border-[#E8DACB] rounded-3xl shadow-2xl overflow-hidden text-[#2D1B11] mr-3 ${
            isCollapsed ? 'opacity-90 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Draggable Header - Minimalist Warm Cream Theme */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="bg-[#FAF2E6] px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-[#DFC3A6]/60"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-3.5 h-3.5 text-[#875F49]" />
              <Target className="w-4 h-4 text-[#C68642]" />
              <span className="font-display font-black text-xs uppercase tracking-wider text-[#4C271A]">
                Session Goals
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black bg-white text-[#4C271A] px-2 py-0.5 rounded-full border border-[#DFC3A6]/80 shadow-xs">
                {completedCount}/3
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSetCollapsed(true)
                }}
                className="w-6 h-6 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#7E4228] transition-colors cursor-pointer border border-[#DFC3A6]/60"
                title="Collapse goals"
              >
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          <div className="p-3.5 space-y-3 bg-[#FCFAF7]">
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
                className="w-full bg-white border border-[#DFC3A6]/80 rounded-xl px-3 py-2 text-xs font-bold text-[#2D1B11] placeholder-[#A8826D] focus:outline-none focus:ring-2 focus:ring-[#C68642]/40"
              />
            </div>

            {/* Checklist items (up to 3) */}
            <div className="space-y-1.5">
              {objectives.map((obj) => (
                <div
                  key={obj.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-2xl text-xs transition-all ${
                    obj.completed
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-950'
                      : 'bg-white border border-[#DFC3A6]/60 text-[#2D1B11]'
                  }`}
                >
                  <button
                    onClick={() => onToggleObjective(obj.id)}
                    className={`mt-0.5 w-4 h-4 rounded-lg flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                      obj.completed
                        ? 'bg-emerald-600 text-white scale-105'
                        : 'bg-white border border-[#875F49]/40 hover:border-[#875F49]'
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
                    className="text-[#875F49] hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
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
                  className="flex-1 bg-white border border-[#DFC3A6]/80 rounded-xl px-3 py-1.5 text-[11px] font-medium text-[#2D1B11] placeholder-[#A8826D] focus:outline-none focus:ring-2 focus:ring-[#C68642]/40"
                />
                <button
                  type="submit"
                  disabled={!newText.trim()}
                  className="px-3 py-1.5 bg-[#7E4228] hover:bg-[#924D30] text-white rounded-xl font-black text-xs disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="text-[10px] text-center font-bold text-[#875F49] py-1.5 bg-[#FAF2E6] rounded-xl border border-[#DFC3A6]/60">
                3/3 Target Limit Reached
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
