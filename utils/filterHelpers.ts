import { RowData, FilterCondition, FilterOperator, FilterTargetType } from '../types';
import { UNCATEGORIZED_MARKER } from '../constants/app';

export const evaluateOperator = (cellValue: string, operator: FilterOperator, condValue: string): boolean => {
  switch (operator) {
    case 'contains': return cellValue.includes(condValue);
    case 'equals': return cellValue === condValue;
    case 'startsWith': return cellValue.startsWith(condValue);
    case 'greaterThan': return cellValue > condValue;
    case 'lessThan': return cellValue < condValue;
    default: return true;
  }
};

export const evaluateColumnFilter = (row: RowData, condition: FilterCondition): boolean => {
  const value = String(row[condition.target.field || ''] || '').toLowerCase();
  const condValue = condition.value.toLowerCase();
  return evaluateOperator(value, condition.operator, condValue);
};

export const evaluateChecklistFilter = (row: RowData, condition: FilterCondition): boolean => {
  const checklists = row._checklists || [];

  switch (condition.operator) {
    case 'hasChecked':
      return checklists.some(item => item.isChecked);
    case 'hasUnchecked':
      return checklists.some(item => !item.isChecked);
    case 'allChecked':
      return checklists.length > 0 && checklists.every(item => item.isChecked);
    case 'checklistContains':
      return checklists.some(item =>
        item.text.toLowerCase().includes(condition.value.toLowerCase())
      );
    default:
      return true;
  }
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo && date <= today;
};

export const evaluateReplyFilter = (row: RowData, condition: FilterCondition): boolean => {
  const checklists = row._checklists || [];
  const allReplies = checklists.flatMap(item => item.replies);

  switch (condition.operator) {
    case 'hasReplies':
      return allReplies.length > 0;
    case 'noReplies':
      return allReplies.length === 0;
    case 'replyToday':
      return allReplies.some(reply => isToday(new Date(reply.createdAt)));
    case 'replyThisWeek':
      return allReplies.some(reply => isThisWeek(new Date(reply.createdAt)));
    case 'replyContains':
      return allReplies.some(reply =>
        reply.text.toLowerCase().includes(condition.value.toLowerCase())
      );
    default:
      return true;
  }
};

export const migrateFilterCondition = (condition: any): FilterCondition => {
  // Legacy filter format support
  if (condition.columnId) {
    return {
      ...condition,
      target: {
        type: 'column',
        field: condition.columnId
      }
    };
  }
  return condition;
};
