import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../services/roomService';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../common/Toast';
import { Copy, Check, ArrowRight, Loader2, Sparkles, Share2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { setUserName } from '../../utils/clientId';
import confetti from 'canvas-confetti';

export const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      const chosenNickname = nickname.trim() || 'Anónimo';
      setUserName(chosenNickname);

      const { room } = await createRoom(chosenNickname);
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

  const shareUrl = createdRoomCode ? `${window.location.origin}/chat/${createdRoomCode}` : '';

  return (
    <div className="bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {!createdRoomCode ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/60">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono text-xs font-semibold">
              01
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              Crear una sala
            </h2>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-nickname"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Tu nombre o apodo (opcional)
            </label>
            <input
              id="create-nickname"
              type="text"
              maxLength={20}
              placeholder="Ej. Alex (o dejar vacío para Anónimo)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131b2c] border border-slate-200 dark:border-[#1f2c44] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              Si lo dejas vacío, tu apodo visible será <strong>Anónimo</strong>.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando sala...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generar sala</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/60">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-xs font-semibold">
              ✓
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              Sala lista para compartir
            </h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Comparte este código o escanea el QR con tu celular para comenzar:
          </p>

          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-[#131b2c] border border-slate-200 dark:border-[#1f2c44] rounded-xl">
            <span className="font-mono font-bold text-xl tracking-wider text-blue-600 dark:text-blue-400 select-all">
              {createdRoomCode}
            </span>
            <button
              onClick={copyCode}
              type="button"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              title="Copiar código"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* QR Code toggle section */}
          {showQR && (
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 animate-in zoom-in-95 duration-150">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <QRCodeSVG value={shareUrl} size={160} level="M" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                Escanea con la cámara para ingresar inmediatamente
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={copyLink}
              type="button"
              className="flex items-center justify-center gap-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#131b2c] dark:hover:bg-[#1a253c] border border-slate-200 dark:border-[#1f2c44] text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer"
              title="Copiar enlace directo"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              <span className="hidden sm:inline">Enlace</span>
            </button>

            <button
              onClick={() => setShowQR((prev) => !prev)}
              type="button"
              className={`flex items-center justify-center gap-1 py-2 px-2.5 border text-xs font-medium rounded-xl transition-all cursor-pointer ${
                showQR
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500/50 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#131b2c] dark:hover:bg-[#1a253c] border-slate-200 dark:border-[#1f2c44] text-slate-700 dark:text-slate-300'
              }`}
              title="Mostrar u ocultar código QR"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-500" />
              <span>{showQR ? 'Ocultar' : 'Ver QR'}</span>
            </button>

            <button
              onClick={enterChat}
              type="button"
              className="flex items-center justify-center gap-1 py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-all cursor-pointer"
            >
              <span>Entrar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};