import { useState } from 'react';

/**
 * useColumnResize
 * Manages column resizing state and calculations
 * Tracks the currently resizing column and its original dimensions
 */
export const useColumnResize = () => {
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [lastColId, setLastColId] = useState<string | null>(null);
  const [lastColStartWidth, setLastColStartWidth] = useState(0);

  return {
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
};
