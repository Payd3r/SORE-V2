import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateUpload, UploadType } from '@/lib/upload/multer-config';
import { processImage, ProcessedImage, isImageFile, convertHeicBuffer, convertRawBuffer } from '@/lib/upload/image-processor';
import { classifyImageFromBuffer, ImageCategory, checkImageDuplication } from '@/lib/image-classification';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';
import { writeFile } from 'fs/promises';
import path from 'path';
import { processFileGroup } from '@/lib/upload/post-process';

// Interfaccia per la risposta
interface UploadResponse {
  success: boolean;
  message: string;
  files: {
    id: string;
    filename: string;
    originalName: string;
    path: string;
    thumbnailPath: string;
    size: number;
    width: number;
    height: number;
    processed: ProcessedImage;
    isDuplicate?: boolean;
    duplicateOfId?: string;
  }[];
  duplicates?: {
    filename: string;
    originalName: string;
    existingImageId: string;
    existingImagePath: string;
  }[];
}

// POST /api/upload - Upload di immagini
export async function POST(request: NextRequest) {
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
    if (!hasPermission(session.user.role, 'memory:create')) {
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

    // Ottieni i parametri dalla query string
    const { searchParams } = new URL(request.url);
    const uploadType = searchParams.get('type') as UploadType || UploadType.MEMORY;
    const memoryId = searchParams.get('memoryId');
    const momentId = searchParams.get('momentId');
    const clientId = session.user.id; // Use user ID as client ID for WebSocket

    // Valida i parametri
    if (uploadType === UploadType.MOMENT && !momentId) {
      return NextResponse.json(
        { error: 'momentId richiesto per upload di momento' },
        { status: 400 }
      );
    }

    if (memoryId) {
      // Verifica che la memoria esista e appartenga alla coppia
      const memory = await prisma.memory.findUnique({
        where: { id: memoryId },
        include: { couple: true }
      });

      if (!memory || memory.coupleId !== user.couple.id) {
        return NextResponse.json(
          { error: 'Memoria non trovata o non accessibile' },
          { status: 404 }
        );
      }
    }

    if (momentId) {
      // Verifica che il momento esista e appartenga alla coppia
      const moment = await prisma.moment.findUnique({
        where: { id: momentId },
        include: { couple: true }
      });

      if (!moment || moment.coupleId !== user.couple.id) {
        return NextResponse.json(
          { error: 'Momento non trovato o non accessibile' },
          { status: 404 }
        );
      }
    }

    // Ottieni i file dalla richiesta
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    // Validazione dei file
    const multerFiles = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          fieldname: 'files',
          originalname: file.name,
          encoding: '7bit',
          mimetype: file.type,
          buffer,
          size: buffer.length
        } as Express.Multer.File;
      })
    );

    const validationErrors = validateUpload(multerFiles, uploadType);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Errori di validazione', details: validationErrors },
        { status: 400 }
      );
    }

    const fileGroups = multerFiles.reduce((acc, file) => {
      const baseName = path.parse(file.originalname).name;
      if (!acc[baseName]) {
        acc[baseName] = [];
      }
      acc[baseName].push(file);
      return acc;
    }, {} as Record<string, Express.Multer.File[]>);

    const processedFiles: UploadResponse['files'] = [];
    const duplicates: UploadResponse['duplicates'] = [];
    
    const processContext = {
        coupleId: user.couple.id,
        uploadType,
        memoryId,
        momentId
    };

    for (const baseName in fileGroups) {
      const group = fileGroups[baseName];
      
      const imageFile = group.find(f => isImageFile(f.mimetype));
      const videoFile = group.find(f => f.mimetype === 'video/quicktime');
      
      if (!imageFile) {
        console.warn(`Gruppo di file ${baseName} non contiene un'immagine, saltato.`);
        continue;
      }

      const result = await processFileGroup(imageFile, videoFile, processContext, clientId);

      if (result.type === 'success') {
        processedFiles.push(result);
      } else if (result.type === 'duplicate') {
        duplicates.push(result);
      } else {
        // Log the error, but don't add to response for now
        console.error(`Errore nel processare il file ${result.originalName}: ${result.error}`);
      }
    }

    // Aggiorna lo stato del momento se necessario
    if (momentId && uploadType === UploadType.MOMENT) {
      await updateMomentStatus(momentId, session.user.id);
    }

    // Prepara risposta
    let message = `${processedFiles.length} file caricati con successo`;
    
    if (duplicates.length > 0) {
      message += `, ${duplicates.length} duplicati saltati`;
    }

    const response: UploadResponse = {
      success: true,
      message,
      files: processedFiles,
      duplicates,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Errore API Upload:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Funzione per aggiornare lo stato del momento
async function updateMomentStatus(momentId: string, userId: string) {
  try {
    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
      include: { images: true }
    });

    if (!moment) return;

    // Determina il nuovo stato basato su chi ha caricato l'immagine
    let newStatus = moment.status;
    
    if (moment.status === 'pending') {
      if (moment.initiatorId === userId) {
        newStatus = 'partner1_captured';
      } else if (moment.participantId === userId) {
        newStatus = 'partner2_captured';
      }
    } else if (moment.status === 'partner1_captured' && moment.participantId === userId) {
      newStatus = 'completed';
    } else if (moment.status === 'partner2_captured' && moment.initiatorId === userId) {
      newStatus = 'completed';
    }

    // Aggiorna lo stato se è cambiato
    if (newStatus !== moment.status) {
      await prisma.moment.update({
        where: { id: momentId },
        data: { 
          status: newStatus,
          capturedBy: userId,
          ...(newStatus === 'completed' && { completedAt: new Date() })
        }
      });
      
      console.log(`Momento ${momentId} aggiornato a stato: ${newStatus}`);
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento dello stato del momento:', error);
  }
} 