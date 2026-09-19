import React from 'react';
import { Pin, X } from 'lucide-react';
import type { Message } from '../../types/database';
import { parseMessageContent } from '../../types/chatPayloads';

interface PinnedMessageBarProps {
  pinnedMessage: Message | null;
  onUnpin: () => void;
  onScrollToMessage: (messageId: string) => void;
}

export const PinnedMessageBar: React.FC<PinnedMessageBarProps> = ({
  pinnedMessage,
  onUnpin,
  onScrollToMessage,
}) => {
  if (!pinnedMessage) return null;

  const parsed = parseMessageContent(pinnedMessage.content);
  let summary = '';
  if (parsed.kind === 'file') {
    summary = parsed.file.mimeType.startsWith('image/') ? '📷 Imagen' : `📎 ${parsed.file.name}`;
  } else if (parsed.kind === 'audio') {
    summary = '🎤 Nota de voz';
  } else if (parsed.kind === 'reply') {
    summary = 'Mensaje citado';
  } else {
    summary = parsed.text;
  }

  return (
    <div className="h-10 px-4 sm:px-6 bg-blue-50/80 dark:bg-[#0e1726] border-b border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-3 text-xs shrink-0 z-20 animate-in slide-in-from-top-1 duration-150">
      <div
        onClick={() => onScrollToMessage(pinnedMessage.id)}
        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
        title="Ver mensaje fijado"
      >
        <Pin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 rotate-45" />
        <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">Mensaje fijado:</span>
        <span className="truncate text-slate-700 dark:text-slate-300 group-hover:underline">
          {summary}
        </span>
      </div>

      <button
        type="button"
        onClick={onUnpin}
        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
        title="Desfijar mensaje"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
