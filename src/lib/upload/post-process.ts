import { prisma } from '@/lib/prisma';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { isImageFile, processImage, convertHeicBuffer, convertRawBuffer, ProcessedImage } from './image-processor';
import { checkImageDuplication, classifyImageFromBuffer } from '../image-classification';
import { UploadType } from './multer-config';
import { saveFile } from '../storage';
import { isVideoFile, processVideo } from '../video-processor';
import { sendProgress } from '../websocket-emitter';
import { v4 as uuidv4 } from 'uuid';

interface ProcessContext {
  coupleId: string;
  uploadType: UploadType;
  memoryId?: string | null;
  momentId?: string | null;
}

interface FileData {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
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
  processed: ProcessedImage;
}

interface ProcessResultDuplicate {
  type: 'duplicate';
  filename: string;
  originalName: string;
  existingImageId: string;
  existingImagePath: string;
}

interface ProcessResultError {
  type: 'error';
  originalName: string;
  error: string;
}

type ProcessResult = ProcessResultSuccess | ProcessResultDuplicate | ProcessResultError;

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
  const fileId = uuidv4();

  try {
    await sendProgress(clientId, {
      type: 'upload_progress',
      fileId,
      filename: imageFile.originalname,
      progress: 0,
      status: 'uploading',
      message: 'Starting upload...',
    });

    let imageBuffer = imageFile.buffer;
    let finalMimeType = imageFile.mimetype;

    // --- CONVERSION HEIC/RAW ---
    if (imageFile.mimetype === 'image/heic' || imageFile.mimetype === 'image/heif') {
      imageBuffer = await convertHeicBuffer(imageFile.buffer);
      finalMimeType = 'image/jpeg';
    } else if (!isImageFile(imageFile.mimetype)) {
        try {
            imageBuffer = await convertRawBuffer(imageFile.buffer);
            finalMimeType = 'image/jpeg';
        } catch(rawError: any) {
            console.error(`Conversione RAW fallita per ${imageFile.originalname}:`, rawError);
            return { type: 'error', originalName: imageFile.originalname, error: `Conversione RAW fallita: ${rawError.message}` };
        }
    }
    
    // --- DEDUPLICATION ---
    const deduplicationResult = await checkImageDuplication(imageBuffer, prisma, context.coupleId);
    if (deduplicationResult.isDuplicate) {
      return {
        type: 'duplicate',
        filename: imageFile.originalname,
        originalName: imageFile.originalname,
        existingImageId: deduplicationResult.existingImageId!,
        existingImagePath: deduplicationResult.existingImagePath!,
      };
    }

    // --- SAVE ASSOCIATED VIDEO ---
    let associatedVideoUrl: string | undefined;
    let videoMimeType: string | undefined;
    if (videoFile) {
        const videoFilename = `${Date.now()}-${path.parse(videoFile.originalname).name}.mov`;
        const videoKey = `uploads/videos/${videoFilename}`;
        associatedVideoUrl = await saveFile(videoKey, videoFile.buffer, videoFile.mimetype);
        videoMimeType = videoFile.mimetype;
    }

    // --- PROCESS AND SAVE IMAGE ---
    const processed = await processImage(imageBuffer, imageFile.originalname);

    // --- CLASSIFICATION ---
    let imageCategory = 'OTHER';
    try {
      const classificationMetadata = {
        width: processed.original.width,
        height: processed.original.height,
        filename: processed.original.filename,
        momentId: context.momentId || undefined,
        isCombined: false,
        originalImages: undefined,
        mimeType: finalMimeType,
      };
      const classificationResult = await classifyImageFromBuffer(imageBuffer, classificationMetadata);
      imageCategory = classificationResult.category;
    } catch (error: any) {
      console.error(`Errore nella classificazione per ${imageFile.originalname}:`, error);
      imageCategory = context.uploadType === UploadType.MOMENT ? 'MOMENT' : 'OTHER';
    }

    // --- DATABASE RECORD ---
    const imageRecord = await prisma.image.create({
      data: {
        filename: processed.original.filename,
        originalName: imageFile.originalname,
        path: processed.original.path,
        thumbnailPath: processed.thumbnails.medium?.path || '',
        size: processed.original.size,
        width: processed.original.width,
        height: processed.original.height,
        mimeType: imageFile.mimetype,
        category: imageCategory,
        hash: deduplicationResult.hash,
        isFavorite: false,
        memoryId: context.memoryId || undefined,
        momentId: context.momentId || undefined,
        associatedVideoPath: associatedVideoUrl,
        associatedVideoType: videoMimeType,
      },
    });

    await sendProgress(clientId, {
      type: 'upload_progress',
      fileId,
      filename: imageFile.originalname,
      progress: 100,
      status: 'completed',
      message: 'Image upload complete.',
    });

    return {
      type: 'success',
      id: imageRecord.id,
      filename: imageRecord.filename,
      originalName: imageRecord.originalName,
      path: imageRecord.path,
      thumbnailPath: imageRecord.thumbnailPath || '',
      size: imageRecord.size,
      width: imageRecord.width || 0,
      height: imageRecord.height || 0,
      processed,
    };
  } catch (error: any) {
    console.error(`Errore critico nel processare ${imageFile.originalname}:`, error);
    await sendProgress(clientId, {
      type: 'upload_progress',
      fileId,
      filename: imageFile.originalname,
      progress: 100,
      status: 'failed',
      message: 'Upload failed.',
      details: error instanceof Error ? error.message : String(error),
    });
    return { type: 'error', originalName: imageFile.originalname, error: error.message };
  }
} 