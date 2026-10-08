import React, { useState } from 'react'
import { X, Users, Check, Sparkles, Send } from 'lucide-react'
import type { DemoUser } from '../../../types'
import { sendSquadInviteDB } from '../../../services/squadService'
import type { Squad } from '../../../services/squadService'
import OtterAvatar from '../../../components/OtterAvatar'
import { DEFAULT_OTTER } from '../../../utils/profileNormalizer'

interface SquadInviteModalProps {
  squad: Squad | null
  currentUser: DemoUser
  connections: DemoUser[]
  isOpen: boolean
  onClose: () => void
}

export const SquadInviteModal: React.FC<SquadInviteModalProps> = ({
  squad,
  currentUser,
  connections,
  isOpen,
  onClose,
}) => {
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())
  const [sendingId, setSendingId] = useState<string | null>(null)

  if (!isOpen || !squad) return null

  // Exclude members already in the squad
  const memberUserIds = new Set(squad.members.map((m) => m.user_id))
  const invitableConnections = connections.filter((c) => !memberUserIds.has(c.id))

  const handleInvite = async (friend: DemoUser) => {
    setSendingId(friend.id)
    await sendSquadInviteDB(squad, currentUser, friend.id)
    setSendingId(null)
    setInvitedIds((prev) => new Set(prev).add(friend.id))
  }

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-sm bg-[#FAF2E6] border border-[#7E4228]/25 rounded-3xl p-6 shadow-2xl text-[#2D1B11] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#7E4228]/15 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7E4228]" />
            <div>
              <h3 className="font-display font-black text-base text-[#2D1B11]">Invite Connections</h3>
              <p className="text-[10px] text-[#7E4228] font-bold">
                Assemble your study buddies into {squad.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Connected Users */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-1">
          {invitableConnections.length === 0 ? (
            <div className="text-center py-8 px-4 bg-[#FFF9F2] rounded-2xl border border-[#7E4228]/15">
              <p className="text-xs font-bold text-[#7E4228]">No connections available to invite.</p>
              <p className="text-[10px] text-[#7E4228]/70 mt-1">
                All connected buddies are already in the squad or you haven't connected with anyone yet.
              </p>
            </div>
          ) : (
            invitableConnections.map((friend) => {
              const isInvited = invitedIds.has(friend.id)
              const isSending = sendingId === friend.id

              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9F2] border border-[#7E4228]/20 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#FAF2E6] border-2 border-[#7E4228]/30 overflow-hidden flex items-center justify-center shadow-xs">
                      <OtterAvatar config={friend.otter || friend.otter_config || DEFAULT_OTTER} size="xs" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#2D1B11]">{friend.display_name}</h4>
                      <p className="text-[10px] text-[#7E4228] font-bold">
                        {friend.degree_program?.split(' ')[0] || friend.school || 'Connected Buddy'}
                      </p>
                    </div>
                  </div>

                  {isInvited ? (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black flex items-center gap-1 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Invited</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInvite(friend)}
                      disabled={isSending}
                      className="px-3.5 py-1.5 rounded-xl bg-[#7E4228] hover:bg-[#924D30] text-white text-[11px] font-black shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isSending ? 'Sending...' : 'Invite'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="pt-3 border-t border-[#7E4228]/15 mt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-[#4C271A] text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
