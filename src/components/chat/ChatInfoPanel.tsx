import React, { useState } from 'react';
import {
  MessageSquare,
  Pencil,
  Trash2,
  Download,
  X,
  Copy,
  Check,
  Share2,
  Lock,
  Timer,
} from 'lucide-react';
import type { Room, Message } from '../../types/database';
import { useToast } from '../common/Toast';

interface ChatInfoPanelProps {
  room: Room;
  messages: Message[];
  chatTitle: string;
  onRename: (newTitle: string) => void;
  onDeleteRoom: () => void;
  isOpen: boolean;
  onClose: () => void;
  ephemeralSeconds?: number;
  onUpdateEphemeralSeconds?: (seconds: number) => void;
}

export const ChatInfoPanel: React.FC<ChatInfoPanelProps> = ({
  room,
  messages,
  chatTitle,
  onRename,
  onDeleteRoom,
  isOpen,
  onClose,
  ephemeralSeconds = 0,
  onUpdateEphemeralSeconds,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(chatTitle);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { showToast } = useToast();

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onRename(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      showToast('Código copiado al portapapeles', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast('No se pudo copiar el código', 'error');
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/chat/${room.code}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast('Enlace de invitación copiado', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  };

  const handleExportChat = () => {
    try {
      const textContent = messages
        .map((m) => `[${new Date(m.created_at).toLocaleString()}] ${m.content}`)
        .join('\n\n');

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-${room.code}-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Conversación exportada exitosamente', 'success');
    } catch {
      showToast('Error al exportar la conversación', 'error');
    }
  };

  const formattedCreatedDate = (() => {
    try {
      const d = new Date(room.created_at || Date.now());
      return `Creado el ${d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}, ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Creado recientemente';
    }
  })();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed xl:static top-0 right-0 bottom-0 z-50 w-80 bg-white dark:bg-[#0c121e] border-l border-slate-200 dark:border-[#1a2333] flex flex-col p-6 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-[#1a2333]">
          <h3 className="font-semibold text-base text-slate-900 dark:text-white">Información del chat</h3>
          <button
            onClick={onClose}
            className="xl:hidden p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar panel de información"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {/* Avatar and Title */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-[#162744] flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-400/30 dark:border-blue-500/20">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    autoFocus
                    className="w-full bg-slate-100 dark:bg-[#151f32] text-slate-900 dark:text-white text-sm px-2 py-1 rounded border border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base truncate">
                    {chatTitle || `Sala ${room.code}`}
                  </h4>
                  <button
                    onClick={() => {
                      setTempTitle(chatTitle);
                      setIsEditingTitle(true);
                    }}
                    className="opacity-60 hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-opacity cursor-pointer"
                    title="Renombrar conversación"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formattedCreatedDate}</p>
            </div>
          </div>

          {/* Quick Code & Link Share */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131b2c] border border-slate-200 dark:border-[#1e2a42] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Código de sala
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tracking-wider">{room.code}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleCopyCode}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-[#1a253a] dark:hover:bg-[#22304b] text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
                <span>Copiar código</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/30 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                )}
                <span>Copiar enlace</span>
              </button>
            </div>
          </div>

          {/* Resumen */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Resumen
            </h5>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Conversación privada 1 a 1. Solo dos personas pueden participar. Puedes editar el nombre
              de este chat o compartir el enlace de acceso.
            </p>
          </div>

          {/* Mensajes Temporales */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-500" />
              <span>Mensajes Temporales</span>
            </h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
              Los mensajes se ocultarán automáticamente tras el tiempo elegido.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Desactivado', val: 0 },
                { label: '5 minutos', val: 300 },
                { label: '1 hora', val: 3600 },
                { label: '24 horas', val: 86400 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    onUpdateEphemeralSeconds?.(opt.val);
                    showToast(
                      opt.val === 0
                        ? 'Mensajes temporales desactivados'
                        : `Mensajes temporales configurados a ${opt.label}`,
                      'info'
                    );
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer text-center ${
                    ephemeralSeconds === opt.val
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold'
                      : 'bg-slate-100 dark:bg-[#131b2c] border-slate-200 dark:border-[#1e2a42] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-1">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Acciones
            </h5>

            <button
              onClick={() => {
                setTempTitle(chatTitle);
                setIsEditingTitle(true);
              }}
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#131b2c] transition-colors text-sm text-left cursor-pointer"
            >
              <Pencil className="w-4 h-4 text-slate-400" />
              <span>Renombrar</span>
            </button>

            <button
              onClick={onDeleteRoom}
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-sm text-left cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
              <span>Eliminar conversación</span>
            </button>

            <button
              onClick={handleExportChat}
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#131b2c] transition-colors text-sm text-left cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Exportar chat</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
