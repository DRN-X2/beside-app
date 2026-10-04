import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MeetBottomBar } from '../../../shared/components/MeetBottomBar'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import { DraggableObjectivesCard } from './DraggableObjectivesCard'
import { DuoInCallSharedSpace } from './DuoInCallSharedSpace'
import { useSessionStore } from '../../../store/sessionStore'
import { useAuthStore } from '../../../store/authStore'
import { useConnectionStore } from '../../../store/connectionStore'
import { calculateCompatibility } from '../../../services/compatibility'
import { DEMO_CURRENT_USER } from '../../../data/demoUsers'
import { CheckCircle2, Clock, VideoOff, MicOff, Mic, Sparkles, Check } from 'lucide-react'
import type { DemoUser, SessionDuration } from '../../../types'

interface DuoVideoRoomProps {
  partner: DemoUser
  duration: SessionDuration
  onEndSession: () => void
}

export const DuoVideoRoom: React.FC<DuoVideoRoomProps> = ({
  partner,
  duration,
  onEndSession,
}) => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const currentUser = profile || DEMO_CURRENT_USER
  const { addSessionConnection } = useConnectionStore()

  const {
    subject,
    setSubject,
    objectives,
    toggleObjective,
    addObjective,
    removeObjective,
    timeLeft,
    tick,
    messages,
    sendMessage,
  } = useSessionStore()

  // Video and Audio controls
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isPartnerCameraOff, setIsPartnerCameraOff] = useState(false)
  const [isPartnerMuted, setIsPartnerMuted] = useState(false)
  const [sharedView, setSharedView] = useState<'video' | 'quiz' | 'chat'>('video')
  const [showEndModal, setShowEndModal] = useState(false)

  // Local media stream for user webcam
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const peerCanvasRef = useRef<HTMLCanvasElement>(null)
  const [hasMediaPermission, setHasMediaPermission] = useState(false)

  // Continuous real-time countdown timer (no pause button)
  useEffect(() => {
    const timer = setInterval(() => {
      tick()
    }, 1000)
    return () => clearInterval(timer)
  }, [tick])

  // Real webcam feed for user
  useEffect(() => {
    let stream: MediaStream | null = null
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        setHasMediaPermission(true)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (err) {
        setHasMediaPermission(false)
      }
    }
    if (!isCameraOff) {
      startCamera()
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isCameraOff])

  // Simulated live video stream for partner canvas (shows subtle room light movement when camera is on)
  useEffect(() => {
    const canvas = peerCanvasRef.current
    if (!canvas || isPartnerCameraOff) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let frame = 0
    const render = () => {
      frame++
      const width = canvas.width
      const height = canvas.height

      // Subtle ambient room lighting gradient simulating a live camera background
      const grad = ctx.createLinearGradient(0, 0, width, height)
      const shift = Math.sin(frame * 0.02) * 15
      grad.addColorStop(0, `rgb(${35 + shift}, ${28 + shift}, ${22 + shift})`)
      grad.addColorStop(1, `rgb(${22 - shift * 0.5}, ${18 - shift * 0.5}, ${14 - shift * 0.5})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Ambient study lamp glow
      ctx.fillStyle = 'rgba(255, 220, 180, 0.08)'
      ctx.beginPath()
      ctx.arc(width * 0.8, height * 0.3, 100 + Math.sin(frame * 0.04) * 8, 0, Math.PI * 2)
      ctx.fill()

      animId = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(animId)
  }, [isPartnerCameraOff])

  // Format time remaining MM:SS
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const completedCount = objectives.filter((o) => o.completed).length

  return (
    <div className="relative w-full h-[100dvh] bg-[#170E08] flex flex-col justify-between p-3 max-w-md mx-auto select-none overflow-hidden text-white font-sans">
      {/* Top Session Status Bar - Clay Pill Dock */}
      <div className="flex items-center justify-between px-4 py-2.5 z-30 clay-dock mb-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-[#FAF2E6]">
            Duo Session
          </span>
          <span className="text-[10px] text-[#A8826D] font-bold">· {duration}m</span>
        </div>

        {/* Real-Time Continuous Clock - 3D Clay Inset */}
        <div className="flex items-center gap-1.5 bg-[#FAF2E6] text-[#2D1B11] px-3 py-1 rounded-full text-xs font-black clay-pill">
          <Clock className="w-3.5 h-3.5 text-[#8B4513]" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Root-Level Draggable & Dockable Objectives Card */}
      {sharedView === 'video' && (
        <DraggableObjectivesCard
          topic={subject}
          onUpdateTopic={setSubject}
          objectives={objectives}
          onToggleObjective={toggleObjective}
          onAddObjective={addObjective}
          onRemoveObjective={removeObjective}
        />
      )}

      {/* Main Viewport */}
      <div className="relative flex-1 w-full flex flex-col gap-2.5 min-h-0">
        {sharedView === 'video' ? (
          /* ============================================================
             LAYOUT A: Full 1-on-1 Video Conference (Mockup Left)
             ============================================================ */
          <div className="relative flex-1 w-full flex flex-col gap-2.5 min-h-0">
            {/* Top Video Tile: Peer Participant (Maria) - 3D Dark Clay Chassis */}
            <div
              onClick={() => setIsPartnerCameraOff((prev) => !prev)}
              className="relative flex-1 w-full clay-tile-dark overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300"
              title="Click to toggle partner camera"
            >
              {!isPartnerCameraOff ? (
                /* CAMERA OPEN: Live video feed, avatar placed in bottom-left corner */
                <>
                  <div className="relative w-full h-full flex items-center justify-center">
                    <canvas ref={peerCanvasRef} width={400} height={300} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-[#1A110B]/80 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Video</span>
                    </div>
                  </div>

                  {/* Corner Avatar when camera is OPEN */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 animate-fade-in bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-2xl border border-white/10">
                    <OtterAvatarWithBadge
                      config={partner.otter}
                      countryCode={partner.country_code}
                      size="sm"
                      bgCircleColor="clean"
                    />
                    <span className="text-xs font-bold text-[#FAF2E6] drop-shadow-md">
                      {partner.display_name}
                    </span>
                  </div>
                </>
              ) : (
                /* CAMERA CLOSED: No corner avatar! Avatar goes to CENTER and is BIGGER */
                <div className="flex flex-col items-center justify-center p-4 animate-fade-in">
                  <div className="relative mb-2 scale-110 drop-shadow-2xl">
                    <OtterAvatarWithBadge
                      config={partner.otter}
                      countryCode={partner.country_code}
                      showDegree={false}
                      size="lg"
                      bgCircleColor="clean"
                    />
                  </div>
                  <span className="text-sm font-black text-[#FAF2E6] mb-1.5">
                    {partner.display_name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A8826D] bg-[#1A110B]/80 px-3 py-1 rounded-full border border-white/10 shadow-inner">
                    <VideoOff className="w-3 h-3 text-[#A8826D]" />
                    <span>Camera Off</span>
                  </div>
                </div>
              )}
              {/* Mini Circular Audio Status Icon (Peer) - 3D Clay Orb */}
              <div className="absolute bottom-3 right-3 z-20">
                <div
                  className={`w-8 h-8 rounded-full clay-btn flex items-center justify-center shadow-lg transition-all ${
                    isPartnerMuted
                      ? 'clay-btn-red text-white'
                      : 'clay-btn-circle-dark text-emerald-400'
                  }`}
                  title={isPartnerMuted ? `${partner.display_name} is muted` : `${partner.display_name} microphone active`}
                >
                  {isPartnerMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Bottom Video Tile: Self Participant (Adrian) - 3D Dark Clay Chassis */}
            <div className="relative flex-1 w-full clay-tile-dark overflow-hidden flex items-center justify-center transition-all duration-300">
              {!isCameraOff ? (
                /* CAMERA OPEN: Live video feed, avatar placed in bottom-left corner */
                <>
                  <div className="relative w-full h-full">
                    {hasMediaPermission ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#22130B] to-[#3A2215] flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-ping absolute" />
                      </div>
                    )}

                    {isMuted && (
                      <div className="absolute top-3 right-3 bg-rose-900/80 px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-200 border border-rose-500/50 flex items-center gap-1.5 shadow-md">
                        <MicOff className="w-3 h-3" />
                        <span>Muted</span>
                      </div>
                    )}
                  </div>

                  {/* Corner Avatar when camera is OPEN */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 animate-fade-in bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-2xl border border-white/10">
                    <OtterAvatarWithBadge
                      config={currentUser.otter}
                      countryCode={currentUser.country_code}
                      size="sm"
                      bgCircleColor="clean"
                    />
                    <span className="text-xs font-bold text-[#FAF2E6] drop-shadow-md">
                      {currentUser.display_name} (You)
                    </span>
                  </div>
                </>
              ) : (
                /* CAMERA CLOSED: No corner avatar! Avatar goes to CENTER and is BIGGER */
                <div className="flex flex-col items-center justify-center p-4 animate-fade-in">
                  <div className="relative mb-2 scale-110 drop-shadow-2xl">
                    <OtterAvatarWithBadge
                      config={currentUser.otter}
                      countryCode={currentUser.country_code}
                      showDegree={false}
                      size="lg"
                      bgCircleColor="clean"
                    />
                  </div>
                  <span className="text-sm font-black text-[#FAF2E6] mb-1.5">
                    {currentUser.display_name} (You)
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A8826D] bg-[#1A110B]/80 px-3 py-1 rounded-full border border-white/10 shadow-inner">
                    <VideoOff className="w-3 h-3 text-[#A8826D]" />
                    <span>Camera Off</span>
                  </div>
                </div>
              )}
              {/* Mini Circular Audio Status Icon (Self) - 3D Clay Orb */}
              <div className="absolute bottom-3 right-3 z-20">
                <div
                  className={`w-8 h-8 rounded-full clay-btn flex items-center justify-center shadow-lg transition-all ${
                    isMuted
                      ? 'clay-btn-red text-white'
                      : 'clay-btn-circle-dark text-emerald-400'
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
             LAYOUT B: Split Whiteboard / Quiz / Chat View (Mockup Right & Image 2)
             ============================================================ */
          <div className="flex-1 w-full flex flex-col gap-2 min-h-0">
            {/* Top 65%: Whiteboard Quiz or In-Call Chat */}
            <div className="flex-[3] min-h-0">
              <DuoInCallSharedSpace
                partner={partner}
                currentUser={currentUser}
                messages={messages}
                onSendMessage={(text) =>
                  sendMessage(text, currentUser.id, currentUser.display_name)
                }
                activeView={sharedView === 'chat' ? 'chat' : 'quiz'}
                onChangeView={(v) => setSharedView(v)}
              />
            </div>

            {/* Middle 35%: Dual Mini Video Tiles Side-by-Side (Mockup Right) - Clay 3D Tiles */}
            <div className="flex-[1.2] flex gap-2 min-h-0">
              {/* Peer Tile */}
              <div
                onClick={() => setIsPartnerCameraOff((prev) => !prev)}
                className="relative flex-1 clay-tile-dark overflow-hidden flex items-center justify-center p-2 cursor-pointer transition-all"
                title="Click to toggle partner camera"
              >
                {!isPartnerCameraOff ? (
                  /* Camera OPEN: video + corner avatar */
                  <>
                    <canvas ref={peerCanvasRef} width={200} height={150} className="w-full h-full object-cover rounded-2xl" />
                    <div className="absolute bottom-2 left-2 z-10 scale-90 animate-fade-in bg-black/40 backdrop-blur-sm p-1 rounded-xl">
                      <OtterAvatarWithBadge
                        config={partner.otter}
                        countryCode={partner.country_code}
                        size="sm"
                        bgCircleColor="red"
                      />
                    </div>
                  </>
                ) : (
                  /* Camera CLOSED: ONLY CENTER AVATAR (BIGGER, no corner avatar!) */
                  <div className="flex items-center justify-center animate-fade-in drop-shadow-xl">
                    <OtterAvatarWithBadge
                      config={partner.otter}
                      countryCode={partner.country_code}
                      size="md"
                      bgCircleColor="red"
                    />
                  </div>
                )}
                {/* Mini Circular Audio Icon in Mini Tile (Peer) */}
                <div className="absolute top-2 right-2 z-20">
                  <div
                    className={`w-6 h-6 rounded-full clay-btn flex items-center justify-center shadow-md ${
                      isPartnerMuted
                        ? 'clay-btn-red text-white'
                        : 'clay-btn-circle-dark text-emerald-400'
                    }`}
                  >
                    {isPartnerMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  </div>
                </div>
              </div>

              {/* Self Tile */}
              <div className="relative flex-1 clay-tile-dark overflow-hidden flex items-center justify-center p-2 transition-all">
                {!isCameraOff ? (
                  /* Camera OPEN: video + corner avatar */
                  <>
                    {hasMediaPermission ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1] rounded-2xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#351F14] rounded-2xl flex items-center justify-center" />
                    )}
                    <div className="absolute bottom-2 left-2 z-10 scale-90 animate-fade-in bg-black/40 backdrop-blur-sm p-1 rounded-xl">
                      <OtterAvatarWithBadge
                        config={currentUser.otter}
                        countryCode={currentUser.country_code}
                        size="sm"
                        bgCircleColor="blue"
                      />
                    </div>
                  </>
                ) : (
                  /* Camera CLOSED: ONLY CENTER AVATAR (BIGGER, no corner avatar!) */
                  <div className="flex items-center justify-center animate-fade-in drop-shadow-xl">
                    <OtterAvatarWithBadge
                      config={currentUser.otter}
                      countryCode={currentUser.country_code}
                      size="md"
                      bgCircleColor="blue"
                    />
                  </div>
                )}
                {/* Mini Circular Audio Icon in Mini Tile (Self) */}
                <div className="absolute top-2 right-2 z-20">
                  <div
                    className={`w-6 h-6 rounded-full clay-btn flex items-center justify-center shadow-md ${
                      isMuted
                        ? 'clay-btn-red text-white'
                        : 'clay-btn-circle-dark text-emerald-400'
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

      {/* Bottom Controls Bar (Audio, Camera, Chat, and Red End Call) */}
      <div className="pt-2 z-30">
        <MeetBottomBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isChatOpen={sharedView === 'chat' || sharedView === 'quiz'}
          unreadCount={messages.length}
          onToggleMic={() => setIsMuted((m) => !m)}
          onToggleCamera={() => setIsCameraOff((c) => !c)}
          onToggleChat={() =>
            setSharedView((v) => (v === 'video' ? 'chat' : 'video'))
          }
          onEndCall={() => setShowEndModal(true)}
        />
      </div>

      {/* End Call / Post-Session Connection Decision Dialog */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm clay-card-floating p-6 shadow-2xl text-center text-[#2D1B11] animate-slide-up">
            <div className="w-16 h-16 rounded-full clay-btn-green flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="font-display font-black text-2xl mb-1 text-[#2D1B11]">
              Session Summary
            </h3>
            <p className="text-xs text-[#7A5A46] font-medium mb-3">
              Topic: <span className="font-black text-[#2D1B11]">"{subject}"</span>
            </p>

            {/* Completed Objectives Metric - Clay Inset Container */}
            <div className="clay-inset p-3 mb-4 text-xs text-left">
              <div className="flex justify-between font-bold text-[#2D1B11] mb-1.5">
                <span>Completed Goals</span>
                <span className="font-black">{completedCount} of 3</span>
              </div>
              <div className="w-full bg-[#D8C7B5] rounded-full h-2.5 overflow-hidden mb-2 shadow-inner">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all shadow-md"
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

            {/* Interaction First, Connection Second: Decide to Connect after studying! */}
            <div className="clay-card p-3 mb-4 text-xs border border-[#DFC3A6]">
              <span className="text-[10px] font-black uppercase text-[#875F49] block mb-1">
                Study Buddy Connection
              </span>
              <p className="text-xs text-[#2D1B11] font-semibold">
                You studied with <strong className="font-black">{partner.display_name}</strong>! Would you like to connect as study buddies for future sessions?
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  const compat = calculateCompatibility(currentUser, partner)
                  addSessionConnection(partner, compat, duration, completedCount)
                  setShowEndModal(false)
                  onEndSession()
                }}
                className="w-full py-3 clay-btn clay-btn-green font-black text-sm text-white shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Connect with {partner.display_name.split(' ')[0]} & Exit</span>
              </button>

              <button
                onClick={() => {
                  setShowEndModal(false)
                  onEndSession()
                }}
                className="w-full py-2.5 clay-btn clay-btn-red font-black text-xs text-white"
              >
                Leave Without Connecting
              </button>

              <button
                onClick={() => setShowEndModal(false)}
                className="w-full py-2 clay-btn bg-[#FAF2E6] text-[#2D1B11] font-bold text-xs border border-white/60 shadow-sm"
              >
                Resume Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
