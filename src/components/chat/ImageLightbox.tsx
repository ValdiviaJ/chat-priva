import React, { useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import type { FileAttachment } from '../../services/storageService';

interface ImageLightboxProps {
  images: FileAttachment[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || images.length === 0 || !images[currentIndex]) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 text-white">
        <div className="flex items-center gap-3">
          <p className="font-semibold text-sm truncate max-w-[240px] sm:max-w-md">
            {currentImage.name}
          </p>
          <span className="text-xs text-slate-400 bg-white/10 px-2.5 py-0.5 rounded-full font-mono">
            {currentIndex + 1} de {images.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={currentImage.url}
            download={currentImage.name}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Descargar imagen"
          >
            <Download className="w-5 h-5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation: Prev Button */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Imagen anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Center Image */}
      <div className="max-w-4xl max-h-[80vh] flex items-center justify-center select-none">
        <img
          src={currentImage.url}
          alt={currentImage.name}
          className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-150"
        />
      </div>

      {/* Navigation: Next Button */}
      {currentIndex < images.length - 1 && (
        <button
          type="button"
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Imagen siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
