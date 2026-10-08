import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useConnectionStore } from '../../store/connectionStore'
import { useSessionStore } from '../../store/sessionStore'
import { useNotificationStore } from '../../store/notificationStore'
import { supabase } from '../../lib/supabase'
import { normalizeProfile } from '../../utils/profileNormalizer'
import type { DemoUser } from '../../types'

import type {
  Squad,
  SquadMember,
  SquadInvite,
  SquadJoinRequest,
} from '../../services/squadService'
import {
  fetchPublicSquads,
  calculateSquadMatch,
} from '../../services/squadService'

import { SquadDiscoveryView } from './components/SquadDiscoveryView'
import { SquadLobbyView } from './components/SquadLobbyView'
import { SquadInvitesView } from './components/SquadInvitesView'
import { CreateSquadModal } from './components/CreateSquadModal'
import { JoinRequestModal } from './components/JoinRequestModal'
import { SquadInviteModal } from './components/SquadInviteModal'
import { SquadVideoRoom } from './components/SquadVideoRoom'

export const SquadLobbyPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuthStore()
  if (!profile) return null
  const currentUser = profile

  const { connections, fetchConnections } = useConnectionStore()
  const { setSquadActive, setSessionId } = useSessionStore()
  const { notifications } = useNotificationStore()

  // View state: 'discover' | 'lobby' | 'invites'
  const [viewMode, setViewMode] = useState<'discover' | 'lobby' | 'invites'>('discover')
  const [squads, setSquads] = useState<Squad[]>([])
  const [activeSquad, setActiveSquad] = useState<Squad | null>(null)
  const [isInSession, setIsInSession] = useState(false)

  // Pending Invites & Join Requests
  const [invites, setInvites] = useState<SquadInvite[]>([])
  const [joinRequests, setJoinRequests] = useState<SquadJoinRequest[]>([])

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedSquadForJoinRequest, setSelectedSquadForJoinRequest] = useState<Squad | null>(null)

  // Fetch connections on load
  useEffect(() => {
    if (currentUser?.id) {
      fetchConnections(currentUser.id)
    }
  }, [currentUser?.id, fetchConnections])

  // Load public squads
  const loadSquads = useCallback(async () => {
    const list = await fetchPublicSquads(currentUser.id, currentUser)
    setSquads(list)
  }, [currentUser])

  useEffect(() => {
    loadSquads()
  }, [loadSquads])

  // Check if routed with a lobbyId from notification
  useEffect(() => {
    const targetLobbyId = location.state?.lobbyId
    if (targetLobbyId && squads.length > 0) {
      const match = squads.find((s) => s.id === targetLobbyId)
      if (match) {
        setActiveSquad(match)
        setViewMode('lobby')
      }
    }
  }, [location.state?.lobbyId, squads])

  // Listen for real-time notifications (Squad invites & join requests)
  useEffect(() => {
    if (!currentUser?.id) return

    const loadNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*, sender:profiles!sender_id(*)')
        .eq('recipient_id', currentUser.id)
        .eq('read', false)
        .in('type', ['squad_invite', 'squad_join_request'])

      if (data) {
        const invList: SquadInvite[] = []
        const reqList: SquadJoinRequest[] = []

        data.forEach((n: any) => {
          if (n.type === 'squad_invite') {
            invList.push({
              id: n.id,
              squad_id: n.data?.lobbyId,
              inviter_id: n.sender_id,
              invitee_id: currentUser.id,
              status: 'pending',
              created_at: n.created_at,
              inviter: normalizeProfile(n.sender) || undefined,
              squad: {
                id: n.data?.lobbyId,
                name: n.data?.squadName || 'Study Squad',
                focus: n.data?.focus || 'Collaborative Study',
                duration: n.data?.duration || 50,
                members: Array(n.data?.membersCount || 3).fill(null),
                max_members: 5,
              } as any,
            })
          } else if (n.type === 'squad_join_request') {
            reqList.push({
              id: n.id,
              squad_id: n.data?.squadId,
              requester_id: n.sender_id,
              status: 'pending',
              created_at: n.created_at,
              requester: normalizeProfile(n.sender) || undefined,
              matchScore: n.data?.matchScore || 90,
              squad: {
                id: n.data?.squadId,
                name: n.data?.squadName || 'Your Squad',
              } as any,
            })
          }
        })

        setInvites(invList)
        setJoinRequests(reqList)
      }
    }

    loadNotifications()

    // Real-time channel for live notifications
    const channel = supabase
      .channel(`squad_notifs_${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${currentUser.id}` },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  // Real-time channel for the currently active lobby
  useEffect(() => {
    if (!activeSquad?.id) return

    const lobbyId = activeSquad.id
    const channel = supabase.channel(`squad-lobby-${lobbyId}`)

    channel
      .on('broadcast', { event: 'player_ready_toggle' }, ({ payload }) => {
        if (payload?.userId) {
          setActiveSquad((prev) => {
            if (!prev) return null
            const updatedMembers = prev.members.map((m) =>
              m.user_id === payload.userId ? { ...m, ready: payload.ready } : m
            )
            return { ...prev, members: updatedMembers }
          })
        }
      })
      .on('broadcast', { event: 'player_joined' }, ({ payload }) => {
        if (payload?.member) {
          setActiveSquad((prev) => {
            if (!prev) return null
            if (prev.members.some((m) => m.user_id === payload.member.user_id)) return prev
            return { ...prev, members: [...prev.members, payload.member] }
          })
        }
      })
      .on('broadcast', { event: 'player_removed' }, ({ payload }) => {
        if (payload?.userId) {
          if (payload.userId === currentUser.id) {
            // Self was removed
            setActiveSquad(null)
            setViewMode('discover')
            alert('You were removed from the lobby.')
          } else {
            setActiveSquad((prev) => {
              if (!prev) return null
              return { ...prev, members: prev.members.filter((m) => m.user_id !== payload.userId) }
            })
          }
        }
      })
      .on('broadcast', { event: 'session_started' }, ({ payload }) => {
        if (payload?.sessionId === lobbyId) {
          setSessionId(lobbyId)
          setSquadActive(true)
          setIsInSession(true)
        }
      })
      .on('broadcast', { event: 'join_request_received' }, ({ payload }) => {
        if (activeSquad.creator_id === currentUser.id && payload?.requester) {
          setJoinRequests((prev) => [
            ...prev,
            {
              id: `req-${Date.now()}`,
              squad_id: lobbyId,
              requester_id: payload.requester.id,
              status: 'pending',
              created_at: new Date().toISOString(),
              requester: payload.requester,
              matchScore: payload.matchScore || 90,
              squad: activeSquad,
            },
          ])
        }
      })
      .subscribe()

    // Also listen on postgres_changes for sessions table status update
    const sessionSub = supabase
      .channel(`session_watch_${lobbyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${lobbyId}` },
        (payload) => {
          if (payload.new?.status === 'active') {
            setSessionId(lobbyId)
            setSquadActive(true)
            setIsInSession(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(sessionSub)
    }
  }, [activeSquad?.id, activeSquad?.creator_id, currentUser.id, setSessionId, setSquadActive])

  // ═══════════════════ LOBBY ACTIONS ═══════════════════

  // Toggle ready state
  const handleToggleReady = async (ready: boolean) => {
    if (!activeSquad) return

    // Optimistically update local activeSquad
    setActiveSquad((prev) => {
      if (!prev) return null
      const updatedMembers = prev.members.map((m) =>
        m.user_id === currentUser.id ? { ...m, ready } : m
      )
      return { ...prev, members: updatedMembers }
    })

    // Update in session_participants if row exists
    await supabase
      .from('session_participants')
      .update({ status: ready ? 'joined' : 'invited' })
      .match({ session_id: activeSquad.id, user_id: currentUser.id })

    // Broadcast ready event to all other peers in the lobby
    const channel = supabase.channel(`squad-lobby-${activeSquad.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'player_ready_toggle',
      payload: { userId: currentUser.id, ready },
    })
  }

  // Start study session (Leader only)
  const handleStartSession = async () => {
    if (!activeSquad) return
    if (activeSquad.creator_id !== currentUser.id) return

    const readyCount = activeSquad.members.filter((m) => m.ready).length
    if (activeSquad.members.length < activeSquad.min_members || readyCount < activeSquad.min_members) {
      alert(`Cannot start squad: Need at least ${activeSquad.min_members} ready members.`)
      return
    }

    // 1. Update session status to 'active' in DB
    await supabase
      .from('sessions')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + activeSquad.duration * 60000).toISOString(),
      })
      .eq('id', activeSquad.id)

    // 2. Broadcast session started to peers
    const channel = supabase.channel(`squad-lobby-${activeSquad.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'session_started',
      payload: { sessionId: activeSquad.id },
    })

    // 3. Launch study session room locally
    setSessionId(activeSquad.id)
    setSquadActive(true)
    setIsInSession(true)
  }

  // Leave / Disband Squad Lobby
  const handleLeaveSquad = async () => {
    if (!activeSquad) return

    const channel = supabase.channel(`squad-lobby-${activeSquad.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'player_removed',
      payload: { userId: currentUser.id },
    })

    await supabase
      .from('session_participants')
      .delete()
      .match({ session_id: activeSquad.id, user_id: currentUser.id })

    setActiveSquad(null)
    setViewMode('discover')
  }

  // Leader removes member
  const handleRemoveMember = async (memberId: string) => {
    if (!activeSquad || activeSquad.creator_id !== currentUser.id) return

    const channel = supabase.channel(`squad-lobby-${activeSquad.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'player_removed',
      payload: { userId: memberId },
    })

    await supabase
      .from('session_participants')
      .delete()
      .match({ session_id: activeSquad.id, user_id: memberId })

    setActiveSquad((prev) => {
      if (!prev) return null
      return { ...prev, members: prev.members.filter((m) => m.user_id !== memberId) }
    })
  }

  // Accept squad invite from friend
  const handleAcceptInvite = async (inv: SquadInvite) => {
    // Mark notification as read
    await supabase.from('notifications').update({ read: true }).eq('id', inv.id)
    setInvites((prev) => prev.filter((i) => i.id !== inv.id))

    // Enter lobby
    const found = squads.find((s) => s.id === inv.squad_id)
    if (found) {
      // Add self to squad members
      const newMember: SquadMember = {
        id: `member-${currentUser.id}`,
        squad_id: found.id,
        user_id: currentUser.id,
        role: 'member',
        ready: false,
        slot_index: found.members.length,
        joined_at: new Date().toISOString(),
        profile: currentUser,
      }

      const updatedSquad = {
        ...found,
        members: [...found.members, newMember],
      }

      setActiveSquad(updatedSquad)
      setViewMode('lobby')

      // Broadcast player joined to lobby
      const channel = supabase.channel(`squad-lobby-${found.id}`)
      channel.send({
        type: 'broadcast',
        event: 'player_joined',
        payload: { member: newMember },
      })
    }
  }

  // Decline squad invite
  const handleDeclineInvite = async (invId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', invId)
    setInvites((prev) => prev.filter((i) => i.id !== invId))
  }

  // Leader approves join request
  const handleAcceptJoinRequest = async (req: SquadJoinRequest) => {
    await supabase.from('notifications').update({ read: true }).eq('id', req.id)
    setJoinRequests((prev) => prev.filter((r) => r.id !== req.id))

    if (!activeSquad || !req.requester) return

    const newMember: SquadMember = {
      id: `member-${req.requester.id}`,
      squad_id: activeSquad.id,
      user_id: req.requester.id,
      role: 'member',
      ready: false,
      slot_index: activeSquad.members.length,
      joined_at: new Date().toISOString(),
      profile: req.requester,
    }

    // Add to active squad
    setActiveSquad((prev) => {
      if (!prev) return null
      return { ...prev, members: [...prev.members, newMember] }
    })

    // Broadcast to lobby
    const channel = supabase.channel(`squad-lobby-${activeSquad.id}`)
    channel.send({
      type: 'broadcast',
      event: 'player_joined',
      payload: { member: newMember },
    })

    // Notify requester they have been accepted
    await supabase.from('notifications').insert({
      recipient_id: req.requester_id,
      sender_id: currentUser.id,
      type: 'squad_invite',
      data: {
        lobbyId: activeSquad.id,
        squadName: activeSquad.name,
        focus: activeSquad.focus,
        duration: activeSquad.duration,
      },
    })
  }

  // Leader declines join request
  const handleDeclineJoinRequest = async (reqId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', reqId)
    setJoinRequests((prev) => prev.filter((r) => r.id !== reqId))
  }

  // End Session Callback (returns to discovery)
  const handleEndSession = () => {
    setSquadActive(false)
    setIsInSession(false)
    setActiveSquad(null)
    setViewMode('discover')
    loadSquads()
  }

  // ═══════════════════ RENDER ═══════════════════

  // If in active study video room, render SquadVideoRoom
  if (isInSession && activeSquad) {
    const teamMembers: DemoUser[] = activeSquad.members.map((m) => m.profile as DemoUser)
    return <SquadVideoRoom teamMembers={teamMembers} onEndSession={handleEndSession} />
  }

  return (
    <div className="min-h-screen bg-[#FAF2E6] flex flex-col relative overflow-x-hidden">
      {/* View Switcher: Discover vs Lobby vs Invites */}
      {viewMode === 'discover' && (
        <SquadDiscoveryView
          currentUser={currentUser}
          squads={squads}
          activeLobbySquadId={activeSquad?.id || null}
          invitesCount={invites.length + joinRequests.length}
          onCreateSquadClick={() => setShowCreateModal(true)}
          onEnterLobbyClick={(squad) => {
            setActiveSquad(squad)
            setViewMode('lobby')
          }}
          onRequestToJoinClick={(squad) => {
            setSelectedSquadForJoinRequest(squad)
          }}
          onOpenInvitesClick={() => setViewMode('invites')}
        />
      )}

      {viewMode === 'lobby' && activeSquad && (
        <SquadLobbyView
          squad={activeSquad}
          currentUser={currentUser}
          joinRequests={joinRequests.filter((r) => r.squad_id === activeSquad.id)}
          onBackToDiscovery={() => setViewMode('discover')}
          onToggleReady={handleToggleReady}
          onStartSession={handleStartSession}
          onLeaveSquad={handleLeaveSquad}
          onOpenInviteModal={() => setShowInviteModal(true)}
          onOpenRequestsModal={() => setViewMode('invites')}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {viewMode === 'invites' && (
        <div className="pb-28">
          {/* Back Bar */}
          <div className="max-w-md mx-auto p-4 pb-0 flex items-center justify-between">
            <button
              onClick={() => setViewMode(activeSquad ? 'lobby' : 'discover')}
              className="px-3 py-1.5 rounded-xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-[#7E4228] text-xs font-black shadow-xs cursor-pointer"
            >
              ← Back
            </button>
            <h2 className="font-display font-black text-sm text-[#2D1B11]">Squad Notification Center</h2>
            <div className="w-12" />
          </div>

          <SquadInvitesView
            currentUser={currentUser}
            invites={invites}
            joinRequests={joinRequests}
            onAcceptInvite={handleAcceptInvite}
            onDeclineInvite={handleDeclineInvite}
            onAcceptJoinRequest={handleAcceptJoinRequest}
            onDeclineJoinRequest={handleDeclineJoinRequest}
          />
        </div>
      )}

      {/* ═══════════════════ MODALS ═══════════════════ */}
      {/* Create Squad Modal */}
      <CreateSquadModal
        currentUser={currentUser}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSquadCreated={(newSquad) => {
          setSquads((prev) => [newSquad, ...prev])
          setActiveSquad(newSquad)
          setViewMode('lobby')
        }}
      />

      {/* Join Request Confirmation Modal */}
      <JoinRequestModal
        squad={selectedSquadForJoinRequest}
        currentUser={currentUser}
        isOpen={!!selectedSquadForJoinRequest}
        onClose={() => setSelectedSquadForJoinRequest(null)}
        onRequestSent={(squadId) => {
          // Toast or confirmation
        }}
      />

      {/* Invite Connections Modal */}
      <SquadInviteModal
        squad={activeSquad}
        currentUser={currentUser}
        connections={Object.values(connections)
          .filter((c) => c.status === 'accepted')
          .map((c) => c.user)}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  )
}
