import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getClientId, getUserName } from '../utils/clientId';

interface PresenceState {
  isOtherOnline: boolean;
  otherUsername: string | null;
  isOtherTyping: boolean;
  setTyping: (typing: boolean) => void;
  connectionState: 'connected' | 'connecting' | 'disconnected';
}

export function usePresence(roomId: string | undefined): PresenceState {
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [otherUsername, setOtherUsername] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [connectionState, setConnectionState] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connecting');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<any>(null);

  const clientId = getClientId();
  const myUsername = getUserName();

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

    const updatePresenceState = () => {
      const state = channel.presenceState();
      const keys = Object.keys(state);
      const otherKey = keys.find((k) => k !== clientId);
      if (otherKey && state[otherKey] && (state[otherKey] as any[]).length > 0) {
        setIsOtherOnline(true);
        const presenceData = (state[otherKey] as any[])[0];
        if (presenceData?.username) {
          setOtherUsername(presenceData.username);
        }
      } else {
        setIsOtherOnline(false);
      }
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        updatePresenceState();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== clientId) {
          setIsOtherOnline(true);
          if (newPresences && newPresences.length > 0 && newPresences[0]?.username) {
            setOtherUsername(newPresences[0].username);
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== clientId) {
          updatePresenceState();
          setIsOtherTyping(false);
        }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.senderClientId && payload.senderClientId !== clientId) {
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
            username: myUsername,
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
  }, [roomId, clientId, myUsername]);

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
    otherUsername,
    isOtherTyping,
    setTyping,
    connectionState,
  };
}
