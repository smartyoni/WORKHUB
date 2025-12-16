import { CustomFilter, FilterCondition, FilterTargetType, FilterOperator, RowData, TableDefinition } from '../types';

/**
 * Filter-related event handlers
 * Manages custom filter creation, deletion, and evaluation
 */

export const createFilterHandlers = (
  activeTableId: string,
  customFilters: CustomFilter[],
  setCustomFilters: (filters: CustomFilter[]) => void,
  activeFilterId: string | null,
  setActiveFilterId: (id: string | null) => void
) => {
  const openFilterModal = (
    setNewFilterName: (name: string) => void,
    setNewFilterConditions: (conditions: FilterCondition[]) => void,
    setIsFilterModalOpen: (open: boolean) => void
  ) => {
    setNewFilterName('');
    setNewFilterConditions([]);
    setIsFilterModalOpen(true);
  };

  const saveFilter = (
    newFilterName: string,
    newFilterConditions: FilterCondition[],
    activeTable: TableDefinition | undefined,
    setIsFilterModalOpen: (open: boolean) => void,
    setNewFilterName: (name: string) => void,
    setNewFilterConditions: (conditions: FilterCondition[]) => void
  ) => {
    if (!activeTable || !newFilterName.trim()) return;

    const newFilter: CustomFilter = {
      id: `filter-${Date.now()}`,
      tableId: activeTableId,
      name: newFilterName,
      conditions: newFilterConditions
    };

    setCustomFilters([...customFilters, newFilter]);
    setIsFilterModalOpen(false);
    setNewFilterName('');
    setNewFilterConditions([]);
  };

  const deleteFilter = (
    e: React.MouseEvent,
    filterId: string,
    filterName: string,
    setConfirmModalMessage: (msg: string) => void,
    setConfirmModalAction: (action: (() => void) | null) => void,
    setIsConfirmModalOpen: (open: boolean) => void
  ) => {
    e.stopPropagation();

    setConfirmModalMessage(`필터 "${filterName}"을(를) 삭제하시겠습니까?`);
    setConfirmModalAction(() => {
      const updatedFilters = customFilters.filter(f => f.id !== filterId);
      setCustomFilters(updatedFilters);

      if (activeFilterId === filterId) {
        setActiveFilterId(null);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const getOperatorsForTargetType = (type: FilterTargetType): Array<{ value: string; label: string }> => {
    switch (type) {
      case 'column':
        return [
          { value: 'contains', label: '포함' },
          { value: 'equals', label: '동일' },
          { value: 'startsWith', label: '시작' },
          { value: 'greaterThan', label: '초과' },
          { value: 'lessThan', label: '미만' }
        ];
      case 'memo':
        return [
          { value: 'isEmpty', label: '비어있음' },
          { value: 'isNotEmpty', label: '비어있지 않음' }
        ];
      case 'checklist':
        return [
          { value: 'hasChecked', label: '체크됨 항목 포함' },
          { value: 'hasUnchecked', label: '체크 안됨 항목 포함' },
          { value: 'allChecked', label: '모두 체크됨' },
          { value: 'checklistContains', label: '포함' }
        ];
      case 'reply':
        return [
          { value: 'hasReplies', label: '답글 있음' },
          { value: 'noReplies', label: '답글 없음' },
          { value: 'replyToday', label: '오늘 답글' },
          { value: 'replyThisWeek', label: '이주 답글' },
          { value: 'replyContains', label: '포함' }
        ];
      default:
        return [];
    }
  };

  const requiresValue = (operator: FilterOperator): boolean => {
    return ![
      'isEmpty',
      'isNotEmpty',
      'hasChecked',
      'hasUnchecked',
      'allChecked',
      'hasReplies',
      'noReplies',
      'replyToday',
      'replyThisWeek'
    ].includes(operator);
  };

  const getPlaceholder = (type: FilterTargetType, operator: FilterOperator): string => {
    if (type === 'column') {
      if (operator === 'contains') return '검색어 입력';
      if (operator === 'equals') return '정확한 값';
      if (operator === 'startsWith') return '시작 문자';
      if (operator === 'greaterThan' || operator === 'lessThan') return '숫자 입력';
    }
    if (type === 'checklist' && operator === 'checklistContains') return '체크리스트 항목 이름';
    if (type === 'reply' && operator === 'replyContains') return '답글 검색어';
    return '';
  };

  return {
    openFilterModal,
    saveFilter,
    deleteFilter,
    getOperatorsForTargetType,
    requiresValue,
    getPlaceholder,
  };
};
