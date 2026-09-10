import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Copy,
  Check,
  MoreVertical,
  LogOut,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { supabase } from '../../services/supabase';
import type { Room, Participant } from '../../types/database';

interface ChatHeaderProps {
  room: Room;
  currentParticipant: Participant;
  isOtherOnline: boolean;
  connectionState: 'connected' | 'connecting' | 'disconnected';
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  room,
  currentParticipant,
  isOtherOnline,
  connectionState,
}) => {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      showToast('Código copiado: ' + room.code, 'success');
      setTimeout(() => setCopied(false), 2000);
      setMenuOpen(false);
    } catch {
      showToast('No se pudo copiar automáticamente', 'error');
    }
  };

  const handleExitChat = async () => {
    setActionLoading(true);
    try {
      if (currentParticipant?.id) {
        await supabase.from('participants').delete().eq('id', currentParticipant.id);
      }
      showToast('Saliste de la conversación', 'info');
      navigate('/');
    } catch (err: any) {
      console.error('Error leaving chat:', err);
      navigate('/');
    } finally {
      setActionLoading(false);
      setShowExitModal(false);
    }
  };

  const handleDeleteRoom = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', room.id);
      if (error) throw error;
      showToast('Conversación eliminada definitivamente', 'info');
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting room:', err);
      showToast('Error al eliminar la conversación', 'error');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
      }
  };

  return (
    <>
      <header className='h-16 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-30'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40'>
            <Shield className='w-5 h-5' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate'>
                Chat privado
              </h1>
              {connectionState === 'disconnected' ? (
                <span title='Sin conexión' className='text-rose-500 flex items-center'>
                  <WifiOff className='w-3.5 h-3.5' />
                </span>
              ) : connectionState === 'connecting' ? (
                <span title='Conectando...' className='text-amber-500 flex items-center'>
                  <Wifi className='w-3.5 h-3.5 animate-pulse' />
                </span>
              ) : null}
            </div>
            <div className='flex items-center gap-1.5 text-xs'>
              <span
                className={'w-2 h-2 rounded-full transition-colors ' + (isOtherOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600')}
              />
              <span className='text-slate-500 dark:text-slate-400 font-medium truncate'>
                {isOtherOnline ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-1.5 sm:gap-2'>
          <button
            onClick={handleCopyCode}
            className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-xs font-mono font-medium'
            title='Copiar código de la conversación'
            aria-label='Copiar código'
          >
            <span className='hidden sm:inline text-slate-400 font-sans'>Código:</span>
            <span className='font-bold tracking-wider'>{room.code}</span>
            {copied ? <
              Check className='w-3.5 h-3.5 text-emerald-500 shrink-0' /> : <Copy className='w-3.5 h-3.5 text-slate-400 shrink-0' />}
          </button>

          <ThemeToggle />

          <div className='relative'>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className='p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              aria-label='Menú de opciones'
            >
              <MoreVertical className='w-4 h-4' />
            </button>

            {menuOpen && (
              <>
                <div className='fixed inset-0 z-40' onClick={() => setMenuOpen(false)} />
                <div className='absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150'>
                  <button
                    onClick={handleCopyCode}
                    className='w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left'
                  >
                    <Copy className='w-4 h-4 text-slate-400' />
                    Copiar código
                  </button>

                  <div className='h-px bg-slate-100 dark:bg-slate-800 my-1' />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowExitModal(true);
                    }}
                    className='w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left'
                  >
                    <LogOut className='w-4 h-4 text-amber-500' />
                    Salir del chat
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteModal(true);
                    }}
                    className='w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left'
                  >
                    <Trash2 className='w-4 h-4' />
                    Eliminar conversación
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>


      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title='Salir de la conversación'
      >
        <p className='text-sm text-slate-600 dark:text-slate-300 mb-6'>
          ¿Seguro que quieres salir de este chat? El historial de mensajes se conservará.
        </p>
        <div className='flex justify-end gap-3'>
          <Button variant='secondary' onClick={() => setShowExitModal(false)}>
            Cancelar
          </Button>
          <Button
            variant='danger'
            onClick={handleExitChat}
            isLoading={actionLoading}
            leftIcon={<LogOut className='w-4 h-4' />}
          >
            Salir del chat
          </Button>
        </div>
      </Modal>


      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title='Eliminar conversación'
      >
        <p className='text-sm text-rose-600 dark:text-rose-400 mb-2 font-semibold'>
          Atención: Esta acción es irreversible.
        </p>
        <p className='text-sm text-slate-600 dark:text-slate-300 mb-6'>
          Se eliminará la sala completa y todos los mensajes y participantes asociados para ambas personas.
        </p>
        <div className='flex justify-end gap-3'>
          <Button variant='secondary' onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant='danger'
            onClick={handleDeleteRoom}
            isLoading={actionLoading}
            leftIcon={<Trash2 className='w-4 h-4' />}
          >
            Eliminar definitivamente
          </Button>
        </div>
      </Modal>
    </>
  );
};
