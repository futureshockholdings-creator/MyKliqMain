import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/lib/queryClient";
import { buildWebSocketUrl } from "@/lib/apiConfig";
import { type VideoCall, type CallParticipant, type User } from "@shared/schema";

interface VideoCallState {
  currentCall: (VideoCall & { participants: (CallParticipant & { user: User })[] }) | null;
  isInCall: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useVideoCall() {
  const { user } = useAuth();
  const [state, setState] = useState<VideoCallState>({
    currentCall: null,
    isInCall: false,
    isConnecting: false,
    error: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for call signaling
  useEffect(() => {
    if (!user) return;

    // Use buildWebSocketUrl to correctly route to backend (api.mykliq.app) in production
    const wsUrl = buildWebSocketUrl('/ws');
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Video call WebSocket connected');
      // Join user to call signaling
      ws.send(JSON.stringify({
        type: 'join-call-signaling',
        userId: (user as unknown as User).id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Video call WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('Video call WebSocket error:', error);
      setState(prev => ({ ...prev, error: 'Connection failed' }));
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'call-started':
        setState(prev => ({
          ...prev,
          currentCall: data.call,
          isInCall: true,
          isConnecting: false,
        }));
        break;
      case 'call-ended':
        setState(prev => ({
          ...prev,
          currentCall: null,
          isInCall: false,
          isConnecting: false,
        }));
        break;
      case 'participant-joined':
        setState(prev => ({
          ...prev,
          currentCall: prev.currentCall ? {
            ...prev.currentCall,
            participants: data.participants,
          } : null,
        }));
        break;
      case 'participant-left':
        setState(prev => ({
          ...prev,
          currentCall: prev.currentCall ? {
            ...prev.currentCall,
            participants: data.participants,
          } : null,
        }));
        break;
      case 'call-invite':
        // Handle incoming call invitation
        console.log('Received call invite:', data);
        break;
    }
  };

  const startCall = async (participantIds: string[]) => {
    if (!user || state.isInCall) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const callData = await apiRequest('POST', '/api/video-calls', { participantIds });

      // WebSocket will handle the call state update
      setState(prev => ({ ...prev, isConnecting: false }));
      
      return callData;
    } catch (error) {
      console.error('Error starting call:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: 'Failed to start call' 
      }));
      throw error;
    }
  };

  const joinCall = async (callId: string) => {
    if (!user) return;

    try {
      await apiRequest('POST', `/api/video-calls/${callId}/join`);
    } catch (error) {
      console.error('Error joining call:', error);
      setState(prev => ({ ...prev, error: 'Failed to join call' }));
    }
  };

  const leaveCall = async () => {
    if (!state.currentCall) return;

    try {
      await apiRequest('POST', `/api/video-calls/${state.currentCall.id}/leave`);

      setState(prev => ({
        ...prev,
        currentCall: null,
        isInCall: false,
        isConnecting: false,
      }));
    } catch (error) {
      console.error('Error leaving call:', error);
      setState(prev => ({ ...prev, error: 'Failed to leave call' }));
    }
  };

  const endCall = async () => {
    if (!state.currentCall) return;

    try {
      await apiRequest('POST', `/api/video-calls/${state.currentCall.id}/end`);

      setState(prev => ({
        ...prev,
        currentCall: null,
        isInCall: false,
        isConnecting: false,
      }));
    } catch (error) {
      console.error('Error ending call:', error);
      setState(prev => ({ ...prev, error: 'Failed to end call' }));
    }
  };

  const toggleAudio = (enabled: boolean) => {
    if (wsRef.current && state.currentCall) {
      wsRef.current.send(JSON.stringify({
        type: 'audio-toggle',
        callId: state.currentCall.id,
        enabled,
      }));
    }
  };

  const toggleVideo = (enabled: boolean) => {
    if (wsRef.current && state.currentCall) {
      wsRef.current.send(JSON.stringify({
        type: 'video-toggle',
        callId: state.currentCall.id,
        enabled,
      }));
    }
  };

  return {
    ...state,
    startCall,
    joinCall,
    leaveCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
}