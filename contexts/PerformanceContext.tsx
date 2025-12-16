import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { RowData, ColumnType, CustomFilter } from '../types';
import { useTableState } from './TableStateContext';
import { useUIState } from './UIStateContext';
import {
  evaluateColumnFilter,
  evaluateChecklistFilter,
  evaluateReplyFilter,
  migrateFilterCondition
} from '../utils/filterHelpers';
import { UNCATEGORIZED_MARKER } from '../constants/app';

interface PerformanceContextType {
  filteredRows: RowData[];
  todayTableDates: {
    recent: { date: string; displayDate: string; count: number }[];
    monthGroups: { monthKey: string; monthDisplay: string; dates: { date: string; displayDate: string; count: number }[] }[];
  };
  sidebarColumnId: string | null;
  currentTableFilters: CustomFilter[];
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const tableState = useTableState();
  const uiState = useUIState();

  // Memoized filtered rows - OPTIMIZED FILTERING LOGIC
  const filteredRows = useMemo(() => {
    if (!tableState.activeTable) return [];

    let rows = tableState.activeTable.rows;

    // Apply custom filter first
    if (uiState.activeFilterId) {
      const filter = tableState.customFilters.find(f => f.id === uiState.activeFilterId);
      if (filter) {
        rows = rows.filter(row => {
          // AND Logic: All conditions must be true
          return filter.conditions.every(cond => {
            // Migrate legacy filters automatically
            const migratedCondition = migrateFilterCondition(cond);

            // Route to appropriate evaluator based on target type
            switch (migratedCondition.target.type) {
              case 'column':
                return evaluateColumnFilter(row, migratedCondition);
              case 'checklist':
                return evaluateChecklistFilter(row, migratedCondition);
              case 'reply':
                return evaluateReplyFilter(row, migratedCondition);
              default:
                return true;
            }
          });
        });
      }
    }

    // Apply date filter for TODAY table
    if (uiState.activeDateFilter && tableState.activeTableId === tableState.todayTableId) {
      rows = rows.filter(row => row['col-1'] === uiState.activeDateFilter);
    }

    // Apply category filter
    if (uiState.activeCategoryFilter && tableState.activeTable) {
      if (uiState.activeCategoryFilter.categoryName === UNCATEGORIZED_MARKER) {
        // Filter for uncategorized rows (empty, null, or undefined)
        rows = rows.filter(row => {
          const value = row[uiState.activeCategoryFilter!.columnId];
          return value === '' || value === null || value === undefined;
        });
      } else {
        // Normal category filter
        rows = rows.filter(row => row[uiState.activeCategoryFilter!.columnId] === uiState.activeCategoryFilter!.categoryName);
      }
    }

    // Apply search filter
    const currentSearchTerm = uiState.searchTerms[tableState.activeTableId] || '';
    if (currentSearchTerm.trim() !== '') {
      const searchLower = currentSearchTerm.toLowerCase().trim();
      rows = rows.filter(row => {
        return tableState.activeTable!.columns.some(col => {
          const cellValue = String(row[col.id] || '').toLowerCase();
          return cellValue.includes(searchLower);
        });
      });
    }

    return rows;
  }, [
    tableState.activeTable,
    tableState.activeTableId,
    tableState.todayTableId,
    tableState.customFilters,
    uiState.activeFilterId,
    uiState.activeDateFilter,
    uiState.activeCategoryFilter,
    uiState.searchTerms
  ]);

  // Memoized today table dates
  const todayTableDates = useMemo(() => {
    if (!tableState.activeTable || !tableState.todayTableId || tableState.activeTableId !== tableState.todayTableId) {
      return { recent: [], monthGroups: [] };
    }

    // Get all unique dates from col-1 and count them
    const dateMap = new Map<string, number>();
    tableState.activeTable.rows.forEach(row => {
      const dateStr = row['col-1'] as string;
      if (dateStr) {
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    });

    // Convert to array and format
    const allDates = Array.from(dateMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateStr, count]) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const displayDate = `${year}년 ${month}월 ${day}일`;
        return { date: dateStr, displayDate, count, year, month, day };
      });

    // Get today's date
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayDate = new Date(todayStr);

    // Separate recent (within 3 days) and older dates
    const recent: typeof allDates = [];
    const older: typeof allDates = [];

    allDates.forEach(dateItem => {
      const itemDate = new Date(`${dateItem.year}-${String(dateItem.month).padStart(2, '0')}-${String(dateItem.day).padStart(2, '0')}`);
      const diffTime = todayDate.getTime() - itemDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays >= 0 && diffDays <= 2) {
        recent.push(dateItem);
      } else {
        older.push(dateItem);
      }
    });

    // Sort recent dates: today first, then yesterday, then day before
    recent.sort((a, b) => {
      const aDate = new Date(`${a.year}-${String(a.month).padStart(2, '0')}-${String(a.day).padStart(2, '0')}`);
      const bDate = new Date(`${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`);
      return bDate.getTime() - aDate.getTime();
    });

    // Group older dates by year-month
    const monthMap = new Map<string, typeof older>();
    older.forEach(dateItem => {
      const monthKey = `${dateItem.year}-${String(dateItem.month).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      monthMap.get(monthKey)!.push(dateItem);
    });

    // Convert month map to array and sort by month (newest first)
    const monthGroups = Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([monthKey, dates]) => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthDisplay = `${year}년 ${month}월`;
        return { monthKey, monthDisplay, dates };
      });

    return { recent, monthGroups };
  }, [tableState.activeTable, tableState.activeTableId, tableState.todayTableId]);

  // Get sidebar column ID
  const sidebarColumnId = useMemo(() => {
    if (!tableState.activeTable) return null;
    // TODAY 테이블: 기록일 (col-1)
    if (tableState.activeTableId === tableState.todayTableId) {
      return 'col-1';
    }
    // 다른 테이블: 첫 번째 카테고리 칼럼
    const categoryCol = tableState.activeTable.columns.find(c => c.type === ColumnType.CATEGORY);
    return categoryCol?.id || null;
  }, [tableState.activeTable, tableState.activeTableId, tableState.todayTableId]);

  // Get filters for current table
  const currentTableFilters = useMemo(() => {
    return tableState.customFilters.filter(f => f.tableId === tableState.activeTableId);
  }, [tableState.customFilters, tableState.activeTableId]);

  const value: PerformanceContextType = {
    filteredRows,
    todayTableDates,
    sidebarColumnId,
    currentTableFilters,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
};
