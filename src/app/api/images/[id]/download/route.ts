import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import fs from 'fs/promises';
import path from 'path';

// GET /api/images/[id]/download - Download sicuro di un'immagine
export async function GET(
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

    const { id: imageId } = await params;

    // Parametri query per tipo download
    const searchParams = request.nextUrl.searchParams;
    const downloadType = searchParams.get('type') || 'original'; // 'original' o 'thumbnail'

    // Verifica che l'immagine esista e appartenga alla coppia
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        memory: { select: { coupleId: true } },
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

    // Determina il percorso del file da scaricare
    const filePath = downloadType === 'thumbnail' && image.thumbnailPath 
      ? image.thumbnailPath 
      : image.path;
    
    const fullPath = path.join(process.cwd(), 'public', filePath);

    // Verifica che il file esista
    try {
      await fs.access(fullPath);
    } catch (error) {
      return NextResponse.json(
        { error: 'File non trovato sul server' },
        { status: 404 }
      );
    }

    // Leggi il file
    const fileBuffer = await fs.readFile(fullPath);

    // Prepara il nome del file per il download
    const extension = path.extname(image.originalName) || '.webp';
    const downloadName = downloadType === 'thumbnail' 
      ? `thumb_${image.originalName}` 
      : image.originalName;

    // Headers per download
    const headers = new Headers();
    headers.set('Content-Type', image.mimeType);
    headers.set('Content-Disposition', `attachment; filename="${downloadName}"`);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'private, max-age=3600'); // Cache 1 ora

    console.log(`Download immagine ${imageId} (${downloadType}) da ${session.user.id}`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Errore nel download immagine:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 