import { LessonPage } from '../types/lesson';

const DB_NAME = 'StartupA1AudioLabDB';
const DB_VERSION = 1;
const STORE_PDF = 'pdf_documents';
const STORE_PAGES = 'generated_pages';

export interface StoredPdfMeta {
  id: string;
  name: string;
  size: number;
  totalPages: number;
  lastPage: number;
  uploadedAt: number;
  pdfBlob?: Blob;
  pdfData?: ArrayBuffer;
}

class DbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB non supportato'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_PDF)) {
          db.createObjectStore(STORE_PDF, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PAGES)) {
          db.createObjectStore(STORE_PAGES, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // 1. Save uploaded PDF ArrayBuffer and meta
  async savePdf(meta: StoredPdfMeta): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDF, 'readwrite');
      const store = tx.objectStore(STORE_PDF);
      const req = store.put(meta);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // 2. Load all stored PDFs (Multi-Book Library)
  async getAllPdfs(): Promise<StoredPdfMeta[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDF, 'readonly');
      const store = tx.objectStore(STORE_PDF);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // 3. Load specific stored PDF by ID
  async getPdf(id = 'main_textbook'): Promise<StoredPdfMeta | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDF, 'readonly');
      const store = tx.objectStore(STORE_PDF);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  // 3. Update last visited page
  async updateLastPage(id = 'main_textbook', pageNumber: number): Promise<void> {
    const doc = await this.getPdf(id);
    if (doc) {
      doc.lastPage = pageNumber;
      await this.savePdf(doc);
    }
  }

  // 4. Delete PDF
  async deletePdf(id = 'main_textbook'): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDF, 'readwrite');
      const store = tx.objectStore(STORE_PDF);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // 5. Save generated LessonPage
  async saveGeneratedPage(page: LessonPage): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAGES, 'readwrite');
      const store = tx.objectStore(STORE_PAGES);
      const req = store.put(page);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // 6. Get all generated lesson pages
  async getAllGeneratedPages(): Promise<LessonPage[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAGES, 'readonly');
      const store = tx.objectStore(STORE_PAGES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // 7. Get generated page by ID
  async getGeneratedPage(id: string): Promise<LessonPage | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAGES, 'readonly');
      const store = tx.objectStore(STORE_PAGES);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  // 8. Delete a generated page
  async deleteGeneratedPage(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAGES, 'readwrite');
      const store = tx.objectStore(STORE_PAGES);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const dbService = new DbService();
