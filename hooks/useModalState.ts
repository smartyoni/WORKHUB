import { useState } from 'react';
import { Column, ColumnType, FilterCondition, BookmarkGroup, ValidationResult } from '../types';

/**
 * useModalState
 * Manages all modal and form states in the application
 * Returns all modal open/close states, form states, and their setters
 */
export const useModalState = () => {
  // --- MODAL STATES ---
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [isHiddenColModalOpen, setIsHiddenColModalOpen] = useState(false);
  const [isColEditModalOpen, setIsColEditModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [isBookmarkEditModalOpen, setIsBookmarkEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCSVUploadModalOpen, setIsCSVUploadModalOpen] = useState(false);

  // --- NEW TABLE FORM STATE ---
  const [newTableName, setNewTableName] = useState('');
  const [newTableColumns, setNewTableColumns] = useState<Omit<Column, 'id'>[]>([
    { name: '제목', type: ColumnType.TEXT, width: 180 }
  ]);

  // --- NEW ROW FORM STATE ---
  const [rowFormData, setRowFormData] = useState<Record<string, any>>({});

  // --- COLUMN EDIT STATE ---
  const [editingColState, setEditingColState] = useState<Column | null>(null);

  // --- TABLE RENAME STATE ---
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [editingTableName, setEditingTableName] = useState('');

  // --- CUSTOM CONFIRM MODAL STATE ---
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);

  // --- ADD COLUMN MODAL STATE ---
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<ColumnType>(ColumnType.TEXT);
  const [newFilterConditions, setNewFilterConditions] = useState<FilterCondition[]>([]);

  // --- BOOKMARK EDIT STATE ---
  const [editingBookmarkGroup, setEditingBookmarkGroup] = useState<BookmarkGroup | null>(null);
  const [bookmarkEditForm, setBookmarkEditForm] = useState({
    name: '',
    color: '#3B82F6',
    area: 1 as number,
  });
  const [bookmarkContextMenu, setBookmarkContextMenu] = useState<{
    groupId: string;
    x: number;
    y: number;
  } | null>(null);

  // --- SAVE STATUS ---
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // --- COLUMN MENU STATE ---
  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // --- TABLE DELETION LOCK STATE ---
  const [isDeleteLocked, setIsDeleteLocked] = useState(true);

  // --- FILTER CREATION FORM STATE ---
  const [newFilterName, setNewFilterName] = useState('');

  // --- CSV UPLOAD STATE ---
  const [csvValidationResult, setCSVValidationResult] = useState<ValidationResult | null>(null);
  const [csvPreviewData, setCSVPreviewData] = useState<any[] | null>(null);

  return {
    // Modal open/close states
    isTableModalOpen,
    setIsTableModalOpen,
    isRowModalOpen,
    setIsRowModalOpen,
    isHiddenColModalOpen,
    setIsHiddenColModalOpen,
    isColEditModalOpen,
    setIsColEditModalOpen,
    isFilterModalOpen,
    setIsFilterModalOpen,
    isAddColumnModalOpen,
    setIsAddColumnModalOpen,
    isBookmarkEditModalOpen,
    setIsBookmarkEditModalOpen,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    isCSVUploadModalOpen,
    setIsCSVUploadModalOpen,

    // New Table Form
    newTableName,
    setNewTableName,
    newTableColumns,
    setNewTableColumns,

    // New Row Form
    rowFormData,
    setRowFormData,

    // Column Edit
    editingColState,
    setEditingColState,

    // Table Rename
    isEditingTableName,
    setIsEditingTableName,
    editingTableName,
    setEditingTableName,

    // Confirm Modal
    confirmModalMessage,
    setConfirmModalMessage,
    confirmModalAction,
    setConfirmModalAction,

    // Add Column
    newColumnName,
    setNewColumnName,
    newColumnType,
    setNewColumnType,
    newFilterConditions,
    setNewFilterConditions,

    // Bookmark Edit
    editingBookmarkGroup,
    setEditingBookmarkGroup,
    bookmarkEditForm,
    setBookmarkEditForm,
    bookmarkContextMenu,
    setBookmarkContextMenu,

    // Save Status
    saveStatus,
    setSaveStatus,
    saveMessage,
    setSaveMessage,

    // Column Menu
    activeMenuColId,
    setActiveMenuColId,
    menuPos,
    setMenuPos,

    // Table Deletion Lock
    isDeleteLocked,
    setIsDeleteLocked,

    // Filter Creation
    newFilterName,
    setNewFilterName,

    // CSV Upload
    csvValidationResult,
    setCSVValidationResult,
    csvPreviewData,
    setCSVPreviewData,
  };
};
