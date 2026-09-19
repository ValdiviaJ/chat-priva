import React, { useState } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import type { CallState, CallType } from '../../hooks/useWebRTC';

interface CallModalProps {
  callState: CallState;
  callType: CallType;
  remoteName: string;
  callDuration: number;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteAudioRef?: React.RefObject<HTMLAudioElement | null>;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMuteAudio: () => void;
  onToggleVideo: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  callState,
  callType,
  remoteName,
  callDuration,
  isAudioMuted,
  isVideoDisabled,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
  onAccept,
  onReject,
  onEnd,
  onToggleMuteAudio,
  onToggleVideo,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Reset minimized mode when call returns to idle
  React.useEffect(() => {
    if (callState === 'idle') {
      setIsMinimized(false);
    }
  }, [callState]);

  if (callState === 'idle') return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Minimized Floating PiP Mode (Bottom-Right corner)
  if (isMinimized && callState === 'connected') {
    return (
      <div className="fixed bottom-20 right-4 z-50 w-72 bg-[#0d1524] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col p-3 transition-all animate-in slide-in-from-bottom-5">
        {/* Hidden persistent remote audio for voice & video */}
        {remoteAudioRef && (
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
            className="hidden"
          />
        )}

        <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-xs truncate">{remoteName}</span>
            <span className="text-[11px] font-mono text-blue-400">
              {formatDuration(callDuration)}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Maximizar llamada"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mini Preview */}
        {callType === 'video' ? (
          <div className="relative w-full h-36 bg-black rounded-xl overflow-hidden my-1">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1.5 right-1.5 w-16 h-20 bg-slate-900 border border-white/20 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : ''}`}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-bold shadow-md">
              {remoteName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}

        {/* Mini Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onToggleMuteAudio}
            className={`p-2 rounded-full cursor-pointer transition-colors ${
              isAudioMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200'
            }`}
            title={isAudioMuted ? 'Activar micrófono' : 'Silenciar'}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {callType === 'video' && (
            <button
              type="button"
              onClick={onToggleVideo}
              className={`p-2 rounded-full cursor-pointer transition-colors ${
                isVideoDisabled ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200'
              }`}
              title={isVideoDisabled ? 'Encender cámara' : 'Apagar cámara'}
            >
              {isVideoDisabled ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={onEnd}
            className="p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer"
            title="Colgar"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d1524] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-between min-h-[420px] p-6 text-white">
        {/* Hidden persistent remote audio for voice & video */}
        {remoteAudioRef && (
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
            className="hidden"
          />
        )}

        {/* Top Header: Title / Timer / Minimize */}
        <div className="w-full flex items-start justify-between z-20 pt-1">
          <div className="w-8" />
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
              {callType === 'video' ? 'Videollamada' : 'Llamada de voz'}
            </p>
            <h3 className="text-xl font-bold tracking-tight">{remoteName}</h3>
            <p className="text-xs text-blue-400 mt-1 font-mono">
              {callState === 'calling'
                ? 'Llamando...'
                : callState === 'incoming'
                ? 'Llamada entrante...'
                : formatDuration(callDuration)}
            </p>
          </div>
          {callState === 'connected' ? (
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Minimizar llamada (PiP)"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>

        {/* Center Content: Video streams or Voice Avatar */}
        <div className="relative w-full flex-1 flex items-center justify-center my-4 overflow-hidden rounded-2xl bg-[#090d17]">
          {callType === 'video' ? (
            <div className="relative w-full h-full min-h-[260px] flex items-center justify-center">
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-2xl"
              />

              {/* Local Video in Corner (PIP) */}
              <div className="absolute bottom-3 right-3 w-28 h-36 bg-slate-900 border border-white/20 rounded-xl overflow-hidden shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : ''}`}
                />
                {isVideoDisabled && (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                    Cámara apagada
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative flex items-center justify-center">
                {callState === 'calling' && (
                  <span className="absolute w-28 h-28 rounded-full bg-blue-500/20 animate-ping" />
                )}
                {callState === 'incoming' && (
                  <span className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-ping" />
                )}
                <div className="w-20 h-20 rounded-full bg-blue-600 border-2 border-blue-400 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-600/30 select-none">
                  {remoteName.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="w-full flex items-center justify-center gap-4 pt-2 z-20">
          {callState === 'incoming' ? (
            <>
              <button
                type="button"
                onClick={onReject}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
                title="Rechazar llamada"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={onAccept}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer animate-bounce"
                title="Aceptar llamada"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              {/* Audio Mute Toggle */}
              <button
                type="button"
                onClick={onToggleMuteAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isAudioMuted
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isAudioMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
              >
                {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle (only if video call) */}
              {callType === 'video' && (
                <button
                  type="button"
                  onClick={onToggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isVideoDisabled
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title={isVideoDisabled ? 'Encender cámara' : 'Apagar cámara'}
                >
                  {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* End Call Button */}
              <button
                type="button"
                onClick={onEnd}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
                title="Colgar llamada"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
