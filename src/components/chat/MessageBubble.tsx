import React, { useState } from 'react';
import type { Message } from '../../types/database';
import { formatMessageTime } from '../../utils/formatDate';
import {
  Check,
  CheckCheck,
  FileText,
  Download,
  ExternalLink,
  Reply,
  Smile,
  Pencil,
  Trash2,
  Copy,
  Pin,
  X,
} from 'lucide-react';
import { getUserName } from '../../utils/clientId';
import { formatFileSize, type FileAttachment } from '../../services/storageService';
import { parseMessageContent, type QuotedMessage, type ParsedPayload } from '../../types/chatPayloads';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  otherUsername?: string | null;
  onMediaLoad?: () => void;
  onReply?: (replyTarget: QuotedMessage) => void;
  reactions?: { [emoji: string]: string[] };
  onToggleReaction?: (messageId: string, emoji: string) => void;
  isRead?: boolean;
  isOtherOnline?: boolean;
  onEdit?: (messageId: string, newText: string) => Promise<boolean>;
  onDelete?: (messageId: string) => Promise<boolean>;
  onPin?: (messageId: string) => void;
  isPinned?: boolean;
  onImageClick?: (file: FileAttachment) => void;
  searchQuery?: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '😢'];

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  isMe,
  otherUsername,
  onMediaLoad,
  onReply,
  reactions = {},
  onToggleReaction,
  isRead = false,
  isOtherOnline = false,
  onEdit,
  onDelete,
  onPin,
  isPinned = false,
  onImageClick,
  searchQuery = '',
}) => {
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const formattedTime = formatMessageTime(message.created_at);
  const myName = getUserName() || 'Tú';

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

  const parsed = parseMessageContent(message.content);

  // Extract inner payload & reply data if this message is a reply
  let replyData: QuotedMessage | null = null;
  let activePayload: ParsedPayload = parsed;

  while (activePayload.kind === 'reply') {
    replyData = activePayload.reply.replyTo;
    activePayload = activePayload.innerPayload;
  }

  // Text summary for replying or copying
  const getMessageSummary = (): string => {
    if (activePayload.kind === 'file') {
      return activePayload.file.mimeType.startsWith('image/')
        ? '📷 Imagen'
        : `📎 Archivo: ${activePayload.file.name}`;
    }
    if (activePayload.kind === 'audio') {
      return '🎤 Nota de voz';
    }
    return activePayload.kind === 'text' ? activePayload.text : '';
  };

  const handleReplyClick = () => {
    if (onReply) {
      onReply({
        id: message.id,
        text: getMessageSummary(),
        senderName: isMe ? 'Tú' : (otherUsername || 'Anónimo'),
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getMessageSummary());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleStartEdit = () => {
    if (activePayload.kind === 'text') {
      setEditText(activePayload.text);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !onEdit) return;
    await onEdit(message.id, editText.trim());
    setIsEditing(false);
  };

  const scrollToQuotedMessage = (id: string) => {
    const target = document.getElementById(`msg-${id}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => {
        target.classList.remove('ring-2', 'ring-blue-400');
      }, 1500);
    }
  };

  const renderHighlightedText = (text: string) => {
    if (!searchQuery || !searchQuery.trim()) return text;
    const q = searchQuery.trim();
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-amber-300 dark:bg-amber-400 text-slate-900 rounded-xs px-0.5 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Reactions active entries
  const reactionEntries = Object.entries(reactions).filter(([_, users]) => users.length > 0);

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex w-full items-end gap-2.5 mb-4 animate-in fade-in slide-in-from-bottom-1 duration-150 transition-all rounded-2xl ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Other user avatar with initials */}
      {!isMe && (
        <div
          className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1c2e4e] border border-slate-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center shrink-0 mb-1 select-none"
          title={otherUsername || 'Anónimo'}
        >
          {getOtherInitials()}
        </div>
      )}

      {/* Floating Action Bar on hover */}
      <div
        className={`absolute -top-7 ${
          isMe ? 'right-10' : 'left-10'
        } z-30 hidden group-hover:flex items-center gap-1 bg-white dark:bg-[#152033] border border-slate-200 dark:border-[#23334d] rounded-full px-2 py-0.5 shadow-md text-xs transition-opacity duration-150`}
      >
        {/* Reply */}
        <button
          type="button"
          onClick={handleReplyClick}
          className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
          title="Responder"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        {/* Copy Text */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
          title="Copiar texto"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Pin Message */}
        {onPin && (
          <button
            type="button"
            onClick={() => onPin(message.id)}
            className={`p-1 transition-colors cursor-pointer ${
              isPinned
                ? 'text-amber-500'
                : 'text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400'
            }`}
            title={isPinned ? 'Desfijar' : 'Fijar mensaje'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Edit Message (if my text message) */}
        {isMe && activePayload.kind === 'text' && onEdit && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title="Editar mensaje"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete Message (if my message) */}
        {isMe && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="p-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="Eliminar mensaje"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Quick Reactions */}
        <div className="flex items-center gap-0.5">
          {QUICK_EMOJIS.slice(0, 3).map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onToggleReaction?.(message.id, emoji)}
              className="p-0.5 hover:scale-125 transition-transform text-xs cursor-pointer"
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowReactionMenu((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            title="Más reacciones"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reaction Popover */}
        {showReactionMenu && (
          <div className="absolute top-8 left-0 flex items-center gap-1 bg-white dark:bg-[#162235] border border-slate-200 dark:border-slate-700 rounded-full p-1.5 shadow-lg z-40">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onToggleReaction?.(message.id, emoji);
                  setShowReactionMenu(false);
                }}
                className="hover:scale-125 p-1 transition-transform text-sm cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={`max-w-[85%] sm:max-w-[70%] md:max-w-[55%] rounded-2xl px-4 py-3 shadow-sm text-sm relative break-words leading-relaxed ${
          isMe
            ? 'bg-[#1e69ff] text-white rounded-br-sm shadow-blue-500/10'
            : 'bg-white dark:bg-[#182336] text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-[#23334d]/60 shadow-xs'
        } ${isPinned ? 'ring-2 ring-amber-400/80 shadow-amber-400/10' : ''}`}
      >
        {/* Pinned Tag if pinned */}
        {isPinned && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 mb-1">
            <Pin className="w-3 h-3 rotate-45" />
            <span>Mensaje fijado</span>
          </div>
        )}

        {/* Quoted Message preview inside bubble */}
        {replyData && (
          <div
            onClick={() => scrollToQuotedMessage(replyData!.id)}
            className={`mb-2.5 p-2 rounded-xl text-xs cursor-pointer transition-colors border-l-3 ${
              isMe
                ? 'bg-blue-700/60 hover:bg-blue-700/80 border-white text-blue-50'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-blue-500 text-slate-700 dark:text-slate-200'
            }`}
            title="Ir al mensaje original"
          >
            <p className="font-semibold text-[11px] opacity-90 flex items-center gap-1">
              <Reply className="w-3 h-3 rotate-180" />
              <span>{replyData.senderName}</span>
            </p>
            <p className="truncate line-clamp-1 opacity-80 mt-0.5">
              {replyData.text}
            </p>
          </div>
        )}

        {/* Payload Content rendering */}
        {activePayload.kind === 'file' ? (
          activePayload.file.mimeType.startsWith('image/') ? (
            <div className="space-y-2">
              <div
                onClick={() => onImageClick?.(activePayload.kind === 'file' ? activePayload.file : (null as any))}
                className="block overflow-hidden rounded-xl group relative border border-black/10 dark:border-white/10 cursor-pointer"
              >
                <img
                  src={activePayload.file.url}
                  alt={activePayload.file.name}
                  loading="lazy"
                  onLoad={onMediaLoad}
                  className="max-h-72 w-full object-cover rounded-xl group-hover:opacity-95 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-medium">
                  <ExternalLink className="w-4 h-4" />
                  <span>Ver imagen completa</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] opacity-80 pt-0.5">
                <span className="truncate max-w-[200px]">{activePayload.file.name}</span>
                <span>{formatFileSize(activePayload.file.size)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-1">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isMe
                    ? 'bg-blue-700/80 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                }`}
              >
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs truncate max-w-[200px]" title={activePayload.file.name}>
                  {activePayload.file.name}
                </p>
                <p className={`text-[11px] ${isMe ? 'text-blue-100/70' : 'text-slate-500 dark:text-slate-400'}`}>
                  {formatFileSize(activePayload.file.size)}
                </p>
              </div>
              <a
                href={activePayload.file.url}
                download={activePayload.file.name}
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
        ) : activePayload.kind === 'audio' ? (
          <VoiceMessagePlayer
            url={activePayload.audio.url}
            duration={activePayload.audio.duration}
            isMe={isMe}
          />
        ) : isEditing ? (
          /* Inline Editing Box */
          <div className="space-y-2 py-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === 'Escape') setIsEditing(false);
              }}
              autoFocus
              rows={2}
              className="w-full bg-white/10 text-white rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/50 resize-none"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-2.5 py-1 rounded-lg bg-white text-blue-600 font-semibold cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap select-text selection:bg-blue-300 selection:text-slate-900 leading-relaxed text-[13.5px]">
            {renderHighlightedText(activePayload.text)}
          </p>
        )}

        {/* Time and Read Status */}
        <div
          className={`text-[11px] mt-1.5 flex items-center justify-end gap-1 select-none ${
            isMe ? 'text-blue-100/80' : 'text-slate-400 dark:text-slate-400'
          }`}
        >
          <span>{formattedTime}</span>
          {isMe && (
            <span title={isRead ? 'Leído' : isOtherOnline ? 'Entregado' : 'Enviado'}>
              {isRead ? (
                <CheckCheck className="w-4 h-4 inline text-sky-300 dark:text-sky-300 drop-shadow-xs" />
              ) : isOtherOnline ? (
                <CheckCheck className="w-4 h-4 inline text-blue-200/90" />
              ) : (
                <Check className="w-3.5 h-3.5 inline text-blue-200/75" />
              )}
            </span>
          )}
        </div>

        {/* Reactions Chips list */}
        {reactionEntries.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-2 pt-1 border-t ${
              isMe ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            {reactionEntries.map(([emoji, users]) => {
              const hasReacted = users.includes(myName);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleReaction?.(message.id, emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    hasReacted
                      ? isMe
                        ? 'bg-blue-800 text-white ring-1 ring-white/30'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 ring-1 ring-blue-400/40'
                      : isMe
                      ? 'bg-blue-700/50 hover:bg-blue-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                  title={users.join(', ')}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px]">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Current user initials avatar */}
      {isMe && (
        <div
          className="w-8 h-8 rounded-full bg-blue-100 dark:bg-[#1a2b47] border border-blue-300 dark:border-blue-500/40 text-blue-600 dark:text-blue-300 font-semibold text-xs flex items-center justify-center shrink-0 mb-1 select-none"
          title={myName}
        >
          {getMyInitials()}
        </div>
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
