import React, { useState, useEffect, useRef } from 'react';
import { RowData, Column, ChecklistItem, Reply, ColumnType, AppCategory } from '../types';
import { X, Edit2, CheckSquare, Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');

  useEffect(() => {
    setLocalRow(row);
    setIsEditingInfo(false);
    setIsEditingMemo(false);
    setIsMemoExpanded(false);
    setEditingChecklistId(null);
    setNewChecklistText('');
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
    setConfirmModalAction(() => () => {
      if (!localRow) return;
      const updatedChecklists = localRow._checklists.filter(item => item.id !== id);
      const updatedRow = { ...localRow, _checklists: updatedChecklists };
      setLocalRow(updatedRow);
      onUpdate(updatedRow);
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
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

          {/* Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700">
              체크리스트
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({localRow._checklists.filter(c => c.isChecked).length}/{localRow._checklists.length})
              </span>
            </h3>

            <div className="flex gap-2">
              <textarea
                placeholder="항목 추가 (Ctrl+Enter로 추가)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-green-500 resize-none"
                rows={2}
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
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-600"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
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
                                className="w-full text-xs border-b border-blue-400 outline-none pb-0.5 resize-none whitespace-pre-wrap"
                                rows={2}
                                defaultValue={item.text}
                                onBlur={(e) => updateChecklistText(item.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        e.preventDefault();
                                        updateChecklistText(item.id, e.currentTarget.value);
                                    }
                                }}
                            />
                        ) : (
                            <span
                                className={`text-xs cursor-pointer select-none block whitespace-pre-wrap break-words ${item.isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
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
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-700">기본 정보</h3>
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

            <div className="space-y-0.5 text-xs">
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
        <div className="space-y-1">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2"> {/* This is the container for h3 and the button */}
            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
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

          <div className="space-y-0.5 text-xs">
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

        {/* Divider */}
        <div className="h-1 bg-green-500 rounded-full"></div>

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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-green-500 rounded-full"></span>
              체크리스트
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({localRow._checklists.filter(c => c.isChecked).length}/{localRow._checklists.length})
              </span>
            </h3>
          </div>

          {/* Add Checklist Input */}
          <div className="flex gap-2">
            <textarea
              placeholder="새로운 항목 추가... (Ctrl+Enter로 추가, Shift+Enter로 줄바꿈)"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-green-500 resize-none"
              rows={3}
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
              className="px-3 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Checklists List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
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
                      <CheckSquare className="w-3 h-3" />
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingChecklistId === item.id ? (
                        <textarea
                          autoFocus
                          className="w-full px-2 py-1 border border-green-500 rounded text-sm focus:outline-none bg-white resize-none whitespace-pre-wrap"
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
                        />
                      ) : (
                        <span
                          onDoubleClick={() => setEditingChecklistId(item.id)}
                          className={`cursor-pointer hover:bg-white p-1 rounded block whitespace-pre-wrap break-words ${
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

      </div>
    </div>
  );
};

export default DetailPanel;