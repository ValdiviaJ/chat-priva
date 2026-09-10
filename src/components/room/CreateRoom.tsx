import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../services/roomService';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../common/Toast';
import { Copy, Check, ArrowRight, Loader2, KeyRound, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      const { room } = await createRoom(nickname.trim() || undefined);
      setCreatedRoomCode(room.code);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#ec4899'],
        });
      } catch {
        // Ignorar errores de confetti
      }
    } catch (err: any) {
      showToast(err.message || 'Error al crear la sala', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (!createdRoomCode) return;
    try {
      await navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      showToast('Codigo copiado al portapapeles', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('No se pudo copiar automaticamente', 'error');
    }
  };

  const enterChat = () => {
    if (createdRoomCode) {
      navigate(`/chat/${createdRoomCode}`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {!createdRoomCode ? (
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="create-nickname"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Tu nombre o apodo (opcional)
            </label>
            <input
              id="create-nickname"
              type="text"
              maxLength={20}
              placeholder="Ej. Alex"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Si lo dejas vacio, te identificaras como Anonimo.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando sala segura...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Crear Nueva Sala</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <KeyRound className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Tu sala esta lista!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparte este codigo de 8 caracteres con la persona con quien deseas chatear:
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="font-mono font-bold text-2xl tracking-widest text-indigo-600 dark:text-indigo-400 select-all">
              {createdRoomCode}
            </span>
            <button
              onClick={copyCode}
              type="button"
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title="Copiar codigo"
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={enterChat}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer"
            >
              <span>Entrar al chat ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};