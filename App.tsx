import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import DetailPanel from './components/DetailPanel';
import InstallPrompt from './components/InstallPrompt';
import { TableDefinition, Column, ColumnType, RowData, BookmarkGroup, CustomFilter, FilterCondition, FilterOperator, FilterTarget, FilterTargetType, ValidationResult, parseCSV, validateCSVData, CategoryGroup, CategoryItem } from './types';
import { initDB as initFirebaseDB, saveBookmarks, saveFilters, loadAllData as loadAllDataFromFirebase, saveTables as saveTablesFirebase, migrateTableNameToTODAY, saveCategories } from './firebase';
import {
  Plus,
  Search,
  LayoutGrid,
  Settings,
  Filter,
  Inbox,
  MoreVertical,
  Table as TableIcon,
  Trash2,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  Edit2,
  EyeOff,
  RefreshCw,
  Lock,
  Unlock,
  ListFilter,
  CheckCircle2,
  Circle,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  Menu
} from 'lucide-react';

// --- 색상 팔레트 정의 (선명하고 생생한 색상) ---
const BOOKMARK_COLORS = [
  { id: 'blue', name: '파랑', hex: '#3B82F6' },
  { id: 'orange', name: '주황', hex: '#F97316' },
  { id: 'green', name: '초록', hex: '#10B981' },
  { id: 'pink', name: '분홍', hex: '#EC4899' },
  { id: 'purple', name: '보라', hex: '#A855F7' },
  { id: 'yellow', name: '노랑', hex: '#FBBF24' },
  { id: 'lime', name: '라임', hex: '#84CC16' },
  { id: 'cyan', name: '하늘', hex: '#06B6D4' },
  { id: 'gray', name: '회색', hex: '#9CA3AF' },
];

// --- 미분류 카테고리 마커 ---
const UNCATEGORIZED_MARKER = '__UNCATEGORIZED__';

// --- MOCK DATA INITIALIZATION ---
const initialBookmarkGroups: BookmarkGroup[] = [
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

// --- CONSTANTS ---
const TODAY_TABLE_NAMES = ['TODAY', '오늘 기록'];

const getTodayTableId = (tables: TableDefinition[]): string | null => {
  return tables.find(t => TODAY_TABLE_NAMES.includes(t.name))?.id || null;
};

const sortTablesByTodayFirst = (tables: TableDefinition[]): TableDefinition[] => {
  const todayTable = tables.find(t => TODAY_TABLE_NAMES.includes(t.name));
  const otherTables = tables.filter(t => !TODAY_TABLE_NAMES.includes(t.name));
  return todayTable ? [todayTable, ...otherTables] : tables;
};

const initialTablesUnsorted: TableDefinition[] = [
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

// TODAY 테이블이 항상 첫 번째가 되도록 정렬
const initialTables = sortTablesByTodayFirst(initialTablesUnsorted);

export default function App() {
  const [bookmarks, setBookmarks] = useState<BookmarkGroup[]>([]);
  const [tables, setTables] = useState<TableDefinition[]>([]);
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isDBLoaded, setIsDBLoaded] = useState(false);
  const [todayTableId, setTodayTableId] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<string>(() => {
    // localStorage에서 이전 선택 테이블 복원
    const saved = localStorage.getItem('activeTableId');
    return saved || '';
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [checklistStates, setChecklistStates] = useState<Record<string, boolean>>({});

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [isHiddenColModalOpen, setIsHiddenColModalOpen] = useState(false);

  // New Table Form State
  const [newTableName, setNewTableName] = useState('');
  const [newTableColumns, setNewTableColumns] = useState<Omit<Column, 'id'>[]>([
      { name: '제목', type: ColumnType.TEXT, width: 180 }
  ]);

  // New Row Form State
  const [rowFormData, setRowFormData] = useState<Record<string, any>>({});

  // Column Resizing State
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [lastColId, setLastColId] = useState<string | null>(null);
  const [lastColStartWidth, setLastColStartWidth] = useState(0);

  // Column Menu State
  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{x: number, y: number} | null>(null);
  
  // Column Edit State
  const [isColEditModalOpen, setIsColEditModalOpen] = useState(false);
  const [editingColState, setEditingColState] = useState<Column | null>(null);

  // Table Deletion Lock State
  const [isDeleteLocked, setIsDeleteLocked] = useState(true);

  // --- FILTER STATE ---
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // --- TODAY TABLE DATE FILTER STATE ---
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // --- MOBILE SIDEBAR STATE ---
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- CATEGORY FILTER STATE ---
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<{ columnId: string; categoryName: string } | null>(null);

  // Filter Creation Form State
  const [newFilterName, setNewFilterName] = useState('');

  // --- BOOKMARK EDIT STATE ---
  const [isBookmarkEditModalOpen, setIsBookmarkEditModalOpen] = useState(false);
  const [editingBookmarkGroup, setEditingBookmarkGroup] = useState<BookmarkGroup | null>(null);
  const [bookmarkEditForm, setBookmarkEditForm] = useState({
    name: '',
    color: '#3B82F6',
    area: 1 as number,
  });
  const [bookmarkContextMenu, setBookmarkContextMenu] = useState<{
    groupId: string;
    x: number;
    y: number;
  } | null>(null);

  // Add Column Modal State
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<ColumnType>(ColumnType.TEXT);
  const [newFilterConditions, setNewFilterConditions] = useState<FilterCondition[]>([]);

  // Save Status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // 데이터 소스 구분: 초기값과 실제 로드된 데이터를 구분하여 자동 저장 안전화
  const [dataSource, setDataSource] = useState<'initial' | 'loaded'>('initial');

  // --- TABLE RENAME STATE ---
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [editingTableName, setEditingTableName] = useState('');

  // --- CUSTOM CONFIRM MODAL STATE ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);

  // --- MOBILE STATE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [bookmarkSlideIndex, setBookmarkSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isDetailPanelModal, setIsDetailPanelModal] = useState(false);

  // --- CURRENT TIME STATE ---
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- CSV UPLOAD STATE ---
  const [isCSVUploadModalOpen, setIsCSVUploadModalOpen] = useState(false);
  const [csvValidationResult, setCSVValidationResult] = useState<ValidationResult | null>(null);
  const [csvPreviewData, setCSVPreviewData] = useState<any[] | null>(null);

  const activeTable = tables.find(t => t.id === activeTableId);
  const visibleColumns = activeTable?.columns.filter(c => !c.isHidden) || [];
  const hiddenColumns = activeTable?.columns.filter(c => c.isHidden) || [];

  // Determine which column is used for sidebar filtering
  const getSidebarColumnId = (): string | null => {
    if (!activeTable) return null;
    // TODAY 테이블: 기록일 (col-1)
    if (activeTableId === todayTableId) {
      return 'col-1';
    }
    // 다른 테이블: 첫 번째 카테고리 칼럼
    const categoryCol = activeTable.columns.find(c => c.type === ColumnType.CATEGORY);
    return categoryCol?.id || null;
  };

  // Get Filters for current table
  const currentTableFilters = customFilters.filter(f => f.tableId === activeTableId);

  // --- TODAY TABLE DATE HELPERS ---
  const getTodayTableDates = (): {
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

  // --- CURRENT TIME UPDATE ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 날짜와 시간 포맷 함수
  const formatCurrentDateTime = (): string => {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const year = currentTime.getFullYear();
    const month = currentTime.getMonth() + 1;
    const date = currentTime.getDate();
    const dayName = days[currentTime.getDay()];
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');

    return `${year}년 ${month}월 ${date}일 ${hours}:${minutes} ${dayName}`;
  };

  // --- FIREBASE INITIALIZATION & DATA LOADING ---
  useEffect(() => {
    const loadDataFromFirebase = async () => {
      try {
        await initFirebaseDB(); // Firebase 초기화

        // 테이블 이름 마이그레이션 (오늘기록 → TODAY)
        await migrateTableNameToTODAY();

        const firebaseData = await loadAllDataFromFirebase();

        // 데이터 마이그레이션 헬퍼 함수
        const migrateTableData = (tables: TableDefinition[]): TableDefinition[] => {
          return tables.map(table => ({
            ...table,
            rows: table.rows.map(row => ({
              ...row,
              _checklists: row._checklists || [],
              _ganttTasks: row._ganttTasks || []
            }))
          }));
        };

        // 북마크 마이그레이션: color와 area 속성 추가
        const migrateBookmarks = (bookmarks: BookmarkGroup[]): BookmarkGroup[] => {
          const colorMap: Record<string, string> = {
            '호실관리': '#FBBF24',
            '계약서작성': '#3B82F6',
            '사무실관리,시세조회': '#F97316',
            '개발도구 모음': '#10B981'
          };
          const areaMap: Record<string, number> = {
            '호실관리': 1,
            '계약서작성': 2,
            '사무실관리,시세조회': 3,
            '개발도구 모음': 4
          };
          const nameMap: Record<string, string> = {
            '호실관리': '영역1',
            '계약서작성': '영역2',
            '사무실관리,시세조회': '영역3',
            '개발도구 모음': '영역4'
          };
          return bookmarks.map((bookmark, index) => ({
            ...bookmark,
            name: nameMap[bookmark.name] || bookmark.name,
            color: bookmark.color || colorMap[bookmark.name] || BOOKMARK_COLORS[index % BOOKMARK_COLORS.length].hex,
            area: bookmark.area || areaMap[bookmark.name] || (index + 1)
          }));
        };

        // 데이터 설정
        const migratedTables = firebaseData.tables.length > 0 ? migrateTableData(firebaseData.tables) : initialTables;
        const sortedTables = sortTablesByTodayFirst(migratedTables);
        const migratedBookmarks = firebaseData.bookmarks.length > 0 ? migrateBookmarks(firebaseData.bookmarks) : initialBookmarkGroups;
        setTables(sortedTables);

        // TODAY 테이블 ID 설정
        const todayId = getTodayTableId(sortedTables);
        setTodayTableId(todayId);

        // 저장된 테이블 ID가 현재 테이블 목록에 없으면 TODAY 테이블로 설정
        const savedTableId = localStorage.getItem('activeTableId');
        if (savedTableId && !sortedTables.find(t => t.id === savedTableId)) {
          if (todayId) {
            setActiveTableId(todayId);
            localStorage.setItem('activeTableId', todayId);
          }
        } else if (!savedTableId && todayId) {
          setActiveTableId(todayId);
        }
        setBookmarks(migratedBookmarks);

        setCustomFilters(firebaseData.filters || []);
        setCategories(firebaseData.categories || []);

        // ✅ 데이터 소스 결정 (초기값 vs 실제 데이터)
        const hasRealData = firebaseData.tables.length > 0 || firebaseData.bookmarks.length > 0;
        setDataSource(hasRealData ? 'loaded' : 'initial');

        setIsDBLoaded(true);
      } catch (error) {
        console.error('Failed to load data from Firebase:', error);
        // 최종 폴백: 초기값 사용
        const sortedInitialTables = sortTablesByTodayFirst(initialTables);
        setTables(sortedInitialTables);
        setBookmarks(initialBookmarkGroups);

        setCustomFilters([]);

        // TODAY 테이블 ID 설정
        const todayId = getTodayTableId(sortedInitialTables);
        setTodayTableId(todayId);

        // === DEBUG: All Tables ===
        console.log('=== DEBUG: All Tables ===');
        sortedInitialTables.forEach(t => console.log(`  - ID: ${t.id}, Name: "${t.name}"`));

        // === DEBUG: TODAY Table Detection ===
        console.log('=== DEBUG: TODAY Table Detection ===');
        console.log('  TODAY_TABLE_NAMES:', TODAY_TABLE_NAMES);
        console.log('  Found todayTableId:', todayId);
        console.log('  activeTableId:', activeTableId);

        // 저장된 테이블 ID가 초기 테이블 목록에 없으면 TODAY 테이블로 설정
        const savedTableId = localStorage.getItem('activeTableId');
        if (savedTableId && !sortedInitialTables.find(t => t.id === savedTableId)) {
          if (todayId) {
            setActiveTableId(todayId);
            localStorage.setItem('activeTableId', todayId);
          }
        } else if (!savedTableId && todayId) {
          setActiveTableId(todayId);
        }

        setDataSource('initial');
        setIsDBLoaded(true);
      }
    };

    loadDataFromFirebase();
  }, []);

  // --- MOBILE WINDOW RESIZE LISTENER ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset lock and filter when table changes, and save activeTableId to localStorage
  useEffect(() => {
    setIsDeleteLocked(true);
    setActiveFilterId(null);

    // TODAY 테이블일 때는 기본으로 오늘 날짜 필터 적용
    if (activeTableId === todayTableId && todayTableId) {
      const today = new Date().toISOString().split('T')[0];
      setActiveDateFilter(today);
    } else {
      setActiveDateFilter(null);
    }

    setActiveCategoryFilter(null);
    localStorage.setItem('activeTableId', activeTableId);
  }, [activeTableId, todayTableId]);

  // --- MOBILE TOUCH HANDLERS ---
  const handleBookmarkTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleBookmarkTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && bookmarkSlideIndex < bookmarks.length - 1) {
        setBookmarkSlideIndex(bookmarkSlideIndex + 1);
      } else if (diff < 0 && bookmarkSlideIndex > 0) {
        setBookmarkSlideIndex(bookmarkSlideIndex - 1);
      }
    }
  };

  // --- FILTER HELPER FUNCTIONS ---

  // Automatic migration for existing filters
  const migrateFilterCondition = (condition: FilterCondition): FilterCondition => {
    if (condition.columnId && !condition.target) {
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

  // Helper for generic operator evaluation (used by column filters)
  const evaluateOperator = (cellValue: string, operator: FilterOperator, condValue: string): boolean => {
    switch (operator) {
      case 'contains': return cellValue.includes(condValue);
      case 'equals': return cellValue === condValue;
      case 'startsWith': return cellValue.startsWith(condValue);
      case 'greaterThan': return cellValue > condValue;
      case 'lessThan': return cellValue < condValue;
      default: return true;
    }
  };

  const evaluateColumnFilter = (row: RowData, condition: FilterCondition): boolean => {
    const value = String(row[condition.target.field || ''] || '').toLowerCase();
    const condValue = condition.value.toLowerCase();
    return evaluateOperator(value, condition.operator, condValue);
  };

const evaluateChecklistFilter = (row: RowData, condition: FilterCondition): boolean => {
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

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 문자열 날짜(YYYY-MM-DD)와 오늘 날짜 비교
  const isDateToday = (dateStr: string): boolean => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  };

  // 문자열 날짜(YYYY-MM-DD)와 어제 날짜 비교
  const isDateYesterday = (dateStr: string): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    return dateStr === yesterdayStr;
  };

  const isThisWeek = (date: Date): boolean => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo && date <= today;
  };

  const evaluateReplyFilter = (row: RowData, condition: FilterCondition): boolean => {
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

  // --- FILTER LOGIC ---
  const getFilteredRows = () => {
      if (!activeTable) return [];

      let rows = activeTable.rows;

      // Apply custom filter first
      if (activeFilterId) {
          const filter = customFilters.find(f => f.id === activeFilterId);
          if (filter) {
              rows = rows.filter(row => {
                  // AND Logic: All conditions must be true
                  return filter.conditions.every(cond => {
                      // Migrate legacy filters automatically
                      const migratedCondition = migrateFilterCondition(cond);

                      // Route to appropriate evaluator based on target type
                      switch (migratedCondition.target.type) {
                          case 'column':
                              return evaluateColumnFilter(row, migratedCondition);
                          case 'checklist':
                              return evaluateChecklistFilter(row, migratedCondition);
                          case 'reply':
                              return evaluateReplyFilter(row, migratedCondition);
                          default:
                              return true;
                      }
                  });
              });
          }
      }

      // Apply date filter for TODAY table
      if (activeDateFilter && activeTableId === todayTableId) {
          rows = rows.filter(row => row['col-1'] === activeDateFilter);
      }

      // Apply category filter
      if (activeCategoryFilter && activeTable) {
          if (activeCategoryFilter.categoryName === UNCATEGORIZED_MARKER) {
              // Filter for uncategorized rows (empty, null, or undefined)
              rows = rows.filter(row => {
                  const value = row[activeCategoryFilter.columnId];
                  return value === '' || value === null || value === undefined;
              });
          } else {
              // Normal category filter
              rows = rows.filter(row => row[activeCategoryFilter.columnId] === activeCategoryFilter.categoryName);
          }
      }

      return rows;
  };

  // Helper function to count uncategorized rows for a category column
  const getUncategorizedCount = (columnId: string): number => {
    if (!activeTable) return 0;
    return activeTable.rows.filter(row => {
      const value = row[columnId];
      return value === '' || value === null || value === undefined;
    }).length;
  };

  const filteredRows = useMemo(() => getFilteredRows(), [activeTable, activeFilterId, customFilters, activeDateFilter, activeTableId, activeCategoryFilter]);

  // --- AUTO SAVE TO FIREBASE ---
  // ✅ SAFETY: dataSource가 'loaded'인 경우만 저장 (초기값 저장 방지)

  // Save tables to Firebase whenever they change
  useEffect(() => {
    if (isDBLoaded && tables.length > 0 && dataSource === 'loaded') {
      saveTablesFirebase(tables).catch(error => console.error('Failed to save tables to Firebase:', error));
    }
  }, [tables, isDBLoaded, dataSource]);

  // Save bookmarks to Firebase whenever they change
  useEffect(() => {
    if (isDBLoaded && bookmarks.length > 0 && dataSource === 'loaded') {
      saveBookmarks(bookmarks).catch(error => console.error('Failed to save bookmarks to Firebase:', error));
    }
  }, [bookmarks, isDBLoaded, dataSource]);

  // Save filters to Firebase whenever they change
  useEffect(() => {
    if (isDBLoaded && dataSource === 'loaded') {
      saveFilters(customFilters).catch(error => console.error('Failed to save filters to Firebase:', error));
    }
  }, [customFilters, isDBLoaded, dataSource]);

  // Save categories to Firebase whenever they change
  useEffect(() => {
    if (isDBLoaded && dataSource === 'loaded') {
      saveCategories(categories).catch(error => console.error('Failed to save categories to Firebase:', error));
    }
  }, [categories, isDBLoaded, dataSource]);

  const openFilterModal = () => {
      setNewFilterName('');
      setNewFilterConditions([{
        id: Date.now().toString(),
        columnId: visibleColumns[0]?.id || '',
        target: {
          type: 'column',
          field: visibleColumns[0]?.id || ''
        },
        operator: 'contains',
        value: ''
      }]);
      setIsFilterModalOpen(true);
  };

  const saveFilter = () => {
      if (!newFilterName.trim() || !activeTable) return;
      const newFilter: CustomFilter = {
          id: Date.now().toString(),
          tableId: activeTable.id,
          name: newFilterName,
          conditions: newFilterConditions.filter(c => c.target && c.value !== undefined)
      };
      setCustomFilters([...customFilters, newFilter]);
      setIsFilterModalOpen(false);
      setActiveFilterId(newFilter.id);
  };

  const deleteFilter = (e: React.MouseEvent, filterId: string, filterName: string) => {
      e.stopPropagation();
      setConfirmModalMessage(`이 필터 '${filterName}'를(을) 삭제하시겠습니까?`);
      setConfirmModalAction(() => () => {
          setCustomFilters(prev => prev.filter(f => f.id !== filterId));
          if (activeFilterId === filterId) setActiveFilterId(null);
          setIsConfirmModalOpen(false);
      });
      setIsConfirmModalOpen(true);
  }

  // --- FILTER UI HELPER FUNCTIONS ---

  const getOperatorsForTargetType = (type: FilterTargetType): Array<{value: string, label: string}> => {
    switch (type) {
      case 'column':
        return [
          { value: 'contains', label: '포함' },
          { value: 'equals', label: '일치' },
          { value: 'startsWith', label: '시작' },
          { value: 'greaterThan', label: '크다 (>)' },
          { value: 'lessThan', label: '작다 (<)' }
        ];

      case 'memo':
        return [
          { value: 'contains', label: '포함' },
          { value: 'isEmpty', label: '비어있음' },
          { value: 'isNotEmpty', label: '내용있음' }
        ];

      case 'checklist':
        return [
          { value: 'hasChecked', label: '체크된 항목있음' },
          { value: 'hasUnchecked', label: '미체크 항목있음' },
          { value: 'allChecked', label: '모두 완료' },
          { value: 'checklistContains', label: '텍스트 포함' }
        ];

      case 'reply':
        return [
          { value: 'hasReplies', label: '답글있음' },
          { value: 'noReplies', label: '답글없음' },
          { value: 'replyToday', label: '오늘 작성' },
          { value: 'replyThisWeek', label: '이번주 작성' },
          { value: 'replyContains', label: '텍스트 포함' }
        ];

      default:
        return [];
    }
  };

  const requiresValue = (operator: FilterOperator): boolean => {
    const noValueOperators = [
      'isEmpty', 'isNotEmpty',
      'hasChecked', 'hasUnchecked', 'allChecked',
      'hasReplies', 'noReplies', 'replyToday', 'replyThisWeek'
    ];
    return !noValueOperators.includes(operator);
  };

  const getPlaceholder = (type: FilterTargetType, operator: FilterOperator): string => {
    switch (type) {
      case 'memo':
        return '메모 검색...';
      case 'checklist':
        return '체크리스트 텍스트...';
      case 'reply':
        return '답글 텍스트...';
      default:
        return '값 입력...';
    }
  };

  // --- ACTIONS ---

  const handleRowClick = (rowId: string) => {
    setSelectedRowId(rowId);
  };

  const updateRow = (updatedRow: RowData) => {
    setTables(prev => prev.map(table => {
      if (table.id !== activeTableId) return table;
      return {
        ...table,
        rows: table.rows.map(row => row.id === updatedRow.id ? updatedRow : row)
      };
    }));
  };

  const handleDeleteRow = (rowIdToDelete: string) => {
      if (!activeTable) return;

      setConfirmModalMessage(`'${activeTable.name}' 테이블에서 이 행을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
      setConfirmModalAction(() => () => { // Wrap the action in another function to avoid immediate execution
          const updatedRows = activeTable.rows.filter(row => row.id !== rowIdToDelete);
          setTables(prev => prev.map(t =>
              t.id === activeTable.id ? { ...t, rows: updatedRows } : t
          ));
          setSelectedRowId(null); // Close detail panel
          setIsConfirmModalOpen(false);
      });
      setIsConfirmModalOpen(true);
  };

  const handleMoveColumn = (colId: string, direction: 'left' | 'right') => {
      if (!activeTable) return;
      const currentIndex = activeTable.columns.findIndex(c => c.id === colId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= activeTable.columns.length) return;

      const newColumns = [...activeTable.columns];
      [newColumns[currentIndex], newColumns[newIndex]] = [newColumns[newIndex], newColumns[currentIndex]];

      setTables(prev => prev.map(t =>
          t.id === activeTable.id ? { ...t, columns: newColumns } : t
      ));
  };

  const handleMoveRow = (rowId: string, direction: 'up' | 'down') => {
      if (!activeTable) return;

      // 1. filteredRows에서 현재 행 찾기
      const filteredRows = getFilteredRows();
      const currentFilteredIndex = filteredRows.findIndex(r => r.id === rowId);
      if (currentFilteredIndex === -1) return;

      // 2. filteredRows에서 교환할 대상 인덱스 계산
      const newFilteredIndex = direction === 'up' ? currentFilteredIndex - 1 : currentFilteredIndex + 1;
      if (newFilteredIndex < 0 || newFilteredIndex >= filteredRows.length) return;

      // 3. 두 행의 전체 배열에서의 실제 인덱스 찾기
      const currentRow = filteredRows[currentFilteredIndex];
      const targetRow = filteredRows[newFilteredIndex];

      const currentActualIndex = activeTable.rows.findIndex(r => r.id === currentRow.id);
      const targetActualIndex = activeTable.rows.findIndex(r => r.id === targetRow.id);

      if (currentActualIndex === -1 || targetActualIndex === -1) return;

      // 4. 전체 배열에서 두 행의 위치 교환
      const newRows = [...activeTable.rows];
      [newRows[currentActualIndex], newRows[targetActualIndex]] =
          [newRows[targetActualIndex], newRows[currentActualIndex]];

      setTables(prev => prev.map(t =>
          t.id === activeTable.id ? { ...t, rows: newRows } : t
      ));
  };

  const handleMoveTable = (tableId: string, direction: 'left' | 'right') => {
      // TODAY 테이블은 이동 불가
      if (tableId === todayTableId) return;

      const currentIndex = tables.findIndex(t => t.id === tableId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

      // TODAY 테이블이 첫 번째이므로, newIndex가 0(TODAY) 또는 범위 밖이면 반환
      if (newIndex < 1 || newIndex >= tables.length) return;

      const newTables = [...tables];
      [newTables[currentIndex], newTables[newIndex]] = [newTables[newIndex], newTables[currentIndex]];

      setTables(newTables);
  };

  const handleAddColumn = () => {
      if (!newColumnName.trim() || !activeTable) return;

      const newColumn: Column = {
          id: `col-${Date.now()}`,
          name: newColumnName,
          type: newColumnType,
          width: 180
      };

      setTables(prev => prev.map(table => {
          if (table.id !== activeTableId) return table;

          // Add column to table
          const updatedTable = {
              ...table,
              columns: [...table.columns, newColumn],
              // Add empty cell for new column in all existing rows
              rows: table.rows.map(row => ({
                  ...row,
                  [newColumn.id]: ''
              }))
          };
          return updatedTable;
      }));

      // Reset form and close modal
      setNewColumnName('');
      setNewColumnType(ColumnType.TEXT);
      setIsAddColumnModalOpen(false);
  };

  const handleSaveTableOrder = async () => {
      try {
          setSaveStatus('saving');
          setSaveMessage('');

          // 테이블 순서를 Firebase에 저장
          await saveTablesFirebase(tables);

          setSaveStatus('success');
          setSaveMessage('테이블 순서가 저장되었습니다.');

          // 2초 후 메시지 제거
          setTimeout(() => {
              setSaveStatus('idle');
              setSaveMessage('');
          }, 2000);
      } catch (error) {
          setSaveStatus('error');
          setSaveMessage('저장에 실패했습니다.');
          console.error('Failed to save table order:', error);

          // 3초 후 메시지 제거
          setTimeout(() => {
              setSaveStatus('idle');
              setSaveMessage('');
          }, 3000);
      }
  };

  // --- BOOKMARK EDIT FUNCTIONS ---
  const handleBookmarkEditOpen = (group: BookmarkGroup) => {
    setEditingBookmarkGroup(group);
    setBookmarkEditForm({
      name: group.name,
      color: group.color,
      area: group.area || 1,
    });
    setIsBookmarkEditModalOpen(true);
    setBookmarkContextMenu(null);
  };

  const handleBookmarkSave = () => {
    if (!editingBookmarkGroup || !bookmarkEditForm.name.trim()) return;

    setBookmarks(
      bookmarks.map(group =>
        group.id === editingBookmarkGroup.id
          ? {
              ...group,
              name: bookmarkEditForm.name,
              color: bookmarkEditForm.color,
              area: bookmarkEditForm.area,
            }
          : group
      )
    );
    setIsBookmarkEditModalOpen(false);
    setEditingBookmarkGroup(null);
  };

  const handleBookmarkDelete = (groupId: string) => {
    setBookmarks(bookmarks.filter(group => group.id !== groupId));
    setBookmarkContextMenu(null);
  };

  const handleBookmarkContextMenu = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkContextMenu({
      groupId,
      x: e.clientX,
      y: e.clientY,
    });
  };


  const addTable = () => {
    if (!newTableName.trim()) return;
    const newTable: TableDefinition = {
      id: `table-${Date.now()}`,
      name: newTableName,
      columns: newTableColumns.map((c, idx) => ({ ...c, id: `col-${Date.now()}-${idx}` })),
      rows: []
    };
    // TODAY 테이블이 항상 첫 번째가 되도록 정렬 유지
    const sortedTables = sortTablesByTodayFirst([...tables, newTable]);
    setTables(sortedTables);
    setActiveTableId(newTable.id);
    setIsTableModalOpen(false);
    setNewTableName('');
    setNewTableColumns([{ name: '제목', type: ColumnType.TEXT, width: 180 }]);
  };

  const deleteTable = () => {
    if (!activeTable) {
        alert("현재 활성화된 테이블이 없습니다.");
        return;
    }

    // TODAY 테이블은 삭제 불가
    if (activeTable.id === todayTableId) {
        alert("'오늘 기록' 테이블은 고정되어 있어 삭제할 수 없습니다.");
        return;
    }

    if (isDeleteLocked) {
        alert("⚠️ 테이블 삭제가 잠겨있습니다.\n테이블 이름 옆 자물쇠 버튼을 눌러 잠금을 해제해주세요.");
        return;
    }

    if (tables.length <= 1) {
        alert("최소 하나의 테이블은 유지해야 합니다. 다른 테이블을 추가한 후 삭제해주세요.");
        return;
    }
    
    setConfirmModalMessage(`정말 '${activeTable.name}' 테이블을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 데이터가 영구히 삭제됩니다.`);
    setConfirmModalAction(() => () => { // Wrap the action in another function to avoid immediate execution
        const remainingTables = tables.filter(t => t.id !== activeTableId);
        setTables(remainingTables);
        setActiveTableId(remainingTables[0].id); // Safe due to tables.length check
        setSelectedRowId(null);
        setIsConfirmModalOpen(false); // Close modal after action
    });
    setIsConfirmModalOpen(true); // Open custom confirmation modal
  };

  // 테이블 이름 더블클릭으로 수정
  const handleTableNameDoubleClick = () => {
    if (!activeTable) return;
    setEditingTableName(activeTable.name);
    setIsEditingTableName(true);
  };

  const saveTableName = () => {
    if (!editingTableName.trim()) {
      setIsEditingTableName(false);
      return;
    }

    const updatedTables = tables.map(table =>
      table.id === activeTable?.id
        ? { ...table, name: editingTableName.trim() }
        : table
    );

    setTables(updatedTables);
    setIsEditingTableName(false);
    setEditingTableName('');
  };

  const cancelTableNameEdit = () => {
    setIsEditingTableName(false);
    setEditingTableName('');
  };

  // Prepare and open the Row Input Modal
  const openRowModal = () => {
    if (!activeTable) return;
    const now = new Date();
    const initialData: any = {};
    
    // Pre-fill AUTO fields
    activeTable.columns.forEach(col => {
        if (col.type === ColumnType.DATE_AUTO) {
            initialData[col.id] = now.toISOString().split('T')[0];
        } else if (col.type === ColumnType.TIME_AUTO) {
            initialData[col.id] = now.toTimeString().substring(0, 5);
        } else {
            initialData[col.id] = '';
        }
    });

    setRowFormData(initialData);
    setIsRowModalOpen(true);
  };

  const saveNewRow = () => {
    if (!activeTable) return;

    const newRowId = `row-${Date.now()}`;
    const newRow: RowData = {
        id: newRowId,
        ...rowFormData,
        _memo: '',
        _checklists: [],
        _ganttTasks: [],
        _notes: ''
    };

    const updatedTable = {
        ...activeTable,
        rows: [newRow, ...activeTable.rows]
    };

    setTables(prev => prev.map(t => t.id === activeTable.id ? updatedTable : t));
    setIsRowModalOpen(false);
  };

  // Checklist toggle
  const toggleChecklist = (rowId: string) => {
    setChecklistStates(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  // --- CSV UPLOAD FUNCTIONS ---
  const handleCSVFileSelect = (file: File) => {
    if (!activeTable) return;

    // File size validation (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setCSVValidationResult({
        isValid: false,
        errors: ['파일 크기가 너무 큽니다 (최대 10MB)']
      });
      return;
    }

    // File type validation
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      setCSVValidationResult({
        isValid: false,
        errors: ['CSV 파일만 업로드 가능합니다']
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        // Remove BOM if present
        const cleanCsvText = csvText.replace(/^\uFEFF/, '');
        // Parse CSV
        const csvRows = parseCSV(cleanCsvText);

        if (csvRows.length === 0) {
          setCSVValidationResult({
            isValid: false,
            errors: ['CSV 파일이 비어있습니다']
          });
          return;
        }

        // Validate CSV data
        const validationResult = validateCSVData(csvRows, activeTable.columns);
        setCSVValidationResult(validationResult);
      } catch (error) {
        setCSVValidationResult({
          isValid: false,
          errors: [`파일 읽기 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`]
        });
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleCSVUpload = () => {
    if (!activeTable || !csvValidationResult?.isValid || !csvValidationResult.validatedRows) {
      return;
    }

    const timestamp = Date.now();
    const newRows: RowData[] = csvValidationResult.validatedRows.map((validatedData, index) => {
      // Extract special columns if present in validated data
      const memoValue = validatedData._memo || '';

      // Create row with validated column data
      const newRow: RowData = {
        id: `row-csv-${timestamp}-${index}`,
        ...validatedData,
        _memo: memoValue,
        _checklists: [],
        _ganttTasks: [],
        _notes: ''
      };

      return newRow;
    });

    // Update table with new rows (add to top)
    const updatedTable = {
      ...activeTable,
      rows: [...newRows, ...activeTable.rows]
    };

    // Update state
    setTables(prev => prev.map(t => t.id === activeTable.id ? updatedTable : t));

    // Close modal and reset state
    setIsCSVUploadModalOpen(false);
    setCSVValidationResult(null);
    setCSVPreviewData(null);

    // Show success message
    alert(`${newRows.length}개의 행이 추가되었습니다.`);
  };

  // --- COLUMN MENU ACTIONS ---
  const handleSort = (colId: string, direction: 'asc' | 'desc') => {
      if (!activeTable) return;
      
      const sortedRows = [...activeTable.rows].sort((a, b) => {
          const valA = a[colId] || '';
          const valB = b[colId] || '';
          
          if (valA < valB) return direction === 'asc' ? -1 : 1;
          if (valA > valB) return direction === 'asc' ? 1 : -1;
          return 0;
      });

      setTables(prev => prev.map(t => t.id === activeTable.id ? { ...t, rows: sortedRows } : t));
      setActiveMenuColId(null);
  };

  const handleHideColumn = (colId: string) => {
      if (!activeTable) return;
      if (visibleColumns.length <= 1) {
          alert('최소 하나의 컬럼은 보여야 합니다.');
          return;
      }
      
      const updatedColumns = activeTable.columns.map(c => 
          c.id === colId ? { ...c, isHidden: true } : c
      );
      setTables(prev => prev.map(t => t.id === activeTable.id ? { ...t, columns: updatedColumns } : t));
      setActiveMenuColId(null);
  };

  const handleRestoreColumn = (colId: string) => {
      if (!activeTable) return;

      const updatedColumns = activeTable.columns.map(c =>
          c.id === colId ? { ...c, isHidden: false } : c
      );
      setTables(prev => prev.map(t => t.id === activeTable.id ? { ...t, columns: updatedColumns } : t));
  };

  const handleDeleteColumn = (colId: string) => {
      if (!activeTable) return;

      if (activeTable.columns.length <= 1) {
          alert('최소 하나의 컬럼은 있어야 합니다.');
          return;
      }

      const col = activeTable.columns.find(c => c.id === colId);
      setConfirmModalMessage(`"${col?.name}" 컬럼을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`);
      setConfirmModalAction(() => {
          const updatedColumns = activeTable.columns.filter(c => c.id !== colId);
          const updatedRows: RowData[] = activeTable.rows.map(row => {
              const newRow = { ...row };
              delete newRow[colId];
              return newRow;
          });
          setTables(prev => prev.map(t => t.id === activeTable.id ? { ...t, columns: updatedColumns, rows: updatedRows } : t));
          setActiveMenuColId(null);
          setIsConfirmModalOpen(false);
      });
      setIsConfirmModalOpen(true);
  };

  const openEditColumnModal = (col: Column) => {
      setEditingColState(col);
      setIsColEditModalOpen(true);
      setActiveMenuColId(null);
  };

  const saveUpdatedColumn = () => {
      if (!activeTable || !editingColState) return;
      
      const updatedColumns = activeTable.columns.map(c => 
          c.id === editingColState.id ? editingColState : c
      );

      setTables(prev => prev.map(t => t.id === activeTable.id ? { ...t, columns: updatedColumns } : t));
      setIsColEditModalOpen(false);
      setEditingColState(null);
  };

  // Form helpers for Table
  const addColumnToForm = () => {
    setNewTableColumns([...newTableColumns, { name: '', type: ColumnType.TEXT, width: 180 }]);
  };

  const updateColumnInForm = (index: number, field: keyof Omit<Column, 'id'>, value: any) => {
    const updated = [...newTableColumns];
    updated[index] = { ...updated[index], [field]: value };
    setNewTableColumns(updated);
  };

  const deleteColumnFromForm = (index: number) => {
    if (newTableColumns.length <= 1) return;
    setNewTableColumns(newTableColumns.filter((_, i) => i !== index));
  };

  // --- RESIZE LOGIC ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColId) return;
      const delta = e.clientX - startX;
      
      let validDelta = delta;

      // Apply constraints
      // Constraint 1: Target cannot be smaller than 50
      if (startWidth + validDelta < 50) {
          validDelta = 50 - startWidth;
      }

      // Constraint 2: If we have a last column to adjust, it also cannot be smaller than 50
      // Since we SUBTRACT delta from last column, we check: lastColStartWidth - validDelta >= 50
      if (lastColId && (lastColStartWidth - validDelta < 50)) {
          validDelta = lastColStartWidth - 50;
      }

      setTables(prev => prev.map(t => {
        if (t.id !== activeTableId) return t;
        
        return {
          ...t,
          columns: t.columns.map(col => {
            if (col.id === resizingColId) {
              return { ...col, width: startWidth + validDelta };
            }
            if (col.id === lastColId) {
              return { ...col, width: lastColStartWidth - validDelta };
            }
            return col;
          })
        };
      }));
    };

    const handleMouseUp = () => {
      setResizingColId(null);
      setLastColId(null);
      document.body.style.cursor = 'default';
    };

    if (resizingColId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [resizingColId, startX, startWidth, lastColId, lastColStartWidth, activeTableId]);

  const handleResizeStart = (e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find visible columns to identify the last one
    const visibleCols = activeTable?.columns.filter(c => !c.isHidden) || [];
    const lastCol = visibleCols[visibleCols.length - 1];

    setResizingColId(colId);
    setStartX(e.clientX);
    setStartWidth(currentWidth);

    // If we are NOT resizing the last column itself, we set the last column as the 'compensator'
    if (lastCol && lastCol.id !== colId) {
        setLastColId(lastCol.id);
        setLastColStartWidth(lastCol.width);
    } else {
        // If resizing the last column, we just resize it (no compensation)
        setLastColId(null);
        setLastColStartWidth(0);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, colId: string) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      // Position menu to the right-bottom of the button, shifted left to align edge
      setMenuPos({ x: rect.right, y: rect.bottom });
      setActiveMenuColId(activeMenuColId === colId ? null : colId);
  };

  // --- UI COMPONENTS ---

  const SideMenuItem = ({ icon: Icon, label, count, active, onClick, onDelete }: any) => (
    <div 
        onClick={onClick}
        className={`flex items-center justify-between px-4 py-3 text-sm rounded-lg cursor-pointer transition-colors ${active ? 'bg-purple-100 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-purple-600' : 'text-gray-400'}`} />
        <span className="truncate">{label}</span>
      </div>
      {onDelete && (
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1">
              <X className="w-3 h-3" />
          </button>
      )}
      {!onDelete && count !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${active ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
      )}
    </div>
  );

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    const currentBookmarkGroup = bookmarks[bookmarkSlideIndex];
    const selectedRow = activeTable?.rows.find(r => r.id === selectedRowId);

    return (
      <div className="flex flex-col h-screen w-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">

        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg shrink-0"
            title="필터 메뉴"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-red-600 font-bold text-xs whitespace-nowrap overflow-hidden text-center flex-1">
            {formatCurrentDateTime()}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openRowModal}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              title="행 추가"
            >
              행추가
            </button>
            <button
              onClick={() => setIsAddColumnModalOpen(true)}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
              title="컬럼 추가"
            >
              컬럼추가
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar Modal */}
        {isMobileSidebarOpen && (
          <aside
            className="fixed top-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-50 overflow-y-auto"
            style={{
              top: '56px',
              height: 'calc(100vh - 56px - 48px)'
            }}
          >
            <div className="p-4 flex items-center justify-between border-b border-gray-200">
              <h2 className="font-bold text-gray-800">필터</h2>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                title="사이드바 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1 py-4">
              <SideMenuItem
                  icon={LayoutGrid}
                  label="전체"
                  count={activeTable?.rows.length || 0}
                  active={activeDateFilter === null}
                  onClick={() => {
                    setActiveDateFilter(null);
                  }}
              />

              {/* TODAY Table: Date List */}
              {activeTableId === todayTableId && (
                <>
                  {/* Recent 3 Days Section */}
                  {(() => {
                    const { recent, monthGroups } = getTodayTableDates();

                    return (
                      <>
                        {/* 최근 3일 */}
                        {recent.length > 0 && (
                          <>
                            <div className="mt-4 pt-2 border-t border-gray-100">
                              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">최근 3일</h3>
                            </div>
                            {recent.map((dateItem) => (
                              <SideMenuItem
                                key={dateItem.date}
                                icon={Calendar}
                                label={dateItem.displayDate}
                                count={dateItem.count}
                                active={activeDateFilter === dateItem.date}
                                onClick={() => setActiveDateFilter(activeDateFilter === dateItem.date ? null : dateItem.date)}
                              />
                            ))}
                          </>
                        )}

                        {/* 월별 아코디언 */}
                        {monthGroups.length > 0 && (
                          <div className="mt-4 pt-2 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">이전 기록</h3>
                            {monthGroups.map((monthGroup) => {
                              const isExpanded = expandedMonths.has(monthGroup.monthKey);

                              return (
                                <div key={monthGroup.monthKey}>
                                  {/* Month Header (Accordion) */}
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedMonths);
                                      if (isExpanded) {
                                        newExpanded.delete(monthGroup.monthKey);
                                      } else {
                                        newExpanded.add(monthGroup.monthKey);
                                      }
                                      setExpandedMonths(newExpanded);
                                    }}
                                    className="w-full px-2 py-2 flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <ChevronRight
                                      className={`w-4 h-4 transition-transform ${
                                        isExpanded ? 'rotate-90' : ''
                                      }`}
                                    />
                                    <span>{monthGroup.monthDisplay}</span>
                                  </button>

                                  {/* Dates within Month */}
                                  {isExpanded && (
                                    <div className="pl-6 space-y-1">
                                      {monthGroup.dates.map((dateItem) => (
                                        <SideMenuItem
                                          key={dateItem.date}
                                          icon={Calendar}
                                          label={dateItem.displayDate}
                                          count={dateItem.count}
                                          active={activeDateFilter === dateItem.date}
                                          onClick={() => setActiveDateFilter(activeDateFilter === dateItem.date ? null : dateItem.date)}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}

              {/* Category Filter Section */}
              {(() => {
                const categoryColumns = activeTable?.columns.filter(col => col.type === ColumnType.CATEGORY) || [];
                if (categoryColumns.length === 0) return null;

                return categoryColumns.map(col => {
                  const categoryGroup = categories.find(c => c.columnId === col.id);
                  const uncategorizedCount = getUncategorizedCount(col.id);

                  return (
                    <div key={col.id} className="mt-4 pt-2 border-t border-gray-100">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
                        {col.name}
                      </h3>

                      {/* Uncategorized item - always shown first */}
                      <SideMenuItem
                        key={`${col.id}-uncategorized`}
                        icon={LayoutGrid}
                        label="미분류"
                        count={uncategorizedCount}
                        active={activeCategoryFilter?.columnId === col.id && activeCategoryFilter?.categoryName === UNCATEGORIZED_MARKER}
                        onClick={() => {
                          if (activeCategoryFilter?.columnId === col.id && activeCategoryFilter?.categoryName === UNCATEGORIZED_MARKER) {
                            setActiveCategoryFilter(null);
                          } else {
                            setActiveCategoryFilter({ columnId: col.id, categoryName: UNCATEGORIZED_MARKER });
                          }
                        }}
                      />

                      {/* Regular category items */}
                      {categoryGroup && categoryGroup.items.map((item) => (
                        <SideMenuItem
                          key={item.id}
                          icon={LayoutGrid}
                          label={item.name}
                          count={activeTable?.rows.filter(r => r[col.id] === item.name).length || 0}
                          active={activeCategoryFilter?.columnId === col.id && activeCategoryFilter?.categoryName === item.name}
                          onClick={() => {
                            if (activeCategoryFilter?.columnId === col.id && activeCategoryFilter?.categoryName === item.name) {
                              setActiveCategoryFilter(null);
                            } else {
                              setActiveCategoryFilter({ columnId: col.id, categoryName: item.name });
                            }
                          }}
                        />
                      ))}
                    </div>
                  );
                });
              })()}
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <div className="overflow-hidden flex flex-col flex-1 min-h-0 pb-12">
          {/* Table Content */}
          <div className="w-full overflow-x-auto overflow-y-auto flex-1">
            {activeTable && (
              <table className="w-full border-collapse bg-white">
                <thead className="sticky top-0 z-10 bg-purple-600 text-white shadow-md">
                  <tr>
                    {visibleColumns.map(col => (
                      <th
                        key={col.id}
                        className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap"
                        style={{ width: col.type === ColumnType.CHECKLIST ? '80px' : `${col.width}px`, minWidth: col.type === ColumnType.CHECKLIST ? '80px' : `${col.width}px` }}
                      >
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, filteredIdx) => {
                    const actualIdx = activeTable.rows.findIndex(r => r.id === row.id);
                    const isFirstRow = filteredIdx === 0;
                    const isLastRow = filteredIdx === filteredRows.length - 1;

                    return (
                      <tr
                        key={row.id}
                        onClick={() => {
                          setSelectedRowId(row.id);
                          setIsDetailPanelModal(true);
                        }}
                        className={`border-b cursor-pointer transition-colors ${
                          selectedRowId === row.id ? 'bg-blue-50' :
                          isDateToday(String(row['col-1'] || '')) ? 'bg-red-100 hover:bg-red-200' :
                          isDateYesterday(String(row['col-1'] || '')) ? 'bg-blue-100 hover:bg-blue-200' :
                          'hover:bg-gray-100'
                        }`}
                      >
                        {visibleColumns.map((col, colIdx) => {
                          const isChecklistCol = col.type === ColumnType.CHECKLIST;
                          const isFirstCol = colIdx === 0;
                          const isChecked = checklistStates[row.id] || false;

                          return (
                            <td
                              key={col.id}
                              className="px-4 py-3 text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                              style={{ width: isChecklistCol ? '80px' : `${col.width}px`, minWidth: isChecklistCol ? '80px' : `${col.width}px` }}
                            >
                              {isChecklistCol ? (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleChecklist(row.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-5 h-5 cursor-pointer"
                                />
                              ) : isFirstCol ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveRow(row.id, 'up');
                                      }}
                                      disabled={isFirstRow}
                                      className="text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-0 leading-none"
                                      title="위로 이동"
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveRow(row.id, 'down');
                                      }}
                                      disabled={isLastRow}
                                      className="text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-0 leading-none"
                                      title="아래로 이동"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <span className={isChecked ? 'text-gray-700 line-through' : 'text-gray-700'}>
                                    {String(row[col.id] || '-')}
                                  </span>
                                </div>
                              ) : isChecked ? (
                                <span className="text-gray-700 line-through">
                                  {String(row[col.id] || '-')}
                                </span>
                              ) : (
                                <span className="text-gray-700">
                                  {String(row[col.id] || '-')}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Mobile Table Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex gap-1 overflow-x-auto md:hidden z-30">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => {
                setActiveTableId(table.id);
                // 모바일에서 테이블 탭 클릭 시 사이드바 펼치기
                setIsMobileSidebarOpen(true);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTableId === table.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {table.name}
            </button>
          ))}
        </div>

        {/* Mobile Detail Panel Modal */}
        {isDetailPanelModal && selectedRow && activeTable && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50 animate-in fade-in">
            <div className="bg-white w-full h-[70vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
              <DetailPanel
                  tableName={activeTable.name}
                  row={selectedRow}
                  columns={activeTable.columns}
                  visibleColumns={activeTable.columns.filter(c => !c.isHidden)}
                  categories={categories}
                  setCategories={setCategories}
                  sidebarColumnId={getSidebarColumnId()}
                  isOpen={isDetailPanelModal}
                  onClose={() => {
                    setIsDetailPanelModal(false);
                    setSelectedRowId(null);
                  }}
                  onUpdate={(updatedRow) => {
                    const updatedTable = {
                      ...activeTable,
                      rows: activeTable.rows.map(r => r.id === updatedRow.id ? updatedRow : r)
                    };
                    setTables(tables.map(t => t.id === activeTable.id ? updatedTable : t));
                  }}
                  onDeleteRow={(rowId) => {
                    const updatedTable = {
                      ...activeTable,
                      rows: activeTable.rows.filter(r => r.id !== rowId)
                    };
                    setTables(tables.map(t => t.id === activeTable.id ? updatedTable : t));
                    setIsDetailPanelModal(false);
                    setSelectedRowId(null);
                  }}
                  setIsConfirmModalOpen={setIsConfirmModalOpen}
                  setConfirmModalMessage={setConfirmModalMessage}
                  setConfirmModalAction={setConfirmModalAction}
                  isMobile={true}
                />
            </div>
          </div>
        )}

        {/* Table Creation Modal (shared with desktop) */}
        {isTableModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm md:flex hidden">
            {/* Desktop version modal */}
          </div>
        )}

        {/* Add Column Modal */}
        {isAddColumnModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-[450px] mx-4 animate-in zoom-in duration-200">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">새로운 컬럼 추가</h2>
                        <button onClick={() => setIsAddColumnModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">컬럼 이름</label>
                            <input
                                type="text"
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                                placeholder="컬럼 이름을 입력하세요"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddColumn();
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">데이터 타입</label>
                            <select
                                value={newColumnType}
                                onChange={(e) => setNewColumnType(e.target.value as ColumnType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value={ColumnType.TEXT}>텍스트</option>
                                <option value={ColumnType.LONG_TEXT}>롱텍스트</option>
                                <option value={ColumnType.NUMBER}>숫자</option>
                                <option value={ColumnType.DATE_AUTO}>자동 날짜</option>
                                <option value={ColumnType.DATE_MANUAL}>수동 날짜</option>
                                <option value={ColumnType.TIME_AUTO}>자동 시간</option>
                                <option value={ColumnType.TIME_MANUAL}>수동 시간</option>
                                <option value={ColumnType.YMD_AUTO}>자동년월일</option>
                                <option value={ColumnType.YMD_MANUAL}>수동년월일</option>
                                <option value={ColumnType.CHECKLIST}>체크리스트</option>
                                <option value={ColumnType.CATEGORY}>카테고리</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
                        <button
                            onClick={() => setIsAddColumnModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleAddColumn}
                            disabled={!newColumnName.trim()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium"
                        >
                            추가
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Row Input Modal */}
        {isRowModalOpen && activeTable && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] mx-4 max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-800">새 데이터 추가</h2>
                      <button onClick={() => setIsRowModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5"/>
                      </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-5">
                      {activeTable.columns.filter(c => !c.isHidden).map((col) => {
                          const isAuto = col.type === ColumnType.DATE_AUTO || col.type === ColumnType.TIME_AUTO || col.type === ColumnType.YMD_AUTO;
                          const isDate = col.type === ColumnType.DATE_AUTO || col.type === ColumnType.DATE_MANUAL;
                          const isTime = col.type === ColumnType.TIME_AUTO || col.type === ColumnType.TIME_MANUAL;
                          const isYMD = col.type === ColumnType.YMD_AUTO || col.type === ColumnType.YMD_MANUAL;
                          const isCategory = col.type === ColumnType.CATEGORY;
                          const inputType = isDate ? 'date' : isTime ? 'time' : isYMD ? 'date' : col.type === ColumnType.NUMBER ? 'number' : 'text';

                          const categoryGroup = isCategory ? categories.find(c => c.columnId === col.id) : undefined;

                          return (
                              <div key={col.id}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {col.name}
                                      {isAuto && <span className="text-blue-500 text-xs ml-1 font-normal">(자동입력)</span>}
                                  </label>
                                  {isCategory ? (
                                      <select
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white"
                                          value={rowFormData[col.id] || ''}
                                          onChange={(e) => setRowFormData({...rowFormData, [col.id]: e.target.value})}
                                      >
                                          <option value="">선택 없음</option>
                                          {categoryGroup?.items.map((item) => (
                                              <option key={item.id} value={item.name}>
                                                  {item.name}
                                              </option>
                                          ))}
                                      </select>
                                  ) : (
                                      <input
                                          type={inputType}
                                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                                              isAuto ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300'
                                          }`}
                                          value={rowFormData[col.id] || ''}
                                          onChange={(e) => setRowFormData({...rowFormData, [col.id]: e.target.value})}
                                          disabled={isAuto}
                                      />
                                  )}
                              </div>
                          );
                      })}
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
                      <button
                          onClick={() => setIsRowModalOpen(false)}
                          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                          취소
                      </button>
                      <button
                          onClick={saveNewRow}
                          className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                      >
                          <Save className="w-4 h-4" /> 저장
                      </button>
                  </div>
              </div>
            </div>
        )}
      </div>
    );
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      <InstallPrompt />

      {/* 1. Header Area */}
      {!isMobile && (
        <Header
          groups={bookmarks}
          setGroups={setBookmarks}
          setIsConfirmModalOpen={setIsConfirmModalOpen}
          setConfirmModalMessage={setConfirmModalMessage}
          setConfirmModalAction={setConfirmModalAction}
        />
      )}

      {/* 모바일 사이드바 배경 오버레이 */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Container - flex-1을 차지하는 컨테이너 */}
      <div className="flex flex-1 overflow-hidden">

      {/* Left Sidebar (Filter) - Desktop: static | Mobile: fixed modal */}
      <aside
        className="bg-white border-r border-gray-200 flex flex-col shrink-0 md:relative md:w-64 md:z-auto"
        style={isMobile ? {
          position: 'fixed',
          top: 0,
          left: isMobileSidebarOpen ? '0' : '-16rem',
          height: '100vh',
          width: '16rem',
          zIndex: 50,
          transition: 'left 0.3s ease-in-out'
        } : {}}>

          <div className="p-4 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">필터</h2>
            {/* 모바일 닫기 버튼 */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-gray-500 hover:text-gray-700"
              title="사이드바 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            <SideMenuItem
                icon={LayoutGrid}
                label="전체"
                count={activeTable?.rows.length || 0}
                active={activeDateFilter === null}
                onClick={() => {
                  setActiveDateFilter(null);
                }}
            />

            {/* TODAY Table: Date List */}
            {activeTableId === todayTableId && (
              <>
                {/* Recent 3 Days Section */}
                {(() => {
                  const { recent, monthGroups } = getTodayTableDates();

                  return (
                    <>
                      {/* 최근 3일 */}
                      {recent.length > 0 && (
                        <>
                          <div className="mt-4 pt-2 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">최근 3일</h3>
                          </div>
                          {recent.map((dateItem) => (
                            <SideMenuItem
                              key={dateItem.date}
                              icon={Calendar}
                              label={dateItem.displayDate}
                              count={dateItem.count}
                              active={activeDateFilter === dateItem.date}
                              onClick={() => setActiveDateFilter(activeDateFilter === dateItem.date ? null : dateItem.date)}
                            />
                          ))}
                        </>
                      )}

                      {/* 월별 아코디언 */}
                      {monthGroups.length > 0 && (
                        <div className="mt-4 pt-2 border-t border-gray-100">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">이전 기록</h3>
                          {monthGroups.map((monthGroup) => {
                            const isExpanded = expandedMonths.has(monthGroup.monthKey);

                            return (
                              <div key={monthGroup.monthKey}>
                                {/* Month Header (Accordion) */}
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedMonths);
                                    if (isExpanded) {
                                      newExpanded.delete(monthGroup.monthKey);
                                    } else {
                                      newExpanded.add(monthGroup.monthKey);
                                    }
                                    setExpandedMonths(newExpanded);
                                  }}
                                  className="w-full px-2 py-2 flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                >
                                  <ChevronRight
                                    className={`w-4 h-4 transition-transform ${
                                      isExpanded ? 'rotate-90' : ''
                                    }`}
                                  />
                                  <span>{monthGroup.monthDisplay}</span>
                                </button>

                                {/* Dates within Month */}
                                {isExpanded && (
                                  <div className="pl-6 space-y-1">
                                    {monthGroup.dates.map((dateItem) => (
                                      <SideMenuItem
                                        key={dateItem.date}
                                        icon={Calendar}
                                        label={dateItem.displayDate}
                                        count={dateItem.count}
                                        active={activeDateFilter === dateItem.date}
                                        onClick={() => setActiveDateFilter(activeDateFilter === dateItem.date ? null : dateItem.date)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {/* Category Filter Section */}
            {(() => {
              const categoryColumns = activeTable?.columns.filter(col => col.type === ColumnType.CATEGORY) || [];
              if (categoryColumns.length === 0) return null;

              return categoryColumns.map(col => {
                const categoryGroup = categories.find(c => c.columnId === col.id);
                const uncategorizedCount = getUncategorizedCount(col.id);

                return (
                  <div key={col.id} className="mt-4 pt-2 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
                      {col.name}
                    </h3>

                    {/* Uncategorized item - always shown first */}
                    <SideMenuItem
                      key={`${col.id}-uncategorized`}
                      icon={LayoutGrid}
                      label="미분류"
                      count={uncategorizedCount}
                      active={activeCategoryFilter?.columnId === col.id && activeCategoryFilter?.categoryName === UNCATEGORIZED_MARKER}
                      onClick={() => {
                        if (activeCategoryFilter?.columnId === col.id && activeCategoryFilter?.categoryName === UNCATEGORIZED_MARKER) {
                          setActiveCategoryFilter(null);
                        } else {
                          setActiveCategoryFilter({ columnId: col.id, categoryName: UNCATEGORIZED_MARKER });
                        }
                      }}
                    />

                    {/* Regular category items */}
                    {categoryGroup && categoryGroup.items.map((item) => (
                      <SideMenuItem
                        key={item.id}
                        icon={LayoutGrid}
                        label={item.name}
                        count={activeTable?.rows.filter(r => r[col.id] === item.name).length || 0}
                        active={activeCategoryFilter?.columnId === col.id && activeCategoryFilter?.categoryName === item.name}
                        onClick={() => {
                          if (activeCategoryFilter?.columnId === col.id && activeCategoryFilter?.categoryName === item.name) {
                            setActiveCategoryFilter(null);
                          } else {
                            setActiveCategoryFilter({ columnId: col.id, categoryName: item.name });
                          }
                        }}
                      />
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        </aside>

        {/* 2. Main Workspace Area */}
        <div className="flex flex-1 overflow-hidden relative">

        {/* Center Main Content (Table) */}
        <main className="flex-1 flex flex-col bg-gray-50/50 relative overflow-hidden">
            
          {/* Table Toolbar */}
          <div className="px-6 py-4 flex justify-between items-center">
             <div className="flex items-center gap-3">
                {isEditingTableName ? (
                  <input
                    type="text"
                    value={editingTableName}
                    onChange={(e) => setEditingTableName(e.target.value)}
                    onBlur={saveTableName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTableName();
                      if (e.key === 'Escape') cancelTableNameEdit();
                    }}
                    autoFocus
                    className="text-2xl font-bold text-gray-800 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-4">
                    <h1
                      className="text-2xl font-bold text-gray-800 cursor-pointer hover:bg-gray-200 rounded px-2 py-1 transition-colors"
                      onDoubleClick={handleTableNameDoubleClick}
                      title="더블클릭으로 이름 변경"
                    >
                      {activeTable?.name}
                    </h1>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrentDateTime()}
                    </div>
                  </div>
                )}

                <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                  <button
                      onClick={() => setIsDeleteLocked(!isDeleteLocked)}
                      className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${isDeleteLocked ? 'text-gray-400 hover:bg-gray-50' : 'text-orange-500 bg-orange-50'}`}
                      title={isDeleteLocked ? "잠금 해제" : "잠금"}
                  >
                      {isDeleteLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      <span className="text-xs font-medium mr-1">{isDeleteLocked ? '잠금' : '해제됨'}</span>
                  </button>
                  <div className="w-[1px] h-4 bg-gray-200 mx-0.5"></div>
                  <button 
                      onClick={deleteTable}
                      className={`p-1.5 rounded-md transition-colors ${
                          isDeleteLocked 
                          ? 'text-gray-400' // Make it visually disabled when locked, but still clickable for alert
                          : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                      }`}
                      title={isDeleteLocked ? "잠금을 해제해야 삭제할 수 있습니다" : "테이블 삭제"}
                  >
                      <Trash2 className="w-4 h-4" />
                  </button>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                    onClick={() => setIsHiddenColModalOpen(true)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2"
                >
                    <EyeOff className="w-4 h-4" />
                    숨긴컬럼 ({hiddenColumns.length})
                </button>
                <button
                    onClick={() => setIsCSVUploadModalOpen(true)}
                    className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2 border border-green-200"
                >
                    <Upload className="w-4 h-4" />
                    CSV 업로드
                </button>
                <button
                    onClick={openRowModal}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    행추가
                </button>
                <button
                    onClick={() => setIsAddColumnModalOpen(true)}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    컬럼추가
                </button>
             </div>
          </div>

          <div className="px-6 pb-2">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="검색..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                />
            </div>
            {activeFilterId && (
                <div className="mt-2 flex items-center gap-2 text-sm text-purple-600 bg-purple-50 p-2 rounded-lg border border-purple-100 inline-block">
                    <Filter className="w-3.5 h-3.5" />
                    <span>현재 <b>{customFilters.find(f => f.id === activeFilterId)?.name}</b> 필터가 적용중입니다. ({filteredRows.length}개 표시)</span>
                    <button onClick={() => setActiveFilterId(null)} className="ml-2 hover:text-purple-800"><X className="w-3.5 h-3.5"/></button>
                </div>
            )}
          </div>

          {/* Actual Table */}
          <div className="flex-1 overflow-hidden px-6 pb-6 flex flex-col">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
                        <thead className="bg-purple-700 text-white sticky top-0 z-10 shadow-md">
                            <tr>
                                {visibleColumns.map(col => (
                                    <th
                                        key={col.id}
                                        className="px-4 py-3 font-medium border-r border-purple-500 last:border-none relative group select-none"
                                        style={{ width: col.type === ColumnType.CHECKLIST ? 80 : col.width, minWidth: col.type === ColumnType.CHECKLIST ? 80 : col.width }}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMoveColumn(col.id, 'left');
                                                    }}
                                                    className="p-0.5 hover:bg-purple-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    disabled={visibleColumns.indexOf(col) === 0}
                                                    title="컬럼 왼쪽으로 이동"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <span>{col.name}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMoveColumn(col.id, 'right');
                                                    }}
                                                    className="p-0.5 hover:bg-purple-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    disabled={visibleColumns.indexOf(col) === visibleColumns.length - 1}
                                                    title="컬럼 오른쪽으로 이동"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <MoreVertical
                                                    className="w-4 h-4 opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleMenuClick(e, col.id)}
                                                />
                                            </div>
                                        </div>
                                        {/* Resize Handle */}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 z-10 transition-colors"
                                            onMouseDown={(e) => handleResizeStart(e, col.id, col.width)}
                                        />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-400">
                            {filteredRows.map((row, filteredIdx) => {
                                const actualIdx = activeTable.rows.findIndex(r => r.id === row.id);
                                const isFirstRow = filteredIdx === 0;
                                const isLastRow = filteredIdx === filteredRows.length - 1;

                                return (
                                  <tr
                                      key={row.id}
                                      onClick={() => handleRowClick(row.id)}
                                      className={`cursor-pointer transition-colors ${
                                          selectedRowId === row.id ? 'bg-blue-50' :
                                          isDateToday(String(row['col-1'] || '')) ? 'bg-red-100 hover:bg-red-200' :
                                          isDateYesterday(String(row['col-1'] || '')) ? 'bg-blue-100 hover:bg-blue-200' :
                                          'hover:bg-gray-50'
                                      }`}
                                  >
                                      {visibleColumns.map((col, colIdx) => {
                                          const isChecklistCol = col.type === ColumnType.CHECKLIST;
                                          const isFirstCol = colIdx === 0;
                                          const isChecked = checklistStates[row.id] || false;

                                          return (
                                            <td
                                                key={col.id}
                                                className={`px-4 py-3 border-r border-gray-400 last:border-none overflow-hidden text-ellipsis ${col.id === 'col-2' || col.id === 'col-3' ? 'text-blue-500' : 'text-gray-600'}`}
                                                style={{ maxWidth: isChecklistCol ? 80 : col.width }}
                                            >
                                                {isChecklistCol ? (
                                                  <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleChecklist(row.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-5 h-5 cursor-pointer"
                                                  />
                                                ) : isFirstCol ? (
                                                  <div className="flex items-center gap-2">
                                                    <div className="flex flex-col gap-0.5">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleMoveRow(row.id, 'up');
                                                        }}
                                                        disabled={isFirstRow}
                                                        className="text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-0 leading-none"
                                                        title="위로 이동"
                                                      >
                                                        <ChevronUp className="w-4 h-4" />
                                                      </button>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleMoveRow(row.id, 'down');
                                                        }}
                                                        disabled={isLastRow}
                                                        className="text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-0 leading-none"
                                                        title="아래로 이동"
                                                      >
                                                        <ChevronDown className="w-4 h-4" />
                                                      </button>
                                                    </div>
                                                    <span className={isChecked ? 'line-through' : ''}>
                                                      {row[col.id]}
                                                    </span>
                                                  </div>
                                                ) : isChecked ? (
                                                  <span className="line-through">
                                                    {row[col.id]}
                                                  </span>
                                                ) : (
                                                  <span>
                                                    {row[col.id]}
                                                  </span>
                                                )}
                                            </td>
                                          );
                                      })}
                                  </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredRows.length === 0 && (
                        <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
                            <Inbox className="w-8 h-8 opacity-20" />
                            <span>표시할 데이터가 없습니다.</span>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </main>

        {/* Backdrop for DetailPanel */}
        {selectedRowId && (
            <div 
                className="fixed inset-0 bg-black/10 z-40" 
                onClick={() => setSelectedRowId(null)}
            ></div>
        )}

        {/* 3. Detail Panel (Sliding Right Sidebar) */}
        <DetailPanel
            tableName={activeTable?.name || ''}
            columns={activeTable?.columns || []}
            visibleColumns={visibleColumns}
            row={activeTable?.rows.find(r => r.id === selectedRowId) || null}
            categories={categories}
            setCategories={setCategories}
            sidebarColumnId={getSidebarColumnId()}
            isOpen={!!selectedRowId}
            onClose={() => setSelectedRowId(null)}
            onUpdate={updateRow}
            onDeleteRow={handleDeleteRow}
            setIsConfirmModalOpen={setIsConfirmModalOpen}
            setConfirmModalMessage={setConfirmModalMessage}
            setConfirmModalAction={setConfirmModalAction}
        />
      </div>

      </div> {/* Main Content Container 끝 */}

      {/* 4. Footer (Tabs) */}
      <footer className="h-12 bg-gray-100 border-t border-gray-200 flex items-center px-2 gap-1 overflow-x-auto shrink-0">
         {tables.map((table, index) => (
             <div key={table.id} className="flex items-center gap-0.5">
                 <button
                     onClick={(e) => {
                         e.stopPropagation();
                         handleMoveTable(table.id, 'left');
                     }}
                     className="p-1 hover:bg-gray-300 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                     disabled={index === 0}
                     title="테이블 왼쪽으로 이동"
                 >
                     <ChevronLeft className="w-3 h-3" />
                 </button>
                 <button
                    key={table.id}
                    onClick={() => {
                        setActiveTableId(table.id);
                        setSelectedRowId(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        activeTableId === table.id
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-500 hover:bg-gray-200'
                    }`}
                 >
                     <TableIcon className="w-4 h-4" />
                     {table.name}
                 </button>
                 <button
                     onClick={(e) => {
                         e.stopPropagation();
                         handleMoveTable(table.id, 'right');
                     }}
                     className="p-1 hover:bg-gray-300 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                     disabled={index === tables.length - 1}
                     title="테이블 오른쪽으로 이동"
                 >
                     <ChevronRight className="w-3 h-3" />
                 </button>
             </div>
         ))}
         <button
            onClick={() => setIsTableModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-md text-sm font-medium transition-colors ml-2"
         >
             <Plus className="w-4 h-4" />
             테이블 추가
         </button>
         <button
            onClick={handleSaveTableOrder}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ml-2 ${
              saveStatus === 'success'
                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                : saveStatus === 'error'
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            title="현재 테이블 순서를 저장합니다"
         >
             <Save className="w-4 h-4" />
             저장
         </button>
         {saveMessage && (
            <span className={`text-xs font-medium ml-2 ${
              saveStatus === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {saveMessage}
            </span>
         )}
      </footer>


      {/* Add Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">새 테이블 만들기</h2>
                    <p className="text-gray-500 text-sm mt-1">테이블 이름과 컬럼을 정의하세요.</p>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">테이블 이름</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="예: 프로젝트 관리"
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700">컬럼 정의</label>
                            <button onClick={addColumnToForm} className="text-xs text-blue-600 font-bold hover:underline">+ 컬럼 추가</button>
                        </div>
                        
                        {newTableColumns.map((col, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    placeholder="컬럼명"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
                                    value={col.name}
                                    onChange={(e) => updateColumnInForm(idx, 'name', e.target.value)}
                                />
                                <select 
                                    className="w-32 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
                                    value={col.type}
                                    onChange={(e) => updateColumnInForm(idx, 'type', e.target.value)}
                                >
                                    <option value={ColumnType.TEXT}>텍스트</option>
                                    <option value={ColumnType.LONG_TEXT}>롱텍스트</option>
                                    <option value={ColumnType.NUMBER}>숫자</option>
                                    <option value={ColumnType.DATE_AUTO}>날짜 (자동)</option>
                                    <option value={ColumnType.DATE_MANUAL}>날짜 (직접)</option>
                                    <option value={ColumnType.TIME_AUTO}>시간 (자동)</option>
                                    <option value={ColumnType.TIME_MANUAL}>시간 (직접)</option>
                                    <option value={ColumnType.YMD_AUTO}>자동년월일</option>
                                    <option value={ColumnType.YMD_MANUAL}>수동년월일</option>
                                    <option value={ColumnType.CHECKLIST}>체크리스트</option>
                                    <option value={ColumnType.CATEGORY}>카테고리</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="너비(px)"
                                    className="w-20 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
                                    value={col.width}
                                    onChange={(e) => updateColumnInForm(idx, 'width', parseInt(e.target.value))}
                                />
                                <button 
                                    onClick={() => deleteColumnFromForm(idx)}
                                    className="p-2 text-gray-400 hover:text-red-500"
                                >
                                    <div className="w-4 h-1 bg-current rounded"></div>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
                    <button 
                        onClick={() => setIsTableModalOpen(false)}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={addTable}
                        className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        테이블 생성
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Hidden Columns Modal */}
      {isHiddenColModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[400px] animate-in zoom-in duration-200">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">숨긴 컬럼 목록</h3>
                    <button onClick={() => setIsHiddenColModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5"/>
                    </button>
                </div>
                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {hiddenColumns.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            숨겨진 컬럼이 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {hiddenColumns.map(col => (
                                <div key={col.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-sm font-medium text-gray-700">{col.name}</span>
                                    <button 
                                        onClick={() => handleRestoreColumn(col.id)}
                                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" /> 복원
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
      
      {/* Edit Column Modal */}
      {isColEditModalOpen && editingColState && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-80 animate-in zoom-in duration-200">
                  <div className="p-5 border-b border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800">컬럼 수정</h3>
                  </div>
                  <div className="p-5 space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">컬럼명</label>
                          <input 
                              type="text" 
                              value={editingColState.name}
                              onChange={(e) => setEditingColState({...editingColState, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">속성</label>
                          <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={editingColState.type}
                                onChange={(e) => setEditingColState({...editingColState, type: e.target.value as ColumnType})}
                            >
                                <option value={ColumnType.TEXT}>텍스트</option>
                                <option value={ColumnType.LONG_TEXT}>롱텍스트</option>
                                <option value={ColumnType.NUMBER}>숫자</option>
                                <option value={ColumnType.DATE_AUTO}>날짜 (자동)</option>
                                <option value={ColumnType.DATE_MANUAL}>날짜 (직접)</option>
                                <option value={ColumnType.TIME_AUTO}>시간 (자동)</option>
                                <option value={ColumnType.TIME_MANUAL}>시간 (직접)</option>
                                <option value={ColumnType.YMD_AUTO}>자동년월일</option>
                                <option value={ColumnType.YMD_MANUAL}>수동년월일</option>
                                <option value={ColumnType.CHECKLIST}>체크리스트</option>
                                <option value={ColumnType.CATEGORY}>카테고리</option>
                            </select>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-xl">
                      <button 
                          onClick={() => setIsColEditModalOpen(false)}
                          className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      >
                          취소
                      </button>
                      <button 
                          onClick={saveUpdatedColumn}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                          저장
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Create Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] animate-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">새 필터 만들기</h2>
                    <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5"/>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 max-h-[70vh]">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">필터 이름</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="예: VIP 고객"
                            value={newFilterName}
                            onChange={(e) => setNewFilterName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700">필터 조건 (AND)</label>
                            <button
                                onClick={() => setNewFilterConditions([...newFilterConditions, {
                                  id: Date.now().toString(),
                                  columnId: visibleColumns[0]?.id || '',
                                  target: { type: 'column', field: visibleColumns[0]?.id || '' },
                                  operator: 'contains',
                                  value: ''
                                }])}
                                className="text-xs text-blue-600 font-bold hover:underline"
                            >
                                + 조건 추가
                            </button>
                        </div>
                        
                        {newFilterConditions.map((cond, idx) => {
                          const targetType = cond.target?.type || 'column';
                          const operators = getOperatorsForTargetType(targetType as FilterTargetType);
                          const showsValue = requiresValue(cond.operator);

                          return (
                            <div key={cond.id} className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                              {/* First row: Field Type Selector */}
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
                                value={targetType}
                                onChange={(e) => {
                                  const updated = [...newFilterConditions];
                                  const newType = e.target.value as FilterTargetType;
                                  updated[idx].target = { type: newType, field: newType === 'column' ? visibleColumns[0]?.id : undefined };
                                  updated[idx].operator = operators[0].value as FilterOperator;
                                  updated[idx].value = '';
                                  setNewFilterConditions(updated);
                                }}
                              >
                                <option value="column">컬럼</option>
                                <option value="memo">메모</option>
                                <option value="checklist">체크리스트</option>
                                <option value="reply">답글</option>
                              </select>

                              {/* Second row: Column selector (only for column type) and Operator */}
                              <div className="flex gap-2">
                                {targetType === 'column' && (
                                  <select
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
                                    value={cond.target?.field || ''}
                                    onChange={(e) => {
                                      const updated = [...newFilterConditions];
                                      updated[idx].columnId = e.target.value;
                                      if (updated[idx].target) {
                                        updated[idx].target.field = e.target.value;
                                      }
                                      setNewFilterConditions(updated);
                                    }}
                                  >
                                    {visibleColumns.map(col => (
                                      <option key={col.id} value={col.id}>{col.name}</option>
                                    ))}
                                  </select>
                                )}

                                <select
                                  className={`px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm ${
                                    targetType === 'column' ? 'w-40' : 'flex-1'
                                  }`}
                                  value={cond.operator}
                                  onChange={(e) => {
                                    const updated = [...newFilterConditions];
                                    updated[idx].operator = e.target.value as FilterOperator;
                                    setNewFilterConditions(updated);
                                  }}
                                >
                                  {operators.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => setNewFilterConditions(newFilterConditions.filter((_, i) => i !== idx))}
                                  className="p-2 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Third row: Value input (conditional) */}
                              {showsValue ? (
                                <input
                                  type="text"
                                  placeholder={getPlaceholder(targetType as FilterTargetType, cond.operator)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
                                  value={cond.value}
                                  onChange={(e) => {
                                    const updated = [...newFilterConditions];
                                    updated[idx].value = e.target.value;
                                    setNewFilterConditions(updated);
                                  }}
                                />
                              ) : null}
                            </div>
                          );
                        })}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
                    <button 
                        onClick={() => setIsFilterModalOpen(false)}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={saveFilter}
                        className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        필터 저장
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Column Menu (Portal behavior via fixed positioning) */}
      {activeMenuColId && menuPos && (
        <>
            <div className="fixed inset-0 z-50 cursor-default" onClick={() => setActiveMenuColId(null)} />
            <div 
                className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-36 overflow-hidden animate-in fade-in zoom-in duration-150"
                style={{ top: menuPos.y + 5, left: menuPos.x - 144 }} 
            >
                <div className="flex flex-col py-1">
                    <button 
                        onClick={() => handleSort(activeMenuColId, 'asc')}
                        className="px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <ArrowUp className="w-3.5 h-3.5"/> 오름차순
                    </button>
                    <button 
                        onClick={() => handleSort(activeMenuColId, 'desc')}
                        className="px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <ArrowDown className="w-3.5 h-3.5"/> 내림차순
                    </button>
                    <div className="h-[1px] bg-gray-100 my-1"></div>
                    <button 
                        onClick={() => {
                            const col = activeTable?.columns.find(c => c.id === activeMenuColId);
                            if (col) openEditColumnModal(col);
                        }}
                        className="px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <Edit2 className="w-3.5 h-3.5"/> 컬럼 수정
                    </button>
                    <button
                        onClick={() => handleHideColumn(activeMenuColId)}
                        className="px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <EyeOff className="w-3.5 h-3.5"/> 숨기기
                    </button>
                    <div className="h-[1px] bg-gray-100 my-1"></div>
                    <button
                        onClick={() => handleDeleteColumn(activeMenuColId)}
                        className="px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Trash2 className="w-3.5 h-3.5"/> 컬럼 삭제
                    </button>
                </div>
            </div>
        </>
      )}

      {/* Custom Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[101] backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-96 animate-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">확인</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-700 whitespace-pre-wrap">{confirmModalMessage}</p>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={() => { setIsConfirmModalOpen(false); setConfirmModalAction(null); }}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={() => { if (confirmModalAction) confirmModalAction(); }}
                        className="px-4 py-2 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add Column Modal */}
      {isAddColumnModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-[450px] mx-4 animate-in zoom-in duration-200">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-800">새로운 컬럼 추가</h2>
                      <button onClick={() => setIsAddColumnModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">컬럼 이름</label>
                          <input
                              type="text"
                              value={newColumnName}
                              onChange={(e) => setNewColumnName(e.target.value)}
                              placeholder="컬럼 이름을 입력하세요"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddColumn();
                              }}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">데이터 타입</label>
                          <select
                              value={newColumnType}
                              onChange={(e) => setNewColumnType(e.target.value as ColumnType)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                              <option value={ColumnType.TEXT}>텍스트</option>
                              <option value={ColumnType.LONG_TEXT}>롱텍스트</option>
                              <option value={ColumnType.NUMBER}>숫자</option>
                              <option value={ColumnType.DATE_AUTO}>자동 날짜</option>
                              <option value={ColumnType.DATE_MANUAL}>수동 날짜</option>
                              <option value={ColumnType.TIME_AUTO}>자동 시간</option>
                              <option value={ColumnType.TIME_MANUAL}>수동 시간</option>
                              <option value={ColumnType.YMD_AUTO}>자동년월일</option>
                              <option value={ColumnType.YMD_MANUAL}>수동년월일</option>
                              <option value={ColumnType.CHECKLIST}>체크리스트</option>
                              <option value={ColumnType.CATEGORY}>카테고리</option>
                          </select>
                      </div>
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
                      <button
                          onClick={() => setIsAddColumnModalOpen(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                          취소
                      </button>
                      <button
                          onClick={handleAddColumn}
                          disabled={!newColumnName.trim()}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium"
                      >
                          추가
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Row Input Modal */}
      {isRowModalOpen && activeTable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] mx-4 max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">새 데이터 추가</h2>
                    <button onClick={() => setIsRowModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5">
                    {activeTable.columns.filter(c => !c.isHidden).map((col) => {
                        const isAuto = col.type === ColumnType.DATE_AUTO || col.type === ColumnType.TIME_AUTO || col.type === ColumnType.YMD_AUTO;
                        const isDate = col.type === ColumnType.DATE_AUTO || col.type === ColumnType.DATE_MANUAL;
                        const isTime = col.type === ColumnType.TIME_AUTO || col.type === ColumnType.TIME_MANUAL;
                        const isYMD = col.type === ColumnType.YMD_AUTO || col.type === ColumnType.YMD_MANUAL;
                        const isCategory = col.type === ColumnType.CATEGORY;
                        const inputType = isDate ? 'date' : isTime ? 'time' : isYMD ? 'date' : col.type === ColumnType.NUMBER ? 'number' : 'text';

                        const categoryGroup = isCategory ? categories.find(c => c.columnId === col.id) : undefined;

                        return (
                            <div key={col.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {col.name}
                                    {isAuto && <span className="text-blue-500 text-xs ml-1 font-normal">(자동입력)</span>}
                                </label>
                                {isCategory ? (
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white"
                                        value={rowFormData[col.id] || ''}
                                        onChange={(e) => setRowFormData({...rowFormData, [col.id]: e.target.value})}
                                    >
                                        <option value="">선택 없음</option>
                                        {categoryGroup?.items.map((item) => (
                                            <option key={item.id} value={item.name}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={inputType}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                                            isAuto ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300'
                                        }`}
                                        value={rowFormData[col.id] || ''}
                                        onChange={(e) => setRowFormData({...rowFormData, [col.id]: e.target.value})}
                                        disabled={isAuto}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={() => setIsRowModalOpen(false)}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={saveNewRow}
                        className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                        <Save className="w-4 h-4" /> 저장
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* CSV Upload Modal */}
      {isCSVUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[102] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">CSV 파일 업로드</h3>
                <button
                  onClick={() => {
                    setIsCSVUploadModalOpen(false);
                    setCSVValidationResult(null);
                    setCSVPreviewData(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {!csvValidationResult ? (
                // File Selection UI
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                    <div className="font-semibold mb-2">주의사항:</div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>첫 행은 컬럼명이어야 합니다</li>
                      <li>컬럼명은 기존 테이블과 정확히 일치해야 합니다</li>
                      <li>선택사항: _memo 컬럼 포함 가능</li>
                    </ul>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('csv-file-input')?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-1">CSV 파일을 여기에 드래그하거나 클릭하여 선택</p>
                    <p className="text-xs text-gray-500">최대 크기: 10MB</p>
                  </div>

                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCSVFileSelect(file);
                    }}
                  />

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setIsCSVUploadModalOpen(false);
                        setCSVValidationResult(null);
                        setCSVPreviewData(null);
                      }}
                      className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : !csvValidationResult.isValid ? (
                // Error Display UI
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-700 mb-3">검증 오류</h4>
                    <div className="space-y-2">
                      {csvValidationResult.errors?.map((error, idx) => (
                        <div key={idx} className="text-sm text-red-600 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsCSVUploadModalOpen(false);
                        setCSVValidationResult(null);
                        setCSVPreviewData(null);
                      }}
                      className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        document.getElementById('csv-file-input')?.click();
                        setCSVValidationResult(null);
                        setCSVPreviewData(null);
                      }}
                      className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors font-medium"
                    >
                      다시 선택
                    </button>
                  </div>
                </div>
              ) : (
                // Preview UI
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 mb-2">✓ 검증 완료</h4>
                    <p className="text-sm text-green-600">
                      유효한 행: <strong>{csvValidationResult.validatedRows?.length || 0}</strong>개
                    </p>
                  </div>

                  {csvValidationResult.validatedRows && csvValidationResult.validatedRows.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700">미리보기 (첫 5행)</h4>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              {activeTable?.columns.map(col => (
                                <th key={col.id} className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap">
                                  {col.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvValidationResult.validatedRows.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {activeTable?.columns.map(col => (
                                  <td key={col.id} className="px-3 py-2 text-gray-700 truncate max-w-xs">
                                    {row[col.id] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setIsCSVUploadModalOpen(false);
                        setCSVValidationResult(null);
                        setCSVPreviewData(null);
                      }}
                      className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        document.getElementById('csv-file-input')?.click();
                        setCSVValidationResult(null);
                        setCSVPreviewData(null);
                      }}
                      className="flex-1 px-4 py-2 text-sm bg-gray-500 text-white hover:bg-gray-600 rounded-lg transition-colors font-medium"
                    >
                      다시 선택
                    </button>
                    <button
                      onClick={handleCSVUpload}
                      className="flex-1 px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors font-medium"
                    >
                      업로드
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bookmark Context Menu */}
      {bookmarkContextMenu && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setBookmarkContextMenu(null)}
          />
          <div
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[150px] overflow-hidden animate-in fade-in zoom-in duration-150"
            style={{
              left: `${bookmarkContextMenu.x}px`,
              top: `${bookmarkContextMenu.y}px`,
            }}
          >
            <button
              onClick={() => {
                const group = bookmarks.find(g => g.id === bookmarkContextMenu.groupId);
                if (group) handleBookmarkEditOpen(group);
              }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-blue-50 flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span>수정</span>
            </button>
            <button
              onClick={() => handleBookmarkDelete(bookmarkContextMenu.groupId)}
              className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 flex items-center gap-2 transition-colors border-t"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>삭제</span>
            </button>
          </div>
        </>
      )}

      {/* Bookmark Edit Modal */}
      {isBookmarkEditModalOpen && editingBookmarkGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">북마크 수정</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Name Input */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  이름 (읍자 이름):
                </label>
                <input
                  type="text"
                  value={bookmarkEditForm.name}
                  onChange={(e) =>
                    setBookmarkEditForm({
                      ...bookmarkEditForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="예: 호실관리"
                />
              </div>

              {/* Area Selection */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  영역:
                </label>
                <select
                  value={bookmarkEditForm.area}
                  onChange={(e) =>
                    setBookmarkEditForm({
                      ...bookmarkEditForm,
                      area: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {[1, 2, 3, 4].map((num) => (
                    <option key={num} value={num}>
                      영역 {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Palette */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-3">
                  색상:
                </label>
                <div className="flex flex-wrap gap-3">
                  {BOOKMARK_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() =>
                        setBookmarkEditForm({
                          ...bookmarkEditForm,
                          color: color.hex,
                        })
                      }
                      className={`w-10 h-10 rounded-lg transition-all ${
                        bookmarkEditForm.color === color.hex
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setIsBookmarkEditModalOpen(false);
                  setEditingBookmarkGroup(null);
                }}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleBookmarkSave}
                className="flex-1 px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors font-medium"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}