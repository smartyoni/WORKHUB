import React, { useEffect, useRef } from 'react';
import { Copy, Edit2, EyeOff, Trash2 } from 'lucide-react';

interface ColumnMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  columnName: string;
  onEdit: () => void;
  onHide: () => void;
  onDelete: () => void;
  onSort: (order: 'asc' | 'desc') => void;
  onClose: () => void;
}

/**
 * ColumnMenu - Context menu for column operations
 * Appears on right-click of column header
 */
export const ColumnMenu: React.FC<ColumnMenuProps> = ({
  isOpen,
  x,
  y,
  columnName,
  onEdit,
  onHide,
  onDelete,
  onSort,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[200]"
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      <div className="py-1 text-xs font-semibold text-gray-600 px-3 py-2 border-b border-gray-100">
        {columnName}
      </div>
      <div className="py-1">
        <button
          onClick={() => {
            onSort('asc');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          오름차순 정렬
        </button>
        <button
          onClick={() => {
            onSort('desc');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          내림차순 정렬
        </button>
        <div className="border-t border-gray-100 my-1" />
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          수정
        </button>
        <button
          onClick={() => {
            onHide();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <EyeOff className="w-3 h-3" />
          숨기기
        </button>
        <div className="border-t border-gray-100 my-1" />
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          삭제
        </button>
      </div>
    </div>
  );
};
