import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface MessageSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalMatches: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export const MessageSearchBar: React.FC<MessageSearchBarProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  totalMatches,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        // Let parent open if not open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="h-12 px-4 sm:px-6 bg-slate-100 dark:bg-[#0d1524] border-b border-slate-200 dark:border-[#1a2333] flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150 shrink-0 z-25">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar en la conversación..."
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
        {searchQuery.trim() && (
          <span className="font-mono">
            {totalMatches > 0 ? `${currentMatchIndex + 1} de ${totalMatches}` : '0 resultados'}
          </span>
        )}

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onPrevMatch}
            disabled={totalMatches === 0}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="Anterior coincidencia"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextMatch}
            disabled={totalMatches === 0}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="Siguiente coincidencia"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ml-1"
          title="Cerrar búsqueda (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
