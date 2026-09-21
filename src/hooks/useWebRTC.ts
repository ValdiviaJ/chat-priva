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
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(roomId: string | undefined) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('voice');
  const [remoteName, setRemoteName] = useState<string>('Usuario');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Keep a ref of callState and callType to avoid stale closures in broadcast handlers
  const callStateRef = useRef<CallState>('idle');
  const callTypeRef = useRef<CallType>('voice');
  const setCallStateSynced = useCallback((state: CallState) => {
    callStateRef.current = state;
    setCallState(state);
  }, []);
  const setCallTypeSynced = useCallback((type: CallType) => {
    callTypeRef.current = type;
    setCallType(type);
  }, []);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Video and audio element refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const clientId = getClientId();
  const myName = getUserName() || 'Anónimo';

  // Attach remote stream to audio/video sinks
  const attachRemoteStream = useCallback((stream: MediaStream) => {
    remoteStreamRef.current = stream;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, []);

  // Cleanup helper
  const endCall = useCallback((notify = true) => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    iceCandidateQueueRef.current = [];

    if (notify && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call_signal',
        payload: {
          senderClientId: clientId,
          callerName: myName,
          type: 'end',
          callType: callTypeRef.current,
        },
      });
    }

    setCallStateSynced('idle');
    setCallDuration(0);
    setIsAudioMuted(false);
    setIsVideoDisabled(false);
  }, [clientId, myName, setCallStateSynced]);

  // Setup PeerConnection
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    iceCandidateQueueRef.current = [];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        attachRemoteStream(stream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'call_signal',
          payload: {
            senderClientId: clientId,
            callerName: myName,
            type: 'candidate',
            callType: callTypeRef.current,
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    return pc;
  }, [clientId, myName, attachRemoteStream]);

  // Start outgoing call
  const startCall = useCallback(
    async (type: CallType, targetName = 'Usuario') => {
      if (!roomId || callStateRef.current !== 'idle') return;

      try {
        setCallTypeSynced(type);
        setRemoteName(targetName);
        setCallStateSynced('calling');

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

        if (channelRef.current) {
          channelRef.current.send({
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
        }
      } catch (err) {
        console.error('Error starting WebRTC call:', err);
        endCall(false);
      }
    },
    [roomId, clientId, myName, createPeerConnection, endCall, setCallStateSynced, setCallTypeSynced]
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!roomId || !pcRef.current || callStateRef.current !== 'incoming') return;

    try {
      setCallStateSynced('connected');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callTypeRef.current === 'video',
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

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'call_signal',
          payload: {
            senderClientId: clientId,
            callerName: myName,
            type: 'answer',
            callType: callTypeRef.current,
            sdp: answer,
          },
        });
      }
    } catch (err) {
      console.error('Error accepting call:', err);
      endCall();
    }
  }, [roomId, clientId, myName, endCall, setCallStateSynced]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call_signal',
        payload: {
          senderClientId: clientId,
          callerName: myName,
          type: 'rejected',
          callType: callTypeRef.current,
        },
      });
    }
    endCall(false);
  }, [clientId, myName, endCall]);

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

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;

    if (isScreenSharing) {
      // Revert back to webcam
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        const camTrack = camStream.getVideoTracks()[0];
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');

        if (videoSender && camTrack) {
          videoSender.replaceTrack(camTrack);
        }

        if (localStreamRef.current) {
          const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldVideoTrack) {
            oldVideoTrack.stop();
            localStreamRef.current.removeTrack(oldVideoTrack);
          }
          localStreamRef.current.addTrack(camTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        setIsScreenSharing(false);
      } catch (err) {
        console.error('Error switching back to camera:', err);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');

        if (videoSender && screenTrack) {
          videoSender.replaceTrack(screenTrack);
        }

        if (localStreamRef.current) {
          const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldVideoTrack) {
            oldVideoTrack.stop();
            localStreamRef.current.removeTrack(oldVideoTrack);
          }
          localStreamRef.current.addTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  }, [isScreenSharing]);

  // Subscribe to call signaling events
  useEffect(() => {
    if (!roomId) return;

    // Drain queued candidates once remoteDescription is set
    const drainQueuedCandidates = async (pc: RTCPeerConnection) => {
      if (!pc.remoteDescription) return;
      while (iceCandidateQueueRef.current.length > 0) {
        const candidate = iceCandidateQueueRef.current.shift();
        if (candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error applying queued ICE candidate:', e);
          }
        }
      }
    };

    const channel = supabase.channel(`presence_room_${roomId}`);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'call_signal' }, async ({ payload }: { payload: SignalPayload }) => {
      if (!payload || payload.senderClientId === clientId) return;

      switch (payload.type) {
        case 'offer': {
          // If already in an active/ringing call, reject with busy
          if (callStateRef.current !== 'idle') {
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

          setCallTypeSynced(payload.callType);
          setRemoteName(payload.callerName || 'Usuario');
          setCallStateSynced('incoming');

          showBrowserNotification(
            payload.callType === 'video' ? 'Videollamada entrante' : 'Llamada de voz entrante',
            `${payload.callerName || 'Usuario'} te está llamando...`
          );

          const pc = createPeerConnection();
          if (payload.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            await drainQueuedCandidates(pc);
          }
          break;
        }

        case 'answer': {
          if (pcRef.current && payload.sdp) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            await drainQueuedCandidates(pcRef.current);
            setCallStateSynced('connected');

            // Start duration timer
            setCallDuration(0);
            if (durationTimerRef.current) clearInterval(durationTimerRef.current);
            durationTimerRef.current = setInterval(() => {
              setCallDuration((prev) => prev + 1);
            }, 1000);
          }
          break;
        }

        case 'candidate': {
          if (payload.candidate) {
            if (pcRef.current && pcRef.current.remoteDescription) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } catch (e) {
                console.error('Error adding received ice candidate:', e);
              }
            } else {
              // Queue until remoteDescription is set
              iceCandidateQueueRef.current.push(payload.candidate);
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
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [roomId, clientId, myName, createPeerConnection, endCall, setCallStateSynced, setCallTypeSynced]);

  return {
    callState,
    callType,
    remoteName,
    callDuration,
    isAudioMuted,
    isVideoDisabled,
    isScreenSharing,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMuteAudio,
    toggleVideo,
    toggleScreenShare,
  };
}
