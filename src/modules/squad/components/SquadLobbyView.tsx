import React, { useState, useEffect } from 'react'
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
  ArrowLeft,
  Mail,
  Target,
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
  available: 'bg-emerald-600',
  online: 'bg-emerald-600',
  duo: 'bg-blue-600',
  squad: 'bg-purple-600',
  away: 'bg-amber-600',
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

  // Build the 5 slots array (always fixed 5 slots)
  const totalSlots = 5
  const slots: (SquadMember | null)[] = Array.from({ length: totalSlots }).map((_, idx) => {
    return squad.members.find((m) => m.slot_index === idx) || squad.members[idx] || null
  })

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Objectives array (up to 3)
  const objectivesList = squad.objectives && squad.objectives.length > 0
    ? squad.objectives
    : [squad.objective]

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-28 space-y-4 select-none">
      {/* ═══════════════════ TOP HEADER ═══════════════════ */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBackToDiscovery}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] text-xs font-black shadow-[2px_2px_6px_rgba(126,66,40,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Discovery</span>
        </button>

        {/* Member Counter Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-[#FAF2E6] text-[#7E4228] border border-[#7E4228]/20 shadow-xs">
            {squad.privacy.toUpperCase()}
          </span>
          <div className="px-3 py-1 rounded-xl bg-[#7E4228] text-white text-xs font-black shadow-[2px_2px_6px_rgba(126,66,40,0.25)] flex items-center gap-1.5 border border-white/20">
            <Users className="w-3.5 h-3.5" />
            <span>
              {memberCount}/{squad.max_members}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════ SQUAD TITLE & EMBLEM BANNER ═══════════════════ */}
      <div className="bg-[#FAF2E6] border border-[#7E4228]/15 rounded-[28px] p-4 shadow-[4px_4px_12px_rgba(126,66,40,0.08),-4px_-4px_12px_rgba(255,255,255,0.95)] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7E4228] text-white flex items-center justify-center shadow-[3px_3px_8px_rgba(126,66,40,0.22),-2px_-2px_6px_rgba(255,255,255,0.7)] border border-white/20 shrink-0">
            <Shield className="w-6 h-6 fill-white/20 stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-lg text-[#2D1B11] truncate tracking-wide leading-tight">
              {squad.name}
            </h1>
            <p className="text-xs text-[#7E4228] font-bold">
              {squad.focus} · {squad.duration} min session
            </p>
          </div>
        </div>

        {/* Objectives Card (Up to 3 Objectives) */}
        <div className="bg-[#FAF2E6] p-3 rounded-2xl border border-[#7E4228]/15 shadow-[inset_2px_2px_4px_rgba(126,66,40,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#7E4228] tracking-wider mb-0.5">
            <Target className="w-3.5 h-3.5" />
            <span>Squad Objectives ({objectivesList.length})</span>
          </div>
          {objectivesList.map((obj, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#4C271A] font-semibold leading-relaxed">
              <span className="w-4 h-4 rounded-full bg-[#E5DFD9] text-[#7E4228] text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5 border border-[#7E4228]/20">
                {i + 1}
              </span>
              <span>{obj}</span>
            </div>
          ))}
        </div>

        {/* Tags & Match */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {squad.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-bold bg-[#FFF9F2] text-[#7E4228] px-2 py-0.5 rounded-md border border-[#7E4228]/15 shadow-xs"
            >
              #{tag}
            </span>
          ))}
          {squad.match && (
            <span className="text-[10px] font-black text-[#7E4228] bg-[#FFF9F2] px-2 py-0.5 rounded-md border border-[#7E4228]/20 ml-auto flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-[#7E4228]" />
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
            <span>Team Lineup (3–5 Players)</span>
          </span>
          <span className="text-[11px] font-bold text-[#875F49]">
            {readyCount} of {memberCount} Ready
          </span>
        </div>

        {/* 5 Slots Pedestal Cards */}
        <div className="grid grid-cols-5 gap-1.5">
          {slots.map((member, slotIndex) => {
            if (member) {
              const isSlotLeader = member.role === 'leader' || member.slot_index === 0
              const isSelf = member.user_id === currentUser.id
              const statusDot = STATUS_DOT_COLORS[member.profile?.online_status || 'available'] || 'bg-emerald-600'

              return (
                <div
                  key={slotIndex}
                  className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all text-center relative ${
                    isSelf
                      ? 'bg-[#FFF9F2] border-[#7E4228] shadow-[3px_3px_8px_rgba(126,66,40,0.12),-2px_-2px_6px_rgba(255,255,255,0.95)] ring-1 ring-[#7E4228]/30'
                      : 'bg-[#FAF2E6] border-[#7E4228]/15 shadow-[2px_2px_6px_rgba(126,66,40,0.07),-2px_-2px_6px_rgba(255,255,255,0.9)]'
                  }`}
                >
                  {/* Leader Crown Badge */}
                  {isSlotLeader && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#7E4228] text-white rounded-full p-0.5 shadow-xs border border-white">
                      <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                    </div>
                  )}

                  {/* Leader remove button */}
                  {isLeader && !isSelf && (
                    <button
                      onClick={() => onRemoveMember(member.user_id)}
                      title="Remove member"
                      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs cursor-pointer hover:bg-rose-600 transition-all border border-white"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  )}

                  {/* Avatar Container with Status Dot */}
                  <div className="relative mt-1 mb-1.5">
                    <div className="w-12 h-12 rounded-full bg-[#FAF2E6] border-2 border-[#7E4228]/30 overflow-hidden flex items-center justify-center shadow-xs">
                      <OtterAvatar config={member.profile?.otter || DEFAULT_OTTER} size="xs" />
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ${statusDot} border-2 border-white shadow-xs`}
                      title={`Status: ${member.profile?.online_status || 'available'}`}
                    />
                  </div>

                  {/* Member Name */}
                  <span className="text-[10px] font-black text-[#2D1B11] truncate w-full px-0.5 leading-tight">
                    {isSelf ? 'YOU' : member.profile?.display_name?.split(' ')[0] || 'Member'}
                  </span>

                  {/* Role / Degree */}
                  <span className="text-[8.5px] text-[#875F49] font-bold truncate w-full leading-none mt-0.5">
                    {isSlotLeader
                      ? 'Leader'
                      : (member.profile as any)?.year_of_study || member.profile?.degree_program?.split(' ')[0] || 'Member'}
                  </span>

                  {/* Ready State Badge */}
                  <div className="mt-1.5 w-full">
                    {member.ready ? (
                      <span className="text-[8.5px] font-black uppercase text-white bg-[#7E4228] rounded-md py-0.5 px-1 block shadow-xs border border-white/20">
                        READY
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-bold uppercase text-[#875F49] bg-[#E5DFD9] rounded-md py-0.5 px-1 block border border-[#7E4228]/15">
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
                className="flex flex-col items-center justify-center p-2 rounded-2xl border border-dashed border-[#7E4228]/30 bg-[#FAF2E6] hover:bg-[#F3E7D5] text-[#7E4228]/60 hover:text-[#7E4228] transition-all cursor-pointer shadow-[inset_2px_2px_4px_rgba(126,66,40,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] min-h-[120px]"
                title="Tap to invite teammates"
              >
                <div className="w-9 h-9 rounded-full bg-[#FAF2E6] border border-[#7E4228]/25 flex items-center justify-center text-[#7E4228] mb-1.5 shadow-[2px_2px_4px_rgba(126,66,40,0.08),-2px_-2px_4px_rgba(255,255,255,0.9)]">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-[9px] font-black uppercase text-[#7E4228]">
                  Open
                </span>
                <span className="text-[8px] font-bold text-[#875F49]/70 mt-0.5">Invite</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════ LOBBY STATUS & GATHERING TIMER ═══════════════════ */}
      <div className="bg-[#FAF2E6] border border-[#7E4228]/15 rounded-[28px] p-3.5 shadow-[4px_4px_12px_rgba(126,66,40,0.08),-4px_-4px_12px_rgba(255,255,255,0.95)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7E4228]" />
            <span className="text-xs font-black uppercase text-[#7E4228] tracking-wider">
              Gathering Team
            </span>
          </div>

          {/* Countdown Pill */}
          <div
            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-[inset_2px_2px_4px_rgba(126,66,40,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] ${
              timeLeft <= 15
                ? 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse'
                : 'bg-[#FAF2E6] text-[#7E4228] border border-[#7E4228]/20'
            }`}
          >
            <span>{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Status Message */}
        {memberCount < squad.min_members ? (
          <div className="flex items-start gap-2 bg-[#FFF9F2] p-2.5 rounded-2xl border border-[#7E4228]/15 text-xs text-[#7E4228] font-bold shadow-xs">
            <AlertCircle className="w-4 h-4 text-[#7E4228] shrink-0 mt-0.5" />
            <p>
              Need at least <strong>{squad.min_members} players</strong> to begin (Currently {memberCount}/
              {squad.max_members}). Invite friends or wait for join requests.
            </p>
          </div>
        ) : !canStart ? (
          <div className="flex items-start gap-2 bg-[#FFF9F2] p-2.5 rounded-2xl border border-[#7E4228]/15 text-xs text-[#7E4228] font-bold shadow-xs">
            <Clock className="w-4 h-4 text-[#7E4228] shrink-0 mt-0.5" />
            <p>
              Player capacity reached! Waiting for all members to press <strong>READY</strong>.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#FFF9F2] p-2.5 rounded-2xl border border-[#7E4228]/20 text-xs text-[#7E4228] font-black shadow-xs">
            <Check className="w-4 h-4 text-[#7E4228] stroke-[3]" />
            <span>All requirements met! The squad is ready to start studying.</span>
          </div>
        )}

        {/* Timer Expiration Notice */}
        {timerExpired && memberCount < squad.min_members && (
          <div className="p-3 rounded-2xl bg-[#FFF9F2] border border-[#7E4228]/20 text-[#2D1B11] text-xs font-bold space-y-1 shadow-xs">
            <p>Gathering timer expired with fewer than 3 players.</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setTimeLeft(60)
                  setTimerExpired(false)
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#7E4228] text-white text-[11px] font-black cursor-pointer shadow-xs"
              >
                Keep Waiting (+60s)
              </button>
              <button
                onClick={onLeaveSquad}
                className="px-3.5 py-1.5 rounded-xl bg-[#FAF2E6] text-[#7E4228] border border-[#7E4228]/25 text-[11px] font-bold cursor-pointer"
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
            className="py-2.5 px-3 rounded-2xl bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_5px_rgba(126,66,40,0.08),-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Friends</span>
          </button>

          {isLeader && joinRequests.length > 0 ? (
            <button
              onClick={onOpenRequestsModal}
              className="py-2.5 px-3 rounded-2xl bg-[#7E4228] hover:bg-[#924D30] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_6px_rgba(126,66,40,0.25)] transition-all active:scale-95 cursor-pointer animate-pulse border border-white/20"
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
              className="py-2.5 px-3 rounded-2xl bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_5px_rgba(126,66,40,0.08),-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Squad</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════ BOTTOM ACTION FOOTER (READY & START) ═══════════════════ */}
      <div className="space-y-2 pt-1">
        {/* Toggle Ready Button for every participant */}
        <button
          onClick={() => onToggleReady(!isCurrentUserReady)}
          className={`w-full py-3.5 rounded-2xl text-xs font-black border transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
            isCurrentUserReady
              ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.25)]'
              : 'bg-[#FFF9F2] hover:bg-[#F3E7D5] text-[#7E4228] border-[#7E4228]/25 shadow-[4px_4px_10px_rgba(126,66,40,0.1),-4px_-4px_10px_rgba(255,255,255,0.95)]'
          }`}
        >
          {isCurrentUserReady ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>YOU ARE READY (Tap to unready)</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-[#7E4228]" />
              <span>READY UP</span>
            </>
          )}
        </button>

        {/* Leader Start Session Button */}
        {isLeader && (
          <button
            onClick={onStartSession}
            disabled={!canStart}
            className={`w-full py-3.5 rounded-2xl text-xs font-black border transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
              canStart
                ? 'bg-[#7E4228] hover:bg-[#924D30] text-white border-white/20 shadow-[4px_4px_14px_rgba(126,66,40,0.3),-2px_-2px_8px_rgba(255,255,255,0.8)] animate-pulse'
                : 'bg-[#FAF2E6] text-[#7E4228]/40 border-[#7E4228]/15 shadow-[inset_2px_2px_4px_rgba(126,66,40,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
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
        <div className="pt-1 text-center">
          <button
            onClick={onLeaveSquad}
            className="text-xs text-[#875F49] hover:text-rose-600 font-bold transition-colors cursor-pointer"
          >
            {isLeader ? 'Disband / Leave Squad Lobby' : 'Leave Squad Lobby'}
          </button>
        </div>
      </div>
    </div>
  )
}
