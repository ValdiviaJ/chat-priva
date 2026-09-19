import React from 'react';
import type { Message } from '../../types/database';
import { formatMessageTime } from '../../utils/formatDate';
import { Check, FileText, Download, ExternalLink } from 'lucide-react';
import { getUserName } from '../../utils/clientId';
import { parseFileAttachment, formatFileSize } from '../../services/storageService';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  otherUsername?: string | null;
  onMediaLoad?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, isMe, otherUsername, onMediaLoad }) => {
  const formattedTime = formatMessageTime(message.created_at);
  const attachment = parseFileAttachment(message.content);

  const getMyInitials = () => {
    const name = getUserName() || 'Anónimo';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getOtherInitials = () => {
    const name = otherUsername || 'Anónimo';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isImage = attachment && attachment.mimeType.startsWith('image/');

  return (
    <div
      className={`flex w-full items-end gap-3 mb-4 animate-in fade-in slide-in-from-bottom-1 duration-150 ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Other user avatar with initials */}
      {!isMe && (
        <div
          className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1c2e4e] border border-slate-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center shrink-0 mb-1"
          title={otherUsername || 'Anónimo'}
        >
          {getOtherInitials()}
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[70%] md:max-w-[55%] rounded-2xl px-4 py-3 shadow-sm text-sm relative break-words leading-relaxed ${
          isMe
            ? 'bg-[#1e69ff] text-white rounded-br-sm shadow-blue-500/10'
            : 'bg-white dark:bg-[#182336] text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-[#23334d]/60 shadow-xs'
        }`}
      >
        {attachment ? (
          isImage ? (
            <div className="space-y-2">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl group relative border border-black/10 dark:border-white/10"
              >
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  loading="lazy"
                  onLoad={onMediaLoad}
                  className="max-h-72 w-full object-cover rounded-xl group-hover:opacity-95 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-medium">
                  <ExternalLink className="w-4 h-4" />
                  <span>Ver imagen completa</span>
                </div>
              </a>
              <div className="flex items-center justify-between text-[11px] opacity-80 pt-0.5">
                <span className="truncate max-w-[200px]">{attachment.name}</span>
                <span>{formatFileSize(attachment.size)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-1">
              <div className={`p-2.5 rounded-xl shrink-0 ${isMe ? 'bg-blue-700/80 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs truncate max-w-[200px]" title={attachment.name}>
                  {attachment.name}
                </p>
                <p className={`text-[11px] ${isMe ? 'text-blue-100/70' : 'text-slate-500 dark:text-slate-400'}`}>
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              <a
                href={attachment.url}
                download={attachment.name}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  isMe
                    ? 'hover:bg-blue-700 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Descargar archivo"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )
        ) : (
          <p className="whitespace-pre-wrap select-text selection:bg-blue-300 selection:text-slate-900 leading-relaxed text-[13.5px]">
            {message.content}
          </p>
        )}

        <div
          className={`text-[11px] mt-1.5 flex items-center justify-end gap-1 select-none ${
            isMe ? 'text-blue-100/80' : 'text-slate-400 dark:text-slate-400'
          }`}
        >
          <span>{formattedTime}</span>
          {isMe && <Check className="w-3.5 h-3.5 inline text-blue-200" />}
        </div>
      </div>

      {/* Current user initials avatar (AJ badge as seen in Modelo.png) */}
      {isMe && (
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-[#1a2b47] border border-blue-300 dark:border-blue-500/40 text-blue-600 dark:text-blue-300 font-semibold text-xs flex items-center justify-center shrink-0 mb-1">
          {getMyInitials()}
        </div>
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

