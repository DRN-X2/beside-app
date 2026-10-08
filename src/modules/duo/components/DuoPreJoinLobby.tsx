import React, { useState, useEffect, useRef } from 'react'
import { Video, VideoOff, Mic, MicOff, ArrowLeft, Sparkles, ShieldCheck, AlertCircle, Camera } from 'lucide-react'
import { OtterAvatarWithBadge } from '../../../shared/components/OtterAvatarWithBadge'
import OtterAvatar from '../../../components/OtterAvatar'
import type { DemoUser, SessionDuration } from '../../../types'

interface DuoPreJoinLobbyProps {
  partner: DemoUser
  duration: SessionDuration
  currentUser: DemoUser
  onJoin: (settings: {
    stream: MediaStream | null
    isCameraOff: boolean
    isMuted: boolean
  }) => void
  onBack: () => void
}

export const DuoPreJoinLobby: React.FC<DuoPreJoinLobbyProps> = ({
  partner,
  duration,
  currentUser,
  onJoin,
  onBack,
}) => {
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState<number>(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Request media devices explicitly on mount
  const requestMedia = async () => {
    try {
      setPermissionError(null)
      let stream: MediaStream | null = null

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        })
      } catch (videoErr: any) {
        console.warn('Initial camera error, trying basic constraints:', videoErr)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
        } catch (vErr2) {
          console.warn('Video acquisition error, attempting audio-only fallback:', vErr2)
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            setIsCameraOff(true)
            setPermissionError('Camera is busy or unavailable. Audio is enabled!')
          } catch (audioErr) {
            throw videoErr
          }
        }
      }

      streamRef.current = stream
      setHasPermission(true)

      if (videoRef.current && stream.getVideoTracks().length > 0) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }

      // Audio activity monitor
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 64
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const checkAudio = () => {
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          setAudioLevel(Math.min(100, Math.round(avg * 1.5)))
          animFrameRef.current = requestAnimationFrame(checkAudio)
        }
        checkAudio()
      } catch (e) {
        console.warn('Audio monitor init failed:', e)
      }
    } catch (err: any) {
      console.warn('Media permission denied or unavailable:', err)
      setHasPermission(false)
      const isInsecure = !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      setPermissionError(
        isInsecure
          ? 'Mobile browsers require HTTPS to access camera/mic. Please open the app using https:// or test via your Vercel URL!'
          : err.name === 'NotAllowedError'
          ? 'Camera/microphone access was denied. Please allow permissions in your browser bar.'
          : 'Could not access camera or microphone. Please make sure no other app is using your webcam.'
      )
    }
  }

  // Ensure video element always binds local stream when mounted or permissions change
  useEffect(() => {
    if (videoRef.current && streamRef.current && streamRef.current.getVideoTracks().length > 0) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [hasPermission, isCameraOff])

  useEffect(() => {
    requestMedia()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  // Sync track enablement when toggles are clicked in lobby
  const toggleCamera = () => {
    const next = !isCameraOff
    setIsCameraOff(next)
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !next
      })
      if (!next && videoRef.current) {
        videoRef.current.srcObject = streamRef.current
        videoRef.current.play().catch(() => {})
      }
    }
  }

  const toggleMic = () => {
    const next = !isMuted
    setIsMuted(next)
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !next
      })
    }
  }

  const handleJoinClick = () => {
    onJoin({
      stream: streamRef.current,
      isCameraOff,
      isMuted,
    })
  }

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#FAF2E6] flex flex-col justify-between p-4 max-w-md mx-auto select-none text-[#2D1B11] font-sans">
      {/* Top Bar */}
      <div className="flex items-center gap-3 pt-2 mb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-white border border-[#E8DACB] flex items-center justify-center text-[#2D1B11] hover:bg-[#F5EDE3] transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#875F49] block">
            Duo Lobby
          </span>
          <h1 className="font-display font-black text-xl text-[#2D1B11]">
            Ready to join?
          </h1>
        </div>
      </div>

      {/* Main Content: Video Mirror & Audio Preview */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 justify-center">
        {/* Mirror Camera Card (Google Meet Pre-Call Box) */}
        <div className="relative w-full aspect-[4/3] bg-white border border-[#E8DACB] rounded-3xl overflow-hidden shadow-lg flex items-center justify-center">
          {/* Always mounted video element so srcObject binds synchronously */}
          <div className={`relative w-full h-full bg-[#180D08] ${!isCameraOff && hasPermission ? 'block' : 'hidden'}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Camera Ready</span>
            </div>
          </div>

          {/* Camera Off or Loading State */}
          {(!hasPermission || isCameraOff) && hasPermission !== false && (
            <div className="w-full h-full bg-[#F5EDE3] flex flex-col items-center justify-center p-4">
              <div className="w-24 h-24 rounded-full bg-white p-2 shadow-md border border-[#E8DACB] flex items-center justify-center mb-2">
                <OtterAvatar config={currentUser.otter || currentUser.otter_config} size="md" />
              </div>
              <span className="font-display font-black text-sm text-[#2D1B11]">
                {currentUser.display_name} (You)
              </span>
              <span className="text-[10px] font-bold text-[#875F49] mt-0.5">
                {isCameraOff ? 'Camera is turned off' : 'Starting camera…'}
              </span>
            </div>
          )}

          {/* Permission Prompt Overlay if denied */}
          {hasPermission === false && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-sm text-[#2D1B11] mb-1">
                Camera Access Needed
              </h3>
              <p className="text-[11px] text-[#7A5A46] font-medium mb-3 max-w-xs">
                {permissionError || 'Click below to allow camera & microphone access for this session.'}
              </p>
              <button
                onClick={requestMedia}
                className="px-4 py-2 bg-[#7E4228] hover:bg-[#924D30] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Allow Permissions
              </button>
            </div>
          )}

          {/* Floating In-Preview Controls (Mic & Camera Toggle) */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-20">
            <button
              onClick={toggleMic}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer border ${
                isMuted
                  ? 'bg-rose-600 text-white border-rose-700'
                  : 'bg-white/90 text-[#4C271A] hover:bg-white border-[#DFC3A6]'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleCamera}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer border ${
                isCameraOff
                  ? 'bg-rose-600 text-white border-rose-700'
                  : 'bg-white/90 text-[#4C271A] hover:bg-white border-[#DFC3A6]'
              }`}
              title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5" />}
            </button>
          </div>

          {/* Audio Activity Pill */}
          {!isMuted && hasPermission && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#DFC3A6] flex items-center gap-1.5 shadow-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  audioLevel > 20 ? 'bg-emerald-500 scale-125' : 'bg-emerald-400'
                } transition-transform duration-75`}
              />
              <span className="text-[10px] font-bold text-[#4C271A]">
                {audioLevel > 15 ? 'Speaking' : 'Mic Active'}
              </span>
            </div>
          )}
        </div>

        {/* Study Partner Information Card */}
        <div className="bg-white border border-[#E8DACB] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="drop-shadow-sm flex-shrink-0">
              <OtterAvatarWithBadge
                config={partner.otter || partner.otter_config}
                countryCode={partner.country_code}
                showDegree={false}
                size="md"
                bgCircleColor="clean"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#C68642] block">
                Study Partner
              </span>
              <h3 className="font-display font-black text-sm text-[#2D1B11] truncate">
                {partner.display_name}
              </h3>
              <p className="text-[11px] text-[#7A5A46] font-medium truncate">
                {partner.degree_program || partner.school || 'Fellow Learner'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black bg-[#FAF2E6] border border-[#DFC3A6] text-[#7E4228] px-2 py-0.5 rounded-full">
                {duration} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Section */}
      <div className="pt-4 space-y-2">
        <button
          onClick={handleJoinClick}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-black text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-5 h-5 fill-white" />
          <span>Join Now</span>
        </button>

        <button
          onClick={onBack}
          className="w-full py-2.5 bg-white hover:bg-[#F5EDE3] text-[#7A5A46] font-bold text-xs rounded-2xl border border-[#E8DACB] transition-all cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
