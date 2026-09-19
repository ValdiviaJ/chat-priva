import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Code2, Loader2, X, Reply } from 'lucide-react';
import { useToast } from '../common/Toast';
import { uploadChatFile, formatFileSize } from '../../services/storageService';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import type { QuotedMessage } from '../../types/chatPayloads';

interface MessageInputProps {
  roomId?: string;
  onSendMessage: (content: string) => Promise<boolean>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  replyingTo?: QuotedMessage | null;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  roomId,
  onSendMessage,
  onTyping,
  disabled = false,
  replyingTo,
  onCancelReply,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  // Focus textarea when replying to a message
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    onTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          if (file.size > 25 * 1024 * 1024) {
            showToast('La imagen pegada supera el límite de 25 MB', 'warning');
            return;
          }
          setSelectedFile(file);
          showToast('Imagen capturada y lista para enviar', 'info');
          return;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        showToast('El archivo supera el límite de 25 MB', 'warning');
        return;
      }
      setSelectedFile(file);
      showToast(`Archivo "${file.name}" preparado`, 'info');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    // 1. If file is selected
    if (selectedFile) {
      if (!roomId) {
        showToast('No se detectó la sala para subir el archivo', 'error');
        return;
      }

      try {
        setIsUploading(true);
        const attachment = await uploadChatFile(roomId, selectedFile);
        let filePayload = JSON.stringify(attachment);

        if (replyingTo) {
          filePayload = JSON.stringify({
            type: 'reply',
            replyTo: replyingTo,
            content: filePayload,
          });
        }

        const success = await onSendMessage(filePayload);
        if (success) {
          setSelectedFile(null);
          onCancelReply?.();
        } else {
          showToast('No se pudo enviar el archivo al chat', 'error');
        }
      } catch (err: any) {
        console.error('Error al subir archivo:', err);
        showToast(err.message || 'Error al subir el archivo', 'error');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // 2. If normal text message
    const trimmed = content.trim();
    if (!trimmed) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTyping(false);

    setIsSubmitting(true);
    let finalPayload = trimmed;
    if (replyingTo) {
      finalPayload = JSON.stringify({
        type: 'reply',
        replyTo: replyingTo,
        content: trimmed,
      });
    }

    const success = await onSendMessage(finalPayload);
    if (success) {
      setContent('');
      onCancelReply?.();
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
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart || content.length;
      const end = textareaRef.current.selectionEnd || content.length;
      const newText = content.substring(0, start) + emoji + content.substring(end);
      setContent(newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length;
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      setContent((prev) => prev + emoji);
    }
  };

  const canSend = (content.trim().length > 0 || selectedFile !== null) && !isSubmitting && !isUploading && !disabled;

  return (
    <footer
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-3.5 sm:p-5 bg-white dark:bg-[#080d1a] border-t border-slate-200 dark:border-slate-800/80 shrink-0 sticky bottom-0 z-20 transition-all ${
        isDragging ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
      }`}
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Seleccionar archivo"
        />

        {/* Replying To Banner Preview */}
        {replyingTo && (
          <div className="mb-2.5 p-2 px-3 bg-blue-50/90 dark:bg-[#111c30] border-l-3 border-blue-500 rounded-r-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-1">
            <div className="min-w-0 flex-1 mr-2">
              <p className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 text-[11px]">
                <Reply className="w-3 h-3 rotate-180" />
                <span>Respondiendo a {replyingTo.senderName}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-300 truncate text-[11px] mt-0.5">
                {replyingTo.text}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Cancelar respuesta"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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

        {/* Main Textarea Container */}
        <div className="relative rounded-2xl bg-slate-50 dark:bg-[#111927] border border-slate-300 dark:border-[#1e2a40] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all p-3 sm:p-3.5 shadow-sm dark:shadow-lg dark:shadow-black/20">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled || isSubmitting || isUploading}
            placeholder={
              selectedFile
                ? 'Presiona Enviar para compartir el archivo...'
                : 'Escribe tu mensaje aquí (o pega una captura con Ctrl+V)...'
            }
            rows={1}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed min-h-[44px] max-h-36"
            aria-label="Escribir mensaje"
          />

          {/* Action icons bar at bottom of textarea */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200 dark:border-slate-800/40">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Attachment button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                title="Adjuntar archivo o imagen"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Emoji Picker toggle */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                disabled={disabled || isUploading}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
                  showEmojiPicker
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Selector de emojis"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Code Snippet button */}
              <button
                type="button"
                onClick={handleInsertSnippet}
                disabled={disabled || isUploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                title="Insertar bloque de código"
              >
                <Code2 className="w-4 h-4" />
              </button>

              {/* Voice Recorder button */}
              <VoiceRecorder
                roomId={roomId || ''}
                onSendVoice={async (voicePayload) => {
                  let final = voicePayload;
                  if (replyingTo) {
                    final = JSON.stringify({
                      type: 'reply',
                      replyTo: replyingTo,
                      content: voicePayload,
                    });
                    onCancelReply?.();
                  }
                  return await onSendMessage(final);
                }}
                disabled={disabled || isSubmitting || isUploading}
              />
            </div>

            {/* Blue Send Button */}
            <button
              type="submit"
              disabled={!canSend}
              className="h-9 w-9 rounded-xl bg-[#1e69ff] hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-[#1e69ff] text-white flex items-center justify-center transition-all duration-200 shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer"
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

        {/* Emoji Picker Popover */}
        <EmojiPicker
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelectEmoji={handleInsertEmoji}
        />
      </form>
    </footer>
  );
};
