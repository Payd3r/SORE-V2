import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IDEA_CATEGORIES } from '@/lib/idea-categories';
import { 
  suggestPriority, 
  updatePriorityBasedOnDueDate, 
  isValidPriority,
  sortByPriority 
} from '@/lib/priority-system';

// Interfaccia per la creazione di una nuova idea
interface CreateIdeaRequest {
  title: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string
  autoSuggestPriority?: boolean; // Suggerisce automaticamente la priorità
}

// Interfaccia per i filtri di ricerca
interface IdeaFilters {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  sortBy?: 'priority' | 'dueDate' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// GET /api/ideas - Lista tutte le idee della coppia
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

    // Ottieni parametri di filtro dall'URL
    const searchParams = request.nextUrl.searchParams;
    const filters: IdeaFilters = {
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'priority',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };

    // Costruisci la query di filtro
    let whereClause: any = {
      coupleId: coupleId
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Costruisci la clausola di ordinamento
    let orderByClause: any = {};
    
    if (filters.sortBy === 'priority') {
      // Per l'ordinamento per priorità, usiamo una logica custom
      orderByClause = { createdAt: 'desc' }; // Fallback, poi ordiniamo in memoria
    } else if (filters.sortBy === 'dueDate') {
      orderByClause = { dueDate: filters.sortOrder };
    } else if (filters.sortBy === 'title') {
      orderByClause = { title: filters.sortOrder };
    } else {
      orderByClause = { createdAt: filters.sortOrder };
    }

    // Esegui la query
    const ideas = await prisma.ideas.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Se l'ordinamento è per priorità, ordina in memoria
    let sortedIdeas = ideas;
    if (filters.sortBy === 'priority') {
      sortedIdeas = sortByPriority(ideas);
      if (filters.sortOrder === 'asc') {
        sortedIdeas = sortedIdeas.reverse();
      }
    }

    // Formatta le idee per la risposta
    const formattedIdeas = sortedIdeas.map(idea => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      status: idea.status,
      priority: idea.priority,
      dueDate: idea.dueDate,
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
      author: idea.author
    }));

    return NextResponse.json({
      success: true,
      data: formattedIdeas,
      total: formattedIdeas.length,
      filters: filters
    });

  } catch (error) {
    console.error('Errore nel recuperare le idee:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST /api/ideas - Crea una nuova idea
export async function POST(request: NextRequest) {
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

    // Parse del body della richiesta
    const body: CreateIdeaRequest = await request.json();

    // Validazione dei dati richiesti
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Il titolo è obbligatorio' },
        { status: 400 }
      );
    }

    if (body.title.length > 200) {
      return NextResponse.json(
        { error: 'Il titolo non può superare i 200 caratteri' },
        { status: 400 }
      );
    }

    if (body.description && body.description.length > 1000) {
      return NextResponse.json(
        { error: 'La descrizione non può superare i 1000 caratteri' },
        { status: 400 }
      );
    }

    if (body.priority && !isValidPriority(body.priority)) {
      return NextResponse.json(
        { error: 'Priorità non valida' },
        { status: 400 }
      );
    }

    if (body.category && !IDEA_CATEGORIES.find(cat => cat.id === body.category)) {
      return NextResponse.json(
        { error: 'Categoria non valida' },
        { status: 400 }
      );
    }

    // Suggerimento automatico della priorità se richiesto
    let finalPriority = body.priority;
    if (body.autoSuggestPriority && !body.priority) {
      finalPriority = suggestPriority(body.title, body.description);
    }

    // Aggiorna la priorità basata sulla data di scadenza se presente
    if (body.dueDate && finalPriority) {
      finalPriority = updatePriorityBasedOnDueDate(body.dueDate, finalPriority);
    }

    // Creazione dell'idea
    const newIdea = await prisma.ideas.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        category: body.category || null,
        priority: finalPriority || 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: 'pending',
        coupleId: coupleId,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newIdea.id,
        title: newIdea.title,
        description: newIdea.description,
        category: newIdea.category,
        status: newIdea.status,
        priority: newIdea.priority,
        dueDate: newIdea.dueDate,
        createdAt: newIdea.createdAt,
        updatedAt: newIdea.updatedAt,
        author: newIdea.author,
        suggestedPriority: body.autoSuggestPriority ? finalPriority : undefined
      },
      message: 'Idea creata con successo'
    });

  } catch (error) {
    console.error('Errore nella creazione dell\'idea:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 