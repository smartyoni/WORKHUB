
export enum ColumnType {
  TEXT = 'TEXT',
  LONG_TEXT = 'LONG_TEXT',
  NUMBER = 'NUMBER',
  DATE_AUTO = 'DATE_AUTO',     // Automatically set to current date on row creation
  DATE_MANUAL = 'DATE_MANUAL', // Manually entered by user
  TIME_AUTO = 'TIME_AUTO',     // Automatically set to current time on row creation
  TIME_MANUAL = 'TIME_MANUAL', // Manually entered by user
  YMD_AUTO = 'YMD_AUTO',       // Automatically set to current year-month-day on row creation
  YMD_MANUAL = 'YMD_MANUAL',   // Manually entered year-month-day by user
  CHECKLIST = 'CHECKLIST',     // Checkbox column - when checked, strikethrough first column
  CATEGORY = 'CATEGORY',       // Category selection with custom management
}

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  width: number;
  isHidden?: boolean;
  categoryId?: string; // For CATEGORY type columns, reference to the category group
}

export interface CategoryItem {
  id: string;
  name: string;
  color?: string; // Hex color code
}

export interface CategoryGroup {
  id: string;
  name: string; // Column name
  columnId: string; // Reference to the column
  tableId: string; // Reference to the table
  items: CategoryItem[];
}

export interface Reply {
  id: string;
  text: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  replies: Reply[];
}

export interface GanttTask {
  id: string;
  name: string;
  startDate: string;  // YYYY-MM-DD format
  endDate: string;    // YYYY-MM-DD format
  progress?: number;  // 0-100
  color?: string;     // hex color code
}

export interface RowData {
  id: string;
  [key: string]: any; // Dynamic column data
  _memo: string;
  _category?: string; // Optional - for backward compatibility with existing data
  _checklists: ChecklistItem[];
  _ganttTasks: GanttTask[];
}

export interface TableDefinition {
  id: string;
  name: string;
  columns: Column[];
  rows: RowData[];
}

export interface Bookmark {
  id: string;
  name: string;
  url: string; // Or descriptive text
  color?: string; // Hex color code (e.g., "#3B82F6")
}

export interface BookmarkGroup {
  id: string;
  name: string; // e.g. "호실관리", "계약서작성"
  color: string; // Hex color code or color name (e.g., "#FFD700", "yellow")
  area?: number; // 영역 구분 (1-4)
  items: Bookmark[];
}

// --- Filter Types ---

export type FilterTargetType = 'column' | 'memo' | 'checklist' | 'reply';

export interface FilterTarget {
  type: FilterTargetType;
  field?: string; // Optional: columnId for 'column' type
}

export type FilterOperator =
  // Existing operators for columns
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'greaterThan'
  | 'lessThan'
  // New operators for category/memo
  | 'isEmpty'
  | 'isNotEmpty'
  // New operators for checklists
  | 'hasChecked'
  | 'hasUnchecked'
  | 'allChecked'
  | 'checklistContains'
  // New operators for replies
  | 'hasReplies'
  | 'noReplies'
  | 'replyToday'
  | 'replyThisWeek'
  | 'replyContains';

export interface FilterCondition {
  id: string;
  columnId?: string; // Legacy field (deprecated but maintained for compatibility)
  target: FilterTarget; // New unified approach
  operator: FilterOperator;
  value: string;
}

export interface CustomFilter {
  id: string;
  tableId: string; // Filter belongs to a specific table
  name: string;
  conditions: FilterCondition[];
}

// --- CSV Import Types ---

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  validatedRows?: Record<string, any>[];
}

// --- CSV Parsing Functions ---

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  const result: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }

  return result;
}

function normalizeDate(match: RegExpMatchArray, format: RegExp): string {
  // Detect format based on regex pattern
  const pattern = format.source;

  if (pattern.includes('4})-')) {
    // YYYY-MM-DD
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  } else if (pattern.includes('2}\\/')) {
    // MM/DD/YYYY
    return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  } else if (pattern.includes('2}\\.')) {
    // DD.MM.YYYY
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  } else if (pattern.includes('년')) {
    // YYYY년 MM월 DD일
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }

  return '';
}

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split('-').map(Number);

  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Check for valid day in month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const maxDays = month === 2 && isLeapYear ? 29 : daysInMonth[month - 1];

  return day <= maxDays;
}

export function parseFlexibleDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  // Date formats to try
  const formats: RegExp[] = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,            // YYYY-MM-DD
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,          // MM/DD/YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,          // DD.MM.YYYY
    /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일$/, // YYYY년 MM월 DD일
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const normalized = normalizeDate(match, format);
      if (isValidDate(normalized)) {
        return normalized;
      }
    }
  }

  // Fallback to Date.parse
  const timestamp = Date.parse(dateStr);
  if (!isNaN(timestamp)) {
    const date = new Date(timestamp);
    // Check if it's not an invalid date from Date.parse
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return null;
}

interface ValidatorResult {
  isValid: boolean;
  value?: any;
  error?: string;
  warning?: string;
}

const validators: Record<ColumnType, (value: string) => ValidatorResult> = {
  [ColumnType.TEXT]: (value: string): ValidatorResult => ({
    isValid: true,
    value: value || '',
  }),

  [ColumnType.LONG_TEXT]: (value: string): ValidatorResult => ({
    isValid: true,
    value: value || '',
  }),

  [ColumnType.NUMBER]: (value: string): ValidatorResult => {
    const trimmed = value.trim();
    if (trimmed === '') {
      return { isValid: false, error: '숫자가 필요합니다' };
    }
    const num = Number(trimmed);
    if (isNaN(num)) {
      return { isValid: false, error: '숫자가 아닙니다' };
    }
    return { isValid: true, value: num.toString() };
  },

  [ColumnType.DATE_AUTO]: (): ValidatorResult => ({
    isValid: true,
    value: new Date().toISOString().split('T')[0],
  }),

  [ColumnType.DATE_MANUAL]: (value: string): ValidatorResult => {
    const parsed = parseFlexibleDate(value);
    if (!parsed) {
      return { isValid: false, error: '날짜 형식이 올바르지 않습니다' };
    }
    return { isValid: true, value: parsed };
  },

  [ColumnType.TIME_AUTO]: (): ValidatorResult => ({
    isValid: true,
    value: new Date().toTimeString().substring(0, 5),
  }),

  [ColumnType.TIME_MANUAL]: (value: string): ValidatorResult => {
    const trimmed = value.trim();
    if (trimmed === '') {
      return { isValid: false, error: '시간이 필요합니다' };
    }

    const timeRegex = /^(\d{1,2}):(\d{2})$/;
    const match = trimmed.match(timeRegex);

    if (!match) {
      return { isValid: false, error: '시간 형식이 올바르지 않습니다 (HH:MM)' };
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return { isValid: false, error: '유효하지 않은 시간입니다' };
    }

    return {
      isValid: true,
      value: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    };
  },

  [ColumnType.YMD_AUTO]: (): ValidatorResult => ({
    isValid: true,
    value: new Date().toISOString().split('T')[0],
  }),

  [ColumnType.YMD_MANUAL]: (value: string): ValidatorResult => {
    const parsed = parseFlexibleDate(value);
    if (!parsed) {
      return { isValid: false, error: '년월일 형식이 올바르지 않습니다' };
    }
    return { isValid: true, value: parsed };
  },

  [ColumnType.CHECKLIST]: (): ValidatorResult => ({
    isValid: true,
    value: false,
  }),

  [ColumnType.CATEGORY]: (value: string): ValidatorResult => ({
    isValid: true,
    value: value || '',
  }),
};

export function validateCSVData(csvRows: string[][], tableColumns: Column[]): ValidationResult {
  if (csvRows.length === 0) {
    return { isValid: false, errors: ['CSV 파일이 비어있습니다'] };
  }

  const [headers, ...dataRows] = csvRows;

  if (headers.length === 0) {
    return { isValid: false, errors: ['CSV 헤더가 없습니다'] };
  }

  // 1. Validate column matching
  const headerSet = new Set(headers);
  const missingColumns = tableColumns
    .filter(col => !headerSet.has(col.name))
    .map(col => col.name);

  if (missingColumns.length > 0) {
    return {
      isValid: false,
      errors: [`필수 컬럼 누락: ${missingColumns.join(', ')}`],
    };
  }

  // 2. Create column index map
  const columnMap: Record<string, { index: number; type: ColumnType }> = {};
  tableColumns.forEach(col => {
    const index = headers.indexOf(col.name);
    if (index !== -1) {
      columnMap[col.id] = { index, type: col.type };
    }
  });

  // 3. Validate each row
  const errors: string[] = [];
  const validatedRows: Record<string, any>[] = [];

  dataRows.forEach((row, rowIndex) => {
    const rowErrors: string[] = [];
    const validatedData: Record<string, any> = {};

    for (const col of tableColumns) {
      const { index, type } = columnMap[col.id];
      const rawValue = row[index] || '';
      const result = validators[type](rawValue);

      if (!result.isValid) {
        rowErrors.push(`행 ${rowIndex + 2}, 컬럼 '${col.name}': ${result.error}`);
      } else {
        validatedData[col.id] = result.value;
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validatedRows.push(validatedData);
    }
  });

  // Strict validation: fail if any error
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, validatedRows };
}

