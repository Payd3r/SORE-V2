import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeMoods, getMoodTrends, getMoodById, type TimebasedMoodData } from '@/lib/mood-system';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';

// GET /api/memories/mood-stats - Get mood statistics and analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true },
    });

    if (!user?.couple) {
      return NextResponse.json({ error: 'User not part of a couple' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, year, month, week
    const timeframe = searchParams.get('timeframe') || 'day'; // day, week, month for trend analysis
    const includeEmpty = searchParams.get('includeEmpty') === 'true';

    // Set date range based on period
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (period) {
      case 'month':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'year':
        startDate = startOfYear(new Date());
        endDate = endOfYear(new Date());
        break;
      case '3months':
        startDate = subMonths(new Date(), 3);
        endDate = new Date();
        break;
      case '6months':
        startDate = subMonths(new Date(), 6);
        endDate = new Date();
        break;
      case 'all':
      default:
        // No date filtering
        break;
    }

    // Build query conditions
    const whereCondition: any = {
      coupleId: user.couple.id,
    };

    if (startDate && endDate) {
      whereCondition.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (!includeEmpty) {
      whereCondition.mood = {
        not: null,
      };
    }

    // Get memories with mood data
    const memories = await prisma.memory.findMany({
      where: whereCondition,
      select: {
        id: true,
        date: true,
        mood: true,
        location: true,
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Filter memories with moods for analysis
    const memoriesWithMoods = memories.filter(memory => memory.mood);
    const moodIds = memoriesWithMoods.map(memory => memory.mood!);

    // Basic mood analysis
    const moodStats = analyzeMoods(moodIds);

    // Time-based trends
    const trends = getMoodTrends(
      memoriesWithMoods.map(m => ({ date: m.date.toISOString(), mood: m.mood! })),
      timeframe as 'day' | 'week' | 'month'
    );

    // Author-specific analysis
    const authorStats = new Map();
    memoriesWithMoods.forEach(memory => {
      const authorId = memory.author.id;
      if (!authorStats.has(authorId)) {
        authorStats.set(authorId, {
          author: memory.author,
          moods: [],
        });
      }
      authorStats.get(authorId).moods.push(memory.mood!);
    });

    const authorAnalysis = Array.from(authorStats.entries()).map(([authorId, data]) => ({
      author: data.author,
      stats: analyzeMoods(data.moods),
    }));

    // Location-based mood analysis
    const locationMoods = new Map();
    memoriesWithMoods.forEach(memory => {
      if (memory.location) {
        const location = memory.location.toLowerCase();
        if (!locationMoods.has(location)) {
          locationMoods.set(location, []);
        }
        locationMoods.get(location).push(memory.mood!);
      }
    });

    const locationAnalysis = Array.from(locationMoods.entries()).map(([location, moods]) => ({
      location,
      moodCount: moods.length,
      stats: analyzeMoods(moods),
    })).sort((a, b) => b.moodCount - a.moodCount).slice(0, 10); // Top 10 locations

    // Category-based mood analysis
    const categoryMoods = new Map();
    memoriesWithMoods.forEach(memory => {
      if (memory.category) {
        if (!categoryMoods.has(memory.category)) {
          categoryMoods.set(memory.category, []);
        }
        categoryMoods.get(memory.category).push(memory.mood!);
      }
    });

    const categoryAnalysis = Array.from(categoryMoods.entries()).map(([category, moods]) => ({
      category,
      moodCount: moods.length,
      stats: analyzeMoods(moods),
    })).sort((a, b) => b.moodCount - a.moodCount);

    // Recent mood patterns (last 30 days)
    const thirtyDaysAgo = subMonths(new Date(), 1);
    const recentMemories = memoriesWithMoods.filter(
      memory => new Date(memory.date) >= thirtyDaysAgo
    );
    const recentMoodStats = analyzeMoods(recentMemories.map(m => m.mood!));

    // Monthly comparison (current vs previous month)
    const currentMonth = memoriesWithMoods.filter(memory => {
      const memoryDate = new Date(memory.date);
      return memoryDate >= startOfMonth(new Date()) && memoryDate <= endOfMonth(new Date());
    });

    const previousMonth = memoriesWithMoods.filter(memory => {
      const memoryDate = new Date(memory.date);
      const prevMonthStart = startOfMonth(subMonths(new Date(), 1));
      const prevMonthEnd = endOfMonth(subMonths(new Date(), 1));
      return memoryDate >= prevMonthStart && memoryDate <= prevMonthEnd;
    });

    const currentMonthStats = analyzeMoods(currentMonth.map(m => m.mood!));
    const previousMonthStats = analyzeMoods(previousMonth.map(m => m.mood!));

    // Calculate mood score trends
    const moodScoreTrend = currentMonthStats.averageIntensity - previousMonthStats.averageIntensity;
    const positivityTrend = currentMonthStats.positivePercentage - previousMonthStats.positivePercentage;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalMemories: memories.length,
          memoriesWithMoods: memoriesWithMoods.length,
          moodCoverage: memoriesWithMoods.length / Math.max(memories.length, 1) * 100,
          period,
          dateRange: {
            start: startDate?.toISOString(),
            end: endDate?.toISOString(),
          },
        },
        overallStats: moodStats,
        recentStats: recentMoodStats,
        trends: trends,
        authorAnalysis: authorAnalysis,
        locationAnalysis: locationAnalysis,
        categoryAnalysis: categoryAnalysis,
        monthlyComparison: {
          current: {
            period: 'current_month',
            stats: currentMonthStats,
            memoryCount: currentMonth.length,
          },
          previous: {
            period: 'previous_month',
            stats: previousMonthStats,
            memoryCount: previousMonth.length,
          },
          trends: {
            moodScore: moodScoreTrend,
            positivity: positivityTrend,
            memoryCount: currentMonth.length - previousMonth.length,
          },
        },
      },
    });

  } catch (error) {
    console.error('Error fetching mood statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mood statistics' },
      { status: 500 }
    );
  }
} 