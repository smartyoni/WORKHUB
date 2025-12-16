import { BookmarkGroup } from '../types';

/**
 * Bookmark-related event handlers
 * Manages bookmark creation, deletion, and editing
 */

export const createBookmarkHandlers = (
  bookmarks: BookmarkGroup[],
  setBookmarks: (bookmarks: BookmarkGroup[]) => void
) => {
  const handleBookmarkEditOpen = (
    group: BookmarkGroup,
    setEditingBookmarkGroup: (group: BookmarkGroup) => void,
    setBookmarkEditForm: (form: { name: string; color: string; area: number }) => void,
    setIsBookmarkEditModalOpen: (open: boolean) => void
  ) => {
    setEditingBookmarkGroup(group);
    setBookmarkEditForm({
      name: group.name,
      color: group.color,
      area: group.area || 1
    });
    setIsBookmarkEditModalOpen(true);
  };

  const handleBookmarkSave = (
    editingBookmarkGroup: BookmarkGroup | null,
    bookmarkEditForm: { name: string; color: string; area: number },
    setIsBookmarkEditModalOpen: (open: boolean) => void,
    setEditingBookmarkGroup: (group: BookmarkGroup | null) => void
  ) => {
    if (!editingBookmarkGroup || !bookmarkEditForm.name.trim()) return;

    const updatedBookmarks = bookmarks.map(group =>
      group.id === editingBookmarkGroup.id
        ? {
            ...group,
            name: bookmarkEditForm.name,
            color: bookmarkEditForm.color,
            area: bookmarkEditForm.area
          }
        : group
    );

    setBookmarks(updatedBookmarks);
    setIsBookmarkEditModalOpen(false);
    setEditingBookmarkGroup(null);
  };

  const handleBookmarkDelete = (
    groupId: string,
    setBookmarkContextMenu: (menu: { groupId: string; x: number; y: number } | null) => void
  ) => {
    const updatedBookmarks = bookmarks.filter(group => group.id !== groupId);
    setBookmarks(updatedBookmarks);
    setBookmarkContextMenu(null);
  };

  const handleBookmarkContextMenu = (
    e: React.MouseEvent,
    groupId: string,
    setBookmarkContextMenu: (menu: { groupId: string; x: number; y: number } | null) => void
  ) => {
    e.preventDefault();
    setBookmarkContextMenu({
      groupId,
      x: e.clientX,
      y: e.clientY
    });
  };

  return {
    handleBookmarkEditOpen,
    handleBookmarkSave,
    handleBookmarkDelete,
    handleBookmarkContextMenu,
  };
};
