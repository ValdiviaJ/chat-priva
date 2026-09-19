import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Code2, Loader2, X } from 'lucide-react';
import { useToast } from '../common/Toast';
import { uploadChatFile, formatFileSize } from '../../services/storageService';

interface MessageInputProps {
  roomId?: string;
  onSendMessage: (content: string) => Promise<boolean>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  roomId,
  onSendMessage,
  onTyping,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Límite de 25MB para adjuntos
    if (file.size > 25 * 1024 * 1024) {
      showToast('El archivo supera el límite de 25 MB', 'warning');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    e.target.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isUploading || disabled) return;

    // 1. Si hay archivo seleccionado, primero subimos el archivo
    if (selectedFile) {
      if (!roomId) {
        showToast('No se detectó la sala para subir el archivo', 'error');
        return;
      }

      try {
        setIsUploading(true);
        const attachment = await uploadChatFile(roomId, selectedFile);
        const filePayload = JSON.stringify(attachment);
        const success = await onSendMessage(filePayload);

        if (success) {
          setSelectedFile(null);
        } else {
          showToast('No se pudo enviar el archivo al chat', 'error');
        }
      } catch (err: any) {
        console.error('Error al subir archivo:', err);
        showToast(err.message || 'Error al subir el archivo a Supabase Storage', 'error');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // 2. Si es mensaje de texto normal
    const trimmed = content.trim();
    if (!trimmed) return;

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

  const canSend = (content.trim().length > 0 || selectedFile !== null) && !isSubmitting && !isUploading && !disabled;

  return (
    <footer className="p-4 sm:p-6 bg-white dark:bg-[#080d1a] border-t border-slate-200 dark:border-transparent shrink-0 sticky bottom-0 z-20 transition-colors">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Seleccionar archivo"
        />

        {/* Selected File Preview Box */}
        {selectedFile && (
          <div className="mb-2.5 p-2.5 px-3.5 bg-blue-50/80 dark:bg-[#131e33] border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-1 duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Quitar archivo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative rounded-2xl bg-slate-50 dark:bg-[#111927] border border-slate-300 dark:border-[#1e2a40] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all p-3.5 sm:p-4 shadow-sm dark:shadow-lg dark:shadow-black/20">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSubmitting || isUploading}
            placeholder={selectedFile ? 'Presiona Enviar para compartir el archivo...' : 'Escribe tu mensaje aquí...'}
            rows={2}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed min-h-[48px] max-h-36"
            aria-label="Escribir mensaje"
          />

          {/* Action icons bar at bottom of textarea */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200 dark:border-slate-800/40">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                title="Adjuntar archivo o imagen"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleInsertEmoji('😊')}
                disabled={disabled || isUploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                title="Emojis"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleInsertSnippet}
                disabled={disabled || isUploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
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
              aria-label="Enviar mensaje o archivo"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 -translate-y-[0.5px] translate-x-[0.5px]" />
              )}
            </button>
          </div>
        </div>
      </form>
    </footer>
  );
};

