import type { FileAttachment } from '../services/storageService';

export interface AudioAttachment {
  type: 'audio';
  url: string;
  duration: number; // in seconds
  size: number;
}

export interface QuotedMessage {
  id: string;
  text: string;
  senderName: string;
}

export interface ReplyPayload {
  type: 'reply';
  replyTo: QuotedMessage;
  content: string; // The text content or JSON of attachment
}

export type ParsedPayload =
  | { kind: 'text'; text: string }
  | { kind: 'file'; file: FileAttachment }
  | { kind: 'audio'; audio: AudioAttachment }
  | { kind: 'reply'; reply: ReplyPayload; innerPayload: ParsedPayload };

export function parseMessageContent(raw: string): ParsedPayload {
  if (!raw) return { kind: 'text', text: '' };
  const trimmed = raw.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.type === 'file' && obj.url && obj.name) {
        return { kind: 'file', file: obj as FileAttachment };
      }
      if (obj.type === 'audio' && obj.url) {
        return { kind: 'audio', audio: obj as AudioAttachment };
      }
      if (obj.type === 'reply' && obj.replyTo && typeof obj.content === 'string') {
        const inner = parseMessageContent(obj.content);
        return {
          kind: 'reply',
          reply: obj as ReplyPayload,
          innerPayload: inner,
        };
      }
    } catch {
      // Fall through to plain text
    }
  }

  return { kind: 'text', text: raw };
}
