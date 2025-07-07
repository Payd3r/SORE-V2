import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configurazione dello storage per multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/images');
  },
  filename: (req, file, cb) => {
    // Genera un nome unico per il file
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// Filtro per i tipi di file accettati
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accetta solo immagini
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Configurazione multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limite
    files: 5 // Massimo 5 file per upload
  }
});

// Interfaccia per i file uploadati
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// Tipi di upload supportati
export enum UploadType {
  MEMORY = 'memory',
  MOMENT = 'moment',
  PROFILE = 'profile'
}

// Validazione dell'upload
export const validateUpload = (files: Express.Multer.File[], type: UploadType) => {
  const errors: string[] = [];
  
  // Verifica che ci siano file
  if (!files || files.length === 0) {
    errors.push('Nessun file caricato');
    return errors;
  }

  // Verifica limite per tipo
  const maxFiles = type === UploadType.MOMENT ? 2 : 5;
  if (files.length > maxFiles) {
    errors.push(`Massimo ${maxFiles} file per ${type}`);
  }

  // Verifica ogni file
  files.forEach((file, index) => {
    // Verifica dimensione
    if (file.size > 10 * 1024 * 1024) {
      errors.push(`File ${index + 1}: dimensione troppo grande (max 10MB)`);
    }

    // Verifica tipo MIME
    if (!file.mimetype.startsWith('image/')) {
      errors.push(`File ${index + 1}: tipo non supportato`);
    }

    // Verifica estensione
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      errors.push(`File ${index + 1}: estensione non supportata`);
    }
  });

  return errors;
}; 