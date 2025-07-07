import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  moods, 
  getMoodsByCategory, 
  getMoodsByIntensity, 
  suggestMoodBasedOnContext,
  type Mood
} from '@/lib/mood-system';

// GET /api/moods - Get all available moods and mood utilities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'positive' | 'neutral' | 'negative' | null;
    const minIntensity = searchParams.get('minIntensity');
    const maxIntensity = searchParams.get('maxIntensity');
    const suggest = searchParams.get('suggest') === 'true';
    const location = searchParams.get('location');
    const time = searchParams.get('time');

    let filteredMoods: Mood[] = moods;

    // Filter by category if specified
    if (category) {
      filteredMoods = getMoodsByCategory(category);
    }

    // Filter by intensity range if specified
    if (minIntensity && maxIntensity) {
      const min = parseInt(minIntensity, 10);
      const max = parseInt(maxIntensity, 10);
      if (!isNaN(min) && !isNaN(max)) {
        filteredMoods = filteredMoods.filter(mood => 
          mood.intensity >= min && mood.intensity <= max
        );
      }
    }

    // Generate mood suggestions based on context
    let suggestions: Mood[] = [];
    if (suggest) {
      const contextTime = time ? new Date(time) : new Date();
      suggestions = suggestMoodBasedOnContext(contextTime, location || undefined);
    }

    // Group moods by category for easier consumption
    const moodsByCategory = {
      positive: getMoodsByCategory('positive'),
      neutral: getMoodsByCategory('neutral'),
      negative: getMoodsByCategory('negative'),
    };

    // Calculate mood statistics
    const moodStats = {
      total: moods.length,
      byCategory: {
        positive: moodsByCategory.positive.length,
        neutral: moodsByCategory.neutral.length,
        negative: moodsByCategory.negative.length,
      },
      byIntensity: {
        low: getMoodsByIntensity(1, 2).length,
        medium: getMoodsByIntensity(3, 3).length,
        high: getMoodsByIntensity(4, 5).length,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        moods: filteredMoods,
        moodsByCategory,
        suggestions,
        stats: moodStats,
        meta: {
          filtered: filteredMoods.length !== moods.length,
          filterCriteria: {
            category,
            minIntensity,
            maxIntensity,
            suggest,
            location,
            time,
          },
        },
      },
    });

  } catch (error) {
    console.error('Errore nel caricamento degli stati d\'animo:', error);
    return NextResponse.json(
      { error: 'Errore nel caricamento degli stati d\'animo' },
      { status: 500 }
    );
  }
} 