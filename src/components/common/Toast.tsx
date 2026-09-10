import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Check } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: ToastItem | null;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr && curr.id === id ? null : curr));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
      <div className='fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4'>
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    </ToastContext.Provider>
  );
};

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  return (
    <div
      className={'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 ' +
        (type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
          : type === 'error'
          ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
          : type === 'warning'
          ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
          : 'bg-slate-900/90 dark:bg-slate-800/95 border-slate-700 text-white')}
    >
      <div className='flex items-center gap-2.5 min-w-0'>
        {type === 'success' && <CheckCircle2 className='w-5 h-5 text-emerald-500 shrink-0' />}
        {type === 'error' && <AlertCircle className='w-5 h-5 text-rose-500 shrink-0' />}
        {type === 'warning' && <AlertCircle className='w-5 h-5 text-amber-500 shrink-0' />}
        {type === 'info' && <Info className='w-5 h-5 text-indigo-400 shrink-0' />}
        <span className='text-sm font-medium leading-snug break-words'>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className='p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0'
          aria-label='Cerrar'
        >
          <X className='w-4 h-4' />
        </button>
      )}
    </div>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: null,
      showToast: (message: string) => console.log('Toast:', message),
      hideToast: () => {},
    };
  }
  return context;
}
