import { useEffect } from 'react';
import { TableDefinition, BookmarkGroup, CustomFilter, CategoryGroup } from '../types';
import { saveBookmarks, saveFilters, saveTables as saveTablesFirebase, saveCategories } from '../firebase';
import { saveSearchHistoryToLocalStorage } from '../utils/searchHelpers';

/**
 * useAutoSave
 * Automatically saves data to Firebase when it changes
 * Only saves when dataSource is 'loaded' to prevent saving initial values
 */
export const useAutoSave = (
  isDBLoaded: boolean,
  dataSource: 'initial' | 'loaded',
  tables: TableDefinition[],
  bookmarks: BookmarkGroup[],
  customFilters: CustomFilter[],
  categories: CategoryGroup[],
  searchHistory: Record<string, string[]>
) => {
  // Save tables to Firebase whenever they change
  useEffect(() => {
    if (isDBLoaded && tables.length > 0 && dataSource === 'loaded') {
      saveTablesFirebase(tables).catch(error => console.error('Failed to save tables to Firebase:', error));
    }
  }, [tables, isDBLoaded, dataSource]);

  // Save bookmarks to Firebase whenever they change
  useEffect(() => {
    if (isDBLoaded && bookmarks.length > 0 && dataSource === 'loaded') {
      saveBookmarks(bookmarks).catch(error => console.error('Failed to save bookmarks to Firebase:', error));
    }
  }, [bookmarks, isDBLoaded, dataSource]);

  // Save filters to Firebase whenever they change
  useEffect(() => {
    if (isDBLoaded && dataSource === 'loaded') {
      saveFilters(customFilters).catch(error => console.error('Failed to save filters to Firebase:', error));
    }
  }, [customFilters, isDBLoaded, dataSource]);

  // Save categories to Firebase whenever they change
  useEffect(() => {
    if (isDBLoaded && dataSource === 'loaded') {
      saveCategories(categories).catch(error => console.error('Failed to save categories to Firebase:', error));
    }
  }, [categories, isDBLoaded, dataSource]);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    if (dataSource === 'loaded' && Object.keys(searchHistory).length > 0) {
      saveSearchHistoryToLocalStorage(searchHistory);
    }
  }, [searchHistory, dataSource]);
};
