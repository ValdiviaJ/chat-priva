import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Message } from '../types/database';

export function useMessages(roomId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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

        if (isMounted) {
          setMessages(data || []);
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
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'room_id=eq.' + roomId },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
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
  }, [roomId]);

  const sendMessage = useCallback(
    async (senderId: string, content: string): Promise<boolean> => {
      if (!roomId || sending) return false;

      const trimmed = content.trim();
      if (!trimmed) return false;

      try {
        setSending(true);

        const { data, error: sendErr } = await supabase
          .from('messages')
          .insert({
            room_id: roomId,
            sender_id: senderId,
            content: trimmed,
          } as any)
          .select()
          .single();

        if (sendErr) throw sendErr;

        if (data) {
          const msg = data as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
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

        const { error: editErr } = await (supabase.from('messages') as any)
          .update({ content: trimmed })
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
