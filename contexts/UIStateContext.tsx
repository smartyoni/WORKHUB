import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIStateContextType {
  // Search State
  searchTerms: Record<string, string>;
  setSearchTerms: (terms: Record<string, string>) => void;
  searchHistory: Record<string, string[]>;
  setSearchHistory: (history: Record<string, string[]>) => void;
  showSearchHistory: Record<string, boolean>;
  setShowSearchHistory: (show: Record<string, boolean>) => void;

  // Filter State
  activeFilterId: string | null;
  setActiveFilterId: (id: string | null) => void;
  activeDateFilter: string | null;
  setActiveDateFilter: (date: string | null) => void;
  expandedMonths: Set<string>;
  setExpandedMonths: (months: Set<string>) => void;
  activeCategoryFilter: { columnId: string; categoryName: string } | null;
  setActiveCategoryFilter: (filter: { columnId: string; categoryName: string } | null) => void;

  // Column Menu State
  activeMenuColId: string | null;
  setActiveMenuColId: (id: string | null) => void;

  // Mobile State
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isDetailPanelModal: boolean;
  setIsDetailPanelModal: (modal: boolean) => void;
  bookmarkSlideIndex: number;
  setBookmarkSlideIndex: (index: number) => void;
  touchStartX: number;
  setTouchStartX: (x: number) => void;

  // Column Resize State
  resizingColId: string | null;
  setResizingColId: (id: string | null) => void;
  startX: number;
  setStartX: (x: number) => void;
  startWidth: number;
  setStartWidth: (width: number) => void;
  lastColId: string | null;
  setLastColId: (id: string | null) => void;
  lastColStartWidth: number;
  setLastColStartWidth: (width: number) => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Search State
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [searchHistory, setSearchHistory] = useState<Record<string, string[]>>({});
  const [showSearchHistory, setShowSearchHistory] = useState<Record<string, boolean>>({});

  // Filter State
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<{ columnId: string; categoryName: string } | null>(null);

  // Column Menu State
  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null);

  // Mobile State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDetailPanelModal, setIsDetailPanelModal] = useState(false);
  const [bookmarkSlideIndex, setBookmarkSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  // Column Resize State
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [lastColId, setLastColId] = useState<string | null>(null);
  const [lastColStartWidth, setLastColStartWidth] = useState(0);

  const value: UIStateContextType = {
    searchTerms,
    setSearchTerms,
    searchHistory,
    setSearchHistory,
    showSearchHistory,
    setShowSearchHistory,
    activeFilterId,
    setActiveFilterId,
    activeDateFilter,
    setActiveDateFilter,
    expandedMonths,
    setExpandedMonths,
    activeCategoryFilter,
    setActiveCategoryFilter,
    activeMenuColId,
    setActiveMenuColId,
    isMobile,
    setIsMobile,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isDetailPanelModal,
    setIsDetailPanelModal,
    bookmarkSlideIndex,
    setBookmarkSlideIndex,
    touchStartX,
    setTouchStartX,
    resizingColId,
    setResizingColId,
    startX,
    setStartX,
    startWidth,
    setStartWidth,
    lastColId,
    setLastColId,
    lastColStartWidth,
    setLastColStartWidth,
  };

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context;
};
