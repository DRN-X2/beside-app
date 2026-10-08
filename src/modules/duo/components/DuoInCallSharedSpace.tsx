import React, { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import type { ChatMessage } from '../../../store/sessionStore'
import type { DemoUser } from '../../../types'

interface DuoInCallSharedSpaceProps {
  partner: DemoUser
  currentUser: DemoUser
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  activeView?: 'chat'
  onChangeView?: (view: 'chat') => void
}

export const DuoInCallSharedSpace: React.FC<DuoInCallSharedSpaceProps> = ({
  partner,
  currentUser,
  messages,
  onSendMessage,
}) => {
  const [chatInput, setChatInput] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    onSendMessage(chatInput.trim())
    setChatInput('')
  }

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden select-none">
      {/* Top Header - Clean In-Call Chat title */}
      <div className="bg-[#FAF2E6] border-b border-[#DFC3A6] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#7E4228] text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-[#2D1B11] leading-tight">
              In-Call Chat
            </h3>
            <p className="text-[11px] text-[#7A5A46] font-medium">
              Study discussion with {partner.display_name.split(' ')[0]}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-[#7E4228] bg-white px-2.5 py-1 rounded-full border border-[#DFC3A6] shadow-xs">
          {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
        </span>
      </div>

      {/* Message List Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#FCFAF7] space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#875F49]">
            <div className="w-12 h-12 rounded-full bg-[#FAF2E6] border border-[#DFC3A6] flex items-center justify-center mb-2 text-[#7E4228]">
              <MessageSquare className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-xs font-semibold text-[#2D1B11]">No messages yet</p>
            <p className="text-[11px] text-[#7A5A46] mt-0.5">
              Say hello or share notes with {partner.display_name.split(' ')[0]}!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] font-bold text-[#875F49] px-1 mb-0.5">
                  {isMe ? 'You' : msg.senderName} ·{' '}
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-[#7E4228] text-white rounded-br-xs'
                      : 'bg-white text-[#2D1B11] border border-[#DFC3A6] rounded-bl-xs'
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

      {/* Message Input Box */}
      <form
        onSubmit={handleSendChat}
        className="p-3 bg-[#FAF2E6] border-t border-[#DFC3A6] flex items-center gap-2"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Send message to call..."
          className="flex-1 bg-white border border-[#DFC3A6] rounded-2xl px-3.5 py-2 text-xs font-medium text-[#2D1B11] placeholder-[#875F49]/70 focus:outline-none focus:ring-2 focus:ring-[#7E4228]/40 shadow-xs"
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="w-9 h-9 rounded-2xl bg-[#7E4228] hover:bg-[#924D30] text-white flex items-center justify-center disabled:opacity-40 transition-all active:scale-95 cursor-pointer shadow-xs"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
