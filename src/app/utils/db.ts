import { openDB } from 'idb';

const DB_NAME = 'SmritiSetu-DB';
const STORE_NAME = 'game-sessions';

export interface GameSession {
  id?: number;
  game: string;
  matches: number;
  timeSpent: number;
  langUsed: string;
  accuracy: number;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export async function initDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('syncStatus', 'syncStatus');
        store.createIndex('timestamp', 'timestamp');
      } else {
        // Upgrade from v1 to v2 if needed (e.g. changing 'synced' to 'syncStatus')
        const store = transaction.objectStore(STORE_NAME);
        if (!store.indexNames.contains('syncStatus')) {
           store.createIndex('syncStatus', 'syncStatus');
        }
        if (!store.indexNames.contains('timestamp')) {
           store.createIndex('timestamp', 'timestamp');
        }
      }
    },
  });
}

export async function saveSessionLocally(data: Omit<GameSession, 'timestamp' | 'syncStatus'>) {
  const db = await initDB();
  await db.add(STORE_NAME, { ...data, timestamp: Date.now(), syncStatus: 'pending' });
}

export async function getPendingSessions(): Promise<GameSession[]> {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'syncStatus', 'pending');
}

export async function getAllSessions(): Promise<GameSession[]> {
  const db = await initDB();
  const all = await db.getAll(STORE_NAME);
  return all.sort((a, b) => a.timestamp - b.timestamp);
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
    } catch (error) {
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
