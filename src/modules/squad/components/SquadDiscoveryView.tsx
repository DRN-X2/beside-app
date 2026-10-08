import React, { useState } from 'react'
import {
  Shield,
  Sparkles,
  Users,
  Clock,
  Plus,
  Search,
  Check,
  Globe,
  Flame,
  ArrowRight,
  Mail,
} from 'lucide-react'
import type { DemoUser } from '../../../types'
import type { Squad } from '../../../services/squadService'
import OtterAvatar from '../../../components/OtterAvatar'
import { DEFAULT_OTTER } from '../../../utils/profileNormalizer'

interface SquadDiscoveryViewProps {
  currentUser: DemoUser
  squads: Squad[]
  activeLobbySquadId: string | null
  invitesCount: number
  onCreateSquadClick: () => void
  onEnterLobbyClick: (squad: Squad) => void
  onRequestToJoinClick: (squad: Squad) => void
  onOpenInvitesClick: () => void
}

export const SquadDiscoveryView: React.FC<SquadDiscoveryViewProps> = ({
  currentUser,
  squads,
  activeLobbySquadId,
  invitesCount,
  onCreateSquadClick,
  onEnterLobbyClick,
  onRequestToJoinClick,
  onOpenInvitesClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDuration, setSelectedDuration] = useState<number | 'all'>('all')

  // Filter squads based on search & duration (15, 30, 60 min)
  const filteredSquads = squads.filter((s) => {
    if (selectedDuration !== 'all' && s.duration !== selectedDuration) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      s.name.toLowerCase().includes(q) ||
      s.focus.toLowerCase().includes(q) ||
      s.objective.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  // Separate Recommended (score >= 88%) and Starting Soon (members >= 3)
  const recommendedSquads = filteredSquads.filter((s) => (s.match?.score || 0) >= 88)
  const startingSoonSquads = filteredSquads.filter((s) => s.members.length >= 3 && s.members.length < s.max_members)

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-28 space-y-5 select-none">
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#7E4228] text-white flex items-center justify-center shadow-[3px_3px_8px_rgba(126,66,40,0.22),-2px_-2px_6px_rgba(255,255,255,0.8)] border border-white/20">
            <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl text-[#2D1B11] leading-none">SQUAD</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E5DFD9] text-[#7E4228] border border-[#7E4228]/20 shadow-xs">
                3–5 Players
              </span>
            </div>
            <p className="text-[11px] text-[#7E4228] font-bold mt-0.5">
              Collaborative Team Study Lobbies
            </p>
          </div>
        </div>

        {/* Top Actions: Invites Button & Create Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInvitesClick}
            className="relative w-10 h-10 rounded-2xl bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] flex items-center justify-center shadow-[2px_2px_6px_rgba(126,66,40,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] active:scale-95 transition-all cursor-pointer"
            title="Squad Invitations & Requests"
          >
            <Mail className="w-4 h-4" />
            {invitesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#7E4228] text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-xs border border-white">
                {invitesCount}
              </span>
            )}
          </button>

          <button
            onClick={onCreateSquadClick}
            className="h-10 px-4 rounded-2xl bg-[#7E4228] hover:bg-[#924D30] text-white font-black text-xs flex items-center gap-1.5 shadow-[3px_3px_8px_rgba(126,66,40,0.25),-2px_-2px_6px_rgba(255,255,255,0.7)] active:scale-95 transition-all cursor-pointer border border-white/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Active Squad Lobby Banner (If user is currently in a lobby) */}
      {activeLobbySquadId && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#7E4228] to-[#924D30] text-white shadow-[4px_4px_14px_rgba(126,66,40,0.2)] border border-white/15 flex items-center justify-between animate-fade-in">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FAF2E6]/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Lobby Open
            </span>
            <p className="text-xs font-black mt-0.5">Your study squad is currently gathering</p>
          </div>
          <button
            onClick={() => {
              const current = squads.find((s) => s.id === activeLobbySquadId)
              if (current) onEnterLobbyClick(current)
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white text-[#7E4228] text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1 hover:bg-[#FAF2E6]"
          >
            <span>Resume</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ═══════════════════ SEARCH & DURATION FILTERS ═══════════════════ */}
      <div className="space-y-2">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#7E4228]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic, subject, or squad name..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-[#FAF2E6] border border-[#7E4228]/20 text-[#2D1B11] text-xs font-semibold placeholder:text-[#875F49]/50 focus:outline-hidden focus:border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(126,66,40,0.09),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] transition-all"
          />
        </div>

        {/* Duration Pills: 15 min, 30 min, 60 min */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-black text-[#7E4228]/80 uppercase px-1">Duration:</span>
          {[
            { dur: 'all' as const, label: 'All' },
            { dur: 15, label: '15 min' },
            { dur: 30, label: '30 min' },
            { dur: 60, label: '60 min (1 hr)' },
          ].map(({ dur, label }) => (
            <button
              key={dur}
              onClick={() => setSelectedDuration(dur)}
              className={`px-3 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer whitespace-nowrap ${
                selectedDuration === dur
                  ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.25)]'
                  : 'bg-[#FAF2E6] text-[#7E4228] border-[#7E4228]/20 shadow-[2px_2px_5px_rgba(126,66,40,0.08),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:bg-[#F3E7D5]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════ SQUADS LIST OR EMPTY STATE ═══════════════════ */}
      {filteredSquads.length === 0 ? (
        <div className="py-12 px-6 rounded-[32px] bg-[#FAF2E6] border border-[#7E4228]/15 shadow-[inset_3px_3px_8px_rgba(126,66,40,0.08),inset_-3px_-3px_8px_rgba(255,255,255,0.9)] text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF9F2] text-[#7E4228] mx-auto flex items-center justify-center shadow-[3px_3px_7px_rgba(126,66,40,0.08),-3px_-3px_7px_rgba(255,255,255,0.95)] border border-[#7E4228]/15">
            <Shield className="w-7 h-7 fill-[#7E4228]/15 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-[#2D1B11]">
              No Active Squad Lobbies Found
            </h3>
            <p className="text-xs text-[#875F49] font-medium mt-1 max-w-xs mx-auto leading-relaxed">
              Be the first to create a squad lobby! Gather 3 to 5 study buddies and accomplish your goals together.
            </p>
          </div>
          <button
            onClick={onCreateSquadClick}
            className="px-5 py-2.5 rounded-2xl bg-[#7E4228] hover:bg-[#924D30] text-white text-xs font-black shadow-[3px_3px_8px_rgba(126,66,40,0.25),-2px_-2px_6px_rgba(255,255,255,0.7)] active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Study Squad</span>
          </button>
        </div>
      ) : (
        <>
          {/* Starting Soon Section */}
          {startingSoonSquads.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase text-[#7E4228] tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#C85A32]" />
                  <span>Starting Soon</span>
                </h2>
                <span className="text-[10px] font-bold text-[#875F49]">Nearly full</span>
              </div>

              <div className="space-y-3">
                {startingSoonSquads.map((squad) => (
                  <SquadCard
                    key={squad.id}
                    squad={squad}
                    currentUserId={currentUser.id}
                    onEnterLobby={() => onEnterLobbyClick(squad)}
                    onRequestToJoin={() => onRequestToJoinClick(squad)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recommended Squads Section */}
          {recommendedSquads.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase text-[#7E4228] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7E4228]" />
                  <span>Recommended For You</span>
                </h2>
                <span className="text-[10px] font-bold text-[#7E4228] bg-[#FAF2E6] px-2 py-0.5 rounded-full border border-[#7E4228]/20 shadow-xs">
                  Matching-Based
                </span>
              </div>

              <div className="space-y-3">
                {recommendedSquads.map((squad) => (
                  <SquadCard
                    key={squad.id}
                    squad={squad}
                    currentUserId={currentUser.id}
                    onEnterLobby={() => onEnterLobbyClick(squad)}
                    onRequestToJoin={() => onRequestToJoinClick(squad)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Public Squads Section */}
          {filteredSquads.length > recommendedSquads.length && (
            <div className="space-y-2.5 pt-1">
              <h2 className="text-xs font-black uppercase text-[#7E4228] tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#7E4228]" />
                <span>All Public Squads</span>
              </h2>

              <div className="space-y-3">
                {filteredSquads
                  .filter((s) => !recommendedSquads.includes(s))
                  .map((squad) => (
                    <SquadCard
                      key={squad.id}
                      squad={squad}
                      currentUserId={currentUser.id}
                      onEnterLobby={() => onEnterLobbyClick(squad)}
                      onRequestToJoin={() => onRequestToJoinClick(squad)}
                    />
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Individual Neumorphic Squad Card
 */
interface SquadCardProps {
  squad: Squad
  currentUserId: string
  onEnterLobby: () => void
  onRequestToJoin: () => void
}

const SquadCard: React.FC<SquadCardProps> = ({ squad, currentUserId, onEnterLobby, onRequestToJoin }) => {
  const isUserMember = squad.members.some((m) => m.user_id === currentUserId)
  const isLeader = squad.creator_id === currentUserId
  const isFull = squad.members.length >= squad.max_members

  const matchScore = squad.match?.score || 85
  const matchReasons = squad.match?.reasons || [squad.focus]

  return (
    <div className="bg-[#FAF2E6] border border-[#7E4228]/15 rounded-[28px] p-4 shadow-[4px_4px_12px_rgba(126,66,40,0.08),-4px_-4px_12px_rgba(255,255,255,0.95)] hover:shadow-[5px_5px_15px_rgba(126,66,40,0.11),-5px_-5px_15px_rgba(255,255,255,0.95)] transition-all space-y-3 relative overflow-hidden">
      {/* Top Banner Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          {/* Emblem Icon */}
          <div className="w-11 h-11 rounded-2xl bg-[#7E4228] text-white flex items-center justify-center shadow-[3px_3px_8px_rgba(126,66,40,0.22),-2px_-2px_6px_rgba(255,255,255,0.7)] shrink-0 border border-white/20">
            <Shield className="w-6 h-6 fill-white/20 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-display font-black text-sm text-[#2D1B11] tracking-wide leading-tight">
                {squad.name}
              </h3>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FFF9F2] text-[#7E4228] border border-[#7E4228]/20 shadow-xs">
                {squad.privacy}
              </span>
            </div>
            <p className="text-[11px] text-[#7E4228] font-bold mt-0.5">
              {squad.focus}
            </p>
          </div>
        </div>

        {/* Compatibility Match Badge */}
        <div className="flex flex-col items-end">
          <span className="text-[11px] font-black text-[#7E4228] bg-[#FFF9F2] px-2 py-0.5 rounded-lg border border-[#7E4228]/25 shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#7E4228]" />
            {matchScore}% Match
          </span>
          <span className="text-[10px] text-[#875F49] font-bold mt-0.5">
            {squad.duration} min
          </span>
        </div>
      </div>

      {/* Objectives Display (Primary + extra if available) */}
      <div className="bg-[#FAF2E6] p-3 rounded-2xl border border-[#7E4228]/15 shadow-[inset_2px_2px_4px_rgba(126,66,40,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] space-y-1">
        <p className="text-xs text-[#4C271A] font-semibold italic leading-relaxed">
          "{squad.objective}"
        </p>
        {squad.objectives && squad.objectives.length > 1 && (
          <div className="pt-1 border-t border-[#7E4228]/10 space-y-0.5">
            {squad.objectives.slice(1).map((obj, i) => (
              <p key={i} className="text-[10.5px] text-[#875F49] font-medium">
                • {obj}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Match Reasons Badges */}
      <div className="flex items-center gap-1 flex-wrap">
        {matchReasons.map((r, i) => (
          <span
            key={i}
            className="text-[10px] font-bold bg-[#FAF2E6] text-[#7E4228] px-2 py-0.5 rounded-md border border-[#7E4228]/20 shadow-xs flex items-center gap-1"
          >
            <Check className="w-2.5 h-2.5 text-[#7E4228] stroke-[3]" />
            <span>{r}</span>
          </span>
        ))}
      </div>

      {/* Bottom Row: 5 Member Slots + Action Button */}
      <div className="pt-2 border-t border-[#7E4228]/15 flex items-center justify-between gap-2">
        {/* 5 Slots Lineup */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: squad.max_members }).map((_, idx) => {
            const member = squad.members[idx]
            if (member) {
              return (
                <div
                  key={idx}
                  className="w-7 h-7 rounded-full bg-[#FAF2E6] border border-[#7E4228]/40 overflow-hidden flex items-center justify-center shadow-xs"
                  title={member.profile?.display_name || 'Member'}
                >
                  <OtterAvatar config={member.profile?.otter || DEFAULT_OTTER} size="xs" />
                </div>
              )
            }
            return (
              <div
                key={idx}
                className="w-7 h-7 rounded-full bg-[#FAF2E6] border border-dashed border-[#7E4228]/30 flex items-center justify-center text-[10px] font-black text-[#7E4228]/40 shadow-inner"
                title="Open slot"
              >
                +
              </div>
            )
          })}
          <span className="text-[11px] font-black text-[#2D1B11] ml-1">
            {squad.members.length}/{squad.max_members}
          </span>
        </div>

        {/* Action Button */}
        {isUserMember ? (
          <button
            onClick={onEnterLobby}
            className="px-4 py-2 rounded-xl bg-[#7E4228] hover:bg-[#924D30] text-white text-xs font-black shadow-[3px_3px_8px_rgba(126,66,40,0.22),-2px_-2px_6px_rgba(255,255,255,0.7)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>{isLeader ? 'Lead Lobby' : 'In Lobby'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : isFull ? (
          <div className="px-3 py-1.5 rounded-xl bg-[#E5DFD9] text-[#7E4228] text-xs font-black border border-[#7E4228]/20">
            Lobby Full
          </div>
        ) : (
          <button
            onClick={onRequestToJoin}
            className="px-3.5 py-2 rounded-xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-[#7E4228] text-xs font-black shadow-[2px_2px_5px_rgba(126,66,40,0.08),-2px_-2px_5px_rgba(255,255,255,0.95)] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Request to Join</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
