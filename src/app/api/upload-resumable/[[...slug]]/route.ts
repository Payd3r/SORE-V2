import { Server, EVENTS, Upload } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { S3Store } from '@tus/s3-store';
import { GetObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextRequest } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
import { processFileGroup } from '@/lib/upload/post-process';
import { UploadType } from '@/lib/upload/multer-config';

// --- Configuration ---
const storageProvider = process.env.STORAGE_PROVIDER === 's3' ? 's3' : 'local';
const s3BucketName = process.env.S3_BUCKET_NAME;
const s3Region = process.env.AWS_REGION;
const tusUploadsDir = './.tus-uploads';

let datastore;
let s3Client: S3Client | undefined;

if (storageProvider === 's3') {
  if (!s3BucketName || !s3Region) {
    throw new Error('Variabili d\'ambiente S3 (S3_BUCKET_NAME, AWS_REGION) non configurate per Tus S3Store.');
  }
  s3Client = new S3Client({ region: s3Region });
  datastore = new S3Store({
    bucket: s3BucketName,
    // Le credenziali vengono prelevate automaticamente dall'ambiente
  });
  console.log('[TUS] Datastore S3 configurato.');
} else {
  datastore = new FileStore({ directory: tusUploadsDir });
  console.log('[TUS] Datastore locale configurato.');
}

// Helper to parse metadata
function parseMetadata(metadata: Record<string, unknown>): { [key: string]: string } {
  const decoded: { [key: string]: string } = {};
  for (const key in metadata) {
    if (typeof metadata[key] === 'string') {
      decoded[key] = Buffer.from(metadata[key] as string, 'base64').toString('utf-8');
    }
  }
  return decoded;
}

const server = new Server({
  // `path` needs to match the route declared by the next file router
  // e.g. /api/upload-resumable
  path: '/api/upload-resumable',
  datastore,
  async onUploadFinish(req, upload: Upload) {
    console.log(`[TUS] Upload ${upload.id} finished.`);
    
    let fileBuffer: Buffer;
    
    try {
      const metadata = parseMetadata(upload.metadata || {});
      
      // Basic validation
      if (!metadata.filename || !metadata.filetype || !metadata.coupleId || !metadata.clientId) {
        throw new Error('Metadati richiesti mancanti (filename, filetype, coupleId, clientId).');
      }

      // --- Get uploaded file buffer ---
      if (storageProvider === 's3' && s3Client) {
        const command = new GetObjectCommand({ Bucket: s3BucketName!, Key: upload.id });
        const response = await s3Client.send(command);
        fileBuffer = Buffer.from(await response.Body!.transformToByteArray());
      } else {
        const filePath = path.join(tusUploadsDir, upload.id);
        fileBuffer = await readFile(filePath);
      }
      
      const fileData = {
        buffer: fileBuffer,
        originalname: metadata.filename,
        mimetype: metadata.filetype,
      };

      const context = {
        coupleId: metadata.coupleId,
        uploadType: (metadata.uploadType as UploadType) || UploadType.MEMORY,
        memoryId: metadata.memoryId || null,
        momentId: metadata.momentId || null,
      };

      console.log(`[TUS] Processing ${metadata.filename} for couple ${context.coupleId}`);
      const result = await processFileGroup(fileData, undefined, context, metadata.clientId);
      
      if (result.type === 'success') {
        console.log(`[TUS] File ${result.originalName} processato con successo. ID: ${result.id}`);
      } else if (result.type === 'duplicate') {
        console.log(`[TUS] File duplicato ${result.originalName} rilevato.`);
      } else {
        console.error(`[TUS] Errore nel processare il file ${result.originalName}: ${result.error}`);
      }
    } catch (error) {
      console.error(`[TUS] Errore critico nel gestore onUploadFinish per ${upload.id}:`, error);
    } finally {
      // --- Clean up the temporary file from Tus datastore ---
      if (storageProvider === 's3' && s3Client) {
        const command = new DeleteObjectCommand({ Bucket: s3BucketName!, Key: upload.id });
        await s3Client.send(command).catch(err => console.error(`[TUS] Impossibile eliminare l'oggetto S3 temporaneo ${upload.id}:`, err));
      } else {
        const filePath = path.join(tusUploadsDir, upload.id);
        await unlink(filePath).catch(err => console.error(`[TUS] Impossibile eliminare il file temporaneo ${filePath}:`, err));
      }
    }

    // Return a response object to satisfy the hook's type signature
    return {};
  },
});

async function handler(req: NextRequest) {
  // Use `handleWeb` for Next.js App Router, which expects a Web API Request
  return server.handleWeb(req);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler; 