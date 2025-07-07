'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  TrendingUp, 
  Calendar, 
  BarChart3,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { formatNumber, t } from '@/lib/localization';

interface MoodStatistics {
  totalMemories: number;
  averageMoodIntensity?: number;
  moodDistribution?: { [moodId: string]: number };
  mostCommonMood?: string;
  moodTrend?: 'improving' | 'declining' | 'stable';
}

interface MoodTrackerProps {
  statistics: MoodStatistics;
  currentPeriod: string;
  grouping: 'day' | 'week' | 'month' | 'year';
  className?: string;
}

export function MoodTracker({
  statistics,
  currentPeriod,
  grouping,
  className = '',
}: MoodTrackerProps) {
  const getMoodIntensityColor = (intensity: number): string => {
    if (intensity >= 4) return 'text-green-600';
    if (intensity >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMoodIntensityIcon = (intensity: number) => {
    if (intensity >= 4) return <Smile className="w-4 h-4 text-green-600" />;
    if (intensity >= 3) return <Meh className="w-4 h-4 text-yellow-600" />;
    return <Frown className="w-4 h-4 text-red-600" />;
  };

  const getTrendIcon = (trend: string | undefined) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendText = (trend: string | undefined): string => {
    switch (trend) {
      case 'improving':
        return 'In miglioramento';
      case 'declining':
        return 'In calo';
      default:
        return 'Stabile';
    }
  };

  const formatPeriodLabel = (): string => {
    switch (grouping) {
      case 'day':
        return `oggi`;
      case 'week':
        return `questa settimana`;
      case 'month':
        return `questo mese`;
      case 'year':
        return `quest'anno`;
      default:
        return 'nel periodo selezionato';
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            <CardTitle className="text-lg">Tracker dell'Umore</CardTitle>
          </div>
          
          <Badge variant="outline" className="text-xs">
            {currentPeriod}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {statistics.totalMemories === 0 ? (
          <div className="text-center py-4">
            <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              Nessuna memoria con stato d'animo {formatPeriodLabel()}
            </p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Average Mood */}
              {statistics.averageMoodIntensity && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {getMoodIntensityIcon(statistics.averageMoodIntensity)}
                    <span className={`text-2xl font-bold ${getMoodIntensityColor(statistics.averageMoodIntensity)}`}>
                      {formatNumber(statistics.averageMoodIntensity, 1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Umore medio</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        statistics.averageMoodIntensity >= 4 ? 'bg-green-600' :
                        statistics.averageMoodIntensity >= 3 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${(statistics.averageMoodIntensity / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Mood Trend */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {getTrendIcon(statistics.moodTrend)}
                  <span className="text-sm font-medium">
                    {getTrendText(statistics.moodTrend)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Tendenza</p>
              </div>

              {/* Memory Count */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">
                    {statistics.totalMemories}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Memor{statistics.totalMemories === 1 ? 'ia' : 'ie'} {formatPeriodLabel()}
                </p>
              </div>
            </div>

            {/* Mood Distribution */}
            {statistics.moodDistribution && Object.keys(statistics.moodDistribution).length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Distribuzione degli Stati d'Animo
                </h4>
                
                <div className="space-y-2">
                  {Object.entries(statistics.moodDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([moodId, count]) => {
                      const percentage = (count / statistics.totalMemories) * 100;
                      
                      return (
                        <div key={moodId} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate">
                                {moodId}
                              </span>
                              <span className="text-xs text-gray-600">
                                {count} ({formatNumber(percentage, 0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-blue-600"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Most Common Mood */}
            {statistics.mostCommonMood && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Stato d'animo più frequente {formatPeriodLabel()}: 
                    <span className="font-medium ml-1">{statistics.mostCommonMood}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Insights</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {statistics.averageMoodIntensity && statistics.averageMoodIntensity >= 4 && (
                  <p>• I tuoi stati d'animo sono molto positivi {formatPeriodLabel()}! 😊</p>
                )}
                
                {statistics.averageMoodIntensity && statistics.averageMoodIntensity < 3 && (
                  <p>• Potresti aver avuto momenti difficili {formatPeriodLabel()}. Prenditi cura di te. 💙</p>
                )}
                
                {statistics.moodTrend === 'improving' && (
                  <p>• Il tuo umore sta migliorando nel tempo! 📈</p>
                )}
                
                {statistics.moodTrend === 'declining' && (
                  <p>• Il tuo umore sembra in calo. Considera di parlare con qualcuno. 💭</p>
                )}
                
                {statistics.totalMemories === 1 && (
                  <p>• Hai creato solo una memoria {formatPeriodLabel()}. Che ne dici di aggiungerne altre?</p>
                )}
                
                {statistics.totalMemories >= 10 && (
                  <p>• Ottimo! Hai creato molte memorie {formatPeriodLabel()}. 🌟</p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 