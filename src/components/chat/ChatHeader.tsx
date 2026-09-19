import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pencil,
  Info,
  Menu,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Timer,
  Search,
  Phone,
  Video,
  Lock,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { InstallPwaButton } from '../common/InstallPwaButton';
import type { Room, Participant } from '../../types/database';
import { soundManager } from '../../utils/sound';

interface ChatHeaderProps {
  room: Room;
  currentParticipant: Participant;
  isOtherOnline: boolean;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  chatTitle: string;
  onRename: (newTitle: string) => void;
  onToggleSidebar: () => void;
  onToggleInfoPanel: () => void;
  ephemeralSeconds?: number;
  isOtherTyping?: boolean;
  isOtherRecordingAudio?: boolean;
  onToggleSearch?: () => void;
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
  isE2EEReady?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  room,
  currentParticipant,
  isOtherOnline,
  connectionState,
  chatTitle,
  onRename,
  onToggleSidebar,
  onToggleInfoPanel,
  ephemeralSeconds = 0,
  isOtherTyping = false,
  isOtherRecordingAudio = false,
  onToggleSearch,
  onStartVoiceCall,
  onStartVideoCall,
  isE2EEReady = false,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(chatTitle);
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted());

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onRename(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const formattedActivity = (() => {
    if (isOtherRecordingAudio) return 'Grabando nota de voz...';
    if (isOtherTyping) return 'Escribiendo...';
    return isOtherOnline ? 'En línea' : 'Última actividad: reciente';
  })();

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#080d1a] border-b border-slate-200 dark:border-[#1a2333] flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors">
      {/* Left: Mobile sidebar toggle + Title & Activity */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Abrir conversaciones"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
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
                  className="bg-slate-100 dark:bg-[#151f32] text-slate-900 dark:text-white text-sm font-semibold px-2 py-0.5 rounded border border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs cursor-pointer"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  {chatTitle || `Sala ${room.code}`}
                </h1>
                <button
                  onClick={() => {
                    setTempTitle(chatTitle);
                    setIsEditingTitle(true);
                  }}
                  className="opacity-60 hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-opacity cursor-pointer"
                  title="Editar nombre"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {connectionState === 'disconnected' ? (
              <span title="Sin conexión" className="text-rose-500 dark:text-rose-400 flex items-center">
                <WifiOff className="w-3.5 h-3.5" />
              </span>
            ) : connectionState === 'connecting' ? (
              <span title="Conectando..." className="text-amber-500 dark:text-amber-400 flex items-center">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isOtherOnline ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-slate-500'
              }`}
            />
            <span>{formattedActivity}</span>
          </div>
        </div>
      </div>

      {/* Right: Audio toggle + Info toggle + Theme toggle */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {isE2EEReady && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium"
            title="Cifrado de Extremo a Extremo (E2EE) activo"
          >
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">E2EE</span>
          </div>
        )}

        {ephemeralSeconds > 0 && (
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium cursor-pointer"
            onClick={onToggleInfoPanel}
            title="Mensajes temporales activos"
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Temporal</span>
          </div>
        )}

        {/* Search in chat */}
        {onToggleSearch && (
          <button
            type="button"
            onClick={onToggleSearch}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Buscar en la conversación (Ctrl+F)"
            aria-label="Buscar en el chat"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* Voice Call */}
        {onStartVoiceCall && (
          <button
            type="button"
            onClick={onStartVoiceCall}
            disabled={!isOtherOnline}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
            title={isOtherOnline ? 'Llamada de voz' : 'El otro usuario debe estar en línea para llamar'}
            aria-label="Llamada de voz"
          >
            <Phone className="w-5 h-5" />
          </button>
        )}

        {/* Video Call */}
        {onStartVideoCall && (
          <button
            type="button"
            onClick={onStartVideoCall}
            disabled={!isOtherOnline}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
            title={isOtherOnline ? 'Videollamada' : 'El otro usuario debe estar en línea para videollamada'}
            aria-label="Videollamada"
          >
            <Video className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            const next = soundManager.toggleMute();
            setIsMuted(next);
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          title={isMuted ? 'Activar sonido de mensajes' : 'Silenciar sonido de mensajes'}
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-rose-500" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onToggleInfoPanel}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="Ver información del chat"
          aria-label="Información del chat"
        >
          <Info className="w-5 h-5" />
        </button>

        <InstallPwaButton className="hidden sm:inline-flex" />
        <ThemeToggle className="bg-transparent border-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80" />
      </div>
    </header>
  );
};

