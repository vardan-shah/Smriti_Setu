import { openDB } from 'idb';
import { deriveKey, encryptData, decryptData } from './crypto';

const DB_NAME = 'SmritiSetu-DB';
const STORE_NAME = 'game-sessions';
const MEMORIES_STORE = 'memories';

export interface FamilyMemory {
  id?: number;
  name: string;
  image: string; // Base64 data URL
  timestamp: number;
}

export interface GameSession {
  encryptedData?: string;
  iv?: string;
  id?: number;
  game: string;
  matches: number;
  timeSpent: number;
  langUsed: string;
  accuracy: number;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  biomarkers?: {
    avgReactionTimeMs: number;
    hesitationMs: number;
    memoryLapses: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

export async function initDB() {
  return openDB(DB_NAME, 3, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('syncStatus', 'syncStatus');
        store.createIndex('timestamp', 'timestamp');
      } else {
        const store = transaction.objectStore(STORE_NAME);
        if (!store.indexNames.contains('syncStatus')) store.createIndex('syncStatus', 'syncStatus');
        if (!store.indexNames.contains('timestamp')) store.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
        db.createObjectStore(MEMORIES_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function saveSessionLocally(data: Omit<GameSession, 'timestamp' | 'syncStatus'>) {
  const db = await initDB();
  const pin = typeof window !== 'undefined' ? localStorage.getItem('app_pin') : null;
  const salt = typeof window !== 'undefined' ? localStorage.getItem('app_salt') : null;
  
  if (pin && salt) {
    try {
      const key = await deriveKey(pin, salt);
      const { cipherText, iv } = await encryptData(data, key);
      await db.add(STORE_NAME, { 
        encryptedData: cipherText, 
        iv, 
        timestamp: Date.now(), 
        syncStatus: 'pending' 
      });
      return;
    } catch (e) {
      console.error('Encryption failed', e);
    }
  }
  
  await db.add(STORE_NAME, { ...data, timestamp: Date.now(), syncStatus: 'pending' });
}


async function decryptSessionRecord(item: unknown): Promise<GameSession | null> {
  const record = item as { encryptedData?: string; iv?: string; id?: number; timestamp?: number; syncStatus?: string };
  if (record.encryptedData && record.iv) {
    const pin = typeof window !== 'undefined' ? localStorage.getItem('app_pin') : null;
    const salt = typeof window !== 'undefined' ? localStorage.getItem('app_salt') : null;
    if (pin && salt) {
      try {
        const key = await deriveKey(pin, salt);
        const dec = await decryptData(record.encryptedData, record.iv, key);
        return { ...(dec as GameSession), id: record.id, timestamp: record.timestamp!, syncStatus: record.syncStatus as any };
      } catch (e) {
        return null; // Skip gracefully on decryption failure
      }
    }
    return null; // Cannot decrypt without pin
  }
  return item as GameSession; // Unencrypted fallback
}

export async function getPendingSessions(): Promise<GameSession[]> {
  const db = await initDB();
  const raw = await db.getAllFromIndex(STORE_NAME, 'syncStatus', 'pending');
  const decrypted = await Promise.all(raw.map(decryptSessionRecord));
  return decrypted.filter(Boolean) as GameSession[];
}

export async function getAllSessions(): Promise<GameSession[]> {
  const db = await initDB();
  const all = await db.getAll(STORE_NAME);
  const decrypted = await Promise.all(all.map(decryptSessionRecord));
  return (decrypted.filter(Boolean) as GameSession[]).sort((a, b) => a.timestamp - b.timestamp);
}

export async function processSyncQueue() {
  const db = await initDB();
  const pending = await getPendingSessions();
  
  if (pending.length === 0) return;

  for (const session of pending) {
    try {
      // MOCK REMOTE ENDPOINT: In a real app, this would be fetch('/api/sync', { method: 'POST', ... })
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.9) reject(new Error("Network Error"));
          else resolve(true);
        }, 500);
      });

      // Mark as synced
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const item = await tx.store.get(session.id!);
      if (item) {
        item.syncStatus = 'synced';
        await tx.store.put(item);
      }
      await tx.done;
    } catch (_) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const item = await tx.store.get(session.id!);
      if (item) {
        item.syncStatus = 'failed';
        await tx.store.put(item);
      }
      await tx.done;
    }
  }
}


export async function saveMemory(data: { name: string; image: string }) {
  const db = await initDB();
  await db.add(MEMORIES_STORE, { ...data, timestamp: Date.now() });
}

export async function getMemories(): Promise<FamilyMemory[]> {
  const db = await initDB();
  return db.getAll(MEMORIES_STORE);
}

export async function deleteMemory(id: number) {
  const db = await initDB();
  await db.delete(MEMORIES_STORE, id);
}
