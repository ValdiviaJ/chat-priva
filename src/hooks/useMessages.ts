import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import type { Message } from '../types/database';
import { encryptMessage, decryptMessage, isE2EEPayload } from '../utils/crypto';

export function useMessages(roomId: string | undefined, sharedKey?: CryptoKey | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const sharedKeyRef = useRef<CryptoKey | null>(sharedKey || null);

  useEffect(() => {
    sharedKeyRef.current = sharedKey || null;
    if (sharedKey) {
      // If we have messages that are still encrypted, re-process them with the key
      setMessages((prev) => {
        if (prev.some((m) => isE2EEPayload(m.content))) {
          Promise.all(
            prev.map(async (m) => {
              if (isE2EEPayload(m.content)) {
                try {
                  const dec = await decryptMessage(m.content, sharedKey);
                  return { ...m, content: dec };
                } catch {
                  return m;
                }
              }
              return m;
            })
          ).then((decryptedList) => {
            setMessages(decryptedList);
          });
        }
        return prev;
      });
    }
  }, [sharedKey]);

  // Helper to decrypt a message if it's E2EE
  const processIncomingMessage = useCallback(async (msg: Message): Promise<Message> => {
    if (!msg.content || !isE2EEPayload(msg.content)) {
      return msg;
    }
    const key = sharedKeyRef.current;
    if (!key) {
      // Key not yet derived: return masked representation or raw payload
      return { ...msg, content: '🔒 [Mensaje Cifrado de Extremo a Extremo]' };
    }
    try {
      const decrypted = await decryptMessage(msg.content, key);
      return { ...msg, content: decrypted };
    } catch (e) {
      console.warn('Could not decrypt E2EE message:', e);
      return { ...msg, content: '🔒 [Error al descifrar mensaje]' };
    }
  }, []);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchMessages() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchErr } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId as any)
          .order('created_at', { ascending: true });

        if (fetchErr) throw fetchErr;

        if (isMounted && data) {
          const processed = await Promise.all(data.map((m) => processIncomingMessage(m)));
          setMessages(processed);
        }
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        if (isMounted) {
          setError('Error al cargar mensajes del chat');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMessages();

    const channel = supabase
      .channel('messages-changes-' + roomId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'room_id=eq.' + roomId },
        async (payload) => {
          const rawMsg = payload.new as Message;
          const processed = await processIncomingMessage(rawMsg);
          setMessages((prev) => {
            if (prev.some((m) => m.id === processed.id)) return prev;
            return [...prev, processed];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'room_id=eq.' + roomId },
        async (payload) => {
          const rawMsg = payload.new as Message;
          const processed = await processIncomingMessage(rawMsg);
          setMessages((prev) => prev.map((m) => (m.id === processed.id ? processed : m)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: 'room_id=eq.' + roomId },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .on('broadcast', { event: 'delete_message' }, ({ payload }) => {
        if (payload?.messageId) {
          setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
        }
      })
      .on('broadcast', { event: 'edit_message' }, ({ payload }) => {
        if (payload?.messageId && payload?.newContent) {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.messageId ? { ...m, content: payload.newContent } : m))
          );
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [roomId, processIncomingMessage]);

  const sendMessage = useCallback(
    async (senderId: string, content: string): Promise<boolean> => {
      if (!roomId || sending) return false;

      const trimmed = content.trim();
      if (!trimmed) return false;

      try {
        setSending(true);

        // If E2EE shared key exists, encrypt payload before saving
        let payloadToSave = trimmed;
        const key = sharedKeyRef.current;
        if (key) {
          payloadToSave = await encryptMessage(trimmed, key);
        }

        const { data, error: sendErr } = await supabase
          .from('messages')
          .insert({
            room_id: roomId,
            sender_id: senderId,
            content: payloadToSave,
          } as any)
          .select()
          .single();

        if (sendErr) throw sendErr;

        if (data) {
          // Immediately keep plaintext in local state for sender
          const localMsg: Message = {
            ...(data as Message),
            content: trimmed,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === localMsg.id)) return prev;
            return [...prev, localMsg];
          });
        }
        return true;
      } catch (err: any) {
        console.error('Error sending message:', err);
        return false;
      } finally {
        setSending(false);
      }
    },
    [roomId, sending]
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string): Promise<boolean> => {
      const trimmed = newContent.trim();
      if (!trimmed || !roomId) return false;

      try {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: trimmed } : m))
        );

        let payloadToUpdate = trimmed;
        const key = sharedKeyRef.current;
        if (key) {
          payloadToUpdate = await encryptMessage(trimmed, key);
        }

        const { error: editErr } = await (supabase.from('messages') as any)
          .update({ content: payloadToUpdate })
          .eq('id', messageId);

        if (editErr) throw editErr;

        // Broadcast to other participant
        supabase.channel('messages-changes-' + roomId).send({
          type: 'broadcast',
          event: 'edit_message',
          payload: { messageId, newContent: trimmed },
        });

        return true;
      } catch (err) {
        console.error('Error editing message:', err);
        return false;
      }
    },
    [roomId]
  );

  const deleteMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!roomId) return false;

      try {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));

        const { error: delErr } = await (supabase.from('messages') as any)
          .delete()
          .eq('id', messageId);

        if (delErr) throw delErr;

        // Broadcast to other participant
        supabase.channel('messages-changes-' + roomId).send({
          type: 'broadcast',
          event: 'delete_message',
          payload: { messageId },
        });

        return true;
      } catch (err) {
        console.error('Error deleting message:', err);
        return false;
      }
    },
    [roomId]
  );

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    editMessage,
    deleteMessage,
  };
}
