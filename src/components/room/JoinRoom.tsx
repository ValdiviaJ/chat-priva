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
    if (cleanCode === '99999999' || cleanCode === 'DECOY999') {
      navigate('/decoy');
      return;
    }

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
    <div className="bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <form onSubmit={handleJoin} className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/60">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono text-xs font-semibold">
            02
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            Unirse a una sala
          </h2>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="join-code"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            Código de sala (8 caracteres)
          </label>
          <input
            id="join-code"
            type="text"
            placeholder="A7F92KX4"
            value={code}
            onChange={handleCodeChange}
            maxLength={8}
            autoComplete="off"
            spellCheck="false"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131b2c] border border-slate-200 dark:border-[#1f2c44] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono text-base tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="join-nickname"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400"
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
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131b2c] border border-slate-200 dark:border-[#1f2c44] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-500">
            Si lo dejas vacío, tu apodo visible será <strong>Anónimo</strong>.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || code.trim().length !== 8}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-medium text-sm rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando sala...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Unirse a la sala</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

