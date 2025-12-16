import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Column, ColumnType } from '../../types';

interface TableModalProps {
  isOpen: boolean;
  newTableName: string;
  newTableColumns: Omit<Column, 'id'>[];
  onNameChange: (name: string) => void;
  onColumnAdd: () => void;
  onColumnRemove: (index: number) => void;
  onColumnNameChange: (index: number, name: string) => void;
  onColumnTypeChange: (index: number, type: ColumnType) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * TableModal - Create new table dialog
 * Allows users to define table name and initial columns
 */
export const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  newTableName,
  newTableColumns,
  onNameChange,
  onColumnAdd,
  onColumnRemove,
  onColumnNameChange,
  onColumnTypeChange,
  onSave,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">새 테이블 생성</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Table Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              테이블 이름 *
            </label>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="테이블 이름 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Columns */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                컬럼
              </label>
              <button
                onClick={onColumnAdd}
                className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>

            <div className="space-y-3">
              {newTableColumns.map((col, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => onColumnNameChange(idx, e.target.value)}
                      placeholder="컬럼명"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <select
                    value={col.type}
                    onChange={(e) => onColumnTypeChange(idx, e.target.value as ColumnType)}
                    className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={ColumnType.TEXT}>텍스트</option>
                    <option value={ColumnType.LONG_TEXT}>롱텍스트</option>
                    <option value={ColumnType.NUMBER}>숫자</option>
                    <option value={ColumnType.DATE_AUTO}>날짜 (자동)</option>
                    <option value={ColumnType.DATE_MANUAL}>날짜 (직접)</option>
                    <option value={ColumnType.CHECKLIST}>체크리스트</option>
                    <option value={ColumnType.CATEGORY}>카테고리</option>
                  </select>
                  <button
                    onClick={() => onColumnRemove(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
            disabled={!newTableName.trim() || newTableColumns.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
};
