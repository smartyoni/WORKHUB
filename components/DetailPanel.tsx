import React, { useState, useEffect, useRef } from 'react';
import { RowData, Column, ChecklistItem, Reply, ColumnType, AppCategory } from '../types';
import { X, Edit2, CheckSquare, Plus, MessageSquare, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';

interface DetailPanelProps {
  tableName: string;
  row: RowData | null;
  columns: Column[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedRow: RowData) => void;
  onDeleteRow: (rowId: string) => void;
  categories: AppCategory[];
  categoryInputType: 'dropdown' | 'buttons';
  setIsConfirmModalOpen: (isOpen: boolean) => void;
  setConfirmModalMessage: (message: string) => void;
  setConfirmModalAction: (action: (() => void) | null) => void;
  isMobile?: boolean;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  tableName,
  row,
  columns,
  isOpen,
  onClose,
  onUpdate,
  onDeleteRow,
  categories,
  categoryInputType,
  setIsConfirmModalOpen,
  setConfirmModalMessage,
  setConfirmModalAction,
  isMobile = false
}) => {
  const [localRow, setLocalRow] = useState<RowData | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [isMemoExpanded, setIsMemoExpanded] = useState(false);
  
  // Checklist State
  const [newChecklistText, setNewChecklistText] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [expandedChecklistIds, setExpandedChecklistIds] = useState<string[]>([]);
  
  // Reply Input State (map checklist ID to text)
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalRow(row);
    setIsEditingInfo(false);
    setIsEditingMemo(false);
    setIsMemoExpanded(false);
    setExpandedChecklistIds([]); // Reset expanded state on row change
  }, [row]);

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

  // --- Checklist Logic ---

  // Sort Checklists: Unchecked first (newest to oldest), Checked last
  const sortedChecklists = [...localRow._checklists].sort((a, b) => {
      if (a.isChecked === b.isChecked) {
          // If both checked or both unchecked, sort by ID descending (newest first)
          // Assuming ID is timestamp-based
          return parseInt(b.id) - parseInt(a.id); 
      }
      // Unchecked (false) comes before Checked (true)
      return (a.isChecked ? 1 : 0) - (b.isChecked ? 1 : 0);
  });

  const addChecklist = () => {
    if (!newChecklistText.trim() || !localRow) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistText,
      isChecked: false,
      replies: [],
    };
    const updatedChecklists = [...localRow._checklists, newItem];
    const updatedRow = { ...localRow, _checklists: updatedChecklists };
    setLocalRow(updatedRow);
    onUpdate(updatedRow); // Auto save for checklist
    setNewChecklistText('');
  };

  const toggleChecklist = (id: string) => {
    if (!localRow) return;
    const updatedChecklists = localRow._checklists.map((item) =>
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    );
    const updatedRow = { ...localRow, _checklists: updatedChecklists };
    setLocalRow(updatedRow);
    onUpdate(updatedRow);
  };

  const deleteChecklist = (id: string) => {
    if (!localRow) return;
    
    setConfirmModalMessage("이 체크리스트와 하위 답글을 모두 삭제하시겠습니까?");
    setConfirmModalAction(() => () => {
        const updatedChecklists = localRow._checklists.filter((item) => item.id !== id);
        const updatedRow = { ...localRow, _checklists: updatedChecklists };
        setLocalRow(updatedRow);
        onUpdate(updatedRow);
        setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  const updateChecklistText = (id: string, newText: string) => {
      if (!localRow) return;
      const updatedChecklists = localRow._checklists.map((item) =>
          item.id === id ? { ...item, text: newText } : item
      );
      const updatedRow = { ...localRow, _checklists: updatedChecklists };
      setLocalRow(updatedRow);
      onUpdate(updatedRow);
      setEditingChecklistId(null);
  };

  const toggleRepliesExpansion = (id: string) => {
      if (expandedChecklistIds.includes(id)) {
          setExpandedChecklistIds(prev => prev.filter(eid => eid !== id));
      } else {
          setExpandedChecklistIds(prev => [...prev, id]);
      }
  };

  // --- Reply Logic ---

  const addReply = (checklistId: string) => {
    const text = replyInputs[checklistId];
    if (!text?.trim() || !localRow) return;

    const newReply: Reply = {
      id: Date.now().toString(),
      text: text,
      createdAt: new Date().toLocaleDateString(),
    };

    const updatedChecklists = localRow._checklists.map((item) => {
      if (item.id === checklistId) {
        return { ...item, replies: [...item.replies, newReply] };
      }
      return item;
    });

    const updatedRow = { ...localRow, _checklists: updatedChecklists };
    setLocalRow(updatedRow);
    onUpdate(updatedRow);
    setReplyInputs({ ...replyInputs, [checklistId]: '' });
    
    // Ensure expanded when adding reply
    if (!expandedChecklistIds.includes(checklistId)) {
        setExpandedChecklistIds(prev => [...prev, checklistId]);
    }
  };

  const deleteReply = (checklistId: string, replyId: string) => {
    if (!localRow) return;

    setConfirmModalMessage("이 답글을 삭제하시겠습니까?");
    setConfirmModalAction(() => () => {
        const updatedChecklists = localRow._checklists.map((item) => {
        if (item.id === checklistId) {
            return { ...item, replies: item.replies.filter((r) => r.id !== replyId) };
        }
        return item;
        });
        const updatedRow = { ...localRow, _checklists: updatedChecklists };
        setLocalRow(updatedRow);
        onUpdate(updatedRow);
        setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  // Mobile Layout - Bottom sheet modal
  if (isMobile) {
    return (
      <div className="w-full flex flex-col h-screen bg-white overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 shrink-0">
          <h2 className="text-base font-bold text-gray-800"></h2>
          <div className="flex items-center gap-0 ml-auto">
            <button
              onClick={() => onDeleteRow(localRow.id)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-500"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">카테고리</label>

            {categoryInputType === 'dropdown' ? (
                <select
                  value={localRow._category || categories[0]?.name || ''}
                  onChange={(e) => {
                    const updated = { ...localRow, _category: e.target.value };
                    setLocalRow(updated);
                    onUpdate(updated);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white text-sm"
                >
                  {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => {
                        const isActive = localRow._category === cat.name;
                        return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                  const updated = { ...localRow, _category: cat.name };
                                  setLocalRow(updated);
                                  onUpdate(updated);
                              }}
                              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                  isActive
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                              }`}
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">기본 정보</h3>
              {isEditingInfo ? (
                <button
                  onClick={saveChanges}
                  className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                >
                  <Save className="w-3 h-3" /> 저장
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingInfo(true)}
                  className="flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50"
                >
                  <Edit2 className="w-3 h-3" /> 수정
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              {columns.map((col) => (
                <div key={col.id} className="flex flex-wrap gap-2 items-start">
                  <span className="text-gray-800 font-bold whitespace-nowrap">{col.name}:</span>
                  {isEditingInfo ? (
                    <input
                      type={getInputType(col.type)}
                      value={localRow[col.id] || ''}
                      onChange={(e) => handleInfoChange(col.id, e.target.value)}
                      className="flex-1 min-w-[100px] p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                    />
                  ) : (
                    <span className="text-gray-800 break-words flex-1">
                      {localRow[col.id] || '-'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-1 bg-green-500 rounded-full"></div>

          {/* Memo */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700">메모</h3>
            <div
              className={`w-full p-3 rounded-md text-sm leading-relaxed border transition-all ${
                isEditingMemo
                  ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-200'
                  : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
              onDoubleClick={() => setIsEditingMemo(true)}
            >
              {isEditingMemo ? (
                <textarea
                  autoFocus
                  rows={6}
                  className="w-full bg-transparent outline-none resize-none block text-sm"
                  value={localRow._memo}
                  onChange={(e) => setLocalRow({ ...localRow, _memo: e.target.value })}
                  onBlur={() => {
                    setIsEditingMemo(false);
                    onUpdate({ ...localRow });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="text-gray-700 whitespace-pre-wrap line-clamp-4">
                  {localRow._memo || <span className="text-gray-400 text-xs italic">더블클릭하여 메모를 입력하세요...</span>}
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700">
              체크리스트
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({localRow._checklists.filter(c => c.isChecked).length}/{localRow._checklists.length})
              </span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="체크리스트 추가"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-green-500"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklist()}
              />
              <button
                onClick={addChecklist}
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-600"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sortedChecklists.map((item) => {
                const isExpanded = expandedChecklistIds.includes(item.id);
                const repliesToShow = isExpanded ? item.replies : item.replies.slice(-1);

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
                            <input
                                autoFocus
                                type="text"
                                className="w-full text-xs border-b border-blue-400 outline-none pb-0.5"
                                defaultValue={item.text}
                                onBlur={(e) => updateChecklistText(item.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        updateChecklistText(item.id, e.currentTarget.value);
                                    }
                                }}
                            />
                        ) : (
                            <span
                                className={`text-xs cursor-pointer select-none block ${item.isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                                onDoubleClick={() => setEditingChecklistId(item.id)}
                                onClick={() => toggleRepliesExpansion(item.id)}
                            >
                                {item.text}
                            </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteChecklist(item.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Replies */}
                    {repliesToShow.length > 0 && (
                      <div className="pl-6 space-y-1">
                        {repliesToShow.map(reply => (
                          <div key={reply.id} className="text-xs text-gray-600 bg-white p-1.5 rounded relative group/reply">
                            <p className="line-clamp-2">{reply.text}</p>
                            {isExpanded && <span className="text-[9px] text-gray-400 mt-0.5 block">{reply.createdAt}</span>}
                            {isExpanded && (
                              <button
                                onClick={() => deleteReply(item.id, reply.id)}
                                className="absolute top-1 right-1 text-gray-300 hover:text-red-400 opacity-0 group-hover/reply:opacity-100"
                              >
                                <X className="w-3 h-3"/>
                              </button>
                            )}
                          </div>
                        ))}
                        {!isExpanded && item.replies.length > 1 && (
                          <div className="text-[9px] text-gray-400 pl-2 cursor-pointer" onClick={() => toggleRepliesExpansion(item.id)}>
                            +{item.replies.length - 1}개 더보기
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reply Input */}
                    {isExpanded && (
                      <div className="flex items-start gap-1 pl-6 pt-1">
                        <textarea
                          placeholder="답글..."
                          className="flex-1 bg-transparent text-xs border-b border-gray-200 focus:border-green-400 outline-none py-0.5 resize-none h-6 focus:h-12 transition-all"
                          value={replyInputs[item.id] || ''}
                          onChange={(e) => setReplyInputs(prev => ({...prev, [item.id]: e.target.value}))}
                          onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              addReply(item.id);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout - Side panel
  return (
    <div
      className={`fixed inset-y-0 right-0 w-[750px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-gray-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-800">{tableName} 상세</h2>
        <div className="flex items-center gap-2"> {/* Group delete and close buttons */}
            <button 
                onClick={() => onDeleteRow(localRow.id)} // Call onDeleteRow with the current localRow.id
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-500"
                title="이 행 삭제"
            >
                <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-500">카테고리</label>
          
          {categoryInputType === 'dropdown' ? (
              <select
                value={localRow._category || categories[0]?.name || ''}
                onChange={(e) => {
                  const updated = { ...localRow, _category: e.target.value };
                  setLocalRow(updated);
                  onUpdate(updated);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
              >
                {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
          ) : (
              <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                      const isActive = localRow._category === cat.name;
                      return (
                          <button
                            key={cat.id}
                            onClick={() => {
                                const updated = { ...localRow, _category: cat.name };
                                setLocalRow(updated);
                                onUpdate(updated);
                            }}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                                isActive 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                              {cat.name}
                          </button>
                      );
                  })}
              </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2"> {/* This is the container for h3 and the button */}
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
              기본 정보
            </h3>
            {/* Move the button here, aligned to the right */}
            {isEditingInfo ? (
              <button
                onClick={saveChanges}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> 저장
              </button>
            ) : (
              <button
                onClick={() => setIsEditingInfo(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> 수정
              </button>
            )}
          </div>
          
          <div className="space-y-4 text-sm">
            {columns.map((col) => (
              <div key={col.id} className="grid grid-cols-3 gap-4 items-center">
                <span className="text-gray-500 font-medium">{col.name}</span>
                <div className="col-span-2">
                  {isEditingInfo ? (
                    <input
                      type={getInputType(col.type)}
                      value={localRow[col.id] || ''}
                      onChange={(e) => handleInfoChange(col.id, e.target.value)}
                      className="w-full p-1.5 border border-purple-200 rounded bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  ) : (
                    <span className="text-gray-800 break-words block min-h-[1.5rem]">
                      {localRow[col.id] || '-'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Removed the old justify-end div that contained the button */}
        </div>

        {/* Memo */}
        <div className="space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer group select-none"
            onClick={() => setIsMemoExpanded(!isMemoExpanded)}
          >
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-400 rounded-full"></span>
              메모
            </h3>
            <button className="text-gray-400 group-hover:text-gray-600 transition-colors">
                {isMemoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div
            className={`w-full p-3 rounded-md text-sm leading-relaxed border transition-all ${
              isEditingMemo 
                ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-200' 
                : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
            }`}
            onDoubleClick={() => setIsEditingMemo(true)}
          >
            {isEditingMemo ? (
              <textarea
                autoFocus
                rows={10}
                className="w-full bg-transparent outline-none resize focus:ring-0 block"
                value={localRow._memo}
                onChange={(e) => setLocalRow({ ...localRow, _memo: e.target.value })}
                onBlur={() => {
                  setIsEditingMemo(false);
                  onUpdate({ ...localRow });
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className={`text-gray-700 ${!isMemoExpanded ? 'line-clamp-2' : 'whitespace-pre-wrap'}`}>
                {localRow._memo || <span className="text-gray-400 italic">더블클릭하여 메모를 입력하세요...</span>}
              </div>
            )}
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-green-500 rounded-full"></span>
              체크리스트
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({localRow._checklists.filter(c => c.isChecked).length}/{localRow._checklists.length})
              </span>
            </h3>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="체크리스트 추가 (Enter로 추가)"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-green-500"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChecklist()}
            />
            <button
              onClick={addChecklist}
              className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {sortedChecklists.map((item) => {
              const isExpanded = expandedChecklistIds.includes(item.id);
              const repliesToShow = isExpanded ? item.replies : item.replies.slice(-1); // Show last reply if collapsed

              return (
                <div key={item.id} className="group bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleChecklist(item.id)}
                      className={`mt-0.5 w-5 h-5 flex items-center justify-center rounded border shrink-0 ${
                        item.isChecked
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 text-transparent hover:border-green-400'
                      } transition-colors`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="flex-1 space-y-2 overflow-hidden">
                      <div className="flex justify-between items-start">
                        {editingChecklistId === item.id ? (
                            <input 
                                autoFocus
                                type="text"
                                className="w-full text-sm border-b border-blue-400 outline-none pb-0.5"
                                defaultValue={item.text}
                                onBlur={(e) => updateChecklistText(item.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        updateChecklistText(item.id, e.currentTarget.value);
                                    }
                                }}
                            />
                        ) : (
                            <span 
                                className={`text-sm cursor-pointer select-none ${item.isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                                onDoubleClick={() => setEditingChecklistId(item.id)}
                                onClick={() => toggleRepliesExpansion(item.id)}
                                title="클릭하여 답글 펼치기/접기, 더블클릭하여 수정"
                            >
                                {item.text}
                            </span>
                        )}
                        <button 
                          onClick={() => deleteChecklist(item.id)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Replies Section */}
                      <div className="pl-0 mt-2 space-y-2">
                          {/* Render Replies */}
                          {repliesToShow.map(reply => (
                              <div key={reply.id} className="flex gap-2 bg-gray-50 p-2 rounded text-xs text-gray-600 relative group/reply">
                                  <div className="w-0.5 bg-gray-300 self-stretch rounded-full shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                      <p className={`${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1'}`}>{reply.text}</p>
                                      {isExpanded && <span className="text-[10px] text-gray-400 mt-1 block">{reply.createdAt}</span>}
                                  </div>
                                  {isExpanded && (
                                      <button 
                                          onClick={() => deleteReply(item.id, reply.id)}
                                          className="absolute top-1 right-1 p-1 text-gray-300 hover:text-red-400 opacity-0 group-hover/reply:opacity-100"
                                      >
                                          <X className="w-3 h-3"/>
                                      </button>
                                  )}
                              </div>
                          ))}
                          
                          {/* Collapsed Indicator if more replies exist */}
                          {!isExpanded && item.replies.length > 1 && (
                              <div className="text-[10px] text-gray-400 pl-2 cursor-pointer" onClick={() => toggleRepliesExpansion(item.id)}>
                                  + {item.replies.length - 1}개의 답글 더보기
                              </div>
                          )}

                          {/* Reply Input (Only visible when expanded) */}
                          {isExpanded && (
                              <div className="flex items-start gap-2 pt-1">
                                  <div className="flex items-center gap-1 text-gray-400 mt-1.5 shrink-0">
                                      {item.replies.length > 0 && <span className="text-[10px]">({item.replies.length})</span>}
                                      <MessageSquare className="w-3 h-3 text-gray-300" />
                                  </div>
                                  <textarea
                                      placeholder="답글 달기..."
                                      className="flex-1 bg-transparent text-xs border-b border-gray-200 focus:border-green-400 outline-none py-1 resize-none h-8 focus:h-16 transition-all"
                                      value={replyInputs[item.id] || ''}
                                      onChange={(e) => setReplyInputs(prev => ({...prev, [item.id]: e.target.value}))}
                                      onKeyDown={(e) => {
                                          if(e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              addReply(item.id);
                                          }
                                      }}
                                  />
                              </div>
                          )}
                          {/* Collapsed state reply count indicator if not shown elsewhere */}
                          {!isExpanded && (
                              <div className="flex items-center gap-1 text-gray-300 text-[10px] pt-1 cursor-pointer" onClick={() => toggleRepliesExpansion(item.id)}>
                                  {item.replies.length > 0 ? `(${item.replies.length})` : ''} <MessageSquare className="w-3 h-3" />
                              </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetailPanel;