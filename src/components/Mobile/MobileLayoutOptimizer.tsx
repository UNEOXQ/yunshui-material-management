import React, { useEffect, useState, useCallback } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';

interface MobileLayoutOptimizerProps {
  children: React.ReactNode;
}

interface LayoutOptimizations {
  compactMode: boolean;
  reducedAnimations: boolean;
  optimizedScrolling: boolean;
  adaptiveSpacing: boolean;
  touchOptimized: boolean;
}

const MobileLayoutOptimizer: React.FC<MobileLayoutOptimizerProps> = ({ children }) => {
  const deviceInfo = useDeviceDetection();
  const [optimizations, setOptimizations] = useState<LayoutOptimizations>({
    compactMode: false,
    reducedAnimations: false,
    optimizedScrolling: false,
    adaptiveSpacing: false,
    touchOptimized: false
  });

  // Determine optimizations based on device capabilities
  useEffect(() => {
    const newOptimizations: LayoutOptimizations = {
      compactMode: deviceInfo.isMobile || deviceInfo.isSmallScreen,
      reducedAnimations: !deviceInfo.isOnline || deviceInfo.connectionType === 'slow-2g' || deviceInfo.connectionType === '2g',
      optimizedScrolling: deviceInfo.isMobile || deviceInfo.touchSupport,
      adaptiveSpacing: deviceInfo.isMobile || deviceInfo.screenWidth < 600,
      touchOptimized: deviceInfo.touchSupport
    };

    setOptimizations(newOptimizations);
  }, [deviceInfo]);

  // Apply layout optimizations
  useEffect(() => {
    const rootElement = document.documentElement;
    
    // Set CSS custom properties for adaptive layouts
    rootElement.style.setProperty('--mobile-spacing', optimizations.adaptiveSpacing ? '12px' : '16px');
    rootElement.style.setProperty('--mobile-border-radius', optimizations.compactMode ? '8px' : '4px');
    rootElement.style.setProperty('--mobile-font-size', optimizations.compactMode ? '14px' : '16px');
    rootElement.style.setProperty('--mobile-line-height', optimizations.compactMode ? '1.4' : '1.6');
    rootElement.style.setProperty('--mobile-button-height', optimizations.touchOptimized ? '48px' : '40px');
    rootElement.style.setProperty('--mobile-input-height', optimizations.touchOptimized ? '48px' : '40px');
    
    // Apply optimization classes
    const optimizationClasses = [
      optimizations.compactMode && 'layout-compact',
      optimizations.reducedAnimations && 'layout-reduced-animations',
      optimizations.optimizedScrolling && 'layout-optimized-scrolling',
      optimizations.adaptiveSpacing && 'layout-adaptive-spacing',
      optimizations.touchOptimized && 'layout-touch-optimized'
    ].filter(Boolean);

    // Remove existing optimization classes
    document.body.classList.remove(
      'layout-compact',
      'layout-reduced-animations', 
      'layout-optimized-scrolling',
      'layout-adaptive-spacing',
      'layout-touch-optimized'
    );

    // Add current optimization classes
    if (optimizationClasses.length > 0) {
      document.body.classList.add(...optimizationClasses as string[]);
    }

    return () => {
      // Cleanup on unmount
      document.body.classList.remove(
        'layout-compact',
        'layout-reduced-animations',
        'layout-optimized-scrolling', 
        'layout-adaptive-spacing',
        'layout-touch-optimized'
      );
    };
  }, [optimizations]);

  // Add dynamic styles for optimizations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Compact mode optimizations */
      .layout-compact {
        --content-padding: var(--mobile-spacing);
        --element-spacing: calc(var(--mobile-spacing) * 0.75);
      }

      .layout-compact .card,
      .layout-compact .modal,
      .layout-compact .dropdown-menu {
        border-radius: var(--mobile-border-radius);
      }

      .layout-compact .btn,
      .layout-compact button {
        font-size: var(--mobile-font-size);
        line-height: var(--mobile-line-height);
        padding: calc(var(--mobile-spacing) * 0.75) var(--mobile-spacing);
      }

      .layout-compact .form-group {
        margin-bottom: var(--element-spacing);
      }

      .layout-compact .page-content {
        padding: var(--content-padding);
      }

      /* Reduced animations for slow connections */
      .layout-reduced-animations * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }

      .layout-reduced-animations .loading-spinner {
        animation: none;
        border-top-color: #007bff;
      }

      /* Optimized scrolling */
      .layout-optimized-scrolling {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }

      .layout-optimized-scrolling * {
        -webkit-overflow-scrolling: touch;
      }

      .layout-optimized-scrolling .main-content,
      .layout-optimized-scrolling .modal-body,
      .layout-optimized-scrolling .dropdown-menu {
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
      }

      .layout-optimized-scrolling .main-content::-webkit-scrollbar,
      .layout-optimized-scrolling .modal-body::-webkit-scrollbar,
      .layout-optimized-scrolling .dropdown-menu::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }

      .layout-optimized-scrolling .main-content::-webkit-scrollbar-track,
      .layout-optimized-scrolling .modal-body::-webkit-scrollbar-track,
      .layout-optimized-scrolling .dropdown-menu::-webkit-scrollbar-track {
        background: transparent;
      }

      .layout-optimized-scrolling .main-content::-webkit-scrollbar-thumb,
      .layout-optimized-scrolling .modal-body::-webkit-scrollbar-thumb,
      .layout-optimized-scrolling .dropdown-menu::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 2px;
      }

      /* Adaptive spacing */
      .layout-adaptive-spacing .container,
      .layout-adaptive-spacing .row {
        padding-left: var(--mobile-spacing);
        padding-right: var(--mobile-spacing);
      }

      .layout-adaptive-spacing .col,
      .layout-adaptive-spacing [class*="col-"] {
        padding-left: calc(var(--mobile-spacing) * 0.5);
        padding-right: calc(var(--mobile-spacing) * 0.5);
      }

      .layout-adaptive-spacing .modal-header,
      .layout-adaptive-spacing .modal-body,
      .layout-adaptive-spacing .modal-footer {
        padding-left: var(--mobile-spacing);
        padding-right: var(--mobile-spacing);
      }

      /* Touch optimizations */
      .layout-touch-optimized button,
      .layout-touch-optimized .btn,
      .layout-touch-optimized input,
      .layout-touch-optimized select,
      .layout-touch-optimized textarea {
        min-height: var(--mobile-button-height);
        touch-action: manipulation;
        -webkit-tap-highlight-color: rgba(0, 123, 255, 0.1);
      }

      .layout-touch-optimized .clickable,
      .layout-touch-optimized [role="button"],
      .layout-touch-optimized .nav-link {
        min-height: var(--mobile-button-height);
        min-width: var(--mobile-button-height);
        touch-action: manipulation;
      }

      .layout-touch-optimized input[type="checkbox"],
      .layout-touch-optimized input[type="radio"] {
        min-width: 20px;
        min-height: 20px;
        transform: scale(1.2);
        margin: 8px;
      }

      /* Performance optimizations for low-end devices */
      @media (max-width: 480px) and (max-height: 800px) {
        .layout-compact .card {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .layout-compact .modal {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .layout-reduced-animations .toast,
        .layout-reduced-animations .modal,
        .layout-reduced-animations .dropdown-menu {
          animation: none !important;
          transition: none !important;
        }
      }

      /* High DPI display optimizations */
      @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        .layout-touch-optimized .btn,
        .layout-touch-optimized button {
          border-width: 0.5px;
        }

        .layout-compact .card,
        .layout-compact .modal {
          border-width: 0.5px;
        }
      }

      /* Landscape orientation optimizations */
      @media (orientation: landscape) and (max-height: 500px) {
        .layout-compact .modal {
          max-height: 90vh;
          border-radius: 12px;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 600px;
        }

        .layout-compact .page-content {
          padding: calc(var(--mobile-spacing) * 0.75);
        }

        .layout-touch-optimized .btn,
        .layout-touch-optimized button {
          min-height: 40px;
          padding: 8px 12px;
        }
      }

      /* Dark mode optimizations */
      @media (prefers-color-scheme: dark) {
        .layout-compact .card,
        .layout-compact .modal {
          background-color: #2d2d2d;
          border-color: #404040;
        }

        .layout-optimized-scrolling .main-content::-webkit-scrollbar-thumb,
        .layout-optimized-scrolling .modal-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
        }
      }

      /* Reduced motion preferences */
      @media (prefers-reduced-motion: reduce) {
        .layout-optimized-scrolling {
          scroll-behavior: auto;
        }

        .layout-reduced-animations * {
          animation: none !important;
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [optimizations]);

  // Performance monitoring for mobile devices
  const monitorPerformance = useCallback(() => {
    if (deviceInfo.isMobile && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Log slow operations on mobile
          if (entry.duration > 100) {
            console.warn(`Slow operation detected on mobile: ${entry.name} took ${entry.duration}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });

      return () => observer.disconnect();
    }
  }, [deviceInfo.isMobile]);

  useEffect(() => {
    const cleanup = monitorPerformance();
    return cleanup;
  }, [monitorPerformance]);

  return (
    <div 
      className="mobile-layout-optimizer"
      data-optimizations={JSON.stringify(optimizations)}
      data-device-type={deviceInfo.isMobile ? 'mobile' : deviceInfo.isTablet ? 'tablet' : 'desktop'}
    >
      {children}
    </div>
  );
};

export default MobileLayoutOptimizer;