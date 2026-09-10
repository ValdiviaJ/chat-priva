import { supabase } from './supabase';
import type { Room, Participant } from '../types/database';
import { generateRoomCode, sanitizeCode } from '../utils/codeGenerator';
import { getClientId } from '../utils/clientId';

export async function createRoom(nickname?: string): Promise<{ room: Room; participant: Participant }> {
  const clientId = getClientId();
  const code = generateRoomCode(8);

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ code } as any)
    .select()
    .single();

  if (roomError || !room) {
    console.error('Error creating room:', roomError);
    throw new Error('No se pudo crear la sala.');
  }

  const roomRecord = room as unknown as Room;

  const { data: participant, error: partError } = await supabase
    .from('participants')
    .insert({ room_id: roomRecord.id, client_id: clientId } as any)
    .select()
    .single();

  if (partError || !participant) {
    console.error('Error creating participant:', partError);
    throw new Error('No se pudo registrar el participante.');
  }

  return { room: roomRecord, participant: participant as unknown as Participant };
}

export async function validateRoomForJoin(code: string): Promise<{ valid: boolean; reason?: string }> {
  const cleanCode = sanitizeCode(code);
  const clientId = getClientId();

  const { data: room, error } = await supabase
    .from('rooms')
    .select('id, code')
    .eq('code', cleanCode)
    .maybeSingle();

  if (error || !room) {
    return { valid: false, reason: 'Código de sala inválido o la sala ya no existe.' };
  }

  const roomRecord = room as unknown as { id: string; code: string };

  const { data: participants } = await supabase
    .from('participants')
    .select('id, client_id')
    .eq('room_id', roomRecord.id);

  const pList = (participants as unknown as { id: string; client_id: string }[]) || [];
  const alreadyIn = pList.some((p) => p.client_id === clientId);

  if (!alreadyIn && pList.length >= 2) {
    return { valid: false, reason: 'Esta sala ya alcanzó el límite máximo de 2 personas.' };
  }

  return { valid: true };
}

export async function joinRoom(code: string, nickname?: string): Promise<{ room: Room; participant: Participant }> {
  const cleanCode = sanitizeCode(code);
  const clientId = getClientId();

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', cleanCode)
    .single();

  if (roomError || !room) {
    throw new Error('La sala no existe.');
  }

  const roomRecord = room as unknown as Room;

  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('room_id', roomRecord.id);

  const pList = (participants as unknown as Participant[]) || [];
  const existing = pList.find((p) => p.client_id === clientId);

  if (existing) {
    return { room: roomRecord, participant: existing };
  }

  if (pList.length >= 2) {
    throw new Error('La sala está llena (máximo 2 personas).');
  }

  const { data: newPart, error: partError } = await supabase
    .from('participants')
    .insert({ room_id: roomRecord.id, client_id: clientId } as any)
    .select()
    .single();

  if (partError || !newPart) {
    throw new Error('No se pudo unir a la sala.');
  }

  return { room, participant: newPart };
}
