import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import type { Message, Participant } from '../../types/database';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ArrowDown, MessageSquare } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentParticipant: Participant;
  isOtherTyping: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentParticipant,
  isOtherTyping,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isFirstLoadRef = useRef(true);

  const checkIfNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    const threshold = 120;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const isNear = checkIfNearBottom();
    setShowScrollBottom(!isNear);
  };

  const scrollToBottom = (smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  useLayoutEffect(() => {
    if (isFirstLoadRef.current && messages.length > 0) {
      scrollToBottom(false);
      isFirstLoadRef.current = false;
    }
  }, [messages.length]);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const sentByMe = lastMessage?.sender_id === currentParticipant?.id;

    if (sentByMe || checkIfNearBottom()) {
      scrollToBottom(true);
    }
  }, [messages, currentParticipant?.id]);


  useEffect(() => {
    if (isOtherTyping && checkIfNearBottom()) {
      scrollToBottom(true);
    }
  }, [isOtherTyping]);

  return (
    <div className='relative flex-1 min-h-0 bg-slate-50/50 dark:bg-slate-950/40'>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className='h-full overflow-y-auto px-4 py-4 flex flex-col scroll-smooth'
      >
        {messages.length === 0 ? (
          <div className='m-auto flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 max-w-sm'>
            <div className='w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-3'>
              <MessageSquare className='w-6 h-6' />
            </div>
            <p className='font-medium text-slate-700 dark:text-slate-300 text-sm mb-1'>
              Aún no hay mensajes
            </p>
            <p className='text-xs text-slate-400 dark:text-slate-500'>
              Envía el primero para comenzar la conversación
            </p>
          </div>
        ) : (
          <div className='flex flex-col justify-end min-h-full'>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.sender_id === currentParticipant.id}
              />
            ))}
            {isOtherTyping && <TypingIndicator />}
            <div ref={bottomRef} className='h-1' />
          </div>
        )}
      </div>

      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className='absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 text-xs font-medium transition-all duration-200'
          aria-label='Ir al final de la conversación'
        >
          <ArrowDown className='w-3.5 h-3.5' />
          <span>Nuevo mensaje</span>
        </button>
      )}
    </div>
  );
};
