'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MoodDistribution {
  [moodId: string]: {
    count: number;
    percentage: number;
    name: string;
    emoji: string;
  };
}

interface MoodDistributionChartProps {
  data: MoodDistribution;
  className?: string;
}

export function MoodDistributionChart({ data, className = '' }: MoodDistributionChartProps) {
  const moodEntries = Object.entries(data).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
  
  const totalCount = Object.values(data).reduce((sum, mood) => sum + mood.count, 0);
  const mostCommonMood = moodEntries.reduce((prev, curr) => 
    data[curr[0]].count > data[prev[0]].count ? curr : prev
  );

  const getMoodColor = (moodId: string) => {
    switch (moodId) {
      case '5': return 'bg-green-500';
      case '4': return 'bg-blue-500';
      case '3': return 'bg-yellow-500';
      case '2': return 'bg-orange-500';
      case '1': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getMoodColorLight = (moodId: string) => {
    switch (moodId) {
      case '5': return 'bg-green-100 text-green-800';
      case '4': return 'bg-blue-100 text-blue-800';
      case '3': return 'bg-yellow-100 text-yellow-800';
      case '2': return 'bg-orange-100 text-orange-800';
      case '1': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Distribuzione degli Umori
        </CardTitle>
        <Badge variant="outline" className="flex items-center space-x-1">
          <span>{mostCommonMood[1].emoji}</span>
          <span>Più comune: {mostCommonMood[1].name}</span>
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pie Chart Visual */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {moodEntries.map(([moodId, mood], index) => {
                  const percentage = mood.percentage;
                  const angle = (percentage / 100) * 360;
                  const startAngle = moodEntries
                    .slice(0, index)
                    .reduce((sum, [, m]) => sum + (m.percentage / 100) * 360, 0);
                  
                  if (percentage === 0) return null;

                  const largeArcFlag = angle > 180 ? 1 : 0;
                  const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                  const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);

                  const pathData = [
                    'M', 50, 50,
                    'L', x1, y1,
                    'A', 40, 40, 0, largeArcFlag, 1, x2, y2,
                    'Z'
                  ].join(' ');

                  return (
                    <path
                      key={moodId}
                      d={pathData}
                      className={getMoodColor(moodId).replace('bg-', 'fill-')}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{totalCount}</p>
                  <p className="text-xs text-gray-500">Totale</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend and Statistics */}
          <div className="space-y-2">
            {moodEntries.map(([moodId, mood]) => (
              <div key={moodId} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${getMoodColor(moodId)}`}></div>
                  <span className="text-2xl">{mood.emoji}</span>
                  <div>
                    <p className="font-medium text-gray-900">{mood.name}</p>
                    <p className="text-sm text-gray-500">{mood.count} memorie</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getMoodColorLight(moodId)}>
                    {mood.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bars */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Visualizzazione a Barre</h4>
            {moodEntries.map(([moodId, mood]) => (
              <div key={moodId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <span>{mood.emoji}</span>
                    <span>{mood.name}</span>
                  </span>
                  <span className="font-medium">{mood.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getMoodColor(moodId)}`}
                    style={{ width: `${mood.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">
                {Math.round(((data['4']?.percentage || 0) + (data['5']?.percentage || 0)))}%
              </p>
              <p className="text-xs text-gray-500">Umori Positivi</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600">
                {Math.round(Object.keys(data).length)}
              </p>
              <p className="text-xs text-gray-500">Tipi di Umore</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 