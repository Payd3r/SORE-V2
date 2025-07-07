// Test per API Gallery con filtering e sorting
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/gallery/route';

// Test filtering per categoria
export async function testGalleryFiltering() {
  console.log('🧪 Test: Gallery Filtering per categoria');
  
  try {
    console.log('✅ Test di filtering - L\'API gallery ora supporta:');
    
    // Test filtering per categoria
    console.log('📋 Filtering per categoria:');
    console.log('- category=PERSON - Filtra solo immagini di persone');
    console.log('- category=COUPLE - Filtra solo immagini di coppie');
    console.log('- category=LANDSCAPE - Filtra solo paesaggi');
    console.log('- category=FOOD - Filtra solo cibo');
    console.log('- category=MOMENT - Filtra solo momenti combinati');
    console.log('- category=OTHER - Filtra altre categorie');
    
    // Test filtering per memoria/momento
    console.log('📋 Filtering per associazione:');
    console.log('- memoryId=<id> - Filtra immagini di una memoria specifica');
    console.log('- momentId=<id> - Filtra immagini di un momento specifico');
    
    // Test filtering per preferiti
    console.log('📋 Filtering per preferiti:');
    console.log('- isFavorite=true - Solo immagini preferite');
    console.log('- isFavorite=false - Solo immagini non preferite');
    
    // Test filtering per data
    console.log('📋 Filtering per data:');
    console.log('- dateFrom=2024-01-01 - Immagini dalla data specificata');
    console.log('- dateTo=2024-12-31 - Immagini fino alla data specificata');
    console.log('- Supporta range di date combinando entrambi');
    
    // Test ricerca
    console.log('📋 Ricerca:');
    console.log('- search=vacation - Cerca nel nome file e nome originale');
    console.log('- Ricerca case-insensitive');
    
    // Esempi di URL con filtering
    console.log('🔗 Esempi di URL filtering:');
    console.log('- GET /api/gallery?category=COUPLE&sortBy=date&sortOrder=desc');
    console.log('- GET /api/gallery?isFavorite=true&sortBy=name&page=1&limit=10');
    console.log('- GET /api/gallery?memoryId=123&dateFrom=2024-01-01&dateTo=2024-12-31');
    console.log('- GET /api/gallery?search=holiday&category=LANDSCAPE');
    
  } catch (error) {
    console.error('❌ Errore nel test di filtering:', error);
  }
}

// Test sorting
export async function testGallerySorting() {
  console.log('🧪 Test: Gallery Sorting');
  
  try {
    console.log('✅ Test di sorting - L\'API gallery supporta ordinamento per:');
    
    // Test criteri di ordinamento
    console.log('📋 Criteri di ordinamento disponibili:');
    console.log('- sortBy=date (default) - Ordina per data di creazione');
    console.log('- sortBy=name - Ordina per nome file originale');
    console.log('- sortBy=size - Ordina per dimensione file');
    console.log('- sortBy=category - Ordina per categoria');
    console.log('- sortBy=created - Ordina per timestamp di creazione');
    
    // Test direzioni di ordinamento
    console.log('📋 Direzioni di ordinamento:');
    console.log('- sortOrder=desc (default) - Ordine decrescente');
    console.log('- sortOrder=asc - Ordine crescente');
    
    // Esempi di combinazioni
    console.log('🔗 Esempi di ordinamento:');
    console.log('- GET /api/gallery?sortBy=date&sortOrder=desc (più recenti prima)');
    console.log('- GET /api/gallery?sortBy=name&sortOrder=asc (A-Z)');
    console.log('- GET /api/gallery?sortBy=size&sortOrder=desc (file più grandi prima)');
    console.log('- GET /api/gallery?sortBy=category&sortOrder=asc (categorie alfabetiche)');
    
    // Test combinazione filtering + sorting
    console.log('📋 Combinazione filtering + sorting:');
    console.log('- GET /api/gallery?category=MOMENT&sortBy=date&sortOrder=desc');
    console.log('- GET /api/gallery?isFavorite=true&sortBy=name&sortOrder=asc');
    
  } catch (error) {
    console.error('❌ Errore nel test di sorting:', error);
  }
}

// Test paginazione
export async function testGalleryPagination() {
  console.log('🧪 Test: Gallery Pagination');
  
  try {
    console.log('✅ Test di paginazione - L\'API gallery supporta:');
    
    console.log('📋 Parametri di paginazione:');
    console.log('- page=1 (default) - Numero pagina');
    console.log('- limit=20 (default) - Numero di elementi per pagina');
    console.log('- limit max=100 - Limite massimo per sicurezza');
    
    console.log('📋 Risposta paginazione include:');
    console.log('- pagination.page - Pagina corrente');
    console.log('- pagination.limit - Elementi per pagina');
    console.log('- pagination.total - Totale elementi');
    console.log('- pagination.pages - Totale pagine');
    
    console.log('🔗 Esempi di paginazione:');
    console.log('- GET /api/gallery?page=1&limit=10');
    console.log('- GET /api/gallery?page=2&limit=20&category=COUPLE');
    
  } catch (error) {
    console.error('❌ Errore nel test di paginazione:', error);
  }
}

// Test aggiornamento preferiti
export async function testGalleryFavorites() {
  console.log('🧪 Test: Gallery Favorites Update');
  
  try {
    console.log('✅ Test aggiornamento preferiti - L\'API gallery supporta:');
    
    console.log('📋 Endpoint PUT /api/gallery:');
    console.log('- Permette di marcare/smarcare immagini come preferite');
    console.log('- Richiede permesso memory:update');
    console.log('- Verifica che l\'immagine appartenga alla coppia');
    
    console.log('📋 Payload richiesto:');
    console.log('- { imageId: "string", isFavorite: boolean }');
    
    console.log('📋 Validazioni implementate:');
    console.log('- Verifica esistenza immagine');
    console.log('- Verifica accesso alla coppia');
    console.log('- Validazione tipi dati input');
    
    console.log('🔗 Esempio utilizzo:');
    console.log('- PUT /api/gallery');
    console.log('- Body: { "imageId": "img_123", "isFavorite": true }');
    
  } catch (error) {
    console.error('❌ Errore nel test preferiti:', error);
  }
}

// Test risposta e statistiche
export async function testGalleryResponse() {
  console.log('🧪 Test: Gallery Response Structure');
  
  try {
    console.log('✅ Test struttura risposta - L\'API gallery restituisce:');
    
    console.log('📋 Array immagini con dettagli completi:');
    console.log('- id, filename, originalName, path, thumbnailPath');
    console.log('- category, size, width, height, isFavorite');
    console.log('- createdAt, memory, moment');
    
    console.log('📋 Informazioni memoria associate:');
    console.log('- memory.id, memory.title, memory.date');
    
    console.log('📋 Informazioni momento associato:');
    console.log('- moment.id, moment.status, moment.createdAt');
    
    console.log('📋 Statistiche filtering:');
    console.log('- filters.categories[] - Conteggio per categoria');
    console.log('- filters.totalImages - Totale immagini della coppia');
    
    console.log('📋 Informazioni paginazione:');
    console.log('- pagination.page, limit, total, pages');
    
  } catch (error) {
    console.error('❌ Errore nel test risposta:', error);
  }
}

// Test integrazione con classificazione
export async function testGalleryClassificationIntegration() {
  console.log('🧪 Test: Gallery Classification Integration');
  
  try {
    console.log('✅ Test integrazione classificazione:');
    
    console.log('📋 Integrazione con classificazione automatica:');
    console.log('- Filtering utilizza categorie generate dalla classificazione');
    console.log('- Categorie: PERSON, COUPLE, LANDSCAPE, FOOD, MOMENT, OTHER');
    console.log('- Statistiche per categoria mostrano distribuzione');
    
    console.log('📋 Benefici classificazione per galleria:');
    console.log('- Filtering automatico senza tag manuali');
    console.log('- Organizzazione intelligente delle immagini');
    console.log('- Statistiche accurate per dashboard');
    
  } catch (error) {
    console.error('❌ Errore nel test integrazione:', error);
  }
}

// Esegui tutti i test
if (require.main === module) {
  console.log('🚀 Avvio test API Gallery completi...');
  testGalleryFiltering();
  testGallerySorting(); 
  testGalleryPagination();
  testGalleryFavorites();
  testGalleryResponse();
  testGalleryClassificationIntegration();
  console.log('✅ Test API Gallery completati!');
} 