'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Timeline from '@/components/Timeline/Timeline';
import { MoodTracker } from '@/components/Timeline/MoodTracker';
import { TimelineFilters } from '@/components/Timeline/TimelineFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  Heart, 
  Filter, 
  Download,
  Share2,
  Settings,
  RefreshCw
} from 'lucide-react';
import { type TimelineData, type TimelineView } from '@/lib/timeline-system';
import { formatDate, t } from '@/lib/localization';

// Define TimelineFilters interface locally
interface TimelineFilters {
  startDate?: Date;
  endDate?: Date;
  moods?: string[];
  categories?: string[];
  authorId?: string;
  search?: string;
  location?: string;
}

interface TimelinePageState {
  timelineData: TimelineData | undefined;
  filters: TimelineFilters;
  grouping: TimelineView;
  isLoading: boolean;
  error: string | null;
  currentPeriod: string;
}

export default function TimelinePage() {
  const { data: session, status } = useSession();
  
  const [state, setState] = useState<TimelinePageState>({
    timelineData: undefined,
    filters: {},
    grouping: 'month',
    isLoading: false,
    error: null,
    currentPeriod: '',
  });

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/');
  }

  const fetchTimelineData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      params.append('view', state.grouping);

      // Add filters to params
      if (state.filters.startDate) {
        params.append('startDate', state.filters.startDate.toISOString());
      }
      if (state.filters.endDate) {
        params.append('endDate', state.filters.endDate.toISOString());
      }
      if (state.filters.moods && state.filters.moods.length > 0) {
        params.append('mood', state.filters.moods.join(','));
      }
      if (state.filters.categories && state.filters.categories.length > 0) {
        params.append('category', state.filters.categories.join(','));
      }
      if (state.filters.authorId) {
        params.append('author', state.filters.authorId);
      }
      if (state.filters.search) {
        params.append('search', state.filters.search);
      }
      if (state.filters.location) {
        params.append('location', state.filters.location);
      }

      const response = await fetch(`/api/timeline?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Errore nel caricamento della timeline');
      }

      const result = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        timelineData: result.data,
        isLoading: false,
        currentPeriod: getCurrentPeriodLabel(state.grouping)
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        isLoading: false,
      }));
    }
  };

  const getCurrentPeriodLabel = (grouping: TimelineView): string => {
    const now = new Date();
    
    switch (grouping) {
      case 'day':
        return formatDate(now);
      case 'week':
        return `Settimana del ${formatDate(now)}`;
      case 'month':
        return now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      case 'year':
        return now.getFullYear().toString();
      default:
        return '';
    }
  };

  // Load initial data
  useEffect(() => {
    if (session?.user) {
      fetchTimelineData();
    }
  }, [session, state.filters, state.grouping]);

  const handleFiltersChange = (filters: TimelineFilters) => {
    setState(prev => ({ ...prev, filters }));
  };

  const handleGroupingChange = (grouping: TimelineView) => {
    setState(prev => ({ ...prev, grouping }));
  };

  const handleRefresh = () => {
    fetchTimelineData();
  };

  const getMoodStatistics = () => {
    if (!state.timelineData) {
      return {
        totalMemories: 0,
        averageMoodIntensity: 0,
        moodDistribution: {},
        mostCommonMood: undefined,
        moodTrend: 'stable' as const,
      };
    }

    return {
      totalMemories: state.timelineData.summary.totalMemories,
      averageMoodIntensity: state.timelineData.summary.moodStats.averageIntensity,
      moodDistribution: state.timelineData.groups.reduce((acc, group) => {
        Object.entries(group.moodSummary.moodDistribution).forEach(([moodId, count]) => {
          acc[moodId] = (acc[moodId] || 0) + count;
        });
        return acc;
      }, {} as { [moodId: string]: number }),
      mostCommonMood: state.timelineData.summary.moodStats.mostCommonMood?.name,
      moodTrend: 'stable' as const,
    };
  };

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <Clock className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Errore nel caricamento</h3>
              <p className="text-gray-600 mb-4">{state.error}</p>
              <Button onClick={handleRefresh} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Riprova
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={state.isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Esporta
            </Button>
            
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Condividi
            </Button>
          </div>
        </div>

        {/* Statistics Summary */}
        {state.timelineData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{state.timelineData.summary.totalMemories}</p>
                    <p className="text-sm text-gray-600">Memorie totali</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {state.timelineData.summary.moodStats.totalMoods}
                    </p>
                    <p className="text-sm text-gray-600">Stati d'animo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{state.timelineData.summary.topLocations.length}</p>
                    <p className="text-sm text-gray-600">Luoghi visitati</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{state.timelineData.summary.topCategories.length}</p>
                    <p className="text-sm text-gray-600">Categorie usate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <TimelineFilters
              filters={state.filters}
              onFiltersChange={handleFiltersChange}
              isLoading={state.isLoading}
            />
            
            <MoodTracker
              statistics={getMoodStatistics()}
              currentPeriod={state.currentPeriod}
              grouping={state.grouping}
            />
          </div>

          {/* Timeline Content */}
          <div className="lg:col-span-3">
            <Timeline
              initialData={state.timelineData}
              showMoodTracker={false} // Already shown in sidebar
              showFilters={false} // Already shown in sidebar
              defaultGrouping={state.grouping}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 