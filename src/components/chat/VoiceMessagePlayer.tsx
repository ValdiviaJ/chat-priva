import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  url: string;
  duration?: number;
  isMe: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ url, duration = 0, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Error playing audio:', e);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const pct = Math.max(0, Math.min(1, clickX / width));
    const newTime = pct * totalDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(Math.floor(newTime));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Fake wave bars for aesthetic
  const bars = [40, 65, 85, 55, 30, 75, 95, 60, 45, 80, 50, 70, 90, 40, 60, 85, 50, 75, 35, 60];

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[220px] sm:min-w-[260px]">
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer ${
          isMe
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400'
        }`}
        aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div
          onClick={handleSeek}
          className="h-7 flex items-center gap-0.5 cursor-pointer group py-1"
          title="Buscar en el audio"
        >
          {bars.map((heightPct, idx) => {
            const barProgress = (idx / bars.length) * 100;
            const isPlayed = barProgress <= progressPct;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-100 ${
                  isPlayed
                    ? isMe ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'
                    : isMe ? 'bg-white/40' : 'bg-slate-300 dark:bg-slate-700'
                } group-hover:opacity-90`}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>

        <div className={`flex justify-between text-[10px] mt-0.5 font-mono ${
          isMe ? 'text-blue-100/80' : 'text-slate-400 dark:text-slate-400'
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
};
