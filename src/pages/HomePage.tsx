import React from 'react';
import { CreateRoom } from '../components/room/CreateRoom';
import { JoinRoom } from '../components/room/JoinRoom';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { MessageSquare, Lock, Zap, Users, Shield } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between transition-colors">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            QuickChat
          </span>
        </div>
        <ThemeToggle className="bg-transparent border-0 text-slate-400 hover:text-white hover:bg-slate-800/80" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl w-full mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-blue-500/20">
            <Lock className="w-3.5 h-3.5" /> Sin registros · Sin contraseñas
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
            Un chat privado. <br className="hidden sm:inline" />
            <span className="text-blue-500">Solo dos personas.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            Crea una conversación y comparte el código o el enlace. La comunicación se realiza en tiempo real y solo entre ambos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <CreateRoom />
          <JoinRoom />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Tiempo real instantáneo</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Límite estricto de 2 personas</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Identidad privada y segura</span>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-[#1a2333]">
        QuickChat · Mensajería privada y efímera 1 a 1
      </footer>
    </div>
  );
};

