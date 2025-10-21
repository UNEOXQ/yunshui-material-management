import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TouchGestureHandler from './TouchGestureHandler';

interface MobileGestureNavigationProps {
  children: React.ReactNode;
  enableSwipeNavigation?: boolean;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  swipeThreshold?: number;
}

const MobileGestureNavigation: React.FC<MobileGestureNavigationProps> = ({
  children,
  enableSwipeNavigation = true,
  enablePullToRefresh = true,
  onRefresh,
  swipeThreshold = 100
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isAtTopRef = useRef<boolean>(true);

  // Navigation history for swipe navigation
  const navigationHistory = useRef<string[]>([]);

  useEffect(() => {
    // Track navigation history
    const currentPath = location.pathname;
    if (navigationHistory.current[navigationHistory.current.length - 1] !== currentPath) {
      navigationHistory.current.push(currentPath);
      // Keep only last 10 entries
      if (navigationHistory.current.length > 10) {
        navigationHistory.current = navigationHistory.current.slice(-10);
      }
    }
  }, [location.pathname]);

  // Check if user is at the top of the page
  useEffect(() => {
    const checkScrollPosition = () => {
      isAtTopRef.current = window.scrollY === 0;
    };

    window.addEventListener('scroll', checkScrollPosition);
    checkScrollPosition();

    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
    };
  }, []);

  const handleSwipeLeft = useCallback(() => {
    if (!enableSwipeNavigation) return;

    // Navigate forward in history or to next logical page
    const currentPath = location.pathname;
    
    // Define navigation mappings
    const forwardNavigation: Record<string, string> = {
      '/dashboard': '/auxiliary-orders',
      '/auxiliary-orders': '/finished-orders',
      '/finished-orders': '/status-management',
      '/status-management': '/materials',
      '/materials': '/users',
      '/users': '/dashboard'
    };

    const nextPath = forwardNavigation[currentPath];
    if (nextPath) {
      // Provide haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }
      
      // Show visual feedback
      showSwipeIndicator('right');
      
      setTimeout(() => {
        navigate(nextPath);
      }, 150);
    }
  }, [enableSwipeNavigation, location.pathname, navigate]);

  const handleSwipeRight = useCallback(() => {
    if (!enableSwipeNavigation) return;

    // Navigate back in history
    if (navigationHistory.current.length > 1) {
      // Provide haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }
      
      // Show visual feedback
      showSwipeIndicator('left');
      
      setTimeout(() => {
        navigate(-1);
      }, 150);
    }
  }, [enableSwipeNavigation, navigate]);

  const handlePullToRefresh = useCallback(async () => {
    if (!enablePullToRefresh || !onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    
    // Provide haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }

    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [enablePullToRefresh, onRefresh, isRefreshing]);

  const showSwipeIndicator = useCallback((direction: 'left' | 'right') => {
    const indicator = document.createElement('div');
    indicator.className = `swipe-indicator ${direction} visible`;
    indicator.style.cssText = `
      position: fixed;
      top: 50%;
      ${direction}: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 123, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      font-weight: bold;
      z-index: 9999;
      animation: swipeIndicatorShow 0.5s ease-out;
      pointer-events: none;
    `;
    
    indicator.textContent = direction === 'left' ? '←' : '→';
    document.body.appendChild(indicator);

    // Add animation styles if not already added
    if (!document.querySelector('#swipe-indicator-styles')) {
      const style = document.createElement('style');
      style.id = 'swipe-indicator-styles';
      style.textContent = `
        @keyframes swipeIndicatorShow {
          0% {
            opacity: 0;
            transform: translateY(-50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translateY(-50%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-50%) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 500);
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!enablePullToRefresh) return;
    
    startYRef.current = event.touches[0].clientY;
  }, [enablePullToRefresh]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!enablePullToRefresh || !isAtTopRef.current) return;

    const currentY = event.touches[0].clientY;
    const deltaY = currentY - startYRef.current;

    if (deltaY > 0 && deltaY < 150) {
      setPullDistance(deltaY);
      
      // Show pull-to-refresh indicator
      if (deltaY > 60 && !isRefreshing) {
        setShowSwipeHint(true);
      }
    }
  }, [enablePullToRefresh, isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!enablePullToRefresh) return;

    if (pullDistance > 80 && !isRefreshing) {
      handlePullToRefresh();
    } else {
      setPullDistance(0);
      setShowSwipeHint(false);
    }
  }, [enablePullToRefresh, pullDistance, isRefreshing, handlePullToRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="mobile-gesture-navigation">
      {/* Pull-to-refresh indicator */}
      {enablePullToRefresh && (
        <div 
          className={`pull-to-refresh ${showSwipeHint || isRefreshing ? 'visible' : ''} ${isRefreshing ? 'loading' : ''}`}
          style={{
            transform: `translateY(${Math.min(pullDistance - 60, 0)}px)`
          }}
        >
          {isRefreshing ? (
            <div className="refresh-spinner" />
          ) : (
            <span>↓</span>
          )}
        </div>
      )}

      {/* Main content with gesture handling */}
      <TouchGestureHandler
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        swipeThreshold={swipeThreshold}
        className="gesture-content"
      >
        <div 
          className="content-container"
          style={{
            transform: `translateY(${Math.min(pullDistance * 0.5, 30)}px)`,
            transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none'
          }}
        >
          {children}
        </div>
      </TouchGestureHandler>

      {/* Navigation hints */}
      {enableSwipeNavigation && (
        <div className="navigation-hints">
          <div className="hint-text">
            ← 返回 | 下一頁 →
          </div>
        </div>
      )}

      <style>{`
        .mobile-gesture-navigation {
          position: relative;
          height: 100%;
          overflow: hidden;
        }

        .gesture-content {
          height: 100%;
        }

        .content-container {
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .pull-to-refresh {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 123, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          opacity: 0;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 123, 255, 0.2);
          z-index: 100;
        }

        .pull-to-refresh.visible {
          opacity: 1;
          top: 20px;
          transform: translateX(-50%) scale(1.1);
        }

        .pull-to-refresh.loading {
          background: rgba(0, 123, 255, 0.2);
        }

        .pull-to-refresh span {
          font-size: 18px;
          color: #007bff;
          transition: transform 0.3s ease;
        }

        .refresh-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e9ecef;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .navigation-hints {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 1000;
        }

        .mobile-gesture-navigation:hover .navigation-hints {
          opacity: 1;
        }

        .hint-text {
          white-space: nowrap;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 767px) {
          .navigation-hints {
            display: block;
          }
        }

        @media (min-width: 768px) {
          .navigation-hints {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileGestureNavigation;