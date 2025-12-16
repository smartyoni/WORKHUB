import React from 'react';
import { X } from 'lucide-react';
import { ColumnType } from '../../types';

interface AddColumnModalProps {
  isOpen: boolean;
  columnName: string;
  columnType: ColumnType;
  onNameChange: (name: string) => void;
  onTypeChange: (type: ColumnType) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * AddColumnModal - Add new column to table
 * Allows users to define column name and type
 */
export const AddColumnModal: React.FC<AddColumnModalProps> = ({
  isOpen,
  columnName,
  columnType,
  onNameChange,
  onTypeChange,
  onSave,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">컬럼 추가</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              컬럼명 *
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="컬럼명 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              데이터 타입 *
            </label>
            <select
              value={columnType}
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
            disabled={!columnName.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};
