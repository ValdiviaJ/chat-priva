import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

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


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 140) + 'px';
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


  const charCount = content.length;
  const isTooLong = charCount > 2000;
  const canSend = content.trim().length > 0 && !isTooLong && !isSubmitting && !disabled;


  return (
    <footer className='p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 sticky bottom-0 z-20'>
      <form onSubmit={handleSubmit} className='max-w-4l mx-auto flex items-end gap-2'>
        <div className='flex-1 relative rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all'>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSubmitting}
            placeholder='Escribe un mensaje...'
            rows={1}
            maxLength={2100}
            className='w-full max-h-36 py-3 pl-4 pr-16 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed'
            aria-label='Escribir mensaje'
          />
          {charCount > 1600 && (
            <span
              className={'absolute right-3.5 bottom-2 text-[10px] font-mono ' + (isTooLong ? 'text-rose-500 font-bold' : 'text-slate-400')}
            >
              {charCount}/2000
            </span>
          )}
        </div>


        <button
          type='submit'
          disabled={!canSend}
          className='h-11 w-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all duration-200 shadow-sm shrink-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          aria-label='Enviar mensaje'
        >
          <Send className='w-4 h-4' />
        </button>
      </form>
    </footer>
  );
};
