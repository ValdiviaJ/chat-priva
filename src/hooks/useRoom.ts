import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Room, Participant } from '../types/database';
import { getClientId } from '../utils/clientId';

export function useRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      setError('ID de conversación no proporcionado.');
      return;
    }

    let isMounted = true;
    const clientId = getClientId();

    async function loadRoomDetails() {
      try {
        setLoading(true);
        setError(null);

        const currentId = roomId!;
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(currentId);
        const query = supabase.from('rooms').select('*');

        const { data: roomData, error: roomErr } = isUuid
          ? await query.eq('id', currentId as any).maybeSingle()
          : await query.eq('code', currentId.trim().toUpperCase()).maybeSingle();

        if (roomErr) throw roomErr;
        if (!roomData) {
          if (isMounted) {
            setError('Esta conversación no existe o fue eliminada.');
            setLoading(false);
          }
          return;
        }

        const realRoom = roomData as Room;

        const { data: participantsData, error: partErr } = await supabase
          .from('participants')
          .select('*')
          .eq('room_id', realRoom.id as any);

        if (partErr) throw partErr;

        const pList: Participant[] = (participantsData as any) || [];
        const existingMe = pList.find((p) => p.client_id === clientId);

        if (existingMe) {
          if (isMounted) {
            setRoom(roomData as Room);
            setParticipants(pList);
            setCurrentParticipant(existingMe);
            setLoading(false);
          }
          return;
        }

        if (pList.length >= 2) {
          if (isMounted) {
            setIsFull(true);
            setError('Esta conversación ya tiene dos participantes.');
            setLoading(false);
          }
          return;
        }

        const { data: newPart, error: joinErr } = await supabase
          .from('participants')
          .insert({
            room_id: realRoom.id,
            client_id: clientId,
          } as any)
          .select()
          .single();

        if (joinErr) throw joinErr;

        if (isMounted) {
          setRoom(realRoom);
          setParticipants([...pList, newPart as Participant]);
          setCurrentParticipant(newPart as Participant);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading room:', err);
        if (isMounted) {
          setError(err.message || 'No pudimos cargar esta conversación.');
          setLoading(false);
        }
      }
    }

    loadRoomDetails();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  return {
    room,
    participants,
    currentParticipant,
    loading,
    error,
    isFull,
  };
}
