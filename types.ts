
export enum ColumnType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE_AUTO = 'DATE_AUTO',     // Automatically set to current date on row creation
  DATE_MANUAL = 'DATE_MANUAL', // Manually entered by user
  TIME_AUTO = 'TIME_AUTO',     // Automatically set to current time on row creation
  TIME_MANUAL = 'TIME_MANUAL', // Manually entered by user
}

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  width: number;
  isHidden?: boolean;
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

export interface RowData {
  id: string;
  [key: string]: any; // Dynamic column data
  _memo: string;
  _category: string;
  _checklists: ChecklistItem[];
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
}

export interface BookmarkGroup {
  id: string;
  name: string; // e.g. "호실관리", "계약서작성"
  color: string; // Tailwind class mostly
  items: Bookmark[];
}

export interface AppCategory {
  id: string;
  name: string;
}

// --- Filter Types ---

export type FilterTargetType = 'column' | 'category' | 'memo' | 'checklist' | 'reply';

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
