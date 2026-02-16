import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { groupVideoCallService, GroupCallState, GroupCallInfo, GroupCallParticipant } from '@/lib/groupVideoCallService';
import { useAuth } from '@/hooks/useAuth';

interface GroupVideoCallContextType {
  callState: GroupCallState;
  currentCallInfo: GroupCallInfo | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participants: GroupCallParticipant[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  initiateGroupCall: (
    groupId: string,
    groupName: string,
    participants: Array<{ id: string; name: string; avatar?: string }>
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  error: string | null;
  clearError: () => void;
}

const GroupVideoCallContext = createContext<GroupVideoCallContextType | null>(null);

export function GroupVideoCallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [callState, setCallState] = useState<GroupCallState>('idle');
  const [currentCallInfo, setCurrentCallInfo] = useState<GroupCallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [participants, setParticipants] = useState<GroupCallParticipant[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (user?.id && !isInitialized.current) {
      const userName = (user as any).firstName || (user as any).username || 'User';
      const userAvatar = (user as any).profileImageUrl;

      const filterSelf = (list: any[]) => list.filter(p => p.id !== user.id);

      groupVideoCallService.initialize(user.id, {
        onCallStateChange: (state) => {
          setCallState(state);
          if (state === 'connected') {
            setParticipants(filterSelf(groupVideoCallService.getParticipants()));
          }
        },
        onIncomingGroupCall: (callInfo) => {
          setCurrentCallInfo(callInfo);
          setParticipants(filterSelf(Array.from(callInfo.participants.values())));
        },
        onParticipantJoined: (participant) => {
          setParticipants(filterSelf(groupVideoCallService.getParticipants()));
          setRemoteStreams(new Map(groupVideoCallService.getRemoteStreams()));
        },
        onParticipantLeft: (participantId) => {
          setParticipants(filterSelf(groupVideoCallService.getParticipants()));
          setRemoteStreams(new Map(groupVideoCallService.getRemoteStreams()));
        },
        onParticipantStream: (participantId, stream) => {
          setRemoteStreams(new Map(groupVideoCallService.getRemoteStreams()));
        },
        onCallEnded: () => {
          setLocalStream(null);
          setRemoteStreams(new Map());
          setParticipants([]);
          setCurrentCallInfo(null);
        },
        onCallFailed: (errorMessage) => {
          setError(errorMessage);
          setLocalStream(null);
          setRemoteStreams(new Map());
          setParticipants([]);
          setCurrentCallInfo(null);
        },
        onLocalStream: (stream) => {
          setLocalStream(stream);
        },
      });

      isInitialized.current = true;
    }

    return () => {
      if (isInitialized.current) {
        groupVideoCallService.destroy();
        isInitialized.current = false;
      }
    };
  }, [user?.id]);

  const initiateGroupCall = useCallback(async (
    groupId: string,
    groupName: string,
    participantsList: Array<{ id: string; name: string; avatar?: string }>
  ) => {
    if (!user) {
      setError('You must be logged in to make calls');
      return;
    }

    try {
      setError(null);
      const callerName = (user as any).firstName || (user as any).username || 'User';
      const callerAvatar = (user as any).profileImageUrl;
      await groupVideoCallService.initiateGroupCall(
        groupId,
        groupName,
        participantsList,
        callerName,
        callerAvatar
      );
      setCurrentCallInfo(groupVideoCallService.getCurrentCallInfo());
      setParticipants(groupVideoCallService.getParticipants().filter(p => p.id !== user.id));
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  const acceptCall = useCallback(async () => {
    try {
      setError(null);
      await groupVideoCallService.acceptGroupCall();
      setCurrentCallInfo(groupVideoCallService.getCurrentCallInfo());
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const declineCall = useCallback(() => {
    groupVideoCallService.declineGroupCall();
  }, []);

  const endCall = useCallback(() => {
    groupVideoCallService.endCall();
  }, []);

  const toggleAudio = useCallback(() => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    groupVideoCallService.toggleAudio(newState);
  }, [isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    groupVideoCallService.toggleVideo(newState);
  }, [isVideoEnabled]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <GroupVideoCallContext.Provider
      value={{
        callState,
        currentCallInfo,
        localStream,
        remoteStreams,
        participants,
        isAudioEnabled,
        isVideoEnabled,
        initiateGroupCall,
        acceptCall,
        declineCall,
        endCall,
        toggleAudio,
        toggleVideo,
        error,
        clearError,
      }}
    >
      {children}
    </GroupVideoCallContext.Provider>
  );
}

export function useGroupVideoCall() {
  const context = useContext(GroupVideoCallContext);
  if (!context) {
    throw new Error('useGroupVideoCall must be used within a GroupVideoCallProvider');
  }
  return context;
}
