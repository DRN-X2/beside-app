import React from 'react'
import { Mic, MicOff, Video, VideoOff, MessageSquare, PhoneOff } from 'lucide-react'

interface MeetBottomBarProps {
  isMuted?: boolean
  isCameraOff?: boolean
  isChatOpen?: boolean
  unreadCount?: number
  onToggleMic: () => void
  onToggleCamera: () => void
  onToggleChat: () => void
  onEndCall: () => void
  className?: string
}

export const MeetBottomBar: React.FC<MeetBottomBarProps> = ({
  isMuted = false,
  isCameraOff = false,
  isChatOpen = false,
  unreadCount = 0,
  onToggleMic,
  onToggleCamera,
  onToggleChat,
  onEndCall,
  className = '',
}) => {
  return (
    <div
      className={`w-full max-w-md mx-auto px-4 py-2.5 bg-white/95 backdrop-blur-md border border-[#E8DACB] rounded-3xl shadow-xl flex items-center justify-between gap-3 select-none ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* 1. Audio / Mic Button */}
        <button
          onClick={onToggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-sm ${
            isMuted
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'bg-[#FAF2E6] text-[#4C271A] hover:bg-[#F3E7D5] border border-[#DFC3A6]/80'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* 2. Camera Button */}
        <button
          onClick={onToggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-sm ${
            isCameraOff
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'bg-[#FAF2E6] text-[#4C271A] hover:bg-[#F3E7D5] border border-[#DFC3A6]/80'
          }`}
          title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5" />}
        </button>

        {/* 3. In-Call Chat / Shared Space Button */}
        <button
          onClick={onToggleChat}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-sm ${
            isChatOpen
              ? 'bg-[#7E4228] text-white hover:bg-[#924D30]'
              : 'bg-[#FAF2E6] text-[#4C271A] hover:bg-[#F3E7D5] border border-[#DFC3A6]/80'
          }`}
          title="Toggle In-Call Chat / Whiteboard"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#C68642] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. End Call Button */}
      <button
        onClick={onEndCall}
        className="flex-1 max-w-[130px] h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md"
        title="Leave call"
      >
        <PhoneOff className="w-5 h-5" />
        <span className="text-xs uppercase tracking-wider">End</span>
      </button>
    </div>
  )
}
