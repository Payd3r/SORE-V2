const DB_NAME = 'SORE-V2-DB';
const DB_VERSION = 1;
const MOMENTO_STORE = 'momento-sync';

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(MOMENTO_STORE)) {
        db.createObjectStore(MOMENTO_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function addToSyncQueue(data: any) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(MOMENTO_STORE, 'readwrite');
    const store = transaction.objectStore(MOMENTO_STORE);
    const request = store.add(data);

    request.onsuccess = () => resolve();
    request.onerror = () => {
        console.error('Error adding to sync queue:', request.error);
        reject('Error adding to sync queue');
    };
  });
}

export async function getSyncQueue(): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MOMENTO_STORE, 'readonly');
        const store = transaction.objectStore(MOMENTO_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error('Error getting sync queue:', request.error);
            reject('Error getting sync queue');
        };
    });
}

export async function clearSyncQueue() {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(MOMENTO_STORE, 'readwrite');
        const store = transaction.objectStore(MOMENTO_STORE);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error clearing sync queue:', request.error);
            reject('Error clearing sync queue');
        };
    });
} 