import React from 'react';
import { Trash2, ChevronDown, Edit2 } from 'lucide-react';
import { Column, ColumnType, RowData } from '../../types';

interface DataTableProps {
  activeTable: any | null;
  filteredRows: RowData[];
  visibleColumns: Column[];
  selectedRowId: string | null;
  onRowClick: (rowId: string) => void;
  onRowDelete: (rowId: string) => void;
  onRowContextMenu: (e: React.MouseEvent, rowId: string) => void;
  onChecklistToggle: (rowId: string) => void;
  resizingColId: string | null;
  onColumnResizeStart: (colId: string, e: React.MouseEvent) => void;
  onColumnMenuClick: (e: React.MouseEvent, colId: string) => void;
}

/**
 * DataTable - Main data table component
 * Renders rows and columns with various data types
 */
export const DataTable: React.FC<DataTableProps> = ({
  activeTable,
  filteredRows,
  visibleColumns,
  selectedRowId,
  onRowClick,
  onRowDelete,
  onRowContextMenu,
  onChecklistToggle,
  resizingColId,
  onColumnResizeStart,
  onColumnMenuClick
}) => {
  if (!activeTable) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        테이블을 선택하세요
      </div>
    );
  }

  const renderCellContent = (row: RowData, col: Column) => {
    const value = row[col.id];

    switch (col.type) {
      case ColumnType.LONG_TEXT:
        return (
          <div className="text-sm text-gray-700 line-clamp-2">
            {value || '-'}
          </div>
        );

      case ColumnType.NUMBER:
        return <div className="text-sm text-gray-700 text-right">{value || '-'}</div>;

      case ColumnType.DATE_AUTO:
      case ColumnType.DATE_MANUAL:
        return (
          <div className="text-sm text-gray-700">
            {value ? new Date(value).toLocaleDateString('ko-KR') : '-'}
          </div>
        );

      case ColumnType.CHECKLIST:
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={() => onChecklistToggle(row.id)}
              className="cursor-pointer"
            />
          </div>
        );

      case ColumnType.CATEGORY:
        return (
          <div className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
            {value || '-'}
          </div>
        );

      case ColumnType.TEXT:
      default:
        return <div className="text-sm text-gray-700">{value || '-'}</div>;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
          <tr>
            {visibleColumns.map((col) => (
              <th
                key={col.id}
                className="px-4 py-2 text-left font-semibold text-gray-700 text-sm border-r border-gray-200 bg-gray-100 relative group"
                onContextMenu={(e) => onColumnMenuClick(e, col.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{col.name}</span>
                  <div
                    onMouseDown={(e) => onColumnResizeStart(col.id, e)}
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500 transition-opacity"
                  />
                </div>
              </th>
            ))}
            <th className="px-4 py-2 text-center font-semibold text-gray-700 text-sm w-20 bg-gray-100">
              작업
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td
                colSpan={visibleColumns.length + 1}
                className="px-4 py-8 text-center text-gray-500"
              >
                데이터가 없습니다
              </td>
            </tr>
          ) : (
            filteredRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row.id)}
                onContextMenu={(e) => onRowContextMenu(e, row.id)}
                className={`border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors ${
                  selectedRowId === row.id ? 'bg-blue-100' : ''
                }`}
              >
                {visibleColumns.map((col) => (
                  <td
                    key={`${row.id}-${col.id}`}
                    className="px-4 py-2 border-r border-gray-200 text-sm"
                  >
                    {renderCellContent(row, col)}
                  </td>
                ))}
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowDelete(row.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
