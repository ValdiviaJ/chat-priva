import React from 'react';
import { CreateRoom } from '../components/room/CreateRoom';
import { JoinRoom } from '../components/room/JoinRoom';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { MessageSquare, ShieldCheck, Zap, Lock } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-4 h-4 fill-current" />
          </div>
          <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-white">
            QuickChat
          </span>
        </div>
        <ThemeToggle className="bg-transparent border-0 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80" />
      </header>

      {/* Main Focus Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl w-full mx-auto">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Conversaciones privadas directas.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Sin cuentas ni registros. Una sala temporal creada solo para dos personas en tiempo real.
          </p>
        </div>

        {/* Action Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <CreateRoom />
          <JoinRoom />
        </div>

        {/* Minimal Guarantees Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Límite estricto de 2 personas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Tiempo real instantáneo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Sin contraseñas</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-800/60 font-mono">
        QuickChat · Comunicación efímera 1 a 1
      </footer>
    </div>
  );
};



