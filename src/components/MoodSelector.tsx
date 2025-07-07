'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Smile, Meh, Frown, Search, X, Clock, MapPin, Sparkles } from 'lucide-react';
import { type Mood } from '@/lib/mood-system';
import { formatTime } from '@/lib/localization';

interface MoodSelectorProps {
  selectedMood?: string;
  onMoodSelect: (moodId: string | undefined) => void;
  variant?: 'default' | 'compact' | 'inline';
  showSuggestions?: boolean;
  context?: {
    time?: Date;
    location?: string;
    weather?: any;
  };
  className?: string;
  disabled?: boolean;
}

interface MoodData {
  moods: Mood[];
  moodsByCategory: {
    positive: Mood[];
    neutral: Mood[];
    negative: Mood[];
  };
  suggestions: Mood[];
}

const categoryIcons = {
  positive: Heart,
  neutral: Meh,
  negative: Frown,
};

const categoryColors = {
  positive: 'text-green-600 border-green-200 bg-green-50',
  neutral: 'text-gray-600 border-gray-200 bg-gray-50',
  negative: 'text-blue-600 border-blue-200 bg-blue-50',
};

const categoryLabels = {
  positive: 'Positivi',
  neutral: 'Neutri',
  negative: 'Negativi',
};

export default function MoodSelector({
  selectedMood,
  onMoodSelect,
  variant = 'default',
  showSuggestions = true,
  context,
  className = '',
  disabled = false,
}: MoodSelectorProps) {
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'positive' | 'neutral' | 'negative' | 'all'>('all');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchMoods();
  }, [context, showSuggestions]);

  const fetchMoods = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (showSuggestions) {
        params.append('suggest', 'true');
        if (context?.time) {
          params.append('time', context.time.toISOString());
        }
        if (context?.location) {
          params.append('location', context.location);
        }
      }

      const response = await fetch(`/api/moods?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setMoodData(result.data);
      } else {
        console.error('Errore nel caricamento degli stati d\'animo');
      }
    } catch (error) {
      console.error('Errore nel caricamento degli stati d\'animo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodSelect = (moodId: string) => {
    if (disabled) return;
    
    if (selectedMood === moodId) {
      onMoodSelect(undefined); // Deselect if clicking the same mood
    } else {
      onMoodSelect(moodId);
    }
    
    if (variant === 'compact' || variant === 'inline') {
      setIsOpen(false);
    }
  };

  const getFilteredMoods = (): Mood[] => {
    if (!moodData) return [];
    
    let moods = moodData.moods;
    
    // Filter by category
    if (activeCategory !== 'all') {
      moods = moodData.moodsByCategory[activeCategory];
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      moods = moods.filter(mood => 
        mood.nameIt.toLowerCase().includes(query) ||
        mood.name.toLowerCase().includes(query) ||
        mood.descriptionIt?.toLowerCase().includes(query)
      );
    }
    
    return moods;
  };

  const getSelectedMoodData = (): Mood | undefined => {
    if (!moodData || !selectedMood) return undefined;
    return moodData.moods.find(mood => mood.id === selectedMood);
  };

  const renderMoodButton = (mood: Mood, size: 'sm' | 'md' | 'lg' = 'md') => {
    const isSelected = selectedMood === mood.id;
    const sizeClasses = {
      sm: 'p-2 text-sm',
      md: 'p-3 text-base',
      lg: 'p-4 text-lg',
    };
    
    return (
      <Button
        key={mood.id}
        variant={isSelected ? 'default' : 'outline'}
        className={`${sizeClasses[size]} flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-105 ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        }`}
        style={{
          borderColor: isSelected ? mood.color : undefined,
          backgroundColor: isSelected ? `${mood.color}20` : undefined,
        }}
        onClick={() => handleMoodSelect(mood.id)}
        disabled={disabled}
        title={mood.descriptionIt || mood.description}
      >
        <span className="text-2xl">{mood.emoji}</span>
        <span className="text-xs font-medium text-center">{mood.nameIt}</span>
        {size === 'lg' && (
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: mood.intensity }, (_, i) => (
              <div key={i} className="w-1 h-1 bg-current rounded-full opacity-60" />
            ))}
          </div>
        )}
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Caricamento stati d'animo...</span>
      </div>
    );
  }

  if (!moodData) {
    return (
      <div className={`text-center text-gray-500 p-4 ${className}`}>
        Impossibile caricare gli stati d'animo
      </div>
    );
  }

  // Compact variant for mobile or small spaces
  if (variant === 'compact') {
    const selectedMoodData = getSelectedMoodData();
    
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedMoodData ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedMoodData.emoji}</span>
              <span>{selectedMoodData.nameIt}</span>
            </div>
          ) : (
            <span>Seleziona stato d'animo</span>
          )}
          <Search className="w-4 h-4" />
        </Button>

        {isOpen && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto">
            <CardContent className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {getFilteredMoods().slice(0, 12).map(mood => renderMoodButton(mood, 'sm'))}
              </div>
              {selectedMood && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoodSelect('')}
                  className="w-full mt-2 text-red-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Rimuovi stato d'animo
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Inline variant for within forms
  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {moodData.moods.slice(0, 8).map(mood => renderMoodButton(mood, 'sm'))}
        {selectedMood && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoodSelect(undefined)}
            className="text-red-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // Default full variant
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Come ti senti?</h3>
            {selectedMood && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoodSelect(undefined)}
                className="text-red-600"
              >
                <X className="w-4 h-4 mr-1" />
                Rimuovi
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca uno stato d'animo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled}
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('all')}
              disabled={disabled}
            >
              Tutti
            </Button>
            {Object.entries(categoryLabels).map(([category, label]) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              return (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category as any)}
                  disabled={disabled}
                  className={activeCategory === category ? categoryColors[category as keyof typeof categoryColors] : ''}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {label}
                </Button>
              );
            })}
          </div>

          {/* Suggestions */}
          {showSuggestions && moodData.suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4" />
                <span>Suggerimenti per te</span>
                {context?.time && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(context.time, 'short')}
                  </Badge>
                )}
                {context?.location && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {context.location}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-5 gap-3">
                {moodData.suggestions.map(mood => renderMoodButton(mood))}
              </div>
            </div>
          )}

          {/* All moods */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">
              {activeCategory === 'all' ? 'Tutti gli stati d\'animo' : `Stati d'animo ${categoryLabels[activeCategory as keyof typeof categoryLabels]?.toLowerCase()}`}
            </h4>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {getFilteredMoods().map(mood => renderMoodButton(mood))}
            </div>
          </div>

          {/* Selected mood info */}
          {selectedMood && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              {(() => {
                const mood = getSelectedMoodData();
                if (!mood) return null;
                
                return (
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{mood.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-lg">{mood.nameIt}</h4>
                      <p className="text-sm text-gray-600 mt-1">{mood.descriptionIt || mood.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge 
                          variant="outline" 
                          className={categoryColors[mood.category]}
                        >
                          {categoryLabels[mood.category]}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Intensità:</span>
                          {Array.from({ length: 5 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < mood.intensity ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 