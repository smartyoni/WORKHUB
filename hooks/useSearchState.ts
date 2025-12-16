import { useState, useEffect } from 'react';
import { loadSearchHistoryFromLocalStorage } from '../utils/searchHelpers';

/**
 * useSearchState
 * Manages search terms, history, and UI state for search functionality
 * Loads and manages search history from localStorage
 */
export const useSearchState = () => {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [searchHistory, setSearchHistory] = useState<Record<string, string[]>>({});
  const [showSearchHistory, setShowSearchHistory] = useState<Record<string, boolean>>({});

  // Load search history from localStorage on mount
  useEffect(() => {
    const loaded = loadSearchHistoryFromLocalStorage();
    setSearchHistory(loaded);
  }, []);

  // Close search history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchHistory({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return {
    searchTerms,
    setSearchTerms,
    searchHistory,
    setSearchHistory,
    showSearchHistory,
    setShowSearchHistory,
  };
};
