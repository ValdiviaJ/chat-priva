import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getClientId } from '../utils/clientId';

interface PresenceState {
  isOtherOnline: boolean;
  isOtherTyping: boolean;
  setTyping: (typing: boolean) => void;
  connectionState: 'connected' | 'connecting' | 'disconnected';
}

export function usePresence(roomId: string | undefined): PresenceState {
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [connectionState, setConnectionState] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connecting');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<any>(null);

  const clientId = getClientId();

  useEffect(() => {
    if (!roomId) return;

    const channelName = `presence_room_${roomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: clientId,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const keys = Object.keys(state);
        const otherPresent = keys.some((k) => k !== clientId);
        setIsOtherOnline(otherPresent);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key !== clientId) {
          setIsOtherOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== clientId) {
          const state = channel.presenceState();
          const otherPresent = Object.keys(state).some(
            (k) => k !== clientId && k !== key
          );
          setIsOtherOnline(otherPresent);
          setIsOtherTyping(false);
        }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.senderClientId && payload.seenderClientId !== clientId) {
          setIsOtherTyping(Boolean(payload.isTyping));

          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (payload.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsOtherTyping(false);
            }, 2500);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionState('connected');
          channel.track({
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionState('disconnected');
        } else {
          setConnectionState('connecting');
        }
      });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, clientId]);


  const setTyping = useCallback(
    (typing: boolean) => {
      if (!channelRef.current || connectionState !== 'connected') return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          senderClientId: clientId,
          isTyping: typing,
        },
      });
    },
    [clientId, connectionState]
  );


  return {
    isOtherOnline,
    isOtherTyping,
    setTyping,
    connectionState,
  };
}
