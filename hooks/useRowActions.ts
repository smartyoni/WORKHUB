import { useCallback } from 'react';
import { RowData } from '../types';
import { useTableState } from '../contexts/TableStateContext';
import { useModalState } from '../contexts/ModalStateContext';

export const useRowActions = () => {
  const tableState = useTableState();
  const modalState = useModalState();

  const handleRowClick = useCallback((rowId: string) => {
    tableState.setSelectedRowId(rowId);
  }, []);

  const updateRow = useCallback((updatedRow: RowData) => {
    if (!tableState.activeTable) return;

    const updatedTables = tableState.tables.map(table => {
      if (table.id !== tableState.activeTableId) return table;

      return {
        ...table,
        rows: table.rows.map(row => (row.id === updatedRow.id ? updatedRow : row))
      };
    });

    tableState.setTables(updatedTables);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId]);

  const handleDeleteRow = useCallback((rowIdToDelete: string) => {
    if (!tableState.activeTable) return;

    const updatedTables = tableState.tables.map(table => {
      if (table.id !== tableState.activeTableId) return table;

      return {
        ...table,
        rows: table.rows.filter(row => row.id !== rowIdToDelete)
      };
    });

    tableState.setTables(updatedTables);
    tableState.setSelectedRowId(null);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId]);

  const handleMoveRow = useCallback((rowId: string, direction: 'up' | 'down') => {
    if (!tableState.activeTable) return;

    const rowIndex = tableState.activeTable.rows.findIndex(r => r.id === rowId);
    if (rowIndex === -1) return;
    if (direction === 'up' && rowIndex === 0) return;
    if (direction === 'down' && rowIndex === tableState.activeTable.rows.length - 1) return;

    const newIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    const newRows = [...tableState.activeTable.rows];
    [newRows[rowIndex], newRows[newIndex]] = [newRows[newIndex], newRows[rowIndex]];

    const updatedTables = tableState.tables.map(table =>
      table.id === tableState.activeTableId ? { ...table, rows: newRows } : table
    );

    tableState.setTables(updatedTables);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId]);

  const openRowModal = useCallback(() => {
    modalState.setRowFormData({});
    modalState.setIsRowModalOpen(true);
  }, []);

  const saveNewRow = useCallback(() => {
    if (!tableState.activeTable) return;

    const newRow: RowData = {
      id: `row-${Date.now()}`,
      ...modalState.rowFormData,
      _memo: '',
      _checklists: [],
      _ganttTasks: [],
      _notes: '',
    };

    const updatedTables = tableState.tables.map(table =>
      table.id === tableState.activeTableId ? { ...table, rows: [...table.rows, newRow] } : table
    );

    tableState.setTables(updatedTables);
    modalState.setIsRowModalOpen(false);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId, modalState.rowFormData]);

  const toggleChecklist = useCallback((rowId: string) => {
    tableState.setChecklistStates({
      ...tableState.checklistStates,
      [rowId]: !tableState.checklistStates[rowId]
    });
  }, [tableState.checklistStates]);

  return {
    handleRowClick,
    updateRow,
    handleDeleteRow,
    handleMoveRow,
    openRowModal,
    saveNewRow,
    toggleChecklist,
  };
};
