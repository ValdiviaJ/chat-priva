import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { useMessages } from '../hooks/useMessages';
import { usePresence } from '../hooks/usePresence';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { ShieldAlert, Users, ArrowLeft } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { room, currentParticipant, loading: roomLoading, error: roomError, isFull } = useRoom(roomId);
  const { messages, loading: messagesLoading, sending, sendMessage } = useMessages(room?.id);
  const { isOtherOnline, isOtherTyping, setTyping, connectionState } = usePresence(room?.id);

  if (roomLoading || (messagesLoading && !roomError)) {
    return <LoadingScreen message='Conectando a la conversación...' />;
  }

  if (isFull) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'>
        <div className='text-center max-w-sm'>
          <div className='w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-6 border border-amber-100 dark:border-amber-900/40'>
            <Users className='w-8 h-8' />
          </div>
          <h2 className='text-2xl font-bold mb-2'>Conversación completa</h2>
          <p className='text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed'>
            Esta conversación ya tiene dos participantes activos. Por privacidad y seguridad, no es posible ingresar.
          </p>
          <Button
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className='w-4 h-4' />}
            className='w-full'
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  if (roomError || !room || !currentParticipant) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'>
        <div className='text-center max-w-sm'>
          <div className='w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-6 border border-rose-100 dark:border-rose-900/40'>
            <ShieldAlert className='w-8 h-8' />
          </div>
          <h2 className='text-2xl font-bold mb-2'>No se pudo acceder</h2>
          <p className='text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed'>
            {roomError || 'Esta conversación no existe o fue eliminada definitivamente.'}
          </p>
          <Button
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className='w-4 h-4' />}
            className='w-full'
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (content: string): Promise<boolean> => {
    const success = await sendMessage(currentParticipant.id, content);
    if (!success) {
      showToast('No se pudo enviar el mensaje', 'error');
    }
    return success;
  };

  return (
    <div className='h-screen h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden'>
      <ChatHeader
        room={room}
        currentParticipant={currentParticipant}
        isOtherOnline={isOtherOnline}
        connectionState={connectionState}
      />

      <MessageList
        messages={messages}
        currentParticipant={currentParticipant}
        isOtherTyping={isOtherTyping}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={setTyping}
        disabled={sending}
      />
    </div>
  );
};
