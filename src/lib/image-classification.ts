import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import crypto from 'crypto';

// Definizione delle categorie di classificazione
export enum ImageCategory {
  PERSON = 'PERSON',
  COUPLE = 'COUPLE', 
  LANDSCAPE = 'LANDSCAPE',
  FOOD = 'FOOD',
  MOMENT = 'MOMENT',
  OTHER = 'OTHER'
}

// Interfaccia per i risultati della classificazione
export interface ClassificationResult {
  category: ImageCategory;
  confidence: number;
  details: {
    mobilenetPredictions?: Array<{
      className: string;
      probability: number;
    }>;
    cocoDetections?: Array<{
      class: string;
      score: number;
      bbox: number[];
    }>;
    personCount?: number;
    reasoning?: string;
  };
}

// Parole chiave per classificazione per categoria
const FOOD_KEYWORDS = [
  'pizza', 'hamburger', 'sandwich', 'pasta', 'salad', 'soup', 'bread', 
  'cake', 'chocolate', 'ice cream', 'fruit', 'apple', 'banana', 'orange',
  'meat', 'chicken', 'fish', 'vegetable', 'cheese', 'wine', 'beer',
  'coffee', 'tea', 'breakfast', 'lunch', 'dinner', 'meal', 'food',
  'cookie', 'donut', 'bagel', 'sushi', 'taco', 'burrito'
];

const LANDSCAPE_KEYWORDS = [
  'mountain', 'beach', 'ocean', 'lake', 'forest', 'tree', 'sky', 
  'sunset', 'sunrise', 'clouds', 'landscape', 'nature', 'park',
  'garden', 'field', 'river', 'bridge', 'building', 'architecture',
  'city', 'street', 'monument', 'church', 'castle', 'valley',
  'desert', 'waterfall', 'cliff', 'island', 'countryside'
];

// Funzione per calcolare hash MD5 di un'immagine
export function calculateImageHash(imageBuffer: Buffer): string {
  return crypto.createHash('md5').update(imageBuffer).digest('hex');
}

// Funzione per calcolare hash SHA256 di un'immagine (più sicuro)
export function calculateSecureImageHash(imageBuffer: Buffer): string {
  return crypto.createHash('sha256').update(imageBuffer).digest('hex');
}

// Interfaccia per risultato deduplicazione
export interface DeduplicationResult {
  isDuplicate: boolean;
  hash: string;
  existingImageId?: string;
  existingImagePath?: string;
  confidence: number;
}

// Funzione per verificare se un'immagine è duplicata
export async function checkImageDuplication(
  imageBuffer: Buffer,
  prisma: any,
  coupleId: string
): Promise<DeduplicationResult> {
  try {
    // Calcola hash dell'immagine
    const hash = calculateSecureImageHash(imageBuffer);
    
    // Cerca immagini esistenti con lo stesso hash nella coppia
    const existingImage = await prisma.image.findFirst({
      where: {
        hash: hash,
        OR: [
          { memory: { coupleId: coupleId } },
          { moment: { coupleId: coupleId } }
        ]
      },
      include: {
        memory: true,
        moment: true
      }
    });
    
    if (existingImage) {
      return {
        isDuplicate: true,
        hash: hash,
        existingImageId: existingImage.id,
        existingImagePath: existingImage.path,
        confidence: 1.0 // Hash match = 100% confidence
      };
    }
    
    return {
      isDuplicate: false,
      hash: hash,
      confidence: 0.0
    };
    
  } catch (error) {
    console.error('Errore nella verifica deduplicazione:', error);
    // In caso di errore, genera un hash di base e procedi
    const fallbackHash = calculateImageHash(imageBuffer);
    return {
      isDuplicate: false,
      hash: fallbackHash,
      confidence: 0.0
    };
  }
}

// Classe principale per la classificazione delle immagini
export class ImageClassificationService {
  private mobilenetModel: mobilenet.MobileNet | null = null;
  private cocoModel: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  // Inizializza i modelli TensorFlow.js
  async initialize(): Promise<void> {
    try {
      console.log('Inizializzazione modelli di classificazione immagini...');
      
      // Configura TensorFlow.js
      await tf.ready();
      console.log('TensorFlow.js pronto');

      // Carica MobileNet per classificazione generale
      this.mobilenetModel = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      console.log('Modello MobileNet caricato');

      // Carica COCO-SSD per rilevamento oggetti/persone
      this.cocoModel = await cocoSsd.load({
        modelUrl: 'https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1',
        base: 'mobilenet_v2'
      });
      console.log('Modello COCO-SSD caricato');

      this.isInitialized = true;
      console.log('Inizializzazione classificazione immagini completata');

    } catch (error) {
      console.error('Errore nell\'inizializzazione dei modelli:', error);
      this.isInitialized = false;
    }
  }

  // Verifica se i modelli sono pronti
  isReady(): boolean {
    return this.isInitialized && this.mobilenetModel !== null && this.cocoModel !== null;
  }

  // Classifica un'immagine da un elemento HTMLImageElement
  async classifyImage(
    imageElement: HTMLImageElement, 
    imageMetadata?: {
      width?: number;
      height?: number;
      filename?: string;
      momentId?: string;
      isCombined?: boolean;
      originalImages?: string[];
    }
  ): Promise<ClassificationResult> {
    if (!this.isReady()) {
      throw new Error('Modelli di classificazione non inizializzati');
    }

    try {
      console.log('Inizio classificazione immagine...');

      // Esegui classificazione MobileNet
      const mobilenetPredictions = await this.mobilenetModel!.classify(imageElement, 5);
      console.log('Predizioni MobileNet:', mobilenetPredictions);

      // Esegui rilevamento oggetti COCO-SSD
      const cocoDetections = await this.cocoModel!.detect(imageElement);
      console.log('Rilevamenti COCO-SSD:', cocoDetections);

      // Se i metadati non sono forniti, prova a ottenerli dall'elemento immagine
      const finalMetadata = imageMetadata || {
        width: imageElement.naturalWidth || imageElement.width,
        height: imageElement.naturalHeight || imageElement.height,
        filename: imageElement.src.split('/').pop() || ''
      };

      // Analizza i risultati e determina la categoria
      const result = this.analyzeResults(mobilenetPredictions, cocoDetections, finalMetadata);
      console.log('Risultato classificazione finale:', result);

      return result;

    } catch (error) {
      console.error('Errore nella classificazione:', error);
      return {
        category: ImageCategory.OTHER,
        confidence: 0,
        details: {
          reasoning: `Errore nella classificazione: ${error}`
        }
      };
    }
  }

  // Classifica un'immagine da un Buffer (per uso server-side)
  async classifyImageFromBuffer(
    imageBuffer: Buffer,
    imageMetadata?: {
      width?: number;
      height?: number;
      filename?: string;
      momentId?: string;
      isCombined?: boolean;
      originalImages?: string[];
      mimeType?: string;
    }
  ): Promise<ClassificationResult> {
    console.log('Classificazione server-side con analisi metadati...');
    
    try {
      // Analisi metadati per classificazione intelligente lato server
      if (imageMetadata) {
        
        // Verifica diretta per MOMENT
        if (this.isMomentImage(imageMetadata)) {
          const confidence = this.calculateMomentConfidence(imageMetadata);
          return {
            category: ImageCategory.MOMENT,
            confidence,
            details: {
              reasoning: this.getMomentReasoning(imageMetadata)
            }
          };
        }
        
        // Analisi nome file per altre categorie
        if (imageMetadata.filename) {
          const filename = imageMetadata.filename.toLowerCase();
          
          // Check per FOOD
          for (const foodKeyword of FOOD_KEYWORDS) {
            if (filename.includes(foodKeyword)) {
              return {
                category: ImageCategory.FOOD,
                confidence: 0.7,
                details: {
                  reasoning: `Filename contiene keyword cibo "${foodKeyword}" - classificata come FOOD`
                }
              };
            }
          }
          
          // Check per LANDSCAPE
          for (const landscapeKeyword of LANDSCAPE_KEYWORDS) {
            if (filename.includes(landscapeKeyword)) {
              return {
                category: ImageCategory.LANDSCAPE,
                confidence: 0.7,
                details: {
                  reasoning: `Filename contiene keyword paesaggio "${landscapeKeyword}" - classificata come LANDSCAPE`
                }
              };
            }
          }
          
          // Pattern comuni per PERSON/COUPLE
          if (filename.includes('selfie') || 
              filename.includes('portrait') || 
              filename.includes('person') ||
              filename.includes('face')) {
            return {
              category: ImageCategory.PERSON,
              confidence: 0.6,
              details: {
                reasoning: 'Filename suggerisce contenuto persona - classificata come PERSON'
              }
            };
          }
          
          if (filename.includes('couple') || 
              filename.includes('together') || 
              filename.includes('us_') ||
              filename.includes('_us')) {
            return {
              category: ImageCategory.COUPLE,
              confidence: 0.6,
              details: {
                reasoning: 'Filename suggerisce contenuto coppia - classificata come COUPLE'
              }
            };
          }
        }
        
        // Analisi aspect ratio per inferenze aggiuntive
        if (imageMetadata.width && imageMetadata.height) {
          const aspectRatio = imageMetadata.width / imageMetadata.height;
          
          // Aspect ratio molto largo/alto potrebbe indicare panorama
          if (aspectRatio > 3.0) {
            return {
              category: ImageCategory.LANDSCAPE,
              confidence: 0.5,
              details: {
                reasoning: `Aspect ratio molto largo (${aspectRatio.toFixed(2)}) suggerisce panorama - classificata come LANDSCAPE`
              }
            };
          }
          
          // Aspect ratio quadrato spesso indica ritratti social
          if (aspectRatio > 0.9 && aspectRatio < 1.1) {
            return {
              category: ImageCategory.PERSON,
              confidence: 0.4,
              details: {
                reasoning: `Aspect ratio quadrato (${aspectRatio.toFixed(2)}) suggerisce ritratto - classificata come PERSON`
              }
            };
          }
        }
      }
      
      // Fallback per classificazione base
      return {
        category: ImageCategory.OTHER,
        confidence: 0.3,
        details: {
          reasoning: 'Classificazione server-side: analisi metadati completata, nessuna categoria specifica identificata'
        }
      };
      
    } catch (error) {
      console.error('Errore nella classificazione server-side:', error);
      return {
        category: ImageCategory.OTHER,
        confidence: 0,
        details: {
          reasoning: `Errore classificazione server-side: ${error}`
        }
      };
    }
  }

  // Analizza i risultati dei modelli e determina la categoria finale
  private analyzeResults(
    mobilenetPredictions: Array<{ className: string; probability: number }>,
    cocoDetections: Array<{ class: string; score: number; bbox: number[] }>,
    imageMetadata?: {
      width?: number;
      height?: number;
      filename?: string;
      momentId?: string;
      isCombined?: boolean;
      originalImages?: string[];
    }
  ): ClassificationResult {
    
    // Conta le persone rilevate
    const personDetections = cocoDetections.filter(d => d.class === 'person' && d.score > 0.5);
    const personCount = personDetections.length;

    // Raccogli tutte le predizioni per analisi
    const allPredictions = mobilenetPredictions.map(p => p.className.toLowerCase());
    
    // Logica di classificazione

    // 1. MOMENT: Controlla se è un'immagine di momento combinato
    if (this.isMomentImage(imageMetadata, mobilenetPredictions, cocoDetections)) {
      const confidence = this.calculateMomentConfidence(imageMetadata, personDetections);
      return {
        category: ImageCategory.MOMENT,
        confidence,
        details: {
          mobilenetPredictions,
          cocoDetections,
          personCount,
          reasoning: this.getMomentReasoning(imageMetadata, personCount)
        }
      };
    }

    // 2. COUPLE: 2 o più persone rilevate (se non è un momento)
    if (personCount >= 2) {
      return {
        category: ImageCategory.COUPLE,
        confidence: Math.min(personDetections[0].score, personDetections[1].score),
        details: {
          mobilenetPredictions,
          cocoDetections,
          personCount,
          reasoning: `Rilevate ${personCount} persone - classificata come COUPLE`
        }
      };
    }

    // 3. PERSON: 1 persona rilevata
    if (personCount === 1) {
      return {
        category: ImageCategory.PERSON,
        confidence: personDetections[0].score,
        details: {
          mobilenetPredictions,
          cocoDetections,
          personCount,
          reasoning: 'Rilevata 1 persona - classificata come PERSON'
        }
      };
    }

    // 4. FOOD: check per parole chiave cibo
    for (const prediction of allPredictions) {
      for (const foodKeyword of FOOD_KEYWORDS) {
        if (prediction.includes(foodKeyword)) {
          const matchingPrediction = mobilenetPredictions.find(p => 
            p.className.toLowerCase().includes(foodKeyword)
          );
          return {
            category: ImageCategory.FOOD,
            confidence: matchingPrediction?.probability || 0.5,
            details: {
              mobilenetPredictions,
              cocoDetections,
              personCount,
              reasoning: `Keyword "${foodKeyword}" trovata - classificata come FOOD`
            }
          };
        }
      }
    }

    // 5. LANDSCAPE: check per parole chiave paesaggio
    for (const prediction of allPredictions) {
      for (const landscapeKeyword of LANDSCAPE_KEYWORDS) {
        if (prediction.includes(landscapeKeyword)) {
          const matchingPrediction = mobilenetPredictions.find(p => 
            p.className.toLowerCase().includes(landscapeKeyword)
          );
          return {
            category: ImageCategory.LANDSCAPE,
            confidence: matchingPrediction?.probability || 0.5,
            details: {
              mobilenetPredictions,
              cocoDetections,
              personCount,
              reasoning: `Keyword "${landscapeKeyword}" trovata - classificata come LANDSCAPE`
            }
          };
        }
      }
    }

    // 6. DEFAULT: OTHER
    const topPrediction = mobilenetPredictions[0];
    return {
      category: ImageCategory.OTHER,
      confidence: topPrediction?.probability || 0,
      details: {
        mobilenetPredictions,
        cocoDetections,
        personCount,
        reasoning: 'Nessuna categoria specifica riconosciuta - classificata come OTHER'
      }
    };
  }

  // Determina se un'immagine è un momento combinato
  private isMomentImage(
    metadata?: {
      width?: number;
      height?: number;
      filename?: string;
      momentId?: string;
      isCombined?: boolean;
      originalImages?: string[];
    },
    mobilenetPredictions?: Array<{ className: string; probability: number }>,
    cocoDetections?: Array<{ class: string; score: number; bbox: number[] }>
  ): boolean {
    
    // Indicatori diretti di momento
    if (metadata?.momentId) return true;
    if (metadata?.isCombined) return true;
    if (metadata?.originalImages && metadata.originalImages.length > 1) return true;
    
    // Analisi nome file per pattern di momento combinato
    if (metadata?.filename) {
      const filename = metadata.filename.toLowerCase();
      // Pattern comune per immagini combinate: combined_, moment_, merged_
      if (filename.includes('combined_') || 
          filename.includes('moment_') || 
          filename.includes('merged_') ||
          filename.includes('couple_moment_')) {
        return true;
      }
    }
    
    // Analisi dimensioni per layout combinato
    if (metadata?.width && metadata?.height) {
      const aspectRatio = metadata.width / metadata.height;
      // Aspect ratio tipico per immagini combinate side-by-side (più largo)
      if (aspectRatio > 2.5) return true;
      // Aspect ratio per immagini combinate top-bottom (più alto)
      if (aspectRatio < 0.4) return true;
    }
    
    // Analisi contenuto per indicatori di combinazione
    if (cocoDetections && cocoDetections.length > 0) {
      const personDetections = cocoDetections.filter(d => d.class === 'person');
      
      // Se ci sono 2+ persone in posizioni che suggeriscono layout combinato
      if (personDetections.length >= 2) {
        const bbox1 = personDetections[0].bbox;
        const bbox2 = personDetections[1].bbox;
        
        // Check se le persone sono chiaramente separate (side-by-side o top-bottom)
        const horizontalSeparation = Math.abs(bbox1[0] - bbox2[0]) > 200;
        const verticalSeparation = Math.abs(bbox1[1] - bbox2[1]) > 200;
        
        if (horizontalSeparation || verticalSeparation) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Calcola confidence score per classificazione MOMENT
  private calculateMomentConfidence(
    metadata?: {
      width?: number;
      height?: number;
      filename?: string;
      momentId?: string;
      isCombined?: boolean;
      originalImages?: string[];
    },
    personDetections?: Array<{ class: string; score: number; bbox: number[] }>
  ): number {
    
    let confidence = 0.5; // Base confidence
    
    // Boost per indicatori diretti
    if (metadata?.momentId) confidence += 0.4;
    if (metadata?.isCombined) confidence += 0.3;
    if (metadata?.originalImages && metadata.originalImages.length > 1) confidence += 0.2;
    
    // Boost per pattern filename
    if (metadata?.filename) {
      const filename = metadata.filename.toLowerCase();
      if (filename.includes('combined_') || filename.includes('moment_')) {
        confidence += 0.2;
      }
    }
    
    // Boost per aspect ratio appropriato
    if (metadata?.width && metadata?.height) {
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 2.5 || aspectRatio < 0.4) {
        confidence += 0.1;
      }
    }
    
    // Boost per rilevamento persone in layout appropriato
    if (personDetections && personDetections.length >= 2) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0); // Cap a 1.0
  }

  // Genera messaggio di reasoning per classificazione MOMENT
  private getMomentReasoning(
    metadata?: {
      width?: number;
      height?: number;
      filename?: string;
      momentId?: string;
      isCombined?: boolean;
      originalImages?: string[];
    },
    personCount?: number
  ): string {
    
    const reasons: string[] = [];
    
    if (metadata?.momentId) reasons.push('associata a momento nel database');
    if (metadata?.isCombined) reasons.push('marcata come immagine combinata');
    if (metadata?.originalImages?.length) reasons.push(`combinata da ${metadata.originalImages.length} immagini`);
    
    if (metadata?.filename) {
      const filename = metadata.filename.toLowerCase();
      if (filename.includes('combined_') || filename.includes('moment_')) {
        reasons.push('nome file indica momento combinato');
      }
    }
    
    if (metadata?.width && metadata?.height) {
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 2.5) reasons.push('aspect ratio indica layout side-by-side');
      if (aspectRatio < 0.4) reasons.push('aspect ratio indica layout top-bottom');
    }
    
    if (personCount && personCount >= 2) {
      reasons.push(`${personCount} persone rilevate in layout combinato`);
    }
    
    return reasons.length > 0 
      ? `Classificata come MOMENT: ${reasons.join(', ')}`
      : 'Classificata come MOMENT basato su analisi pattern';
  }

  // Utility per aggiornare la categoria di un'immagine nel database
  static mapCategoryToString(category: ImageCategory): string {
    return category.toString();
  }

  // Utility per mappare da stringa a categoria
  static mapStringToCategory(categoryString: string): ImageCategory {
    return ImageCategory[categoryString as keyof typeof ImageCategory] || ImageCategory.OTHER;
  }
}

// Istanza singleton del servizio
export const imageClassificationService = new ImageClassificationService();

// Export della funzione principale per l'uso semplificato
export async function classifyImage(
  imageElement: HTMLImageElement, 
  imageMetadata?: {
    width?: number;
    height?: number;
    filename?: string;
    momentId?: string;
    isCombined?: boolean;
    originalImages?: string[];
  }
): Promise<ClassificationResult> {
  return imageClassificationService.classifyImage(imageElement, imageMetadata);
}

export async function classifyImageFromBuffer(
  imageBuffer: Buffer,
  imageMetadata?: {
    width?: number;
    height?: number;
    filename?: string;
    momentId?: string;
    isCombined?: boolean;
    originalImages?: string[];
    mimeType?: string;
  }
): Promise<ClassificationResult> {
  return imageClassificationService.classifyImageFromBuffer(imageBuffer, imageMetadata);
} 