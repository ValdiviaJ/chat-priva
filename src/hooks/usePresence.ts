import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getClientId, getUserName } from '../utils/clientId';

export interface ReactionMap {
  // messageId -> emoji -> array of usernames
  [messageId: string]: {
    [emoji: string]: string[];
  };
}

interface PresenceState {
  isOtherOnline: boolean;
  otherUsername: string | null;
  isOtherTyping: boolean;
  setTyping: (typing: boolean) => void;
  isOtherRecordingAudio: boolean;
  setIsRecordingAudio: (isRecording: boolean) => void;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  // Pinned message
  pinnedMessageId: string | null;
  setPinnedMessage: (messageId: string | null) => void;
  // Reactions
  reactions: ReactionMap;
  toggleReaction: (messageId: string, emoji: string) => void;
  // Read receipts
  lastReadMessageId: string | null;
  sendReadReceipt: (messageId: string) => void;
  // Ephemeral messages (in seconds: 0 = off, 300 = 5m, 3600 = 1h, etc.)
  ephemeralSeconds: number;
  updateEphemeralSeconds: (seconds: number) => void;
}

export function usePresence(roomId: string | undefined): PresenceState {
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [otherUsername, setOtherUsername] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [connectionState, setConnectionState] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connecting');

  // Reactions state
  const [reactions, setReactions] = useState<ReactionMap>(() => {
    if (!roomId) return {};
    try {
      const saved = localStorage.getItem(`quickchat_reactions_${roomId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Read receipts state
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);

  // Ephemeral messages timer state
  const [ephemeralSeconds, setEphemeralSeconds] = useState<number>(() => {
    if (!roomId) return 0;
    try {
      const saved = localStorage.getItem(`quickchat_ephemeral_${roomId}`);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Audio recording presence state
  const [isOtherRecordingAudio, setIsOtherRecordingAudio] = useState(false);

  // Pinned message state
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(() => {
    if (!roomId) return null;
    try {
      return localStorage.getItem(`quickchat_pinned_${roomId}`) || null;
    } catch {
      return null;
    }
  });

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (payload?.messageId && payload?.emoji && payload?.username) {
          setReactions((prev) => {
            const msgReactions = { ...(prev[payload.messageId] || {}) };
            const users = new Set(msgReactions[payload.emoji] || []);

            if (payload.action === 'remove') {
              users.delete(payload.username);
            } else {
              users.add(payload.username);
            }

            if (users.size === 0) {
              delete msgReactions[payload.emoji];
            } else {
              msgReactions[payload.emoji] = Array.from(users);
            }

            const next = { ...prev, [payload.messageId]: msgReactions };
            localStorage.setItem(`quickchat_reactions_${roomId}`, JSON.stringify(next));
            return next;
          });
        }
      })
      .on('broadcast', { event: 'read_receipt' }, ({ payload }) => {
        if (payload?.lastReadMessageId && payload?.readerClientId !== clientId) {
          setLastReadMessageId(payload.lastReadMessageId);
        }
      })
      .on('broadcast', { event: 'recording_audio' }, ({ payload }) => {
        if (payload?.senderClientId && payload.senderClientId !== clientId) {
          setIsOtherRecordingAudio(Boolean(payload.isRecording));
          if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
          if (payload.isRecording) {
            recordingTimeoutRef.current = setTimeout(() => {
              setIsOtherRecordingAudio(false);
            }, 60000);
          }
        }
      })
      .on('broadcast', { event: 'pinned_message' }, ({ payload }) => {
        const pId = payload?.messageId || null;
        setPinnedMessageId(pId);
        if (roomId) {
          if (pId) {
            localStorage.setItem(`quickchat_pinned_${roomId}`, pId);
          } else {
            localStorage.removeItem(`quickchat_pinned_${roomId}`);
          }
        }
      })
      .on('broadcast', { event: 'ephemeral_settings' }, ({ payload }) => {
        if (typeof payload?.durationSeconds === 'number') {
          setEphemeralSeconds(payload.durationSeconds);
          localStorage.setItem(`quickchat_ephemeral_${roomId}`, String(payload.durationSeconds));
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
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
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

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      const username = myUsername || 'Tú';
      let action: 'add' | 'remove' = 'add';

      setReactions((prev) => {
        const msgReactions = { ...(prev[messageId] || {}) };
        const users = new Set(msgReactions[emoji] || []);

        if (users.has(username)) {
          users.delete(username);
          action = 'remove';
        } else {
          users.add(username);
          action = 'add';
        }

        if (users.size === 0) {
          delete msgReactions[emoji];
        } else {
          msgReactions[emoji] = Array.from(users);
        }

        const next = { ...prev, [messageId]: msgReactions };
        if (roomId) {
          localStorage.setItem(`quickchat_reactions_${roomId}`, JSON.stringify(next));
        }
        return next;
      });

      if (channelRef.current && connectionState === 'connected') {
        channelRef.current.send({
          type: 'broadcast',
          event: 'reaction',
          payload: {
            messageId,
            emoji,
            username,
            senderClientId: clientId,
            action,
          },
        });
      }
    },
    [roomId, myUsername, clientId, connectionState]
  );

  const sendReadReceipt = useCallback(
    (messageId: string) => {
      if (!channelRef.current || connectionState !== 'connected') return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'read_receipt',
        payload: {
          lastReadMessageId: messageId,
          readerClientId: clientId,
        },
      });
    },
    [clientId, connectionState]
  );

  const updateEphemeralSeconds = useCallback(
    (seconds: number) => {
      setEphemeralSeconds(seconds);
      if (roomId) {
        localStorage.setItem(`quickchat_ephemeral_${roomId}`, String(seconds));
      }
      if (channelRef.current && connectionState === 'connected') {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ephemeral_settings',
          payload: {
            durationSeconds: seconds,
          },
        });
      }
    },
    [roomId, connectionState]
  );

  const setIsRecordingAudio = useCallback(
    (isRecording: boolean) => {
      if (!channelRef.current || connectionState !== 'connected') return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'recording_audio',
        payload: {
          senderClientId: clientId,
          isRecording,
        },
      });
    },
    [clientId, connectionState]
  );

  const setPinnedMessage = useCallback(
    (messageId: string | null) => {
      setPinnedMessageId(messageId);
      if (roomId) {
        if (messageId) {
          localStorage.setItem(`quickchat_pinned_${roomId}`, messageId);
        } else {
          localStorage.removeItem(`quickchat_pinned_${roomId}`);
        }
      }

      if (channelRef.current && connectionState === 'connected') {
        channelRef.current.send({
          type: 'broadcast',
          event: 'pinned_message',
          payload: {
            messageId,
          },
        });
      }
    },
    [roomId, connectionState]
  );

  return {
    isOtherOnline,
    otherUsername,
    isOtherTyping,
    setTyping,
    isOtherRecordingAudio,
    setIsRecordingAudio,
    connectionState,
    pinnedMessageId,
    setPinnedMessage,
    reactions,
    toggleReaction,
    lastReadMessageId,
    sendReadReceipt,
    ephemeralSeconds,
    updateEphemeralSeconds,
  };
}
