import React, { ReactNode } from 'react';
import { TableStateProvider } from './TableStateContext';
import { ModalStateProvider } from './ModalStateContext';
import { UIStateProvider } from './UIStateContext';
import { PerformanceProvider } from './PerformanceContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <TableStateProvider>
      <ModalStateProvider>
        <UIStateProvider>
          <PerformanceProvider>
            {children}
          </PerformanceProvider>
        </UIStateProvider>
      </ModalStateProvider>
    </TableStateProvider>
  );
};

// Re-export all hooks for convenience
export { useTableState } from './TableStateContext';
export { useModalState } from './ModalStateContext';
export { useUIState } from './UIStateContext';
export { usePerformance } from './PerformanceContext';
