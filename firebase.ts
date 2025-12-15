// Firebase Firestore implementation - WORKHUB data storage
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { TableDefinition, BookmarkGroup, CustomFilter, CategoryGroup } from './types';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Constants
const USER_DOC = 'anonymous_user';
const COLLECTIONS = {
  TABLES: 'tables',
  BOOKMARKS: 'bookmarks',
  CATEGORIES: 'categories',
  FILTERS: 'filters',
};

/**
 * Ensure user is authenticated with Firebase (anonymous)
 */
export const ensureAuth = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log('Anonymous user authenticated');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

/**
 * Initialize database connection
 */
export const initDB = async (): Promise<void> => {
  try {
    await ensureAuth();
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
};

/**
 * Save tables to Firestore
 */
export const saveTables = async (tables: TableDefinition[]): Promise<void> => {
  try {
    await ensureAuth();

    // 안전장치: 빈 배열 저장 방지 (데이터 손실 방지)
    if (tables.length === 0) {
      console.warn('[SAFETY] Attempted to save empty tables array - skipping to prevent data loss');
      return;
    }

    const batch = writeBatch(db);
    const collectionRef = collection(db, `users/${USER_DOC}/${COLLECTIONS.TABLES}`);

    // Delete existing documents
    const existingDocs = await getDocs(collectionRef);
    existingDocs.forEach((document) => {
      batch.delete(document.ref);
    });

    // Add new documents
    tables.forEach((table) => {
      const docRef = doc(collectionRef, table.id);
      batch.set(docRef, table);
    });

    await batch.commit();
    console.log(`[Firebase] Tables saved successfully: ${tables.length} items`);
  } catch (error) {
    console.error('Failed to save tables:', error);
    throw error;
  }
};

/**
 * Load tables from Firestore
 */
export const loadTables = async (): Promise<TableDefinition[]> => {
  try {
    await ensureAuth();
    const collectionRef = collection(db, `users/${USER_DOC}/${COLLECTIONS.TABLES}`);
    const querySnapshot = await getDocs(collectionRef);
    const tables = querySnapshot.docs.map((document) => document.data() as TableDefinition);
    console.log(`Loaded ${tables.length} tables`);
    return tables;
  } catch (error) {
    console.error('Failed to load tables:', error);
    return [];
  }
};

/**
 * Save bookmarks to Firestore
 */
export const saveBookmarks = async (bookmarks: BookmarkGroup[]): Promise<void> => {
  try {
    await ensureAuth();

    // 안전장치: 빈 배열 저장 방지 (데이터 손실 방지)
    if (bookmarks.length === 0) {
      console.warn('[SAFETY] Attempted to save empty bookmarks array - skipping to prevent data loss');
      return;
    }

    const batch = writeBatch(db);
    const collectionRef = collection(db, `users/${USER_DOC}/${COLLECTIONS.BOOKMARKS}`);

    // Delete existing documents
    const existingDocs = await getDocs(collectionRef);
    existingDocs.forEach((document) => {
      batch.delete(document.ref);
    });

    // Add new documents
    bookmarks.forEach((bookmark) => {
      const docRef = doc(collectionRef, bookmark.id);
      batch.set(docRef, bookmark);
    });

    await batch.commit();
    console.log(`[Firebase] Bookmarks saved successfully: ${bookmarks.length} items`);
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
    throw error;
  }
};

/**
 * Load bookmarks from Firestore
 */
export const loadBookmarks = async (): Promise<BookmarkGroup[]> => {
  try {
    await ensureAuth();
    const collectionRef = collection(db, `users/${USER_DOC}/${COLLECTIONS.BOOKMARKS}`);
    const querySnapshot = await getDocs(collectionRef);
    const bookmarks = querySnapshot.docs.map((document) => document.data() as BookmarkGroup);
    console.log(`Loaded ${bookmarks.length} bookmark groups`);
    return bookmarks;
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    return [];
  }
};

/**
 * Save filters to Firestore
 */
export const saveFilters = async (filters: CustomFilter[]): Promise<void> => {
  try {
    await ensureAuth();

    // 안전장치: 빈 배열 저장 방지 (데이터 손실 방지)
    if (filters.length === 0) {
      console.warn('[SAFETY] Attempted to save empty filters array - skipping to prevent data loss');
      return;
    }

    const batch = writeBatch(db);
    const collectionRef = collection(db, `users/${USER_DOC}/${COLLECTIONS.FILTERS}`);

    // Delete existing documents
    const existingDocs = await getDocs(collectionRef);
    existingDocs.forEach((document) => {
      batch.delete(document.ref);
    });

    // Add new documents
    filters.forEach((filter) => {
      const docRef = doc(collectionRef, filter.id);
      batch.set(docRef, filter);
    });

    await batch.commit();
    console.log(`[Firebase] Filters saved successfully: ${filters.length} items`);
  } catch (error) {
    console.error('Failed to save filters:', error);
    throw error;
  }
};

/**
 * Load filters from Firestore
 */
export const loadFilters = async (): Promise<CustomFilter[]> => {
  try {
    await ensureAuth();
    const collectionRef = collection(db, `users/${USER_DOC}/${COLLECTIONS.FILTERS}`);
    const querySnapshot = await getDocs(collectionRef);
    const filters = querySnapshot.docs.map((document) => document.data() as CustomFilter);
    console.log(`Loaded ${filters.length} filters`);
    return filters;
  } catch (error) {
    console.error('Failed to load filters:', error);
    return [];
  }
};

/**
 * Load all data from Firestore in parallel
 */
export const loadAllData = async () => {
  try {
    const [tables, bookmarks, filters, categories] = await Promise.all([
      loadTables(),
      loadBookmarks(),
      loadFilters(),
      loadCategories(),
    ]);

    console.log('All data loaded successfully');
    return { tables, bookmarks, filters, categories };
  } catch (error) {
    console.error('Failed to load all data:', error);
    return { tables: [], bookmarks: [], filters: [], categories: [] };
  }
};

/**
 * Migrate table name from '오늘기록' to 'TODAY'
 */
export const migrateTableNameToTODAY = async (): Promise<void> => {
  try {
    await ensureAuth();
    const collectionRef = collection(db, `users/${USER_DOC}/${COLLECTIONS.TABLES}`);
    const querySnapshot = await getDocs(collectionRef);
    const batch = writeBatch(db);
    let hasChanges = false;

    console.log(`[MIGRATION] Found ${querySnapshot.docs.length} tables`);

    querySnapshot.docs.forEach((document) => {
      const table = document.data() as TableDefinition;
      console.log(`[MIGRATION] Table: "${table.name}" (ID: ${table.id})`);

      if (table.name === '오늘기록') {
        batch.update(document.ref, { name: 'TODAY' });
        console.log(`[MIGRATION] ✓ Updating table: ${table.id} from '오늘기록' to 'TODAY'`);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await batch.commit();
      console.log('[MIGRATION] ✓ Table name migration completed');
    } else {
      console.log('[MIGRATION] No tables to migrate');
    }
  } catch (error) {
    console.error('[MIGRATION] Failed to migrate table names:', error);
    throw error;
  }
};

/**
 * Save categories to Firestore
 */
export const saveCategories = async (categories: CategoryGroup[]): Promise<void> => {
  try {
    await ensureAuth();

    // 안전장치: 빈 배열 저장 방지 (데이터 손실 방지)
    if (categories.length === 0) {
      console.warn('[SAFETY] Attempted to save empty categories array - skipping to prevent data loss');
      return;
    }

    const batch = writeBatch(db);
    const collectionRef = collection(db, `users/${USER_DOC}/${COLLECTIONS.CATEGORIES}`);

    // Delete existing documents
    const existingDocs = await getDocs(collectionRef);
    existingDocs.forEach((document) => {
      batch.delete(document.ref);
    });

    // Add new documents
    categories.forEach((category) => {
      const docRef = doc(collectionRef, category.id);
      batch.set(docRef, category);
    });

    await batch.commit();
    console.log(`[Firebase] Categories saved successfully: ${categories.length} items`);
  } catch (error) {
    console.error('Failed to save categories:', error);
    throw error;
  }
};

/**
 * Load categories from Firestore
 */
export const loadCategories = async (): Promise<CategoryGroup[]> => {
  try {
    await ensureAuth();
    const collectionRef = collection(db, `users/${USER_DOC}/${COLLECTIONS.CATEGORIES}`);
    const querySnapshot = await getDocs(collectionRef);
    const categories = querySnapshot.docs.map((document) => document.data() as CategoryGroup);
    console.log(`Loaded ${categories.length} category groups`);
    return categories;
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [];
  }
};

/**
 * Clear all data from Firestore (for development/reset)
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    await ensureAuth();
    const stores = Object.values(COLLECTIONS);

    for (const storeName of stores) {
      const collectionRef = collection(db, `users/${USER_DOC}/${storeName}`);
      const querySnapshot = await getDocs(collectionRef);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });

      await batch.commit();
      console.log(`Cleared ${storeName} collection`);
    }
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
};
