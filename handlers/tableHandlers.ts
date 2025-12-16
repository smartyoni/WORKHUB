import { TableDefinition, Column, ColumnType } from '../types';

/**
 * Table-related event handlers
 * Manages table creation, deletion, renaming, and reordering
 */

export const createTableHandlers = (
  tables: TableDefinition[],
  setTables: (tables: TableDefinition[]) => void,
  activeTableId: string,
  setActiveTableId: (id: string) => void,
  newTableName: string,
  newTableColumns: Omit<Column, 'id'>[],
  setNewTableName: (name: string) => void,
  setNewTableColumns: (cols: Omit<Column, 'id'>[]) => void,
  setIsTableModalOpen: (open: boolean) => void,
  isEditingTableName: boolean,
  editingTableName: string,
  setIsEditingTableName: (editing: boolean) => void,
  setEditingTableName: (name: string) => void,
  setConfirmModalMessage: (msg: string) => void,
  setConfirmModalAction: (action: (() => void) | null) => void,
  setIsConfirmModalOpen: (open: boolean) => void,
  setIsDeleteLocked: (locked: boolean) => void,
  isDeleteLocked: boolean
) => {
  const addTable = () => {
    if (!newTableName.trim()) return;

    const newTable: TableDefinition = {
      id: `table-${Date.now()}`,
      name: newTableName,
      columns: newTableColumns.map((col, idx) => ({
        id: `col-${Date.now()}-${idx}`,
        ...col
      })),
      rows: []
    };

    setTables([...tables, newTable]);
    setNewTableName('');
    setNewTableColumns([{ name: '제목', type: ColumnType.TEXT, width: 180 }]);
    setIsTableModalOpen(false);
  };

  const deleteTable = () => {
    if (isDeleteLocked) {
      setConfirmModalMessage('테이블 삭제 기능이 잠금되어 있습니다. 잠금을 해제하세요.');
      setConfirmModalAction(() => {
        setIsConfirmModalOpen(false);
      });
      setIsConfirmModalOpen(true);
      return;
    }

    const updatedTables = tables.filter(t => t.id !== activeTableId);
    setTables(updatedTables);
    if (updatedTables.length > 0) {
      setActiveTableId(updatedTables[0].id);
    }
    setIsDeleteLocked(true);
  };

  const handleTableNameDoubleClick = () => {
    const table = tables.find(t => t.id === activeTableId);
    if (table) {
      setEditingTableName(table.name);
      setIsEditingTableName(true);
    }
  };

  const saveTableName = () => {
    if (!editingTableName.trim()) return;

    const updatedTables = tables.map(t =>
      t.id === activeTableId ? { ...t, name: editingTableName } : t
    );

    setTables(updatedTables);
    setIsEditingTableName(false);
    setEditingTableName('');
  };

  const cancelTableNameEdit = () => {
    setIsEditingTableName(false);
    setEditingTableName('');
  };

  const handleMoveTable = (tableId: string, direction: 'left' | 'right') => {
    const index = tables.findIndex(t => t.id === tableId);
    if (index === -1) return;

    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === tables.length - 1) return;

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    const newTables = [...tables];
    [newTables[index], newTables[newIndex]] = [newTables[newIndex], newTables[index]];

    setTables(newTables);
  };

  const handleSaveTableOrder = async () => {
    // This would be called to persist table order to Firebase
    // For now, just a placeholder
  };

  return {
    addTable,
    deleteTable,
    handleTableNameDoubleClick,
    saveTableName,
    cancelTableNameEdit,
    handleMoveTable,
    handleSaveTableOrder,
  };
};
