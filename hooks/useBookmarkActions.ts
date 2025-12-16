import { useCallback } from 'react';
import { BookmarkGroup } from '../types';
import { useTableState } from '../contexts/TableStateContext';
import { useModalState } from '../contexts/ModalStateContext';

export const useBookmarkActions = () => {
  const tableState = useTableState();
  const modalState = useModalState();

  const handleBookmarkEditOpen = useCallback((group: BookmarkGroup) => {
    modalState.setEditingBookmarkGroup(group);
    modalState.setBookmarkEditForm({
      name: group.name,
      color: group.color,
      area: group.area || 1
    });
    modalState.setIsBookmarkEditModalOpen(true);
  }, []);

  const handleBookmarkSave = useCallback(() => {
    if (!modalState.editingBookmarkGroup || !modalState.bookmarkEditForm.name.trim()) return;

    const updatedBookmarks = tableState.bookmarks.map(group =>
      group.id === modalState.editingBookmarkGroup.id
        ? {
            ...group,
            name: modalState.bookmarkEditForm.name,
            color: modalState.bookmarkEditForm.color,
            area: modalState.bookmarkEditForm.area
          }
        : group
    );

    tableState.setBookmarks(updatedBookmarks);
    modalState.setIsBookmarkEditModalOpen(false);
    modalState.setEditingBookmarkGroup(null);
  }, [tableState.bookmarks, modalState.editingBookmarkGroup, modalState.bookmarkEditForm]);

  const handleBookmarkDelete = useCallback((groupId: string) => {
    const updatedBookmarks = tableState.bookmarks.filter(group => group.id !== groupId);
    tableState.setBookmarks(updatedBookmarks);
    modalState.setBookmarkContextMenu(null);
  }, [tableState.bookmarks]);

  const handleBookmarkContextMenu = useCallback((e: React.MouseEvent, groupId: string) => {
    e.preventDefault();
    modalState.setBookmarkContextMenu({
      groupId,
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  return {
    handleBookmarkEditOpen,
    handleBookmarkSave,
    handleBookmarkDelete,
    handleBookmarkContextMenu,
  };
};
