import React, { useEffect, useState } from 'react';
import { EyeOff } from 'lucide-react';
import { triggerPanicMode } from './panicMode';

/**
 * Global Security & Privacy Listener
 * 1. Global Panic Shortcuts:
 *    - Triple Escape (press Escape 3 times in < 900ms)
 *    - Alt + Q or Alt + W
 *    Redirects instantly and purges local session data.
 *
 * 2. Privacy Blur (Anti-Shoulder Surfing):
 *    - When the browser window loses focus (window onblur or document hidden),
 *      it overlays a strong backdrop-blur layer concealing chat contents until focused again.
 */
export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    // Escape counter logic
    let escCount = 0;
    let escTimer: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut 1: Alt + Q -> Panic
      if (e.altKey && (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'w')) {
        e.preventDefault();
        triggerPanicMode();
        return;
      }

      // Shortcut 2: Triple Escape -> Panic
      if (e.key === 'Escape') {
        escCount += 1;
        if (escTimer) clearTimeout(escTimer);

        if (escCount >= 3) {
          triggerPanicMode();
          return;
        }

        escTimer = setTimeout(() => {
          escCount = 0;
        }, 900);
      }
    };

    // Privacy Blur handlers
    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setIsBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (escTimer) clearTimeout(escTimer);
    };
  }, []);

  return (
    <>
      <div className={`transition-[filter] duration-200 ${isBlurred ? 'filter blur-md select-none pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Discreet Privacy Overlay when blurred */}
      {isBlurred && (
        <div
          onClick={() => setIsBlurred(false)}
          className="fixed inset-0 z-9999 bg-slate-950/40 backdrop-blur-lg flex flex-col items-center justify-center text-slate-200 cursor-pointer select-none animate-in fade-in duration-150"
        >
          <div className="flex flex-col items-center p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl max-w-xs text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 text-blue-400">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Contenido oculto por privacidad</h3>
            <p className="text-xs text-slate-400 mb-3">Haz clic en cualquier lugar para restaurar la vista.</p>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Anti-Shoulder Surfing</span>
          </div>
        </div>
      )}
    </>
  );
};
