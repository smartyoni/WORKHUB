
import React, { useState } from 'react';
import { Bookmark, BookmarkGroup } from '../types';
import { Plus, X, Clipboard } from 'lucide-react';

// 배경색의 밝기에 따라 테두리 색상을 결정하는 함수
const getBorderColor = (hexColor: string): string => {
  if (!hexColor || hexColor === '#FFFFFF') return '#000000';

  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // 밝기 계산 (YIQ 공식)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 밝으면 검은색, 어두우면 흰색
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

interface HeaderProps {
  groups: BookmarkGroup[];
  setGroups: React.Dispatch<React.SetStateAction<BookmarkGroup[]>>;
  // Add props for custom confirmation modal
  setIsConfirmModalOpen: (isOpen: boolean) => void;
  setConfirmModalMessage: (message: string) => void;
  setConfirmModalAction: (action: (() => void) | null) => void;
}

const Header: React.FC<HeaderProps> = ({ groups, setGroups, setIsConfirmModalOpen, setConfirmModalMessage, setConfirmModalAction }) => {
  const [editingBookmark, setEditingBookmark] = useState<{groupId: string, bookmarkId?: string} | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempUrl, setTempUrl] = useState('');
  const [tempColor, setTempColor] = useState('#FFFFFF');
  const [contextMenu, setContextMenu] = useState<{groupId: string, bookmarkId: string, x: number, y: number} | null>(null);
  
  // Clipboard State
  const [clipboard, setClipboard] = useState<Bookmark | null>(null);

  // Context Menu editing state
  const [contextMenuEdit, setContextMenuEdit] = useState<{
    groupId: string;
    bookmarkId: string;
    name: string;
    url: string;
    color: string;
  } | null>(null);

  const addBookmark = (groupId: string) => {
    setEditingBookmark({ groupId });
    setTempName('');
    setTempUrl('');
    setTempColor('#FFFFFF');
  };

  const saveBookmark = () => {
    if (!editingBookmark || !tempName.trim()) return;

    setGroups(prev => prev.map(group => {
      if (group.id !== editingBookmark.groupId) return group;

      if (editingBookmark.bookmarkId) {
        return {
          ...group,
          items: group.items.map(item => item.id === editingBookmark.bookmarkId
            ? { ...item, name: tempName, url: tempUrl, color: tempColor }
            : item
          )
        };
      } else {
        return {
          ...group,
          items: [...group.items, { id: Date.now().toString(), name: tempName, url: tempUrl, color: tempColor }]
        };
      }
    }));
    setEditingBookmark(null);
  };

  const deleteBookmark = (groupId: string, bookmarkId: string, bookmarkName: string) => {
    setIsConfirmModalOpen(true);
    setConfirmModalMessage(`북마크 '${bookmarkName}'을(를) 정말 삭제하시겠습니까?`);
    setConfirmModalAction(() => () => { // Action to perform on confirm
        setGroups(prev => prev.map(group => {
            if (group.id !== groupId) return group;
            return { ...group, items: group.items.filter(i => i.id !== bookmarkId) };
        }));
        setIsConfirmModalOpen(false); // Close modal after action
        setConfirmModalAction(null); // Clear action
    });
  };

  const copyBookmark = (item: Bookmark) => {
      setClipboard(item);
  };

  const pasteBookmark = (groupId: string) => {
      if (!clipboard) return;
      const group = groups.find(g => g.id === groupId);
      if (group && group.items.length >= 12) {
          alert('이 그룹은 가득 찼습니다.');
          return;
      }

      const newItem = { ...clipboard, id: Date.now().toString() };
      setGroups(prev => prev.map(g => {
          if (g.id !== groupId) return g;
          return { ...g, items: [...g.items, newItem] };
      }));
  };

  const groupColors: Record<string, string> = {
    'group-1': 'bg-yellow-50/80 border-yellow-200',
    'group-2': 'bg-blue-50/80 border-blue-200',
    'group-3': 'bg-orange-50/80 border-orange-200',
    'group-4': 'bg-green-50/80 border-green-200',
  };

  const itemColors: Record<string, string> = {
    'group-1': 'bg-white hover:bg-yellow-100 text-yellow-900 border-yellow-100',
    'group-2': 'bg-white hover:bg-blue-100 text-blue-900 border-blue-100',
    'group-3': 'bg-white hover:bg-orange-100 text-orange-900 border-orange-100',
    'group-4': 'bg-white hover:bg-green-100 text-green-900 border-green-100',
  };

  const itemAddColors: Record<string, string> = {
    'group-1': 'border-yellow-300/50 text-yellow-600 hover:bg-yellow-50',
    'group-2': 'border-blue-300/50 text-blue-600 hover:bg-blue-50',
    'group-3': 'border-orange-300/50 text-orange-600 hover:bg-orange-50',
    'group-4': 'border-green-300/50 text-green-600 hover:bg-green-50',
  };

  return (
    <header className="h-44 bg-white border-b border-gray-200 p-3 flex gap-3 overflow-x-auto shrink-0 shadow-sm z-10">
      {groups.map((group) => {
        const isFull = group.items.length >= 12;
        return (
          <div 
            key={group.id} 
            className={`flex-1 min-w-[320px] rounded-xl border ${groupColors[group.id]} p-2 flex flex-col shadow-sm transition-all relative overflow-hidden`}
          >
            {/* Grid Layout: 4 cols x 3 rows. */}
            <div className="grid grid-cols-4 grid-rows-3 gap-2 h-full">
              {/* Render existing bookmarks */}
              {group.items.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className={`relative group rounded-lg text-xs font-medium cursor-pointer flex items-center justify-center text-center transition-all shadow-sm border hover:shadow-md select-none opacity-100`}
                  style={{
                    backgroundColor: item.color || '#FFFFFF',
                    borderColor: getBorderColor(item.color || '#FFFFFF'),
                    color: '#1F2937',
                    maxHeight: '90%'
                  }}
                  onClick={() => item.url && window.open(item.url.startsWith('http') ? item.url : `https://${item.url}`, '_blank')}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenuEdit({
                      groupId: group.id,
                      bookmarkId: item.id,
                      name: item.name,
                      url: item.url,
                      color: item.color || '#FFFFFF'
                    });
                    setContextMenu({
                      groupId: group.id,
                      bookmarkId: item.id,
                      x: e.clientX,
                      y: e.clientY
                    });
                  }}
                >
                  <span className="truncate w-full px-1 flex items-center justify-center font-bold">{item.name}</span>
                </div>
              ))}

              {/* Add button / Paste button slot */}
              {!isFull && (
                  <button
                      className={`relative rounded-lg border-2 border-dashed flex items-center justify-center transition-all group/add ${itemAddColors[group.id]}`}
                      onClick={() => !clipboard && addBookmark(group.id)} // Only trigger default add if no clipboard
                  >
                      {clipboard ? (
                          <div className="absolute inset-0 flex">
                                <div 
                                    className="flex-1 flex items-center justify-center hover:bg-black/5 cursor-pointer rounded-l-lg"
                                    onClick={(e) => { e.stopPropagation(); addBookmark(group.id); }}
                                    title="새로 만들기"
                                >
                                    <Plus className="w-4 h-4" />
                                </div>
                                <div className="w-[1px] bg-current opacity-20 my-2"></div>
                                <div 
                                    className="flex-1 flex items-center justify-center hover:bg-black/5 cursor-pointer rounded-r-lg"
                                    onClick={(e) => { e.stopPropagation(); pasteBookmark(group.id); }}
                                    title="붙여넣기"
                                >
                                    <Clipboard className="w-4 h-4" />
                                </div>
                          </div>
                      ) : (
                          <Plus className="w-5 h-5 opacity-60" />
                      )}
                  </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Right-click Context Menu */}
      {contextMenu && contextMenuEdit && (() => {
        const menuWidth = 560; // w-[560px]
        const menuHeight = 350; // 대략적인 높이
        let left = contextMenu.x;
        let top = contextMenu.y;

        // 오른쪽 경계 초과 시 왼쪽 정렬
        if (left + menuWidth > window.innerWidth) {
          left = Math.max(0, window.innerWidth - menuWidth - 16);
        }

        // 아래쪽 경계 초과 시 위쪽 정렬
        if (top + menuHeight > window.innerHeight) {
          top = Math.max(0, window.innerHeight - menuHeight - 16);
        }

        return (
          <>
            <div
              className="fixed inset-0"
              onClick={() => {
                setContextMenu(null);
                setContextMenuEdit(null);
              }}
              style={{ zIndex: 999998 }}
            />
            <div
              className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-[560px] animate-in fade-in zoom-in duration-150 overflow-y-auto max-h-[80vh]"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                zIndex: 999999
              }}
            >
              <div className="p-4 flex gap-4">
              {/* 왼쪽 컬럼: 이름, URL, 영역 */}
              <div className="flex-1 space-y-4">
                {/* 이름 */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">이름</label>
                  <input
                    type="text"
                    value={contextMenuEdit.name}
                    onChange={(e) => setContextMenuEdit({ ...contextMenuEdit, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">URL</label>
                  <input
                    type="text"
                    value={contextMenuEdit.url}
                    onChange={(e) => setContextMenuEdit({ ...contextMenuEdit, url: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* 영역(그룹 선택) */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">영역</label>
                  <select
                    value={contextMenuEdit.groupId}
                    onChange={(e) => {
                      const newGroupId = e.target.value;
                      setContextMenuEdit({ ...contextMenuEdit, groupId: newGroupId });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 중간 컬럼: 색상 */}
              <div className="w-48">
                <label className="text-xs font-semibold text-gray-500 block mb-2">색상</label>
                <div className="grid grid-cols-4 gap-2">
                  {['#3B82F6', '#0EA5E9', '#06B6D4', '#14B8A6', '#22C55E', '#84CC16', '#FBBF24', '#F97316', '#EF4444', '#F43F5E', '#EC4899', '#D946EF', '#A855F7', '#7C3AED', '#6366F1', '#FFFFFF'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setContextMenuEdit({ ...contextMenuEdit, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        contextMenuEdit.color === color ? 'border-gray-800 ring-2 ring-offset-1 ring-blue-500' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* 오른쪽 컬럼: 버튼들 (세로 배열) */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setContextMenu(null);
                    setContextMenuEdit(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setIsConfirmModalOpen(true);
                    setConfirmModalMessage(`북마크 '${contextMenuEdit.name}'을(를) 정말 삭제하시겠습니까?`);
                    setConfirmModalAction(() => () => {
                      setGroups(prev => prev.map(group => {
                        if (group.id !== contextMenu.groupId) return group;
                        return { ...group, items: group.items.filter(i => i.id !== contextMenu.bookmarkId) };
                      }));
                      setIsConfirmModalOpen(false);
                      setConfirmModalAction(null);
                      setContextMenu(null);
                      setContextMenuEdit(null);
                    });
                  }}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  삭제
                </button>
                <button
                  onClick={() => {
                    // If moving to different group, remove from old group and add to new
                    if (contextMenuEdit.groupId !== contextMenu.groupId) {
                      setGroups(prev => prev.map(group => {
                        // Remove from old group
                        if (group.id === contextMenu.groupId) {
                          return { ...group, items: group.items.filter(i => i.id !== contextMenu.bookmarkId) };
                        }
                        // Add to new group
                        if (group.id === contextMenuEdit.groupId) {
                          return {
                            ...group,
                            items: [...group.items, {
                              id: contextMenu.bookmarkId,
                              name: contextMenuEdit.name,
                              url: contextMenuEdit.url,
                              color: contextMenuEdit.color
                            }]
                          };
                        }
                        return group;
                      }));
                    } else {
                      // Update in same group
                      setGroups(prev => prev.map(group => {
                        if (group.id !== contextMenuEdit.groupId) return group;
                        return {
                          ...group,
                          items: group.items.map(item =>
                            item.id === contextMenu.bookmarkId
                              ? {
                                  ...item,
                                  name: contextMenuEdit.name,
                                  url: contextMenuEdit.url,
                                  color: contextMenuEdit.color
                                }
                              : item
                          )
                        };
                      }));
                    }
                    setContextMenu(null);
                    setContextMenuEdit(null);
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  저장
                </button>
              </div>
              </div>
            </div>
            </>
        );
      })()}

      {/* Bookmark Modal */}
      {editingBookmark && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-[1px]">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-80 space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-gray-800 text-lg">
                {editingBookmark.bookmarkId ? '북마크 수정' : '새 북마크'}
            </h3>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">이름</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="예: 네이버웍스"
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveBookmark()}
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">링크 (선택)</label>
                    <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="URL 입력"
                        value={tempUrl}
                        onChange={e => setTempUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveBookmark()}
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-2 block">색상</label>
                    <div className="flex gap-2 flex-wrap">
                        {['#3B82F6', '#0EA5E9', '#06B6D4', '#14B8A6', '#22C55E', '#84CC16', '#FBBF24', '#F97316', '#EF4444', '#F43F5E', '#EC4899', '#D946EF', '#A855F7', '#7C3AED', '#6366F1', '#FFFFFF'].map((color) => (
                            <button
                                key={color}
                                onClick={() => setTempColor(color)}
                                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                    tempColor === color ? 'border-gray-800 ring-2 ring-offset-1 ring-blue-500' : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button 
                    onClick={() => setEditingBookmark(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >취소</button>
                <button 
                    onClick={saveBookmark}
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md transition-colors font-medium"
                >저장</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
