'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { formatDateTime as formatDateTimeLoc } from '@/lib/localization';
import LivePhotoViewer from '@/components/Media/LivePhotoViewer';
import ShareMemoryModal from '@/components/Share/ShareMemoryModal';
import { Share2 } from 'lucide-react';

// Utility per combinare classi CSS
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Interfaccia per i dati del momento
interface MomentData {
  id: string;
  combinedImageUrl: string;
  livePhoto?: boolean;
  videoUrl?: string;
  originalImages: {
    initiator: {
      url: string;
      userId: string;
      userNickname: string;
      timestamp: string;
    };
    participant: {
      url: string;
      userId: string;
      userNickname: string;
      timestamp: string;
    };
  };
  createdAt: string;
  status: 'pending' | 'completed';
  memoryId?: string;
  memoryTitle?: string;
}

// Interfaccia per le props del componente
interface MomentDetailViewProps {
  /** Dati del momento */
  moment: MomentData;
  /** Callback per chiudere la visualizzazione */
  onClose?: () => void;
  /** Callback per condividere il momento */
  onShare?: (momentId: string) => void;
  /** Callback per scaricare le immagini */
  onDownload?: (imageUrl: string, filename: string) => void;
  /** Modalità di visualizzazione */
  viewMode?: 'combined' | 'split' | 'comparison';
  /** Classi CSS aggiuntive */
  className?: string;
}

const MomentDetailView: React.FC<MomentDetailViewProps> = ({
  moment,
  onClose,
  onShare,
  onDownload,
  viewMode: initialViewMode = 'combined',
  className
}) => {
  const [viewMode, setViewMode] = useState<'combined' | 'split' | 'comparison'>(initialViewMode);
  const [selectedImage, setSelectedImage] = useState<'initiator' | 'participant' | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Formattazione data
  const formatDateTime = (dateString: string) => {
    return formatDateTimeLoc(new Date(dateString), 'short', 'short');
  };

  // Rendering visualizzazione combinata
  const renderCombinedView = () => (
    <div className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden">
      {moment.livePhoto && moment.videoUrl ? (
        <LivePhotoViewer imageUrl={moment.combinedImageUrl} videoUrl={moment.videoUrl} />
      ) : (
        <Image
          src={moment.combinedImageUrl}
          alt="Momento combinato"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
        />
      )}
      
      {/* Watermark MOMENT */}
      <div className="absolute top-4 right-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white text-sm font-medium">MOMENTO</span>
        </div>
      </div>
    </div>
  );

  // Rendering visualizzazione separata
  const renderSplitView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Foto iniziatore */}
      <div className="space-y-2">
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden border-2 border-blue-200">
          <Image
            src={moment.originalImages.initiator.url}
            alt={`Foto di ${moment.originalImages.initiator.userNickname}`}
            fill
            className="object-cover cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setSelectedImage('initiator')}
          />
        </div>
        <div className="text-center space-y-1">
          <div className="text-sm font-medium text-blue-600">
            {moment.originalImages.initiator.userNickname}
          </div>
          <div className="text-xs text-gray-500">
            {formatDateTime(moment.originalImages.initiator.timestamp)}
          </div>
        </div>
      </div>

      {/* Foto partecipante */}
      <div className="space-y-2">
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden border-2 border-pink-200">
          <Image
            src={moment.originalImages.participant.url}
            alt={`Foto di ${moment.originalImages.participant.userNickname}`}
            fill
            className="object-cover cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setSelectedImage('participant')}
          />
        </div>
        <div className="text-center space-y-1">
          <div className="text-sm font-medium text-pink-600">
            {moment.originalImages.participant.userNickname}
          </div>
          <div className="text-xs text-gray-500">
            {formatDateTime(moment.originalImages.participant.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );

  // Rendering visualizzazione comparativa
  const renderComparisonView = () => (
    <div className="relative">
      <div className="grid grid-cols-2 h-96 md:h-[500px]">
        {/* Foto sinistra */}
        <div className="relative overflow-hidden">
          <Image
            src={moment.originalImages.initiator.url}
            alt={`Foto di ${moment.originalImages.initiator.userNickname}`}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-4 left-4">
            <div className="bg-blue-500/20 backdrop-blur-sm rounded px-2 py-1">
              <span className="text-white text-sm">
                {moment.originalImages.initiator.userNickname}
              </span>
            </div>
          </div>
        </div>

        {/* Foto destra */}
        <div className="relative overflow-hidden">
          <Image
            src={moment.originalImages.participant.url}
            alt={`Foto di ${moment.originalImages.participant.userNickname}`}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-4 right-4">
            <div className="bg-pink-500/20 backdrop-blur-sm rounded px-2 py-1">
              <span className="text-white text-sm">
                {moment.originalImages.participant.userNickname}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Linea divisoria centrale */}
      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/50 transform -translate-x-px"></div>
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header con informazioni momento */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Momento
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{formatDateTime(moment.createdAt)}</span>
            {moment.memoryTitle && (
              <span className="flex items-center">
                <span className="mr-1">📖</span>
                {moment.memoryTitle}
              </span>
            )}
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              moment.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            )}>
              {moment.status === 'completed' ? 'Completato' : 'In attesa'}
            </div>
          </div>
        </div>

        {/* Pulsanti azione */}
        <div className="flex items-center space-x-2">
          {moment.memoryId && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Condividi ricordo"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Chiudi"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Controlli modalità visualizzazione */}
      <div className="flex items-center justify-center space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setViewMode('combined')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            viewMode === 'combined'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Combinato
        </button>
        <button
          onClick={() => setViewMode('split')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            viewMode === 'split'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Separato
        </button>
        <button
          onClick={() => setViewMode('comparison')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            viewMode === 'comparison'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Confronto
        </button>
      </div>

      {/* Contenuto principale */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {viewMode === 'combined' && renderCombinedView()}
        {viewMode === 'split' && renderSplitView()}
        {viewMode === 'comparison' && renderComparisonView()}
      </div>

      {/* Visualizzatore immagine a schermo intero */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <Image
            src={moment.originalImages[selectedImage].url}
            alt={`Foto di ${moment.originalImages[selectedImage].userNickname}`}
            width={1200}
            height={1200}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {moment.memoryId && (
        <ShareMemoryModal
            memoryId={moment.memoryId}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MomentDetailView; 