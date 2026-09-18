import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { useMessages } from '../hooks/useMessages';
import { usePresence } from '../hooks/usePresence';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatInfoPanel } from '../components/chat/ChatInfoPanel';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { ShieldAlert, Users, ArrowLeft, Trash2 } from 'lucide-react';
import {
  getSavedConversations,
  saveConversation,
  updateConversationTitle,
  removeConversation,
  type SavedConversation,
} from '../services/conversationStorage';
import { supabase } from '../services/supabase';

export const ChatPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { room, currentParticipant, loading: roomLoading, error: roomError, isFull } = useRoom(roomId);
  const { messages, loading: messagesLoading, sending, sendMessage } = useMessages(room?.id);
  const { isOtherOnline, otherUsername, isOtherTyping, setTyping, connectionState } = usePresence(room?.id);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [chatTitle, setChatTitle] = useState('');
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load conversations list from localStorage
  useEffect(() => {
    setConversations(getSavedConversations());
  }, []);

  // Sync current room with conversations list and title
  useEffect(() => {
    if (room) {
      const existing = getSavedConversations().find(
        (c) => c.code === room.code || c.id === room.id
      );

      // Determine display title: custom renamed title > other user nickname > default "Anónimo"
      const title = existing?.title && existing.title !== 'Hola, ¿cómo estás?'
        ? existing.title
        : otherUsername || 'Anónimo';

      if (!isCustomTitle) {
        setChatTitle(title);
      }

      const lastMsg = messages[messages.length - 1]?.content;

      saveConversation({
        id: room.id,
        code: room.code,
        title,
        lastMessage: lastMsg || 'Conversación iniciada',
        lastActivity: room.last_activity || new Date().toISOString(),
        icon: 'message',
      });

      setConversations(getSavedConversations());
    }
  }, [room, messages.length, otherUsername, isCustomTitle]);

  const handleRename = (newTitle: string) => {
    setChatTitle(newTitle);
    setIsCustomTitle(true);
    if (room) {
      updateConversationTitle(room.code, newTitle);
      setConversations(getSavedConversations());
      showToast('Nombre actualizado', 'success');
    }
  };

  const handleDeleteRoom = async () => {
    if (!room) return;
    setIsDeleting(true);
    try {
      await supabase.from('rooms').delete().eq('id', room.id);
      removeConversation(room.code);
      showToast('Conversación eliminada definitivamente', 'info');
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting room:', err);
      showToast('Error al eliminar la conversación', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (roomLoading || (messagesLoading && !roomError)) {
    return <LoadingScreen message="Conectando a QuickChat..." />;
  }

  if (isFull) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#080d1a] text-slate-100">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-6 border border-amber-900/40">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Conversación completa</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Esta conversación ya tiene dos participantes activos. Por privacidad y seguridad, no es posible ingresar.
          </p>
          <Button
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full bg-blue-600 hover:bg-blue-500"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  if (roomError || !room || !currentParticipant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#080d1a] text-slate-100">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-6 border border-rose-900/40">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No se pudo acceder</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {roomError || 'Esta conversación no existe o fue eliminada definitivamente.'}
          </p>
          <Button
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full bg-blue-600 hover:bg-blue-500"
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
    <div className="h-screen h-[100dvh] flex bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeRoomCode={room.code}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => navigate('/')}
      />

      {/* Main Chat View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50 dark:bg-[#080d1a]">
        <ChatHeader
          room={room}
          currentParticipant={currentParticipant}
          isOtherOnline={isOtherOnline}
          connectionState={connectionState}
          chatTitle={chatTitle}
          onRename={handleRename}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onToggleInfoPanel={() => setInfoPanelOpen((prev) => !prev)}
        />

        <MessageList
          messages={messages}
          currentParticipant={currentParticipant}
          isOtherTyping={isOtherTyping}
          otherUsername={otherUsername}
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={setTyping}
          disabled={sending}
        />
      </div>

      {/* Right Info Panel */}
      <ChatInfoPanel
        room={room}
        messages={messages}
        chatTitle={chatTitle}
        onRename={handleRename}
        onDeleteRoom={() => setShowDeleteModal(true)}
        isOpen={infoPanelOpen}
        onClose={() => setInfoPanelOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar conversación"
      >
        <p className="text-sm text-rose-500 dark:text-rose-400 mb-2 font-semibold">
          Atención: Esta acción es irreversible.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          Se eliminará la sala completa y todos los mensajes asociados para ambas personas.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteRoom}
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Eliminar definitivamente
          </Button>
        </div>
      </Modal>
    </div>
  );
};

