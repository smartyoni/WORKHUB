import React, { useState, useEffect, useRef } from 'react';
import { RowData, Column, ChecklistItem, Reply, ColumnType, CategoryGroup, CategoryItem, GanttTask } from '../types';
import { X, Edit2, CheckSquare, Plus, Trash2, Save, ChevronDown, ChevronUp, Settings, ChevronLeft, Copy, RotateCcw } from 'lucide-react';
import GanttView from './GanttView';

/**
 * URL Detection and Rendering Utility
 *
 * Security: Uses React components (not dangerouslySetInnerHTML) to prevent XSS
 * Pattern: Detects http://, https://, and www. URLs
 */
const renderNotesWithLinks = (text: string): React.ReactNode => {
  // Regex pattern for URL detection
  // Matches: http://, https://, www.
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  urlPattern.lastIndex = 0;

  while ((match = urlPattern.exec(text)) !== null) {
    const matchedUrl = match[0];
    const startIndex = match.index;

    // Add text before URL
    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    // Create clickable link
    // Ensure www. URLs have protocol
    const href = matchedUrl.startsWith('www.')
      ? `https://${matchedUrl}`
      : matchedUrl;

    parts.push(
      <a
        key={startIndex}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800 break-all"
      >
        {matchedUrl}
      </a>
    );

    lastIndex = startIndex + matchedUrl.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

interface DetailPanelProps {
  tableName: string;
  row: RowData | null;
  columns: Column[];
  visibleColumns?: Column[];
  categories: CategoryGroup[];
  setCategories: (categories: CategoryGroup[]) => void;
  sidebarColumnId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedRow: RowData) => void;
  onDeleteRow: (rowId: string) => void;
  setIsConfirmModalOpen: (isOpen: boolean) => void;
  setConfirmModalMessage: (message: string) => void;
  setConfirmModalAction: (action: (() => void) | null) => void;
  isMobile?: boolean;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  tableName,
  row,
  columns,
  visibleColumns,
  categories,
  setCategories,
  sidebarColumnId,
  isOpen,
  onClose,
  onUpdate,
  onDeleteRow,
  setIsConfirmModalOpen,
  setConfirmModalMessage,
  setConfirmModalAction,
  isMobile = false
}) => {
  const [localRow, setLocalRow] = useState<RowData | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false);

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'checklist' | 'gantt' | 'note'>('checklist');

  // Checklist State
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Note Tab State
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteEditBuffer, setNoteEditBuffer] = useState('');

  // Category Management State
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [currentEditingCategoryColumn, setCurrentEditingCategoryColumn] = useState<Column | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    setLocalRow(row);
    setIsEditingInfo(false);
    setEditingChecklistId(null);
    setNewChecklistText('');
    setIsBasicInfoOpen(false);
  }, [row]);

  // Reset note edit state when switching tabs or rows
  useEffect(() => {
    setIsEditingNote(false);
    setNoteEditBuffer('');
  }, [activeTab, row?.id]);

  if (!localRow || !isOpen) return null;

  const handleInfoChange = (field: string, value: any) => {
    if (!localRow) return;
    setLocalRow({ ...localRow, [field]: value });
  };

  const saveChanges = () => {
    if (localRow) {
      onUpdate(localRow);
      setIsEditingInfo(false);
    }
  };

  // Category Management Functions
  const getCategoryGroup = (columnId: string): CategoryGroup | undefined => {
    return categories.find(c => c.columnId === columnId);
  };

  const addCategory = (columnId: string, categoryName: string) => {
    if (!categoryName.trim()) return;

    const categoryGroup = getCategoryGroup(columnId);
    if (categoryGroup) {
      const newItem: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: categoryName.trim(),
        color: '#E5E7EB'
      };
      setCategories(
        categories.map(c =>
          c.columnId === columnId
            ? { ...c, items: [...c.items, newItem] }
            : c
        )
      );
    }
    setNewCategoryName('');
  };

  const deleteCategory = (columnId: string, categoryId: string) => {
    setCategories(
      categories.map(c =>
        c.columnId === columnId
          ? { ...c, items: c.items.filter(item => item.id !== categoryId) }
          : c
      )
    );
  };

  const openCategoryManager = (col: Column) => {
    const categoryGroup = getCategoryGroup(col.id);
    if (!categoryGroup) {
      // Create new category group if it doesn't exist
      setCategories([
        ...categories,
        {
          id: `catgroup-${col.id}`,
          name: col.name,
          columnId: col.id,
          tableId: tableName,
          items: []
        }
      ]);
    }
    setCurrentEditingCategoryColumn(col);
    setIsEditingCategory(true);
    setNewCategoryName('');
  };

  const getInputType = (type: ColumnType) => {
      switch (type) {
          case ColumnType.NUMBER: return 'number';
          case ColumnType.DATE_AUTO:
          case ColumnType.DATE_MANUAL: return 'date';
          case ColumnType.TIME_AUTO:
          case ColumnType.TIME_MANUAL: return 'time';
          default: return 'text';
      }
  };

  const isLongText = (type: ColumnType): boolean => {
      return type === ColumnType.LONG_TEXT;
  };

  // --- Checklist Logic ---

  const addChecklist = () => {
    if (!newChecklistText.trim() || !localRow) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistText.trim(),
      isChecked: false,
      replies: []
    };

    const updatedRow = {
      ...localRow,
      _checklists: [...localRow._checklists, newItem]
    };

    setLocalRow(updatedRow);
    onUpdate(updatedRow);
    setNewChecklistText('');
  };

  const toggleChecklist = (id: string) => {
    if (!localRow) return;
    const updatedChecklists = localRow._checklists.map(item =>
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    );
    const updatedRow = { ...localRow, _checklists: updatedChecklists };
    setLocalRow(updatedRow);
    onUpdate(updatedRow);
  };

  const deleteChecklist = (id: string) => {
    setConfirmModalMessage("이 체크리스트를 삭제하시겠습니까?");
    setConfirmModalAction(() => {
      if (!localRow) return;
      const updatedChecklists = localRow._checklists.filter(item => item.id !== id);
      const updatedRow = { ...localRow, _checklists: updatedChecklists };
      setLocalRow(updatedRow);
      onUpdate(updatedRow);
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  // Auto-adjust textarea height
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
  };

  const updateChecklistText = (id: string, value: string) => {
    if (!localRow) return;
    const updatedChecklists = localRow._checklists.map(item =>
      item.id === id ? { ...item, text: value } : item
    );
    const updatedRow = { ...localRow, _checklists: updatedChecklists };
    setLocalRow(updatedRow);
    onUpdate(updatedRow);
  };

  const saveNote = () => {
    if (!localRow) return;
    const updatedRow = { ...localRow, _notes: noteEditBuffer };
    setLocalRow(updatedRow);
    onUpdate(updatedRow);
    setIsEditingNote(false);
  };

  const clearNote = () => {
    if (isEditingNote) {
      setNoteEditBuffer('');
    } else {
      if (localRow && localRow._notes) {
        const updatedRow = { ...localRow, _notes: '' };
        setLocalRow(updatedRow);
        onUpdate(updatedRow);
      }
    }
  };

  const copyNote = () => {
    const textToCopy = isEditingNote ? noteEditBuffer : (localRow?._notes || '');
    navigator.clipboard.writeText(textToCopy);
  };

  // Mobile Layout - Bottom sheet modal
  if (isMobile) {
    return (
      <div className="w-full flex flex-col h-full bg-white overflow-y-auto overflow-x-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 shrink-0">
          <h2 className="text-base font-bold text-gray-800">{localRow[columns[0]?.id] || '-'}</h2>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                if (confirm("이 행을 삭제하시겠습니까?")) {
                  onDeleteRow(localRow.id);
                }
              }}
              className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 shrink-0"
              title="이 행 삭제"
            >
              삭제
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeTab === 'checklist'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 bg-gray-50'
            }`}
          >
            체크리스트
          </button>
          <button
            onClick={() => setActiveTab('gantt')}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeTab === 'gantt'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 bg-gray-50'
            }`}
          >
            간트차트
          </button>
          <button
            onClick={() => setActiveTab('note')}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeTab === 'note'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                : 'text-gray-500 bg-gray-50'
            }`}
          >
            NOTE
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          {activeTab === 'checklist' ? (
            <>


          {/* Checklist */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 flex-shrink-0">
              체크리스트
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({localRow._checklists.filter(c => c.isChecked).length}/{localRow._checklists.length})
              </span>
            </h3>

            <div className="flex gap-2 mt-3 flex-shrink-0">
              <textarea
                placeholder="항목 추가 (Ctrl+Enter로 추가)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-green-500 resize-none"
                rows={1}
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    addChecklist();
                  }
                }}
              />
              <button
                onClick={addChecklist}
                className="p-2 bg-green-500 rounded-md hover:bg-green-600 text-white flex-shrink-0"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 mt-3">
              {localRow._checklists.map((item) => {
                return (
                  <div key={item.id} className="group bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleChecklist(item.id)}
                        className={`mt-0.5 w-4 h-4 flex items-center justify-center rounded border shrink-0 ${
                          item.isChecked
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-gray-300 text-transparent hover:border-green-400'
                        } transition-colors`}
                      >
                        <CheckSquare className="w-2.5 h-2.5" />
                      </button>

                      <div className="flex-1 min-w-0">
                        {editingChecklistId === item.id ? (
                            <textarea
                                autoFocus
                                className="w-full text-base font-semibold border-b border-blue-400 outline-none pb-0.5 resize-none whitespace-pre-wrap min-h-[100px]"
                                rows={2}
                                defaultValue={item.text}
                                onBlur={(e) => updateChecklistText(item.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        e.preventDefault();
                                        updateChecklistText(item.id, e.currentTarget.value);
                                    }
                                }}
                                onChange={(e) => adjustTextareaHeight(e.target)}
                                ref={(el) => {
                                  if (el && editingChecklistId === item.id) {
                                    setTimeout(() => adjustTextareaHeight(el), 0);
                                  }
                                }}
                            />
                        ) : (
                            <span
                                className={`text-base font-semibold cursor-pointer select-none block whitespace-pre-wrap break-words ${item.isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                                onDoubleClick={() => setEditingChecklistId(item.id)}
                            >
                                {item.text}
                            </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteChecklist(item.id)}
                        className={`text-gray-300 hover:text-red-500 shrink-0 ${isMobile ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-1 flex-shrink-0 mt-5 border-t border-gray-100 pt-4">
            <div className="w-full flex items-center justify-between border-b-2 border-blue-500 pb-2 hover:bg-gray-50 rounded px-2 py-1 transition-colors gap-2">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <h3 className="text-sm font-bold text-gray-700">기본 정보</h3>
                {sidebarColumnId && localRow && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm font-bold text-gray-700">
                      {columns.find(c => c.id === sidebarColumnId)?.name}:
                    </span>
                    <span className="text-sm text-gray-700">
                      {localRow[sidebarColumnId] || '-'}
                    </span>
                  </>
                )}
              </div>
              {isEditingInfo ? (
                <button
                  onClick={saveChanges}
                  className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 shrink-0"
                >
                  <Save className="w-3 h-3" /> 저장
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditingInfo(true);
                    setIsBasicInfoOpen(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shrink-0"
                >
                  <Edit2 className="w-3 h-3" /> 수정
                </button>
              )}
              <button
                onClick={() => setIsBasicInfoOpen(!isBasicInfoOpen)}
                className="p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
              >
                {isBasicInfoOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>

            {isBasicInfoOpen && (
              <div className="space-y-2 mt-2">
                {/* Sidebar Column Edit Section */}
                {sidebarColumnId && localRow && (
                  <div className="pb-2 border-b border-gray-100">
                    {(() => {
                      const sidebarCol = columns.find(c => c.id === sidebarColumnId);
                      if (!sidebarCol) return null;

                      const categoryGroup = categories.find(c => c.columnId === sidebarColumnId);
                      const isCategoryType = sidebarCol.type === ColumnType.CATEGORY;

                      return (
                        <div className="flex flex-wrap gap-2 items-start">
                          <span className="text-gray-800 font-bold whitespace-nowrap">{sidebarCol.name}:</span>
                          {isCategoryType ? (
                            <div className="flex-1 flex gap-1 items-center">
                              {isEditingInfo ? (
                                <>
                                  <select
                                    value={localRow[sidebarColumnId] || ''}
                                    onChange={(e) => handleInfoChange(sidebarColumnId, e.target.value)}
                                    className="flex-1 p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                  >
                                    <option value="">선택 없음</option>
                                    {categoryGroup?.items.map((item) => (
                                      <option key={item.id} value={item.name}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => openCategoryManager(sidebarCol)}
                                    className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                    title="카테고리 관리"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-gray-800 break-words flex-1">
                                  {localRow[sidebarColumnId] || '-'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              {isEditingInfo ? (
                                isLongText(sidebarCol.type) ? (
                                  <textarea
                                    value={localRow[sidebarColumnId] || ''}
                                    onChange={(e) => handleInfoChange(sidebarColumnId, e.target.value)}
                                    className="flex-1 min-w-[100px] p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm resize-none"
                                    rows={4}
                                  />
                                ) : (
                                  <input
                                    type={getInputType(sidebarCol.type)}
                                    value={localRow[sidebarColumnId] || ''}
                                    onChange={(e) => handleInfoChange(sidebarColumnId, e.target.value)}
                                    className="flex-1 min-w-[100px] p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                  />
                                )
                              ) : (
                                <span className="text-gray-800 break-words flex-1 whitespace-pre-wrap">
                                  {localRow[sidebarColumnId] || '-'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="space-y-1 text-xs">
              {(visibleColumns || columns).filter(col => col.id !== sidebarColumnId).map((col) => {
                const categoryGroup = getCategoryGroup(col.id);
                const isCategoryType = col.type === ColumnType.CATEGORY;

                return (
                  <div key={col.id} className="flex flex-wrap gap-2 items-start">
                    <span className="text-gray-800 font-bold whitespace-nowrap">{col.name}:</span>
                    {isCategoryType ? (
                      <div className="flex-1 flex gap-1 items-center">
                        {isEditingInfo ? (
                          <>
                            <select
                              value={localRow[col.id] || ''}
                              onChange={(e) => handleInfoChange(col.id, e.target.value)}
                              className="flex-1 p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                            >
                              <option value="">선택 없음</option>
                              {categoryGroup?.items.map((item) => (
                                <option key={item.id} value={item.name}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => openCategoryManager(col)}
                              className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                              title="카테고리 관리"
                            >
                              <Settings className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-800 break-words flex-1">
                            {localRow[col.id] || '-'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {isEditingInfo ? (
                          isLongText(col.type) ? (
                            <textarea
                              value={localRow[col.id] || ''}
                              onChange={(e) => handleInfoChange(col.id, e.target.value)}
                              className="flex-1 min-w-[100px] p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm resize-none"
                              rows={4}
                            />
                          ) : (
                            <input
                              type={getInputType(col.type)}
                              value={localRow[col.id] || ''}
                              onChange={(e) => handleInfoChange(col.id, e.target.value)}
                              className="flex-1 min-w-[100px] p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                            />
                          )
                        ) : (
                          <span className="text-gray-800 break-words flex-1 whitespace-pre-wrap">
                            {localRow[col.id] || '-'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
              </div>
            )}
          </div>
            </>
          ) : activeTab === 'gantt' ? (
            <GanttView
              tasks={localRow._ganttTasks}
              onTasksUpdate={(updatedTasks) => {
                const updatedRow = { ...localRow, _ganttTasks: updatedTasks };
                setLocalRow(updatedRow);
                onUpdate(updatedRow);
              }}
              isMobile={true}
            />
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700">NOTE</h3>
                <div className="flex gap-1">
                  {isEditingNote ? (
                    <button onClick={saveNote} className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700">
                      <Save className="w-3 h-3" /> 저장
                    </button>
                  ) : (
                    <button onClick={() => { setIsEditingNote(true); setNoteEditBuffer(localRow._notes || ''); }} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                      <Edit2 className="w-3 h-3" /> 수정
                    </button>
                  )}
                  <button onClick={clearNote} className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600" title="초기화">
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button onClick={copyNote} className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700" title="복사">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {isEditingNote ? (
                <textarea value={noteEditBuffer} onChange={(e) => setNoteEditBuffer(e.target.value)} className="flex-1 w-full p-3 border-2 border-orange-300 rounded-md text-sm focus:outline-none focus:border-orange-500 resize-none" placeholder="메모를 입력하세요..." />
              ) : (
                <div className="flex-1 overflow-y-auto p-3 border border-gray-200 rounded-md bg-gray-50 cursor-text" onDoubleClick={() => { setIsEditingNote(true); setNoteEditBuffer(localRow._notes || ''); }}>
                  {localRow._notes ? (
                    <div className="text-sm whitespace-pre-wrap break-words">{renderNotesWithLinks(localRow._notes)}</div>
                  ) : (
                    <p className="text-gray-400 text-sm">메모가 없습니다. (더블클릭으로 편집)</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout - Side panel
  return (
    <div
      className={`fixed inset-y-0 right-0 w-[900px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-gray-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-800">{localRow[columns[0]?.id] || '-'}</h2>
        <div className="flex items-center gap-2">
            <button
                onClick={() => {
                  if (confirm("이 행을 삭제하시겠습니까?")) {
                    onDeleteRow(localRow.id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors shadow-sm shrink-0"
                title="이 행 삭제"
            >
                삭제
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'checklist'
              ? 'text-green-600 border-b-2 border-green-600 -mb-px'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          체크리스트
        </button>
        <button
          onClick={() => setActiveTab('gantt')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'gantt'
              ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          간트차트
        </button>
        <button
          onClick={() => setActiveTab('note')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'note'
              ? 'text-orange-600 border-b-2 border-orange-600 -mb-px'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          NOTE
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-6">
        {activeTab === 'checklist' ? (
          <>
            {/* Basic Info */}
        <div className="space-y-1 flex-shrink-0">
          <div className="w-full flex items-center justify-between border-b-2 border-blue-500 pb-2 hover:bg-gray-50 px-2 py-1 rounded transition-colors gap-2">
            <div className="flex items-center gap-2 flex-1">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                기본 정보
              </h3>
              {sidebarColumnId && localRow && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="text-sm font-bold text-gray-700">
                    {columns.find(c => c.id === sidebarColumnId)?.name}:
                  </span>
                  <span className="text-sm text-gray-700">
                    {localRow[sidebarColumnId] || '-'}
                  </span>
                </>
              )}
            </div>
            {isEditingInfo ? (
              <button
                onClick={saveChanges}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors shadow-sm shrink-0"
              >
                <Save className="w-3.5 h-3.5" /> 저장
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsEditingInfo(true);
                  setIsBasicInfoOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" /> 수정
              </button>
            )}
            <button
              onClick={() => setIsBasicInfoOpen(!isBasicInfoOpen)}
              className="p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
            >
              {isBasicInfoOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {isBasicInfoOpen && (
            <>
              {/* Sidebar Column Edit Section */}
              {sidebarColumnId && localRow && (
                <div className="space-y-0.5 text-xs mt-3 pb-3 border-b border-gray-100">
                  {(() => {
                    const sidebarCol = columns.find(c => c.id === sidebarColumnId);
                    if (!sidebarCol) return null;

                    const categoryGroup = categories.find(c => c.columnId === sidebarColumnId);
                    const isCategoryType = sidebarCol.type === ColumnType.CATEGORY;

                    return (
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <span className="text-gray-500 font-medium">{sidebarCol.name}</span>
                        <div className="col-span-2">
                          {isCategoryType ? (
                            <div className="flex gap-2 items-center">
                              {isEditingInfo ? (
                                <>
                                  <select
                                    value={localRow[sidebarColumnId] || ''}
                                    onChange={(e) => handleInfoChange(sidebarColumnId, e.target.value)}
                                    className="flex-1 p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  >
                                    <option value="">선택 없음</option>
                                    {categoryGroup?.items.map((item) => (
                                      <option key={item.id} value={item.name}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => openCategoryManager(sidebarCol)}
                                    className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors shrink-0"
                                    title="카테고리 관리"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-gray-800 break-words block min-h-[1.5rem]">
                                  {localRow[sidebarColumnId] || '-'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              {isEditingInfo ? (
                                isLongText(sidebarCol.type) ? (
                                  <textarea
                                    value={localRow[sidebarColumnId] || ''}
                                    onChange={(e) => handleInfoChange(sidebarColumnId, e.target.value)}
                                    className="w-full p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                                    rows={4}
                                  />
                                ) : (
                                  <input
                                    type={getInputType(sidebarCol.type)}
                                    value={localRow[sidebarColumnId] || ''}
                                    onChange={(e) => handleInfoChange(sidebarColumnId, e.target.value)}
                                    className="w-full p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                )
                              ) : (
                                <span className="text-gray-800 break-words block min-h-[1.5rem] whitespace-pre-wrap">
                                  {localRow[sidebarColumnId] || '-'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-0.5 text-xs mt-2">
            {(visibleColumns || columns).filter(col => col.id !== sidebarColumnId).map((col) => {
              const categoryGroup = getCategoryGroup(col.id);
              const isCategoryType = col.type === ColumnType.CATEGORY;

              return (
                <div key={col.id} className="grid grid-cols-3 gap-4 items-center">
                  <span className="text-gray-500 font-medium">{col.name}</span>
                  <div className="col-span-2">
                    {isCategoryType ? (
                      <div className="flex gap-2 items-center">
                        {isEditingInfo ? (
                          <>
                            <select
                              value={localRow[col.id] || ''}
                              onChange={(e) => handleInfoChange(col.id, e.target.value)}
                              className="flex-1 p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                              <option value="">선택 없음</option>
                              {categoryGroup?.items.map((item) => (
                                <option key={item.id} value={item.name}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => openCategoryManager(col)}
                              className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors shrink-0"
                              title="카테고리 관리"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-800 break-words block min-h-[1.5rem] whitespace-pre-wrap">
                            {localRow[col.id] || '-'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {isEditingInfo ? (
                          isLongText(col.type) ? (
                            <textarea
                              value={localRow[col.id] || ''}
                              onChange={(e) => handleInfoChange(col.id, e.target.value)}
                              className="w-full p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                              rows={4}
                            />
                          ) : (
                            <input
                              type={getInputType(col.type)}
                              value={localRow[col.id] || ''}
                              onChange={(e) => handleInfoChange(col.id, e.target.value)}
                              className="w-full p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          )
                        ) : (
                          <span className="text-gray-800 break-words block min-h-[1.5rem] whitespace-pre-wrap">
                            {localRow[col.id] || '-'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
              </div>
            </>
          )}
        </div>

        {/* Checklist */}
        <div className="flex-1 overflow-hidden flex flex-col mt-8">
          <div className="flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-green-500 rounded-full"></span>
              체크리스트
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({localRow._checklists.filter(c => c.isChecked).length}/{localRow._checklists.length})
              </span>
            </h3>
          </div>

          {/* Add Checklist Input */}
          <div className="flex gap-2 mt-3 flex-shrink-0">
            <textarea
              placeholder="새로운 항목 추가... (Ctrl+Enter로 추가, Shift+Enter로 줄바꿈)"
              className="flex-1 px-3 py-2 border-2 border-gray-600 rounded-md text-sm focus:outline-none focus:border-green-500 resize-none"
              rows={1}
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  addChecklist();
                }
              }}
            />
            <button
              onClick={addChecklist}
              className="px-3 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Checklists List */}
          <div className="space-y-2 overflow-y-auto flex-1 mt-3">
            {localRow._checklists.map((item) => {
              return (
                <div key={item.id} className="group bg-gray-50 border-2 border-gray-600 rounded-lg p-2 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleChecklist(item.id)}
                      className={`mt-0.5 w-4 h-4 flex items-center justify-center rounded border-2 shrink-0 ${
                        item.isChecked
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-600 text-transparent hover:border-green-600'
                      } transition-colors`}
                    >
                      <CheckSquare className="w-3 h-3" />
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingChecklistId === item.id ? (
                        <textarea
                          autoFocus
                          className="w-full px-2 py-1 border-2 border-green-600 rounded text-base focus:outline-none bg-white resize-none whitespace-pre-wrap min-h-[100px]"
                          rows={3}
                          defaultValue={item.text}
                          onBlur={(e) => {
                            updateChecklistText(item.id, e.target.value);
                            setEditingChecklistId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              e.preventDefault();
                              updateChecklistText(item.id, e.currentTarget.value);
                              setEditingChecklistId(null);
                            }
                          }}
                          onChange={(e) => adjustTextareaHeight(e.target)}
                          ref={(el) => {
                            if (el && editingChecklistId === item.id) {
                              setTimeout(() => adjustTextareaHeight(el), 0);
                            }
                          }}
                        />
                      ) : (
                        <span
                          onDoubleClick={() => setEditingChecklistId(item.id)}
                          className={`text-base cursor-pointer hover:bg-white p-1 rounded block whitespace-pre-wrap break-words ${
                            item.isChecked ? 'text-gray-400 line-through' : 'text-gray-700'
                          }`}
                        >
                          {item.text}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteChecklist(item.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </>
        ) : activeTab === 'gantt' ? (
          <GanttView
            tasks={localRow._ganttTasks}
            onTasksUpdate={(updatedTasks) => {
              const updatedRow = { ...localRow, _ganttTasks: updatedTasks };
              setLocalRow(updatedRow);
              onUpdate(updatedRow);
            }}
            isMobile={false}
          />
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                NOTE
              </h3>
              <div className="flex gap-1">
                {isEditingNote ? (
                  <button onClick={saveNote} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors shadow-sm">
                    <Save className="w-3.5 h-3.5" /> 저장
                  </button>
                ) : (
                  <button onClick={() => { setIsEditingNote(true); setNoteEditBuffer(localRow._notes || ''); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> 수정
                  </button>
                )}
                <button onClick={clearNote} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors" title="초기화">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={copyNote} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors" title="복사">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {isEditingNote ? (
              <textarea value={noteEditBuffer} onChange={(e) => setNoteEditBuffer(e.target.value)} className="flex-1 w-full p-4 mt-3 border-2 border-orange-300 rounded-md text-sm focus:outline-none focus:border-orange-500 resize-none" placeholder="메모를 입력하세요..." />
            ) : (
              <div className="flex-1 overflow-y-auto p-4 mt-3 border border-gray-200 rounded-md bg-gray-50 cursor-text" onDoubleClick={() => { setIsEditingNote(true); setNoteEditBuffer(localRow._notes || ''); }}>
                {localRow._notes ? (
                  <div className="text-sm whitespace-pre-wrap break-words">{renderNotesWithLinks(localRow._notes)}</div>
                ) : (
                  <p className="text-gray-400 text-sm">메모가 없습니다. (더블클릭으로 편집)</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Management Modal */}
      {isEditingCategory && currentEditingCategoryColumn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">
                {currentEditingCategoryColumn.name} 관리
              </h3>
              <button
                onClick={() => {
                  setIsEditingCategory(false);
                  setCurrentEditingCategoryColumn(null);
                  setNewCategoryName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Add New Category */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">새로운 카테고리 추가</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="카테고리명을 입력하세요"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addCategory(currentEditingCategoryColumn.id, newCategoryName);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => addCategory(currentEditingCategoryColumn.id, newCategoryName)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">카테고리 목록</label>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {getCategoryGroup(currentEditingCategoryColumn.id)?.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-800">{item.name}</span>
                      </div>
                      <button
                        onClick={() => deleteCategory(currentEditingCategoryColumn.id, item.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="카테고리 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {!getCategoryGroup(currentEditingCategoryColumn.id)?.items.length && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      추가된 카테고리가 없습니다
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditingCategory(false);
                  setCurrentEditingCategoryColumn(null);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPanel;