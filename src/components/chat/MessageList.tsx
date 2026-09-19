import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import type { Message, Participant } from '../../types/database';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ArrowDown, MessageSquare, Timer } from 'lucide-react';
import type { QuotedMessage } from '../../types/chatPayloads';
import type { ReactionMap } from '../../hooks/usePresence';
import { soundManager } from '../../utils/sound';

interface MessageListProps {
  messages: Message[];
  currentParticipant: Participant;
  isOtherTyping: boolean;
  otherUsername?: string | null;
  onReply?: (replyTarget: QuotedMessage) => void;
  reactions?: ReactionMap;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  lastReadMessageId?: string | null;
  sendReadReceipt?: (messageId: string) => void;
  isOtherOnline?: boolean;
  ephemeralSeconds?: number;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentParticipant,
  isOtherTyping,
  otherUsername,
  onReply,
  reactions = {},
  onToggleReaction,
  lastReadMessageId = null,
  sendReadReceipt,
  isOtherOnline = false,
  ephemeralSeconds = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isFirstLoadRef = useRef(true);
  const lastKnownCountRef = useRef(messages.length);

  // Filter ephemeral messages if timer is active
  const now = Date.now();
  const visibleMessages = ephemeralSeconds > 0
    ? messages.filter((msg) => {
        const ageSecs = (now - new Date(msg.created_at).getTime()) / 1000;
        return ageSecs <= ephemeralSeconds;
      })
    : messages;

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

    // If scrolled to bottom, mark last message as read
    if (isNear && visibleMessages.length > 0 && sendReadReceipt) {
      const lastMsg = visibleMessages[visibleMessages.length - 1];
      if (lastMsg.sender_id !== currentParticipant?.id) {
        sendReadReceipt(lastMsg.id);
      }
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (!containerRef.current) return;
    if (smooth) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  // Initial scroll to bottom
  useLayoutEffect(() => {
    if (isFirstLoadRef.current && visibleMessages.length > 0) {
      scrollToBottom(false);
      const timer = setTimeout(() => {
        scrollToBottom(false);
      }, 60);
      isFirstLoadRef.current = false;
      return () => clearTimeout(timer);
    }
  }, [visibleMessages.length]);

  // Handle new incoming messages (sound + auto-scroll + read receipt)
  useEffect(() => {
    if (visibleMessages.length === 0) return;
    if (isFirstLoadRef.current) return;

    const lastMessage = visibleMessages[visibleMessages.length - 1];
    const sentByMe = lastMessage?.sender_id === currentParticipant?.id;

    // Check if new message was appended
    if (visibleMessages.length > lastKnownCountRef.current) {
      if (!sentByMe) {
        soundManager.playIncomingMessageSound();
        if (checkIfNearBottom() && sendReadReceipt) {
          sendReadReceipt(lastMessage.id);
        }
      }
    }
    lastKnownCountRef.current = visibleMessages.length;

    if (sentByMe || checkIfNearBottom()) {
      scrollToBottom(true);
    }
  }, [visibleMessages, currentParticipant?.id, sendReadReceipt]);

  // When other user starts typing
  useEffect(() => {
    if (isOtherTyping && checkIfNearBottom()) {
      scrollToBottom(true);
    }
  }, [isOtherTyping]);

  const handleMediaLoad = () => {
    if (checkIfNearBottom()) {
      scrollToBottom(false);
    }
  };

  // Compute read index for double-blue-check status
  const lastReadIndex = lastReadMessageId
    ? visibleMessages.findIndex((m) => m.id === lastReadMessageId)
    : -1;

  const formatEphemeralText = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.round(secs / 60)} min`;
    return `${Math.round(secs / 3600)} h`;
  };

  return (
    <div className="relative flex-1 min-h-0 bg-slate-50 dark:bg-[#080d1a] transition-colors overflow-hidden flex flex-col">
      {/* Ephemeral Notice Banner */}
      {ephemeralSeconds > 0 && (
        <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-center gap-1.5 shrink-0 select-none">
          <Timer className="w-3.5 h-3.5 animate-pulse" />
          <span>Mensajes temporales activados: expiran en {formatEphemeralText(ephemeralSeconds)}</span>
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-8 py-6 focus:outline-none"
      >
        {visibleMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
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
          <div className="flex flex-col min-h-full max-w-4xl w-full mx-auto">
            <div className="mt-auto space-y-1 w-full">
              {visibleMessages.map((msg, index) => {
                const isMe = msg.sender_id === currentParticipant.id;
                const isRead = isMe && lastReadIndex !== -1 && index <= lastReadIndex;

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isMe={isMe}
                    otherUsername={otherUsername}
                    onMediaLoad={handleMediaLoad}
                    onReply={onReply}
                    reactions={reactions[msg.id] || {}}
                    onToggleReaction={onToggleReaction}
                    isRead={isRead}
                    isOtherOnline={isOtherOnline}
                  />
                );
              })}
              {isOtherTyping && <TypingIndicator />}
              <div ref={bottomRef} className="h-1 shrink-0" />
            </div>
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
