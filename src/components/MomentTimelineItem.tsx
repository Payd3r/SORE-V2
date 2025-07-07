'use client';

import React from 'react';
import Image from 'next/image';
import MomentThumbnail from './MomentThumbnail';
import { formatDate } from '@/lib/localization';

// Utility per combinare classi CSS
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Interfaccia per i dati del momento nella timeline
interface TimelineMomentData {
  id: string;
  combinedImageUrl: string;
  thumbnailUrl?: string;
  status: 'pending' | 'completed';
  createdAt: string;
  participants: {
    initiator: {
      nickname: string;
      avatar?: string;
    };
    participant: {
      nickname: string;
      avatar?: string;
    };
  };
  memoryTitle?: string;
}

// Interfaccia per le props del componente
interface MomentTimelineItemProps {
  /** Dati del momento */
  moment: TimelineMomentData;
  /** Callback per aprire dettagli momento */
  onViewDetails?: (momentId: string) => void;
  /** Posizione nella timeline */
  position?: 'left' | 'right' | 'center';
  /** Mostra indicatori partecipanti */
  showParticipants?: boolean;
  /** Mostra tempo relativo */
  showRelativeTime?: boolean;
  /** Stile compatto */
  compact?: boolean;
  /** Classi CSS aggiuntive */
  className?: string;
}

const MomentTimelineItem: React.FC<MomentTimelineItemProps> = ({
  moment,
  onViewDetails,
  position = 'center',
  showParticipants = true,
  showRelativeTime = true,
  compact = false,
  className
}) => {
  // Calcolo tempo relativo
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 7) {
      return formatDate(date, 'short');
    } else if (diffDays > 0) {
      return `${diffDays} giorn${diffDays === 1 ? 'o' : 'i'} fa`;
    } else if (diffHours > 0) {
      return `${diffHours} or${diffHours === 1 ? 'a' : 'e'} fa`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minut${diffMinutes === 1 ? 'o' : 'i'} fa`;
    } else {
      return 'Proprio ora';
    }
  };

  // Icona stato
  const getStatusIcon = () => {
    switch (moment.status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        );
    }
  };

  // Rendering avatar partecipante
  const renderParticipantAvatar = (participant: { nickname: string; avatar?: string }, color: string) => (
    <div className="flex items-center space-x-2">
      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white', color)}>
        {participant.avatar ? (
          <Image
            src={participant.avatar}
            alt={participant.nickname}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          participant.nickname.charAt(0).toUpperCase()
        )}
      </div>
      {!compact && (
        <span className="text-xs text-gray-600">{participant.nickname}</span>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors', className)}>
        {/* Thumbnail compatto */}
        <MomentThumbnail
          src={moment.combinedImageUrl}
          thumbnailSrc={moment.thumbnailUrl}
          alt="Momento"
          size="sm"
          onClick={() => onViewDetails?.(moment.id)}
          showWatermark={true}
        />

        {/* Informazioni */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">Momento</span>
            {getStatusIcon()}
          </div>
          {showRelativeTime && (
            <div className="text-xs text-gray-500 mt-1">
              {getRelativeTime(moment.createdAt)}
            </div>
          )}
        </div>

        {/* Partecipanti compatti */}
        {showParticipants && (
          <div className="flex items-center space-x-1">
            {renderParticipantAvatar(moment.participants.initiator, 'bg-blue-500')}
            {renderParticipantAvatar(moment.participants.participant, 'bg-pink-500')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline connector per posizione center */}
      {position === 'center' && (
        <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-full bg-gray-200"></div>
      )}

      <div className={cn(
        'relative bg-white rounded-xl shadow-sm border border-gray-200 p-6',
        position === 'left' && 'mr-8',
        position === 'right' && 'ml-8',
        position === 'center' && 'mx-8'
      )}>
        {/* Indicatore timeline per posizione center */}
        {position === 'center' && (
          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-0">
            {getStatusIcon()}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Momento</h3>
              {position !== 'center' && getStatusIcon()}
            </div>
            {moment.memoryTitle && (
              <div className="text-sm text-gray-600 mt-1">
                📖 {moment.memoryTitle}
              </div>
            )}
          </div>

          {showRelativeTime && (
            <div className="text-sm text-gray-500">
              {getRelativeTime(moment.createdAt)}
            </div>
          )}
        </div>

        {/* Momento thumbnail */}
        <div className="mb-4">
          <MomentThumbnail
            src={moment.combinedImageUrl}
            thumbnailSrc={moment.thumbnailUrl}
            alt="Momento combinato"
            size="xl"
            onClick={() => onViewDetails?.(moment.id)}
            showWatermark={true}
            showOverlay={true}
            momentDate={moment.createdAt}
            status={moment.status}
          />
        </div>

        {/* Partecipanti */}
        {showParticipants && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {renderParticipantAvatar(moment.participants.initiator, 'bg-blue-500')}
              <div className="flex items-center space-x-2">
                <div className="w-6 border-t border-gray-300"></div>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <div className="w-6 border-t border-gray-300"></div>
              </div>
              {renderParticipantAvatar(moment.participants.participant, 'bg-pink-500')}
            </div>

            <button
              onClick={() => onViewDetails?.(moment.id)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Visualizza dettagli →
            </button>
          </div>
        )}

        {/* Watermark speciale per timeline */}
        <div className="absolute top-2 right-2 opacity-20">
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MomentTimelineItem; 