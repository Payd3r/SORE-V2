'use client';

import { useState, useEffect } from 'react';
import { type Mood } from '@/lib/mood-system';

interface UseMoodSelectionProps {
  initialMood?: string;
  context?: {
    time?: Date;
    location?: string;
    weather?: any;
  };
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

export function useMoodSelection({ initialMood, context }: UseMoodSelectionProps = {}) {
  const [selectedMood, setSelectedMood] = useState<string | undefined>(initialMood);
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMoodData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('suggest', 'true');
      
      if (context?.time) {
        params.append('time', context.time.toISOString());
      }
      
      if (context?.location) {
        params.append('location', context.location);
      }

      const response = await fetch(`/api/moods?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mood data');
      }
      
      const result = await response.json();
      setMoodData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching mood data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoodData();
  }, [context?.time, context?.location]);

  const handleMoodSelect = (moodId: string | undefined) => {
    setSelectedMood(moodId);
  };

  const getSelectedMoodData = (): Mood | undefined => {
    if (!moodData || !selectedMood) return undefined;
    return moodData.moods.find(mood => mood.id === selectedMood);
  };

  const getMoodsByCategory = (category: 'positive' | 'neutral' | 'negative'): Mood[] => {
    return moodData?.moodsByCategory[category] || [];
  };

  const getSuggestions = (): Mood[] => {
    return moodData?.suggestions || [];
  };

  const getAllMoods = (): Mood[] => {
    return moodData?.moods || [];
  };

  const reset = () => {
    setSelectedMood(undefined);
    setError(null);
  };

  return {
    selectedMood,
    selectedMoodData: getSelectedMoodData(),
    moodData,
    isLoading,
    error,
    handleMoodSelect,
    getMoodsByCategory,
    getSuggestions,
    getAllMoods,
    reset,
    refetch: fetchMoodData,
  };
} 