import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateRoomForJoin, joinRoom } from '../../services/roomService';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../common/Toast';
import { LogIn, Loader2, ArrowRight } from 'lucide-react';
import { setUserName } from '../../utils/clientId';

export const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(val);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 8) {
      showToast('El código debe tener exactamente 8 caracteres', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      const result = await validateRoomForJoin(cleanCode);
      if (!result.valid) {
        showToast(result.reason || 'No es posible unirse a esta sala', 'error');
        return;
      }

      const chosenNickname = nickname.trim() || 'Anónimo';
      setUserName(chosenNickname);

      await joinRoom(cleanCode, chosenNickname);
      navigate(`/chat/${cleanCode}`);
    } catch (err: any) {
      showToast(err.message || 'Error al intentar unirse', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-[#1a2333] rounded-2xl p-6 sm:p-8 shadow-xl transition-all duration-300">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <form onSubmit={handleJoin} className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="join-code"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Código de la sala
          </label>
          <input
            id="join-code"
            type="text"
            placeholder="Ej. A7F92KX4"
            value={code}
            onChange={handleCodeChange}
            maxLength={8}
            autoComplete="off"
            spellCheck="false"
            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#131b2c] border border-slate-200 dark:border-[#1f2c44] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-lg tracking-widest uppercase"
            disabled={isLoading}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            La persona que creó la sala debió compartirte este código.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="join-nickname"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Tu nombre o apodo (opcional)
          </label>
          <input
            id="join-nickname"
            type="text"
            maxLength={20}
            placeholder="Ej. Alex (o dejar vacío para Anónimo)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#131b2c] border border-slate-200 dark:border-[#1f2c44] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            disabled={isLoading}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Si lo dejas vacío, tu apodo visible será <strong>Anónimo</strong>.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || code.trim().length !== 8}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-[#1e69ff] hover:bg-blue-600 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando código...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Unirse al Chat</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

