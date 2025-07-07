import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IDEA_CATEGORIES } from '@/lib/idea-categories';

// Interfaccia per l'aggiornamento di un'idea
interface UpdateIdeaRequest {
  title?: string;
  description?: string;
  category?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | null; // ISO date string o null per rimuovere
}

// GET /api/ideas/[id] - Ottiene una singola idea
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ideaId } = await params;

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

    // Trova l'idea
    const idea = await prisma.ideas.findFirst({
      where: {
        id: ideaId,
        coupleId: user.coupleId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!idea) {
      return NextResponse.json(
        { error: 'Idea non trovata' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: idea,
    });

  } catch (error) {
    console.error('Errore nel recupero dell\'idea:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// PUT /api/ideas/[id] - Aggiorna un'idea
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ideaId } = await params;

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

    // Verifica che l'idea esista e appartenga alla coppia
    const existingIdea = await prisma.ideas.findFirst({
      where: {
        id: ideaId,
        coupleId: user.coupleId,
      },
    });

    if (!existingIdea) {
      return NextResponse.json(
        { error: 'Idea non trovata' },
        { status: 404 }
      );
    }

    // Valida i dati della richiesta
    const body: UpdateIdeaRequest = await request.json();
    
    // Validazioni opzionali sui campi modificabili
    if (body.title !== undefined) {
      if (!body.title || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Il titolo non può essere vuoto' },
          { status: 400 }
        );
      }
      if (body.title.length > 255) {
        return NextResponse.json(
          { error: 'Il titolo non può superare i 255 caratteri' },
          { status: 400 }
        );
      }
    }

    if (body.description !== undefined && body.description && body.description.length > 1000) {
      return NextResponse.json(
        { error: 'La descrizione non può superare i 1000 caratteri' },
        { status: 400 }
      );
    }

    if (body.status && !['pending', 'in-progress', 'completed', 'cancelled'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Status non valido' },
        { status: 400 }
      );
    }

    if (body.priority && !['low', 'medium', 'high'].includes(body.priority)) {
      return NextResponse.json(
        { error: 'Priorità non valida' },
        { status: 400 }
      );
    }

    if (body.category !== undefined && body.category && !IDEA_CATEGORIES.find(cat => cat.id === body.category)) {
      return NextResponse.json(
        { error: 'Categoria non valida' },
        { status: 400 }
      );
    }

    // Prepara i dati per l'aggiornamento
    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.category !== undefined) {
      updateData.category = body.category?.trim() || null;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
      
      // Se l'idea viene completata, imposta la data di completamento
      if (body.status === 'completed' && existingIdea.status !== 'completed') {
        updateData.completedAt = new Date();
      }
      
      // Se l'idea non è più completata, rimuovi la data di completamento
      if (body.status !== 'completed' && existingIdea.status === 'completed') {
        updateData.completedAt = null;
      }
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }

    if (body.dueDate !== undefined) {
      if (body.dueDate === null) {
        updateData.dueDate = null;
      } else {
        const dueDate = new Date(body.dueDate);
        if (isNaN(dueDate.getTime())) {
          return NextResponse.json(
            { error: 'Data di scadenza non valida' },
            { status: 400 }
          );
        }
        updateData.dueDate = dueDate;
      }
    }

    // Aggiorna l'idea
    const updatedIdea = await prisma.ideas.update({
      where: { id: ideaId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedIdea,
      message: 'Idea aggiornata con successo',
    });

  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'idea:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE /api/ideas/[id] - Elimina un'idea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ideaId } = await params;

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

    // Verifica che l'idea esista e appartenga alla coppia
    const existingIdea = await prisma.ideas.findFirst({
      where: {
        id: ideaId,
        coupleId: user.coupleId,
      },
    });

    if (!existingIdea) {
      return NextResponse.json(
        { error: 'Idea non trovata' },
        { status: 404 }
      );
    }

    // Controlla se l'utente può eliminare l'idea
    // Permetti l'eliminazione solo all'autore o a qualsiasi membro della coppia
    // (in questo caso permettiamo a qualsiasi membro della coppia)

    // Elimina l'idea
    await prisma.ideas.delete({
      where: { id: ideaId },
    });

    return NextResponse.json({
      success: true,
      message: 'Idea eliminata con successo',
    });

  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'idea:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 