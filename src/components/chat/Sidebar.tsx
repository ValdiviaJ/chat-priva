import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Code2,
  Lightbulb,
  FileText,
  Plus,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react';
import { formatMessageTime } from '../../utils/formatDate';
import type { SavedConversation } from '../../services/conversationStorage';
import { getUserName, setUserName } from '../../utils/clientId';

interface SidebarProps {
  conversations: SavedConversation[];
  activeRoomCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeRoomCode,
  isOpen,
  onClose,
  onNewChat,
}) => {
  const navigate = useNavigate();
  const [userName, setUserNameState] = useState(getUserName());
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const getInitials = (name: string) => {
    if (!name) return 'AV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setUserNameState(tempName.trim());
    }
    setIsEditingName(false);
  };

  const renderIcon = (icon?: string) => {
    switch (icon) {
      case 'code':
        return <Code2 className="w-4 h-4 text-slate-400 group-hover:text-white" />;
      case 'lightbulb':
        return <Lightbulb className="w-4 h-4 text-slate-400 group-hover:text-white" />;
      case 'file':
        return <FileText className="w-4 h-4 text-slate-400 group-hover:text-white" />;
      case 'message':
      default:
        return <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-white" />;
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-[#0c121e] border-r border-[#1a2333] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              QuickChat
            </span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cerrar barra lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: Nueva conversación */}
        <div className="px-4 pb-4">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1e69ff] hover:bg-blue-600 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-blue-600/25 active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva conversación</span>
          </button>
        </div>

        {/* Conversations Label */}
        <div className="px-5 py-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Conversaciones
          </span>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-slate-400">No hay conversaciones guardadas.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Al unirte o crear un chat aparecerá aquí.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeRoomCode === conv.code;
              return (
                <button
                  key={conv.id || conv.code}
                  onClick={() => {
                    navigate(`/chat/${conv.code}`);
                    onClose();
                  }}
                  className={`w-full group text-left p-2.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#182338] border border-[#273550] shadow-sm'
                      : 'hover:bg-[#131b2c] border border-transparent'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive ? 'bg-blue-600/20 text-blue-400' : 'bg-[#192336] text-slate-400'
                    }`}
                  >
                    {renderIcon(conv.icon)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-sm font-medium truncate ${
                          isActive ? 'text-white font-semibold' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {conv.title || `Sala ${conv.code}`}
                      </h4>
                      {conv.lastActivity && (
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {formatMessageTime(conv.lastActivity)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate leading-relaxed">
                      {conv.lastMessage || `Código: ${conv.code}`}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-3.5 border-t border-[#1a2333] bg-[#0c121e]">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                autoFocus
                className="flex-1 bg-[#151f32] text-xs text-white px-2.5 py-1.5 rounded-lg border border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleSaveName}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer"
                onClick={() => setIsEditingName(true)}
                title="Clic para cambiar nombre"
              >
                <div className="w-9 h-9 rounded-full bg-[#1c2c49] text-blue-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-blue-500/30">
                  {getInitials(userName)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate hover:underline flex items-center gap-1">
                    {userName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span>En línea</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditingName(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Configuración de perfil"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
