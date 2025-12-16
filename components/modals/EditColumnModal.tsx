import React from 'react';
import { X } from 'lucide-react';
import { Column, ColumnType } from '../../types';

interface EditColumnModalProps {
  isOpen: boolean;
  editingColumn: Omit<Column, 'id'> | null;
  onNameChange: (name: string) => void;
  onTypeChange: (type: ColumnType) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * EditColumnModal - Edit existing column properties
 * Allows modification of column name and type
 */
export const EditColumnModal: React.FC<EditColumnModalProps> = ({
  isOpen,
  editingColumn,
  onNameChange,
  onTypeChange,
  onSave,
  onCancel
}) => {
  if (!isOpen || !editingColumn) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">컬럼 수정</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Column Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              컬럼명 *
            </label>
            <input
              type="text"
              value={editingColumn.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="컬럼명 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Column Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              데이터 타입 *
            </label>
            <select
              value={editingColumn.type}
              onChange={(e) => onTypeChange(e.target.value as ColumnType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value={ColumnType.TEXT}>텍스트</option>
              <option value={ColumnType.LONG_TEXT}>롱텍스트</option>
              <option value={ColumnType.NUMBER}>숫자</option>
              <option value={ColumnType.DATE_AUTO}>날짜 (자동)</option>
              <option value={ColumnType.DATE_MANUAL}>날짜 (직접)</option>
              <option value={ColumnType.CHECKLIST}>체크리스트</option>
              <option value={ColumnType.CATEGORY}>카테고리</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              현재 데이터는 유지되며, 타입 변경 시 호환되지 않는 데이터는 초기화됩니다.
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={!editingColumn.name.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};
