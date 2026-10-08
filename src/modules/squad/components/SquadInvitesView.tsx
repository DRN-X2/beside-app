import React, { useState } from 'react'
import { Mail, UserPlus, Check, X, Shield, Clock, Users, Sparkles } from 'lucide-react'
import type { DemoUser } from '../../../types'
import type { Squad, SquadInvite, SquadJoinRequest } from '../../../services/squadService'
import OtterAvatar from '../../../components/OtterAvatar'
import { DEFAULT_OTTER } from '../../../utils/profileNormalizer'

interface SquadInvitesViewProps {
  currentUser: DemoUser
  invites: SquadInvite[]
  joinRequests: SquadJoinRequest[]
  onAcceptInvite: (invite: SquadInvite) => void
  onDeclineInvite: (inviteId: string) => void
  onAcceptJoinRequest: (request: SquadJoinRequest) => void
  onDeclineJoinRequest: (requestId: string) => void
}

export const SquadInvitesView: React.FC<SquadInvitesViewProps> = ({
  currentUser,
  invites,
  joinRequests,
  onAcceptInvite,
  onDeclineInvite,
  onAcceptJoinRequest,
  onDeclineJoinRequest,
}) => {
  const [tab, setTab] = useState<'invites' | 'requests'>('invites')

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      {/* Sub Tabs */}
      <div className="flex bg-[#FFF9F2] p-1 rounded-2xl border border-[#7E4228]/20 shadow-xs">
        <button
          onClick={() => setTab('invites')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'invites'
              ? 'bg-[#7E4228] text-white shadow-sm'
              : 'text-[#7E4228] hover:bg-[#F3E7D5]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Squad Invites ({invites.length})</span>
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === 'requests'
              ? 'bg-[#7E4228] text-white shadow-sm'
              : 'text-[#7E4228] hover:bg-[#F3E7D5]'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Join Requests ({joinRequests.length})</span>
        </button>
      </div>

      {/* Tab 1: Squad Invites */}
      {tab === 'invites' && (
        <div className="space-y-3">
          {invites.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#FFF9F2] rounded-3xl border border-[#7E4228]/15 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#FAF2E6] border border-[#7E4228]/20 text-[#7E4228] mx-auto flex items-center justify-center mb-2">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-display font-black text-sm text-[#2D1B11]">No Pending Squad Invites</h4>
              <p className="text-xs text-[#7E4228]/80 mt-1">
                When friends invite you to their study squads, you will see them here.
              </p>
            </div>
          ) : (
            invites.map((inv) => (
              <div
                key={inv.id}
                className="bg-[#FFF9F2] border border-[#7E4228]/20 rounded-2xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#FAF2E6] border-2 border-[#7E4228]/30 overflow-hidden flex items-center justify-center">
                      <OtterAvatar config={inv.inviter?.otter || DEFAULT_OTTER} size="xs" />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#7E4228] font-bold">
                        <strong className="text-[#2D1B11]">{inv.inviter?.display_name || 'A teammate'}</strong> invited you to:
                      </p>
                      <h4 className="font-display font-black text-sm text-[#2D1B11]">
                        {inv.squad?.name || 'Study Squad'}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-[#FAF2E6] text-[#7E4228] px-2 py-0.5 rounded-md border border-[#7E4228]/20">
                    {inv.squad?.duration || 30} min
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#7E4228]/10 text-xs text-[#7E4228] font-medium">
                  <span>Topic: {inv.squad?.focus}</span>
                  <span>{inv.squad?.members.length || 3}/{inv.squad?.max_members || 5} players</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onDeclineInvite(inv.id)}
                    className="py-2 rounded-xl bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] text-xs font-bold transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onAcceptInvite(inv)}
                    className="py-2 rounded-xl bg-[#7E4228] hover:bg-[#924D30] text-white text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Accept & Join</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Join Requests */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {joinRequests.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#FFF9F2] rounded-3xl border border-[#7E4228]/15 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#FAF2E6] border border-[#7E4228]/20 text-[#7E4228] mx-auto flex items-center justify-center mb-2">
                <UserPlus className="w-6 h-6" />
              </div>
              <h4 className="font-display font-black text-sm text-[#2D1B11]">No Pending Join Requests</h4>
              <p className="text-xs text-[#7E4228]/80 mt-1">
                Requests from learners wishing to join public squads you lead will appear here.
              </p>
            </div>
          ) : (
            joinRequests.map((req) => (
              <div
                key={req.id}
                className="bg-[#FFF9F2] border border-[#7E4228]/20 rounded-2xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#FAF2E6] border-2 border-[#7E4228]/30 overflow-hidden flex items-center justify-center">
                      <OtterAvatar config={req.requester?.otter || DEFAULT_OTTER} size="xs" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-sm text-[#2D1B11]">
                        {req.requester?.display_name || 'Learner'}
                      </h4>
                      <p className="text-[10px] text-[#7E4228] font-bold">
                        {req.requester?.degree_program || req.requester?.school || 'Student'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                    {req.matchScore || 92}% Match
                  </span>
                </div>

                <div className="text-xs text-[#4C271A] font-medium bg-[#FAF2E6] p-2.5 rounded-xl border border-[#7E4228]/15">
                  Requested to join <strong className="text-[#2D1B11]">{req.squad?.name || 'your Squad'}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onDeclineJoinRequest(req.id)}
                    className="py-2 rounded-xl bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] text-xs font-bold transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onAcceptJoinRequest(req)}
                    className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Approve Player</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
