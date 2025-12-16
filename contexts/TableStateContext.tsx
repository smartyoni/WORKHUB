import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TableDefinition, BookmarkGroup, CustomFilter, CategoryGroup, RowData } from '../types';

interface TableStateContextType {
  // Data state
  bookmarks: BookmarkGroup[];
  setBookmarks: (bookmarks: BookmarkGroup[]) => void;
  tables: TableDefinition[];
  setTables: (tables: TableDefinition[]) => void;
  customFilters: CustomFilter[];
  setCustomFilters: (filters: CustomFilter[]) => void;
  categories: CategoryGroup[];
  setCategories: (categories: CategoryGroup[]) => void;

  // UI state
  isDBLoaded: boolean;
  setIsDBLoaded: (loaded: boolean) => void;
  todayTableId: string | null;
  setTodayTableId: (id: string | null) => void;
  activeTableId: string;
  setActiveTableId: (id: string) => void;
  selectedRowId: string | null;
  setSelectedRowId: (id: string | null) => void;
  checklistStates: Record<string, boolean>;
  setChecklistStates: (states: Record<string, boolean>) => void;

  // Data source tracking
  dataSource: 'initial' | 'loaded';
  setDataSource: (source: 'initial' | 'loaded') => void;

  // Derived values
  activeTable: TableDefinition | undefined;
  visibleColumns: any[];
  hiddenColumns: any[];
}

const TableStateContext = createContext<TableStateContextType | undefined>(undefined);

export const TableStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkGroup[]>([]);
  const [tables, setTables] = useState<TableDefinition[]>([]);
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isDBLoaded, setIsDBLoaded] = useState(false);
  const [todayTableId, setTodayTableId] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<string>(() => {
    const saved = localStorage.getItem('activeTableId');
    return saved || '';
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [checklistStates, setChecklistStates] = useState<Record<string, boolean>>({});
  const [dataSource, setDataSource] = useState<'initial' | 'loaded'>('initial');

  // Derived values
  const activeTable = tables.find(t => t.id === activeTableId);
  const visibleColumns = activeTable?.columns.filter(c => !c.isHidden) || [];
  const hiddenColumns = activeTable?.columns.filter(c => c.isHidden) || [];

  const value: TableStateContextType = {
    bookmarks,
    setBookmarks,
    tables,
    setTables,
    customFilters,
    setCustomFilters,
    categories,
    setCategories,
    isDBLoaded,
    setIsDBLoaded,
    todayTableId,
    setTodayTableId,
    activeTableId,
    setActiveTableId,
    selectedRowId,
    setSelectedRowId,
    checklistStates,
    setChecklistStates,
    dataSource,
    setDataSource,
    activeTable,
    visibleColumns,
    hiddenColumns,
  };

  return (
    <TableStateContext.Provider value={value}>
      {children}
    </TableStateContext.Provider>
  );
};

export const useTableState = () => {
  const context = useContext(TableStateContext);
  if (!context) {
    throw new Error('useTableState must be used within TableStateProvider');
  }
  return context;
};
