import React from 'react';
import { X } from 'lucide-react';
import { BOOKMARK_COLORS } from '../../constants/colors';

interface BookmarkEditModalProps {
  isOpen: boolean;
  groupName: string;
  groupColor: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * BookmarkEditModal - Edit bookmark group name and color
 * Allows customization of bookmark group appearance and name
 */
export const BookmarkEditModal: React.FC<BookmarkEditModalProps> = ({
  isOpen,
  groupName,
  groupColor,
  onNameChange,
  onColorChange,
  onSave,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">북마크 수정</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              그룹명 *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="그룹 이름 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              색상 *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {BOOKMARK_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => onColorChange(color.id)}
                  className={`w-full aspect-square rounded-lg transition-all ${
                    groupColor === color.id
                      ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Color Preview */}
          {groupColor && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">미리보기</p>
              <div
                className="w-full h-10 rounded-lg transition-colors"
                style={{
                  backgroundColor: BOOKMARK_COLORS.find(c => c.id === groupColor)?.hex || '#3B82F6'
                }}
              />
            </div>
          )}
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
            disabled={!groupName.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};
