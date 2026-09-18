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
    <div className="relative flex-1 min-h-0 bg-slate-50 dark:bg-[#080d1a] transition-colors">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 sm:px-8 py-6 flex flex-col scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800"
      >
        {messages.length === 0 ? (
          <div className="m-auto flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-[#131d2e] border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-1">
              Aún no hay mensajes
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Envía el primero para comenzar la conversación
            </p>
          </div>
        ) : (
          <div className="flex flex-col justify-end min-h-full max-w-4xl w-full mx-auto">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.sender_id === currentParticipant.id}
              />
            ))}
            {isOtherTyping && <TypingIndicator />}
            <div ref={bottomRef} className="h-1" />
          </div>
        )}
      </div>

      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/30 text-xs font-medium transition-all duration-200 cursor-pointer"
          aria-label="Ir al final de la conversación"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Nuevo mensaje</span>
        </button>
      )}
    </div>
  );
};

