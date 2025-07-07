import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/challenges/stats - Get challenge statistics
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

    // Get all challenges for the couple
    const challenges = await prisma.challenge.findMany({
      where: {
        coupleId: user.couple.id,
      },
      select: {
        id: true,
        status: true,
        difficulty: true,
        category: true,
        progress: true,
        createdAt: true,
        completedAt: true,
        startDate: true,
        endDate: true,
      },
    });

    // Calculate basic statistics
    const totalChallenges = challenges.length;
    const activeChallenges = challenges.filter(c => c.status === 'active').length;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const pausedChallenges = challenges.filter(c => c.status === 'paused').length;
    const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

    // Calculate average progress
    const totalProgress = challenges.reduce((sum, c) => sum + c.progress, 0);
    const averageProgress = totalChallenges > 0 ? totalProgress / totalChallenges : 0;

    // Distribution by difficulty
    const difficultyDistribution = challenges.reduce((acc, challenge) => {
      acc[challenge.difficulty] = (acc[challenge.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribution by category
    const categoryDistribution = challenges.reduce((acc, challenge) => {
      const category = challenge.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribution by status
    const statusDistribution = challenges.reduce((acc, challenge) => {
      acc[challenge.status] = (acc[challenge.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average completion time for completed challenges
    const completedWithTimes = challenges.filter(c => 
      c.status === 'completed' && c.completedAt && c.startDate
    );
    
    const averageCompletionDays = completedWithTimes.length > 0 
      ? completedWithTimes.reduce((sum, c) => {
          const start = new Date(c.startDate);
          const end = new Date(c.completedAt!);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / completedWithTimes.length
      : 0;

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentChallenges = challenges.filter(c => 
      new Date(c.createdAt) >= thirtyDaysAgo
    ).length;

    const recentCompletions = challenges.filter(c => 
      c.completedAt && new Date(c.completedAt) >= thirtyDaysAgo
    ).length;

    // Monthly trend data (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthChallenges = challenges.filter(c => {
        const createdAt = new Date(c.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      const monthCompletions = challenges.filter(c => {
        if (!c.completedAt) return false;
        const completedAt = new Date(c.completedAt);
        return completedAt >= monthStart && completedAt <= monthEnd;
      }).length;

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        created: monthChallenges,
        completed: monthCompletions,
      });
    }

    // Progress distribution
    const progressRanges = {
      '0-25%': challenges.filter(c => c.progress >= 0 && c.progress <= 25).length,
      '26-50%': challenges.filter(c => c.progress >= 26 && c.progress <= 50).length,
      '51-75%': challenges.filter(c => c.progress >= 51 && c.progress <= 75).length,
      '76-99%': challenges.filter(c => c.progress >= 76 && c.progress <= 99).length,
      '100%': challenges.filter(c => c.progress === 100).length,
    };

    // Overdue challenges
    const now = new Date();
    const overdueChallenges = challenges.filter(c => 
      c.endDate && new Date(c.endDate) < now && c.status === 'active'
    ).length;

    const stats = {
      overview: {
        totalChallenges,
        activeChallenges,
        completedChallenges,
        pausedChallenges,
        completionRate: Math.round(completionRate * 100) / 100,
        averageProgress: Math.round(averageProgress * 100) / 100,
        overdueChallenges,
        averageCompletionDays: Math.round(averageCompletionDays * 100) / 100,
      },
      distributions: {
        byDifficulty: difficultyDistribution,
        byCategory: categoryDistribution,
        byStatus: statusDistribution,
        byProgress: progressRanges,
      },
      trends: {
        recentActivity: {
          newChallenges: recentChallenges,
          completions: recentCompletions,
        },
        monthly: monthlyTrends,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching challenge statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 