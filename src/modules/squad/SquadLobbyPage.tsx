import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Plus,
  Crown,
  Play,
  Clock,
  Sparkles,
  X,
  AlertCircle,
  RotateCcw,
  Check,
  Bell,
  LogIn,
  CheckCircle2,
} from 'lucide-react'
import { OtterAvatarWithBadge } from '../../shared/components/OtterAvatarWithBadge'
import { useAuthStore } from '../../store/authStore'
import { useConnectionStore } from '../../store/connectionStore'
import { useSessionStore } from '../../store/sessionStore'
import { useNotificationStore } from '../../store/notificationStore'
import { fetchLearners } from '../../services/userService'
import { SquadVideoRoom } from './components/SquadVideoRoom'
import { sendLiveSquadInvite, subscribeToActiveSession } from '../../services/realtimeHub'
import type { DemoUser } from '../../types'
import { supabase } from '../../lib/supabase'
import { normalizeProfile } from '../../utils/profileNormalizer'
import { useLocation } from 'react-router-dom'

interface LobbySlot {
  user: DemoUser | null
  status: 'empty' | 'invited' | 'joined'
}

interface PendingNotification {
  id: string
  peer: DemoUser
  slotIndex: number
}

export const SquadLobbyPage: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  if (!profile) return null
  const currentUser = profile
  const { connections } = useConnectionStore()
  const { setSquadActive } = useSessionStore()
  const { notifications, togglePanel } = useNotificationStore()

  const location = useLocation()
  const [squadSessionId, setSquadSessionId] = useState<string | null>(location.state?.lobbyId || null)

  // 5 slots matching Mobile Legends team lobby
  const [slots, setSlots] = useState<LobbySlot[]>([
    { user: currentUser, status: 'empty' }, // Leader must click Join to officially join
    { user: null, status: 'empty' },
    { user: null, status: 'empty' },
    { user: null, status: 'empty' },
    { user: null, status: 'empty' },
  ])

  // Fetch participants from DB
  const fetchParticipants = async (sessionId: string) => {
    const { data } = await supabase
      .from('session_participants')
      .select('*, user:profiles!user_id(*)')
      .eq('session_id', sessionId)
      
    if (data) {
      setSlots(prev => {
        const emptySlots: LobbySlot[] = Array(5).fill(null).map(() => ({ user: null, status: 'empty' }))
        
        data.forEach((p: any) => {
           if (p.slot_index !== null && p.slot_index < 5) {
             const user = normalizeProfile(p.user) as any
             emptySlots[p.slot_index] = { user, status: p.status }
           }
        })
        
        // Ensure current user is in the lobby slots visually before they click Join
        if (!emptySlots.some(s => s.user?.id === currentUser.id)) {
            const firstEmpty = emptySlots.findIndex(s => s.status === 'empty')
            if (firstEmpty !== -1) {
               emptySlots[firstEmpty] = { user: currentUser, status: 'empty' }
            }
        }
        return emptySlots
      })
    }
  }

  useEffect(() => {
    if (squadSessionId) {
       fetchParticipants(squadSessionId)
       
       const sub = supabase.channel(`lobby-${squadSessionId}`)
         .on(
           'postgres_changes', 
           { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${squadSessionId}` }, 
           () => { fetchParticipants(squadSessionId) }
         )
         .subscribe()
         
       const sessionSub = supabase.channel(`session-${squadSessionId}`)
         .on(
           'postgres_changes',
           { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${squadSessionId}` },
           (payload) => {
             if (payload.new.status === 'active') {
               useSessionStore.getState().setSessionId(squadSessionId)
               setIsInSession(true)
             }
           }
         )
         .subscribe()
         
       return () => {
         supabase.removeChannel(sub)
         supabase.removeChannel(sessionSub)
       }
    }
  }, [squadSessionId, currentUser.id])

  // 1-minute countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true)
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [isInSession, setIsInSession] = useState<boolean>(false)

  const [autoCommencingCountdown, setAutoCommencingCountdown] = useState<number | null>(null)
  const sessionStartedRef = useRef(false)

  const officiallyJoinedMembers = slots
    .filter((s) => s.status === 'joined' && s.user !== null)
    .map((s) => s.user as DemoUser)
  const joinedCount = officiallyJoinedMembers.length
  const isLeaderJoined = slots[0].status === 'joined'

  // Sync squad active state with sessionStore so BottomNav is hidden during squad calls
  useEffect(() => {
    setSquadActive(isInSession)
    return () => setSquadActive(false)
  }, [isInSession, setSquadActive])

  // 1-minute countdown timer logic
  useEffect(() => {
    if (!isTimerRunning || isInSession || autoCommencingCountdown !== null) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, isInSession, autoCommencingCountdown])

  // Rule 1: If 5 users already joined, starts automatically even before timer runs out
  useEffect(() => {
    if (joinedCount === 5 && !isInSession && autoCommencingCountdown === null && !sessionStartedRef.current) {
      triggerCommenceSession()
    }
  }, [joinedCount, isInSession, autoCommencingCountdown])

  // Rule 2: If less than 5 (3 or 4), wait for timer to run out (00:00), then automatically start
  useEffect(() => {
    if (timeLeft === 0 && joinedCount >= 3 && !isInSession && autoCommencingCountdown === null && !sessionStartedRef.current) {
      triggerCommenceSession()
    }
  }, [timeLeft, joinedCount, isInSession, autoCommencingCountdown])

  const triggerCommenceSession = () => {
    if (sessionStartedRef.current) return
    sessionStartedRef.current = true
    
    if (squadSessionId && slots[0].user?.id === currentUser.id) {
       const endsAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
       supabase.from('sessions').update({
          status: 'active',
          started_at: new Date().toISOString(),
          ends_at: endsAt
       }).eq('id', squadSessionId).then()
    }

    setAutoCommencingCountdown(3)
    let count = 3
    const cd = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(cd)
        setAutoCommencingCountdown(null)
        if (squadSessionId) {
          useSessionStore.getState().setSessionId(squadSessionId)
        }
        setIsInSession(true)
      } else {
        setAutoCommencingCountdown(count)
      }
    }, 1000)
  }

  // Format timer MM:SS
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const formattedTimer = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const [registeredLearners, setRegisteredLearners] = useState<DemoUser[]>([])

  useEffect(() => {
    if (currentUser?.id) {
      fetchLearners(currentUser.id).then(({ data }) => {
        setRegisteredLearners(data)
      })
    }
  }, [currentUser?.id])

  // Connected peers list from store
  const connectedPeers = Object.values(connections)
    .filter((c) => c.status === 'accepted')
    .map((c) => c.user)
  const availablePeers = connectedPeers.length > 0 ? connectedPeers : registeredLearners

  // 1. Current user officially joins the lobby
  const handleUserJoinLobby = async () => {
    if (!squadSessionId) {
      // Create session
      const { data: session } = await supabase.from('sessions').insert({
         host_id: currentUser.id,
         type: 'squad',
         status: 'waiting',
         duration_minutes: 60
      }).select().single()
      
      if (session) {
         setSquadSessionId(session.id)
         await supabase.from('session_participants').insert({
            session_id: session.id,
            user_id: currentUser.id,
            status: 'joined',
            slot_index: 0
         })
      }
    } else {
       // Join existing
       const mySlot = slots.findIndex(s => s.user?.id === currentUser.id)
       const index = mySlot !== -1 ? mySlot : 0
       
       await supabase.from('session_participants').upsert({
          session_id: squadSessionId,
          user_id: currentUser.id,
          status: 'joined',
          slot_index: index
       }, { onConflict: 'session_id,user_id' })
    }
  }

  // 2. Open invite modal for empty slot
  const handleOpenInvite = (slotIndex: number) => {
    setSelectedSlotIndex(slotIndex)
    setShowInviteModal(true)
  }

  // 3. Invite a connected peer (sends real broadcast, does NOT fake-join)
  const handleSendInviteToPeer = async (peer: DemoUser) => {
    if (slots.some((s) => s.user?.id === peer.id)) return
    if (!squadSessionId) return

    const targetSlot =
      selectedSlotIndex !== null && slots[selectedSlotIndex].user === null
        ? selectedSlotIndex
        : slots.findIndex((s) => s.user === null)

    if (targetSlot !== -1) {
      await supabase.from('session_participants').insert({
         session_id: squadSessionId,
         user_id: peer.id,
         status: 'invited',
         slot_index: targetSlot
      })

      // Send real broadcast invite to peer (pops up on recipient's screen, NOT sender's)
      await sendLiveSquadInvite({
        toUserId: peer.id,
        fromUser: currentUser,
        lobbyId: squadSessionId, // Real DB ID!
        slotIndex: targetSlot,
      })
    }

    setShowInviteModal(false)
    setSelectedSlotIndex(null)
  }

  const handleResetTimer = () => {
    setTimeLeft(60)
    setIsTimerRunning(true)
  }

  // If in active squad video call, render SquadVideoRoom
  if (isInSession) {
    return (
      <SquadVideoRoom
        teamMembers={officiallyJoinedMembers}
        onEndSession={() => {
          setIsInSession(false)
          setAutoCommencingCountdown(null)
          sessionStartedRef.current = false
          setSlots([
            { user: currentUser, status: 'empty' },
            { user: null, status: 'empty' },
            { user: null, status: 'empty' },
            { user: null, status: 'empty' },
            { user: null, status: 'empty' },
          ])
          setTimeLeft(60)
          setIsTimerRunning(false)
          navigate('/history')
        }}
      />
    )
  }

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#FAF2E6] flex flex-col justify-between p-4 max-w-md mx-auto select-none text-[#2D1B11] pb-28">

      {/* Auto-Commencing Overlay (When 5 reached or timer finished with 3+) */}
      {autoCommencingCountdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm clay-card-floating p-6 text-center text-[#2D1B11] shadow-2xl animate-scale-up">
            <div className="w-16 h-16 rounded-full clay-btn-green text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h3 className="font-display font-black text-2xl mb-1 text-[#2D1B11]">
              Squad Ready!
            </h3>
            <p className="text-xs text-[#7A5A46] font-semibold mb-4">
              {joinedCount === 5
                ? 'All 5 participants officially joined! Commencing session now...'
                : `${joinedCount} participants ready! Starting study session...`}
            </p>
            <div className="font-display font-black text-4xl text-emerald-700 animate-pulse">
              Starting in {autoCommencingCountdown}...
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pt-2 mb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#875F49] block">
              Team Mode
            </span>
            <h1 className="font-display font-black text-2xl text-[#2D1B11]">
              Squad Study Lobby
            </h1>
          </div>
          <div className="flex items-center gap-2">

            <div className="clay-btn-amber px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md">
              <Users className="w-3.5 h-3.5" />
              <span>{joinedCount}/5 Joined</span>
            </div>
          </div>
        </div>

        {/* 1-Minute Countdown Timer Card */}
        <div className="clay-card-floating p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
                timeLeft <= 10 && joinedCount < 3
                  ? 'bg-red-500/20 text-red-600 animate-pulse'
                  : 'bg-amber-100 text-[#8C471E]'
              }`}
            >
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#875F49] block">
                Lobby Wait Timer (1 Min)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl text-[#2D1B11]">
                  {formattedTimer}
                </span>
                <span className="text-[11px] font-bold text-[#7A5A46]">
                  {joinedCount >= 3
                    ? `· Minimum met (${joinedCount} ready)`
                    : '· Waiting for at least 3 participants'}
                </span>
              </div>
            </div>
          </div>

          {timeLeft === 0 && joinedCount < 3 && (
            <button
              onClick={handleResetTimer}
              className="clay-btn clay-btn-amber p-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>

        {/* Mobile Legends 5-Slot Lobby Presentation */}
        <div className="clay-card-floating p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#2D1B11] block">
                Lobby Lineup
              </span>
              <span className="text-[10px] font-bold text-[#875F49]">
                Auto-commences at 5 members or at timer if ≥ 3
              </span>
            </div>
            <span className="text-[10px] font-black clay-pill bg-[#F2E4D4] text-[#5C3A21] px-2.5 py-0.5 border border-[#DFC3A6]">
              {joinedCount >= 3 ? 'Session Ready' : 'Gathering Peers'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex flex-col items-center">
                {slot.user ? (
                  <div className="relative flex flex-col items-center group w-full">
                    {/* Crown for Leader */}
                    {idx === 0 && (
                      <div className="absolute -top-2 -right-1 z-20 bg-amber-400 text-[#2D1B11] p-0.5 rounded-full border border-black/20 shadow-sm">
                        <Crown className="w-3 h-3 fill-amber-400" />
                      </div>
                    )}

                    {/* Otter Avatar - Clean, NO BSCS note, NO thick borders */}
                    <div className="relative mb-1 drop-shadow-md">
                      <OtterAvatarWithBadge
                        config={slot.user.otter}
                        countryCode={slot.user.country_code}
                        showDegree={false}
                        size="sm"
                        bgCircleColor="clean"
                      />
                    </div>

                    <span className="text-[10px] font-black text-[#2D1B11] truncate max-w-[55px] text-center leading-tight">
                      {idx === 0 ? 'You' : slot.user.display_name.split(' ')[0]}
                    </span>

                    {/* Status: Joined vs Invited vs Not Joined */}
                    {slot.status === 'joined' ? (
                      <span className="text-[8px] font-bold text-emerald-700 clay-pill bg-emerald-100 px-1.5 py-0.2 mt-0.5 border border-emerald-300">
                        Joined
                      </span>
                    ) : slot.status === 'invited' ? (
                      <span className="text-[8px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 mt-0.5 animate-pulse">
                        Invited...
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold text-[#875F49] mt-0.5">
                        Not Joined
                      </span>
                    )}
                  </div>
                ) : (
                  /* Empty Slot - Tap plus to invite connected peer */
                  <button
                    onClick={() => handleOpenInvite(idx)}
                    className="w-12 h-16 clay-inset rounded-2xl flex flex-col items-center justify-center text-[#875F49] hover:text-[#2D1B11] active:scale-95 transition-all border border-dashed border-[#875F49]/40 group"
                    title={`Invite to Slot ${idx + 1}`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black mt-1">Slot {idx + 1}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Squad Topic & Objective Rule Notice */}
        <div className="clay-inset p-3.5 text-xs text-[#5D3D2B] space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8C471E] flex-shrink-0" />
            <span className="font-bold text-[#2D1B11]">
              In-Session Goals & Objectives
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#7A5A46]">
            Like Duo, topic and objectives are decided once you enter the session. Need at least 3 participants (more than 2) to commence.
          </p>
        </div>

        {/* Timer Expired Warning Alert if < 3 */}
        {timeLeft === 0 && joinedCount < 3 && (
          <div className="p-3.5 bg-red-100/90 border border-red-300 rounded-2xl text-xs text-red-900 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black">1-Minute Timer Expired!</strong>
              <span>
                Session cannot start with less than 3 participants ({joinedCount}/5 joined). Reset timer and invite more connected peers to continue.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Area: User Join CTA OR Automated Waiting Status */}
      <div className="pt-3 space-y-2">
        {!isLeaderJoined ? (
          /* Step 1: User enters lobby and must click Join to officially join */
          <button
            onClick={handleUserJoinLobby}
            className="w-full py-4 clay-btn clay-btn-primary font-display font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-transform"
          >
            <LogIn className="w-5 h-5 fill-white" />
            <span>Join Squad Lobby</span>
          </button>
        ) : (
          /* Step 2: User is joined. User CANNOT manually start session. Starts automatically! */
          <div className="w-full p-4 clay-card-floating text-center border border-[#DFC3A6] shadow-md">
            {joinedCount === 5 ? (
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-display font-black text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-bounce" />
                <span>Squad Full (5/5)! Starting automatically...</span>
              </div>
            ) : joinedCount >= 3 ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-display font-black text-sm">
                  <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>
                    Auto-starts in {formattedTimer} ({joinedCount}/5 Joined)
                  </span>
                </div>
                <p className="text-[11px] text-[#7A5A46] font-semibold">
                  Waiting for timer to expire or 5 participants to join
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-[#8C471E] font-display font-black text-sm">
                  <Users className="w-4 h-4 text-[#8C471E]" />
                  <span>
                    Waiting for Participants ({joinedCount}/5 Joined)
                  </span>
                </div>
                <p className="text-[11px] text-[#7A5A46] font-semibold">
                  Need at least 3 participants before timer expires ({formattedTimer})
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Connected Study Buddies Modal (List Form) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm clay-card-floating p-5 shadow-2xl relative text-[#2D1B11] animate-slide-up max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DFC3A6]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#875F49] block">
                  Invite to Squad
                </span>
                <h3 className="font-display font-black text-lg text-[#2D1B11]">
                  Connected Study Buddies
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setSelectedSlotIndex(null)
                }}
                className="w-8 h-8 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#2D1B11]"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* List of Connected Users */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar">
              {availablePeers.map((peer) => {
                const isAlreadyInSlots = slots.some((s) => s.user?.id === peer.id)

                return (
                  <div
                    key={peer.id}
                    className="clay-card p-3 flex items-center justify-between gap-3 border border-[#DFC3A6]"
                  >
                    {/* Avatar & Info - NO BSCS note, NO thick borders */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="drop-shadow-sm flex-shrink-0">
                        <OtterAvatarWithBadge
                          config={peer.otter}
                          countryCode={peer.country_code}
                          showDegree={false}
                          size="sm"
                          bgCircleColor="clean"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-black text-xs text-[#2D1B11] truncate">
                          {peer.display_name}
                        </h4>
                        <p className="text-[10px] text-[#7A5A46] font-semibold truncate">
                          {peer.degree_program} · {peer.school}
                        </p>
                        <span className="inline-block mt-0.5 clay-pill bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2">
                          Connected Peer
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {isAlreadyInSlots ? (
                        <div className="clay-pill bg-[#EAE0D2] text-[#875F49] text-[10px] font-black px-3 py-1.5 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Added</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendInviteToPeer(peer)}
                          className="clay-btn clay-btn-primary text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md active:scale-95 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>Invite</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-[#DFC3A6] text-center text-[10px] font-bold text-[#875F49]">
              Invited peers receive a notification and must click Join to enter
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SquadLobbyPage
