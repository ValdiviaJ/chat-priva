import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { useMessages } from '../hooks/useMessages';
import { usePresence } from '../hooks/usePresence';
import { useWebRTC } from '../hooks/useWebRTC';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatInfoPanel } from '../components/chat/ChatInfoPanel';
import { MessageSearchBar } from '../components/chat/MessageSearchBar';
import { PinnedMessageBar } from '../components/chat/PinnedMessageBar';
import { ImageLightbox } from '../components/chat/ImageLightbox';
import { CallModal } from '../components/chat/CallModal';
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
import { parseMessageContent, type QuotedMessage } from '../types/chatPayloads';
import type { FileAttachment } from '../services/storageService';
import { triggerPanicMode } from '../utils/panicMode';
import { requestNotificationPermission, showBrowserNotification } from '../utils/notifications';
import { getClientId } from '../utils/clientId';
import { deriveRoomKey } from '../utils/crypto';

export const ChatPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { room, currentParticipant, loading: roomLoading, error: roomError, isFull } = useRoom(roomId);
  const [e2eeKey, setE2eeKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    if (room?.code) {
      deriveRoomKey(room.code).then((key) => {
        setE2eeKey(key);
      }).catch((err) => {
        console.error('Error deriving room E2EE key:', err);
      });
    }
  }, [room?.code]);

  const {
    isOtherOnline,
    otherUsername,
    isOtherTyping,
    setTyping,
    isOtherRecordingAudio,
    setIsRecordingAudio,
    connectionState,
    pinnedMessageId,
    setPinnedMessage,
    reactions,
    toggleReaction,
    lastReadMessageId,
    sendReadReceipt,
    ephemeralSeconds,
    updateEphemeralSeconds,
  } = usePresence(room?.id);

  const {
    messages,
    loading: messagesLoading,
    sending,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useMessages(room?.id, e2eeKey);

  const {
    callState,
    callType,
    remoteName,
    callDuration,
    isAudioMuted,
    isVideoDisabled,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMuteAudio,
    toggleVideo,
  } = useWebRTC(room?.id);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [chatTitle, setChatTitle] = useState('');
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<QuotedMessage | null>(null);

  // Search in chat state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  // Request notification permission when entering room
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Notify incoming messages if window is not focused
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    const myId = getClientId();

    if (lastMsg.sender_id !== myId) {
      const parsed = parseMessageContent(lastMsg.content);
      let text = 'Nuevo mensaje';
      if (parsed.kind === 'text') text = parsed.text;
      else if (parsed.kind === 'file') text = `📎 Archivo: ${parsed.file.name}`;
      else if (parsed.kind === 'audio') text = '🎤 Nota de voz';

      showBrowserNotification(otherUsername || 'Nuevo mensaje recibido', text);
    }
  }, [messages.length, otherUsername]);

  // Global shortcuts: Ctrl+F (search) and Double-Escape (Panic Mode)
  useEffect(() => {
    let lastEscPress = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscPress < 600) {
          // Double tap Escape detected -> Panic Mode
          triggerPanicMode();
        }
        lastEscPress = now;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute matched messages for search
  const matchedMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m) => {
        const parsed = parseMessageContent(m.content);
        if (parsed.kind === 'text') return parsed.text.toLowerCase().includes(q);
        if (parsed.kind === 'file') return parsed.file.name.toLowerCase().includes(q);
        return false;
      })
      .map((m) => m.id);
  }, [messages, searchQuery]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 1500);
    }
  };

  const handleNextMatch = () => {
    if (matchedMessageIds.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchedMessageIds.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMessage(matchedMessageIds[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchedMessageIds.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchedMessageIds.length) % matchedMessageIds.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMessage(matchedMessageIds[prevIdx]);
  };

  // Extract all images in chat for Lightbox gallery
  const allImages = useMemo(() => {
    const list: FileAttachment[] = [];
    messages.forEach((m) => {
      const parsed = parseMessageContent(m.content);
      if (parsed.kind === 'file' && parsed.file.mimeType.startsWith('image/')) {
        list.push(parsed.file);
      } else if (
        parsed.kind === 'reply' &&
        parsed.innerPayload.kind === 'file' &&
        parsed.innerPayload.file.mimeType.startsWith('image/')
      ) {
        list.push(parsed.innerPayload.file);
      }
    });
    return list;
  }, [messages]);

  const handleImageClick = (file: FileAttachment) => {
    const idx = allImages.findIndex((img) => img.url === file.url);
    if (idx !== -1) {
      setLightboxIndex(idx);
    } else {
      setLightboxIndex(0);
    }
  };

  // Find pinned message object
  const pinnedMessage = useMemo(() => {
    if (!pinnedMessageId) return null;
    return messages.find((m) => m.id === pinnedMessageId) || null;
  }, [messages, pinnedMessageId]);

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

  if (roomLoading || (!e2eeKey && !roomError) || (messagesLoading && !roomError)) {
    return <LoadingScreen message="Conectando y descifrando sala segura..." />;
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
          ephemeralSeconds={ephemeralSeconds}
          isOtherTyping={isOtherTyping}
          isOtherRecordingAudio={isOtherRecordingAudio}
          onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
          onStartVoiceCall={() => startCall('voice', otherUsername || 'Anónimo')}
          onStartVideoCall={() => startCall('video', otherUsername || 'Anónimo')}
          isE2EEReady={Boolean(e2eeKey)}
        />

        {/* Pinned Message Banner */}
        <PinnedMessageBar
          pinnedMessage={pinnedMessage}
          onUnpin={() => setPinnedMessage(null)}
          onScrollToMessage={scrollToMessage}
        />

        {/* Message Search Bar */}
        <MessageSearchBar
          isOpen={isSearchOpen}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchQuery('');
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setCurrentMatchIndex(0);
          }}
          totalMatches={matchedMessageIds.length}
          currentMatchIndex={currentMatchIndex}
          onNextMatch={handleNextMatch}
          onPrevMatch={handlePrevMatch}
        />

        <MessageList
          messages={messages}
          currentParticipant={currentParticipant}
          isOtherTyping={isOtherTyping}
          otherUsername={otherUsername}
          onReply={setReplyingTo}
          reactions={reactions}
          onToggleReaction={toggleReaction}
          lastReadMessageId={lastReadMessageId}
          sendReadReceipt={sendReadReceipt}
          isOtherOnline={isOtherOnline}
          ephemeralSeconds={ephemeralSeconds}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onPin={setPinnedMessage}
          pinnedMessageId={pinnedMessageId}
          onImageClick={handleImageClick}
          searchQuery={searchQuery}
          isOtherRecordingAudio={isOtherRecordingAudio}
        />

        <MessageInput
          roomId={room.id}
          onSendMessage={handleSendMessage}
          onTyping={setTyping}
          disabled={sending}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onRecordingChange={setIsRecordingAudio}
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
        ephemeralSeconds={ephemeralSeconds}
        onUpdateEphemeralSeconds={updateEphemeralSeconds}
      />

      {/* Fullscreen Image Lightbox Gallery */}
      <ImageLightbox
        images={allImages}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />

      {/* WebRTC Voice/Video Call Modal */}
      <CallModal
        callState={callState}
        callType={callType}
        remoteName={remoteName}
        callDuration={callDuration}
        isAudioMuted={isAudioMuted}
        isVideoDisabled={isVideoDisabled}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        remoteAudioRef={remoteAudioRef}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={() => endCall(true)}
        onToggleMuteAudio={toggleMuteAudio}
        onToggleVideo={toggleVideo}
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
