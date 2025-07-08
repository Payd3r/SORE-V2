import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import heicConvert from 'heic-convert';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const COMBINED_DIR = path.join(UPLOADS_DIR, 'combined');

// Assicura che la directory per le immagini combinate esista
const ensureCombinedDirExists = async () => {
    try {
        await fs.mkdir(COMBINED_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating combined directory:', error);
        throw new Error('Could not create directory for combined images.');
    }
};

/**
 * Checks if a file has a HEIC or HEIF mimetype.
 * @param mimetype The mimetype of the file.
 * @returns True if the mimetype is for a HEIC/HEIF file, false otherwise.
 */
export function isHeic(mimetype: string): boolean {
    return mimetype === 'image/heic' || mimetype === 'image/heif';
}

/**
 * Converts a HEIC/HEIF image buffer to a JPG buffer.
 * @param inputBuffer The buffer of the HEIC/HEIF image.
 * @returns A promise that resolves with the JPG image buffer.
 */
export async function convertHeicToJpg(inputBuffer: Buffer): Promise<Buffer> {
    try {
        const outputBuffer = await heicConvert({
            buffer: inputBuffer as any,
            format: 'JPEG',
            quality: 0.9
        });
        return Buffer.from(outputBuffer);
    } catch (error) {
        console.error('Error converting HEIC to JPG:', error);
        throw new Error('Failed to convert HEIC image.');
    }
}

/**
 * Combina due immagini verticalmente in un'unica immagine quadrata.
 * @param imagePath1 Percorso della prima immagine (in alto).
 * @param imagePath2 Percorso della seconda immagine (in basso).
 * @returns Il percorso relativo al web dell'immagine combinata.
 */
export async function combineImages(imagePath1: string, imagePath2: string): Promise<string> {
    await ensureCombinedDirExists();

    const fullImagePath1 = path.join(process.cwd(), 'public', imagePath1);
    const fullImagePath2 = path.join(process.cwd(), 'public', imagePath2);

    try {
        const image1 = sharp(fullImagePath1);
        const image2 = sharp(fullImagePath2);

        const metadata1 = await image1.metadata();
        const metadata2 = await image2.metadata();

        const width = Math.max(metadata1.width || 800, metadata2.width || 800);
        const height = Math.floor(width / 2); // Ogni immagine occuperà metà dell'altezza totale

        const resizedImage1Buffer = await image1.resize(width, height, { fit: 'cover' }).toBuffer();
        const resizedImage2Buffer = await image2.resize(width, height, { fit: 'cover' }).toBuffer();

        const outputFileName = `combined-${Date.now()}.jpg`;
        const outputPath = path.join(COMBINED_DIR, outputFileName);
        const relativeOutputPath = `/uploads/combined/${outputFileName}`;

        await sharp({
            create: {
                width: width,
                height: width, // Altezza totale quadrata
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 }
            }
        })
        .composite([
            { input: resizedImage1Buffer, top: 0, left: 0 },
            { input: resizedImage2Buffer, top: height, left: 0 }
        ])
        .jpeg({ quality: 90 })
        .toFile(outputPath);
        
        return relativeOutputPath;

    } catch (error) {
        console.error('Error combining images:', error);
        throw new Error('Failed to combine images.');
    }
} 