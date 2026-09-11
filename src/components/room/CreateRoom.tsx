import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../services/roomService';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../common/Toast';
import { Copy, Check, ArrowRight, Loader2, KeyRound, Sparkles, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
          colors: ['#3b82f6', '#1d4ed8', '#60a5fa'],
        });
      } catch {
        // Ignorar
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
      setCopiedCode(true);
      showToast('Código copiado al portapapeles', 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      showToast('No se pudo copiar automáticamente', 'error');
    }
  };

  const copyLink = async () => {
    if (!createdRoomCode) return;
    try {
      const shareUrl = `${window.location.origin}/chat/${createdRoomCode}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast('Enlace directo copiado al portapapeles', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  };

  const enterChat = () => {
    if (createdRoomCode) {
      navigate(`/chat/${createdRoomCode}`);
    }
  };

  return (
    <div className="bg-[#0c121e] border border-[#1a2333] rounded-2xl p-6 sm:p-8 shadow-xl transition-all duration-300">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {!createdRoomCode ? (
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="create-nickname"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Tu nombre o apodo (opcional)
            </label>
            <input
              id="create-nickname"
              type="text"
              maxLength={20}
              placeholder="Ej. Angel Valdivia"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 bg-[#131b2c] border border-[#1f2c44] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400">
              Si lo dejas vacío, te identificarás con tu apodo por defecto.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-[#1e69ff] hover:bg-blue-600 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
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
        <div className="text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex p-3 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <KeyRound className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              ¡Tu sala está lista!
            </h3>
            <p className="text-xs text-slate-400">
              Comparte el código o el enlace con la persona con quien deseas chatear:
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 p-3.5 bg-[#131b2c] border border-[#1f2c44] rounded-xl">
            <span className="font-mono font-bold text-2xl tracking-widest text-blue-400 select-all">
              {createdRoomCode}
            </span>
            <button
              onClick={copyCode}
              type="button"
              className="p-2 hover:bg-[#1c2840] rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copiar código"
            >
              {copiedCode ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copyLink}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#131b2c] hover:bg-[#1a253c] border border-[#1f2c44] text-slate-200 font-medium text-xs rounded-xl transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-blue-400" />}
              <span>Copiar enlace</span>
            </button>

            <button
              onClick={enterChat}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#1e69ff] hover:bg-blue-600 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <span>Entrar al chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};