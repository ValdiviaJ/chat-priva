import React from 'react';
import type { Message } from '../../types/database';
import { formatMessageTime } from '../../utils/formatDate';
import { Check, Bot, User } from 'lucide-react';
import { getUserName } from '../../utils/clientId';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, isMe }) => {
  const formattedTime = formatMessageTime(message.created_at);

  const getMyInitials = () => {
    const name = getUserName() || 'Angel Valdivia';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`flex w-full items-end gap-3 mb-4 animate-in fade-in slide-in-from-bottom-1 duration-150 ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Other user avatar (robot/bot/user icon like in Modelo.png) */}
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1c2e4e] border border-slate-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mb-1">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[70%] md:max-w-[55%] rounded-2xl px-4 py-3 shadow-sm text-sm relative break-words leading-relaxed ${
          isMe
            ? 'bg-[#1e69ff] text-white rounded-br-sm shadow-blue-500/10'
            : 'bg-white dark:bg-[#182336] text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-[#23334d]/60 shadow-xs'
        }`}
      >
        <p className="whitespace-pre-wrap select-text selection:bg-blue-300 selection:text-slate-900 leading-relaxed text-[13.5px]">
          {message.content}
        </p>

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

