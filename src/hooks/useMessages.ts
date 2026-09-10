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

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
  };
}
