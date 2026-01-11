import Peer, { MediaConnection } from 'peerjs';
import { buildWebSocketUrl } from './apiConfig';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CallInfo {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  recipientId: string;
  recipientName?: string;
  startTime?: Date;
}

export interface VideoCallEventHandlers {
  onIncomingCall?: (callInfo: CallInfo) => void;
  onCallAccepted?: (callInfo: CallInfo) => void;
  onCallDeclined?: (callInfo: CallInfo) => void;
  onCallEnded?: (callInfo: CallInfo) => void;
  onCallFailed?: (error: string) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onCallStateChange?: (state: CallState) => void;
}

class VideoCallService {
  private peer: Peer | null = null;
  private ws: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCall: MediaConnection | null = null;
  private currentCallInfo: CallInfo | null = null;
  private userId: string | null = null;
  private callState: CallState = 'idle';
  private handlers: VideoCallEventHandlers = {};
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private callTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  initialize(userId: string, handlers: VideoCallEventHandlers = {}) {
    if (this.isInitialized && this.userId === userId) {
      return;
    }

    this.userId = userId;
    this.handlers = handlers;
    this.setupPeer();
    this.setupWebSocket();
    this.isInitialized = true;
  }

  private setupPeer() {
    if (!this.userId) return;

    this.peer = new Peer(this.userId, {
      debug: 2,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:freestun.net:3478',
            username: 'free',
            credential: 'free'
          }
        ],
        iceCandidatePoolSize: 10
      }
    });

    this.peer.on('open', (id) => {
      console.log('📞 PeerJS connected with ID:', id);
    });

    this.peer.on('call', async (call) => {
      console.log('📞 Incoming PeerJS call from:', call.peer);
      this.currentCall = call;
      
      call.on('stream', (remoteStream) => {
        console.log('📞 Received remote stream');
        this.remoteStream = remoteStream;
        this.handlers.onRemoteStream?.(remoteStream);
      });

      call.on('close', () => {
        console.log('📞 Call closed');
        this.endCall();
      });

      call.on('error', (error) => {
        console.error('📞 Call error:', error);
        this.handlers.onCallFailed?.(error.message);
        this.endCall();
      });

      // If we already accepted (call state is 'connected'), answer immediately
      if (this.callState === 'connected' && this.localStream) {
        console.log('📞 Auto-answering PeerJS call (already accepted via signaling)');
        call.answer(this.localStream);
      }
    });

    this.peer.on('error', (error) => {
      console.error('📞 PeerJS error:', error);
      if (error.type === 'peer-unavailable') {
        this.handlers.onCallFailed?.('User is not available');
        this.setCallState('ended');
      }
    });

    this.peer.on('disconnected', () => {
      console.log('📞 PeerJS disconnected, attempting reconnect...');
      setTimeout(() => {
        if (this.peer && !this.peer.destroyed) {
          this.peer.reconnect();
        }
      }, 3000);
    });
  }

  private setupWebSocket() {
    const wsUrl = buildWebSocketUrl('/ws');
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('📞 Video call WebSocket connected');
        if (this.userId) {
          this.ws?.send(JSON.stringify({
            type: 'join-call-signaling',
            userId: this.userId
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('📞 Video call WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('📞 Video call WebSocket closed');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'call-invite':
        console.log('📞 Received call invite:', message);
        this.handleIncomingCall(message);
        break;
      
      case 'call-response':
        console.log('📞 Received call response:', message);
        if (message.response === 'accept') {
          this.handlers.onCallAccepted?.(this.currentCallInfo!);
          this.startPeerCall(message.userId);
        } else if (message.response === 'decline') {
          this.handlers.onCallDeclined?.(this.currentCallInfo!);
          this.setCallState('ended');
          this.clearCallTimeout();
        }
        break;
      
      case 'call-ended':
        console.log('📞 Call ended by remote');
        this.handlers.onCallEnded?.(this.currentCallInfo!);
        this.cleanup();
        break;
    }
  }

  private handleIncomingCall(message: any) {
    const callInfo: CallInfo = {
      callId: message.callId,
      callerId: message.from,
      callerName: message.callerName || 'Unknown',
      callerAvatar: message.callerAvatar,
      recipientId: this.userId!,
    };
    
    this.currentCallInfo = callInfo;
    this.setCallState('ringing');
    this.handlers.onIncomingCall?.(callInfo);
  }

  private attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      if (this.userId) {
        this.setupWebSocket();
      }
    }, 3000);
  }

  private setCallState(state: CallState) {
    this.callState = state;
    this.handlers.onCallStateChange?.(state);
  }

  private clearCallTimeout() {
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }
  }

  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      this.handlers.onLocalStream?.(this.localStream);
      return this.localStream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      throw new Error(error.message || 'Failed to access camera/microphone');
    }
  }

  async initiateCall(recipientId: string, recipientName: string, callerName: string, callerAvatar?: string): Promise<void> {
    if (this.callState !== 'idle') {
      throw new Error('Already in a call');
    }

    // Check WebSocket is connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('📞 WebSocket not connected, attempting reconnect...');
      this.setupWebSocket();
      // Wait a bit for connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        throw new Error('Unable to connect. Please try again.');
      }
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentCallInfo = {
      callId,
      callerId: this.userId!,
      callerName,
      callerAvatar,
      recipientId,
      recipientName,
    };

    this.setCallState('calling');

    try {
      await this.getLocalStream();
    } catch (error: any) {
      this.setCallState('idle');
      throw error;
    }

    console.log('📞 Sending video-call-invite to:', recipientId);
    this.ws.send(JSON.stringify({
      type: 'video-call-invite',
      callId,
      userId: this.userId,
      invitedUsers: [recipientId],
      callerName,
      callerAvatar,
    }));

    this.callTimeout = setTimeout(() => {
      if (this.callState === 'calling') {
        this.handlers.onCallFailed?.('No answer');
        this.endCall();
      }
    }, 30000);
  }

  async acceptCall(): Promise<void> {
    if (this.callState !== 'ringing' || !this.currentCallInfo) {
      throw new Error('No incoming call to accept');
    }

    try {
      const stream = await this.getLocalStream();
      
      this.ws?.send(JSON.stringify({
        type: 'video-call-response',
        callId: this.currentCallInfo.callId,
        userId: this.userId,
        response: 'accept',
        targetUserId: this.currentCallInfo.callerId,
      }));

      if (this.currentCall) {
        this.currentCall.answer(stream);
      }

      this.setCallState('connected');
      this.currentCallInfo.startTime = new Date();
    } catch (error: any) {
      this.handlers.onCallFailed?.(error.message);
      this.endCall();
    }
  }

  declineCall(): void {
    if (this.callState !== 'ringing' || !this.currentCallInfo) {
      return;
    }

    this.ws?.send(JSON.stringify({
      type: 'video-call-response',
      callId: this.currentCallInfo.callId,
      userId: this.userId,
      response: 'decline',
      targetUserId: this.currentCallInfo.callerId,
    }));

    this.cleanup();
  }

  private async startPeerCall(targetUserId: string): Promise<void> {
    if (!this.peer || !this.localStream) {
      this.handlers.onCallFailed?.('Connection not ready');
      return;
    }

    try {
      console.log('📞 Starting PeerJS call to:', targetUserId);
      this.currentCall = this.peer.call(targetUserId, this.localStream);
      
      this.currentCall.on('stream', (remoteStream) => {
        console.log('📞 Received remote stream');
        this.remoteStream = remoteStream;
        this.handlers.onRemoteStream?.(remoteStream);
      });

      this.currentCall.on('close', () => {
        console.log('📞 Call closed');
        this.endCall();
      });

      this.currentCall.on('error', (error) => {
        console.error('📞 Call error:', error);
        this.handlers.onCallFailed?.(error.message);
        this.endCall();
      });

      this.setCallState('connected');
      this.currentCallInfo!.startTime = new Date();
      this.clearCallTimeout();
    } catch (error: any) {
      console.error('📞 Error starting call:', error);
      this.handlers.onCallFailed?.(error.message);
      this.endCall();
    }
  }

  endCall(): void {
    if (this.currentCallInfo && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'call-ended',
        callId: this.currentCallInfo.callId,
        userId: this.userId,
        targetUserId: this.currentCallInfo.callerId === this.userId 
          ? this.currentCallInfo.recipientId 
          : this.currentCallInfo.callerId,
      }));
    }

    this.handlers.onCallEnded?.(this.currentCallInfo!);
    this.cleanup();
  }

  private cleanup(): void {
    this.clearCallTimeout();

    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.currentCallInfo = null;
    this.setCallState('idle');
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  switchCamera(): void {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const currentFacingMode = (videoTrack.getSettings() as any).facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacingMode },
      audio: false
    }).then(newStream => {
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      if (this.currentCall) {
        const sender = (this.currentCall as any).peerConnection
          ?.getSenders()
          ?.find((s: RTCRtpSender) => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }

      videoTrack.stop();
      this.localStream!.removeTrack(videoTrack);
      this.localStream!.addTrack(newVideoTrack);
      this.handlers.onLocalStream?.(this.localStream!);
    }).catch(error => {
      console.error('Error switching camera:', error);
    });
  }

  getCallState(): CallState {
    return this.callState;
  }

  getCurrentCallInfo(): CallInfo | null {
    return this.currentCallInfo;
  }

  getLocalStreamRef(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStreamRef(): MediaStream | null {
    return this.remoteStream;
  }

  destroy(): void {
    this.cleanup();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.isInitialized = false;
  }
}

export const videoCallService = new VideoCallService();
