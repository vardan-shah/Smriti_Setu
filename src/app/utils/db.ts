import { openDB } from 'idb';

const DB_NAME = 'SmritiSetu-DB';
const STORE_NAME = 'game-sessions';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('synced', 'synced');
      }
    },
  });
}

export async function saveSessionLocally(data: any) {
  const db = await initDB();
  await db.add(STORE_NAME, { ...data, timestamp: Date.now(), synced: 0 }); // 0 for false, 1 for true
}

export async function getUnsyncedSessions() {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'synced', 0);
}

export async function markAsSynced(ids: number[]) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const id of ids) {
    const item = await tx.store.get(id);
    if (item) {
      item.synced = 1;
      await tx.store.put(item);
    }
  }
  await tx.done;
}
