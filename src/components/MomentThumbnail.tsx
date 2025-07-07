'use client';

import React from 'react';
import Image from 'next/image';
import { formatDate } from '@/lib/localization';
// Utility per combinare classi CSS
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Interfaccia per le props del componente
interface MomentThumbnailProps {
  /** URL dell'immagine combinata MOMENT */
  src: string;
  /** URL dell'immagine thumbnail (ottimizzata) */
  thumbnailSrc?: string;
  /** Alt text per accessibilità */
  alt: string;
  /** Dimensioni del thumbnail */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Mostra il watermark MOMENT */
  showWatermark?: boolean;
  /** Click handler per aprire detail view */
  onClick?: () => void;
  /** Classi CSS aggiuntive */
  className?: string;
  /** Disabilita le animazioni hover */
  noHover?: boolean;
  /** Mostra overlay informativo */
  showOverlay?: boolean;
  /** Data del momento */
  momentDate?: string;
  /** Stato del momento (pending, completed) */
  status?: 'pending' | 'completed';
}

// Mappatura dimensioni
const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24', 
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
};

const MomentThumbnail: React.FC<MomentThumbnailProps> = ({
  src,
  thumbnailSrc,
  alt,
  size = 'md',
  showWatermark = true,
  onClick,
  className,
  noHover = false,
  showOverlay = false,
  momentDate,
  status = 'completed'
}) => {
  const imageSrc = thumbnailSrc || src;
  
  return (
    <div 
      className={cn(
        'relative rounded-lg overflow-hidden',
        sizeMap[size],
        onClick && !noHover && 'cursor-pointer transition-transform hover:scale-105',
        'shadow-md hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      {/* Immagine principale */}
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-cover"
        sizes={`(max-width: 768px) ${size === 'xl' ? '192px' : size === 'lg' ? '128px' : size === 'md' ? '96px' : '64px'}, ${size === 'xl' ? '192px' : size === 'lg' ? '128px' : size === 'md' ? '96px' : '64px'}`}
      />
      
      {/* Watermark MOMENT discreto */}
      {showWatermark && (
        <div className="absolute top-1 right-1">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-1">
            <div className="w-2 h-2 bg-white/80 rounded-full"></div>
          </div>
        </div>
      )}
      
      {/* Indicatore stato (solo se pending) */}
      {status === 'pending' && (
        <div className="absolute top-1 left-1">
          <div className="bg-yellow-500/20 backdrop-blur-sm rounded-full p-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
      
      {/* Overlay informativo */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 left-2 right-2">
            <div className="text-white text-xs font-medium">
              Momento
            </div>
            {momentDate && (
              <div className="text-white/80 text-xs">
                {formatDate(new Date(momentDate), 'short')}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Effetto glassmorphism per hover (solo se non disabilitato) */}
      {!noHover && (
        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[1px]" />
      )}
    </div>
  );
};

export default MomentThumbnail; 