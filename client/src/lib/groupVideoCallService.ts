import Peer, { MediaConnection } from 'peerjs';
import { buildWebSocketUrl } from './apiConfig';

export type GroupCallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface GroupCallParticipant {
  id: string;
  name: string;
  avatar?: string;
  stream?: MediaStream;
  connection?: MediaConnection;
  status: 'pending' | 'ringing' | 'connected' | 'declined' | 'left';
}

export interface GroupCallInfo {
  callId: string;
  initiatorId: string;
  initiatorName: string;
  initiatorAvatar?: string;
  groupId?: string;
  groupName?: string;
  participants: Map<string, GroupCallParticipant>;
  startTime?: Date;
}

export interface GroupVideoCallEventHandlers {
  onIncomingGroupCall?: (callInfo: GroupCallInfo) => void;
  onParticipantJoined?: (participant: GroupCallParticipant) => void;
  onParticipantLeft?: (participantId: string) => void;
  onParticipantStream?: (participantId: string, stream: MediaStream) => void;
  onCallStateChange?: (state: GroupCallState) => void;
  onCallEnded?: () => void;
  onCallFailed?: (error: string) => void;
  onLocalStream?: (stream: MediaStream) => void;
}

class GroupVideoCallService {
  private peer: Peer | null = null;
  private ws: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private userId: string | null = null;
  private callState: GroupCallState = 'idle';
  private handlers: GroupVideoCallEventHandlers = {};
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private callTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private currentCallInfo: GroupCallInfo | null = null;
  private peerConnections: Map<string, MediaConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();

  initialize(userId: string, handlers: GroupVideoCallEventHandlers = {}) {
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

    const peerId = `group_${this.userId}`;
    
    this.peer = new Peer(peerId, {
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
      console.log('📞 [Group] PeerJS connected with ID:', id);
    });

    this.peer.on('call', async (call) => {
      console.log('📞 [Group] Incoming PeerJS call from:', call.peer);
      const callerId = call.peer.replace('group_', '');
      
      const existingConnection = this.peerConnections.get(callerId);
      if (existingConnection) {
        console.log('📞 [Group] Already have connection to', callerId, '- closing duplicate incoming call');
        call.close();
        return;
      }
      
      this.peerConnections.set(callerId, call);
      
      call.on('stream', (remoteStream) => {
        console.log('📞 [Group] Received remote stream from:', callerId);
        this.remoteStreams.set(callerId, remoteStream);
        this.handlers.onParticipantStream?.(callerId, remoteStream);
        
        if (this.currentCallInfo?.participants.has(callerId)) {
          const participant = this.currentCallInfo.participants.get(callerId)!;
          participant.stream = remoteStream;
          participant.status = 'connected';
          this.handlers.onParticipantJoined?.(participant);
        }
      });

      call.on('close', () => {
        console.log('📞 [Group] Call closed from:', callerId);
        this.handleParticipantLeft(callerId);
      });

      call.on('error', (error) => {
        console.error('📞 [Group] Call error from', callerId, ':', error);
      });

      const isInActiveCall = (this.callState === 'connected' || this.callState === 'calling') && this.localStream;
      if (isInActiveCall) {
        console.log('📞 [Group] Auto-answering PeerJS call from:', callerId, '(state:', this.callState, ')');
        call.answer(this.localStream!);
      }
    });

    this.peer.on('error', (error) => {
      console.error('📞 [Group] PeerJS error:', error);
    });

    this.peer.on('disconnected', () => {
      console.log('📞 [Group] PeerJS disconnected, attempting reconnect...');
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
        console.log('📞 [Group] WebSocket connected');
        if (this.userId) {
          this.ws?.send(JSON.stringify({
            type: 'join-group-call-signaling',
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
        console.error('📞 [Group] WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('📞 [Group] WebSocket closed');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'group-call-invite':
        console.log('📞 [Group] Received group call invite:', message);
        this.handleIncomingGroupCall(message);
        break;
      
      case 'group-call-participant-joined':
        console.log('📞 [Group] Participant joined:', message);
        this.handleParticipantJoinedSignal(message);
        break;
      
      case 'group-call-participant-left':
        console.log('📞 [Group] Participant left:', message);
        this.handleParticipantLeft(message.userId);
        break;
      
      case 'group-call-response':
        console.log('📞 [Group] Received call response:', message);
        if (message.response === 'accept') {
          this.handleParticipantAccepted(message);
        } else if (message.response === 'decline') {
          this.handleParticipantDeclined(message.userId);
        }
        break;
      
      case 'group-call-ended':
        console.log('📞 [Group] Call ended');
        this.handlers.onCallEnded?.();
        this.cleanup();
        break;
    }
  }

  private handleIncomingGroupCall(message: any) {
    const participants = new Map<string, GroupCallParticipant>();
    
    if (message.participants) {
      message.participants.forEach((p: any) => {
        participants.set(p.id, {
          id: p.id,
          name: p.name || 'Unknown',
          avatar: p.avatar,
          status: 'pending'
        });
      });
    }

    const callInfo: GroupCallInfo = {
      callId: message.callId,
      initiatorId: message.from,
      initiatorName: message.initiatorName || 'Unknown',
      initiatorAvatar: message.initiatorAvatar,
      groupId: message.groupId,
      groupName: message.groupName,
      participants
    };
    
    this.currentCallInfo = callInfo;
    this.setCallState('ringing');
    this.handlers.onIncomingGroupCall?.(callInfo);
  }

  private handleParticipantJoinedSignal(message: any) {
    if (!this.currentCallInfo) return;
    
    const participant: GroupCallParticipant = {
      id: message.userId,
      name: message.userName || 'Unknown',
      avatar: message.userAvatar,
      status: 'connected'
    };
    
    this.currentCallInfo.participants.set(message.userId, participant);
    
    if (this.callState === 'calling') {
      console.log('📞 [Group] First participant joined, transitioning to connected');
      this.setCallState('connected');
      this.currentCallInfo.startTime = new Date();
      this.clearCallTimeout();
    }
    
    if (this.localStream && this.peer) {
      this.callParticipant(message.userId);
    }
  }

  private handleParticipantAccepted(message: any) {
    if (!this.currentCallInfo) return;
    
    const participant = this.currentCallInfo.participants.get(message.userId);
    if (participant) {
      participant.status = 'connected';
      
      if (this.callState === 'calling') {
        console.log('📞 [Group] Participant accepted, transitioning to connected');
        this.setCallState('connected');
        this.currentCallInfo.startTime = new Date();
        this.clearCallTimeout();
      }
      
      this.callParticipant(message.userId);
    }
  }

  private handleParticipantDeclined(userId: string) {
    if (!this.currentCallInfo) return;
    
    const participant = this.currentCallInfo.participants.get(userId);
    if (participant) {
      participant.status = 'declined';
    }
  }

  private handleParticipantLeft(participantId: string) {
    console.log('📞 [Group] Handling participant left:', participantId);
    this.remoteStreams.delete(participantId);
    
    const connection = this.peerConnections.get(participantId);
    if (connection) {
      try { connection.close(); } catch (e) {}
      this.peerConnections.delete(participantId);
    }
    
    if (this.currentCallInfo?.participants.has(participantId)) {
      this.currentCallInfo.participants.get(participantId)!.status = 'left';
    }
    
    this.handlers.onParticipantLeft?.(participantId);
    
    if (this.callState === 'connected' && this.currentCallInfo?.startTime) {
      const activeParticipants = Array.from(this.currentCallInfo?.participants.values() || [])
        .filter(p => p.status === 'connected');
      
      const callDuration = Date.now() - this.currentCallInfo.startTime.getTime();
      if (activeParticipants.length === 0 && callDuration > 3000) {
        console.log('📞 [Group] No active participants remaining, ending call');
        this.endCall();
      }
    }
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

  private setCallState(state: GroupCallState) {
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
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      this.handlers.onLocalStream?.(this.localStream);
      return this.localStream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      throw new Error(error.message || 'Failed to access camera/microphone');
    }
  }

  async initiateGroupCall(
    groupId: string,
    groupName: string,
    participants: Array<{ id: string; name: string; avatar?: string }>,
    callerName: string,
    callerAvatar?: string
  ): Promise<void> {
    if (this.callState !== 'idle') {
      throw new Error('Already in a call');
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('📞 [Group] WebSocket not connected, attempting reconnect...');
      this.setupWebSocket();
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        throw new Error('Unable to connect. Please try again.');
      }
    }

    const callId = `group_call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const participantMap = new Map<string, GroupCallParticipant>();
    participants.forEach(p => {
      participantMap.set(p.id, {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        status: 'pending'
      });
    });

    this.currentCallInfo = {
      callId,
      initiatorId: this.userId!,
      initiatorName: callerName,
      initiatorAvatar: callerAvatar,
      groupId,
      groupName,
      participants: participantMap
    };

    this.setCallState('calling');

    try {
      await this.getLocalStream();
    } catch (error: any) {
      this.setCallState('idle');
      throw error;
    }

    console.log('📞 [Group] Sending group-call-invite to:', participants.map(p => p.id));
    this.ws.send(JSON.stringify({
      type: 'group-video-call-invite',
      callId,
      userId: this.userId,
      groupId,
      groupName,
      invitedUsers: participants.map(p => p.id),
      participants: participants,
      initiatorName: callerName,
      initiatorAvatar: callerAvatar
    }));

    this.callTimeout = setTimeout(() => {
      const connectedCount = Array.from(this.currentCallInfo?.participants.values() || [])
        .filter(p => p.status === 'connected').length;
      
      if (connectedCount === 0 && this.callState === 'calling') {
        this.handlers.onCallFailed?.('No one answered');
        this.endCall();
      }
    }, 45000);
  }

  private async callParticipant(participantId: string): Promise<void> {
    if (!this.peer || !this.localStream) {
      console.log('📞 [Group] Cannot call participant - no peer or stream');
      return;
    }

    const existingConnection = this.peerConnections.get(participantId);
    if (existingConnection) {
      console.log('📞 [Group] Already have connection to', participantId, '- skipping duplicate call');
      return;
    }

    try {
      const peerId = `group_${participantId}`;
      console.log('📞 [Group] Calling participant:', peerId);
      
      const call = this.peer.call(peerId, this.localStream);
      this.peerConnections.set(participantId, call);
      
      call.on('stream', (remoteStream) => {
        console.log('📞 [Group] Received stream from:', participantId);
        this.remoteStreams.set(participantId, remoteStream);
        this.handlers.onParticipantStream?.(participantId, remoteStream);
        
        if (this.currentCallInfo?.participants.has(participantId)) {
          const participant = this.currentCallInfo.participants.get(participantId)!;
          participant.stream = remoteStream;
          participant.status = 'connected';
          this.handlers.onParticipantJoined?.(participant);
        }
      });

      call.on('close', () => {
        console.log('📞 [Group] Call closed with:', participantId);
        this.handleParticipantLeft(participantId);
      });

      call.on('error', (error) => {
        console.error('📞 [Group] Call error with', participantId, ':', error);
      });
    } catch (error) {
      console.error('📞 [Group] Error calling participant:', error);
    }
  }

  async acceptGroupCall(): Promise<void> {
    if (this.callState !== 'ringing' || !this.currentCallInfo) {
      throw new Error('No incoming call to accept');
    }

    try {
      const stream = await this.getLocalStream();
      
      this.setCallState('connected');
      this.currentCallInfo.startTime = new Date();
      
      this.peerConnections.forEach((call, participantId) => {
        console.log('📞 [Group] Answering existing PeerJS call from:', participantId);
        call.answer(stream);
      });

      this.ws?.send(JSON.stringify({
        type: 'group-video-call-response',
        callId: this.currentCallInfo.callId,
        userId: this.userId,
        userName: 'User',
        response: 'accept',
        groupId: this.currentCallInfo.groupId
      }));

    } catch (error: any) {
      this.handlers.onCallFailed?.(error.message);
      this.endCall();
    }
  }

  declineGroupCall(): void {
    if (this.callState !== 'ringing' || !this.currentCallInfo) {
      return;
    }

    this.ws?.send(JSON.stringify({
      type: 'group-video-call-response',
      callId: this.currentCallInfo.callId,
      userId: this.userId,
      response: 'decline',
      groupId: this.currentCallInfo.groupId
    }));

    this.cleanup();
  }

  endCall(): void {
    if (this.currentCallInfo && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'group-call-leave',
        callId: this.currentCallInfo.callId,
        userId: this.userId,
        groupId: this.currentCallInfo.groupId
      }));
    }

    this.handlers.onCallEnded?.();
    this.cleanup();
  }

  private cleanup(): void {
    this.clearCallTimeout();

    this.peerConnections.forEach((call) => {
      call.close();
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

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

  getCallState(): GroupCallState {
    return this.callState;
  }

  getCurrentCallInfo(): GroupCallInfo | null {
    return this.currentCallInfo;
  }

  getLocalStreamRef(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  getParticipants(): GroupCallParticipant[] {
    return Array.from(this.currentCallInfo?.participants.values() || []);
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

export const groupVideoCallService = new GroupVideoCallService();
