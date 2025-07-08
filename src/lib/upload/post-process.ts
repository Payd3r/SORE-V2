import { prisma } from '@/lib/prisma';
import { writeFile, mkdtemp, rm } from 'fs/promises';
import path from 'path';
import os from 'os';
import { processAndSaveImage, ProcessedImageResult } from './image-processor';
import { UploadType } from './multer-config';
import { processVideo } from '../video-processor';
import { ProcessedFile } from './types';

// Definisco le interfacce necessarie che non sono in types.ts
interface FileData {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

interface ProcessContext {
  coupleId: string;
  uploadType: UploadType;
  memoryId?: string | null;
  momentId?: string | null;
  userId: string;
}

interface ProcessResultSuccess {
  type: 'success';
  id: string;
  filename: string;
  originalName: string;
  path: string;
  thumbnailPath: string;
  size: number;
  width: number;
  height: number;
  processed: ProcessedImageResult;
}

interface ProcessResultError {
  type: 'error';
  originalName: string;
  error: string;
}

type ProcessResult = ProcessResultSuccess | ProcessResultError | ProcessedFile;

/**
 * Processes a single file group (image and optional video), stores it,
 * and creates a corresponding database record.
 * This function encapsulates the core logic used after an upload is complete.
 */
export async function processFileGroup(
  imageFile: FileData,
  videoFile: FileData | undefined,
  context: ProcessContext,
  clientId: string
): Promise<ProcessResult> {
  let tempVideoPath: string | undefined;
  let tempDir: string | undefined;

  try {
    let processedVideoData: any; // Per tenere i dati del video

    // 1. Se c'è un video, lo processo in memoria prima di toccare il DB
    if (videoFile && videoFile.buffer) {
      tempDir = await mkdtemp(path.join(os.tmpdir(), 'sore-video-upload-'));
      tempVideoPath = path.join(tempDir, videoFile.originalname);
      await writeFile(tempVideoPath, videoFile.buffer);
      processedVideoData = await processVideo(
        tempVideoPath,
        videoFile.originalname,
        clientId,
        'video-processing' // ID generico
      );
    }

    // 2. Processo l'immagine. Questa funzione crea il record Image nel DB.
    const processedImage = await processAndSaveImage(
      {
        fileBuffer: imageFile.buffer,
        fileType: imageFile.mimetype,
        originalFilename: imageFile.originalname,
        clientId,
      },
      context.userId
    );

    if (!processedImage.success || !processedImage.id) {
      throw new Error(processedImage.reason || 'Image processing failed');
    }

    // 3. Ora che ho l'ID dell'immagine, se c'era un video, creo il record Video.
    if (processedVideoData && processedImage.livePhotoContentId && processedVideoData.isLivePhoto) {
      if (processedImage.livePhotoContentId !== processedVideoData.livePhotoContentId) {
        console.warn(`Mismatched Live Photo Content IDs for ${imageFile.originalname}. Image: ${processedImage.livePhotoContentId}, Video: ${processedVideoData.livePhotoContentId}. Still linking them.`);
      }
      
      const videoRecord = await prisma.video.create({
        data: {
          path: processedVideoData.original.path,
          duration: processedVideoData.original.duration,
          hlsPlaylist: processedVideoData.hls?.path,
          thumbnailPath: processedVideoData.thumbnails['medium']?.path,
          isSlowMotion: processedVideoData.isSlowMotion,
          isTimeLapse: processedVideoData.isTimeLapse,
          livePhotoContentId: processedVideoData.livePhotoContentId,
          memoryId: context.memoryId,
          imageId: processedImage.id,
        } as any,
      });
    }

    // 4. Aggiorno il record dell'immagine con i metadati di contesto
    const finalImageRecord = await prisma.image.update({
      where: { id: processedImage.id },
      data: {
        memoryId: context.memoryId,
        momentId: context.momentId,
      },
    });

    return {
      type: 'success',
      id: finalImageRecord.id,
      filename: finalImageRecord.filename,
      originalName: finalImageRecord.originalName,
      path: finalImageRecord.path,
      thumbnailPath: finalImageRecord.thumbnailPath || '',
      size: finalImageRecord.size,
      width: finalImageRecord.width || 0,
      height: finalImageRecord.height || 0,
      processed: (processedImage as any).processedData,
    };
  } catch (error: any) {
    console.error(`Error processing file group for ${imageFile.originalname}:`, error);
    return { type: 'error', originalName: imageFile.originalname, error: error.message };
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
} 