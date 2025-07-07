import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';

// Interfaccia per parametri di query
interface GalleryQueryParams {
  // Filtering
  category?: string; // Person, Couple, Landscape, Food, Moment, Other
  memoryId?: string;
  momentId?: string;
  isFavorite?: boolean;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  
  // Sorting
  sortBy?: 'date' | 'name' | 'size' | 'category' | 'created';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Search
  search?: string;
}

// Interfaccia per risposta galleria
interface GalleryResponse {
  images: {
    id: string;
    filename: string;
    originalName: string;
    path: string;
    thumbnailPath: string;
    category: string;
    size: number;
    width?: number;
    height?: number;
    isFavorite: boolean;
    createdAt: string;
    memory?: {
      id: string;
      title: string;
      date: string;
    };
    moment?: {
      id: string;
      status: string;
      createdAt: string;
    };
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    categories: { name: string; count: number }[];
    totalImages: number;
  };
}

// GET /api/gallery - Recupera immagini con filtering e sorting
export async function GET(request: NextRequest) {
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
    const searchParams = request.nextUrl.searchParams;
    const queryParams: GalleryQueryParams = {
      category: searchParams.get('category') || undefined,
      memoryId: searchParams.get('memoryId') || undefined,
      momentId: searchParams.get('momentId') || undefined,
      isFavorite: searchParams.get('isFavorite') === 'true' ? true : 
                  searchParams.get('isFavorite') === 'false' ? false : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'date',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Max 100 per pagina
      search: searchParams.get('search') || undefined
    };

    console.log('Parametri query galleria:', queryParams);

    // Costruzione filtri WHERE
    const whereClause: any = {
      OR: [
        { memory: { coupleId: user.couple.id } },
        { moment: { coupleId: user.couple.id } }
      ]
    };

    // Filtro per categoria
    if (queryParams.category) {
      whereClause.category = queryParams.category;
    }

    // Filtro per memoria specifica
    if (queryParams.memoryId) {
      whereClause.memoryId = queryParams.memoryId;
    }

    // Filtro per momento specifico
    if (queryParams.momentId) {
      whereClause.momentId = queryParams.momentId;
    }

    // Filtro per preferiti
    if (queryParams.isFavorite !== undefined) {
      whereClause.isFavorite = queryParams.isFavorite;
    }

    // Filtro per data (basato su createdAt delle immagini)
    if (queryParams.dateFrom || queryParams.dateTo) {
      whereClause.createdAt = {};
      if (queryParams.dateFrom) {
        whereClause.createdAt.gte = new Date(queryParams.dateFrom);
      }
      if (queryParams.dateTo) {
        whereClause.createdAt.lte = new Date(queryParams.dateTo);
      }
    }

    // Filtro per ricerca (nome file o nome originale)
    if (queryParams.search) {
      whereClause.OR = [
        { filename: { contains: queryParams.search, mode: 'insensitive' } },
        { originalName: { contains: queryParams.search, mode: 'insensitive' } }
      ];
    }

    // Costruzione ordinamento
    const orderBy: any = {};
    switch (queryParams.sortBy) {
      case 'name':
        orderBy.originalName = queryParams.sortOrder;
        break;
      case 'size':
        orderBy.size = queryParams.sortOrder;
        break;
      case 'category':
        orderBy.category = queryParams.sortOrder;
        break;
      case 'created':
        orderBy.createdAt = queryParams.sortOrder;
        break;
      case 'date':
      default:
        orderBy.createdAt = queryParams.sortOrder;
        break;
    }

    // Calcolo offset per paginazione
    const skip = (queryParams.page! - 1) * queryParams.limit!;

    // Query principale per immagini
    const [images, totalCount] = await Promise.all([
      prisma.image.findMany({
        where: whereClause,
        include: {
          memory: {
            select: {
              id: true,
              title: true,
              date: true
            }
          },
          moment: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }
        },
        orderBy,
        skip,
        take: queryParams.limit
      }),
      prisma.image.count({ where: whereClause })
    ]);

    // Query per statistiche categorie (solo per la coppia)
    const categoryStats = await prisma.image.groupBy({
      by: ['category'],
      where: {
        OR: [
          { memory: { coupleId: user.couple.id } },
          { moment: { coupleId: user.couple.id } }
        ]
      },
      _count: {
        category: true
      }
    });

    // Preparazione risposta
    const response: GalleryResponse = {
      images: images.map(image => ({
        id: image.id,
        filename: image.filename,
        originalName: image.originalName,
        path: image.path,
        thumbnailPath: image.thumbnailPath || '',
        category: image.category || 'OTHER',
        size: image.size,
        width: image.width || undefined,
        height: image.height || undefined,
        isFavorite: image.isFavorite,
        createdAt: image.createdAt.toISOString(),
        memory: image.memory ? {
          id: image.memory.id,
          title: image.memory.title,
          date: image.memory.date.toISOString()
        } : undefined,
        moment: image.moment ? {
          id: image.moment.id,
          status: image.moment.status,
          createdAt: image.moment.createdAt.toISOString()
        } : undefined
      })),
      pagination: {
        page: queryParams.page!,
        limit: queryParams.limit!,
        total: totalCount,
        pages: Math.ceil(totalCount / queryParams.limit!)
      },
      filters: {
        categories: categoryStats.map(stat => ({
          name: stat.category || 'OTHER',
          count: stat._count.category
        })),
        totalImages: totalCount
      }
    };

    console.log(`Galleria: ${images.length} immagini trovate (${totalCount} totali)`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Errore nel recupero galleria:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// PUT /api/gallery - Aggiorna stato preferiti delle immagini
export async function PUT(request: NextRequest) {
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
    if (!hasPermission(session.user.role, 'memory:update')) {
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

    // Parsing dati input
    const body = await request.json();
    const { imageId, isFavorite } = body;

    // Validazione input
    if (!imageId || typeof imageId !== 'string') {
      return NextResponse.json(
        { error: 'ID immagine richiesto' },
        { status: 400 }
      );
    }

    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: 'Stato preferito deve essere boolean' },
        { status: 400 }
      );
    }

    // Verifica che l'immagine esista e appartenga alla coppia
    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        memory: { select: { coupleId: true } },
        moment: { select: { coupleId: true } }
      }
    });

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Immagine non trovata' },
        { status: 404 }
      );
    }

    // Verifica accesso alla coppia
    const belongsToCouple = 
      (existingImage.memory && existingImage.memory.coupleId === user.couple.id) ||
      (existingImage.moment && existingImage.moment.coupleId === user.couple.id);

    if (!belongsToCouple) {
      return NextResponse.json(
        { error: 'Non hai accesso a questa immagine' },
        { status: 403 }
      );
    }

    // Aggiorna stato preferito
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: { isFavorite },
      select: {
        id: true,
        filename: true,
        originalName: true,
        isFavorite: true,
        updatedAt: true
      }
    });

    console.log(`Immagine ${imageId} aggiornata: preferito = ${isFavorite}`);

    return NextResponse.json({
      message: 'Stato preferito aggiornato con successo',
      image: updatedImage
    });

  } catch (error) {
    console.error('Errore nell\'aggiornamento preferiti:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 