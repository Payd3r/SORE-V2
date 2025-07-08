'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LayoutGrid, Rows } from 'lucide-react';
import { MemoryCard } from './MemoryCard';
import { TimelineFilters } from './TimelineFilters';
import { type TimelineData, type TimelineView, type TimelineMemory, type TimelineGroup, type TimelineMoment } from '@/lib/timeline-system';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import MomentDetailView from '@/components/MomentDetailView';

interface TimelineProps {
  initialData?: TimelineData;
  className?: string;
  showFilters?: boolean;
  defaultView?: TimelineView;
}

interface TimelineState {
  data: TimelineData | null;
  view: TimelineView;
  filters: Record<string, any>; // Simplified filters
  currentDate: Date;
  isLoading: boolean;
  error: string | null;
  selectedMemoryId: string | null;
  selectedMoment: TimelineMoment | null;
}

export default function Timeline({
  initialData,
  className = '',
  showFilters = true,
  defaultView = 'month',
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<TimelineState>({
    data: initialData || null,
    view: defaultView,
    filters: {},
    currentDate: new Date(),
    isLoading: false,
    error: null,
    selectedMemoryId: null,
    selectedMoment: null,
  });

  const [displayMode, setDisplayMode] = useState<'timeline' | 'grid'>('timeline');

  useEffect(() => {
    if (!initialData) {
      // fetchTimelineData(); // Simplified for storybook
    }
  }, [state.filters, state.view, state.currentDate]);

  const handleFiltersChange = (filters: Record<string, any>) => {
    setState(prev => ({ ...prev, filters }));
  };

  const handleViewChange = (view: TimelineView) => {
    setState(prev => ({ ...prev, view }));
  };

  const handleDateNavigation = (direction: 'prev' | 'next') => {
    setState(prev => {
      const { currentDate, view } = prev;
      let newDate: Date;

      switch (view) {
        case 'day':
          newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'month':
          newDate = new Date(currentDate);
          newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'year':
          newDate = new Date(currentDate);
          newDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
          break;
        default:
          newDate = currentDate;
      }

      return { ...prev, currentDate: newDate };
    });
  };

  const handleMemorySelect = (memoryId: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedMemoryId: prev.selectedMemoryId === memoryId ? null : memoryId 
    }));
  };

  const handleMomentSelect = (moment: TimelineMoment) => {
    setState(prev => ({
      ...prev,
      selectedMoment: moment
    }));
  }
  
  const getCurrentPeriodLabel = (): string => {
    const { currentDate, view } = state;
    
    switch (view) {
      case 'day':
        return format(currentDate, "EEEE, d MMMM yyyy", { locale: it });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, "d MMM", { locale: it })} - ${format(weekEnd, "d MMM yyyy", { locale: it })}`;
      case 'month':
        return format(currentDate, "MMMM yyyy", { locale: it });
      case 'year':
        return format(currentDate, "yyyy", { locale: it });
      default:
        return '';
    }
  };


  const renderTimelineHeader = () => (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <Button variant="glass" size="icon" onClick={() => handleDateNavigation('prev')} disabled={state.isLoading}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center min-w-[220px]">
          <h2 className="text-xl font-bold text-white">{getCurrentPeriodLabel()}</h2>
          <p className="text-sm text-white/60">
            {state.data?.summary.totalMemories || 0} ricordi
          </p>
        </div>
        <Button variant="glass" size="icon" onClick={() => handleDateNavigation('next')} disabled={state.isLoading}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center p-1 rounded-lg bg-black/20">
            {(['day', 'week', 'month', 'year'] as const).map((group) => (
                <Button key={group} variant={state.view === group ? 'glass' : 'ghost'} size="sm" onClick={() => handleViewChange(group)}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                </Button>
            ))}
        </div>
        <div className="flex items-center p-1 rounded-lg bg-black/20">
          <Button variant={displayMode === 'timeline' ? 'glass' : 'ghost'} size="icon" onClick={() => setDisplayMode('timeline')}>
            <Rows className="w-5 h-5" />
          </Button>
          <Button variant={displayMode === 'grid' ? 'glass' : 'ghost'} size="icon" onClick={() => setDisplayMode('grid')}>
            <LayoutGrid className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTimelineView = (groups: TimelineGroup[]) => (
    <div className="relative w-full">
      {groups.map((group) => (
        <div key={group.id} className="relative pl-8 pb-8">
          <div className="absolute top-5 left-[19px] w-0.5 h-full bg-white/20" />
          <div className="absolute top-5 left-0 w-10 h-10 flex items-center justify-center">
             <div className="h-4 w-4 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />
          </div>

          <div className="pl-8">
            <h3 className="text-lg font-semibold text-white mb-1">{group.labelIt}</h3>
            <p className="text-sm text-white/60 mb-4">{group.stats.totalMemories} ricordi</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  variant='normal'
                  isSelected={state.selectedMemoryId === memory.id}
                  onSelect={() => handleMemorySelect(memory.id)}
                  onMomentSelect={handleMomentSelect}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGridView = (memories: TimelineMemory[]) => (
    <AnimatePresence>
        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {memories.map((memory) => (
                <MemoryCard
                    key={memory.id}
                    memory={memory}
                    variant="normal"
                    isSelected={state.selectedMemoryId === memory.id}
                    onSelect={() => handleMemorySelect(memory.id)}
                    onMomentSelect={handleMomentSelect}
                />
            ))}
        </motion.div>
    </AnimatePresence>
  );

  return (
    <div className={cn("container mx-auto py-8", className)} ref={timelineRef}>
      {showFilters && (
        <TimelineFilters
          filters={state.filters}
          onFiltersChange={handleFiltersChange}
          className="mb-6"
        />
      )}
      
      {renderTimelineHeader()}

      {state.isLoading && <p className="text-center text-white/70">Caricamento...</p>}
      {state.error && <p className="text-center text-red-500">{state.error}</p>}
      
      {!state.isLoading && !state.error && state.data && (
        displayMode === 'timeline' ? renderTimelineView(state.data.groups) : renderGridView(state.data.groups.flatMap(g => g.memories))
      )}

      <Drawer
        open={!!state.selectedMoment}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setState(prev => ({ ...prev, selectedMoment: null }));
          }
        }}
      >
        <DrawerContent>
          {state.selectedMoment && (
            <MomentDetailView
              moment={{
                id: state.selectedMoment.id,
                combinedImageUrl: state.selectedMoment.combinedImage || '',
                livePhoto: state.selectedMoment.images.some(i => i.isLivePhoto),
                videoUrl: state.selectedMoment.images.find(i => i.isLivePhoto)?.Video?.mp4Path || undefined,
                originalImages: { // This part needs to be mapped correctly
                  initiator: { url: '', userId: '', userNickname: '', timestamp: '' },
                  participant: { url: '', userId: '', userNickname: '', timestamp: '' },
                },
                createdAt: '', // These fields need data from the selected moment
                status: 'completed'
              }}
              onClose={() => setState(prev => ({ ...prev, selectedMoment: null }))}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
} 