import { supabase } from './supabase';

const BUCKET_NAME = 'chat-attachments';

export interface FileAttachment {
  type: 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export async function uploadChatFile(roomId: string, file: File): Promise<FileAttachment> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${roomId}/${Date.now()}_${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading to Supabase Storage:', error);
    throw new Error('No se pudo subir el archivo: ' + error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública del archivo');
  }

  return {
    type: 'file',
    url: publicUrlData.publicUrl,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
  };
}

export function parseFileAttachment(content: string): FileAttachment | null {
  if (!content || !content.startsWith('{"type":"file"')) {
    return null;
  }
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === 'file' && parsed.url && parsed.name) {
      return parsed as FileAttachment;
    }
  } catch {
    return null;
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
