import { useEffect, useState } from 'react';
import { TableDefinition, BookmarkGroup, CustomFilter, CategoryGroup } from '../types';
import { initDB as initFirebaseDB, loadAllData as loadAllDataFromFirebase, migrateTableNameToTODAY } from '../firebase';
import { BOOKMARK_COLORS } from '../constants/colors';
import { TODAY_TABLE_NAMES } from '../constants/app';
import { initialBookmarkGroups, initialTablesUnsorted } from '../constants/mockData';
import { getTodayTableId, sortTablesByTodayFirst } from '../utils/tableHelpers';

/**
 * useDataLoading
 * Handles Firebase initialization and data loading
 * Manages data migration and sets initial state
 */
export const useDataLoading = (
  setTables: (tables: TableDefinition[]) => void,
  setBookmarks: (bookmarks: BookmarkGroup[]) => void,
  setCustomFilters: (filters: CustomFilter[]) => void,
  setCategories: (categories: CategoryGroup[]) => void,
  setTodayTableId: (id: string | null) => void,
  setActiveTableId: (id: string) => void,
  setDataSource: (source: 'initial' | 'loaded') => void,
  setIsDBLoaded: (loaded: boolean) => void
) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDataFromFirebase = async () => {
      try {
        await initFirebaseDB(); // Firebase initialization
        await migrateTableNameToTODAY();

        const firebaseData = await loadAllDataFromFirebase();

        // Table data migration helper
        const migrateTableData = (tables: TableDefinition[]): TableDefinition[] => {
          return tables.map(table => ({
            ...table,
            rows: table.rows.map(row => ({
              ...row,
              _checklists: row._checklists || [],
              _ganttTasks: row._ganttTasks || []
            }))
          }));
        };

        // Bookmark migration: add color and area attributes
        const migrateBookmarks = (bookmarks: BookmarkGroup[]): BookmarkGroup[] => {
          const colorMap: Record<string, string> = {
            '호실관리': '#FBBF24',
            '계약서작성': '#3B82F6',
            '사무실관리,시세조회': '#F97316',
            '개발도구 모음': '#10B981'
          };
          const areaMap: Record<string, number> = {
            '호실관리': 1,
            '계약서작성': 2,
            '사무실관리,시세조회': 3,
            '개발도구 모음': 4
          };
          const nameMap: Record<string, string> = {
            '호실관리': '영역1',
            '계약서작성': '영역2',
            '사무실관리,시세조회': '영역3',
            '개발도구 모음': '영역4'
          };
          return bookmarks.map((bookmark, index) => ({
            ...bookmark,
            name: nameMap[bookmark.name] || bookmark.name,
            color: bookmark.color || colorMap[bookmark.name] || BOOKMARK_COLORS[index % BOOKMARK_COLORS.length].hex,
            area: bookmark.area || areaMap[bookmark.name] || (index + 1)
          }));
        };

        // Set initial tables
        const initialTables = sortTablesByTodayFirst(initialTablesUnsorted);
        const migratedTables = firebaseData.tables.length > 0 ? migrateTableData(firebaseData.tables) : initialTables;
        const sortedTables = sortTablesByTodayFirst(migratedTables);
        const migratedBookmarks = firebaseData.bookmarks.length > 0 ? migrateBookmarks(firebaseData.bookmarks) : initialBookmarkGroups;

        setTables(sortedTables);

        // Set TODAY table ID
        const todayId = getTodayTableId(sortedTables);
        setTodayTableId(todayId);

        // Restore saved table ID or default to TODAY table
        const savedTableId = localStorage.getItem('activeTableId');
        if (savedTableId && !sortedTables.find(t => t.id === savedTableId)) {
          if (todayId) {
            setActiveTableId(todayId);
            localStorage.setItem('activeTableId', todayId);
          }
        } else if (!savedTableId && todayId) {
          setActiveTableId(todayId);
        } else if (savedTableId) {
          setActiveTableId(savedTableId);
        }

        setBookmarks(migratedBookmarks);
        setCustomFilters(firebaseData.filters || []);
        setCategories(firebaseData.categories || []);

        // Determine data source (initial vs loaded)
        const hasRealData = firebaseData.tables.length > 0 || firebaseData.bookmarks.length > 0;
        setDataSource(hasRealData ? 'loaded' : 'initial');

        setIsDBLoaded(true);
      } catch (error) {
        console.error('Failed to load data from Firebase:', error);
        // Fallback: use initial values
        const initialTables = sortTablesByTodayFirst(initialTablesUnsorted);
        setTables(initialTables);
        setBookmarks(initialBookmarkGroups);
        setCustomFilters([]);

        const todayId = getTodayTableId(initialTables);
        setTodayTableId(todayId);

        const savedTableId = localStorage.getItem('activeTableId');
        if (savedTableId && !initialTables.find(t => t.id === savedTableId)) {
          if (todayId) {
            setActiveTableId(todayId);
            localStorage.setItem('activeTableId', todayId);
          }
        } else if (!savedTableId && todayId) {
          setActiveTableId(todayId);
        } else if (savedTableId) {
          setActiveTableId(savedTableId);
        }

        setDataSource('initial');
        setIsDBLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromFirebase();
  }, [setTables, setBookmarks, setCustomFilters, setCategories, setTodayTableId, setActiveTableId, setDataSource, setIsDBLoaded]);

  return { isLoading };
};
