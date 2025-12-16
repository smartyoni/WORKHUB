import { TableDefinition, RowData } from '../types';

/**
 * Row-related event handlers
 * Manages row creation, deletion, and reordering
 */

export const createRowHandlers = (
  activeTable: TableDefinition | undefined,
  tables: TableDefinition[],
  setTables: (tables: TableDefinition[]) => void,
  activeTableId: string,
  setSelectedRowId: (id: string | null) => void
) => {
  const handleRowClick = (rowId: string) => {
    setSelectedRowId(rowId);
  };

  const updateRow = (updatedRow: RowData) => {
    if (!activeTable) return;

    const updatedTables = tables.map(table => {
      if (table.id !== activeTableId) return table;

      return {
        ...table,
        rows: table.rows.map(row => (row.id === updatedRow.id ? updatedRow : row))
      };
    });

    setTables(updatedTables);
  };

  const handleDeleteRow = (rowIdToDelete: string) => {
    if (!activeTable) return;

    const updatedTables = tables.map(table => {
      if (table.id !== activeTableId) return table;

      return {
        ...table,
        rows: table.rows.filter(row => row.id !== rowIdToDelete)
      };
    });

    setTables(updatedTables);
    setSelectedRowId(null);
  };

  const handleMoveRow = (rowId: string, direction: 'up' | 'down') => {
    if (!activeTable) return;

    const rowIndex = activeTable.rows.findIndex(r => r.id === rowId);
    if (rowIndex === -1) return;
    if (direction === 'up' && rowIndex === 0) return;
    if (direction === 'down' && rowIndex === activeTable.rows.length - 1) return;

    const newIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    const newRows = [...activeTable.rows];
    [newRows[rowIndex], newRows[newIndex]] = [newRows[newIndex], newRows[rowIndex]];

    const updatedTables = tables.map(table =>
      table.id === activeTableId ? { ...table, rows: newRows } : table
    );

    setTables(updatedTables);
  };

  const openRowModal = (setRowFormData: (data: Record<string, any>) => void, setIsRowModalOpen: (open: boolean) => void) => {
    setRowFormData({});
    setIsRowModalOpen(true);
  };

  const saveNewRow = (rowFormData: Record<string, any>, setIsRowModalOpen: (open: boolean) => void) => {
    if (!activeTable) return;

    const newRow: RowData = {
      id: `row-${Date.now()}`,
      ...rowFormData,
      _memo: '',
      _checklists: [],
      _ganttTasks: [],
      _notes: '',
    };

    const updatedTables = tables.map(table =>
      table.id === activeTableId ? { ...table, rows: [...table.rows, newRow] } : table
    );

    setTables(updatedTables);
    setIsRowModalOpen(false);
  };

  const toggleChecklist = (
    rowId: string,
    checklistStates: Record<string, boolean>,
    setChecklistStates: (state: Record<string, boolean>) => void
  ) => {
    setChecklistStates({
      ...checklistStates,
      [rowId]: !checklistStates[rowId]
    });
  };

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
