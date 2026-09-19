import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { getClientId, getUserName } from '../utils/clientId';
import { showBrowserNotification } from '../utils/notifications';

export type CallType = 'voice' | 'video';
export type CallState = 'idle' | 'calling' | 'incoming' | 'connected';

interface SignalPayload {
  senderClientId: string;
  callerName: string;
  type: 'offer' | 'answer' | 'candidate' | 'end' | 'rejected' | 'busy';
  callType: CallType;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(roomId: string | undefined) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('voice');
  const [remoteName, setRemoteName] = useState<string>('Usuario');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Video element refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const clientId = getClientId();
  const myName = getUserName() || 'Anónimo';

  // Cleanup helper
  const endCall = useCallback((notify = true) => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (notify && roomId) {
      supabase.channel(`presence_room_${roomId}`).send({
        type: 'broadcast',
        event: 'call_signal',
        payload: {
          senderClientId: clientId,
          callerName: myName,
          type: 'end',
          callType,
        },
      });
    }

    setCallState('idle');
    setCallDuration(0);
    setIsAudioMuted(false);
    setIsVideoDisabled(false);
  }, [roomId, clientId, myName, callType]);

  // Setup PeerConnection
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Handle remote stream
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        supabase.channel(`presence_room_${roomId}`).send({
          type: 'broadcast',
          event: 'call_signal',
          payload: {
            senderClientId: clientId,
            callerName: myName,
            type: 'candidate',
            callType,
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    return pc;
  }, [roomId, clientId, myName, callType]);

  // Start outgoing call
  const startCall = useCallback(
    async (type: CallType, targetName = 'Usuario') => {
      if (!roomId || callState !== 'idle') return;

      try {
        setCallType(type);
        setRemoteName(targetName);
        setCallState('calling');

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        supabase.channel(`presence_room_${roomId}`).send({
          type: 'broadcast',
          event: 'call_signal',
          payload: {
            senderClientId: clientId,
            callerName: myName,
            type: 'offer',
            callType: type,
            sdp: offer,
          },
        });
      } catch (err) {
        console.error('Error starting WebRTC call:', err);
        endCall(false);
      }
    },
    [roomId, callState, clientId, myName, createPeerConnection, endCall]
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!roomId || !pcRef.current || callState !== 'incoming') return;

    try {
      setCallState('connected');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = pcRef.current;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Start duration timer
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      supabase.channel(`presence_room_${roomId}`).send({
        type: 'broadcast',
        event: 'call_signal',
        payload: {
          senderClientId: clientId,
          callerName: myName,
          type: 'answer',
          callType,
          sdp: answer,
        },
      });
    } catch (err) {
      console.error('Error accepting call:', err);
      endCall();
    }
  }, [roomId, callState, callType, clientId, myName, endCall]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (roomId) {
      supabase.channel(`presence_room_${roomId}`).send({
        type: 'broadcast',
        event: 'call_signal',
        payload: {
          senderClientId: clientId,
          callerName: myName,
          type: 'rejected',
          callType,
        },
      });
    }
    endCall(false);
  }, [roomId, clientId, myName, callType, endCall]);

  // Toggle Mute Audio
  const toggleMuteAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsAudioMuted(!track.enabled);
      });
    }
  }, []);

  // Toggle Video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsVideoDisabled(!track.enabled);
      });
    }
  }, []);

  // Subscribe to call signaling events
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`presence_room_${roomId}`)
      .on('broadcast', { event: 'call_signal' }, async ({ payload }: { payload: SignalPayload }) => {
        if (!payload || payload.senderClientId === clientId) return;

        switch (payload.type) {
          case 'offer': {
            if (callState !== 'idle') {
              // Send busy signal if already in call
              channel.send({
                type: 'broadcast',
                event: 'call_signal',
                payload: {
                  senderClientId: clientId,
                  callerName: myName,
                  type: 'busy',
                  callType: payload.callType,
                },
              });
              return;
            }

            setCallType(payload.callType);
            setRemoteName(payload.callerName || 'Usuario');
            setCallState('incoming');

            showBrowserNotification(
              payload.callType === 'video' ? 'Videollamada entrante' : 'Llamada de voz entrante',
              `${payload.callerName || 'Usuario'} te está llamando...`
            );

            const pc = createPeerConnection();
            if (payload.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            }
            break;
          }

          case 'answer': {
            if (pcRef.current && payload.sdp) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              setCallState('connected');

              // Start duration timer
              setCallDuration(0);
              durationTimerRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
              }, 1000);
            }
            break;
          }

          case 'candidate': {
            if (pcRef.current && payload.candidate) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } catch (e) {
                console.error('Error adding received ice candidate:', e);
              }
            }
            break;
          }

          case 'end':
          case 'rejected':
          case 'busy': {
            endCall(false);
            break;
          }
        }
      });

    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [roomId, clientId, myName, callState, createPeerConnection, endCall]);

  return {
    callState,
    callType,
    remoteName,
    callDuration,
    isAudioMuted,
    isVideoDisabled,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMuteAudio,
    toggleVideo,
  };
}
