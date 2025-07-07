/**
 * SORE-V2 Memory Management Data Model
 * 
 * Questo file definisce la struttura dei dati per le Memory e i Moment
 * utilizzati nel sistema SORE-V2.
 */

// Tipi di base (saranno sincronizzati con Prisma)
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  coupleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Couple {
  id: string;
  name?: string;
  inviteCode: string;
  anniversary?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Image {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  path: string;
  thumbnailPath?: string;
  category?: string;
  metadata?: any;
  hash?: string;
  isCover: boolean;
  isFavorite: boolean;
  isLivePhoto: boolean;
  createdAt: Date;
  updatedAt: Date;
  memoryId?: string;
  momentId?: string;
}

// Enums per i tipi di dati
export enum MomentStatus {
  PENDING = 'pending',
  PARTNER1_CAPTURED = 'partner1_captured', 
  PARTNER2_CAPTURED = 'partner2_captured',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

export enum MemoryCategory {
  TRAVEL = 'travel',
  FOOD = 'food',
  CELEBRATION = 'celebration',
  DAILY_LIFE = 'daily_life',
  SPECIAL_OCCASIONS = 'special_occasions',
  ADVENTURE = 'adventure',
  ROMANTIC = 'romantic',
  FAMILY = 'family',
  FRIENDS = 'friends',
  OTHER = 'other'
}

export enum MemoryMood {
  HAPPY = 'happy',
  EXCITED = 'excited',
  ROMANTIC = 'romantic',
  PEACEFUL = 'peaceful',
  ADVENTUROUS = 'adventurous',
  NOSTALGIC = 'nostalgic',
  GRATEFUL = 'grateful',
  PLAYFUL = 'playful',
  CONTENT = 'content',
  OTHER = 'other'
}

// Interfacce per i dati esterni
export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  description: string;
  icon: string;
  windSpeed?: number;
  pressure?: number;
  location: string;
  timestamp: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    external_urls: {
      spotify: string;
    };
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
  explicit: boolean;
  popularity: number;
}

// Interfaccia per il modello Mood che non esiste in Prisma ma è usato nel frontend
export interface Mood {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

// Tipo esteso per Memory con relazioni
export interface Memory {
  id: string;
  title: string;
  description?: string;
  date: Date;
  location?: string;
  latitude?: string;
  longitude?: string;
  category?: string;
  mood?: string; // Corrisponde al campo String in Prisma
  weather?: any; // Corrisponde al campo Json in Prisma
  spotifyTrack?: any; // Corrisponde al campo Json in Prisma
  createdAt: Date;
  updatedAt: Date;
  
  // Relazioni
  author: User;
  authorId: string;
  couple: Couple;
  coupleId: string;
  images: Image[];
  moments: Moment[];
  videos: any[]; // Aggiunto per coerenza con lo schema
  Ideas: any[]; // Aggiunto per coerenza con lo schema
}

// Tipo esteso per Moment con relazioni
export interface Moment {
  id: string;
  status: MomentStatus;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  combinedImagePath?: string;
  capturedBy?: string;
  
  // Relazioni
  initiator: User;
  initiatorId: string;
  participant?: User;
  participantId?: string;
  couple: Couple;
  coupleId: string;
  memory?: Memory;
  memoryId?: string;
  images: Image[];
}

// DTO per la creazione di Memory
export interface CreateMemoryDto {
  title: string;
  description?: string;
  date: Date;
  location?: string;
  latitude?: string;
  longitude?: string;
  category?: MemoryCategory;
  mood?: MemoryMood;
  authorId: string;
  coupleId: string;
  imageIds?: string[]; // IDs delle immagini da associare
}

// DTO per l'aggiornamento di Memory
export interface UpdateMemoryDto {
  title?: string;
  description?: string;
  date?: Date;
  location?: string;
  latitude?: string;
  longitude?: string;
  category?: MemoryCategory;
  mood?: MemoryMood;
}

// DTO per la creazione di Moment
export interface CreateMomentDto {
  initiatorId: string;
  participantId?: string;
  coupleId: string;
  memoryId?: string;
  expiresAt?: Date;
}

// DTO per l'aggiornamento di Moment
export interface UpdateMomentDto {
  status?: MomentStatus;
  participantId?: string;
  completedAt?: Date;
  expiresAt?: Date;
  combinedImagePath?: string;
  capturedBy?: string;
}

// Tipi per la gestione degli stati
export interface MomentStateTransition {
  from: MomentStatus;
  to: MomentStatus;
  userId: string;
  timestamp: Date;
  action: 'create' | 'capture' | 'complete' | 'expire';
}

// Interfacce per le query
export interface MemoryFilters {
  coupleId: string;
  authorId?: string;
  category?: MemoryCategory;
  mood?: MemoryMood;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  withImages?: boolean;
  withMoments?: boolean;
  limit?: number;
  offset?: number;
}

export interface MomentFilters {
  coupleId: string;
  status?: MomentStatus;
  initiatorId?: string;
  participantId?: string;
  memoryId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Costanti per la validazione
export const MEMORY_VALIDATION = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  LOCATION_MAX_LENGTH: 200,
  MAX_IMAGES_PER_MEMORY: 20,
  MAX_MOMENTS_PER_MEMORY: 10
} as const;

export const MOMENT_VALIDATION = {
  DEFAULT_EXPIRY_HOURS: 24,
  MAX_EXPIRY_HOURS: 72,
  MAX_ACTIVE_MOMENTS_PER_COUPLE: 5,
  MAX_MOMENTS_PER_MEMORY: 10
} as const; 