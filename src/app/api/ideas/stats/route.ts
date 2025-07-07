import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Interfaccia per le statistiche delle idee
interface IdeaStats {
  // Statistiche generali
  totalIdeas: number;
  completedIdeas: number;
  pendingIdeas: number;
  inProgressIdeas: number;
  completionRate: number;
  
  // Distribuzione per categoria
  categoryCounts: Array<{
    category: string | null;
    count: number;
  }>;
  
  // Distribuzione per priorità
  priorityCounts: Array<{
    priority: string;
    count: number;
  }>;
  
  // Tendenze temporali
  recentIdeas: Array<{
    date: string;
    count: number;
  }>;
  
  // Scadenze
  overdue: number;
  dueSoon: number; // prossimi 7 giorni
  
  // Statistiche per autore
  authorStats: Array<{
    authorId: string;
    authorName: string;
    ideaCount: number;
    completedCount: number;
  }>;
}

// GET /api/ideas/stats - Statistiche delle idee della coppia
export async function GET(request: NextRequest) {
  try {
    // Autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Trova la coppia dell'utente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coupleId: true }
    });

    if (!user?.coupleId) {
      return NextResponse.json(
        { error: 'Coppia non trovata' },
        { status: 404 }
      );
    }

    const coupleId = user.coupleId;
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Statistiche generali
    const totalIdeas = await prisma.ideas.count({
      where: { coupleId }
    });

    const statusCounts = await prisma.ideas.groupBy({
      by: ['status'],
      where: { coupleId },
      _count: {
        status: true,
      },
    });

    const completedIdeas = statusCounts.find(s => s.status === 'completed')?._count.status || 0;
    const pendingIdeas = statusCounts.find(s => s.status === 'pending')?._count.status || 0;
    const inProgressIdeas = statusCounts.find(s => s.status === 'in-progress')?._count.status || 0;
    const completionRate = totalIdeas > 0 ? (completedIdeas / totalIdeas) * 100 : 0;

    // 2. Distribuzione per categoria
    const categoryCounts = await prisma.ideas.groupBy({
      by: ['category'],
      where: { coupleId },
      _count: {
        category: true,
      },
    });

    // 3. Distribuzione per priorità
    const priorityCounts = await prisma.ideas.groupBy({
      by: ['priority'],
      where: { coupleId },
      _count: {
        priority: true,
      },
    });

    // 4. Tendenze temporali (ultime 30 giorni)
    const recentIdeasData = await prisma.ideas.findMany({
      where: {
        coupleId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Raggruppa per giorno
    const dailyCounts = new Map<string, number>();
    recentIdeasData.forEach(idea => {
      const date = idea.createdAt.toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    const recentIdeas = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // 5. Scadenze
    const overdue = await prisma.ideas.count({
      where: {
        coupleId,
        dueDate: {
          lt: now,
        },
        status: {
          notIn: ['completed', 'cancelled'],
        },
      },
    });

    const dueSoon = await prisma.ideas.count({
      where: {
        coupleId,
        dueDate: {
          gte: now,
          lte: oneWeekFromNow,
        },
        status: {
          notIn: ['completed', 'cancelled'],
        },
      },
    });

    // 6. Statistiche per autore
    const authorStats = await prisma.ideas.groupBy({
      by: ['authorId'],
      where: { coupleId },
      _count: {
        authorId: true,
      },
    });

    // Ottieni informazioni sugli autori e conta le idee completate
    const authorStatsWithDetails = await Promise.all(
      authorStats.map(async (stat) => {
        const author = await prisma.user.findUnique({
          where: { id: stat.authorId },
          select: { id: true, name: true },
        });

        const completedCount = await prisma.ideas.count({
          where: {
            coupleId,
            authorId: stat.authorId,
            status: 'completed',
          },
        });

        return {
          authorId: stat.authorId,
          authorName: author?.name || 'Sconosciuto',
          ideaCount: stat._count.authorId,
          completedCount,
        };
      })
    );

    // Prepara le statistiche finali
    const stats: IdeaStats = {
      totalIdeas,
      completedIdeas,
      pendingIdeas,
      inProgressIdeas,
      completionRate: Math.round(completionRate * 100) / 100,
      categoryCounts: categoryCounts.map(c => ({
        category: c.category,
        count: c._count.category,
      })),
      priorityCounts: priorityCounts.map(p => ({
        priority: p.priority,
        count: p._count.priority,
      })),
      recentIdeas,
      overdue,
      dueSoon,
      authorStats: authorStatsWithDetails,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Errore nel recupero delle statistiche delle idee:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 