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
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import type { Room, Participant } from '../../types/database';

interface ChatHeaderProps {
  room: Room;
  currentParticipant: Participant;
  isOtherOnline: boolean;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  chatTitle: string;
  onRename: (newTitle: string) => void;
  onToggleSidebar: () => void;
  onToggleInfoPanel: () => void;
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
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(chatTitle);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onRename(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const formattedActivity = (() => {
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

      {/* Right: Info toggle + Theme toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleInfoPanel}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="Ver información del chat"
          aria-label="Información del chat"
        >
          <Info className="w-5 h-5" />
        </button>

        <ThemeToggle className="bg-transparent border-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80" />
      </div>
    </header>
  );
};

