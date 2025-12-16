import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Column, ColumnType, BookmarkGroup, FilterCondition, ValidationResult } from '../types';

interface ModalStateContextType {
  // Table Modal
  isTableModalOpen: boolean;
  setIsTableModalOpen: (open: boolean) => void;
  newTableName: string;
  setNewTableName: (name: string) => void;
  newTableColumns: Omit<Column, 'id'>[];
  setNewTableColumns: (cols: Omit<Column, 'id'>[]) => void;

  // Row Modal
  isRowModalOpen: boolean;
  setIsRowModalOpen: (open: boolean) => void;
  rowFormData: Record<string, any>;
  setRowFormData: (data: Record<string, any>) => void;

  // Column Edit Modal
  isColEditModalOpen: boolean;
  setIsColEditModalOpen: (open: boolean) => void;
  editingColState: Column | null;
  setEditingColState: (col: Column | null) => void;

  // Hidden Columns Modal
  isHiddenColModalOpen: boolean;
  setIsHiddenColModalOpen: (open: boolean) => void;

  // Column Menu
  activeMenuColId: string | null;
  setActiveMenuColId: (id: string | null) => void;
  menuPos: { x: number; y: number } | null;
  setMenuPos: (pos: { x: number; y: number } | null) => void;

  // Filter Modal
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: (open: boolean) => void;
  newFilterName: string;
  setNewFilterName: (name: string) => void;
  newFilterConditions: FilterCondition[];
  setNewFilterConditions: (conds: FilterCondition[]) => void;

  // Add Column Modal
  isAddColumnModalOpen: boolean;
  setIsAddColumnModalOpen: (open: boolean) => void;
  newColumnName: string;
  setNewColumnName: (name: string) => void;
  newColumnType: ColumnType;
  setNewColumnType: (type: ColumnType) => void;

  // Bookmark Edit Modal
  isBookmarkEditModalOpen: boolean;
  setIsBookmarkEditModalOpen: (open: boolean) => void;
  editingBookmarkGroup: BookmarkGroup | null;
  setEditingBookmarkGroup: (group: BookmarkGroup | null) => void;
  bookmarkEditForm: {
    name: string;
    color: string;
    area: number;
  };
  setBookmarkEditForm: (form: { name: string; color: string; area: number }) => void;
  bookmarkContextMenu: {
    groupId: string;
    x: number;
    y: number;
  } | null;
  setBookmarkContextMenu: (menu: { groupId: string; x: number; y: number } | null) => void;

  // Confirm Modal
  isConfirmModalOpen: boolean;
  setIsConfirmModalOpen: (open: boolean) => void;
  confirmModalMessage: string;
  setConfirmModalMessage: (msg: string) => void;
  confirmModalAction: (() => void) | null;
  setConfirmModalAction: (action: (() => void) | null) => void;

  // CSV Upload Modal
  isCSVUploadModalOpen: boolean;
  setIsCSVUploadModalOpen: (open: boolean) => void;
  csvValidationResult: ValidationResult | null;
  setCSVValidationResult: (result: ValidationResult | null) => void;
  csvPreviewData: any[] | null;
  setCSVPreviewData: (data: any[] | null) => void;

  // Table Rename
  isEditingTableName: boolean;
  setIsEditingTableName: (editing: boolean) => void;
  editingTableName: string;
  setEditingTableName: (name: string) => void;

  // Save Status
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  setSaveStatus: (status: 'idle' | 'saving' | 'success' | 'error') => void;
  saveMessage: string;
  setSaveMessage: (msg: string) => void;

  // Delete Lock
  isDeleteLocked: boolean;
  setIsDeleteLocked: (locked: boolean) => void;
}

const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);

export const ModalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Table Modal
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableColumns, setNewTableColumns] = useState<Omit<Column, 'id'>[]>([
    { name: '제목', type: ColumnType.TEXT, width: 180 }
  ]);

  // Row Modal
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [rowFormData, setRowFormData] = useState<Record<string, any>>({});

  // Column Edit Modal
  const [isColEditModalOpen, setIsColEditModalOpen] = useState(false);
  const [editingColState, setEditingColState] = useState<Column | null>(null);

  // Hidden Columns Modal
  const [isHiddenColModalOpen, setIsHiddenColModalOpen] = useState(false);

  // Column Menu
  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Filter Modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterConditions, setNewFilterConditions] = useState<FilterCondition[]>([]);

  // Add Column Modal
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<ColumnType>(ColumnType.TEXT);

  // Bookmark Edit Modal
  const [isBookmarkEditModalOpen, setIsBookmarkEditModalOpen] = useState(false);
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

  // Confirm Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);

  // CSV Upload Modal
  const [isCSVUploadModalOpen, setIsCSVUploadModalOpen] = useState(false);
  const [csvValidationResult, setCSVValidationResult] = useState<ValidationResult | null>(null);
  const [csvPreviewData, setCSVPreviewData] = useState<any[] | null>(null);

  // Table Rename
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [editingTableName, setEditingTableName] = useState('');

  // Save Status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Delete Lock
  const [isDeleteLocked, setIsDeleteLocked] = useState(true);

  const value: ModalStateContextType = {
    isTableModalOpen,
    setIsTableModalOpen,
    newTableName,
    setNewTableName,
    newTableColumns,
    setNewTableColumns,
    isRowModalOpen,
    setIsRowModalOpen,
    rowFormData,
    setRowFormData,
    isColEditModalOpen,
    setIsColEditModalOpen,
    editingColState,
    setEditingColState,
    isHiddenColModalOpen,
    setIsHiddenColModalOpen,
    activeMenuColId,
    setActiveMenuColId,
    menuPos,
    setMenuPos,
    isFilterModalOpen,
    setIsFilterModalOpen,
    newFilterName,
    setNewFilterName,
    newFilterConditions,
    setNewFilterConditions,
    isAddColumnModalOpen,
    setIsAddColumnModalOpen,
    newColumnName,
    setNewColumnName,
    newColumnType,
    setNewColumnType,
    isBookmarkEditModalOpen,
    setIsBookmarkEditModalOpen,
    editingBookmarkGroup,
    setEditingBookmarkGroup,
    bookmarkEditForm,
    setBookmarkEditForm,
    bookmarkContextMenu,
    setBookmarkContextMenu,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    confirmModalMessage,
    setConfirmModalMessage,
    confirmModalAction,
    setConfirmModalAction,
    isCSVUploadModalOpen,
    setIsCSVUploadModalOpen,
    csvValidationResult,
    setCSVValidationResult,
    csvPreviewData,
    setCSVPreviewData,
    isEditingTableName,
    setIsEditingTableName,
    editingTableName,
    setEditingTableName,
    saveStatus,
    setSaveStatus,
    saveMessage,
    setSaveMessage,
    isDeleteLocked,
    setIsDeleteLocked,
  };

  return (
    <ModalStateContext.Provider value={value}>
      {children}
    </ModalStateContext.Provider>
  );
};

export const useModalState = () => {
  const context = useContext(ModalStateContext);
  if (!context) {
    throw new Error('useModalState must be used within ModalStateProvider');
  }
  return context;
};
