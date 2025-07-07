import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';

// POST /api/images/[id]/memory - Associa immagine a memoria esistente o crea nuova memoria
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: imageId } = await params;
    const body = await request.json();
    
    // Validazione input
    const { memoryId, createNew, newMemoryData } = body;

    if (!memoryId && !createNew) {
      return NextResponse.json(
        { error: 'Specificare memoryId esistente o createNew=true' },
        { status: 400 }
      );
    }

    if (createNew && !newMemoryData) {
      return NextResponse.json(
        { error: 'Dati per nuova memoria richiesti quando createNew=true' },
        { status: 400 }
      );
    }

    // Verifica che l'immagine esista e appartenga alla coppia
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        memory: { select: { coupleId: true, title: true } },
        moment: { select: { coupleId: true } }
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Immagine non trovata' },
        { status: 404 }
      );
    }

    // Verifica accesso alla coppia
    const belongsToCouple = 
      (image.memory && image.memory.coupleId === user.couple.id) ||
      (image.moment && image.moment.coupleId === user.couple.id);

    if (!belongsToCouple) {
      return NextResponse.json(
        { error: 'Non hai accesso a questa immagine' },
        { status: 403 }
      );
    }

    let targetMemoryId = memoryId;
    let memoryInfo = null;

    // Se deve creare una nuova memoria
    if (createNew) {
      // Validazione dati nuova memoria
      const { title, description, date, location, category, mood } = newMemoryData;

      if (!title || !date) {
        return NextResponse.json(
          { error: 'Titolo e data sono richiesti per creare una nuova memoria' },
          { status: 400 }
        );
      }

      // Crea nuova memoria
      const newMemory = await prisma.memory.create({
        data: {
          title,
          description: description || null,
          date: new Date(date),
          location: location || null,
          category: category || null,
          mood: mood || null,
          authorId: session.user.id,
          coupleId: user.couple.id
        }
      });

      targetMemoryId = newMemory.id;
      memoryInfo = {
        id: newMemory.id,
        title: newMemory.title,
        description: newMemory.description,
        date: newMemory.date.toISOString(),
        isNew: true
      };

      console.log(`Nuova memoria creata: ${newMemory.id} - ${newMemory.title}`);
    } else {
      // Verifica che la memoria esistente appartenga alla coppia
      const existingMemory = await prisma.memory.findUnique({
        where: { id: memoryId },
        select: { 
          id: true, 
          title: true, 
          description: true, 
          date: true, 
          coupleId: true 
        }
      });

      if (!existingMemory) {
        return NextResponse.json(
          { error: 'Memoria non trovata' },
          { status: 404 }
        );
      }

      if (existingMemory.coupleId !== user.couple.id) {
        return NextResponse.json(
          { error: 'Non hai accesso a questa memoria' },
          { status: 403 }
        );
      }

      memoryInfo = {
        id: existingMemory.id,
        title: existingMemory.title,
        description: existingMemory.description,
        date: existingMemory.date.toISOString(),
        isNew: false
      };
    }

    // Associa l'immagine alla memoria
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: { 
        memoryId: targetMemoryId,
        // Rimuovi momentId se presente (l'immagine ora appartiene alla memoria)
        momentId: null
      },
      include: {
        memory: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            location: true
          }
        }
      }
    });

    console.log(`Immagine ${imageId} associata alla memoria ${targetMemoryId}`);

    return NextResponse.json({
      message: createNew 
        ? 'Nuova memoria creata e immagine associata con successo'
        : 'Immagine associata alla memoria con successo',
      image: {
        id: updatedImage.id,
        filename: updatedImage.filename,
        originalName: updatedImage.originalName,
        memory: updatedImage.memory
      },
      memory: memoryInfo
    });

  } catch (error) {
    console.error('Errore nell\'associazione immagine-memoria:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE /api/images/[id]/memory - Rimuovi associazione immagine-memoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: imageId } = await params;

    // Verifica che l'immagine esista e sia associata a una memoria della coppia
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        memory: { select: { coupleId: true, title: true } }
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Immagine non trovata' },
        { status: 404 }
      );
    }

    if (!image.memory) {
      return NextResponse.json(
        { error: 'Immagine non è associata a nessuna memoria' },
        { status: 400 }
      );
    }

    if (image.memory.coupleId !== user.couple.id) {
      return NextResponse.json(
        { error: 'Non hai accesso a questa memoria' },
        { status: 403 }
      );
    }

    // Rimuovi associazione con memoria
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: { memoryId: null }
    });

    console.log(`Associazione immagine ${imageId} con memoria rimossa`);

    return NextResponse.json({
      message: 'Associazione con memoria rimossa con successo',
      image: {
        id: updatedImage.id,
        filename: updatedImage.filename,
        originalName: updatedImage.originalName
      }
    });

  } catch (error) {
    console.error('Errore nella rimozione associazione immagine-memoria:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 