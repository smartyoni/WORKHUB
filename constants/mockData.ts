import { BookmarkGroup, TableDefinition, ColumnType } from '../types';

/**
 * Initial bookmark groups for the application
 * These are the default bookmarks displayed on startup
 */
export const initialBookmarkGroups: BookmarkGroup[] = [
  {
    id: 'group-1',
    name: '영역1',
    color: '#FBBF24',
    area: 1,
    items: [
      { id: '1', name: '호실관리', url: '' },
      { id: '2', name: '호실수정', url: '' },
      { id: '3', name: '호실시트', url: '' },
      { id: '4', name: '북클립바', url: '' },
      { id: '5', name: '네이버웍스', url: '' },
      { id: '6', name: '주차정산', url: '' },
    ],
  },
  {
    id: 'group-2',
    name: '영역2',
    color: '#3B82F6',
    area: 2,
    items: [
      { id: '1', name: '등기소', url: '' },
      { id: '2', name: '정부24', url: '' },
      { id: '3', name: '토지이음', url: '' },
      { id: '4', name: '정보광장', url: '' },
    ],
  },
  {
    id: 'group-3',
    name: '영역3',
    color: '#F97316',
    area: 3,
    items: [
      { id: '1', name: '원부장님계약', url: '' },
      { id: '2', name: '건강보험', url: '' },
      { id: '3', name: '네이버메일', url: '' },
      { id: '4', name: 'KB시세', url: '' },
    ],
  },
  {
    id: 'group-4',
    name: '영역4',
    color: '#10B981',
    area: 4,
    items: [
      { id: '1', name: '깃허브', url: '' },
      { id: '2', name: 'AI스튜디오', url: '' },
      { id: '3', name: '구글시트', url: '' },
      { id: '4', name: 'GPT', url: '' },
    ],
  },
];

/**
 * Initial tables before sorting
 * Tables should be sorted to put TODAY table first before use
 */
export const initialTablesUnsorted: TableDefinition[] = [
  {
    id: 'table-2',
    name: 'TODAY',
    columns: [
      { id: 'col-1', name: '기록일', type: ColumnType.DATE_AUTO, width: 120 },
      { id: 'col-2', name: '제목', type: ColumnType.TEXT, width: 200 },
      { id: 'col-3', name: '기록시각', type: ColumnType.TIME_AUTO, width: 120 },
    ],
    rows: Array.from({ length: 8 }).map((_, i) => ({
      id: `row-today-${i}`,
      'col-1': `2025-12-${String(2 - Math.floor(i / 2)).padStart(2, '0')}`,
      'col-2': i === 0 ? '아침 회의' : i === 1 ? '메일 응답' : i === 2 ? '프로젝트 진행' : i === 3 ? '고객 면담' : i === 4 ? '사무 처리' : i === 5 ? '데이터 정리' : i === 6 ? '회의록 작성' : '일일 보고',
      'col-3': `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${String(i * 10).padStart(2, '0')}`,
      _memo: '',
      _checklists: [],
      _ganttTasks: [],
      _notes: '',
    })),
  },
];
