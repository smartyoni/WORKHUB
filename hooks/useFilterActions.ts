import { useCallback } from 'react';
import { FilterTargetType, FilterCondition, CustomFilter } from '../types';
import { useTableState } from '../contexts/TableStateContext';
import { useModalState } from '../contexts/ModalStateContext';
import { useUIState } from '../contexts/UIStateContext';

export const useFilterActions = () => {
  const tableState = useTableState();
  const modalState = useModalState();
  const uiState = useUIState();

  const openFilterModal = useCallback(() => {
    modalState.setNewFilterName('');
    modalState.setNewFilterConditions([]);
    modalState.setIsFilterModalOpen(true);
  }, []);

  const saveFilter = useCallback(() => {
    if (!tableState.activeTable || !modalState.newFilterName.trim()) return;

    const newFilter: CustomFilter = {
      id: `filter-${Date.now()}`,
      tableId: tableState.activeTableId,
      name: modalState.newFilterName,
      conditions: modalState.newFilterConditions
    };

    tableState.setCustomFilters([...tableState.customFilters, newFilter]);
    modalState.setIsFilterModalOpen(false);
    modalState.setNewFilterName('');
    modalState.setNewFilterConditions([]);
  }, [tableState.activeTable, tableState.activeTableId, tableState.customFilters, modalState.newFilterName, modalState.newFilterConditions]);

  const deleteFilter = useCallback((filterId: string, filterName: string) => {
    modalState.setConfirmModalMessage(`필터 "${filterName}"을(를) 삭제하시겠습니까?`);
    modalState.setConfirmModalAction(() => {
      const updatedFilters = tableState.customFilters.filter(f => f.id !== filterId);
      tableState.setCustomFilters(updatedFilters);

      if (uiState.activeFilterId === filterId) {
        uiState.setActiveFilterId(null);
      }
    });
    modalState.setIsConfirmModalOpen(true);
  }, [tableState.customFilters, uiState.activeFilterId]);

  const getOperatorsForTargetType = useCallback((type: FilterTargetType) => {
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
  }, []);

  const requiresValue = useCallback((operator: string, targetType: FilterTargetType) => {
    if (targetType === 'memo') return false;
    return !['isEmpty', 'isNotEmpty', 'hasReplies', 'noReplies', 'hasChecked', 'hasUnchecked', 'allChecked'].includes(operator);
  }, []);

  const getPlaceholder = useCallback((operator: string, targetType: FilterTargetType) => {
    if (targetType === 'column') {
      if (operator === 'contains') return '검색어 입력...';
      if (operator === 'equals') return '정확히 일치하는 값';
      if (operator === 'startsWith') return '시작 문자 입력...';
      if (operator === 'greaterThan' || operator === 'lessThan') return '숫자 입력...';
    }
    if (targetType === 'checklist' && operator === 'checklistContains') return '체크리스트 항목 검색...';
    if (targetType === 'reply' && operator === 'replyContains') return '답글 검색...';
    return '';
  }, []);

  return {
    openFilterModal,
    saveFilter,
    deleteFilter,
    getOperatorsForTargetType,
    requiresValue,
    getPlaceholder,
  };
};
