import { useCallback } from 'react';
import { TableDefinition, Column, ColumnType } from '../types';
import { useTableState } from '../contexts/TableStateContext';
import { useModalState } from '../contexts/ModalStateContext';

export const useTableActions = () => {
  const tableState = useTableState();
  const modalState = useModalState();

  const addTable = useCallback(() => {
    if (!modalState.newTableName.trim()) return;

    const newTable: TableDefinition = {
      id: `table-${Date.now()}`,
      name: modalState.newTableName,
      columns: modalState.newTableColumns.map((col, idx) => ({
        id: `col-${Date.now()}-${idx}`,
        ...col
      })),
      rows: []
    };

    tableState.setTables([...tableState.tables, newTable]);
    modalState.setNewTableName('');
    modalState.setNewTableColumns([{ name: '제목', type: ColumnType.TEXT, width: 180 }]);
    modalState.setIsTableModalOpen(false);
  }, [tableState.tables, modalState.newTableName, modalState.newTableColumns]);

  const deleteTable = useCallback(() => {
    if (modalState.isDeleteLocked) {
      modalState.setConfirmModalMessage('테이블 삭제 기능이 잠금되어 있습니다. 잠금을 해제하세요.');
      modalState.setConfirmModalAction(() => {
        modalState.setIsConfirmModalOpen(false);
      });
      modalState.setIsConfirmModalOpen(true);
      return;
    }

    const updatedTables = tableState.tables.filter(t => t.id !== tableState.activeTableId);
    tableState.setTables(updatedTables);
    if (updatedTables.length > 0) {
      tableState.setActiveTableId(updatedTables[0].id);
    }
    modalState.setIsDeleteLocked(true);
  }, [tableState.tables, tableState.activeTableId, modalState.isDeleteLocked]);

  const handleTableNameDoubleClick = useCallback(() => {
    const table = tableState.tables.find(t => t.id === tableState.activeTableId);
    if (table) {
      modalState.setEditingTableName(table.name);
      modalState.setIsEditingTableName(true);
    }
  }, [tableState.tables, tableState.activeTableId]);

  const saveTableName = useCallback(() => {
    if (!modalState.editingTableName.trim()) return;

    const updatedTables = tableState.tables.map(t =>
      t.id === tableState.activeTableId ? { ...t, name: modalState.editingTableName } : t
    );

    tableState.setTables(updatedTables);
    modalState.setIsEditingTableName(false);
    modalState.setEditingTableName('');
  }, [tableState.tables, tableState.activeTableId, modalState.editingTableName]);

  const cancelTableNameEdit = useCallback(() => {
    modalState.setIsEditingTableName(false);
    modalState.setEditingTableName('');
  }, []);

  const handleMoveTable = useCallback((tableId: string, direction: 'left' | 'right') => {
    const index = tableState.tables.findIndex(t => t.id === tableId);
    if (index === -1) return;

    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === tableState.tables.length - 1) return;

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    const newTables = [...tableState.tables];
    [newTables[index], newTables[newIndex]] = [newTables[newIndex], newTables[index]];

    tableState.setTables(newTables);
    localStorage.setItem('tables', JSON.stringify(newTables));
  }, [tableState.tables]);

  return {
    addTable,
    deleteTable,
    handleTableNameDoubleClick,
    saveTableName,
    cancelTableNameEdit,
    handleMoveTable,
  };
};
