import React, { useState } from 'react'
import { X, Shield, Sparkles, Check, Send, AlertCircle } from 'lucide-react'
import type { DemoUser } from '../../../types'
import { sendJoinRequestDB } from '../../../services/squadService'
import type { Squad } from '../../../services/squadService'

interface JoinRequestModalProps {
  squad: Squad | null
  currentUser: DemoUser
  isOpen: boolean
  onClose: () => void
  onRequestSent: (squadId: string) => void
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  squad,
  currentUser,
  isOpen,
  onClose,
  onRequestSent,
}) => {
  const [isSending, setIsSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !squad) return null

  const handleSend = async () => {
    setIsSending(true)
    setError(null)

    const { error: err } = await sendJoinRequestDB(squad, currentUser)
    setIsSending(false)

    if (err) {
      setError(err)
      return
    }

    setSentSuccess(true)
    setTimeout(() => {
      setSentSuccess(false)
      onRequestSent(squad.id)
      onClose()
    }, 1200)
  }

  const matchScore = squad.match?.score || 90
  const reasons = squad.match?.reasons || [squad.focus]

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-sm bg-[#FAF2E6] border border-[#7E4228]/25 rounded-3xl p-6 shadow-2xl text-[#2D1B11] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#7E4228]/15 mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#7E4228] fill-[#7E4228]/20" />
            <h3 className="font-display font-black text-base text-[#2D1B11]">Request to Join Squad?</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Squad Details Card */}
        <div className="bg-[#FFF9F2] border border-[#7E4228]/20 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="text-[10px] font-black uppercase text-[#7E4228] tracking-wider mb-1">
            TARGET LOBBY
          </div>
          <h4 className="font-display font-black text-base text-[#2D1B11] leading-tight">
            {squad.name}
          </h4>
          <p className="text-xs text-[#7E4228] font-bold mt-0.5">
            Focus: {squad.focus}
          </p>
          <p className="text-xs text-[#4C271A] mt-1.5 font-medium italic">
            "{squad.objective}"
          </p>

          <div className="mt-3 pt-3 border-t border-[#7E4228]/10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7E4228]">Players:</span>
            <span className="text-xs font-black text-[#2D1B11] bg-[#FAF2E6] px-2 py-0.5 rounded-md border border-[#7E4228]/20">
              {squad.members.length}/{squad.max_members}
            </span>
          </div>
        </div>

        {/* Compatibility Section */}
        <div className="bg-[#FAF2E6] border border-emerald-500/30 rounded-2xl p-3.5 mb-4 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-[#2D1B11] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              Your Compatibility
            </span>
            <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
              {matchScore}% Match
            </span>
          </div>

          <div className="space-y-1">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-[#4C271A] font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2 bg-[#FFF9F2] p-2.5 rounded-xl border border-[#7E4228]/15 mb-4 text-[10px] text-[#7E4228] font-medium leading-relaxed">
          <AlertCircle className="w-4 h-4 text-[#7E4228] shrink-0 mt-0.5" />
          <p>
            The Squad Leader will review your request. Joining does <strong>NOT</strong> automatically create a BESIDE connection.
          </p>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Actions */}
        {sentSuccess ? (
          <div className="w-full py-3 bg-emerald-600 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Join Request Sent to Leader!</span>
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-full py-3.5 bg-[#7E4228] hover:bg-[#924D30] text-white font-black text-xs rounded-2xl shadow-lg border border-[#FAF2E6]/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Sending Request...' : 'Send Request to Join'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
