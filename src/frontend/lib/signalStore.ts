import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'agroecotopia_signal_store';
const DB_VERSION = 1;

export class SignalStore {
  private dbPromises: { [key: string]: Promise<IDBPDatabase> } = {};
  private userId: string = 'anonymous';

  constructor() {}

  setUserId(userId: string) {
    this.userId = userId;
  }

  getUserId(): string {
    return this.userId;
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not available on the server'));
    }

    const scopedDbName = `${DB_NAME}_${this.userId}`;

    if (!this.dbPromises[scopedDbName]) {
      this.dbPromises[scopedDbName] = openDB(scopedDbName, DB_VERSION, {
        upgrade(db) {
          db.createObjectStore('identity');
          db.createObjectStore('sessions');
          db.createObjectStore('preKeys');
          db.createObjectStore('signedPreKeys');
        },
      });
    }
    return this.dbPromises[scopedDbName];
  }

  async getIdentity(): Promise<{ registrationId: number; keyPair: any } | null> {
    const db = await this.getDB();
    const registrationId = await db.get('identity', 'registrationId');
    const keyPair = await db.get('identity', 'keyPair');
    if (!registrationId || !keyPair) return null;
    return { registrationId, keyPair };
  }

  async saveIdentity(registrationId: number, keyPair: any) {
    const db = await this.getDB();
    await db.put('identity', registrationId, 'registrationId');
    await db.put('identity', keyPair, 'keyPair');
  }

  async loadSession(address: string): Promise<Uint8Array | null> {
    const db = await this.getDB();
    return db.get('sessions', address) || null;
  }

  async storeSession(address: string, record: Uint8Array) {
    const db = await this.getDB();
    await db.put('sessions', record, address);
  }

  async removeSession(address: string) {
    const db = await this.getDB();
    await db.delete('sessions', address);
  }

  async loadPreKey(keyId: number): Promise<Uint8Array | null> {
    const db = await this.getDB();
    return db.get('preKeys', keyId) || null;
  }

  async storePreKey(keyId: number, record: Uint8Array) {
    const db = await this.getDB();
    await db.put('preKeys', record, keyId);
  }

  async removePreKey(keyId: number) {
    const db = await this.getDB();
    await db.delete('preKeys', keyId);
  }

  async loadSignedPreKey(keyId: number): Promise<Uint8Array | null> {
    const db = await this.getDB();
    return db.get('signedPreKeys', keyId) || null;
  }

  async storeSignedPreKey(keyId: number, record: Uint8Array) {
    const db = await this.getDB();
    await db.put('signedPreKeys', record, keyId);
  }
}

// Singleton instance
export const signalStore = new SignalStore();
