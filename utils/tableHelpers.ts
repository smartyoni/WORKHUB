import { TableDefinition, ColumnType } from '../types';
import { TODAY_TABLE_NAMES } from '../constants/app';

/**
 * Get the ID of the TODAY table from a list of tables
 * Returns null if no TODAY table is found
 */
export const getTodayTableId = (tables: TableDefinition[]): string | null => {
  return tables.find(t => TODAY_TABLE_NAMES.includes(t.name))?.id || null;
};

/**
 * Sort tables to put TODAY table first, followed by other tables
 * Preserves original order for non-TODAY tables
 */
export const sortTablesByTodayFirst = (tables: TableDefinition[]): TableDefinition[] => {
  const todayTable = tables.find(t => TODAY_TABLE_NAMES.includes(t.name));
  const otherTables = tables.filter(t => !TODAY_TABLE_NAMES.includes(t.name));
  return todayTable ? [todayTable, ...otherTables] : tables;
};

/**
 * Get all dates from TODAY table grouped and organized
 * Returns recent dates (within 3 days) and older dates grouped by month
 */
export const getTodayTableDates = (
  activeTable: TableDefinition | undefined,
  todayTableId: string | null,
  activeTableId: string
): {
  recent: { date: string; displayDate: string; count: number }[];
  monthGroups: { monthKey: string; monthDisplay: string; dates: { date: string; displayDate: string; count: number }[] }[];
} => {
  if (!activeTable || !todayTableId || activeTableId !== todayTableId) {
    return { recent: [], monthGroups: [] };
  }

  // Get all unique dates from col-1 and count them
  const dateMap = new Map<string, number>();
  activeTable.rows.forEach(row => {
    const dateStr = row['col-1'] as string;
    if (dateStr) {
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    }
  });

  // Convert to array and format
  const allDates = Array.from(dateMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateStr, count]) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const displayDate = `${year}년 ${month}월 ${day}일`;
      return { date: dateStr, displayDate, count, year, month, day };
    });

  // Get today's date
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayDate = new Date(todayStr);

  // Separate recent (within 3 days) and older dates
  const recent: typeof allDates = [];
  const older: typeof allDates = [];

  allDates.forEach(dateItem => {
    const itemDate = new Date(`${dateItem.year}-${String(dateItem.month).padStart(2, '0')}-${String(dateItem.day).padStart(2, '0')}`);
    const diffTime = todayDate.getTime() - itemDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    // 최근 3일 (오늘, 어제, 그그제): diffDays가 0, 1, 2
    if (diffDays >= 0 && diffDays <= 2) {
      recent.push(dateItem);
    } else {
      older.push(dateItem);
    }
  });

  // Sort recent dates: today first, then yesterday, then day before
  recent.sort((a, b) => {
    const aDate = new Date(`${a.year}-${String(a.month).padStart(2, '0')}-${String(a.day).padStart(2, '0')}`);
    const bDate = new Date(`${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`);
    return bDate.getTime() - aDate.getTime();
  });

  // Group older dates by year-month
  const monthMap = new Map<string, typeof older>();
  older.forEach(dateItem => {
    const monthKey = `${dateItem.year}-${String(dateItem.month).padStart(2, '0')}`;
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(dateItem);
  });

  // Convert month groups to array and sort by date descending
  const monthGroups = Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, dates]) => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthDisplay = `${year}년 ${month}월`;

      // Sort dates within month by date descending
      const sortedDates = dates.sort((a, b) => {
        const aDate = new Date(`${a.year}-${String(a.month).padStart(2, '0')}-${String(a.day).padStart(2, '0')}`);
        const bDate = new Date(`${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`);
        return bDate.getTime() - aDate.getTime();
      });

      return {
        monthKey,
        monthDisplay,
        dates: sortedDates.map(d => ({ date: d.date, displayDate: d.displayDate, count: d.count }))
      };
    });

  return {
    recent: recent.map(d => ({ date: d.date, displayDate: d.displayDate, count: d.count })),
    monthGroups
  };
};

/**
 * Determine which column should be used for sidebar filtering
 * For TODAY table: returns col-1 (date column)
 * For other tables: returns the first CATEGORY column if it exists
 */
export const getSidebarColumnId = (
  activeTable: TableDefinition | undefined,
  activeTableId: string,
  todayTableId: string | null
): string | null => {
  if (!activeTable) return null;

  // TODAY 테이블: 기록일 (col-1)
  if (activeTableId === todayTableId) {
    return 'col-1';
  }

  // 다른 테이블: 첫 번째 카테고리 칼럼
  const categoryCol = activeTable.columns.find(c => c.type === ColumnType.CATEGORY);
  return categoryCol?.id || null;
};
