import { MAX_SEARCH_HISTORY } from '../constants/app';

/**
 * Add a search term to the search history for a specific table
 * Duplicates are removed and only the first occurrence is kept
 * History is limited to MAX_SEARCH_HISTORY items
 */
export const createAddToSearchHistory = (
  setSearchHistory: (fn: (prev: Record<string, string[]>) => Record<string, string[]>) => void
) => {
  return (tableId: string, term: string) => {
    const trimmedTerm = term.trim();
    if (trimmedTerm === '') return;

    setSearchHistory(prev => {
      const tableHistory = prev[tableId] || [];
      const filtered = tableHistory.filter(t => t !== trimmedTerm);
      const updated = [trimmedTerm, ...filtered].slice(0, MAX_SEARCH_HISTORY);
      return {
        ...prev,
        [tableId]: updated
      };
    });
  };
};

/**
 * Clear search history for a specific table
 */
export const createClearSearchHistory = (
  setSearchHistory: (fn: (prev: Record<string, string[]>) => Record<string, string[]>) => void
) => {
  return (tableId: string) => {
    setSearchHistory(prev => ({
      ...prev,
      [tableId]: []
    }));
  };
};

/**
 * Load search history from localStorage
 * Returns empty object if localStorage doesn't have saved history
 */
export const loadSearchHistoryFromLocalStorage = (): Record<string, string[]> => {
  try {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse search history from localStorage:', e);
  }
  return {};
};

/**
 * Save search history to localStorage
 * Only saves if there is data to save
 */
export const saveSearchHistoryToLocalStorage = (searchHistory: Record<string, string[]>): void => {
  try {
    if (Object.keys(searchHistory).length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  } catch (e) {
    console.error('Failed to save search history to localStorage:', e);
  }
};
