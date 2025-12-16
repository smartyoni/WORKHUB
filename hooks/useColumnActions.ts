import { useCallback } from 'react';
import { Column, ColumnType } from '../types';
import { useTableState } from '../contexts/TableStateContext';
import { useModalState } from '../contexts/ModalStateContext';
import { useUIState } from '../contexts/UIStateContext';

export const useColumnActions = () => {
  const tableState = useTableState();
  const modalState = useModalState();
  const uiState = useUIState();

  const handleMoveColumn = useCallback((colId: string, direction: 'left' | 'right') => {
    if (!tableState.activeTable) return;

    const colIndex = tableState.activeTable.columns.findIndex(c => c.id === colId);
    if (colIndex === -1) return;
    if (direction === 'left' && colIndex === 0) return;
    if (direction === 'right' && colIndex === tableState.activeTable.columns.length - 1) return;

    const newIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
    const newColumns = [...tableState.activeTable.columns];
    [newColumns[colIndex], newColumns[newIndex]] = [newColumns[newIndex], newColumns[colIndex]];

    const updatedTables = tableState.tables.map(table =>
      table.id === tableState.activeTableId ? { ...table, columns: newColumns } : table
    );

    tableState.setTables(updatedTables);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId]);

  const handleAddColumn = useCallback(() => {
    if (!tableState.activeTable || !modalState.newColumnName.trim()) return;

    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name: modalState.newColumnName,
      type: modalState.newColumnType,
      width: 180
    };

    const updatedTables = tableState.tables.map(table =>
      table.id === tableState.activeTableId
        ? { ...table, columns: [...table.columns, newColumn] }
        : table
    );

    tableState.setTables(updatedTables);
    modalState.setIsAddColumnModalOpen(false);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId, modalState.newColumnName, modalState.newColumnType]);

  const handleSort = useCallback((colId: string, direction: 'asc' | 'desc') => {
    if (!tableState.activeTable) return;

    const sortedRows = [...tableState.activeTable.rows].sort((a, b) => {
      const aVal = String(a[colId] || '').toLowerCase();
      const bVal = String(b[colId] || '').toLowerCase();

      const comparison = aVal.localeCompare(bVal);
      return direction === 'asc' ? comparison : -comparison;
    });

    const updatedTables = tableState.tables.map(table =>
      table.id === tableState.activeTableId ? { ...table, rows: sortedRows } : table
    );

    tableState.setTables(updatedTables);
    uiState.setActiveMenuColId(null);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId]);

  const handleHideColumn = useCallback((colId: string) => {
    if (!tableState.activeTable) return;

    const updatedTables = tableState.tables.map(table => {
      if (table.id !== tableState.activeTableId) return table;

      return {
        ...table,
        columns: table.columns.map(col =>
          col.id === colId ? { ...col, isHidden: true } : col
        )
      };
    });

    tableState.setTables(updatedTables);
    uiState.setActiveMenuColId(null);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId]);

  const handleRestoreColumn = useCallback((colId: string) => {
    if (!tableState.activeTable) return;

    const updatedTables = tableState.tables.map(table => {
      if (table.id !== tableState.activeTableId) return table;

      return {
        ...table,
        columns: table.columns.map(col =>
          col.id === colId ? { ...col, isHidden: false } : col
        )
      };
    });

    tableState.setTables(updatedTables);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId]);

  const handleDeleteColumn = useCallback((colId: string) => {
    if (!tableState.activeTable) return;

    const updatedTables = tableState.tables.map(table => {
      if (table.id !== tableState.activeTableId) return table;

      return {
        ...table,
        columns: table.columns.filter(col => col.id !== colId)
      };
    });

    tableState.setTables(updatedTables);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId]);

  const openEditColumnModal = useCallback((col: Column) => {
    modalState.setEditingColState(col);
    modalState.setIsColEditModalOpen(true);
  }, []);

  const saveUpdatedColumn = useCallback(() => {
    if (!tableState.activeTable || !modalState.editingColState) return;

    const updatedTables = tableState.tables.map(table => {
      if (table.id !== tableState.activeTableId) return table;

      return {
        ...table,
        columns: table.columns.map(col =>
          col.id === modalState.editingColState.id ? modalState.editingColState : col
        )
      };
    });

    tableState.setTables(updatedTables);
    modalState.setIsColEditModalOpen(false);
    modalState.setEditingColState(null);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId, modalState.editingColState]);

  return {
    handleMoveColumn,
    handleAddColumn,
    handleSort,
    handleHideColumn,
    handleRestoreColumn,
    handleDeleteColumn,
    openEditColumnModal,
    saveUpdatedColumn,
  };
};
