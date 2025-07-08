'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  TrendingUp, 
  Heart, 
  Users, 
  BarChart3, 
  PieChart, 
  Activity,
  Sparkles,
  MapPin,
  Clock,
  RefreshCw,
  Download,
  Share2,
  Target
} from 'lucide-react';
import { MoodTrendChart } from './MoodTrendChart';
import { MoodDistributionChart } from './MoodDistributionChart';
import { RelationshipInsights } from './RelationshipInsights';
import { LocationAnalytics } from './LocationAnalytics';
import { ActivityAnalytics } from './ActivityAnalytics';
import { ChallengeAnalytics } from './ChallengeAnalytics';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { t } from '@/lib/localization';

interface AnalyticsData {
  moodTrends: {
    daily: Array<{ date: string; averageMood: number; moodCount: number }>;
    weekly: Array<{ week: string; averageMood: number; moodCount: number }>;
    monthly: Array<{ month: string; averageMood: number; moodCount: number }>;
  };
  moodDistribution: {
    [moodId: string]: {
      count: number;
      percentage: number;
      name: string;
      emoji: string;
    };
  };
  relationshipMetrics: {
    totalMemories: number;
    sharedMemories: number;
    moodCompatibility: number;
    communicationFrequency: number;
    activityDiversity: number;
  };
  insights: {
    topMoods: string[];
    bestDays: string[];
    improvementSuggestions: string[];
    achievements: string[];
    patterns: string[];
  };
  periodComparison: {
    thisMonth: { averageMood: number; memoriesCount: number };
    lastMonth: { averageMood: number; memoriesCount: number };
    change: { mood: number; memories: number };
  };
  locationStats: {
    topLocations: any[];
    coordinates: any[];
  };
  activityStats: {
    distribution: any[];
    totalActivities: number;
    diversity: number;
  };
  challengeStats: {
    totalChallenges: number;
    completedChallenges: number;
    activeChallenges: number;
    averageCompletion: number;
  };
}

interface AnalyticsDashboardProps {
  coupleId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  className?: string;
}

export default function AnalyticsDashboard({
  coupleId,
  dateRange,
  className = '',
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Funzione per mappare i periodi ai tipi che si aspettano i componenti
  const mapPeriodToChartType = (period: 'week' | 'month' | 'year'): 'daily' | 'weekly' | 'monthly' => {
    switch (period) {
      case 'week': return 'daily';
      case 'month': return 'weekly';
      case 'year': return 'monthly';
      default: return 'weekly';
    }
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'locations' | 'activities' | 'challenges' | 'insights' | 'comparison'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [coupleId, dateRange, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      
      if (coupleId) {
        params.append('coupleId', coupleId);
      }
      
      if (dateRange) {
        params.append('startDate', dateRange.start.toISOString());
        params.append('endDate', dateRange.end.toISOString());
      }

      const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei dati analitici');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    if (!dashboardRef.current) return;

    html2canvas(dashboardRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: true,
    }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`sore-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    });
  };

  const renderOverviewStats = () => {
    if (!data) return null;

    const { relationshipMetrics, periodComparison } = data;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Memories */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.metrics.totalMemories')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {relationshipMetrics.totalMemories}
                </p>
              </div>
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <span className={`text-xs ${
                (periodComparison?.change?.memories ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(periodComparison?.change?.memories ?? 0) >= 0 ? '+' : ''}{(periodComparison?.change?.memories ?? 0)}% dal mese scorso
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Average Mood */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.metrics.averageMood')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {(periodComparison?.thisMonth?.averageMood ?? 0).toFixed(1)}/5
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-2">
              <span className={`text-xs ${
                (periodComparison?.change?.mood ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(periodComparison?.change?.mood ?? 0) >= 0 ? '+' : ''}{(periodComparison?.change?.mood ?? 0).toFixed(1)} dal mese scorso
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Mood Compatibility */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.metrics.moodCompatibility')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(relationshipMetrics.moodCompatibility || 0)}%
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500">
                Sintonia emotiva della coppia
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Activity Diversity */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('analytics.metrics.activityDiversity')}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(relationshipMetrics.activityDiversity || 0)}%
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500">
                Diversificazione delle esperienze
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTabContent = () => {
    if (!data) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MoodTrendChart 
                data={data.moodTrends} 
                period={mapPeriodToChartType(selectedPeriod)}
              />
              <MoodDistributionChart 
                data={data.moodDistribution} 
              />
            </div>
            <RelationshipInsights data={data.insights} />
          </div>
        );
      case 'trends':
        return (
          <div className="space-y-6">
            <MoodTrendChart 
                data={data.moodTrends} 
                period={mapPeriodToChartType(selectedPeriod)}
            />
            <MoodDistributionChart 
                data={data.moodDistribution} 
            />
          </div>
        );
      case 'locations':
        return <LocationAnalytics data={data.locationStats} />;
      case 'activities':
        return <ActivityAnalytics data={data.activityStats} />;
      case 'challenges':
        return <ChallengeAnalytics data={data.challengeStats} />;
      case 'insights':
        return <RelationshipInsights data={data.insights} />;

      case 'comparison':
        return (
          <div className="text-center p-8">
            <p>Confronto tra periodi - Prossimamente...</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchAnalyticsData} className="mt-4">
          Riprova
        </Button>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-10">Nessun dato disponibile.</div>;
  }

  return (
    <div ref={dashboardRef} className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
      {/* Header e Controlli */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Pannello di Analisi</h2>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'year'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                disabled={isLoading}
                className="text-xs"
              >
                {period === 'week' ? 'Settimana' : 
                 period === 'month' ? 'Mese' : 'Anno'}
              </Button>
            ))}
          </div>
          
          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('update')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={isLoading || !data}
          >
            <Download className="w-4 h-4 mr-2" />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {!isLoading && data && renderOverviewStats()}

      {/* Tab Navigation */}
      <div className="flex border-b">
        {[
          { key: 'overview', label: 'Panoramica', icon: BarChart3 },
          { key: 'trends', label: 'Tendenze', icon: TrendingUp },
          { key: 'locations', label: 'Luoghi', icon: MapPin },
          { key: 'activities', label: 'Attività', icon: Activity },
          { key: 'challenges', label: 'Obiettivi', icon: Target },
          { key: 'insights', label: 'Insights', icon: Sparkles },
          { key: 'comparison', label: 'Confronti', icon: Calendar },
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeTab === key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(key as any)}
            disabled={isLoading}
            className="border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none"
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">{t('loadingAnalysis')}</span>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
} 