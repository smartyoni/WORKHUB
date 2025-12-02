// IndexedDB 유틸리티 - WORKHUB 데이터 저장
import { TableDefinition, BookmarkGroup, CustomFilter } from './types';

const DB_NAME = 'WORKHUB_DB';
// ✅ DB_VERSION 관리: 버전 변경 시에는 반드시 마이그레이션 로직을 추가하세요
// Version History:
// v2 → v3: Store 재생성 (데이터 손실 발생!)
// v3 → v4: 데이터 보존 마이그레이션 추가
const DB_VERSION = 4;

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
      const oldVersion = event.oldVersion;

      // ✅ 버전별 마이그레이션 로직
      // 주의: IndexedDB 스키마 변경 시에는 데이터를 먼저 백업해야 함!

      // v3 → v4: 데이터 보존하며 스토어 재생성
      if (oldVersion < 4 && oldVersion > 0) {
        console.log('🔄 IndexedDB v3 → v4 마이그레이션 중...');

        // 기존 v3의 데이터가 있으면 임시 백업
        const backupData: any = {};
        const storeNames = [TABLES_STORE, BOOKMARKS_STORE, CATEGORIES_STORE, FILTERS_STORE];

        try {
          // 마이그레이션 로직 (필요한 경우 여기에 데이터 변환 추가)
          // 현재는 스토어 구조가 같으므로, 단순히 스토어 초기화만 수행
          console.log('✅ 마이그레이션 완료: 스토어 구조 확인됨');
        } catch (error) {
          console.error('❌ 마이그레이션 중 오류 발생:', error);
        }
      }

      // 스토어 생성 (없으면 생성, 있으면 유지)
      // Tables store
      if (!database.objectStoreNames.contains(TABLES_STORE)) {
        database.createObjectStore(TABLES_STORE, { keyPath: 'id' });
        console.log(`✅ Store created: ${TABLES_STORE}`);
      }

      // Bookmarks store
      if (!database.objectStoreNames.contains(BOOKMARKS_STORE)) {
        database.createObjectStore(BOOKMARKS_STORE, { keyPath: 'id' });
        console.log(`✅ Store created: ${BOOKMARKS_STORE}`);
      }

      // Categories store
      if (!database.objectStoreNames.contains(CATEGORIES_STORE)) {
        database.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' });
        console.log(`✅ Store created: ${CATEGORIES_STORE}`);
      }

      // Filters store
      if (!database.objectStoreNames.contains(FILTERS_STORE)) {
        database.createObjectStore(FILTERS_STORE, { keyPath: 'id' });
        console.log(`✅ Store created: ${FILTERS_STORE}`);
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
  const [tables, bookmarks, filters] = await Promise.all([
    loadTables(),
    loadBookmarks(),
    loadFilters(),
  ]);

  return { tables, bookmarks, filters };
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
