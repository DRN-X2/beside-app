import { supabase } from '../lib/supabase'

export interface WebRTCConfig {
  channelId?: string
  sessionId?: string
  userId: string
  peerId: string
  localStream: MediaStream | null
  onRemoteStream: (stream: MediaStream) => void
  onPeerLeft?: () => void
  onPeerActive?: () => void
  onMediaStateChange?: (state: { isCameraOff: boolean; isMuted: boolean }) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onIceStateChange?: (state: RTCIceConnectionState) => void
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' },
  ],
}

export class WebRTCConnection {
  private pc: RTCPeerConnection | null = null
  private channel: ReturnType<typeof supabase.channel> | null = null
  private config: WebRTCConfig
  private isDestroyed = false
  private isPolite: boolean
  private makingOffer = false
  private ignoreOffer = false
  private isSettingRemoteAnswerPending = false
  private pingInterval: number | null = null
  private remoteStream: MediaStream = new MediaStream()
  private pendingCandidates: RTCIceCandidateInit[] = []
  private outgoingQueue: Array<{ event: string; payload: any }> = []
  private isChannelSubscribed = false

  constructor(config: WebRTCConfig) {
    this.config = config
    // The peer with the alphabetically larger ID is "polite" (yields on collision)
    this.isPolite = this.config.userId > this.config.peerId
    console.log(`[WebRTC] Initialized. User: ${config.userId.slice(0, 8)} Peer: ${config.peerId.slice(0, 8)} Polite: ${this.isPolite}`)
    this.init()
  }

  private async init() {
    try {
      this.pc = new RTCPeerConnection(ICE_SERVERS)

      // Add local tracks if stream is already available
      if (this.config.localStream) {
        this.config.localStream.getTracks().forEach((track) => {
          if (this.pc && this.config.localStream) {
            console.log(`[WebRTC] Added initial track: ${track.kind}`)
            this.pc.addTrack(track, this.config.localStream)
          }
        })
      }

      // Ensure transceivers exist for both audio and video even if hardware tracks are not ready
      const existingKinds = this.pc.getTransceivers().map((t) => t.receiver?.track?.kind || t.sender?.track?.kind)
      if (!existingKinds.includes('audio')) {
        this.pc.addTransceiver('audio', { direction: 'sendrecv' })
      }
      if (!existingKinds.includes('video')) {
        this.pc.addTransceiver('video', { direction: 'sendrecv' })
      }

      // Handle receiving remote tracks
      this.pc.ontrack = (event) => {
        console.log(`[WebRTC] ontrack fired! Track: ${event.track?.kind}`)
        if (event.streams && event.streams[0]) {
          this.config.onRemoteStream(event.streams[0])
        } else if (event.track) {
          this.remoteStream.addTrack(event.track)
          // Clone stream wrapper so React state detection triggers a proper re-render
          const activeStream = new MediaStream(this.remoteStream.getTracks())
          this.config.onRemoteStream(activeStream)
        }
        if (this.config.onPeerActive) {
          this.config.onPeerActive()
        }
      }

      // Handle ICE candidates
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`[WebRTC] Generated ICE candidate: ${event.candidate.protocol} ${event.candidate.type}`)
          this.broadcastOrQueue('webrtc_candidate', {
            senderId: this.config.userId,
            candidate: event.candidate.toJSON(),
          })
        }
      }

      // Standard Perfect Negotiation onnegotiationneeded
      this.pc.onnegotiationneeded = async () => {
        if (!this.pc || this.isDestroyed || this.pc.signalingState !== 'stable') return
        try {
          this.makingOffer = true
          console.log('[WebRTC] onnegotiationneeded creating offer...')
          const offer = await this.pc.createOffer()
          if (this.pc.signalingState !== 'stable') return
          await this.pc.setLocalDescription(offer)
          this.broadcastOrQueue('webrtc_offer', {
            senderId: this.config.userId,
            offer: { type: offer.type, sdp: offer.sdp },
          })
        } catch (err) {
          console.warn('[WebRTC] onnegotiationneeded error:', err)
        } finally {
          this.makingOffer = false
        }
      }

      this.pc.onconnectionstatechange = () => {
        if (!this.pc) return
        const state = this.pc.connectionState
        console.log(`[WebRTC] Connection state: ${state}`)
        if (this.config.onConnectionStateChange) {
          this.config.onConnectionStateChange(state)
        }
        if (state === 'connected') {
          if (this.config.onPeerActive) {
            this.config.onPeerActive()
          }
        }
      }

      this.pc.oniceconnectionstatechange = () => {
        if (!this.pc) return
        const iceState = this.pc.iceConnectionState
        console.log(`[WebRTC] ICE Connection state: ${iceState}`)
        if (this.config.onIceStateChange) {
          this.config.onIceStateChange(iceState)
        }
        if (iceState === 'connected' || iceState === 'completed') {
          if (this.config.onPeerActive) {
            this.config.onPeerActive()
          }
        }
      }

      // Signaling channel via Supabase Realtime with normalized compact room ID
      const resolvedChannelId = this.config.channelId || this.config.sessionId || 'call_room'
      const channelName = `p2p_${resolvedChannelId}`
      this.channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      })

      this.channel
        .on('broadcast', { event: 'webrtc_hello' }, async ({ payload }) => {
          if (this.isDestroyed || payload?.senderId !== this.config.peerId) return
          if (this.config.onPeerActive) {
            this.config.onPeerActive()
          }
          // Respond with a hello so the other peer knows we are also here
          this.broadcastOrQueue('webrtc_ping', { senderId: this.config.userId })
          if (!this.isPolite && this.pc && this.pc.connectionState !== 'connected') {
            this.negotiate()
          }
        })
        .on('broadcast', { event: 'webrtc_ping' }, async ({ payload }) => {
          if (this.isDestroyed || payload?.senderId !== this.config.peerId) return
          if (this.config.onPeerActive) {
            this.config.onPeerActive()
          }
          if (!this.isPolite && this.pc && this.pc.connectionState !== 'connected') {
            this.negotiate()
          }
        })
        .on('broadcast', { event: 'webrtc_offer' }, async ({ payload }) => {
          if (this.isDestroyed || payload?.senderId !== this.config.peerId) return
          if (this.config.onPeerActive) {
            this.config.onPeerActive()
          }
          await this.handleOffer(payload.offer)
        })
        .on('broadcast', { event: 'webrtc_answer' }, async ({ payload }) => {
          if (this.isDestroyed || payload?.senderId !== this.config.peerId) return
          if (this.config.onPeerActive) {
            this.config.onPeerActive()
          }
          await this.handleAnswer(payload.answer)
        })
        .on('broadcast', { event: 'webrtc_candidate' }, async ({ payload }) => {
          if (this.isDestroyed || payload?.senderId !== this.config.peerId) return
          await this.handleCandidate(payload.candidate)
        })
        .on('broadcast', { event: 'webrtc_media_state' }, ({ payload }) => {
          if (this.isDestroyed || payload?.senderId !== this.config.peerId) return
          if (this.config.onMediaStateChange) {
            this.config.onMediaStateChange({
              isCameraOff: !!payload.isCameraOff,
              isMuted: !!payload.isMuted,
            })
          }
        })
        .on('broadcast', { event: 'webrtc_leave' }, ({ payload }) => {
          if (payload?.senderId === this.config.peerId) {
            if (this.config.onPeerLeft) this.config.onPeerLeft()
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isChannelSubscribed = true

            // Flush any queued signaling packets
            this.flushOutgoingQueue()

            // Announce presence immediately
            this.broadcastOrQueue('webrtc_hello', { senderId: this.config.userId })

            // Ping periodically until connected
            this.pingInterval = window.setInterval(() => {
              if (this.pc?.connectionState === 'connected') {
                return
              }
              this.broadcastOrQueue('webrtc_ping', { senderId: this.config.userId })
            }, 3000)
          }
        })
    } catch (err) {
      console.error('[WebRTC] Init failed:', err)
    }
  }

  private broadcastOrQueue(event: string, payload: any) {
    if (this.isDestroyed || !this.channel) return
    if (!this.isChannelSubscribed) {
      this.outgoingQueue.push({ event, payload })
      return
    }
    this.channel.send({
      type: 'broadcast',
      event,
      payload,
    }).catch(() => {})
  }

  private flushOutgoingQueue() {
    if (!this.channel || !this.isChannelSubscribed) return
    while (this.outgoingQueue.length > 0) {
      const item = this.outgoingQueue.shift()
      if (item) {
        this.channel.send({
          type: 'broadcast',
          event: item.event,
          payload: item.payload,
        }).catch(() => {})
      }
    }
  }

  public async negotiate() {
    if (!this.pc || this.isDestroyed || this.makingOffer) return
    try {
      this.makingOffer = true
      const offer = await this.pc.createOffer()
      if (this.pc.signalingState !== 'stable') return

      await this.pc.setLocalDescription(offer)

      this.broadcastOrQueue('webrtc_offer', {
        senderId: this.config.userId,
        offer: { type: offer.type, sdp: offer.sdp },
      })
    } catch (err) {
      console.warn('[WebRTC] Manual negotiation offer error:', err)
    } finally {
      this.makingOffer = false
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.pc || this.isDestroyed) return
    try {
      const readyForOffer =
        !this.makingOffer &&
        (this.pc.signalingState === 'stable' || this.isSettingRemoteAnswerPending)
      const offerCollision = !readyForOffer

      this.ignoreOffer = !this.isPolite && offerCollision
      if (this.ignoreOffer) {
        return
      }

      this.isSettingRemoteAnswerPending = false
      if (offerCollision) {
        await Promise.all([
          this.pc.setLocalDescription({ type: 'rollback' }),
          this.pc.setRemoteDescription(new RTCSessionDescription(offer)),
        ])
      } else {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
      }

      // Flush any queued remote ICE candidates
      await this.flushPendingCandidates()

      const answer = await this.pc.createAnswer()
      await this.pc.setLocalDescription(answer)

      this.broadcastOrQueue('webrtc_answer', {
        senderId: this.config.userId,
        answer: { type: answer.type, sdp: answer.sdp },
      })
    } catch (err) {
      console.error('[WebRTC] Handle offer error:', err)
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.pc || this.isDestroyed) return
    try {
      this.isSettingRemoteAnswerPending = true
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
      this.isSettingRemoteAnswerPending = false
      await this.flushPendingCandidates()
    } catch (err) {
      console.error('[WebRTC] Handle answer error:', err)
    }
  }

  private async handleCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc || this.isDestroyed) return
    try {
      if (!this.pc.remoteDescription || !this.pc.remoteDescription.type) {
        // Queue candidate until remote description is set
        this.pendingCandidates.push(candidate)
        return
      }
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      if (!this.ignoreOffer) {
        console.warn('[WebRTC] Add candidate error:', err)
      }
    }
  }

  private async flushPendingCandidates() {
    if (!this.pc || !this.pc.remoteDescription) return
    while (this.pendingCandidates.length > 0) {
      const candidate = this.pendingCandidates.shift()
      if (candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.warn('[WebRTC] Error flushing candidate:', err)
        }
      }
    }
  }

  public sendMediaState(isCameraOff: boolean, isMuted: boolean) {
    this.broadcastOrQueue('webrtc_media_state', {
      senderId: this.config.userId,
      isCameraOff,
      isMuted,
    })
  }

  public updateLocalStream(newStream: MediaStream) {
    if (!this.pc || this.isDestroyed) return
    try {
      this.config.localStream = newStream
      const senders = this.pc.getSenders()

      newStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind)
        if (sender) {
          sender.replaceTrack(track)
        } else if (this.pc) {
          this.pc.addTrack(track, newStream)
        }
      })
    } catch (err) {
      console.warn('[WebRTC] Update local stream error:', err)
    }
  }

  public destroy() {
    this.isDestroyed = true
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'webrtc_leave',
        payload: { senderId: this.config.userId },
      }).catch(() => {})
      supabase.removeChannel(this.channel)
      this.channel = null
    }
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }
  }
}
