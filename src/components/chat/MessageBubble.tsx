import React from 'react';
import type { Message } from '../../types/database';
import { formatMessageTime } from '../../utils/formatDate';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, isMe }) => {
  const formattedTime = formatMessageTime(message.created_at);

  return (
    <div
      className={'flex w-full ' + (isMe ? 'justify-end' : 'justify-start') + ' mb-2.5 animate-in fade-in slide-in-from-bottom-1 duration-150'}
    >
      <div
        className={'max-w-[85%] sm:max-w-[70% md:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm text-sm relative break-words leading-relaxed ' +
          (isMe
            ? 'bg-indigo-600 text-white rounded-br-xs shadow-indigo-500/10'
            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-bl-xs shadow-slate-200/40 dark:shadow-none')}
      >
        <p className='whitespace-pre-wrap select-text selection:bg-indigo-300 selection:text-slate-900'>
          {message.content}
        </p>
        <div
          className={'text-[10px] mt-1 text-right select-none font-medium ' + (isMe ? 'text-indigo-200/90' : 'text-slate-400 dark:text-slate-500')}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
