import React, { useState, useEffect, useRef } from 'react'
import { MeetBottomBar } from '../../../shared/components/MeetBottomBar'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import { DraggableObjectivesCard } from '../../duo/components/DraggableObjectivesCard'
import { useAuthStore } from '../../../store/authStore'
import { useConnectionStore, recordCompletedSessionPartner } from '../../../store/connectionStore'
import { CheckCircle2, Clock, Users, VideoOff, MicOff, Mic, Sparkles, MessageSquare, Award, Check, Target } from 'lucide-react'
import type { DemoUser, DuoObjective } from '../../../types'
import { useSessionStore } from '../../../store/sessionStore'
import { supabase } from '../../../lib/supabase'
import type { Squad } from '../../../services/squadService'
import { subscribeToActiveSession, fetchSessionObjectives } from '../../../services/realtimeHub'

interface SquadVideoRoomProps {
  squad?: Squad | null
  teamMembers: DemoUser[]
  onEndSession: () => void
}

export const SquadVideoRoom: React.FC<SquadVideoRoomProps> = ({
  squad,
  teamMembers,
  onEndSession,
}) => {
  const { profile } = useAuthStore()
  const currentUser = profile
  if (!currentUser) return null
  const { connections, sendRequestDB, fetchConnections } = useConnectionStore()

  // Strictly for Squad: Automatically synchronize squad topic and up to 3 objectives
  useEffect(() => {
    if (squad) {
      if (squad.focus) {
        useSessionStore.getState().setSubject(squad.focus)
      }
      if (squad.id) {
        subscribeToActiveSession(squad.id)
        fetchSessionObjectives(squad.id)
      }
      if (squad.objectives && squad.objectives.length > 0) {
        const existing = useSessionStore.getState().objectives
        if (existing.length === 0) {
          useSessionStore.getState().setObjectives(
            squad.objectives.slice(0, 3).map((text, idx) => ({
              id: `squad-obj-${squad.id}-${idx}`,
              text,
              completed: false,
            }))
          )
        }
      }
    }
  }, [squad?.id, squad?.focus, squad?.objectives])

  const [showEndModal, setShowEndModal] = useState(false)
  const [showObjectives, setShowObjectives] = useState(false)
  const [activeTab, setActiveTab] = useState<'video' | 'chat'>('video')
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [peerMutedState, setPeerMutedState] = useState<Record<string, boolean>>({})
  const [peerCameraState, setPeerCameraState] = useState<Record<string, boolean>>({})
  const [inputMsg, setInputMsg] = useState('')

  // Local media stream for current user
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [hasMediaPermission, setHasMediaPermission] = useState(false)

  // DB-backed Session State
  const {
    sessionId,
    timeLeft,
    tick,
    subject: topic,
    setSubjectDB,
    objectives,
    addObjectiveDB: addObjective,
    toggleObjectiveDB,
    removeObjectiveDB: removeObjective,
    messages,
    sendMessageDB,
    endSessionDB,
  } = useSessionStore()

  // Fetch connections for checking already-connected peers
  useEffect(() => {
    if (currentUser?.id) {
      fetchConnections(currentUser.id)
    }
  }, [currentUser?.id, fetchConnections])

  // Persistent media stream handling
  useEffect(() => {
    let isMounted = true

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        setHasMediaPermission(true)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
          localVideoRef.current.play().catch(() => {})
        }
      } catch (err) {
        console.warn('[SquadVideoRoom] Media permission issue:', err)
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

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !isCameraOff
      })
      if (!isCameraOff && localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current
        localVideoRef.current.play().catch(() => {})
      }
    }
  }, [isCameraOff])

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !isMuted
      })
    }
  }, [isMuted])

  // Real-time broadcast for Squad media state
  const roomId = sessionId || 'squad_room_active'

  useEffect(() => {
    const channel = supabase.channel(`media_sync_${roomId}`)
      .on('broadcast', { event: 'media_state_change' }, ({ payload }) => {
        if (payload && payload.userId && payload.userId !== currentUser.id) {
          if (typeof payload.isCameraOff === 'boolean') {
            setPeerCameraState((prev) => ({ ...prev, [payload.userId]: payload.isCameraOff }))
          }
          if (typeof payload.isMuted === 'boolean') {
            setPeerMutedState((prev) => ({ ...prev, [payload.userId]: payload.isMuted }))
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, currentUser.id])

  const broadcastMediaState = (cameraOff: boolean, muted: boolean) => {
    const channel = supabase.channel(`media_sync_${roomId}`)
    channel.send({
      type: 'broadcast',
      event: 'media_state_change',
      payload: {
        userId: currentUser.id,
        isCameraOff: cameraOff,
        isMuted: muted,
      },
    })
  }

  const handleToggleCamera = () => {
    const next = !isCameraOff
    setIsCameraOff(next)
    broadcastMediaState(next, isMuted)
  }

  const handleToggleMic = () => {
    const next = !isMuted
    setIsMuted(next)
    broadcastMediaState(isCameraOff, next)
  }

  // Fetch session endsAt initially to sync the timer
  useEffect(() => {
    if (sessionId) {
      supabase.from('sessions').select('ends_at').eq('id', sessionId).single().then(({ data }) => {
        if (data && data.ends_at) {
          useSessionStore.getState().setEndsAt(new Date(data.ends_at))
        }
      })
    }
  }, [sessionId])

  // Watch timeLeft for expiration
  useEffect(() => {
    if (timeLeft <= 0) {
      setShowEndModal(true)
    }
  }, [timeLeft])

  // Continuous session clock
  useEffect(() => {
    const timer = setInterval(() => {
      tick()
    }, 1000)
    return () => clearInterval(timer)
  }, [tick])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim()) return
    sendMessageDB(inputMsg.trim(), currentUser.id, currentUser.display_name)
    setInputMsg('')
  }

  // Format time MM:SS
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const completedGoalsCount = objectives.filter((o) => o.completed).length

  // Squad layout calculation based on participant count
  const participantCount = teamMembers.length
  const gridLayoutClass = 'grid grid-cols-2 gap-2.5'

  // Unconnected peers count in squad
  const unconnectedPeers = teamMembers.filter(
    (m) => m.id !== currentUser.id && connections[m.id]?.status !== 'accepted'
  )

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF2E6] flex flex-col justify-between p-3 max-w-md mx-auto select-none overflow-hidden text-[#2D1B11] font-sans">
      {/* Top Session Status Bar - Clean Beside Cream Dock */}
      <div className="flex items-center justify-between px-3.5 py-2 z-30 bg-white/95 border border-[#E8DACB] rounded-2xl shadow-sm mb-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-[#4C271A]">
            Squad Session
          </span>
        </div>

        {/* Dynamic Top Bar Goals Indicator */}
        <button
          onClick={() => setShowObjectives((prev) => !prev)}
          className="flex items-center gap-1.5 bg-[#FAF2E6] hover:bg-[#F3E7D5] border border-[#DFC3A6] text-[#4C271A] px-2.5 py-1 rounded-full text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs"
          title="Click to view goals"
        >
          <Target className="w-3.5 h-3.5 text-[#C68642]" />
          <span>{completedGoalsCount}/3 Goals</span>
        </button>

        {/* Dynamic Countdown Timer & Members Pill */}
        <div className="flex items-center gap-2 bg-[#FAF2E6] text-[#2D1B11] px-2.5 py-1 rounded-full text-xs font-black border border-[#DFC3A6] shadow-xs">
          <Clock className="w-3.5 h-3.5 text-[#8B4513]" />
          <span>{formattedTime}</span>
          <span className="text-[#875F49]">·</span>
          <Users className="w-3 h-3 text-[#7A5A46]" />
          <span className="text-[10px] text-[#7A5A46]">{participantCount}</span>
        </div>
      </div>

      {/* Floating Draggable Real-Time Objectives Card */}
      <DraggableObjectivesCard
        topic={topic}
        onUpdateTopic={(newTopic) => setSubjectDB(newTopic)}
        objectives={objectives}
        onToggleObjective={(id) => {
          const obj = objectives.find((o) => o.id === id)
          if (obj) toggleObjectiveDB(id, obj.completed)
        }}
        onAddObjective={addObjective}
        onRemoveObjective={removeObjective}
        isCollapsed={!showObjectives}
        onToggleCollapse={() => setShowObjectives((prev) => !prev)}
      />

      {/* Main Study Arena: Tabs between Video Matrix and In-Call Group Chat */}
      <div className="flex-1 w-full flex flex-col min-h-0 relative mb-2">
        {activeTab === 'video' ? (
          /* Video Tiles Grid (Google Meet Card Style) */
          <div className={`flex-1 w-full ${gridLayoutClass} min-h-0 auto-rows-fr`}>
            {teamMembers.map((member) => {
              const isSelf = member.id === currentUser.id
              const isMutedPeer = isSelf ? isMuted : peerMutedState[member.id] || false
              const isCameraOffPeer = isSelf ? isCameraOff : peerCameraState[member.id] || false

              return (
                <div
                  key={member.id}
                  className="relative bg-white border border-[#E8DACB] rounded-2xl overflow-hidden shadow-sm flex flex-col items-center justify-center p-2 group transition-all duration-300"
                >
                  {isSelf && !isCameraOffPeer ? (
                    /* Self video feed */
                    <div className="absolute inset-0 bg-[#251811]">
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
                          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Centered Avatar on Warm Beige (Google Meet Style) */
                    <div className="absolute inset-0 bg-[#F5EDE3] flex flex-col items-center justify-center p-2">
                      <div className="scale-95 drop-shadow-md mb-1">
                        <OtterAvatarWithBadge
                          config={member.otter}
                          countryCode={member.country_code}
                          showDegree={false}
                          size="md"
                          bgCircleColor="clean"
                        />
                      </div>
                    </div>
                  )}

                  {/* Learner Name & Status Badge */}
                  <div className="absolute bottom-2 left-2 right-8 z-20">
                    <div className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-xl border border-white/10 max-w-full truncate inline-block">
                      <span className="font-display font-black text-[11px] text-white truncate block">
                        {member.display_name} {isSelf && '(You)'}
                      </span>
                    </div>
                  </div>

                  {/* Audio Status Pill */}
                  <div className="absolute top-2 right-2 z-20">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs ${
                        isMutedPeer ? 'bg-rose-600 text-white' : 'bg-white text-emerald-600 border border-[#DFC3A6]'
                      }`}
                    >
                      {isMutedPeer ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    </div>
                  </div>

                  {/* Camera indicator */}
                  {isCameraOffPeer && (
                    <div className="absolute top-2 left-2 z-20 bg-white/80 border border-[#DFC3A6] px-1.5 py-0.5 rounded-full text-[9px] text-[#875F49] flex items-center gap-1 shadow-2xs">
                      <VideoOff className="w-2.5 h-2.5" />
                      <span>Off</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Live Squad Group Chat */
          <div className="flex-1 w-full bg-white border border-[#E8DACB] rounded-3xl flex flex-col overflow-hidden p-3 min-h-0 shadow-md">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#A8826D]">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-50 text-[#C68642]" />
                  <p className="text-xs font-bold text-[#4C271A]">No chat messages yet.</p>
                  <p className="text-[10px] text-[#875F49]">Encourage your squad or ask questions here!</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.senderId === currentUser.id ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-[#875F49] px-1 mb-0.5">
                      {m.senderName}
                    </span>
                    <div
                      className={`px-3 py-1.5 rounded-2xl text-xs max-w-[80%] break-words shadow-2xs ${
                        m.senderId === currentUser.id
                          ? 'bg-[#7E4228] text-white rounded-br-xs'
                          : 'bg-[#FAF2E6] text-[#2D1B11] border border-[#DFC3A6] rounded-bl-xs'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* In-Call Message Input */}
            <form onSubmit={handleSendMessage} className="mt-2 flex gap-2 pt-2 border-t border-[#E8DACB]">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Message squad members..."
                className="flex-1 bg-[#FAF2E6] border border-[#DFC3A6] rounded-xl px-3 py-2 text-xs text-[#2D1B11] placeholder-[#875F49] focus:outline-none focus:ring-2 focus:ring-[#C68642]/40"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#7E4228] hover:bg-[#924D30] text-xs font-black text-white rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Audio/Video Bar & Controls */}
      <div className="pt-1 z-30">
        <MeetBottomBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isChatOpen={activeTab === 'chat'}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onToggleChat={() => setActiveTab((prev) => (prev === 'chat' ? 'video' : 'chat'))}
          onEndCall={() => setShowEndModal(true)}
        />
      </div>

      {/* End Session Confirmation & Post-Session Connection Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-[#E8DACB] rounded-3xl p-6 shadow-2xl text-[#2D1B11] animate-slide-up">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center mb-2 shadow-lg">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="font-display font-black text-xl text-[#2D1B11]">Session Completed!</h3>
              <p className="text-xs text-[#7A5A46] font-semibold mt-1">
                You studied for {squad?.duration || 30} minutes with your squad.
              </p>
            </div>

            {/* Goals Completed Summary */}
            <div className="bg-[#FAF2E6] border border-[#DFC3A6] p-3 rounded-2xl mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-[#875F49] mb-1.5">
                <span>Completed Goals</span>
                <span>
                  {completedGoalsCount} of {objectives.length}
                </span>
              </div>
              <div className="w-full bg-[#E8DACB] rounded-full h-2 overflow-hidden mb-2 shadow-inner">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all shadow-xs"
                  style={{ width: `${(completedGoalsCount / Math.max(1, objectives.length)) * 100}%` }}
                />
              </div>
              <div className="space-y-1">
                {objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center gap-1.5 text-xs text-[#2D1B11]">
                    <Check
                      className={`w-3.5 h-3.5 ${obj.completed ? 'text-emerald-600 font-bold' : 'text-[#875F49]/40'}`}
                    />
                    <span className={obj.completed ? 'line-through text-[#7A5A46]' : 'font-medium'}>
                      {obj.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Post-Session Buddy Connection: Connect after studying! */}
            {unconnectedPeers.length > 0 ? (
              <div className="bg-[#FCFAF7] border border-[#DFC3A6] rounded-2xl p-3 mb-4 text-xs">
                <span className="text-[10px] font-black uppercase text-[#875F49] block mb-1">
                  Study Buddy Connection
                </span>
                <p className="text-[11px] text-[#2D1B11] font-semibold">
                  You studied with <strong className="font-black">{participantCount} squad mates</strong>! Connect to study again together!
                </p>
              </div>
            ) : (
              <div className="bg-[#FCFAF7] border border-emerald-200 rounded-2xl p-3 mb-4 text-xs">
                <span className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1 mb-1">
                  <span>Squad Buddies</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                </span>
                <p className="text-xs text-[#2D1B11] font-bold">
                  You are already connected with all squad members!
                </p>
                <p className="text-[11px] text-[#7A5A46] mt-0.5">
                  Great job learning together! Your XP points and study stats have been updated.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {unconnectedPeers.length > 0 ? (
                <>
                  <button
                    onClick={async () => {
                      teamMembers.forEach((m) => {
                        if (m.id !== currentUser.id) recordCompletedSessionPartner(m.id)
                      })
                      unconnectedPeers.forEach((peer) => {
                        sendRequestDB(peer)
                      })
                      setShowEndModal(false)
                      await endSessionDB()
                      onEndSession()
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 font-black text-xs text-white rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Connect with New Buddies & Exit</span>
                  </button>

                  <button
                    onClick={async () => {
                      teamMembers.forEach((m) => {
                        if (m.id !== currentUser.id) recordCompletedSessionPartner(m.id)
                      })
                      setShowEndModal(false)
                      await endSessionDB()
                      onEndSession()
                    }}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 font-black text-xs text-white rounded-2xl transition-all cursor-pointer"
                  >
                    Leave Without Connecting
                  </button>
                </>
              ) : (
                <button
                  onClick={async () => {
                    teamMembers.forEach((m) => {
                      if (m.id !== currentUser.id) recordCompletedSessionPartner(m.id)
                    })
                    setShowEndModal(false)
                    await endSessionDB()
                    onEndSession()
                  }}
                  className="w-full py-3 bg-[#7E4228] hover:bg-[#924D30] font-black text-xs text-white rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Finish & Exit Session
                </button>
              )}

              <button
                onClick={() => setShowEndModal(false)}
                className="w-full py-2 bg-[#FAF2E6] hover:bg-[#F3E7D5] text-[#2D1B11] font-bold text-xs rounded-2xl border border-[#DFC3A6] transition-all cursor-pointer"
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
