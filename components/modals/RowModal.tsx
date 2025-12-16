import React from 'react';
import { X } from 'lucide-react';
import { Column, ColumnType, TableDefinition } from '../../types';

interface RowModalProps {
  isOpen: boolean;
  rowFormData: Record<string, any>;
  onFieldChange: (colId: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  activeTable: TableDefinition | null;
}

/**
 * RowModal - Add or edit row data
 * Renders form fields based on column definitions
 */
export const RowModal: React.FC<RowModalProps> = ({
  isOpen,
  rowFormData,
  onFieldChange,
  onSave,
  onCancel,
  activeTable
}) => {
  if (!isOpen || !activeTable) return null;

  const renderField = (col: Column) => {
    const value = rowFormData[col.id] || '';

    switch (col.type) {
      case ColumnType.LONG_TEXT:
        return (
          <textarea
            key={col.id}
            value={value}
            onChange={(e) => onFieldChange(col.id, e.target.value)}
            placeholder={col.name}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
          />
        );

      case ColumnType.NUMBER:
        return (
          <input
            key={col.id}
            type="number"
            value={value}
            onChange={(e) => onFieldChange(col.id, e.target.value)}
            placeholder={col.name}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        );

      case ColumnType.DATE_AUTO:
      case ColumnType.DATE_MANUAL:
        return (
          <input
            key={col.id}
            type="date"
            value={value}
            onChange={(e) => onFieldChange(col.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        );

      case ColumnType.CATEGORY:
        return (
          <input
            key={col.id}
            type="text"
            value={value}
            onChange={(e) => onFieldChange(col.id, e.target.value)}
            placeholder={col.name}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            list={`${col.id}-list`}
          />
        );

      case ColumnType.CHECKLIST:
        return (
          <input
            key={col.id}
            type="text"
            value={value}
            onChange={(e) => onFieldChange(col.id, e.target.value)}
            placeholder={col.name}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        );

      case ColumnType.TEXT:
      default:
        return (
          <input
            key={col.id}
            type="text"
            value={value}
            onChange={(e) => onFieldChange(col.id, e.target.value)}
            placeholder={col.name}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">행 추가</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {activeTable.columns.map((col) => (
            <div key={col.id}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {col.name}
              </label>
              {renderField(col)}
            </div>
          ))}
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
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};
