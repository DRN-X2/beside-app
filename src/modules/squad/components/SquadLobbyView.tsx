import React, { useState, useEffect, useRef } from 'react'
import {
  Shield,
  Crown,
  Sparkles,
  Users,
  Clock,
  Plus,
  Check,
  X,
  UserPlus,
  Share2,
  AlertCircle,
  Play,
  RotateCcw,
  ArrowLeft,
  Mail,
  Trash2,
} from 'lucide-react'
import type { DemoUser } from '../../../types'
import type { Squad, SquadMember, SquadJoinRequest } from '../../../services/squadService'
import OtterAvatar from '../../../components/OtterAvatar'
import { DEFAULT_OTTER } from '../../../utils/profileNormalizer'

interface SquadLobbyViewProps {
  squad: Squad
  currentUser: DemoUser
  joinRequests: SquadJoinRequest[]
  onBackToDiscovery: () => void
  onToggleReady: (ready: boolean) => void
  onStartSession: () => void
  onLeaveSquad: () => void
  onOpenInviteModal: () => void
  onOpenRequestsModal: () => void
  onRemoveMember: (memberId: string) => void
}

const STATUS_DOT_COLORS: Record<string, string> = {
  available: 'bg-emerald-500',
  online: 'bg-emerald-500',
  duo: 'bg-blue-500',
  squad: 'bg-purple-500',
  away: 'bg-amber-500',
  offline: 'bg-neutral-400',
}

export const SquadLobbyView: React.FC<SquadLobbyViewProps> = ({
  squad,
  currentUser,
  joinRequests,
  onBackToDiscovery,
  onToggleReady,
  onStartSession,
  onLeaveSquad,
  onOpenInviteModal,
  onOpenRequestsModal,
  onRemoveMember,
}) => {
  const isLeader = squad.creator_id === currentUser.id
  const currentMember = squad.members.find((m) => m.user_id === currentUser.id)
  const isCurrentUserReady = currentMember?.ready ?? false

  // 1-minute gathering countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [timerExpired, setTimerExpired] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setTimerExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [squad.id])

  const memberCount = squad.members.length
  const readyCount = squad.members.filter((m) => m.ready).length
  const canStart = memberCount >= squad.min_members && readyCount >= squad.min_members

  // Build the 5 slots array (max_members is 3, 4, or 5)
  const totalSlots = squad.max_members || 5
  const slots: (SquadMember | null)[] = Array.from({ length: totalSlots }).map((_, idx) => {
    return squad.members.find((m) => m.slot_index === idx) || squad.members[idx] || null
  })

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-28 space-y-4 select-none">
      {/* ═══════════════════ TOP HEADER ═══════════════════ */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBackToDiscovery}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-[#7E4228] text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Discovery</span>
        </button>

        {/* Member Counter Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FAF2E6] text-[#7E4228] border border-[#7E4228]/20">
            {squad.privacy.toUpperCase()}
          </span>
          <div className="px-3 py-1 rounded-xl bg-[#7E4228] text-white text-xs font-black shadow-sm flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>
              {memberCount}/{squad.max_members}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════ SQUAD TITLE & EMBLEM BANNER ═══════════════════ */}
      <div className="bg-[#FFF9F2] border border-[#7E4228]/20 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7E4228] to-[#9E5131] text-white flex items-center justify-center shadow-md border border-white/20 shrink-0">
            <Shield className="w-7 h-7 fill-white/20" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-lg text-[#2D1B11] truncate tracking-wide">
              {squad.name}
            </h1>
            <p className="text-xs text-[#7E4228] font-bold">
              {squad.focus} · {squad.duration} min session
            </p>
          </div>
        </div>

        {/* Objective */}
        <div className="bg-[#FAF2E6] p-3 rounded-2xl border border-[#7E4228]/15 text-xs text-[#4C271A] font-medium italic">
          "{squad.objective}"
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {squad.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-bold bg-[#FAF2E6] text-[#7E4228] px-2 py-0.5 rounded-md border border-[#7E4228]/15"
            >
              #{tag}
            </span>
          ))}
          {squad.match && (
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 ml-auto flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600 fill-emerald-600" />
              {squad.match.score}% Match
            </span>
          )}
        </div>
      </div>

      {/* ═══════════════════ THE 5-SLOT TEAM LINEUP (Game Lobby Centerpiece) ═══════════════════ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase text-[#7E4228] tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#7E4228]" />
            <span>Team Lineup</span>
          </span>
          <span className="text-[11px] font-bold text-[#7E4228]/80">
            {readyCount} of {memberCount} Ready
          </span>
        </div>

        {/* Horizontal Team Pedestal Cards */}
        <div className="grid grid-cols-5 gap-1.5">
          {slots.map((member, slotIndex) => {
            if (member) {
              const isSlotLeader = member.role === 'leader' || member.slot_index === 0
              const isSelf = member.user_id === currentUser.id
              const statusDot = STATUS_DOT_COLORS[member.profile?.online_status || 'available'] || 'bg-emerald-500'

              return (
                <div
                  key={slotIndex}
                  className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all text-center relative ${
                    isSelf
                      ? 'bg-[#FFF9F2] border-[#7E4228] shadow-md ring-2 ring-[#7E4228]/20'
                      : 'bg-[#FFF9F2] border-[#7E4228]/20 shadow-xs'
                  }`}
                >
                  {/* Leader Crown Badge */}
                  {isSlotLeader && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white rounded-full p-0.5 shadow-xs border border-white">
                      <Crown className="w-3 h-3 fill-white" />
                    </div>
                  )}

                  {/* Leader remove button (if leader viewing other member) */}
                  {isLeader && !isSelf && (
                    <button
                      onClick={() => onRemoveMember(member.user_id)}
                      title="Remove member"
                      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs cursor-pointer hover:bg-rose-600 transition-all"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  )}

                  {/* Avatar Container with Status Indicator */}
                  <div className="relative mt-1 mb-1.5">
                    <div className="w-12 h-12 rounded-full bg-[#FAF2E6] border-2 border-[#7E4228]/30 overflow-hidden flex items-center justify-center shadow-xs">
                      <OtterAvatar config={member.profile?.otter || DEFAULT_OTTER} size="xs" />
                    </div>
                    {/* Online status dot */}
                    <div
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ${statusDot} border-2 border-white shadow-xs`}
                      title={`Status: ${member.profile?.online_status || 'available'}`}
                    />
                  </div>

                  {/* Member Name */}
                  <span className="text-[10px] font-black text-[#2D1B11] truncate w-full px-0.5 leading-tight">
                    {isSelf ? 'YOU' : member.profile?.display_name?.split(' ')[0] || 'Member'}
                  </span>

                  {/* Role / Year */}
                  <span className="text-[8.5px] text-[#7E4228] font-bold truncate w-full leading-none mt-0.5">
                    {isSlotLeader ? 'Leader' : (member.profile as any)?.year_of_study || member.profile?.degree_program?.split(' ')[0] || 'Member'}
                  </span>

                  {/* Ready State Badge */}
                  <div className="mt-1.5 w-full">
                    {member.ready ? (
                      <span className="text-[8.5px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-md py-0.5 px-1 block shadow-xs">
                        ✓ READY
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-bold uppercase text-[#7E4228]/70 bg-[#FAF2E6] border border-[#7E4228]/20 rounded-md py-0.5 px-1 block">
                        WAITING
                      </span>
                    )}
                  </div>
                </div>
              )
            }

            {/* Empty Slot Pod */}
            return (
              <button
                key={slotIndex}
                onClick={onOpenInviteModal}
                className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-dashed border-[#7E4228]/25 bg-[#FAF2E6]/60 hover:bg-[#FAF2E6] text-[#7E4228]/50 hover:text-[#7E4228] transition-all cursor-pointer group min-h-[120px]"
                title="Tap to invite teammates"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFF9F2] border border-[#7E4228]/20 flex items-center justify-center text-[#7E4228] mb-2 shadow-inner group-hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-[9px] font-black uppercase text-[#7E4228]/60 group-hover:text-[#7E4228]">
                  Open
                </span>
                <span className="text-[8px] font-bold text-[#7E4228]/40 mt-0.5">Invite</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════ LOBBY STATUS & GATHERING TIMER ═══════════════════ */}
      <div className="bg-[#FFF9F2] border border-[#7E4228]/20 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7E4228]" />
            <span className="text-xs font-black uppercase text-[#7E4228] tracking-wider">
              Gathering Team
            </span>
          </div>

          {/* Countdown Pill */}
          <div
            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-inner ${
              timeLeft <= 15
                ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                : 'bg-[#FAF2E6] text-[#7E4228] border border-[#7E4228]/20'
            }`}
          >
            <span>{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Status Message */}
        {memberCount < squad.min_members ? (
          <div className="flex items-start gap-2 bg-[#FAF2E6] p-2.5 rounded-xl border border-[#7E4228]/15 text-xs text-[#7E4228] font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Need at least <strong>{squad.min_members} players</strong> to begin. (Currently {memberCount}/
              {squad.max_members}). Invite friends or wait for requests.
            </p>
          </div>
        ) : !canStart ? (
          <div className="flex items-start gap-2 bg-[#FAF2E6] p-2.5 rounded-xl border border-[#7E4228]/15 text-xs text-[#7E4228] font-bold">
            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Capacity reached! Waiting for all members to press <strong>READY</strong>.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-300 text-xs text-emerald-800 font-black">
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>All requirements met! The squad is ready to start studying.</span>
          </div>
        )}

        {/* Timer Expiration Notice */}
        {timerExpired && memberCount < squad.min_members && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold space-y-1">
            <p>Gathering timer expired with fewer than 3 players.</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setTimeLeft(60)
                  setTimerExpired(false)
                }}
                className="px-3 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-black cursor-pointer"
              >
                Keep Waiting (+60s)
              </button>
              <button
                onClick={onLeaveSquad}
                className="px-3 py-1 rounded-lg bg-[#FAF2E6] text-[#7E4228] border border-[#7E4228]/25 text-[10px] font-bold cursor-pointer"
              >
                Leave Squad
              </button>
            </div>
          </div>
        )}

        {/* Quick Gathering Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenInviteModal}
            className="py-2.5 px-3 rounded-xl bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-[#7E4228] text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Friends</span>
          </button>

          {isLeader && joinRequests.length > 0 ? (
            <button
              onClick={onOpenRequestsModal}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer animate-pulse"
            >
              <Mail className="w-4 h-4" />
              <span>Requests ({joinRequests.length})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Join my squad: ${squad.name}`,
                    text: `Let's study ${squad.focus} together on BESIDE!`,
                    url: window.location.href,
                  }).catch(() => {})
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-[#7E4228] text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Squad</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════ BOTTOM ACTION FOOTER (READY & START) ═══════════════════ */}
      <div className="space-y-2 pt-2">
        {/* Toggle Ready Button for every participant */}
        <button
          onClick={() => onToggleReady(!isCurrentUserReady)}
          className={`w-full py-3.5 rounded-2xl text-sm font-black shadow-md border transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
            isCurrentUserReady
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400 shadow-emerald-600/30 ring-2 ring-emerald-500/20'
              : 'bg-[#FFF9F2] hover:bg-[#F3E7D5] text-[#7E4228] border-[#7E4228]/30 shadow-xs'
          }`}
        >
          {isCurrentUserReady ? (
            <>
              <Check className="w-5 h-5 stroke-[3]" />
              <span>YOU ARE READY (Tap to unready)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 fill-[#7E4228]" />
              <span>READY UP</span>
            </>
          )}
        </button>

        {/* Leader Start Session Button */}
        {isLeader && (
          <button
            onClick={onStartSession}
            disabled={!canStart}
            className={`w-full py-4 rounded-2xl text-sm font-black shadow-lg border transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
              canStart
                ? 'bg-gradient-to-r from-[#7E4228] to-[#A45737] text-white border-[#FAF2E6]/30 shadow-[#7E4228]/40 animate-pulse'
                : 'bg-[#E5DFD9] text-[#7E4228]/40 border-[#7E4228]/15 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>
              {canStart
                ? 'START STUDY SESSION'
                : memberCount < squad.min_members
                ? `NEED AT LEAST ${squad.min_members} PLAYERS TO START`
                : 'WAITING FOR ALL PLAYERS TO READY UP'}
            </span>
          </button>
        )}

        {/* Leave Lobby Button */}
        <div className="pt-2 text-center">
          <button
            onClick={onLeaveSquad}
            className="text-xs text-[#7E4228]/70 hover:text-rose-600 font-bold transition-colors cursor-pointer"
          >
            {isLeader ? 'Disband / Leave Squad Lobby' : 'Leave Squad Lobby'}
          </button>
        </div>
      </div>
    </div>
  )
}
