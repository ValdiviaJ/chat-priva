import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

interface EmojiCategory {
  name: string;
  emojis: string[];
}

const CATEGORIES: EmojiCategory[] = [
  {
    name: 'Caritas y Emociones',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎', '🤓', '🧐', '🥳', '😏', '🤔', '🤫', '🫡', '😳', '🥺', '😭', '🤯', '😱', '😴', '🥱', '🤢', '🤮', '🤧', '😵'],
  },
  {
    name: 'Gestos y Personas',
    emojis: ['👍', '👎', '👏', '🙌', '👐', '🤝', '✌️', '🤞', '🤟', '🤘', '🤙', '🖐️', '✋', '👌', '🤌', '👈', '👉', '👆', '👇', '☝️', '👊', '🤛', '🤜', '💪', '🙏', '✍️', '💅', '🤳', '🙋‍♂️', '🙋‍♀️', '🤷‍♂️', '🤷‍♀️'],
  },
  {
    name: 'Reacciones y Amor',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '⭐', '🌟', '💥', '💯', '💢', '💨', '💫', '🎉', '🎊', '🎈', '🚀'],
  },
  {
    name: 'Objetos y Símbolos',
    emojis: ['👀', '👁️', '💡', '⚡', '☕', '🍕', '🍻', '🍔', '🎮', '💻', '📱', '🎧', '📷', '🎬', '📚', '🔒', '🔑', '🛡️', '📌', '📎', '⏰', '⌛', '💎', '🏆', '🎯', '⚽', '🏀', '🌍', '✅', '❌', '⚠️'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onClose, onSelectEmoji }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredEmojis = search.trim()
    ? CATEGORIES.flatMap((c) => c.emojis).filter((emoji) => emoji.includes(search.trim()))
    : null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-16 left-2 sm:left-4 z-50 w-72 sm:w-80 bg-white dark:bg-[#101826] border border-slate-200 dark:border-[#1e2a40] rounded-2xl shadow-xl shadow-black/15 dark:shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Search Header */}
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar emoji..."
            autoFocus
            className="w-full bg-slate-100 dark:bg-[#162235] text-xs text-slate-900 dark:text-slate-100 pl-8 pr-2.5 py-1.5 rounded-lg border border-transparent focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Tabs if not searching */}
      {!search.trim() && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-2 py-1 gap-1 text-[11px] overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(idx)}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer font-medium ${
                activeCategory === idx
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {cat.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2.5 max-h-56 overflow-y-auto grid grid-cols-7 sm:grid-cols-8 gap-1 scrollbar-thin">
        {filteredEmojis ? (
          filteredEmojis.length > 0 ? (
            filteredEmojis.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                  onClose();
                }}
                className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {emoji}
              </button>
            ))
          ) : (
            <p className="col-span-full text-center text-xs text-slate-400 py-4">
              No se encontraron emojis
            </p>
          )
        ) : (
          CATEGORIES[activeCategory].emojis.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelectEmoji(emoji);
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {emoji}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
