import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Code2 } from 'lucide-react';
import { useToast } from '../common/Toast';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<boolean>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    onTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSubmitting || disabled) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTyping(false);

    setIsSubmitting(true);
    const success = await onSendMessage(trimmed);
    if (success) {
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInsertSnippet = () => {
    setContent((prev) => prev + (prev.endsWith('\n') || !prev ? '```\n\n```' : '\n```\n\n```'));
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleInsertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const canSend = content.trim().length > 0 && !isSubmitting && !disabled;

  return (
    <footer className="p-4 sm:p-6 bg-[#080d1a] shrink-0 sticky bottom-0 z-20">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl bg-[#111927] border border-[#1e2a40] focus-within:border-blue-500/80 transition-all p-3.5 sm:p-4 shadow-lg shadow-black/20">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSubmitting}
            placeholder="Escribe tu mensaje aquí..."
            rows={2}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 resize-none focus:outline-none leading-relaxed min-h-[48px] max-h-36"
            aria-label="Escribir mensaje"
          />

          {/* Action icons bar at bottom of textarea, exactly as in Modelo.png */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/40">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => showToast('Subida de archivos temporalmente no requerida', 'info')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Adjuntar archivo"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleInsertEmoji('😊')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Emojis"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleInsertSnippet}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Insertar bloque de código"
              >
                <Code2 className="w-4 h-4" />
              </button>
            </div>

            {/* Blue Send Button */}
            <button
              type="submit"
              disabled={!canSend}
              className="h-10 w-10 rounded-xl bg-[#1e69ff] hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-[#1e69ff] text-white flex items-center justify-center transition-all duration-200 shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4 -translate-y-[0.5px] translate-x-[0.5px]" />
            </button>
          </div>
        </div>
      </form>
    </footer>
  );
};

