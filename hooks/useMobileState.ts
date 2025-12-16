import { useState, useEffect } from 'react';

/**
 * useMobileState
 * Manages all mobile-specific states and responsive behavior
 * Handles window resize detection and touch interactions
 */
export const useMobileState = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [bookmarkSlideIndex, setBookmarkSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isDetailPanelModal, setIsDetailPanelModal] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isNowMobile = width < 768;
      setIsMobile(isNowMobile);

      // Close sidebar when switching to desktop
      if (!isNowMobile) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    setIsMobile,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    bookmarkSlideIndex,
    setBookmarkSlideIndex,
    touchStartX,
    setTouchStartX,
    isDetailPanelModal,
    setIsDetailPanelModal,
  };
};
