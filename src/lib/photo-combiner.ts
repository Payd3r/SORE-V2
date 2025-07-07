import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Configurazione per la combinazione
interface CombineConfig {
  outputWidth: number;
  outputHeight: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  spacing: number; // Spazio tra le immagini
  backgroundColor: string;
}

// Configurazioni predefinite
export const COMBINE_CONFIGS = {
  standard: {
    outputWidth: 1200,
    outputHeight: 600,
    quality: 90,
    format: 'webp',
    spacing: 20,
    backgroundColor: '#ffffff'
  } as CombineConfig,
  square: {
    outputWidth: 800,
    outputHeight: 800,
    quality: 90,
    format: 'webp',
    spacing: 10,
    backgroundColor: '#ffffff'
  } as CombineConfig,
  vertical: {
    outputWidth: 600,
    outputHeight: 1200,
    quality: 90,
    format: 'webp',
    spacing: 20,
    backgroundColor: '#ffffff'
  } as CombineConfig
};

// Risultato della combinazione con metadati estesi
export interface CombinedPhotoResult {
  combinedPath: string;
  combinedFilename: string;
  thumbnailPath: string;
  metadata: {
    originalImages: string[];
    width: number;
    height: number;
    size: number;
    createdAt: string;
    completedAt: string; // Timestamp di quando il momento è stato completato
    // Metadati delle immagini originali
    image1Metadata: {
      path: string;
      originalName: string;
      size: number;
      width?: number;
      height?: number;
      exif?: any; // Metadati EXIF completi
      photographer?: {
        id: string;
        name: string;
        role: 'initiator' | 'participant';
      };
      capturedAt: string;
    };
    image2Metadata: {
      path: string;
      originalName: string;
      size: number;
      width?: number;
      height?: number;
      exif?: any; // Metadati EXIF completi
      photographer?: {
        id: string;
        name: string;
        role: 'initiator' | 'participant';
      };
      capturedAt: string;
    };
    momentInfo: {
      id: string;
      initiatorId: string;
      participantId?: string;
      memoryId?: string;
      createdAt: string;
      completedAt: string;
    };
  };
}

// Combina due immagini side-by-side
export async function combinePhotos(
  imagePath1: string,
  imagePath2: string,
  config: CombineConfig = COMBINE_CONFIGS.standard,
  layout: 'horizontal' | 'vertical' = 'horizontal'
): Promise<CombinedPhotoResult> {
  try {
    console.log(`Combinando immagini: ${imagePath1} e ${imagePath2}`);

    // Verifica che i file esistano
    await fs.access(imagePath1);
    await fs.access(imagePath2);

    // Carica le immagini
    const image1 = sharp(imagePath1);
    const image2 = sharp(imagePath2);

    // Ottieni metadati delle immagini
    const [metadata1, metadata2] = await Promise.all([
      image1.metadata(),
      image2.metadata()
    ]);

    // Calcola dimensioni per la combinazione
    const { width: img1Width = 0, height: img1Height = 0 } = metadata1;
    const { width: img2Width = 0, height: img2Height = 0 } = metadata2;

    let combinedWidth: number;
    let combinedHeight: number;
    let resizeWidth1: number;
    let resizeHeight1: number;
    let resizeWidth2: number;
    let resizeHeight2: number;

    if (layout === 'horizontal') {
      // Layout orizzontale: side-by-side
      const targetHeight = Math.floor((config.outputHeight - config.spacing) / 2) * 2; // Ensure even height
      const aspectRatio1 = img1Width / img1Height;
      const aspectRatio2 = img2Width / img2Height;
      
      resizeHeight1 = resizeHeight2 = targetHeight;
      resizeWidth1 = Math.floor(targetHeight * aspectRatio1);
      resizeWidth2 = Math.floor(targetHeight * aspectRatio2);
      
      combinedWidth = resizeWidth1 + resizeWidth2 + config.spacing;
      combinedHeight = targetHeight;
    } else {
      // Layout verticale: top-bottom
      const targetWidth = Math.floor((config.outputWidth - config.spacing) / 2) * 2; // Ensure even width
      const aspectRatio1 = img1Width / img1Height;
      const aspectRatio2 = img2Width / img2Height;
      
      resizeWidth1 = resizeWidth2 = targetWidth;
      resizeHeight1 = Math.floor(targetWidth / aspectRatio1);
      resizeHeight2 = Math.floor(targetWidth / aspectRatio2);
      
      combinedWidth = targetWidth;
      combinedHeight = resizeHeight1 + resizeHeight2 + config.spacing;
    }

    // Ridimensiona le immagini
    const resizedImage1 = await image1
      .resize(resizeWidth1, resizeHeight1, { fit: 'cover' })
      .toBuffer();

    const resizedImage2 = await image2
      .resize(resizeWidth2, resizeHeight2, { fit: 'cover' })
      .toBuffer();

    // Crea il canvas per la combinazione
    let composite: sharp.OverlayOptions[];

    if (layout === 'horizontal') {
      composite = [
        { input: resizedImage1, top: 0, left: 0 },
        { input: resizedImage2, top: 0, left: resizeWidth1 + config.spacing }
      ];
    } else {
      composite = [
        { input: resizedImage1, top: 0, left: 0 },
        { input: resizedImage2, top: resizeHeight1 + config.spacing, left: 0 }
      ];
    }

    // Genera nome file unico
    const combinedFilename = `combined-${uuidv4()}.${config.format}`;
    const combinedPath = path.join('public/uploads/images', combinedFilename);
    const thumbnailFilename = `thumb-${combinedFilename}`;
    const thumbnailPath = path.join('public/uploads/thumbnails', thumbnailFilename);

    // Crea l'immagine combinata
    const combinedImage = sharp({
      create: {
        width: combinedWidth,
        height: combinedHeight,
        channels: 3,
        background: config.backgroundColor
      }
    })
    .composite(composite)
    .jpeg({ quality: config.quality });

    // Salva l'immagine combinata
    await combinedImage.toFile(combinedPath);

    // Crea thumbnail
    await combinedImage
      .resize(300, 300, { fit: 'inside' })
      .toFile(thumbnailPath);

    // Ottieni informazioni sul file creato
    const stats = await fs.stat(combinedPath);

    const result: CombinedPhotoResult = {
      combinedPath: `/uploads/images/${combinedFilename}`,
      combinedFilename,
      thumbnailPath: `/uploads/thumbnails/${thumbnailFilename}`,
      metadata: {
        originalImages: [imagePath1, imagePath2],
        width: combinedWidth,
        height: combinedHeight,
        size: stats.size,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        image1Metadata: {
          path: imagePath1,
          originalName: path.basename(imagePath1),
          size: 0, // Sarà calcolato quando necessario
          width: img1Width,
          height: img1Height,
          exif: metadata1.exif || {},
          photographer: {
            id: 'unknown',
            name: 'Sconosciuto',
            role: 'initiator'
          },
          capturedAt: new Date().toISOString()
        },
        image2Metadata: {
          path: imagePath2,
          originalName: path.basename(imagePath2),
          size: 0, // Sarà calcolato quando necessario
          width: img2Width,
          height: img2Height,
          exif: metadata2.exif || {},
          photographer: {
            id: 'unknown',
            name: 'Sconosciuto',
            role: 'participant'
          },
          capturedAt: new Date().toISOString()
        },
        momentInfo: {
          id: 'standalone',
          initiatorId: 'unknown',
          participantId: 'unknown',
          memoryId: undefined,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        }
      }
    };

    console.log('Immagini combinate con successo:', result.combinedPath);
    return result;

  } catch (error) {
    console.error('Errore nella combinazione delle immagini:', error);
    throw new Error(`Impossibile combinare le immagini: ${error}`);
  }
}

// Trova e combina automaticamente le foto di un momento con metadati estesi
export async function combineFromMoment(momentId: string): Promise<CombinedPhotoResult | null> {
  try {
    const { prisma } = await import('./prisma');

    // Recupera momento con le immagini e gli utenti
    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
      include: {
        images: {
          orderBy: { createdAt: 'asc' },
          take: 2 // Solo le prime due immagini
        },
        initiator: {
          select: { id: true, name: true }
        },
        participant: {
          select: { id: true, name: true }
        }
      }
    });

    if (!moment) {
      throw new Error('Momento non trovato');
    }

    if (moment.images.length < 2) {
      console.log('Momento non ha abbastanza immagini per la combinazione');
      return null;
    }

    const [image1, image2] = moment.images;
    const imagePath1 = path.join('public', image1.path);
    const imagePath2 = path.join('public', image2.path);

    // Ottieni metadati EXIF delle immagini originali
    const image1Sharp = sharp(imagePath1);
    const image2Sharp = sharp(imagePath2);
    
    const [image1ExifMeta, image2ExifMeta] = await Promise.all([
      image1Sharp.metadata(),
      image2Sharp.metadata()
    ]);

    // Determina chi ha scattato quale foto basandosi sull'ordine di upload
    // La prima immagine è dell'initiator, la seconda del participant
    const image1Photographer = {
      id: moment.initiator.id,
      name: moment.initiator.name || 'Sconosciuto',
      role: 'initiator' as const
    };
    
    const image2Photographer = moment.participant ? {
      id: moment.participant.id,
      name: moment.participant.name || 'Sconosciuto',
      role: 'participant' as const
    } : {
      id: moment.initiator.id,
      name: moment.initiator.name || 'Sconosciuto',
      role: 'initiator' as const
    };

    // Combina le immagini
    const baseResult = await combinePhotos(imagePath1, imagePath2);
    
    // Timestamp di completamento
    const completedAt = new Date().toISOString();

    // Crea risultato esteso con metadati completi
    const result: CombinedPhotoResult = {
      ...baseResult,
      metadata: {
        ...baseResult.metadata,
        completedAt,
        image1Metadata: {
          path: image1.path,
          originalName: image1.originalName,
          size: image1.size,
          width: image1.width || undefined,
          height: image1.height || undefined,
          exif: image1ExifMeta.exif || {},
          photographer: image1Photographer,
          capturedAt: image1.createdAt.toISOString()
        },
        image2Metadata: {
          path: image2.path,
          originalName: image2.originalName,
          size: image2.size,
          width: image2.width || undefined,
          height: image2.height || undefined,
          exif: image2ExifMeta.exif || {},
          photographer: image2Photographer,
          capturedAt: image2.createdAt.toISOString()
        },
        momentInfo: {
          id: moment.id,
          initiatorId: moment.initiatorId,
          participantId: moment.participantId || undefined,
          memoryId: moment.memoryId || undefined,
          createdAt: moment.createdAt.toISOString(),
          completedAt
        }
      }
    };

    // Aggiorna il momento con il path dell'immagine combinata e timestamp di completamento
    await prisma.moment.update({
      where: { id: momentId },
      data: {
        combinedImagePath: result.combinedPath,
        completedAt: new Date()
      }
    });

    console.log(`Immagine combinata creata per momento ${momentId} con metadati estesi:`, result.combinedPath);
    return result;

  } catch (error) {
    console.error('Errore nella combinazione automatica delle foto:', error);
    return null;
  }
}

// Utility per ottenere il path completo delle immagini
export function getImageFullPath(relativePath: string): string {
  // Rimuovi il leading slash se presente
  const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  return path.join(process.cwd(), 'public', cleanPath);
}

// Verifica se un'immagine esiste
export async function imageExists(imagePath: string): Promise<boolean> {
  try {
    await fs.access(imagePath);
    return true;
  } catch {
    return false;
  }
} 