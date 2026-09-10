import React from 'react';
import { Loader2, Shield } from 'lucide-react';

export const LoadingScreen: React.FC< { message?: string }> = ({
  message = 'Cargando conversación...',
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
          <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <h2 className="text-lg font-semibold mb-2">{message}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Estableciendo conexión privada y segura...
        </p>
      </div>
    </div>
  );
};
