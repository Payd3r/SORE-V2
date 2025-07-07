'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumber, formatDate, t } from '@/lib/localization';

interface MoodData {
  date?: string;
  week?: string;
  month?: string;
  averageMood: number;
  moodCount: number;
}

interface MoodTrendChartProps {
  data: {
    daily: MoodData[];
    weekly: MoodData[];
    monthly: MoodData[];
  };
  period: 'daily' | 'weekly' | 'monthly';
  className?: string;
}

export function MoodTrendChart({ data, period, className = '' }: MoodTrendChartProps) {
  const chartData = data[period] || [];
  const maxMood = 5;
  const minMood = 1;
  
  // Calcola la tendenza generale
  const calculateTrend = () => {
    if (chartData.length < 2) return 'stable';
    
    const recent = chartData.slice(-3);
    const earlier = chartData.slice(0, Math.max(1, chartData.length - 3));
    
    const recentAvg = recent.reduce((sum, item) => sum + item.averageMood, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, item) => sum + item.averageMood, 0) / earlier.length;
    
    const difference = recentAvg - earlierAvg;
    
    if (difference > 0.2) return 'increasing';
    if (difference < -0.2) return 'decreasing';
    return 'stable';
  };

  const trend = calculateTrend();
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 4.5) return 'bg-green-500';
    if (mood >= 3.5) return 'bg-blue-500';
    if (mood >= 2.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatLabel = (item: MoodData) => {
    if (item.date) {
      return new Date(item.date).toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: 'short' 
      });
    }
    if (item.week) {
      return `S${item.week.split('-W')[1]}`;
    }
    if (item.month) {
      return new Date(item.month + '-01').toLocaleDateString('it-IT', { 
        month: 'short',
        year: 'numeric'
      });
    }
    return '';
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Trend dell'Umore
        </CardTitle>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <Badge variant="outline" className={getTrendColor()}>
            {trend === 'increasing' && 'In crescita'}
            {trend === 'decreasing' && 'In calo'}
            {trend === 'stable' && 'Stabile'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Container */}
          <div className="relative h-32 bg-gray-50 rounded-lg p-4">
            <div className="flex items-end justify-between h-full space-x-1">
              {chartData.slice(-10).map((item, index) => {
                const height = ((item.averageMood - minMood) / (maxMood - minMood)) * 100;
                return (
                  <div key={index} className="flex flex-col items-center space-y-1 flex-1">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${getMoodColor(item.averageMood)}`}
                      style={{ height: `${height}%` }}
                      title={`${formatLabel(item)}: ${formatNumber(item.averageMood, 1)}`}
                    />
                    <span className="text-xs text-gray-500 transform -rotate-45 origin-bottom-left whitespace-nowrap">
                      {formatLabel(item)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Basso (1-2)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Medio (2-3)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Buono (3-4)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Ottimo (4-5)</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600">
                {chartData.length > 0 ? formatNumber(chartData[chartData.length - 1].averageMood, 1) : 'Non disponibile'}
              </p>
              <p className="text-xs text-gray-500">Ultimo</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">
                {chartData.length > 0 ? 
                  formatNumber(Math.max(...chartData.map(d => d.averageMood)), 1) : 'Non disponibile'
                }
              </p>
              <p className="text-xs text-gray-500">Massimo</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-purple-600">
                {chartData.length > 0 ? 
                  formatNumber((chartData.reduce((sum, d) => sum + d.averageMood, 0) / chartData.length), 1) : 'Non disponibile'
                }
              </p>
              <p className="text-xs text-gray-500">Media</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 