import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Interfaccia per le statistiche dei momenti
interface MomentStats {
  // Statistiche generali
  totalMoments: number;
  completedMoments: number;
  pendingMoments: number;
  completionRate: number;
  
  // Frequenza temporale
  momentsThisWeek: number;
  momentsThisMonth: number;
  momentsThisYear: number;
  averageMomentsPerWeek: number;
  
  // Tendenze temporali
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    count: number;
  }>;
  
  // Statistiche partecipanti
  mostActivePeriod: {
    period: string;
    count: number;
  };
  participationBalance: {
    initiatorPercentage: number;
    participantPercentage: number;
  };
  
  // Memorie associate
  momentsWithMemory: number;
  momentsWithoutMemory: number;
  topMemoriesWithMoments: Array<{
    memoryId: string;
    memoryTitle: string;
    momentCount: number;
  }>;
  
  // Storage e dimensioni
  totalStorageUsed: number; // in bytes
  averageFileSize: number;
  largestMoment: {
    id: string;
    size: number;
    createdAt: string;
  };
}

/**
 * GET /api/moments/stats
 * 
 * Restituisce statistiche avanzate sui momenti per la coppia corrente
 * 
 * Query parameters:
 * - period: daily|weekly|monthly|yearly (default: monthly)
 * - startDate: ISO date string (default: 3 months ago)
 * - endDate: ISO date string (default: now)
 */
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
      include: { couple: true }
    });

    if (!user?.couple) {
      return NextResponse.json(
        { error: 'Coppia non trovata' },
        { status: 404 }
      );
    }

    const coupleId = user.couple.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    
    // Date range per le analisi
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : new Date();
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 3 mesi fa

    console.log(`📊 Generando statistiche momenti per coppia ${coupleId}`);

    // 1. Statistiche generali sui momenti
    const [totalMoments, completedMoments, pendingMoments] = await Promise.all([
      prisma.moment.count({
        where: {
          coupleId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.moment.count({
        where: {
          coupleId,
          status: 'completed',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.moment.count({
        where: {
          coupleId,
          status: 'pending',
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);

    const completionRate = totalMoments > 0 ? (completedMoments / totalMoments) * 100 : 0;

    // 2. Frequenza temporale
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [momentsThisWeek, momentsThisMonth, momentsThisYear] = await Promise.all([
      prisma.moment.count({
        where: {
          coupleId,
          createdAt: { gte: oneWeekAgo }
        }
      }),
      prisma.moment.count({
        where: {
          coupleId,
          createdAt: { gte: oneMonthAgo }
        }
      }),
      prisma.moment.count({
        where: {
          coupleId,
          createdAt: { gte: oneYearAgo }
        }
      })
    ]);

    // Calcolo media settimanale (basata sugli ultimi 3 mesi)
    const weeksInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const averageMomentsPerWeek = weeksInPeriod > 0 ? totalMoments / weeksInPeriod : 0;

    // 3. Tendenze giornaliere (ultimi 30 giorni)
    const dailyActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await prisma.moment.count({
        where: {
          coupleId,
          createdAt: { gte: startOfDay, lte: endOfDay }
        }
      });
      
      dailyActivity.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    // 4. Tendenze mensili (ultimi 12 mesi)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const count = await prisma.moment.count({
        where: {
          coupleId,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      });
      
      monthlyTrends.push({
        month: startOfMonth.toISOString().substring(0, 7), // YYYY-MM
        count
      });
    }

    // 5. Periodo più attivo
    const mostActivePeriod = monthlyTrends.reduce((max, current) => 
      current.count > max.count ? { period: current.month, count: current.count } : max,
      { period: 'N/A', count: 0 }
    );

    // 6. Bilanciamento partecipazione
    const [initiatorMoments, participantMoments] = await Promise.all([
      prisma.moment.count({
        where: {
          coupleId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.moment.count({
        where: {
          coupleId,
          NOT: { participantId: null },
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);

    const participationBalance = {
      initiatorPercentage: totalMoments > 0 ? 100 : 0, // Tutti i momenti hanno un initiator
      participantPercentage: totalMoments > 0 ? (participantMoments / totalMoments) * 100 : 0
    };

    // 7. Memorie associate
    const [momentsWithMemory, momentsWithoutMemory] = await Promise.all([
      prisma.moment.count({
        where: {
          coupleId,
          NOT: { memoryId: null },
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.moment.count({
        where: {
          coupleId,
          memoryId: null,
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);

    // Top memorie con più momenti
    const topMemoriesWithMoments = await prisma.memory.findMany({
      where: {
        coupleId,
        moments: {
          some: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }
      },
      include: {
        _count: {
          select: {
            moments: {
              where: {
                createdAt: { gte: startDate, lte: endDate }
              }
            }
          }
        }
      },
      orderBy: {
        moments: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // 8. Statistiche storage
    const momentsWithImages = await prisma.moment.findMany({
      where: {
        coupleId,
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        images: {
          select: {
            size: true,
            id: true,
            createdAt: true
          }
        }
      }
    });

    let totalStorageUsed = 0;
    let totalImageCount = 0;
    let largestMoment = { id: '', size: 0, createdAt: '' };

    momentsWithImages.forEach(moment => {
      let momentSize = 0;
      moment.images.forEach(image => {
        totalStorageUsed += image.size;
        momentSize += image.size;
        totalImageCount++;
      });
      
      if (momentSize > largestMoment.size) {
        largestMoment = {
          id: moment.id,
          size: momentSize,
          createdAt: moment.createdAt.toISOString()
        };
      }
    });

    const averageFileSize = totalImageCount > 0 ? totalStorageUsed / totalImageCount : 0;

    // Assembla le statistiche
    const stats: MomentStats = {
      // Statistiche generali
      totalMoments,
      completedMoments,
      pendingMoments,
      completionRate: Math.round(completionRate * 100) / 100,
      
      // Frequenza temporale
      momentsThisWeek,
      momentsThisMonth,
      momentsThisYear,
      averageMomentsPerWeek: Math.round(averageMomentsPerWeek * 100) / 100,
      
      // Tendenze temporali
      dailyActivity,
      monthlyTrends,
      
      // Statistiche partecipanti
      mostActivePeriod: {
        period: mostActivePeriod.period,
        count: mostActivePeriod.count
      },
      participationBalance,
      
      // Memorie associate
      momentsWithMemory,
      momentsWithoutMemory,
      topMemoriesWithMoments: topMemoriesWithMoments.map(memory => ({
        memoryId: memory.id,
        memoryTitle: memory.title,
        momentCount: memory._count.moments
      })),
      
      // Storage e dimensioni
      totalStorageUsed,
      averageFileSize: Math.round(averageFileSize),
      largestMoment
    };

    console.log(`✅ Statistiche momenti generate per coppia ${coupleId}`);
    console.log(`📈 Totale momenti: ${totalMoments}, Completati: ${completedMoments}, Tasso completamento: ${completionRate.toFixed(1)}%`);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Errore nella generazione statistiche momenti:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 