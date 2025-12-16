import { TableDefinition, ValidationResult, parseCSV, validateCSVData } from '../types';

/**
 * CSV upload-related event handlers
 * Manages CSV file selection and data import
 */

export const createCSVHandlers = (
  activeTable: TableDefinition | undefined,
  tables: TableDefinition[],
  setTables: (tables: TableDefinition[]) => void,
  activeTableId: string
) => {
  const handleCSVFileSelect = (
    file: File,
    setCSVValidationResult: (result: ValidationResult | null) => void,
    setCSVPreviewData: (data: any[] | null) => void
  ) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        const validationResult = validateCSVData(parsedData, activeTable?.columns || []);

        setCSVValidationResult(validationResult);
        if (validationResult.isValid && validationResult.validatedRows) {
          setCSVPreviewData(validationResult.validatedRows);
        }
      } catch (error) {
        console.error('Failed to parse CSV:', error);
        setCSVValidationResult({
          isValid: false,
          errors: ['CSV 파일 처리 중 오류가 발생했습니다.']
        });
      }
    };

    reader.readAsText(file);
  };

  const handleCSVUpload = (
    csvValidationResult: ValidationResult | null,
    setIsCSVUploadModalOpen: (open: boolean) => void,
    setCSVValidationResult: (result: ValidationResult | null) => void,
    setCSVPreviewData: (data: any[] | null) => void
  ) => {
    if (!activeTable || !csvValidationResult || !csvValidationResult.isValid) return;

    if (!csvValidationResult.validatedRows || csvValidationResult.validatedRows.length === 0) return;

    const newRows = csvValidationResult.validatedRows.map((data, idx) => ({
      id: `row-${Date.now()}-${idx}`,
      ...data,
      _memo: '',
      _checklists: [],
      _ganttTasks: [],
      _notes: '',
    }));

    const updatedTables = tables.map(table =>
      table.id === activeTableId
        ? { ...table, rows: [...table.rows, ...newRows] }
        : table
    );

    setTables(updatedTables);
    setIsCSVUploadModalOpen(false);
    setCSVValidationResult(null);
    setCSVPreviewData(null);
  };

  return {
    handleCSVFileSelect,
    handleCSVUpload,
  };
};
