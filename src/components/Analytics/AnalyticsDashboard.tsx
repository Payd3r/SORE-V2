'use client';

import React, { useState, useEffect } from 'react';
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
  Share2
} from 'lucide-react';
import { MoodTrendChart } from './MoodTrendChart';
import { MoodDistributionChart } from './MoodDistributionChart';
import { RelationshipInsights } from './RelationshipInsights';
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
  
  // Funzione per mappare i periodi ai tipi che si aspettano i componenti
  const mapPeriodToChartType = (period: 'week' | 'month' | 'year'): 'daily' | 'weekly' | 'monthly' => {
    switch (period) {
      case 'week': return 'daily';
      case 'month': return 'weekly';
      case 'year': return 'monthly';
      default: return 'weekly';
    }
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'insights' | 'comparison'>('overview');

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
      setData(result.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    if (!data) return;
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
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
                periodComparison.change.memories >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {periodComparison.change.memories >= 0 ? '+' : ''}{periodComparison.change.memories}% dal mese scorso
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
                  {periodComparison.thisMonth.averageMood.toFixed(1)}/5
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-2">
              <span className={`text-xs ${
                periodComparison.change.mood >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {periodComparison.change.mood >= 0 ? '+' : ''}{periodComparison.change.mood.toFixed(1)} dal mese scorso
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
                  {Math.round(relationshipMetrics.moodCompatibility)}%
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
                  {Math.round(relationshipMetrics.activityDiversity)}%
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RelationshipInsights 
                data={data.insights}
              />
            </div>
          </div>
        );

      case 'trends':
        return (
          <div className="space-y-6">
            <MoodTrendChart 
              data={data.moodTrends} 
              period={mapPeriodToChartType(selectedPeriod)}
              detailed={true}
            />
          </div>
        );

      case 'insights':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RelationshipInsights 
              data={data.insights}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {t('analytics.insights.suggestions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.insights.improvementSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'comparison':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('periodComparison')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">{t('thisMonth')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('averageMood')}</span>
                        <span className="font-medium">
                          {data.periodComparison.thisMonth.averageMood.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('memoriesCreated')}</span>
                        <span className="font-medium">
                          {data.periodComparison.thisMonth.memoriesCount}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">{t('lastMonth')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('averageMood')}</span>
                        <span className="font-medium">
                          {data.periodComparison.lastMonth.averageMood.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('memoriesCreated')}</span>
                        <span className="font-medium">
                          {data.periodComparison.lastMonth.memoriesCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalyticsData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('analyticsDashboard')}
          </h1>
          <p className="text-gray-600">
            {t('deepAnalysis')}
          </p>
        </div>
        
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