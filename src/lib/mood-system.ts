import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

export interface Mood {
  id: string;
  name: string;
  nameIt: string; // Italian name
  emoji: string;
  color: string;
  category: 'positive' | 'neutral' | 'negative';
  intensity: number; // 1-5 scale
  description?: string;
  descriptionIt?: string; // Italian description
}

export const moods: Mood[] = [
  // Positive moods
  {
    id: 'euforia',
    name: 'Euphoric',
    nameIt: 'Euforico/a',
    emoji: '🤩',
    color: '#FF6B6B',
    category: 'positive',
    intensity: 5,
    description: 'Extremely happy and excited',
    descriptionIt: 'Estremamente felice ed eccitato/a'
  },
  {
    id: 'felice',
    name: 'Happy',
    nameIt: 'Felice',
    emoji: '😄',
    color: '#4ECDC4',
    category: 'positive',
    intensity: 4,
    description: 'Joyful and content',
    descriptionIt: 'Gioioso/a e soddisfatto/a'
  },
  {
    id: 'amore',
    name: 'In Love',
    nameIt: 'Innamorato/a',
    emoji: '🥰',
    color: '#FF69B4',
    category: 'positive',
    intensity: 5,
    description: 'Feeling love and affection',
    descriptionIt: 'Provando amore e affetto'
  },
  {
    id: 'eccitato',
    name: 'Excited',
    nameIt: 'Eccitato/a',
    emoji: '🎉',
    color: '#FFD93D',
    category: 'positive',
    intensity: 4,
    description: 'Full of enthusiasm and anticipation',
    descriptionIt: 'Pieno/a di entusiasmo e aspettativa'
  },
  {
    id: 'grato',
    name: 'Grateful',
    nameIt: 'Grato/a',
    emoji: '🙏',
    color: '#95E1D3',
    category: 'positive',
    intensity: 3,
    description: 'Feeling thankful and appreciative',
    descriptionIt: 'Sentendosi riconoscente e apprezzato/a'
  },
  {
    id: 'sereno',
    name: 'Peaceful',
    nameIt: 'Sereno/a',
    emoji: '😌',
    color: '#A8E6CF',
    category: 'positive',
    intensity: 3,
    description: 'Calm and tranquil',
    descriptionIt: 'Calmo/a e tranquillo/a'
  },
  {
    id: 'rilassato',
    name: 'Relaxed',
    nameIt: 'Rilassato/a',
    emoji: '😎',
    color: '#87CEEB',
    category: 'positive',
    intensity: 2,
    description: 'At ease and comfortable',
    descriptionIt: 'A proprio agio e comodo/a'
  },
  
  // Neutral moods
  {
    id: 'neutrale',
    name: 'Neutral',
    nameIt: 'Neutrale',
    emoji: '😐',
    color: '#B0B0B0',
    category: 'neutral',
    intensity: 2,
    description: 'Neither positive nor negative',
    descriptionIt: 'Né positivo né negativo'
  },
  {
    id: 'pensieroso',
    name: 'Thoughtful',
    nameIt: 'Pensieroso/a',
    emoji: '🤔',
    color: '#DDA0DD',
    category: 'neutral',
    intensity: 2,
    description: 'Deep in thought and contemplation',
    descriptionIt: 'Immerso/a nei pensieri e nella contemplazione'
  },
  {
    id: 'curioso',
    name: 'Curious',
    nameIt: 'Curioso/a',
    emoji: '🧐',
    color: '#F0E68C',
    category: 'neutral',
    intensity: 3,
    description: 'Interested and inquisitive',
    descriptionIt: 'Interessato/a e pieno/a di curiosità'
  },
  {
    id: 'nostalgico',
    name: 'Nostalgic',
    nameIt: 'Nostalgico/a',
    emoji: '🥺',
    color: '#D2B48C',
    category: 'neutral',
    intensity: 2,
    description: 'Feeling sentimental about the past',
    descriptionIt: 'Sentendosi sentimentale verso il passato'
  },
  
  // Negative moods
  {
    id: 'triste',
    name: 'Sad',
    nameIt: 'Triste',
    emoji: '😢',
    color: '#6495ED',
    category: 'negative',
    intensity: 3,
    description: 'Feeling sorrow or unhappiness',
    descriptionIt: 'Provando dolore o infelicità'
  },
  {
    id: 'stressato',
    name: 'Stressed',
    nameIt: 'Stressato/a',
    emoji: '😰',
    color: '#FF7F7F',
    category: 'negative',
    intensity: 4,
    description: 'Feeling overwhelmed or under pressure',
    descriptionIt: 'Sentendosi sopraffatto/a o sotto pressione'
  },
  {
    id: 'stanco',
    name: 'Tired',
    nameIt: 'Stanco/a',
    emoji: '😴',
    color: '#C0C0C0',
    category: 'negative',
    intensity: 2,
    description: 'Feeling exhausted or weary',
    descriptionIt: 'Sentendosi esausto/a o affaticato/a'
  },
  {
    id: 'ansioso',
    name: 'Anxious',
    nameIt: 'Ansioso/a',
    emoji: '😟',
    color: '#DDA0DD',
    category: 'negative',
    intensity: 4,
    description: 'Feeling worried or uneasy',
    descriptionIt: 'Sentendosi preoccupato/a o a disagio'
  },
  {
    id: 'frustrato',
    name: 'Frustrated',
    nameIt: 'Frustrato/a',
    emoji: '😤',
    color: '#CD5C5C',
    category: 'negative',
    intensity: 3,
    description: 'Feeling annoyed or impatient',
    descriptionIt: 'Sentendosi infastidito/a o impaziente'
  },
];

// Mood utility functions
export const getMoodById = (id: string): Mood | undefined => {
  return moods.find(mood => mood.id === id);
};

export const getMoodsByCategory = (category: Mood['category']): Mood[] => {
  return moods.filter(mood => mood.category === category);
};

export const getMoodsByIntensity = (minIntensity: number, maxIntensity: number): Mood[] => {
  return moods.filter(mood => mood.intensity >= minIntensity && mood.intensity <= maxIntensity);
};

export const getMoodColor = (moodId: string): string => {
  const mood = getMoodById(moodId);
  return mood?.color || '#B0B0B0';
};

export const getMoodEmoji = (moodId: string): string => {
  const mood = getMoodById(moodId);
  return mood?.emoji || '😐';
};

export const getMoodName = (moodId: string, locale: 'en' | 'it' = 'it'): string => {
  const mood = getMoodById(moodId);
  if (!mood) return 'Sconosciuto';
  return locale === 'it' ? mood.nameIt : mood.name;
};

// Mood analysis functions
export interface MoodStats {
  totalMoods: number;
  averageIntensity: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  mostCommonMood: Mood | null;
  moodDistribution: { mood: Mood; count: number; percentage: number }[];
  categoryDistribution: { category: Mood['category']; count: number; percentage: number }[];
}

export const analyzeMoods = (moodIds: string[]): MoodStats => {
  const moodCounts = new Map<string, number>();
  const categoryCounts = new Map<Mood['category'], number>();
  let totalIntensity = 0;
  
  // Count mood occurrences and calculate intensity
  moodIds.forEach(moodId => {
    const mood = getMoodById(moodId);
    if (mood) {
      moodCounts.set(moodId, (moodCounts.get(moodId) || 0) + 1);
      categoryCounts.set(mood.category, (categoryCounts.get(mood.category) || 0) + 1);
      totalIntensity += mood.intensity;
    }
  });
  
  const totalMoods = moodIds.length;
  const averageIntensity = totalMoods > 0 ? totalIntensity / totalMoods : 0;
  
  // Calculate percentages by category
  const positiveCount = categoryCounts.get('positive') || 0;
  const neutralCount = categoryCounts.get('neutral') || 0;
  const negativeCount = categoryCounts.get('negative') || 0;
  
  const positivePercentage = totalMoods > 0 ? (positiveCount / totalMoods) * 100 : 0;
  const neutralPercentage = totalMoods > 0 ? (neutralCount / totalMoods) * 100 : 0;
  const negativePercentage = totalMoods > 0 ? (negativeCount / totalMoods) * 100 : 0;
  
  // Find most common mood
  let mostCommonMoodId = '';
  let maxCount = 0;
  moodCounts.forEach((count, moodId) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonMoodId = moodId;
    }
  });
  
  const mostCommonMood = getMoodById(mostCommonMoodId) || null;
  
  // Create mood distribution
  const moodDistribution = Array.from(moodCounts.entries()).map(([moodId, count]) => ({
    mood: getMoodById(moodId)!,
    count,
    percentage: (count / totalMoods) * 100
  })).sort((a, b) => b.count - a.count);
  
  // Create category distribution
  const categoryDistribution: { category: Mood['category']; count: number; percentage: number }[] = [
    { category: 'positive', count: positiveCount, percentage: positivePercentage },
    { category: 'neutral', count: neutralCount, percentage: neutralPercentage },
    { category: 'negative', count: negativeCount, percentage: negativePercentage },
  ];
  
  return {
    totalMoods,
    averageIntensity,
    positivePercentage,
    neutralPercentage,
    negativePercentage,
    mostCommonMood,
    moodDistribution,
    categoryDistribution,
  };
};

// Time-based mood analysis
export interface TimebasedMoodData {
  date: string;
  moods: string[];
  averageIntensity: number;
  dominantCategory: Mood['category'];
}

export const getMoodTrends = (
  memories: { date: string; mood?: string }[],
  period: 'day' | 'week' | 'month' = 'day'
): TimebasedMoodData[] => {
  const groupedByPeriod = new Map<string, string[]>();
  
  memories.forEach(memory => {
    if (memory.mood) {
      const date = new Date(memory.date);
      let periodKey: string;
      
      switch (period) {
        case 'week':
          periodKey = format(startOfWeek(date), 'yyyy-MM-dd');
          break;
        case 'month':
          periodKey = format(startOfMonth(date), 'yyyy-MM');
          break;
        default:
          periodKey = format(startOfDay(date), 'yyyy-MM-dd');
      }
      
      if (!groupedByPeriod.has(periodKey)) {
        groupedByPeriod.set(periodKey, []);
      }
      groupedByPeriod.get(periodKey)!.push(memory.mood);
    }
  });
  
  return Array.from(groupedByPeriod.entries()).map(([date, moods]) => {
    const stats = analyzeMoods(moods);
    const dominantCategory = stats.categoryDistribution
      .sort((a, b) => b.count - a.count)[0]?.category || 'neutral';
    
    return {
      date,
      moods,
      averageIntensity: stats.averageIntensity,
      dominantCategory,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
};

// Mood prediction and suggestions
export const suggestMoodBasedOnContext = (
  time: Date,
  location?: string,
  weather?: any,
  recentMoods?: string[]
): Mood[] => {
  const suggestions: Mood[] = [];
  const hour = time.getHours();
  
  // Time-based suggestions
  if (hour >= 6 && hour <= 10) {
    // Morning - suggest energetic moods
    suggestions.push(...getMoodsByCategory('positive').filter(m => ['eccitato', 'felice'].includes(m.id)));
  } else if (hour >= 18 && hour <= 22) {
    // Evening - suggest relaxed moods
    suggestions.push(...moods.filter(m => ['rilassato', 'sereno', 'grato'].includes(m.id)));
  }
  
  // Weather-based suggestions (if weather data available)
  if (weather?.condition) {
    const condition = weather.condition.toLowerCase();
    if (condition.includes('sun') || condition.includes('clear')) {
      suggestions.push(...moods.filter(m => ['felice', 'eccitato'].includes(m.id)));
    } else if (condition.includes('rain') || condition.includes('cloud')) {
      suggestions.push(...moods.filter(m => ['nostalgico', 'pensieroso'].includes(m.id)));
    }
  }
  
  // Location-based suggestions
  if (location) {
    const loc = location.toLowerCase();
    if (loc.includes('home') || loc.includes('casa')) {
      suggestions.push(...moods.filter(m => ['rilassato', 'sereno'].includes(m.id)));
    } else if (loc.includes('restaurant') || loc.includes('ristorante')) {
      suggestions.push(...moods.filter(m => ['felice', 'grato'].includes(m.id)));
    }
  }
  
  // Remove duplicates and return top 5
  const uniqueSuggestions = suggestions.filter((mood, index, self) => 
    self.findIndex(m => m.id === mood.id) === index
  );
  
  return uniqueSuggestions.slice(0, 5);
};

export default {
  moods,
  getMoodById,
  getMoodsByCategory,
  getMoodsByIntensity,
  getMoodColor,
  getMoodEmoji,
  getMoodName,
  analyzeMoods,
  getMoodTrends,
  suggestMoodBasedOnContext,
}; 