import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import convert from 'heic-convert';
import dcraw from 'dcrawr';
import { saveFile, deleteFile, getPublicUrl } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { SUPPORTED_IMAGE_MIMETYPES } from '@/lib/upload/config';
import { FileGroup, ProcessedFile } from '@/lib/upload/types';
import { Prisma } from '@prisma/client';
// @ts-ignore
import exifParser from 'exif-parser';
import axios from 'axios';

const execFileAsync = promisify(execFile);

/**
 * =================================================================
 * Image Processing Types
 * =================================================================
 */

interface ThumbnailConfig {
    width: number;
    height: number;
    quality: number;
    fit: keyof sharp.FitEnum;
}

export interface ProcessedImageResult {
    original: {
        path: string;
        url: string;
        size: number;
        width: number;
        height: number;
        metadata: sharp.Metadata;
    };
    thumbnails: {
        [key: string]: {
            path: string;
            url: string;
            size: number;
            width: number;
            height: number;
        };
    };
}

/**
 * =================================================================
 * Constants
 * =================================================================
 */

export const THUMBNAIL_CONFIGS: { [key: string]: ThumbnailConfig } = {
    small: { width: 200, height: 200, quality: 80, fit: 'inside' },
    medium: { width: 800, height: 800, quality: 85, fit: 'inside' },
    large: { width: 1600, height: 1600, quality: 90, fit: 'inside' },
};

const RAW_MIME_TYPES = [
    'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-nikon-nef',
    'image/x-sony-arw', 'image/x-panasonic-rw2', 'image/x-fuji-raf',
    'image/x-olympus-orf', 'image/x-adobe-dng', 'image/x-raw'
];

/**
 * =================================================================
 * Image Converters
 * =================================================================
 */

async function convertHeicBuffer(inputBuffer: Buffer): Promise<{ buffer: Buffer; fileType: string }> {
    const outputBuffer = await convert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.9,
    });
    return {
        buffer: Buffer.from(outputBuffer),
        fileType: 'image/jpeg'
    };
}

async function convertRawBuffer(inputBuffer: Buffer): Promise<{ buffer: Buffer; fileType: string }> {
    const tiffBuffer = await dcraw(inputBuffer as any, { useTiff: true });
    const jpegBuffer = await sharp(tiffBuffer).jpeg({ quality: 90 }).toBuffer();
    return {
        buffer: jpegBuffer,
        fileType: 'image/jpeg'
    };
}

/**
 * =================================================================
 * Core Image Processing Logic
 * =================================================================
 */

export async function processImage(
    sourceBuffer: Buffer,
    userId: string,
    originalFilename: string
): Promise<ProcessedImageResult> {
    const image = sharp(sourceBuffer);
    const metadata = await image.metadata();
    const nameWithoutExt = path.parse(originalFilename).name;

    // 1. Process and save the main image
    const mainImageBuffer = await image.webp({ quality: 85 }).toBuffer();
    const mainImageFilename = `${nameWithoutExt}.webp`;
    const mainImagePath = `images/${userId}/${mainImageFilename}`;
    await saveFile(mainImagePath, mainImageBuffer, 'image/webp');
    const mainImageUrl = getPublicUrl(mainImagePath);
    const mainImageMeta = await sharp(mainImageBuffer).metadata();

    const result: ProcessedImageResult = {
        original: {
            path: mainImagePath,
            url: mainImageUrl,
            size: mainImageBuffer.length,
            width: mainImageMeta.width || 0,
            height: mainImageMeta.height || 0,
            metadata,
        },
        thumbnails: {},
    };

    // 2. Generate and save thumbnails
    for (const [size, config] of Object.entries(THUMBNAIL_CONFIGS)) {
        const thumbnailFilename = `${nameWithoutExt}_${size}.webp`;
        const thumbnailPath = `images/${userId}/thumbnails/${thumbnailFilename}`;

        const thumbnailBuffer = await sharp(sourceBuffer)
            .resize(config.width, config.height, { fit: config.fit })
            .webp({ quality: config.quality })
            .toBuffer();

        await saveFile(thumbnailPath, thumbnailBuffer, 'image/webp');
        const thumbnailUrl = getPublicUrl(thumbnailPath);
        const thumbnailMeta = await sharp(thumbnailBuffer).metadata();

        result.thumbnails[size] = {
            path: thumbnailPath,
            url: thumbnailUrl,
            size: thumbnailBuffer.length,
            width: thumbnailMeta.width || 0,
            height: thumbnailMeta.height || 0,
        };
    }

    return result;
}

async function getGeoLocation(latitude: number, longitude: number): Promise<{ city: string | null; country: string | null; }> {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { 'User-Agent': 'SORE-V2-App' }
        });
        const address = response.data.address;
        return {
            city: address.city || address.town || address.village || null,
            country: address.country || null,
        };
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return { city: null, country: null };
    }
}

export async function processAndSaveImage(
    fileGroup: FileGroup,
    userId: string,
): Promise<ProcessedFile> {
    const { fileBuffer, fileType, originalFilename, clientId } = fileGroup;

    let buffer = fileBuffer;
    let finalFileType = fileType;
    let isUnsupported = false;

    try {
        if (fileType === 'image/heic' || fileType === 'image/heif') {
            const conversionResult = await convertHeicBuffer(fileBuffer);
            buffer = conversionResult.buffer;
            finalFileType = conversionResult.fileType;
        } else if (RAW_MIME_TYPES.includes(fileType)) {
            const conversionResult = await convertRawBuffer(fileBuffer);
            buffer = conversionResult.buffer;
            finalFileType = conversionResult.fileType;
        } else if (!SUPPORTED_IMAGE_MIMETYPES.includes(fileType)) {
            isUnsupported = true;
        }

        if (isUnsupported) {
            return {
                success: false,
                processed: false,
                reason: `Unsupported image format: ${fileType}`,
                originalFilename,
            };
        }

        const parser = exifParser.create(Buffer.from(buffer));
        const exifData = parser.parse();

        // Extract Live Photo Content ID from metadata (if present)
        // Note: This often resides in user data / quicktime tags, not standard EXIF.
        // The exact tag name can vary. 'ContentIdentifier' is a common one used by Apple.
        // We might need a more robust metadata extractor if exif-parser doesn't find it.
        const livePhotoContentId = (exifData?.tags as any)?.ContentIdentifier || null;

        const gpsData = (exifData && exifData.tags && exifData.tags.GPSLatitude && exifData.tags.GPSLongitude) ? {
            latitude: exifData.tags.GPSLatitude,
            longitude: exifData.tags.GPSLongitude,
        } : null;

        let locationData: { city: string | null; country: string | null; } = { city: null, country: null };
        if (gpsData) {
            locationData = await getGeoLocation(gpsData.latitude, gpsData.longitude);
        }

        const processedData = await processImage(buffer, userId, originalFilename);
        const { original, thumbnails } = processedData;

        // Ensure metadata is a valid JSON object for Prisma
        const metadataForDb = original.metadata as unknown as Prisma.JsonObject;
        
        const imageRecord = await prisma.image.create({
            data: {
                path: original.path,
                mimeType: finalFileType,
                size: original.size,
                width: original.width,
                height: original.height,
                latitude: gpsData?.latitude,
                longitude: gpsData?.longitude,
                city: locationData.city,
                country: locationData.country,
                metadata: metadataForDb,
                thumbnails: thumbnails as unknown as Prisma.JsonObject,
                originalName: originalFilename,
                filename: path.basename(original.path),
                category: 'uncategorized',
                hash: uuidv4(),
                isLivePhoto: !!livePhotoContentId,
                livePhotoContentId: livePhotoContentId,
            } as any,
        });

        await prisma.image.update({
            where: { id: imageRecord.id },
            data: { userId: userId },
        });

        return {
            success: true,
            processed: true,
            id: imageRecord.id,
            url: original.url,
            originalFilename,
            livePhotoContentId,
        };

    } catch (error) {
        console.error(`Failed to process image ${originalFilename}:`, error);
        const reason = error instanceof Error ? error.message : 'Unknown processing error';
        return {
            success: false,
            processed: false,
            reason: `Image processing failed: ${reason}`,
            originalFilename,
        };
    }
}

export async function combineMomentPhotos(image1Buffer: Buffer, image2Buffer: Buffer): Promise<Buffer> {
    try {
        const image1 = sharp(image1Buffer);
        const image2 = sharp(image2Buffer);

        const image1Metadata = await image1.metadata();
        const image2Metadata = await image2.metadata();

        const targetWidth = 1080;
        const resizedImage1Buffer = await image1.resize(targetWidth).toBuffer();
        const resizedImage2Buffer = await image2.resize(targetWidth).toBuffer();
        
        const finalHeight = Math.round(targetWidth * ( (image1Metadata.height! / image1Metadata.width!) + (image2Metadata.height! / image2Metadata.width!) ));

        const watermarkSvg = `
            <svg width="200" height="50">
                <style>
                    .title { fill: rgba(255, 255, 255, 0.7); font-size: 20px; font-family: Arial, sans-serif; }
                </style>
                <text x="50%" y="50%" text-anchor="middle" class="title">SORE Moment</text>
            </svg>
        `;

        const combinedImage = await sharp({
            create: {
                width: targetWidth,
                height: finalHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 }
            }
        })
        .composite([
            { input: resizedImage1Buffer, top: 0, left: 0 },
            { input: resizedImage2Buffer, top: Math.round(targetWidth * (image1Metadata.height! / image1Metadata.width!)), left: 0 },
            { input: Buffer.from(watermarkSvg), top: finalHeight - 60, left: targetWidth - 210 }
        ])
        .jpeg({ quality: 90 })
        .toBuffer();
        
        return combinedImage;

    } catch (error) {
        console.error("Failed to combine moment photos:", error);
        throw new Error("Could not process and combine moment photos.");
    }
}

/**
 * =================================================================
 * Utility Functions
 * =================================================================
 */

export function isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
}

export async function deleteImageFiles(image: { path: string, thumbnails: any }): Promise<void> {
    try {
        // Delete the main image
        await deleteFile(image.path);

        // Delete all thumbnails
        if (image.thumbnails && typeof image.thumbnails === 'object') {
            for (const key in image.thumbnails) {
                if (Object.prototype.hasOwnProperty.call(image.thumbnails, key)) {
                    const thumbnailPath = image.thumbnails[key]?.path;
                    if (thumbnailPath) {
                        await deleteFile(thumbnailPath);
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error deleting files for image path ${image.path}:`, error);
        // Do not re-throw, just log the error
    }
}

// Genera nome file per thumbnail
function generateThumbnailFilename(originalFilename: string, size: string, format: string): string {
  const nameWithoutExt = path.parse(originalFilename).name;
  return `${nameWithoutExt}_${size}.${format}`;
}

// Genera nome file per WebP
function generateWebPFilename(originalFilename: string): string {
  const nameWithoutExt = path.parse(originalFilename).name;
  return `${nameWithoutExt}.webp`;
}

// Ottieni URL pubblico dell'immagine
export function getImageUrl(filename: string): string {
  return `/uploads/images/${filename}`;
}

// Ottieni URL pubblico del thumbnail
export function getThumbnailUrl(filename: string, size: keyof typeof THUMBNAIL_CONFIGS): string {
  const nameWithoutExt = path.parse(filename).name;
  const thumbnailFilename = `${nameWithoutExt}_${size}.webp`;
  return `/uploads/thumbnails/${thumbnailFilename}`;
}

// Ottieni dimensioni ottimali per un'immagine
export function getOptimalDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number) {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  // Ridimensiona se troppo grande
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
} 