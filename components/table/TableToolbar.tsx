import React from 'react';
import { Plus, Filter, Settings, Upload } from 'lucide-react';
import { TableDefinition } from '../../types';

interface TableToolbarProps {
  activeTable: TableDefinition | null;
  searchTerms: Record<string, string>;
  onSearchChange: (colId: string, value: string) => void;
  onAddTableClick: () => void;
  onFilterClick: () => void;
  onHiddenColumnsClick: () => void;
  onCSVUploadClick: () => void;
}

/**
 * TableToolbar - Top toolbar with search and action buttons
 * Displays search fields and table action buttons
 */
export const TableToolbar: React.FC<TableToolbarProps> = ({
  activeTable,
  searchTerms,
  onSearchChange,
  onAddTableClick,
  onFilterClick,
  onHiddenColumnsClick,
  onCSVUploadClick
}) => {
  if (!activeTable) {
    return (
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <p className="text-gray-500">테이블을 선택하세요</p>
        <button
          onClick={onAddTableClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 테이블
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* Table Name and Action Buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{activeTable.name}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onFilterClick}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="필터 생성"
          >
            <Filter className="w-4 h-4" />
            필터
          </button>
          <button
            onClick={onHiddenColumnsClick}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="숨겨진 컬럼 보기"
          >
            <Settings className="w-4 h-4" />
            컬럼
          </button>
          <button
            onClick={onCSVUploadClick}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="CSV 업로드"
          >
            <Upload className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={onAddTableClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>
      </div>

      {/* Search Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {activeTable.columns.map((col) => (
          <div key={col.id}>
            <input
              type="text"
              placeholder={`${col.name} 검색...`}
              value={searchTerms[col.id] || ''}
              onChange={(e) => onSearchChange(col.id, e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
