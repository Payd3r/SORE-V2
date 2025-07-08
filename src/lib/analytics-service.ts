import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getMoodById, moods } from './mood-system';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Fetches statistics for a given couple.
 * @param coupleId The ID of the couple.
 * @returns An object containing various statistics.
 */
export async function getCoupleAnalytics(coupleId: string) {
  if (!coupleId) {
    throw new Error('Couple ID is required');
  }

  const memoryStats = await getMemoryStats(coupleId);
  const moodDistribution = await getMoodDistribution(coupleId);
  const moodTrends = await getMoodTrends(coupleId, 'monthly');
  const locationStats = await getLocationStats(coupleId);
  const activityStats = await getActivityStats(coupleId);
  const challengeStats = await getChallengeStats(coupleId);
  const insights = getInsightsAndSuggestions({ moodDistribution, activityStats, locationStats });

  return {
    relationshipMetrics: {
        totalMemories: memoryStats.totalMemories,
        sharedMemories: 0, // Placeholder
        moodCompatibility: 0, // Placeholder
        communicationFrequency: 0, // Placeholder
        activityDiversity: 0, // Placeholder
    },
    moodDistribution,
    moodTrends,
    insights,
    periodComparison: { // Placeholder
        thisMonth: { averageMood: 0, memoriesCount: 0 },
        lastMonth: { averageMood: 0, memoriesCount: 0 },
        change: { mood: 0, memories: 0 },
    },
    locationStats,
    activityStats,
    challengeStats,
  };
}

/**
 * Calculates statistics about memories for a given couple.
 * @param coupleId The ID of the couple.
 */
async function getMemoryStats(coupleId: string) {
  const totalMemories = await prisma.memory.count({
    where: { coupleId },
  });

  const memoriesWithLocation = await prisma.memory.count({
    where: {
      coupleId,
      NOT: {
        location: null,
      },
    },
  });

  return {
    totalMemories,
    memoriesWithLocation,
  };
}

/**
 * Calculates the distribution of moods for a given couple.
 * @param coupleId The ID of the couple.
 */
async function getMoodDistribution(coupleId: string) {
    const memoriesWithMood = await prisma.memory.findMany({
        where: { coupleId, mood: { not: null } },
        select: { mood: true },
    });

    const totalMoods = memoriesWithMood.length;
    if (totalMoods === 0) return {};

    const distribution = await prisma.memory.groupBy({
        by: ['mood'],
        _count: {
          mood: true,
        },
        where: {
          coupleId,
          mood: { not: null },
        },
    });
    
    const moodDistributionMap: { [moodId: string]: any } = {};

    for (const item of distribution) {
        if(item.mood) {
            const moodDetails = getMoodById(item.mood);
            moodDistributionMap[item.mood] = {
                count: item._count.mood,
                percentage: (item._count.mood / totalMoods) * 100,
                name: moodDetails?.nameIt || item.mood,
                emoji: moodDetails?.emoji || '❓',
            };
        }
    }
      
    return moodDistributionMap;
}

/**
 * Fetches mood trends for a given couple over a specified period.
 * @param coupleId The ID of the couple.
 * @param period The time period to analyze ('daily', 'weekly', 'monthly').
 */
async function getMoodTrends(coupleId: string, period: 'daily' | 'weekly' | 'monthly') {
    // This is a simplified version. A full implementation would require more complex date grouping
    // which can be tricky with SQLite across different environments.
    // For now, we fetch all memories and process in JS.
    // In a production environment with PostgreSQL, this could be a more efficient SQL query.

    const memories = await prisma.memory.findMany({
        where: { coupleId, mood: { not: null } },
        select: { date: true, mood: true },
        orderBy: { date: 'asc' },
    });

    // Helper to get mood intensity
    const getIntensity = (moodId: string | null) => {
        if (!moodId) return 0;
        const mood = getMoodById(moodId);
        return mood?.intensity || 0;
    };

    const trends = {
        daily: [] as { date: string; averageMood: number; moodCount: number }[],
        weekly: [] as { week: string; averageMood: number; moodCount: number }[],
        monthly: [] as { month: string; averageMood: number; moodCount: number }[],
    };

    // This is a simplified aggregation. For a real app, you'd use a library or more robust grouping.
    const monthlyData: { [key: string]: { totalIntensity: number; count: number } } = {};

    memories.forEach(mem => {
        const month = mem.date.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = { totalIntensity: 0, count: 0 };
        }
        monthlyData[month].totalIntensity += getIntensity(mem.mood);
        monthlyData[month].count++;
    });

    trends.monthly = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        averageMood: data.count > 0 ? data.totalIntensity / data.count : 0,
        moodCount: data.count,
    }));
    
    // For now, daily and weekly are empty placeholders
    return trends;
}

/**
 * Gathers statistics about locations for a given couple.
 * @param coupleId The ID of the couple.
 */
async function getLocationStats(coupleId: string) {
    const locations = await prisma.memory.groupBy({
        by: ['location', 'latitude', 'longitude'],
        _count: {
            location: true,
        },
        where: {
            coupleId,
            location: { not: null },
            latitude: { not: null },
            longitude: { not: null },
        },
        orderBy: {
            _count: {
                location: 'desc',
            },
        },
        take: 10, // Get top 10 locations
    });

    const allCoordinates = await prisma.memory.findMany({
        where: {
            coupleId,
            latitude: { not: null },
            longitude: { not: null },
        },
        select: {
            latitude: true,
            longitude: true,
            title: true,
            date: true,
        },
    });

    return {
        topLocations: locations.map(l => ({
            name: l.location,
            count: l._count.location,
            latitude: l.latitude,
            longitude: l.longitude,
        })),
        coordinates: allCoordinates.map(c => ({
            lat: parseFloat(c.latitude!),
            lng: parseFloat(c.longitude!),
            title: c.title,
            date: c.date,
        })),
    };
}

/**
 * Gathers statistics about activities based on memory categories.
 * @param coupleId The ID of the couple.
 */
async function getActivityStats(coupleId: string) {
    const activityDistribution = await prisma.memory.groupBy({
        by: ['category'],
        _count: {
            category: true,
        },
        where: {
            coupleId,
            category: { not: null },
        },
        orderBy: {
            _count: {
                category: 'desc',
            },
        },
    });

    const totalMemoriesWithCategory = await prisma.memory.count({
        where: {
            coupleId,
            category: { not: null },
        },
    });

    return {
        distribution: activityDistribution.map(act => ({
            name: act.category,
            count: act._count.category,
            percentage: totalMemoriesWithCategory > 0 ? (act._count.category / totalMemoriesWithCategory) * 100 : 0,
        })),
        totalActivities: totalMemoriesWithCategory,
        diversity: activityDistribution.length,
    };
}

/**
 * Gathers statistics about challenges for a given couple.
 * @param coupleId The ID of the couple.
 */
async function getChallengeStats(coupleId: string) {
    const challenges = await prisma.challenge.findMany({
        where: { coupleId },
    });

    const totalChallenges = challenges.length;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const activeChallenges = challenges.filter(c => c.status === 'active').length;

    const averageCompletion = totalChallenges > 0
        ? (completedChallenges / totalChallenges) * 100
        : 0;

    return {
        totalChallenges,
        completedChallenges,
        activeChallenges,
        averageCompletion,
    };
}

/**
 * Generates insights and suggestions based on analytics data.
 * This is a rule-based simulation of ML insights.
 */
function getInsightsAndSuggestions(data: {
    moodDistribution: { [key: string]: { name: string; count: number } };
    activityStats: { distribution: { name: string | null }[], diversity: number };
    locationStats: { topLocations: { name: string | null, count: number }[] };
}) {
    const { moodDistribution, activityStats, locationStats } = data;
    const suggestions: string[] = [];
    const achievements: string[] = [];
    const patterns: string[] = [];

    // Mood-based insights
    const topMoodEntry = Object.entries(moodDistribution).sort(([, a], [, b]) => b.count - a.count)[0];
    if (topMoodEntry) {
        const topMood = topMoodEntry[1];
        patterns.push(`Il vostro umore più comune è "${topMood.name}", che bello!`);
        if (topMood.name === 'Felice' || topMood.name === 'Innamorato/a') {
            achievements.push("Mantenere un'atmosfera così positiva è un grande traguardo di coppia.");
        }
    }

    // Activity-based insights
    if (activityStats.distribution.length > 0) {
        const topActivity = activityStats.distribution[0];
        if (topActivity.name) {
            patterns.push(`Sembra che le attività di tipo "${topActivity.name}" siano le vostre preferite.`);
            suggestions.push(`Avete provato a esplorare altre attività simili a "${topActivity.name}"? Potrebbe piacervi!`);
        }
    }
    if (activityStats.diversity > 5) {
        achievements.push(`Avete una grande diversità nelle vostre attività (${activityStats.diversity} tipi diversi). Complimenti!`);
    }

    // Location-based insights
    if (locationStats.topLocations.length > 0) {
        const topLocation = locationStats.topLocations[0];
        if (topLocation.name) {
            patterns.push(`"${topLocation.name}" è un posto speciale per voi, ci siete stati ${topLocation.count} volte.`);
            suggestions.push(`Che ne dite di tornare a "${topLocation.name}" per creare nuovi ricordi?`);
        }
    }

    return {
        topMoods: Object.values(moodDistribution).sort((a, b) => b.count - a.count).slice(0, 3).map(mood => mood.name),
        bestDays: [], // Placeholder
        improvementSuggestions: suggestions,
        achievements,
        patterns,
    };
} 