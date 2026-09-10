import React from 'react';
import { CreateRoom } from '../components/room/CreateRoom';
import { JoinRoom } from '../components/room/JoinRoom';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Shield, Lock, Zap, Users } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between transition-colors">
      <header className="px-6 py-4 flex items-center justify-between max-w-6l w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
            PrivateChat
          </span>
        </div>
        <ThemeToggle />
      </header>


      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4l w-full mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-100 dark:border-indigo-900/40">
            <Lock className="w-3.5 h-3.5" /> Sin cuentas · Sin registros
          </div>
          <h1 className="text-3l sm:text-5l font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Un chat privado. <br className="hidden sm:inline" />
            <span className="text-indigo-600 dark:text-indigo-400">Solo dos personas.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Crea una conversación y comparte el código. La comunicación se realiza en tiempo real y solo entre ambos.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3l">
          <CreateRoom />
          <JoinRoom />
        </div>


        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Tiempo real instantáneo</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Límite estricto de 2 personas</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Identidad 100% lónima</span>
          </div>
        </div>
      </main>


      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        PrivateChat · Mensajesía privada y efímera 1 a 1
      </footer>
    </div>
  );
};
