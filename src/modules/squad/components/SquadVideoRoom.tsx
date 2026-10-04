import React, { useState, useEffect, useRef } from 'react'
import { MeetBottomBar } from '../../../shared/components/MeetBottomBar'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import { DraggableObjectivesCard } from '../../duo/components/DraggableObjectivesCard'
import { useAuthStore } from '../../../store/authStore'
import { useConnectionStore } from '../../../store/connectionStore'
import { calculateCompatibility } from '../../../services/compatibility'
import { DEMO_CURRENT_USER } from '../../../data/demoUsers'
import { CheckCircle2, Clock, Users, VideoOff, MicOff, Mic, Sparkles, MessageSquare, Award, Check } from 'lucide-react'
import type { DemoUser, DuoObjective } from '../../../types'

interface SquadVideoRoomProps {
  teamMembers: DemoUser[]
  onEndSession: () => void
}

interface SquadChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
}

export const SquadVideoRoom: React.FC<SquadVideoRoomProps> = ({
  teamMembers,
  onEndSession,
}) => {
  const { profile } = useAuthStore()
  const currentUser = profile || DEMO_CURRENT_USER
  const { addSessionConnection, connections } = useConnectionStore()

  // Session timer (continuous 30-min block)
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [showEndModal, setShowEndModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'video' | 'chat'>('video')

  // Local controls
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)

  // Muted states for peers (simulated interactive audio)
  const [peerMutedState, setPeerMutedState] = useState<Record<string, boolean>>({})

  // Topic and 3 objectives (decided together inside the session)
  const [topic, setTopic] = useState('Group Exam Prep & Problem Solving')
  const [objectives, setObjectives] = useState<DuoObjective[]>([
    { id: 'sq-1', text: 'Clarify difficult concepts as a team', completed: false },
    { id: 'sq-2', text: 'Solve 3 group challenge questions', completed: false },
    { id: 'sq-3', text: 'Summary review & key takeaways', completed: false },
  ])

  // In-call chat messages
  const [messages, setMessages] = useState<SquadChatMessage[]>([
    {
      id: 'sq-init',
      senderId: teamMembers[1]?.id || 'peer',
      senderName: teamMembers[1]?.display_name || 'Study Mate',
      content: 'Hey squad! Everyone ready to dive in?',
      timestamp: new Date(),
    },
  ])
  const [inputMsg, setInputMsg] = useState('')

  // 1-second continuous session clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowEndModal(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleObjective = (id: string) => {
    setObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, completed: !o.completed } : o))
    )
  }

  const addObjective = (text: string) => {
    if (objectives.length >= 3) return
    setObjectives((prev) => [...prev, { id: `sq-${Date.now()}`, text, completed: false }])
  }

  const removeObjective = (id: string) => {
    setObjectives((prev) => prev.filter((o) => o.id !== id))
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim()) return
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: currentUser.id,
        senderName: currentUser.display_name,
        content: inputMsg.trim(),
        timestamp: new Date(),
      },
    ])
    setInputMsg('')
  }

  // Format time MM:SS
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const completedGoalsCount = objectives.filter((o) => o.completed).length

  // Squad layout calculation based on participant count (3, 4, or 5)
  const participantCount = teamMembers.length
  const gridLayoutClass =
    participantCount === 3
      ? 'grid grid-cols-2 gap-2' // 2 on top, 1 centered bottom
      : participantCount === 4
      ? 'grid grid-cols-2 gap-2' // 2x2 grid
      : 'grid grid-cols-2 gap-2' // 5 participants (2 top, 2 middle, 1 bottom)

  return (
    <div className="fixed inset-0 z-50 bg-[#170E08] flex flex-col justify-between p-3 max-w-md mx-auto select-none overflow-hidden text-white font-sans">
      {/* Top Session Status Bar - Clay Pill Dock */}
      <div className="flex items-center justify-between px-4 py-2 z-30 clay-dock mb-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-[#FAF2E6]">
            Squad Session
          </span>
          <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
            <Users className="w-3 h-3" /> {participantCount}/5
          </span>
        </div>

        {/* Real-Time Continuous Clock - 3D Clay Inset */}
        <div className="flex items-center gap-1.5 bg-[#FAF2E6] text-[#2D1B11] px-3 py-1 rounded-full text-xs font-black clay-pill">
          <Clock className="w-3.5 h-3.5 text-[#8B4513]" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Root-Level Draggable & Dockable Objectives Card - Assigned inside session */}
      {activeTab === 'video' && (
        <DraggableObjectivesCard
          topic={topic}
          onUpdateTopic={setTopic}
          objectives={objectives}
          onToggleObjective={toggleObjective}
          onAddObjective={addObjective}
          onRemoveObjective={removeObjective}
        />
      )}

      {/* Main Viewport: Multi-Participant Video Grid OR In-Call Group Chat */}
      <div className="relative flex-1 w-full flex flex-col min-h-0 overflow-y-auto no-scrollbar py-1">
        {activeTab === 'video' ? (
          <div className={`w-full h-full ${gridLayoutClass} auto-rows-fr`}>
            {teamMembers.map((member, idx) => {
              const isLocalUser = member.id === currentUser.id
              const isMute = isLocalUser ? isMuted : !!peerMutedState[member.id]
              const isCamOff = isLocalUser ? isCameraOff : idx === 2 // give variety

              // If 3 or 5 participants, center the last odd element
              const isLastOdd =
                (participantCount === 3 && idx === 2) ||
                (participantCount === 5 && idx === 4)

              return (
                <div
                  key={member.id}
                  className={`relative clay-card-dark rounded-2xl overflow-hidden flex flex-col items-center justify-center p-2 min-h-[140px] border border-white/10 ${
                    isLastOdd ? 'col-span-2 mx-auto w-full max-w-[240px]' : ''
                  }`}
                >
                  {isCamOff ? (
                    /* Camera Off: Big centered Otter avatar, NO BSCS note, NO thick borders */
                    <div className="flex flex-col items-center justify-center animate-fade-in">
                      <div className="drop-shadow-lg mb-1">
                        <OtterAvatarWithBadge
                          config={member.otter}
                          countryCode={member.country_code}
                          showDegree={false}
                          size="md"
                          bgCircleColor="clean"
                        />
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-[#A8826D] bg-[#1A110B]/80 px-2 py-0.5 rounded-full border border-white/10">
                        <VideoOff className="w-2.5 h-2.5" />
                        <span>Camera Off</span>
                      </div>
                    </div>
                  ) : (
                    /* Video Stream Tile */
                    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#2A1810] to-[#1A0E08] rounded-xl overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_40%,rgba(255,220,180,0.3),transparent_70%)]" />
                      {/* Corner Mini Avatar */}
                      <div className="relative z-10 scale-90 drop-shadow-md">
                        <OtterAvatarWithBadge
                          config={member.otter}
                          countryCode={member.country_code}
                          showDegree={false}
                          size="sm"
                          bgCircleColor="clean"
                        />
                      </div>
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Live</span>
                      </div>
                    </div>
                  )}

                  {/* Name Label & Country Flag */}
                  <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10">
                    <span className="text-[10px] font-black text-[#FAF2E6] truncate max-w-[80px]">
                      {isLocalUser ? `${member.display_name.split(' ')[0]} (You)` : member.display_name.split(' ')[0]}
                    </span>
                  </div>

                  {/* Audio Status Orb (mute / unmute indicator) */}
                  <div className="absolute bottom-2 right-2 z-20">
                    <button
                      onClick={() => {
                        if (!isLocalUser) {
                          setPeerMutedState((prev) => ({
                            ...prev,
                            [member.id]: !prev[member.id],
                          }))
                        }
                      }}
                      className={`w-6 h-6 rounded-full clay-btn flex items-center justify-center shadow-md transition-all ${
                        isMute ? 'clay-btn-red text-white' : 'clay-btn-circle-dark text-emerald-400'
                      }`}
                      title={isMute ? 'Muted' : 'Speaking'}
                    >
                      {isMute ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* In-Call Group Chat */
          <div className="w-full h-full flex flex-col justify-between clay-card-floating p-3 text-[#2D1B11]">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#875F49] block text-center pb-1 border-b border-[#DFC3A6]">
                Squad Live Chat · {participantCount} Members
              </span>
              {messages.map((m) => {
                const isMe = m.senderId === currentUser.id
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[9px] font-black text-[#875F49] mb-0.5 px-1">
                      {isMe ? 'You' : m.senderName}
                    </span>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-semibold shadow-sm leading-relaxed ${
                        isMe
                          ? 'clay-btn-primary text-white rounded-br-sm'
                          : 'clay-pill bg-[#FAF2E6] text-[#2D1B11] border border-[#DFC3A6] rounded-bl-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Message your squad..."
                className="flex-1 clay-inset px-3 py-2 text-xs font-black text-[#2D1B11] focus:outline-none placeholder:text-[#A8826D]"
              />
              <button
                type="submit"
                className="clay-btn clay-btn-primary px-4 py-2 rounded-xl text-xs font-black text-white shadow-md"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="pt-2 z-30">
        <MeetBottomBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isChatOpen={activeTab === 'chat'}
          unreadCount={messages.length}
          onToggleMic={() => setIsMuted((m) => !m)}
          onToggleCamera={() => setIsCameraOff((c) => !c)}
          onToggleChat={() => setActiveTab((t) => (t === 'video' ? 'chat' : 'video'))}
          onEndCall={() => setShowEndModal(true)}
        />
      </div>

      {/* End Squad Session Summary & Post-Session Connection Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm clay-card-floating p-5 shadow-2xl text-center text-[#2D1B11] animate-slide-up">
            <div className="w-14 h-14 rounded-full clay-btn-green flex items-center justify-center mx-auto mb-2 text-white shadow-lg">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>

            <h3 className="font-display font-black text-xl mb-1 text-[#2D1B11]">
              Squad Session Summary
            </h3>
            <p className="text-xs text-[#7A5A46] font-medium mb-3">
              Topic: <span className="font-black text-[#2D1B11]">"{topic}"</span>
            </p>

            {/* Goals Metric */}
            <div className="clay-inset p-3 mb-3 text-xs text-left">
              <div className="flex justify-between font-bold text-[#2D1B11] mb-1">
                <span>Completed Team Goals</span>
                <span className="font-black">{completedGoalsCount} of 3</span>
              </div>
              <div className="w-full bg-[#D8C7B5] rounded-full h-2 overflow-hidden mb-2 shadow-inner">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all shadow-md"
                  style={{ width: `${(completedGoalsCount / 3) * 100}%` }}
                />
              </div>
              <div className="space-y-1">
                {objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center gap-1.5 text-[10px]">
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

            {/* Post-Session Buddy Connection: Connect after studying! */}
            <div className="clay-card p-3 mb-3 text-xs border border-[#DFC3A6]">
              <span className="text-[10px] font-black uppercase text-[#875F49] block mb-1">
                Study Buddy Connection
              </span>
              <p className="text-[11px] text-[#2D1B11] font-semibold">
                You studied with <strong className="font-black">{participantCount} squad mates</strong>! Would you like to connect as study buddies for future squad sessions?
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  // Connect with peers who are in the session
                  teamMembers
                    .filter((m) => m.id !== currentUser.id)
                    .forEach((peer) => {
                      const compat = calculateCompatibility(currentUser, peer)
                      addSessionConnection(peer, compat, 30, completedGoalsCount)
                    })
                  setShowEndModal(false)
                  onEndSession()
                }}
                className="w-full py-3 clay-btn clay-btn-green font-black text-xs text-white shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Connect with Squad & Exit</span>
              </button>

              <button
                onClick={() => {
                  setShowEndModal(false)
                  onEndSession()
                }}
                className="w-full py-2 clay-btn clay-btn-red font-black text-xs text-white"
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
