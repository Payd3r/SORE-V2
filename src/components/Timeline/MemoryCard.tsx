// Test comment
'use client';

import React from 'react';
import {
  Calendar,
  Camera,
  Eye,
  MoreHorizontal,
  Share2,
  Sparkles,
  MapPin,
  User,
  Image as ImageIcon
} from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { type TimelineMemory } from '@/lib/timeline-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/localization';
import { cn } from '@/lib/utils';
import OptimizedImage from '../utils/OptimizedImage';

interface MemoryCardProps {
  memory: TimelineMemory;
  variant?: 'compact' | 'normal' | 'detailed';
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
  onView?: (id: string) => void;
  onShare?: (id: string) => void;
  onMore?: (id: string) => void;
  onMomentSelect?: (moment: TimelineMemory['moments'][0]) => void;
}

export function MemoryCard({
  memory,
  variant = 'normal',
  isSelected = false,
  onSelect,
  className,
  onView,
  onShare,
  onMore,
  onMomentSelect,
}: MemoryCardProps) {

  const handleActionClick = (e: React.MouseEvent, action?: (id: string) => void) => {
    e.stopPropagation();
    action?.(memory.id);
  }

  const hasLivePhotoMoment = memory.moments?.some(m => m.images.some(i => i.isLivePhoto));

  const ImagePreview = () => {
    if (!memory.images || memory.images.length === 0) return null;
    const firstImage = memory.images[0];
    const remainingCount = memory.images.length - 1;

    const imageContainerClass = cn("relative w-full overflow-hidden rounded-lg", {
      "h-32": variant === 'normal',
      "h-48": variant === 'detailed',
      "h-20 w-20": variant === 'compact'
    });

    return (
      <div className={imageContainerClass}>
        <OptimizedImage
          src={firstImage.thumbnailPath || '/placeholder.jpg'}
          alt={firstImage.filename}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {remainingCount > 0 && (
          <Badge variant="glass" className="absolute top-2 right-2 text-xs">
            +{remainingCount}
          </Badge>
        )}
      </div>
    );
  };

  const CompactLayout = () => (
    <div className="flex items-center gap-4 p-3">
      <ImagePreview />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate text-white">{memory.title}</h3>
        <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(memory.date, 'short')}</span>
        </div>
         {memory.location && (
          <div className="flex items-center gap-1 text-xs text-white/70 mt-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{memory.location}</span>
          </div>
        )}
      </div>
    </div>
  );

  const DefaultLayout = () => (
    <div className="p-4">
       <ImagePreview />
       <div className="mt-4">
         <h3 className="font-bold text-lg text-white truncate">{memory.title}</h3>
         {variant === 'detailed' && memory.description && (
            <p className="text-white/80 text-sm mt-2 leading-relaxed line-clamp-3">
              {memory.description}
            </p>
          )}
        <div className="flex items-center gap-4 text-sm text-white/70 mt-3">
            <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(memory.date, 'long')}</span>
            </div>
            {memory.location && (
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{memory.location}</span>
                </div>
            )}
        </div>
       </div>
       <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
            {memory.images && memory.images.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <ImageIcon className="w-4 h-4" />
                    <span>{memory.images.length}</span>
                </div>
            )}
            {memory.moments && memory.moments.length > 0 && (
                <button 
                  className={cn(
                    "flex items-center gap-1.5 text-xs text-white/70 transition-colors",
                    hasLivePhotoMoment ? "text-cyan-400 hover:text-cyan-300" : "hover:text-white"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if(memory.moments && memory.moments[0]) {
                      onMomentSelect?.(memory.moments[0]);
                    }
                  }}
                  title={hasLivePhotoMoment ? "Visualizza Live Photo" : "Visualizza Momento"}
                >
                    <Camera className="w-4 h-4" />
                    <span>{memory.moments.length}</span>
                </button>
            )}
            {memory.ideas && memory.ideas.length > 0 && (
                 <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <Sparkles className="w-4 h-4" />
                    <span>{memory.ideas.length}</span>
                </div>
            )}
        </div>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleActionClick(e, onView)}>
                <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleActionClick(e, onShare)}>
                <Share2 className="w-4 h-4" />
            </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleActionClick(e, onMore)}>
                <MoreHorizontal className="w-4 h-4" />
            </Button>
        </div>
       </div>
    </div>
  );

  return (
    <GlassCard
      className={cn(
        'group cursor-pointer transition-all duration-300',
        { 'ring-2 ring-cyan-400 shadow-cyan-500/30': isSelected },
        className
      )}
      onClick={() => onSelect?.(memory.id)}
      interactive
    >
        {variant === 'compact' ? <CompactLayout /> : <DefaultLayout />}
    </GlassCard>
  );
} 