import React from 'react';
import { X } from 'lucide-react';
import { Column, FilterTargetType } from '../../types';

interface FilterModalProps {
  isOpen: boolean;
  filterName: string;
  filterTargetType: FilterTargetType;
  filterTargetId: string;
  filterOperator: string;
  filterValue: string;
  onNameChange: (name: string) => void;
  onTargetTypeChange: (type: FilterTargetType) => void;
  onTargetIdChange: (id: string) => void;
  onOperatorChange: (op: string) => void;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  visibleColumns: Column[];
  availableOperators: string[];
  requiresValue: boolean;
}

/**
 * FilterModal - Create or edit custom filters
 * Supports multiple filter types and operators
 */
export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  filterName,
  filterTargetType,
  filterTargetId,
  filterOperator,
  filterValue,
  onNameChange,
  onTargetTypeChange,
  onTargetIdChange,
  onOperatorChange,
  onValueChange,
  onSave,
  onCancel,
  visibleColumns,
  availableOperators,
  requiresValue
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">필터 생성</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Filter Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              필터명 *
            </label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="필터 이름 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              필터 대상 *
            </label>
            <select
              value={filterTargetType}
              onChange={(e) => onTargetTypeChange(e.target.value as FilterTargetType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="column">컬럼</option>
              <option value="memo">메모</option>
              <option value="checklist">체크리스트</option>
              <option value="reply">답변</option>
            </select>
          </div>

          {/* Target ID (for column type) */}
          {filterTargetType === 'column' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                컬럼 선택 *
              </label>
              <select
                value={filterTargetId}
                onChange={(e) => onTargetIdChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">컬럼 선택</option>
                {visibleColumns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Operator */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              조건 *
            </label>
            <select
              value={filterOperator}
              onChange={(e) => onOperatorChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">조건 선택</option>
              {availableOperators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Value (if required) */}
          {requiresValue && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                값 *
              </label>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder="필터 값 입력"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-xl sticky bottom-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={!filterName.trim() || !filterOperator}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
};
