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
      className={`w-full max-w-md mx-auto px-4 py-3 clay-dock flex items-center justify-between gap-3 select-none ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* 1. Audio / Mic Button - 3D Clay Orb */}
        <button
          onClick={onToggleMic}
          className={`w-12 h-12 rounded-full clay-btn flex items-center justify-center transition-all duration-200 ${
            isMuted
              ? 'clay-btn-red'
              : 'clay-btn-circle-dark text-emerald-400 hover:text-emerald-300'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* 2. Camera Button - 3D Clay Orb */}
        <button
          onClick={onToggleCamera}
          className={`w-12 h-12 rounded-full clay-btn flex items-center justify-center transition-all duration-200 ${
            isCameraOff
              ? 'clay-btn-red'
              : 'clay-btn-circle-dark text-white hover:text-amber-200'
          }`}
          title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5" />}
        </button>

        {/* 3. In-Call Chat / Shared Space Button - 3D Clay Orb */}
        <button
          onClick={onToggleChat}
          className={`relative w-12 h-12 rounded-full clay-btn flex items-center justify-center transition-all duration-200 ${
            isChatOpen
              ? 'clay-btn-amber'
              : 'clay-btn-circle-dark text-white hover:text-amber-200'
          }`}
          title="Toggle In-Call Chat / Whiteboard"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-[#1E120B] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center clay-pill border border-[#2F1E16]">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. Red End Call Tactile Clay Pill Button */}
      <button
        onClick={onEndCall}
        className="flex-1 max-w-[130px] h-12 rounded-2xl clay-btn clay-btn-red font-black flex items-center justify-center gap-2"
        title="Leave call"
      >
        <PhoneOff className="w-5 h-5" />
        <span className="text-xs uppercase tracking-wider">End</span>
      </button>
    </div>
  )
}
