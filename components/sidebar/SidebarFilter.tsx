import React from 'react';
import { ChevronDown } from 'lucide-react';
import { CategoryGroup, TableDefinition } from '../../types';
import { getTodayTableDates } from '../../utils/tableHelpers';
import { SideMenuItem } from './SideMenuItem';

interface SidebarFilterProps {
  activeFilterId: string | null;
  setActiveFilterId: (id: string | null) => void;
  activeDateFilter: string | null;
  setActiveDateFilter: (filter: string | null) => void;
  activeCategoryFilter: string | null;
  setActiveCategoryFilter: (filter: string | null) => void;
  expandedMonths: Set<string>;
  setExpandedMonths: (months: Set<string>) => void;
  categories: CategoryGroup[];
  todayTableId: string | null;
  activeTable: TableDefinition | null;
  activeTableId: string | null;
}

/**
 * SidebarFilter - Left sidebar with date and category filters
 * Displays filter options and currently active filters
 */
export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  activeFilterId,
  setActiveFilterId,
  activeDateFilter,
  setActiveDateFilter,
  activeCategoryFilter,
  setActiveCategoryFilter,
  expandedMonths,
  setExpandedMonths,
  categories,
  todayTableId,
  activeTable,
  activeTableId
}) => {
  const todayDates = activeTable && todayTableId && activeTableId ? getTodayTableDates(activeTable, todayTableId, activeTableId) : null;

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  return (
    <aside className="w-48 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Date Filters */}
        {todayDates && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              날짜
            </h3>
            <div className="space-y-1">
              {todayDates.recent.map((date) => (
                <SideMenuItem
                  key={date.date}
                  label={date.displayDate}
                  isActive={activeDateFilter === date.date}
                  onClick={() => setActiveDateFilter(date.date)}
                />
              ))}
            </div>

            {/* Older Dates Grouped by Month */}
            <div className="mt-3 space-y-1">
              {todayDates.monthGroups.map((monthGroup) => (
                <div key={monthGroup.monthKey}>
                  <button
                    onClick={() => toggleMonth(monthGroup.monthKey)}
                    className="w-full flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedMonths.has(monthGroup.monthKey) ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    <span>{monthGroup.monthDisplay}</span>
                  </button>

                  {expandedMonths.has(monthGroup.monthKey) && (
                    <div className="ml-4 space-y-1">
                      {monthGroup.dates.map((date) => (
                        <SideMenuItem
                          key={date.date}
                          label={date.displayDate}
                          isActive={activeDateFilter === date.date}
                          onClick={() => setActiveDateFilter(date.date)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filters */}
        {categories.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              카테고리
            </h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <SideMenuItem
                  key={category.id}
                  label={category.name}
                  isActive={activeCategoryFilter === category.id}
                  onClick={() => setActiveCategoryFilter(category.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        {(activeDateFilter || activeCategoryFilter) && (
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                setActiveDateFilter(null);
                setActiveCategoryFilter(null);
                setActiveFilterId(null);
              }}
              className="w-full px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
