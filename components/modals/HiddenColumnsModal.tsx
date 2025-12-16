import React from 'react';
import { X, Eye } from 'lucide-react';
import { Column } from '../../types';

interface HiddenColumnsModalProps {
  isOpen: boolean;
  hiddenColumns: Column[];
  onRestore: (colId: string) => void;
  onClose: () => void;
}

/**
 * HiddenColumnsModal - Show and restore hidden columns
 * Allows users to make previously hidden columns visible again
 */
export const HiddenColumnsModal: React.FC<HiddenColumnsModalProps> = ({
  isOpen,
  hiddenColumns,
  onRestore,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">숨겨진 컬럼</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {hiddenColumns.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              숨겨진 컬럼이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {hiddenColumns.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{col.name}</p>
                    <p className="text-xs text-gray-500">타입: {col.type}</p>
                  </div>
                  <button
                    onClick={() => onRestore(col.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="복원"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
