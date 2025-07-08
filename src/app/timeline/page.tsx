'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Timeline from '@/components/Timeline/Timeline';
import { MoodTracker } from '@/components/Timeline/MoodTracker';
import { TimelineFilters } from '@/components/Timeline/TimelineFilters';
import { FirstMemoryGuide } from '@/components/Timeline/FirstMemoryGuide';
import { WeatherWidget } from '@/components/Weather/WeatherWidget';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  Calendar, 
  Heart, 
  Download,
  Share2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { type TimelineData, type TimelineView } from '@/lib/timeline-system';

interface TimelineFiltersState {
  startDate?: Date;
  endDate?: Date;
  moods?: string[];
  categories?: string[];
  authorId?: string;
  search?: string;
  location?: string;
}

const fetchTimelineData = async (grouping: TimelineView, filters: TimelineFiltersState): Promise<TimelineData> => {
    const params = new URLSearchParams({ view: grouping, ...filters as Record<string, string> });
    const response = await fetch(`/api/timeline?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Errore nel caricamento della timeline');
    }
    const result = await response.json();
    return result.data;
};

export default function TimelinePage() {
  const [filters, setFilters] = useState<TimelineFiltersState>({});
  const [grouping, setGrouping] = useState<TimelineView>('month');

  const { data: timelineData, isLoading, isError, error, refetch } = useQuery<TimelineData, Error>({
    queryKey: ['timeline', grouping, filters],
    queryFn: () => fetchTimelineData(grouping, filters),
  });

  const handleFiltersChange = (newFilters: TimelineFiltersState) => {
    setFilters(newFilters);
  };

  const handleGroupingChange = (newGrouping: TimelineView) => {
    setGrouping(newGrouping);
  };

  const hasMemories = timelineData && timelineData.summary.totalMemories > 0;

  const getAggregatedMoodDistribution = () => {
    if (!timelineData) return {};
    return timelineData.groups.reduce((acc, group) => {
        Object.entries(group.moodSummary.moodDistribution).forEach(([moodId, count]) => {
          acc[moodId] = (acc[moodId] || 0) + count;
        });
        return acc;
      }, {} as { [moodId: string]: number });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                Timeline & Mood Tracker
                </h1>
                <p className="text-gray-600 mt-1">
                Esplora i tuoi ricordi e traccia il tuo stato d'animo nel tempo
                </p>
            </div>
            
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Aggiorna
                </Button>
                <Button variant="outline" size="sm" disabled={!hasMemories}>
                    <Download className="w-4 h-4 mr-2" />
                    Esporta
                </Button>
                <Button variant="outline" size="sm" disabled={!hasMemories}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Condividi
                </Button>
            </div>
        </div>
        
        {isLoading && (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )}

        {isError && (
             <div className="min-h-[400px] flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Oops! Qualcosa è andato storto.</h3>
                        <p className="text-gray-600 mb-4">{error?.message || 'Impossibile caricare la timeline.'}</p>
                        <Button onClick={() => refetch()} className="w-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Riprova
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )}

        {!isLoading && !isError && (
            <>
                {!hasMemories ? (
                    <FirstMemoryGuide />
                ) : (
                    <>
                        <TimelineFilters filters={filters} onFiltersChange={handleFiltersChange} isLoading={isLoading} />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Timeline initialData={timelineData} defaultView={grouping} />
                            </div>
                            <div className="lg:col-span-1 space-y-6">
                                <WeatherWidget />
                                <MoodTracker 
                                    statistics={{
                                        totalMemories: timelineData?.summary.totalMemories || 0,
                                        averageMoodIntensity: timelineData?.summary.moodStats.averageIntensity,
                                        moodDistribution: getAggregatedMoodDistribution(),
                                        mostCommonMood: timelineData?.summary.moodStats.mostCommonMood?.name,
                                    }} 
                                    currentPeriod={new Date().toLocaleDateString('it-IT', { month: 'long' })}
                                    grouping={grouping}
                                />
                            </div>
                        </div>
                    </>
                )}
            </>
        )}
      </div>
    </div>
  );
} 