
import React, { useState } from 'react';
import { Bookmark, BookmarkGroup } from '../types';
import { Plus, X, Clipboard } from 'lucide-react';

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
  
  // Clipboard State
  const [clipboard, setClipboard] = useState<Bookmark | null>(null);

  const addBookmark = (groupId: string) => {
    setEditingBookmark({ groupId });
    setTempName('');
    setTempUrl('');
  };

  const saveBookmark = () => {
    if (!editingBookmark || !tempName.trim()) return;

    setGroups(prev => prev.map(group => {
      if (group.id !== editingBookmark.groupId) return group;

      if (editingBookmark.bookmarkId) {
        return {
          ...group,
          items: group.items.map(item => item.id === editingBookmark.bookmarkId 
            ? { ...item, name: tempName, url: tempUrl } 
            : item
          )
        };
      } else {
        return {
          ...group,
          items: [...group.items, { id: Date.now().toString(), name: tempName, url: tempUrl }]
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
                  className={`relative group rounded-lg text-xs font-medium cursor-pointer flex items-center justify-center text-center transition-all shadow-sm border ${itemColors[group.id]} hover:shadow-md select-none opacity-100`}
                  onClick={() => item.url && window.open(item.url.startsWith('http') ? item.url : `https://${item.url}`, '_blank')}
                >
                  <span className="truncate w-full px-1 pt-1">{item.name}</span>
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
