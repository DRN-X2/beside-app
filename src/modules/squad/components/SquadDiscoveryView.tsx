import React, { useState } from 'react'
import {
  Shield,
  Sparkles,
  Users,
  Clock,
  Plus,
  Search,
  Filter,
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

  // Filter squads based on search & duration
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
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#7E4228] text-white flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl text-[#2D1B11] leading-none">SQUAD</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E5DFD9] text-[#7E4228] border border-[#7E4228]/25">
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
            className="relative w-10 h-10 rounded-2xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-[#7E4228] flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
            title="Squad Invitations"
          >
            <Mail className="w-4 h-4" />
            {invitesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-xs">
                {invitesCount}
              </span>
            )}
          </button>

          <button
            onClick={onCreateSquadClick}
            className="h-10 px-3.5 rounded-2xl bg-[#7E4228] hover:bg-[#924D30] text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Active Squad Lobby Banner (If user is currently in a lobby) */}
      {activeLobbySquadId && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#7E4228] to-[#924D30] text-white shadow-lg flex items-center justify-between animate-fade-in">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">
              ● Active Lobby Open
            </span>
            <p className="text-xs font-black mt-0.5">Your squad is currently gathering</p>
          </div>
          <button
            onClick={() => {
              const current = squads.find((s) => s.id === activeLobbySquadId)
              if (current) onEnterLobbyClick(current)
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white text-[#7E4228] text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1"
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
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-[#FFF9F2] border border-[#7E4228]/20 text-[#2D1B11] text-xs font-semibold placeholder:text-[#7E4228]/40 focus:outline-hidden focus:border-[#7E4228] shadow-inner"
          />
        </div>

        {/* Duration Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-black text-[#7E4228]/70 uppercase px-1">Duration:</span>
          {(['all', 30, 50, 60] as const).map((dur) => (
            <button
              key={dur}
              onClick={() => setSelectedDuration(dur)}
              className={`px-3 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer whitespace-nowrap ${
                selectedDuration === dur
                  ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-xs'
                  : 'bg-[#FFF9F2] text-[#7E4228] border-[#7E4228]/20 hover:bg-[#F3E7D5]'
              }`}
            >
              {dur === 'all' ? 'All' : `${dur} min`}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════ STARTING SOON SECTION ═══════════════════ */}
      {startingSoonSquads.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase text-[#7E4228] tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
              <span>Starting Soon</span>
            </h2>
            <span className="text-[10px] font-bold text-[#7E4228]/70">Ready to launch</span>
          </div>

          <div className="space-y-3">
            {startingSoonSquads.slice(0, 2).map((squad) => (
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

      {/* ═══════════════════ RECOMMENDED SQUADS SECTION ═══════════════════ */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-[#7E4228] tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>Recommended For You</span>
          </h2>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            Matching-Based
          </span>
        </div>

        {recommendedSquads.length === 0 ? (
          <div className="text-center py-8 bg-[#FFF9F2] rounded-2xl border border-[#7E4228]/15 text-xs text-[#7E4228] font-bold">
            No matching squads found. Try clearing your search or create one!
          </div>
        ) : (
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
        )}
      </div>

      {/* ═══════════════════ ALL PUBLIC SQUADS ═══════════════════ */}
      {filteredSquads.length > recommendedSquads.length && (
        <div className="space-y-2.5 pt-2">
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
    </div>
  )
}

/**
 * Individual Game-Lobby Styled Squad Card
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
    <div className="bg-[#FFF9F2] border border-[#7E4228]/20 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden">
      {/* Top Banner Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          {/* Emblem Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7E4228] to-[#A45737] text-white flex items-center justify-center shadow-md shrink-0 border border-white/20">
            <Shield className="w-6 h-6 fill-white/20" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-display font-black text-sm text-[#2D1B11] tracking-wide leading-tight">
                {squad.name}
              </h3>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#FAF2E6] text-[#7E4228] border border-[#7E4228]/20">
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
          <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600 fill-emerald-600" />
            {matchScore}% Match
          </span>
          <span className="text-[9px] text-[#7E4228]/70 font-semibold mt-0.5">
            {squad.duration} min
          </span>
        </div>
      </div>

      {/* Objective Quote */}
      <div className="bg-[#FAF2E6] p-2.5 rounded-2xl border border-[#7E4228]/15 text-xs text-[#4C271A] font-medium italic leading-relaxed">
        "{squad.objective}"
      </div>

      {/* Match Reasons Badges */}
      <div className="flex items-center gap-1 flex-wrap">
        {matchReasons.map((r, i) => (
          <span
            key={i}
            className="text-[10px] font-bold bg-[#F3E7D5] text-[#7E4228] px-2 py-0.5 rounded-md border border-[#7E4228]/15 flex items-center gap-1"
          >
            <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
            <span>{r}</span>
          </span>
        ))}
      </div>

      {/* Bottom Row: 5 Member Slots + Action Button */}
      <div className="pt-2 border-t border-[#7E4228]/15 flex items-center justify-between gap-2">
        {/* 5 Slots Lineup */}
        <div className="flex items-center gap-1">
          {Array.from({ length: squad.max_members }).map((_, idx) => {
            const member = squad.members[idx]
            if (member) {
              return (
                <div
                  key={idx}
                  className="w-7 h-7 rounded-full bg-[#FAF2E6] border-1.5 border-[#7E4228] overflow-hidden flex items-center justify-center shadow-xs"
                  title={member.profile?.display_name || 'Member'}
                >
                  <OtterAvatar config={member.profile?.otter || DEFAULT_OTTER} size="xs" />
                </div>
              )
            }
            return (
              <div
                key={idx}
                className="w-7 h-7 rounded-full bg-[#FAF2E6]/60 border border-dashed border-[#7E4228]/30 flex items-center justify-center text-[10px] font-black text-[#7E4228]/40"
                title="Open slot"
              >
                +
              </div>
            )
          })}
          <span className="text-[11px] font-black text-[#2D1B11] ml-1.5">
            {squad.members.length}/{squad.max_members}
          </span>
        </div>

        {/* Button */}
        {isUserMember ? (
          <button
            onClick={onEnterLobby}
            className="px-4 py-2 rounded-xl bg-[#7E4228] hover:bg-[#924D30] text-white text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
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
            className="px-3.5 py-2 rounded-xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/30 text-[#7E4228] hover:text-[#4C271A] text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Request to Join</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
