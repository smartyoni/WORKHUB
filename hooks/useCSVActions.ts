import { useCallback } from 'react';
import { parseCSV, validateCSVData } from '../types';
import { useTableState } from '../contexts/TableStateContext';
import { useModalState } from '../contexts/ModalStateContext';

export const useCSVActions = () => {
  const tableState = useTableState();
  const modalState = useModalState();

  const handleCSVFileSelect = useCallback((file: File) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        const validationResult = validateCSVData(parsedData, tableState.activeTable?.columns || []);

        modalState.setCSVValidationResult(validationResult);
        if (validationResult.isValid && validationResult.validatedRows) {
          modalState.setCSVPreviewData(validationResult.validatedRows);
        }
      } catch (error) {
        console.error('Failed to parse CSV:', error);
        modalState.setCSVValidationResult({
          isValid: false,
          errors: ['CSV 파일 처리 중 오류가 발생했습니다.']
        });
      }
    };

    reader.readAsText(file);
  }, [tableState.activeTable]);

  const handleCSVUpload = useCallback(() => {
    if (!tableState.activeTable || !modalState.csvValidationResult || !modalState.csvValidationResult.isValid) return;

    if (!modalState.csvValidationResult.validatedRows || modalState.csvValidationResult.validatedRows.length === 0) return;

    const newRows = modalState.csvValidationResult.validatedRows.map((data, idx) => ({
      id: `row-${Date.now()}-${idx}`,
      ...data,
      _memo: '',
      _checklists: [],
      _ganttTasks: [],
      _notes: '',
    }));

    const updatedTables = tableState.tables.map(table =>
      table.id === tableState.activeTableId
        ? { ...table, rows: [...table.rows, ...newRows] }
        : table
    );

    tableState.setTables(updatedTables);
    modalState.setIsCSVUploadModalOpen(false);
    modalState.setCSVValidationResult(null);
    modalState.setCSVPreviewData(null);
  }, [tableState.activeTable, tableState.tables, tableState.activeTableId, modalState.csvValidationResult]);

  return {
    handleCSVFileSelect,
    handleCSVUpload,
  };
};
