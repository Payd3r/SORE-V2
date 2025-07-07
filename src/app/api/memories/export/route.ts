import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { MemoryCategory, MemoryMood } from '@/types/memory';

// Interfaccia per i parametri di export
interface MemoryExportParams {
  memoryIds?: string[];
  format?: 'json' | 'csv';
  includeImages?: boolean;
  includeMoments?: boolean;
  dateFrom?: string;
  dateTo?: string;
  categories?: MemoryCategory[];
  moods?: MemoryMood[];
}

// GET /api/memories/export - Esporta memorie con dati completi
export async function GET(request: Request) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Verifica permessi
    if (!hasPermission(session.user.role, 'memory:read')) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    // Verifica che l'utente appartenga a una coppia
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true }
    });

    if (!user?.couple) {
      return NextResponse.json(
        { error: 'Utente non appartiene a nessuna coppia' },
        { status: 400 }
      );
    }

    // Parsing parametri query
    const { searchParams } = new URL(request.url);
    
    const exportParams: MemoryExportParams = {
      memoryIds: searchParams.get('memoryIds')?.split(',').filter(Boolean),
      format: (searchParams.get('format') as 'json' | 'csv') || 'json',
      includeImages: searchParams.get('includeImages') === 'true',
      includeMoments: searchParams.get('includeMoments') !== 'false', // default true
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      categories: searchParams.get('categories')?.split(',').filter(Boolean) as MemoryCategory[] || undefined,
      moods: searchParams.get('moods')?.split(',').filter(Boolean) as MemoryMood[] || undefined
    };

    console.log('Parametri export ricevuti:', exportParams);

    // Costruisci query where per filtrare memorie
    const whereClause: any = {
      coupleId: user.couple.id
    };

    if (exportParams.memoryIds && exportParams.memoryIds.length > 0) {
      whereClause.id = { in: exportParams.memoryIds };
    }

    if (exportParams.dateFrom || exportParams.dateTo) {
      whereClause.date = {};
      if (exportParams.dateFrom) {
        whereClause.date.gte = new Date(exportParams.dateFrom);
      }
      if (exportParams.dateTo) {
        whereClause.date.lte = new Date(exportParams.dateTo);
      }
    }

    if (exportParams.categories && exportParams.categories.length > 0) {
      whereClause.category = { in: exportParams.categories };
    }

    if (exportParams.moods && exportParams.moods.length > 0) {
      whereClause.mood = { in: exportParams.moods };
    }

    // Costruisci query include per includere dati correlati
    const includeClause: any = {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      couple: {
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      }
    };

    if (exportParams.includeImages) {
      includeClause.images = {
        select: {
          id: true,
          filename: true,
          originalName: true,
          path: true,
          thumbnailPath: true,
          category: true,
          isFavorite: true,
          width: true,
          height: true,
          size: true,
          createdAt: true
        }
      };
    }

    if (exportParams.includeMoments) {
      includeClause.moments = {
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          participant: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          images: exportParams.includeImages ? {
            select: {
              id: true,
              filename: true,
              originalName: true,
              path: true,
              thumbnailPath: true,
              category: true,
              width: true,
              height: true,
              size: true,
              createdAt: true
            }
          } : false
        }
      };
    }

    // Esegui query per recuperare memorie
    const memories = await prisma.memory.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { date: 'desc' }
    });

    console.log(`Export completato: ${memories.length} memorie recuperate`);

    // Calcola statistiche export
    const stats = {
      totalMemories: memories.length,
      totalImages: memories.reduce((sum: number, memory: any) => 
        sum + (memory.images ? memory.images.length : 0), 0),
      totalMoments: memories.reduce((sum: number, memory: any) => 
        sum + (memory.moments ? memory.moments.length : 0), 0),
      totalMomentImages: memories.reduce((sum: number, memory: any) => 
        sum + (memory.moments ? memory.moments.reduce((momentSum: number, moment: any) => 
          momentSum + (moment.images ? moment.images.length : 0), 0) : 0), 0),
      dateRange: {
        from: memories.length > 0 ? memories[memories.length - 1].date : null,
        to: memories.length > 0 ? memories[0].date : null
      },
      categories: Array.from(new Set(memories.map((m: any) => m.category).filter(Boolean))),
      moods: Array.from(new Set(memories.map((m: any) => m.mood).filter(Boolean)))
    };

    // Prepara metadata export
    const exportMetadata = {
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      couple: {
        id: user.couple.id,
        name: user.couple.name
      },
      parameters: exportParams,
      statistics: stats
    };

    // Rispondi con formato richiesto
    if (exportParams.format === 'csv') {
      // Converti in CSV (implementazione semplificata)
      const csvData = convertMemoriesToCSV(memories, exportParams);
      
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="memories_export_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Formato JSON (default)
      return NextResponse.json({
        metadata: exportMetadata,
        memories: memories,
        statistics: stats
      });
    }

  } catch (error) {
    console.error('Errore nell\'export delle memorie:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST /api/memories/export - Esporta memorie specifiche tramite POST body
export async function POST(request: Request) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Verifica permessi
    if (!hasPermission(session.user.role, 'memory:read')) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    // Verifica che l'utente appartenga a una coppia
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true }
    });

    if (!user?.couple) {
      return NextResponse.json(
        { error: 'Utente non appartiene a nessuna coppia' },
        { status: 400 }
      );
    }

    // Parsing body request
    const body: MemoryExportParams = await request.json();
    console.log('Parametri export POST ricevuti:', body);

    // Validazione parametri
    if (body.memoryIds && body.memoryIds.length > 100) {
      return NextResponse.json(
        { error: 'Massimo 100 memorie per export' },
        { status: 400 }
      );
    }

    if (body.format && !['json', 'csv'].includes(body.format)) {
      return NextResponse.json(
        { error: 'Formato non supportato. Usa json o csv' },
        { status: 400 }
      );
    }

    // Reindirizza la logica al GET con parametri dal body
    const queryParams = new URLSearchParams();
    
    if (body.memoryIds) queryParams.set('memoryIds', body.memoryIds.join(','));
    if (body.format) queryParams.set('format', body.format);
    if (body.includeImages !== undefined) queryParams.set('includeImages', body.includeImages.toString());
    if (body.includeMoments !== undefined) queryParams.set('includeMoments', body.includeMoments.toString());
    if (body.dateFrom) queryParams.set('dateFrom', body.dateFrom);
    if (body.dateTo) queryParams.set('dateTo', body.dateTo);
    if (body.categories) queryParams.set('categories', body.categories.join(','));
    if (body.moods) queryParams.set('moods', body.moods.join(','));

    // Crea nuovo URL con parametri
    const exportUrl = `${request.url.split('?')[0]}?${queryParams.toString()}`;
    const newRequest = new Request(exportUrl, {
      method: 'GET',
      headers: request.headers
    });

    // Chiama il metodo GET con i parametri
    return await GET(newRequest);

  } catch (error) {
    console.error('Errore nell\'export POST delle memorie:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Utility per convertire memorie in formato CSV
function convertMemoriesToCSV(memories: any[], params: MemoryExportParams): string {
  if (memories.length === 0) {
    return 'No memories to export';
  }

  // Header CSV di base
  const headers = [
    'ID',
    'Title',
    'Description',
    'Date',
    'Location',
    'Category',
    'Mood',
    'Author Name',
    'Author Email',
    'Created At',
    'Updated At'
  ];

  if (params.includeImages) {
    headers.push('Images Count', 'Images Paths');
  }

  if (params.includeMoments) {
    headers.push('Moments Count', 'Completed Moments', 'Pending Moments');
  }

  // Converte ogni memoria in riga CSV
  const rows = memories.map((memory: any) => {
    const row = [
      memory.id,
      `"${memory.title || ''}"`,
      `"${memory.description || ''}"`,
      memory.date ? new Date(memory.date).toISOString().split('T')[0] : '',
      `"${memory.location || ''}"`,
      memory.category || '',
      memory.mood || '',
      `"${memory.author?.name || ''}"`,
      memory.author?.email || '',
      memory.createdAt ? new Date(memory.createdAt).toISOString() : '',
      memory.updatedAt ? new Date(memory.updatedAt).toISOString() : ''
    ];

    if (params.includeImages) {
      row.push(
        memory.images ? memory.images.length.toString() : '0',
        memory.images ? `"${memory.images.map((img: any) => img.path).join('; ')}"` : '""'
      );
    }

    if (params.includeMoments) {
      const completedMoments = memory.moments ? memory.moments.filter((m: any) => m.status === 'COMPLETED').length : 0;
      const pendingMoments = memory.moments ? memory.moments.filter((m: any) => m.status === 'PENDING').length : 0;
      
      row.push(
        memory.moments ? memory.moments.length.toString() : '0',
        completedMoments.toString(),
        pendingMoments.toString()
      );
    }

    return row.join(',');
  });

  // Combina header e righe
  return [headers.join(','), ...rows].join('\n');
} 