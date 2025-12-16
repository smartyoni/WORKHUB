import { useState } from 'react';

/**
 * useFilterState
 * Manages all filter-related states including custom filters, date filters, and category filters
 * Also manages the expanded/collapsed state of date filter groups (months)
 */
export const useFilterState = () => {
  // --- CUSTOM FILTER STATE ---
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  // --- TODAY TABLE DATE FILTER STATE ---
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // --- CATEGORY FILTER STATE ---
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<{
    columnId: string;
    categoryName: string;
  } | null>(null);

  return {
    activeFilterId,
    setActiveFilterId,
    activeDateFilter,
    setActiveDateFilter,
    expandedMonths,
    setExpandedMonths,
    activeCategoryFilter,
    setActiveCategoryFilter,
  };
};
