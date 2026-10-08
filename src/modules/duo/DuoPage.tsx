import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Video, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { DuoVideoRoom } from './components/DuoVideoRoom'
import { DuoPreJoinLobby } from './components/DuoPreJoinLobby'
import { OtterAvatarWithBadge } from '../../shared/components/OtterAvatarWithBadge'
import { useSessionStore } from '../../store/sessionStore'
import { useAuthStore } from '../../store/authStore'
import { sendLiveDuoInvite, onHubEvent, subscribeToActiveSession } from '../../services/realtimeHub'
import type { DemoUser, SessionDuration } from '../../types'
import { supabase } from '../../lib/supabase'

export const DuoPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const {
    sessionId,
    isActive,
    partner,
    startSessionLocally,
    endSession,
    endSessionDB,
  } = useSessionStore()

  const partnerFromState: DemoUser | undefined = location.state?.partner
  const [selectedPartner, setSelectedPartner] = useState<DemoUser | undefined>(partnerFromState || partner || undefined)
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>(30)
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'waiting' | 'declined'>('idle')
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)
  const [partnerLeftNotice, setPartnerLeftNotice] = useState<string | null>(null)

  // Real-time listener for peer accept / decline and session updates
  useEffect(() => {
    if (!profile?.id || !selectedPartner) return

    const unsubDecline = onHubEvent('duo_declined', (payload) => {
      if (payload.toUserId === profile.id && payload.fromUser?.id === selectedPartner.id) {
        setInviteStatus('declined')
      }
    })

    const unsubAccept = onHubEvent('duo_accepted', (payload) => {
      if (payload.toUserId === profile.id && payload.fromUser?.id === selectedPartner.id) {
        if (createdSessionId || payload.sessionId) {
          const sessId = payload.sessionId || createdSessionId
          subscribeToActiveSession(sessId)
          startSessionLocally(
            sessId,
            selectedPartner,
            selectedDuration,
            new Date(),
            new Date(Date.now() + selectedDuration * 60000)
          )
        }
      }
    })

    return () => {
      unsubDecline()
      unsubAccept()
    }
  }, [selectedPartner, profile?.id, selectedDuration, createdSessionId, startSessionLocally])

  // Active session watcher: Listen for partner cancellations / status updates
  useEffect(() => {
    if (!sessionId) return

    // 1. Direct Realtime broadcast for zero-latency cancellation
    const syncChannel = supabase
      .channel(`session_sync_${sessionId}`)
      .on('broadcast', { event: 'session_cancelled' }, () => {
        endSession()
        setPartnerLeftNotice('Your study partner cancelled or exited the session.')
      })
      .subscribe()

    // 2. Postgres DB subscription as single source of truth
    const dbChannel = supabase
      .channel(`session_db_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as any
          if (updated.status === 'cancelled' || updated.status === 'completed') {
            endSession()
            setPartnerLeftNotice('This session has been ended or cancelled.')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(syncChannel)
      supabase.removeChannel(dbChannel)
    }
  }, [sessionId, endSession])

  // Listen directly to the created session row in Postgres (caller waiting for accept)
  useEffect(() => {
    if (!createdSessionId || !selectedPartner) return

    const channel = supabase
      .channel(`duo-session-watch-${createdSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${createdSessionId}`,
        },
        (payload) => {
          const updated = payload.new as any
          if (updated.status === 'active') {
            subscribeToActiveSession(createdSessionId)
            startSessionLocally(
              createdSessionId,
              selectedPartner,
              selectedDuration,
              new Date(updated.started_at || Date.now()),
              new Date(updated.ends_at || Date.now() + selectedDuration * 60000)
            )
          } else if (updated.status === 'cancelled') {
            setInviteStatus('declined')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [createdSessionId, selectedPartner, selectedDuration, startSessionLocally])

  if (!profile) return null

  const currentUser = profile

  const handleStartCall = async () => {
    if (!selectedPartner) return
    setInviteStatus('waiting')

    // Create DB session as single source of truth
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        host_id: currentUser.id,
        type: 'duo',
        status: 'waiting',
        duration_minutes: selectedDuration,
        subject: '',
      })
      .select()
      .single()

    if (error || !session) {
      console.error('Failed to create session:', error)
      setInviteStatus('idle')
      return
    }

    setCreatedSessionId(session.id)

    // Send real-time invite payload to partner
    await sendLiveDuoInvite({
      toUserId: selectedPartner.id,
      fromUser: currentUser,
      sessionId: session.id,
      duration: selectedDuration,
      subject: '',
    })
  }

  const handleCancelInvite = async () => {
    if (createdSessionId) {
      await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', createdSessionId)
    }
    setInviteStatus('idle')
    setCreatedSessionId(null)
  }

  const [hasJoinedFromLobby, setHasJoinedFromLobby] = useState(false)
  const [lobbySettings, setLobbySettings] = useState<{
    stream: MediaStream | null
    isCameraOff: boolean
    isMuted: boolean
  } | null>(null)

  const handleEndCall = async () => {
    if (sessionId) {
      // 1. Direct Realtime broadcast so partner exits IMMEDIATELY
      const syncChannel = supabase.channel(`session_sync_${sessionId}`)
      syncChannel.send({
        type: 'broadcast',
        event: 'session_cancelled',
        payload: { cancelledBy: currentUser.id },
      }).catch(() => {})

      // 2. Mark cancelled in database
      await supabase.from('sessions').update({
        status: 'cancelled',
        ends_at: new Date().toISOString(),
      }).eq('id', sessionId)
    }
    await endSessionDB()
    navigate('/discover')
  }

  // If in active session, render Lobby first, then Duo video room
  if (isActive && partner) {
    if (!hasJoinedFromLobby) {
      return (
        <DuoPreJoinLobby
          partner={partner}
          duration={selectedDuration}
          currentUser={currentUser}
          onJoin={(settings) => {
            setLobbySettings(settings)
            setHasJoinedFromLobby(true)
          }}
          onBack={handleEndCall}
        />
      )
    }

    return (
      <DuoVideoRoom
        partner={partner}
        duration={selectedDuration}
        initialLocalStream={lobbySettings?.stream}
        initialCameraOff={lobbySettings?.isCameraOff}
        initialMuted={lobbySettings?.isMuted}
        onEndSession={handleEndCall}
      />
    )
  }

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#FAF2E6] flex flex-col justify-between p-4 max-w-md mx-auto select-none text-[#2D1B11] pb-24">
      {/* Partner Left / Session Ended Notice Modal */}
      {partnerLeftNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF2E6] border border-[#DFC3A6] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-lg text-[#2D1B11] mb-2">
              Session Ended
            </h3>
            <p className="text-xs text-[#7A5A46] font-medium mb-5">
              {partnerLeftNotice}
            </p>
            <button
              onClick={() => {
                setPartnerLeftNotice(null)
                navigate('/discover')
              }}
              className="w-full py-3 bg-[#7E4228] hover:bg-[#924D30] text-white text-xs font-black rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Return to Study World
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div>
        <div className="flex items-center gap-3 pt-2 mb-6">
          <button
            onClick={() => navigate('/discover')}
            className="w-10 h-10 rounded-2xl clay-btn clay-btn-circle-light flex items-center justify-center text-[#2D1B11]"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#875F49] block">
              Duo Mode
            </span>
            <h1 className="font-display font-black text-2xl text-[#2D1B11]">
              Launch Duo Call
            </h1>
          </div>
        </div>

        {/* Selected Partner Card - 3D Clay Card */}
        <div className="clay-card-floating p-5 mb-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#875F49] block mb-3">
            Study Partner
          </span>

          {selectedPartner ? (
            <div className="flex items-center gap-4">
              <div className="drop-shadow-md">
                <OtterAvatarWithBadge
                  config={selectedPartner.otter}
                  countryCode={selectedPartner.country_code}
                  showDegree={false}
                  size="md"
                  bgCircleColor="clean"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-black text-lg text-[#2D1B11] truncate">
                  {selectedPartner.display_name}
                </h3>
                <p className="text-xs text-[#7A5A46] font-semibold truncate">
                  {selectedPartner.degree_program} · {selectedPartner.school}
                </p>
                <span className="inline-block mt-1.5 clay-pill bg-amber-100/90 text-[#8C471E] text-[10px] font-black px-2.5 py-0.5 border border-[#DFC3A6]">
                  Available for Session
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-[#7A5A46] mb-3">No partner selected yet.</p>
              <button
                onClick={() => navigate('/discover')}
                className="py-2.5 px-5 clay-btn clay-btn-primary text-xs font-black"
              >
                Find a Partner
              </button>
            </div>
          )}
        </div>

        {/* Duration Selection (15m, 30m, 1h) - 3D Clay Selectors */}
        <div className="clay-card-floating p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#875F49]">
              Session Duration
            </span>
            <span className="text-[10px] text-[#7A5A46] font-bold">Continuous timer</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { duration: 15 as SessionDuration, label: '15 Mins', tag: 'Sprint' },
              { duration: 30 as SessionDuration, label: '30 Mins', tag: 'Focused' },
              { duration: 60 as SessionDuration, label: '1 Hour', tag: 'Deep Dive' },
            ].map((item) => (
              <button
                key={item.duration}
                onClick={() => setSelectedDuration(item.duration)}
                className={`p-3 rounded-2xl text-center transition-all duration-200 active:scale-95 ${
                  selectedDuration === item.duration
                    ? 'clay-btn-primary shadow-lg scale-102'
                    : 'clay-inset text-[#2D1B11] hover:bg-[#EAE0D2]'
                }`}
              >
                <div className="font-display font-black text-sm">{item.label}</div>
                <div
                  className={`text-[10px] font-bold ${
                    selectedDuration === item.duration ? 'text-amber-200' : 'text-[#875F49]'
                  }`}
                >
                  {item.tag}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Start Video Conference CTA / Live Waiting States */}
      <div className="pt-4">
        {inviteStatus === 'idle' && (
          <button
            onClick={handleStartCall}
            disabled={!selectedPartner}
            className="w-full py-4 clay-btn clay-btn-primary font-display font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer active:scale-98 transition-transform"
          >
            <Video className="w-5 h-5 fill-white" />
            <span>Send Duo Study Invite</span>
          </button>
        )}

        {inviteStatus === 'waiting' && (
          <div className="clay-inset p-4 rounded-2xl text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-[#7E4228]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-black">
                Waiting for {selectedPartner?.display_name} to accept...
              </span>
            </div>
            <p className="text-xs text-[#7A5A46]">
              Invitation sent to {selectedPartner?.display_name}'s screen. The session will begin automatically when accepted.
            </p>
            <button
              onClick={handleCancelInvite}
              className="w-full py-2.5 clay-btn bg-[#FAF2E6] border border-black/10 font-bold text-xs text-[#4C271A] cursor-pointer"
            >
              Cancel Invite
            </button>
          </div>
        )}

        {inviteStatus === 'declined' && (
          <div className="clay-inset p-4 rounded-2xl text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-black">
                {selectedPartner?.display_name} is unavailable right now
              </span>
            </div>
            <button
              onClick={() => setInviteStatus('idle')}
              className="w-full py-2.5 clay-btn clay-btn-primary font-bold text-xs text-white cursor-pointer"
            >
              Try Again Later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DuoPage
