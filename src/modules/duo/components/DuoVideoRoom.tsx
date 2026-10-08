import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MeetBottomBar } from '../../../shared/components/MeetBottomBar'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import { DraggableObjectivesCard } from './DraggableObjectivesCard'
import { DuoInCallSharedSpace } from './DuoInCallSharedSpace'
import { useSessionStore } from '../../../store/sessionStore'
import { useAuthStore } from '../../../store/authStore'
import { useConnectionStore, recordCompletedSessionPartner } from '../../../store/connectionStore'
import { calculateCompatibility } from '../../../services/compatibility'
import { WebRTCConnection } from '../../../services/webrtcService'
import { supabase } from '../../../lib/supabase'
import { CheckCircle2, Clock, VideoOff, MicOff, Mic, Sparkles, Check, Target, AlertCircle } from 'lucide-react'
import type { DemoUser, SessionDuration } from '../../../types'

interface DuoVideoRoomProps {
  partner: DemoUser
  duration: SessionDuration
  initialLocalStream?: MediaStream | null
  initialCameraOff?: boolean
  initialMuted?: boolean
  onEndSession: () => void
}

export const DuoVideoRoom: React.FC<DuoVideoRoomProps> = ({
  partner,
  duration,
  initialLocalStream = null,
  initialCameraOff = false,
  initialMuted = false,
  onEndSession,
}) => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  if (!profile) return null
  const currentUser = profile
  const { connections, addSessionConnection, sendRequestDB, fetchConnections } = useConnectionStore()

  const {
    sessionId,
    subject,
    setSubjectDB,
    objectives,
    toggleObjectiveDB,
    addObjectiveDB,
    removeObjectiveDB,
    timeLeft,
    tick,
    messages,
    sendMessageDB,
  } = useSessionStore()

  // Video and Audio controls
  const [isMuted, setIsMuted] = useState(initialMuted)
  const [isCameraOff, setIsCameraOff] = useState(initialCameraOff)
  const [isPartnerCameraOff, setIsPartnerCameraOff] = useState(false)
  const [isPartnerMuted, setIsPartnerMuted] = useState(false)
  const [sharedView, setSharedView] = useState<'video' | 'quiz' | 'chat'>('video')
  const [showEndModal, setShowEndModal] = useState(false)
  const [showObjectives, setShowObjectives] = useState(false)

  // Real WebRTC Streams & Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const streamRef = useRef<MediaStream | null>(initialLocalStream)
  const rtcRef = useRef<WebRTCConnection | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [hasMediaPermission, setHasMediaPermission] = useState(!!initialLocalStream)
  const [partnerDisconnectedNotice, setPartnerDisconnectedNotice] = useState(false)

  // Fetch connections for checking already-connected peers
  useEffect(() => {
    if (currentUser?.id) {
      fetchConnections(currentUser.id)
    }
  }, [currentUser?.id, fetchConnections])

  // Continuous real-time countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      tick()
    }, 1000)
    return () => clearInterval(timer)
  }, [tick])

  // Setup local webcam: reuse initialLocalStream or acquire new one with audio fallback
  useEffect(() => {
    let isMounted = true

    async function initCamera() {
      if (streamRef.current) {
        // Stream passed from Lobby
        setHasMediaPermission(true)
        if (localVideoRef.current && streamRef.current.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = streamRef.current
          localVideoRef.current.play().catch(() => {})
        }
        streamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = !isCameraOff
        })
        streamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !isMuted
        })
        rtcRef.current?.updateLocalStream(streamRef.current)
        return
      }

      try {
        let stream: MediaStream | null = null
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
        } catch (vErr) {
          console.warn('[DuoVideoRoom] Camera hardware in use or unavailable, fallback to audio:', vErr)
          stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          setIsCameraOff(true)
        }

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        setHasMediaPermission(true)
        if (localVideoRef.current && stream.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = stream
          localVideoRef.current.play().catch(() => {})
        }
        stream.getVideoTracks().forEach((t) => {
          t.enabled = !isCameraOff
        })
        stream.getAudioTracks().forEach((t) => {
          t.enabled = !isMuted
        })
        rtcRef.current?.updateLocalStream(stream)
      } catch (err) {
        console.warn('[DuoVideoRoom] Media permission issue:', err)
        setHasMediaPermission(false)
      }
    }

    initCamera()

    return () => {
      isMounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Sync track enablement without tearing down the stream
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !isCameraOff
      })
      if (!isCameraOff && localVideoRef.current && streamRef.current.getVideoTracks().length > 0) {
        localVideoRef.current.srcObject = streamRef.current
        localVideoRef.current.play().catch(() => {})
      }
    }
  }, [isCameraOff, hasMediaPermission])

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !isMuted
      })
    }
  }, [isMuted])

  // Setup real WebRTC P2P connection with compact deterministic room ID
  const callRoomId = [currentUser.id, partner.id]
    .map((id) => id.replace(/-/g, '').slice(0, 8))
    .sort()
    .join('_')

  useEffect(() => {
    if (!currentUser?.id || !partner?.id) return

    const rtc = new WebRTCConnection({
      channelId: callRoomId,
      userId: currentUser.id,
      peerId: partner.id,
      localStream: streamRef.current,
      onRemoteStream: (stream) => {
        setRemoteStream(stream)
        setPartnerDisconnectedNotice(false)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
          remoteVideoRef.current.play().catch(() => {})
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream
          remoteAudioRef.current.play().catch(() => {})
        }
      },
      onPeerActive: () => {
        setPartnerDisconnectedNotice(false)
      },
      onPeerLeft: () => {
        setPartnerDisconnectedNotice(true)
      },
      onMediaStateChange: (state) => {
        setIsPartnerCameraOff(state.isCameraOff)
        setIsPartnerMuted(state.isMuted)
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') {
          setPartnerDisconnectedNotice(false)
        } else if (state === 'disconnected' || state === 'failed') {
          setPartnerDisconnectedNotice(true)
        }
      },
      onIceStateChange: (iceState) => {
        if (iceState === 'connected' || iceState === 'completed') {
          setPartnerDisconnectedNotice(false)
        }
      },
    })

    rtcRef.current = rtc

    return () => {
      rtc.destroy()
      rtcRef.current = null
    }
  }, [callRoomId, currentUser.id, partner.id])

  // Attach remote stream whenever remote video ref or remote stream updates
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
        remoteVideoRef.current.play().catch(() => {})
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream
        remoteAudioRef.current.play().catch(() => {
          const unlock = () => {
            remoteAudioRef.current?.play().catch(() => {})
            window.removeEventListener('click', unlock)
            window.removeEventListener('touchstart', unlock)
          }
          window.addEventListener('click', unlock, { once: true })
          window.addEventListener('touchstart', unlock, { once: true })
        })
      }
    }
  }, [remoteStream, isPartnerCameraOff])

  const handleToggleCamera = () => {
    const next = !isCameraOff
    setIsCameraOff(next)
    rtcRef.current?.sendMediaState(next, isMuted)
  }

  const handleToggleMic = () => {
    const next = !isMuted
    setIsMuted(next)
    rtcRef.current?.sendMediaState(isCameraOff, next)
  }

  // Format time remaining MM:SS
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const completedCount = objectives.filter((o) => o.completed).length

  // Connection check: Is partner already an accepted connection?
  const partnerConnection = connections[partner.id]
  const isAlreadyConnected = partnerConnection?.status === 'accepted'

  return (
    <div className="relative w-full h-[100dvh] bg-[#FAF2E6] flex flex-col justify-between p-3 max-w-md mx-auto select-none overflow-hidden text-[#2D1B11] font-sans">
      {/* Hidden Audio element for playing partner audio even when their camera is off */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Disconnection Reconnection Notice Banner */}
      {partnerDisconnectedNotice && (
        <div className="absolute top-16 inset-x-4 z-40 bg-amber-500/95 text-white px-3.5 py-2 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
          <AlertCircle className="w-4 h-4" />
          <span>Partner disconnected · Waiting for reconnection…</span>
        </div>
      )}

      {/* Top Session Status Bar - Clean Beside Cream Dock */}
      <div className="flex items-center justify-between px-3.5 py-2 z-30 bg-white/95 border border-[#E8DACB] rounded-2xl shadow-sm mb-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-[#4C271A]">
            Duo Session
          </span>
          <span className="text-[10px] text-[#7E4228] font-bold">· {duration}m</span>
        </div>

        {/* Dynamic Top Bar Goals Indicator (Clickable to open/close goals) */}
        <button
          onClick={() => setShowObjectives((prev) => !prev)}
          className="flex items-center gap-1.5 bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#DFC3A6] text-[#4C271A] px-2.5 py-1 rounded-full text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs"
          title="Click to view goals"
        >
          <Target className="w-3.5 h-3.5 text-[#C68642]" />
          <span>{completedCount}/3 Goals</span>
        </button>

        {/* Real-Time Continuous Clock */}
        <div className="flex items-center gap-1.5 bg-[#FAF2E6] text-[#2D1B11] px-2.5 py-1 rounded-full text-xs font-black border border-[#DFC3A6] shadow-xs">
          <Clock className="w-3.5 h-3.5 text-[#8B4513]" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Root-Level Draggable & Dockable Objectives Card */}
      {sharedView === 'video' && (
        <DraggableObjectivesCard
          topic={subject}
          onUpdateTopic={setSubjectDB}
          objectives={objectives}
          onToggleObjective={(id) => {
            const obj = objectives.find((o) => o.id === id)
            if (obj) toggleObjectiveDB(id, obj.completed)
          }}
          onAddObjective={addObjectiveDB}
          onRemoveObjective={removeObjectiveDB}
          isCollapsed={!showObjectives}
          onToggleCollapse={() => setShowObjectives((prev) => !prev)}
        />
      )}

      {/* Main Viewport */}
      <div className="relative flex-1 w-full flex flex-col gap-2.5 min-h-0">
        {sharedView === 'video' ? (
          /* ============================================================
             LAYOUT A: Full 1-on-1 Video Conference (Google Meet Style)
             ============================================================ */
          <div className="relative flex-1 w-full flex flex-col gap-2.5 min-h-0">
            {/* Top Video Tile: Peer Participant (Maria / User2) */}
            <div className="relative flex-1 w-full bg-white border border-[#E8DACB] rounded-3xl overflow-hidden flex items-center justify-center shadow-md transition-all duration-300">
              {!isPartnerCameraOff ? (
                /* CAMERA OPEN: Real WebRTC remote video feed! */
                <div className="relative w-full h-full flex items-center justify-center bg-[#251811]">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${remoteStream ? 'block' : 'hidden'}`}
                  />
                  {!remoteStream && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#251811] text-[#A8826D] p-4 text-center">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mb-2" />
                      <span className="text-[11px] font-bold text-emerald-400">Connecting P2P video & audio…</span>
                      <span className="text-[9px] text-[#A8826D] mt-0.5">Please wait while your partner joins</span>
                    </div>
                  )}

                  {/* Corner Badge when camera is OPEN */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 animate-fade-in bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/10">
                    <OtterAvatarWithBadge
                      config={partner.otter}
                      countryCode={partner.country_code}
                      size="sm"
                      bgCircleColor="clean"
                    />
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      {partner.display_name}
                    </span>
                  </div>

                  {remoteStream && (
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Video</span>
                    </div>
                  )}
                </div>
              ) : (
                /* CAMERA CLOSED: Google Meet Centered Avatar on Warm Background */
                <div className="w-full h-full bg-[#F5EDE3] flex flex-col items-center justify-center p-4 animate-fade-in">
                  <div className="relative mb-2 scale-110 drop-shadow-lg">
                    <OtterAvatarWithBadge
                      config={partner.otter}
                      countryCode={partner.country_code}
                      showDegree={false}
                      size="lg"
                      bgCircleColor="clean"
                    />
                  </div>
                  <span className="text-sm font-black text-[#2D1B11] mb-1">
                    {partner.display_name}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#875F49] bg-white border border-[#DFC3A6] px-2.5 py-0.5 rounded-full shadow-xs">
                    <VideoOff className="w-3 h-3 text-[#875F49]" />
                    <span>Camera Off</span>
                  </div>
                </div>
              )}

              {/* Audio Status Icon (Peer) */}
              <div className="absolute bottom-3 right-3 z-20">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
                    isPartnerMuted
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/90 text-emerald-600 border border-[#DFC3A6]'
                  }`}
                  title={isPartnerMuted ? `${partner.display_name} is muted` : `${partner.display_name} microphone active`}
                >
                  {isPartnerMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Bottom Video Tile: Self Participant (User1 / Adrian) */}
            <div className="relative flex-1 w-full bg-white border border-[#E8DACB] rounded-3xl overflow-hidden flex items-center justify-center shadow-md transition-all duration-300">
              {!isCameraOff ? (
                /* CAMERA OPEN: Live local video feed */
                <>
                  <div className="relative w-full h-full bg-[#251811]">
                    {hasMediaPermission ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#F5EDE3] flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-ping" />
                      </div>
                    )}

                    {isMuted && (
                      <div className="absolute top-3 right-3 bg-rose-600/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-md">
                        <MicOff className="w-3 h-3" />
                        <span>Muted</span>
                      </div>
                    )}
                  </div>

                  {/* Corner Badge when camera is OPEN */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 animate-fade-in bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/10">
                    <OtterAvatarWithBadge
                      config={currentUser.otter}
                      countryCode={currentUser.country_code}
                      size="sm"
                      bgCircleColor="clean"
                    />
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      {currentUser.display_name} (You)
                    </span>
                  </div>
                </>
              ) : (
                /* CAMERA CLOSED: Google Meet Centered Avatar on Warm Background */
                <div className="w-full h-full bg-[#F5EDE3] flex flex-col items-center justify-center p-4 animate-fade-in">
                  <div className="relative mb-2 scale-110 drop-shadow-lg">
                    <OtterAvatarWithBadge
                      config={currentUser.otter}
                      countryCode={currentUser.country_code}
                      showDegree={false}
                      size="lg"
                      bgCircleColor="clean"
                    />
                  </div>
                  <span className="text-sm font-black text-[#2D1B11] mb-1">
                    {currentUser.display_name} (You)
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#875F49] bg-white border border-[#DFC3A6] px-2.5 py-0.5 rounded-full shadow-xs">
                    <VideoOff className="w-3 h-3 text-[#875F49]" />
                    <span>Camera Off</span>
                  </div>
                </div>
              )}

              {/* Audio Status Icon (Self) */}
              <div className="absolute bottom-3 right-3 z-20">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
                    isMuted
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/90 text-emerald-600 border border-[#DFC3A6]'
                  }`}
                  title={isMuted ? 'Your microphone is muted' : 'Your microphone is active'}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             LAYOUT B: Split Whiteboard / Quiz / Chat View
             ============================================================ */
          <div className="flex-1 w-full flex flex-col gap-2 min-h-0">
            <div className="flex-[3] min-h-0 bg-white border border-[#E8DACB] rounded-3xl overflow-hidden shadow-md">
              <DuoInCallSharedSpace
                partner={partner}
                currentUser={currentUser}
                messages={messages}
                onSendMessage={(text) =>
                  sendMessageDB(text, currentUser.id, currentUser.display_name)
                }
                activeView={sharedView === 'chat' ? 'chat' : 'quiz'}
                onChangeView={(v) => setSharedView(v)}
              />
            </div>

            {/* Bottom Mini Video Tiles */}
            <div className="flex-[1.2] flex gap-2 min-h-0">
              <div className="relative flex-1 bg-white border border-[#E8DACB] rounded-2xl overflow-hidden flex items-center justify-center p-2 shadow-sm">
                {!isPartnerCameraOff && remoteStream ? (
                  <video
                    ref={(el) => {
                      if (el && remoteStream) {
                        el.srcObject = remoteStream
                        el.play().catch(() => {})
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <OtterAvatarWithBadge
                    config={partner.otter}
                    countryCode={partner.country_code}
                    size="md"
                    bgCircleColor="clean"
                  />
                )}
                <div className="absolute top-2 right-2 z-20">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs ${
                      isPartnerMuted ? 'bg-rose-600 text-white' : 'bg-white text-emerald-600 border border-[#DFC3A6]'
                    }`}
                  >
                    {isPartnerMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  </div>
                </div>
              </div>

              <div className="relative flex-1 bg-white border border-[#E8DACB] rounded-2xl overflow-hidden flex items-center justify-center p-2 shadow-sm">
                {!isCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-xl scale-x-[-1]"
                  />
                ) : (
                  <OtterAvatarWithBadge
                    config={currentUser.otter}
                    countryCode={currentUser.country_code}
                    size="md"
                    bgCircleColor="clean"
                  />
                )}
                <div className="absolute top-2 right-2 z-20">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs ${
                      isMuted ? 'bg-rose-600 text-white' : 'bg-white text-emerald-600 border border-[#DFC3A6]'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="pt-2 z-30">
        <MeetBottomBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isChatOpen={sharedView === 'chat' || sharedView === 'quiz'}
          unreadCount={messages.length}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onToggleChat={() =>
            setSharedView((v) => (v === 'video' ? 'chat' : 'video'))
          }
          onEndCall={() => setShowEndModal(true)}
        />
      </div>

      {/* End Call / Post-Session Connection Decision Dialog */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-white border border-[#E8DACB] rounded-3xl p-6 shadow-2xl text-center text-[#2D1B11] animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="font-display font-black text-2xl mb-1 text-[#2D1B11]">
              Session Summary
            </h3>
            <p className="text-xs text-[#7A5A46] font-medium mb-3">
              Topic: <span className="font-black text-[#2D1B11]">"{subject}"</span>
            </p>

            {/* Completed Objectives Metric */}
            <div className="bg-[#FAF2E6] border border-[#DFC3A6] rounded-2xl p-3 mb-4 text-xs text-left">
              <div className="flex justify-between font-bold text-[#2D1B11] mb-1.5">
                <span>Completed Goals</span>
                <span className="font-black">{completedCount} of 3</span>
              </div>
              <div className="w-full bg-[#E8DACB] rounded-full h-2.5 overflow-hidden mb-2 shadow-inner">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all shadow-xs"
                  style={{ width: `${(completedCount / 3) * 100}%` }}
                />
              </div>
              <div className="space-y-1">
                {objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center gap-1.5 text-[11px]">
                    {obj.completed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full border border-[#875F49]/50" />
                    )}
                    <span className={obj.completed ? 'text-emerald-700 font-bold' : 'text-[#875F49]'}>
                      {obj.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Status: Conditional based on whether already connected */}
            {isAlreadyConnected ? (
              <div className="bg-[#FCFAF7] border border-emerald-200 rounded-2xl p-3 mb-4 text-xs">
                <span className="text-[10px] font-black uppercase text-emerald-700 block mb-1">
                  Study Buddies ✨
                </span>
                <p className="text-xs text-[#2D1B11] font-bold">
                  You and <strong>{partner.display_name}</strong> are connected study buddies!
                </p>
                <p className="text-[11px] text-[#7A5A46] mt-0.5">
                  Great job learning together! Your XP points and study stats have been updated.
                </p>
              </div>
            ) : (
              <div className="bg-[#FCFAF7] border border-[#DFC3A6] rounded-2xl p-3 mb-4 text-xs">
                <span className="text-[10px] font-black uppercase text-[#875F49] block mb-1">
                  Study Buddy Connection
                </span>
                <p className="text-xs text-[#2D1B11] font-semibold">
                  You studied with <strong>{partner.display_name}</strong>! Would you like to connect as study buddies for future sessions?
                </p>
              </div>
            )}

            <div className="space-y-2">
              {isAlreadyConnected ? (
                <>
                  <button
                    onClick={async () => {
                      recordCompletedSessionPartner(partner.id, duration, completedCount)
                      await useSessionStore.getState().endSessionDB()
                      setShowEndModal(false)
                      onEndSession()
                    }}
                    className="w-full py-3 bg-[#7E4228] hover:bg-[#924D30] text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Finish & Exit Session
                  </button>
                  <button
                    onClick={() => setShowEndModal(false)}
                    className="w-full py-2.5 bg-[#FAF2E6] hover:bg-[#F3E7D5] text-[#2D1B11] font-bold text-xs rounded-2xl border border-[#DFC3A6] transition-all cursor-pointer"
                  >
                    Resume Session
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      recordCompletedSessionPartner(partner.id, duration, completedCount)
                      const compat = calculateCompatibility(currentUser, partner)
                      addSessionConnection(partner, compat, duration, completedCount)
                      await sendRequestDB(partner)
                      await useSessionStore.getState().endSessionDB()
                      setShowEndModal(false)
                      onEndSession()
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 font-black text-sm text-white rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Connect with {partner.display_name.split(' ')[0]} & Exit</span>
                  </button>

                  <button
                    onClick={async () => {
                      recordCompletedSessionPartner(partner.id, duration, completedCount)
                      await useSessionStore.getState().endSessionDB()
                      setShowEndModal(false)
                      onEndSession()
                    }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 font-black text-xs text-white rounded-2xl transition-all cursor-pointer"
                  >
                    Leave Without Connecting
                  </button>

                  <button
                    onClick={() => setShowEndModal(false)}
                    className="w-full py-2 bg-[#FAF2E6] hover:bg-[#F3E7D5] text-[#2D1B11] font-bold text-xs rounded-2xl border border-[#DFC3A6] transition-all cursor-pointer"
                  >
                    Resume Session
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
