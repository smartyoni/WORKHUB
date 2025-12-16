import { useState, useMemo } from 'react';
import { TableDefinition } from '../types';

/**
 * useTableState
 * Manages all table-related state including active table, rows, columns
 * Provides computed values for visible/hidden columns and active table
 */
export const useTableState = (
  initialTables: TableDefinition[],
  initialTablesUnsorted: TableDefinition[]
) => {
  const [tables, setTables] = useState<TableDefinition[]>(initialTables);

  const [activeTableId, setActiveTableId] = useState<string>(() => {
    // Restore previously selected table from localStorage
    const saved = localStorage.getItem('activeTableId');
    return saved || '';
  });

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [todayTableId, setTodayTableId] = useState<string | null>(null);
  const [checklistStates, setChecklistStates] = useState<Record<string, boolean>>({});

  // Compute derived values
  const activeTable = useMemo(
    () => tables.find(t => t.id === activeTableId),
    [tables, activeTableId]
  );

  const visibleColumns = useMemo(
    () => activeTable?.columns.filter(c => !c.isHidden) || [],
    [activeTable]
  );

  const hiddenColumns = useMemo(
    () => activeTable?.columns.filter(c => c.isHidden) || [],
    [activeTable]
  );

  return {
    tables,
    setTables,
    activeTableId,
    setActiveTableId,
    selectedRowId,
    setSelectedRowId,
    todayTableId,
    setTodayTableId,
    checklistStates,
    setChecklistStates,
    activeTable,
    visibleColumns,
    hiddenColumns,
  };
};
