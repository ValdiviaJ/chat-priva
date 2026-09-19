import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { useToast } from '../common/Toast';
import { uploadAudioBlob } from '../../services/storageService';

interface VoiceRecorderProps {
  roomId: string;
  onSendVoice: (voicePayload: string) => Promise<boolean>;
  disabled?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  roomId,
  onSendVoice,
  disabled = false,
  onRecordingChange,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      cleanupStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (disabled || isRecording || isUploading) return;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Tu navegador no soporta grabación de voz', 'warning');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);
      onRecordingChange?.(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      showToast('Permiso de micrófono denegado o no disponible', 'error');
      cleanupStream();
      onRecordingChange?.(false);
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    setIsRecording(false);
    setRecordSeconds(0);
    audioChunksRef.current = [];
    onRecordingChange?.(false);
  };

  const finishAndSend = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (timerRef.current) clearInterval(timerRef.current);
    const duration = Math.max(1, recordSeconds);

    setIsUploading(true);
    setIsRecording(false);
    onRecordingChange?.(false);

    mediaRecorderRef.current.onstop = async () => {
      cleanupStream();
      try {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size < 500) {
          showToast('Nota de voz demasiado corta', 'info');
          setIsUploading(false);
          return;
        }

        const audioAttachment = await uploadAudioBlob(roomId, audioBlob, duration);
        const payload = JSON.stringify(audioAttachment);
        const success = await onSendVoice(payload);

        if (!success) {
          showToast('No se pudo enviar la nota de voz', 'error');
        }
      } catch (err: any) {
        console.error('Error uploading voice note:', err);
        showToast(err.message || 'Error al subir nota de voz', 'error');
      } finally {
        setIsUploading(false);
        setRecordSeconds(0);
        audioChunksRef.current = [];
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 rounded-xl animate-in fade-in duration-200 text-xs text-rose-600 dark:text-rose-400">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
        <span className="font-mono font-semibold">{formatTimer(recordSeconds)}</span>

        <button
          type="button"
          onClick={cancelRecording}
          className="p-1.5 hover:bg-rose-200 dark:hover:bg-rose-900/80 rounded-lg text-rose-600 dark:text-rose-300 transition-colors ml-1 cursor-pointer"
          title="Cancelar grabación"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={finishAndSend}
          className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer ml-0.5 shadow-sm"
          title="Enviar nota de voz"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled || isUploading}
      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
      title="Grabar nota de voz"
    >
      {isUploading ? (
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};
