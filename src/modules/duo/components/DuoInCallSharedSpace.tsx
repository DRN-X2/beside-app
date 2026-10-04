import React, { useState, useRef, useEffect } from 'react'
import { Send, Swords, Users, CheckCircle2, XCircle, Award, MessageSquare, Edit3 } from 'lucide-react'
import type { ChatMessage } from '../../../store/sessionStore'
import type { DemoUser } from '../../../types'

interface DuoInCallSharedSpaceProps {
  partner: DemoUser
  currentUser: DemoUser
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  activeView: 'quiz' | 'chat'
  onChangeView: (view: 'quiz' | 'chat') => void
}

export const DuoInCallSharedSpace: React.FC<DuoInCallSharedSpaceProps> = ({
  partner,
  currentUser,
  messages,
  onSendMessage,
  activeView,
  onChangeView,
}) => {
  const [chatInput, setChatInput] = useState('')
  const [quizMode, setQuizMode] = useState<'battle' | 'team'>('team')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeView])

  const sampleQuestion = {
    prompt: 'Which data structure follows the Last-In, First-Out (LIFO) order of elements?',
    options: [
      { key: 'A', text: 'Queue (FIFO sequence)' },
      { key: 'B', text: 'Stack (Push / Pop operations)' },
      { key: 'C', text: 'Binary Search Tree' },
      { key: 'D', text: 'Doubly Linked List' },
    ],
    correct: 'B',
  }

  const handleSelectOption = (key: string) => {
    if (hasAnswered) return
    setSelectedOption(key)
    setHasAnswered(true)

    // Simulate partner response shortly after
    setTimeout(() => {
      setPartnerAnswer('B')
    }, 1200)
  }

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    onSendMessage(chatInput.trim())
    setChatInput('')
  }

  return (
    <div className="w-full h-full flex flex-col clay-card-floating overflow-hidden select-none">
      {/* Top Segmented Header - 3D Clay Switch */}
      <div className="bg-[#F8EFE4] border-b border-[#3D271D]/15 px-3 py-2.5 flex items-center justify-between shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]">
        <div className="flex items-center gap-1.5 p-1 clay-inset">
          <button
            onClick={() => onChangeView('quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeView === 'quiz'
                ? 'clay-btn-primary shadow-md'
                : 'text-[#5D3D2B] hover:text-[#2D1B11]'
            }`}
          >
            Whiteboard & Quiz
          </button>
          <button
            onClick={() => onChangeView('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              activeView === 'chat'
                ? 'clay-btn-primary shadow-md'
                : 'text-[#5D3D2B] hover:text-[#2D1B11]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        </div>

        {/* Battle vs Team Mode Selector when on Quiz */}
        {activeView === 'quiz' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setQuizMode('team')
                setHasAnswered(false)
                setSelectedOption(null)
                setPartnerAnswer(null)
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                quizMode === 'team'
                  ? 'clay-btn-green shadow-md'
                  : 'clay-inset text-[#5D3D2B]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team</span>
            </button>
            <button
              onClick={() => {
                setQuizMode('battle')
                setHasAnswered(false)
                setSelectedOption(null)
                setPartnerAnswer(null)
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                quizMode === 'battle'
                  ? 'clay-btn-red shadow-md'
                  : 'clay-inset text-[#5D3D2B]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Battle</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#FAF4EC]/60 space-y-3">
        {activeView === 'quiz' ? (
          /* Whiteboard & Quiz Component */
          <div className="space-y-3.5">
            {/* Whiteboard Prompt / Banner - Tactile Clay Card */}
            <div className="p-4 clay-card">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#875F49] block mb-1">
                {quizMode === 'battle' ? 'Battle Duel: Fast Finger' : 'Team Cooperative Challenge'}
              </span>
              <h3 className="font-display font-black text-sm text-[#2D1B11] leading-snug">
                {sampleQuestion.prompt}
              </h3>
            </div>

            {/* Multiple Choice Options (A, B, C, D) - 3D Tactile Clay Tiles */}
            <div className="space-y-2.5">
              {sampleQuestion.options.map((opt) => {
                const isSelected = selectedOption === opt.key
                const isCorrect = opt.key === sampleQuestion.correct
                const isPartnerPick = partnerAnswer === opt.key

                let optionClay = 'clay-card hover:translate-y-[-2px] text-[#2D1B11]'
                if (hasAnswered) {
                  if (isSelected && isCorrect) optionClay = 'bg-emerald-100/90 border border-emerald-400 text-emerald-950 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),0_6px_14px_rgba(16,185,129,0.25)]'
                  else if (isSelected && !isCorrect) optionClay = 'bg-rose-100/90 border border-rose-400 text-rose-950 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),0_6px_14px_rgba(239,68,68,0.25)]'
                  else if (isCorrect) optionClay = 'bg-emerald-100/90 border border-emerald-400 text-emerald-950 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),0_6px_14px_rgba(16,185,129,0.25)]'
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full p-3.5 rounded-2xl text-left flex items-center justify-between transition-all duration-200 active:scale-98 cursor-pointer ${optionClay}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl clay-pill font-black text-xs text-[#2D1B11] flex items-center justify-center flex-shrink-0">
                        {opt.key}
                      </span>
                      <span className="text-xs font-bold">{opt.text}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isPartnerPick && (
                        <span className="text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full clay-pill">
                          {partner.display_name.split(' ')[0]} picked
                        </span>
                      )}
                      {hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {hasAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Answer Result Banner */}
            {hasAnswered && (
              <div className="p-3.5 clay-inset text-center animate-slide-up">
                <span className="text-xs font-black text-[#2D1B11] block mb-0.5">
                  {selectedOption === sampleQuestion.correct
                    ? 'Spot on! +100 Study XP earned'
                    : 'Good attempt! Correct answer is B (Stack)'}
                </span>
                <span className="text-[10px] text-[#7A5A46] font-bold">
                  {quizMode === 'battle' ? 'Battle recorded on profile stats' : 'Both teammates scored reward'}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* In-Call Chat View - Clay Chat Bubbles */
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-[#875F49] text-xs font-medium">
                No chat messages yet. Say hello to {partner.display_name}!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] font-black text-[#875F49] px-1 mb-1">
                      {isMe ? 'You' : msg.senderName} ·{' '}
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                        isMe
                          ? 'clay-btn-primary rounded-br-xs text-white'
                          : 'clay-card rounded-bl-xs text-[#2D1B11]'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* In-Call Chat Input Form (Shown when in Chat view) */}
      {activeView === 'chat' && (
        <form onSubmit={handleSendChat} className="p-3 bg-[#FAF2E6] border-t border-[#3D271D]/10 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Send message to call..."
            className="flex-1 clay-inset px-3.5 py-2 text-xs font-medium text-[#2D1B11] focus:outline-none focus:ring-2 focus:ring-[#8C471E]/40"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="w-10 h-10 rounded-2xl clay-btn clay-btn-primary text-white flex items-center justify-center disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}
