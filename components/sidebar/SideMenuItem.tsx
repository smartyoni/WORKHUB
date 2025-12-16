import React from 'react';

interface SideMenuItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * SideMenuItem - Individual sidebar menu item
 * Displays a clickable filter option with active state
 */
export const SideMenuItem: React.FC<SideMenuItemProps> = ({
  label,
  isActive,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
};
