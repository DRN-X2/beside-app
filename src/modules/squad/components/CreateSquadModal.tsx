import React, { useState } from 'react'
import { X, Shield, Sparkles, Clock, Globe, Lock, Plus, Trash2 } from 'lucide-react'
import type { DemoUser } from '../../../types'
import { createSquadDB } from '../../../services/squadService'
import type { Squad } from '../../../services/squadService'

interface CreateSquadModalProps {
  currentUser: DemoUser
  isOpen: boolean
  onClose: () => void
  onSquadCreated: (squad: Squad) => void
}

export const CreateSquadModal: React.FC<CreateSquadModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSquadCreated,
}) => {
  const [name, setName] = useState('')
  const [focus, setFocus] = useState('')
  const [objectives, setObjectives] = useState<string[]>([''])
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState<number>(30) // 15, 30, 60
  const [isPublic, setIsPublic] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleObjectiveChange = (index: number, value: string) => {
    setObjectives((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const handleAddObjective = () => {
    if (objectives.length < 3) {
      setObjectives((prev) => [...prev, ''])
    }
  }

  const handleRemoveObjective = (index: number) => {
    if (objectives.length > 1) {
      setObjectives((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedObjectives = objectives.map((o) => o.trim()).filter((o) => o.length > 0)

    if (!name.trim() || !focus.trim() || trimmedObjectives.length === 0) {
      setError('Please provide Squad name, main topic, and at least one objective.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const { squad, error: err } = await createSquadDB(currentUser, {
      name: name.trim(),
      focus: focus.trim(),
      objectives: trimmedObjectives,
      description: description.trim() || undefined,
      duration,
      privacy: isPublic ? 'public' : 'private',
    })

    setIsSubmitting(false)

    if (err || !squad) {
      setError(err || 'Failed to create squad lobby.')
      return
    }

    onSquadCreated(squad)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      {/* Neumorphic Dialog Modal Card */}
      <div className="w-full max-w-md bg-[#FAF2E6] border border-[#7E4228]/15 rounded-[32px] p-6 shadow-[8px_8px_24px_rgba(126,66,40,0.12),-8px_-8px_24px_rgba(255,255,255,0.95)] text-[#2D1B11] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#7E4228]/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7E4228] text-white flex items-center justify-center shadow-[3px_3px_8px_rgba(126,66,40,0.25),-2px_-2px_6px_rgba(255,255,255,0.7)]">
              <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#2D1B11] leading-tight">Create Study Squad</h2>
              <p className="text-[11px] text-[#7E4228] font-bold">Collaborative learning lobby (3–5 players)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] flex items-center justify-center cursor-pointer shadow-[2px_2px_5px_rgba(126,66,40,0.08),-2px_-2px_5px_rgba(255,255,255,0.9)] active:scale-95 transition-all"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Squad Name */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#7E4228] tracking-wider mb-1">
              Squad Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Algorithm Sprints, Organic Chemistry Review"
              maxLength={40}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF2E6] border border-[#7E4228]/20 text-[#2D1B11] text-xs font-semibold placeholder:text-[#875F49]/50 focus:outline-hidden focus:border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(126,66,40,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] transition-all"
            />
          </div>

          {/* Focus / Topic */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#7E4228] tracking-wider mb-1">
              Main Focus / Topic *
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. Data Structures, Web Development, Microeconomics"
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF2E6] border border-[#7E4228]/20 text-[#2D1B11] text-xs font-semibold placeholder:text-[#875F49]/50 focus:outline-hidden focus:border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(126,66,40,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] transition-all"
            />
          </div>

          {/* Up to 3 Learning Objectives */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black uppercase text-[#7E4228] tracking-wider">
                Learning Objectives (Up to 3) *
              </label>
              <span className="text-[10px] font-bold text-[#875F49]">
                {objectives.length}/3
              </span>
            </div>

            <div className="space-y-2">
              {objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#E5DFD9] text-[#7E4228] font-black text-[10px] flex items-center justify-center shrink-0 border border-[#7E4228]/20">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                    placeholder={idx === 0 ? 'Primary objective (e.g. Solve graph BFS/DFS)' : `Optional objective ${idx + 1}`}
                    maxLength={100}
                    className="flex-1 px-3.5 py-2 rounded-2xl bg-[#FAF2E6] border border-[#7E4228]/20 text-[#2D1B11] text-xs font-semibold placeholder:text-[#875F49]/50 focus:outline-hidden focus:border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(126,66,40,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] transition-all"
                  />
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(idx)}
                      className="w-7 h-7 rounded-xl bg-[#FAF2E6] hover:bg-rose-50 border border-[#7E4228]/20 text-rose-600 flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-all"
                      title="Remove objective"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {objectives.length < 3 && (
              <button
                type="button"
                onClick={handleAddObjective}
                className="mt-2 text-[11px] font-black text-[#7E4228] hover:text-[#4C271A] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add another objective</span>
              </button>
            )}

            <p className="text-[10px] text-[#875F49] mt-1.5 leading-relaxed">
              These objectives will automatically reflect on the Squad in-session checklist.
            </p>
          </div>

          {/* Session Duration Selector: 15 min, 30 min, 60 min (1 hr) */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#7E4228] tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#7E4228]" />
              <span>Session Duration</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { min: 15, label: '15 min' },
                { min: 30, label: '30 min' },
                { min: 60, label: '60 min (1 hr)' },
              ].map(({ min, label }) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDuration(min)}
                  className={`py-2.5 px-1 rounded-2xl text-xs font-black border transition-all cursor-pointer text-center ${
                    duration === min
                      ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.25)]'
                      : 'bg-[#FAF2E6] text-[#7E4228] border-[#7E4228]/20 shadow-[2px_2px_6px_rgba(126,66,40,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] hover:bg-[#F3E7D5]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Lobby Visibility (Public vs Private) */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#7E4228] tracking-wider mb-1.5">
              Lobby Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                  isPublic
                    ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.25)]'
                    : 'bg-[#FAF2E6] text-[#7E4228] border-[#7E4228]/20 shadow-[2px_2px_6px_rgba(126,66,40,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>PUBLIC</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                  !isPublic
                    ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.25)]'
                    : 'bg-[#FAF2E6] text-[#7E4228] border-[#7E4228]/20 shadow-[2px_2px_6px_rgba(126,66,40,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)]'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>PRIVATE</span>
              </button>
            </div>
            <p className="text-[10px] text-[#875F49] mt-1.5 leading-relaxed">
              {isPublic
                ? 'Public squads are discoverable by learners. Capacity is strictly 3 to 5 players.'
                : 'Private squads are invite-only and will not appear in public discovery.'}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#7E4228] hover:bg-[#924D30] text-white font-black text-sm rounded-2xl shadow-[4px_4px_12px_rgba(126,66,40,0.25),-2px_-2px_6px_rgba(255,255,255,0.7)] border border-white/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>{isSubmitting ? 'Assembling Squad...' : 'Assemble Squad & Enter Lobby'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
