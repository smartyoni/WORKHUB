// IndexedDB 유틸리티 - WORKHUB 데이터 저장
import { TableDefinition, BookmarkGroup, AppCategory, CustomFilter } from './types';

const DB_NAME = 'WORKHUB_DB';
const DB_VERSION = 3;

// Store names
const TABLES_STORE = 'tables';
const BOOKMARKS_STORE = 'bookmarks';
const CATEGORIES_STORE = 'categories';
const FILTERS_STORE = 'filters';

let db: IDBDatabase | null = null;

/**
 * IndexedDB 초기화
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Tables store
      if (!database.objectStoreNames.contains(TABLES_STORE)) {
        database.createObjectStore(TABLES_STORE, { keyPath: 'id' });
      }

      // Bookmarks store
      if (!database.objectStoreNames.contains(BOOKMARKS_STORE)) {
        database.createObjectStore(BOOKMARKS_STORE, { keyPath: 'id' });
      }

      // Categories store
      if (!database.objectStoreNames.contains(CATEGORIES_STORE)) {
        database.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' });
      }

      // Filters store
      if (!database.objectStoreNames.contains(FILTERS_STORE)) {
        database.createObjectStore(FILTERS_STORE, { keyPath: 'id' });
      }
    };
  });
};

/**
 * 테이블 저장
 */
export const saveTables = async (tables: TableDefinition[]): Promise<void> => {
  const database = db || (await initDB());
  const transaction = database.transaction([TABLES_STORE], 'readwrite');
  const store = transaction.objectStore(TABLES_STORE);

  // 기존 데이터 삭제
  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  // 배열 전체를 하나의 항목으로 저장 (순서 보장)
  await new Promise<void>((resolve, reject) => {
    const putRequest = store.put({ id: 'tables', data: tables });
    putRequest.onsuccess = () => resolve();
    putRequest.onerror = () => reject(putRequest.error);
  });
};

/**
 * 테이블 로드
 */
export const loadTables = async (): Promise<TableDefinition[]> => {
  const database = db || (await initDB());
  const transaction = database.transaction([TABLES_STORE], 'readonly');
  const store = transaction.objectStore(TABLES_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get('tables');
    request.onsuccess = () => {
      const result = request.result;
      resolve(result?.data || []);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * 북마크 저장
 */
export const saveBookmarks = async (bookmarks: BookmarkGroup[]): Promise<void> => {
  const database = db || (await initDB());
  const transaction = database.transaction([BOOKMARKS_STORE], 'readwrite');
  const store = transaction.objectStore(BOOKMARKS_STORE);

  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  for (const bookmark of bookmarks) {
    await new Promise<void>((resolve, reject) => {
      const addRequest = store.add(bookmark);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }
};

/**
 * 북마크 로드
 */
export const loadBookmarks = async (): Promise<BookmarkGroup[]> => {
  const database = db || (await initDB());
  const transaction = database.transaction([BOOKMARKS_STORE], 'readonly');
  const store = transaction.objectStore(BOOKMARKS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 카테고리 저장
 */
export const saveCategories = async (categories: AppCategory[]): Promise<void> => {
  const database = db || (await initDB());
  const transaction = database.transaction([CATEGORIES_STORE], 'readwrite');
  const store = transaction.objectStore(CATEGORIES_STORE);

  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  for (const category of categories) {
    await new Promise<void>((resolve, reject) => {
      const addRequest = store.add(category);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }
};

/**
 * 카테고리 로드
 */
export const loadCategories = async (): Promise<AppCategory[]> => {
  const database = db || (await initDB());
  const transaction = database.transaction([CATEGORIES_STORE], 'readonly');
  const store = transaction.objectStore(CATEGORIES_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 필터 저장
 */
export const saveFilters = async (filters: CustomFilter[]): Promise<void> => {
  const database = db || (await initDB());
  const transaction = database.transaction([FILTERS_STORE], 'readwrite');
  const store = transaction.objectStore(FILTERS_STORE);

  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  for (const filter of filters) {
    await new Promise<void>((resolve, reject) => {
      const addRequest = store.add(filter);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }
};

/**
 * 필터 로드
 */
export const loadFilters = async (): Promise<CustomFilter[]> => {
  const database = db || (await initDB());
  const transaction = database.transaction([FILTERS_STORE], 'readonly');
  const store = transaction.objectStore(FILTERS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 모든 데이터 로드
 */
export const loadAllData = async () => {
  const [tables, bookmarks, categories, filters] = await Promise.all([
    loadTables(),
    loadBookmarks(),
    loadCategories(),
    loadFilters(),
  ]);

  return { tables, bookmarks, categories, filters };
};

/**
 * 데이터베이스 초기화 (개발용)
 */
export const clearDatabase = async (): Promise<void> => {
  const database = db || (await initDB());
  const stores = [TABLES_STORE, BOOKMARKS_STORE, CATEGORIES_STORE, FILTERS_STORE];

  for (const storeName of stores) {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }
};
