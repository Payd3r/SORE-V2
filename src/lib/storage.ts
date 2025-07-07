import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import path from 'path';

export enum StorageProvider {
  LOCAL = 'local',
  S3 = 's3',
}

// --- Configuration ---
const provider = process.env.STORAGE_PROVIDER === 's3' ? StorageProvider.S3 : StorageProvider.LOCAL;
const s3BucketName = process.env.S3_BUCKET_NAME;
const s3Region = process.env.AWS_REGION;
const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

let s3Client: S3Client;

if (provider === StorageProvider.S3) {
  if (!s3BucketName || !s3Region || !s3AccessKeyId || !s3SecretAccessKey) {
    throw new Error('Le variabili d\'ambiente S3 non sono configurate correttamente.');
  }
  s3Client = new S3Client({
    region: s3Region,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
    },
  });
  console.log(`[Storage] Provider S3 configurato per il bucket: ${s3BucketName}`);
} else {
  console.log('[Storage] Provider locale configurato.');
}

/**
 * Salva un file nel provider di storage configurato.
 * @param filePath - Il percorso/chiave del file (es. 'images/my-image.jpg').
 * @param buffer - Il buffer del file da salvare.
 * @param mimetype - Il mimetype del file.
 * @returns La URL pubblica del file salvato.
 */
export async function saveFile(filePath: string, buffer: Buffer, mimetype: string): Promise<string> {
  if (provider === StorageProvider.S3) {
    const command = new PutObjectCommand({
      Bucket: s3BucketName!,
      Key: filePath,
      Body: buffer,
      ContentType: mimetype,
    });
    await s3Client.send(command);
    return `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${filePath}`;
  } else {
    const absolutePath = path.join(process.cwd(), 'public', filePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);
    return `/${filePath.replace(/\\/g, '/')}`;
  }
}

/**
 * Elimina un file dal provider di storage configurato.
 * @param filePath - Il percorso/chiave del file da eliminare.
 */
export async function deleteFile(filePath: string): Promise<void> {
    if (provider === StorageProvider.S3) {
        const command = new DeleteObjectCommand({
            Bucket: s3BucketName!,
            Key: filePath,
        });
        await s3Client.send(command).catch(err => {
            // Logga l'errore ma non bloccare l'esecuzione se l'oggetto non viene trovato
            console.error(`Impossibile eliminare l'oggetto S3 ${filePath}:`, err);
        });
    } else {
        const absolutePath = path.join(process.cwd(), 'public', filePath);
        await unlink(absolutePath).catch(err => {
            // Ignora l'errore se il file non esiste
            if (err.code !== 'ENOENT') {
                console.error(`Impossibile eliminare il file locale ${absolutePath}:`, err);
            }
        });
    }
}

/**
 * Ottiene la URL pubblica per un dato percorso/chiave di file.
 * @param filePath - Il percorso/chiave del file.
 * @returns La URL pubblica.
 */
export function getPublicUrl(filePath: string): string {
    if (provider === StorageProvider.S3) {
        return `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${filePath}`;
    } else {
        return `/${filePath.replace(/\\/g, '/')}`;
    }
}

export async function getFileBuffer(filePath: string): Promise<Buffer> {
    if (provider === StorageProvider.S3) {
        return getS3FileBuffer(filePath);
    } else {
        return getLocalFileBuffer(filePath);
    }
}

async function getS3FileBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
        Bucket: s3BucketName,
        Key: key,
    });
    try {
        const response = await s3Client.send(command);
        const buffer = await streamToBuffer(response.Body as NodeJS.ReadableStream);
        return buffer;
    } catch (error) {
        console.error(`Failed to get S3 object: ${key}`, error);
        throw new Error('Failed to get file from S3');
    }
}

async function getLocalFileBuffer(filePath: string): Promise<Buffer> {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    try {
        const buffer = await readFile(fullPath);
        return buffer;
    } catch (error) {
        console.error(`Failed to read local file: ${fullPath}`, error);
        throw new Error('Failed to read file from local storage');
    }
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
} 