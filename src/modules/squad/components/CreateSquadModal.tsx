import React, { useState } from 'react'
import { X, Shield, Sparkles, Clock, Users, Globe, Lock } from 'lucide-react'
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
  const [objective, setObjective] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState<number>(50)
  const [maxMembers, setMaxMembers] = useState<number>(5)
  const [isPublic, setIsPublic] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !focus.trim() || !objective.trim()) {
      setError('Please provide Squad name, main topic, and study objective.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const { squad, error: err } = await createSquadDB(currentUser, {
      name: name.trim(),
      focus: focus.trim(),
      objective: objective.trim(),
      description: description.trim() || undefined,
      duration,
      max_members: maxMembers,
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
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-md bg-[#FAF2E6] border border-[#7E4228]/25 rounded-3xl p-6 shadow-2xl text-[#2D1B11] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#7E4228]/15 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#7E4228] text-white flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#2D1B11] leading-tight">Create Study Squad</h2>
              <p className="text-[11px] text-[#7E4228] font-bold">Assemble your learning lobby (3–5 players)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
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
              placeholder="e.g. Tech Explorers, Algorithm Sprints"
              maxLength={40}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF9F2] border border-[#7E4228]/25 text-[#2D1B11] text-sm font-semibold placeholder:text-[#7E4228]/40 focus:outline-hidden focus:border-[#7E4228] shadow-inner"
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
              placeholder="e.g. Web Development, Data Mining, Calculus"
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF9F2] border border-[#7E4228]/25 text-[#2D1B11] text-sm font-semibold placeholder:text-[#7E4228]/40 focus:outline-hidden focus:border-[#7E4228] shadow-inner"
            />
          </div>

          {/* Learning Objective */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#7E4228] tracking-wider mb-1">
              Lobby Objective *
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Review REST APIs and build a simple endpoint"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF9F2] border border-[#7E4228]/25 text-[#2D1B11] text-sm font-semibold placeholder:text-[#7E4228]/40 focus:outline-hidden focus:border-[#7E4228] shadow-inner"
            />
            <p className="text-[10px] text-[#7E4228]/70 mt-1 italic">
              Note: You and your squad mates can refine this objective inside the session.
            </p>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#7E4228] tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Session Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 50, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    duration === d
                      ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-md'
                      : 'bg-[#FFF9F2] text-[#4C271A] border-[#7E4228]/20 hover:bg-[#F3E7D5]'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Capacity Selector (3, 4, 5) */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#7E4228] tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Member Capacity (Min 3 required)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 4, 5].map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setMaxMembers(cap)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    maxMembers === cap
                      ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-md'
                      : 'bg-[#FFF9F2] text-[#4C271A] border-[#7E4228]/20 hover:bg-[#F3E7D5]'
                  }`}
                >
                  {cap} Players {cap === 5 && '★'}
                </button>
              ))}
            </div>
          </div>

          {/* Public vs Private Squad */}
          <div>
            <label className="block text-[11px] font-black uppercase text-[#7E4228] tracking-wider mb-1.5">
              Lobby Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  isPublic
                    ? 'bg-[#EBF7F0] text-emerald-800 border-emerald-500 shadow-sm'
                    : 'bg-[#FFF9F2] text-[#7E4228]/70 border-[#7E4228]/20'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>PUBLIC</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  !isPublic
                    ? 'bg-[#F2EEEC] text-[#7E4228] border-[#7E4228] shadow-sm'
                    : 'bg-[#FFF9F2] text-[#7E4228]/70 border-[#7E4228]/20'
                }`}
              >
                <Lock className="w-4 h-4 text-[#7E4228]" />
                <span>PRIVATE</span>
              </button>
            </div>
            <p className="text-[10px] text-[#7E4228]/70 mt-1">
              {isPublic
                ? 'Public: visible in Squad Discovery. Non-connected learners can request to join.'
                : 'Private: invite-only. Will not appear in public discovery.'}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#7E4228] hover:bg-[#924D30] text-white font-black text-sm rounded-2xl shadow-lg border border-[#FAF2E6]/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>{isSubmitting ? 'Creating Lobby...' : 'Assemble Squad & Enter Lobby'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
