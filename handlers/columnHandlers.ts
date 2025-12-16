import { TableDefinition, Column, ColumnType } from '../types';

/**
 * Column-related event handlers
 * Manages column creation, deletion, sorting, hiding, and reordering
 */

export const createColumnHandlers = (
  activeTable: TableDefinition | undefined,
  tables: TableDefinition[],
  setTables: (tables: TableDefinition[]) => void,
  activeTableId: string,
  visibleColumns: Column[]
) => {
  const handleMoveColumn = (colId: string, direction: 'left' | 'right') => {
    if (!activeTable) return;

    const colIndex = activeTable.columns.findIndex(c => c.id === colId);
    if (colIndex === -1) return;
    if (direction === 'left' && colIndex === 0) return;
    if (direction === 'right' && colIndex === activeTable.columns.length - 1) return;

    const newIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
    const newColumns = [...activeTable.columns];
    [newColumns[colIndex], newColumns[newIndex]] = [newColumns[newIndex], newColumns[colIndex]];

    const updatedTables = tables.map(table =>
      table.id === activeTableId ? { ...table, columns: newColumns } : table
    );

    setTables(updatedTables);
  };

  const handleAddColumn = (
    newColumnName: string,
    newColumnType: ColumnType,
    setIsAddColumnModalOpen: (open: boolean) => void
  ) => {
    if (!activeTable || !newColumnName.trim()) return;

    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name: newColumnName,
      type: newColumnType,
      width: 180
    };

    const updatedTables = tables.map(table =>
      table.id === activeTableId
        ? { ...table, columns: [...table.columns, newColumn] }
        : table
    );

    setTables(updatedTables);
    setIsAddColumnModalOpen(false);
  };

  const handleSort = (colId: string, direction: 'asc' | 'desc', setActiveMenuColId: (id: string | null) => void) => {
    if (!activeTable) return;

    const sortedRows = [...activeTable.rows].sort((a, b) => {
      const aVal = String(a[colId] || '').toLowerCase();
      const bVal = String(b[colId] || '').toLowerCase();

      const comparison = aVal.localeCompare(bVal);
      return direction === 'asc' ? comparison : -comparison;
    });

    const updatedTables = tables.map(table =>
      table.id === activeTableId ? { ...table, rows: sortedRows } : table
    );

    setTables(updatedTables);
    setActiveMenuColId(null);
  };

  const handleHideColumn = (colId: string, setActiveMenuColId: (id: string | null) => void) => {
    if (!activeTable) return;

    const updatedTables = tables.map(table => {
      if (table.id !== activeTableId) return table;

      return {
        ...table,
        columns: table.columns.map(col =>
          col.id === colId ? { ...col, isHidden: true } : col
        )
      };
    });

    setTables(updatedTables);
    setActiveMenuColId(null);
  };

  const handleRestoreColumn = (colId: string) => {
    if (!activeTable) return;

    const updatedTables = tables.map(table => {
      if (table.id !== activeTableId) return table;

      return {
        ...table,
        columns: table.columns.map(col =>
          col.id === colId ? { ...col, isHidden: false } : col
        )
      };
    });

    setTables(updatedTables);
  };

  const handleDeleteColumn = (colId: string) => {
    if (!activeTable) return;

    const updatedTables = tables.map(table => {
      if (table.id !== activeTableId) return table;

      return {
        ...table,
        columns: table.columns.filter(col => col.id !== colId)
      };
    });

    setTables(updatedTables);
  };

  const openEditColumnModal = (
    col: Column,
    setEditingColState: (col: Column) => void,
    setIsColEditModalOpen: (open: boolean) => void
  ) => {
    setEditingColState(col);
    setIsColEditModalOpen(true);
  };

  const saveUpdatedColumn = (
    editingColState: Column | null,
    setIsColEditModalOpen: (open: boolean) => void
  ) => {
    if (!activeTable || !editingColState) return;

    const updatedTables = tables.map(table => {
      if (table.id !== activeTableId) return table;

      return {
        ...table,
        columns: table.columns.map(col =>
          col.id === editingColState.id ? editingColState : col
        )
      };
    });

    setTables(updatedTables);
    setIsColEditModalOpen(false);
  };

  const handleMenuClick = (
    e: React.MouseEvent,
    colId: string,
    setMenuPos: (pos: { x: number; y: number } | null) => void,
    setActiveMenuColId: (id: string | null) => void
  ) => {
    setMenuPos({ x: e.clientX, y: e.clientY });
    setActiveMenuColId(colId);
  };

  return {
    handleMoveColumn,
    handleAddColumn,
    handleSort,
    handleHideColumn,
    handleRestoreColumn,
    handleDeleteColumn,
    openEditColumnModal,
    saveUpdatedColumn,
    handleMenuClick,
  };
};
