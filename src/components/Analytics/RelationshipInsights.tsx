'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  Award, 
  Eye,
  Sparkles,
  Heart,
  Target,
  Calendar
} from 'lucide-react';

interface Insights {
  topMoods: string[];
  bestDays: string[];
  improvementSuggestions: string[];
  achievements: string[];
  patterns: string[];
}

interface RelationshipInsightsProps {
  data: Insights;
  className?: string;
}

export function RelationshipInsights({ data, className = '' }: RelationshipInsightsProps) {
  const { topMoods, bestDays, improvementSuggestions, achievements, patterns } = data;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'mood': return <Heart className="w-4 h-4" />;
      case 'day': return <Calendar className="w-4 h-4" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4" />;
      case 'achievement': return <Award className="w-4 h-4" />;
      case 'pattern': return <Eye className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'mood': return 'text-pink-600 bg-pink-100';
      case 'day': return 'text-blue-600 bg-blue-100';
      case 'suggestion': return 'text-yellow-600 bg-yellow-100';
      case 'achievement': return 'text-green-600 bg-green-100';
      case 'pattern': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span>Insights della Relazione</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Top Moods */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {getInsightIcon('mood')}
              <h4 className="font-medium text-gray-900">I Vostri Umori Principali</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {topMoods.map((mood, index) => (
                <Badge key={index} className={getInsightColor('mood')}>
                  #{index + 1} {mood}
                </Badge>
              ))}
            </div>
          </div>

          {/* Best Days */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {getInsightIcon('day')}
              <h4 className="font-medium text-gray-900">I Vostri Giorni Migliori</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {bestDays.map((day, index) => (
                <Badge key={index} className={getInsightColor('day')}>
                  {day}
                </Badge>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {getInsightIcon('achievement')}
              <h4 className="font-medium text-gray-900">Traguardi Raggiunti</h4>
            </div>
            <div className="space-y-2">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <Award className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-medium">{achievement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patterns */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {getInsightIcon('pattern')}
              <h4 className="font-medium text-gray-900">Pattern Osservati</h4>
            </div>
            <div className="space-y-2">
              {patterns.map((pattern, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Eye className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-purple-800">{pattern}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {getInsightIcon('suggestion')}
              <h4 className="font-medium text-gray-900">Suggerimenti per Migliorare</h4>
            </div>
            <div className="space-y-2">
              {improvementSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800">{suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-pink-600" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-pink-600">{topMoods.length}</p>
                <p className="text-xs text-gray-500">Umori Top</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-green-600">{achievements.length}</p>
                <p className="text-xs text-gray-500">Traguardi</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Eye className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-purple-600">{patterns.length}</p>
                <p className="text-xs text-gray-500">Pattern</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-yellow-600" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-yellow-600">{improvementSuggestions.length}</p>
                <p className="text-xs text-gray-500">Suggerimenti</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 