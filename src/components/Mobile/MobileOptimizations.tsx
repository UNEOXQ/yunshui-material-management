import React, { useEffect, useState } from 'react';
import './MobileOptimizations.css';

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  touchSupport: boolean;
}

const MobileOptimizations: React.FC<MobileOptimizationsProps> = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    touchSupport: 'ontouchstart' in window
  });

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDeviceInfo({
        isMobile: width <= 767,
        isTablet: width >= 768 && width <= 1024,
        isDesktop: width > 1024,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        touchSupport: 'ontouchstart' in window
      });
    };

    // Initial check
    updateDeviceInfo();

    // Listen for resize events
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    // Detect virtual keyboard on mobile
    const handleResize = () => {
      if (deviceInfo.isMobile) {
        const heightDiff = window.screen.height - window.innerHeight;
        setIsKeyboardVisible(heightDiff > 150); // Threshold for keyboard detection
      }
    };

    window.addEventListener('resize', handleResize);

    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    const preventZoom = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    if (deviceInfo.touchSupport) {
      document.addEventListener('touchend', preventZoom, { passive: false });
    }

    // Add device classes to body
    document.body.classList.toggle('mobile-device', deviceInfo.isMobile);
    document.body.classList.toggle('tablet-device', deviceInfo.isTablet);
    document.body.classList.toggle('desktop-device', deviceInfo.isDesktop);
    document.body.classList.toggle('touch-device', deviceInfo.touchSupport);
    document.body.classList.toggle('keyboard-visible', isKeyboardVisible);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
      window.removeEventListener('resize', handleResize);
      
      if (deviceInfo.touchSupport) {
        document.removeEventListener('touchend', preventZoom);
      }

      // Clean up body classes
      document.body.classList.remove('mobile-device', 'tablet-device', 'desktop-device', 'touch-device', 'keyboard-visible');
    };
  }, [deviceInfo.isMobile, deviceInfo.touchSupport, isKeyboardVisible]);

  // Add viewport meta tag for mobile optimization
  useEffect(() => {
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    // Optimize viewport for mobile devices
    if (deviceInfo.isMobile) {
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    } else {
      viewportMeta.content = 'width=device-width, initial-scale=1.0';
    }
  }, [deviceInfo.isMobile]);

  // Add enhanced touch-friendly styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced touch-friendly button sizes */
      .touch-device button,
      .touch-device .btn,
      .touch-device input[type="button"],
      .touch-device input[type="submit"] {
        min-height: 48px;
        min-width: 48px;
        padding: 14px 20px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: rgba(0, 123, 255, 0.1);
        touch-action: manipulation;
        position: relative;
        overflow: hidden;
      }

      /* Enhanced touch ripple effect */
      .touch-device button::before,
      .touch-device .btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.3s ease, height 0.3s ease;
        pointer-events: none;
      }

      .touch-device button:active::before,
      .touch-device .btn:active::before {
        width: 200px;
        height: 200px;
      }

      .touch-device button:active,
      .touch-device .btn:active {
        transform: scale(0.96);
        background-color: rgba(0, 0, 0, 0.05);
      }

      /* Enhanced touch-friendly form elements */
      .touch-device input,
      .touch-device select,
      .touch-device textarea {
        min-height: 48px;
        padding: 14px 16px;
        font-size: 16px; /* Prevent zoom on iOS */
        border-radius: 8px;
        border: 2px solid #e9ecef;
        transition: all 0.2s ease;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }

      .touch-device input:focus,
      .touch-device select:focus,
      .touch-device textarea:focus {
        border-color: #007bff;
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        transform: scale(1.02);
      }

      /* Enhanced select styling */
      .touch-device select {
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
        padding-right: 40px;
      }

      /* Enhanced checkbox and radio styling */
      .touch-device input[type="checkbox"],
      .touch-device input[type="radio"] {
        min-width: 24px;
        min-height: 24px;
        transform: scale(1.3);
        margin: 12px;
        cursor: pointer;
      }

      /* Enhanced touch-friendly links */
      .touch-device a {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        padding: 12px 16px;
        border-radius: 6px;
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: rgba(0, 123, 255, 0.1);
      }

      .touch-device a:active {
        transform: scale(0.98);
        background-color: rgba(0, 0, 0, 0.05);
      }

      /* Enhanced clickable elements */
      .touch-device .clickable,
      .touch-device [role="button"],
      .touch-device .nav-link,
      .touch-device .card,
      .touch-device .material-card {
        min-height: 48px;
        min-width: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: rgba(0, 123, 255, 0.1);
        touch-action: manipulation;
        position: relative;
        overflow: hidden;
      }

      .touch-device .clickable:active,
      .touch-device [role="button"]:active,
      .touch-device .card:active,
      .touch-device .material-card:active {
        transform: scale(0.98);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      /* Enhanced card interactions with visual feedback */
      .touch-device .card::after,
      .touch-device .material-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 123, 255, 0.05);
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
      }

      .touch-device .card:active::after,
      .touch-device .material-card:active::after {
        opacity: 1;
      }

      /* Enhanced mobile-specific adjustments */
      .mobile-device {
        -webkit-text-size-adjust: 100%;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      /* Allow text selection for content areas */
      .mobile-device .content-area,
      .mobile-device .text-content,
      .mobile-device input,
      .mobile-device textarea,
      .mobile-device [contenteditable] {
        -webkit-user-select: text;
        -khtml-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }

      /* Enhanced keyboard visibility adjustments */
      .keyboard-visible .main-content {
        height: calc(100vh - 300px);
        padding-bottom: 20px;
      }

      .keyboard-visible .modal {
        max-height: 60vh;
      }

      .keyboard-visible .fab {
        bottom: 320px;
      }

      /* Enhanced orientation-specific styles */
      @media (orientation: landscape) and (max-height: 500px) {
        .mobile-device .main-header {
          height: 48px;
          padding: 8px 16px;
        }
        
        .mobile-device .sidebar {
          top: 48px;
        }

        .mobile-device .modal {
          max-height: 85vh;
          border-radius: 12px;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 600px;
        }

        .mobile-device .dropdown-menu {
          position: absolute;
          bottom: auto;
          top: 100%;
          transform: none;
          border-radius: 8px;
          max-height: 300px;
        }
      }

      /* Enhanced table responsiveness */
      .mobile-device .table-responsive {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        position: relative;
      }

      .mobile-device .table-responsive::after {
        content: '→';
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        color: #6c757d;
        font-size: 18px;
        opacity: 0.7;
        pointer-events: none;
        animation: scrollHint 2s ease-in-out infinite;
      }

      @keyframes scrollHint {
        0%, 100% { transform: translateY(-50%) translateX(0); }
        50% { transform: translateY(-50%) translateX(4px); }
      }

      .mobile-device .mobile-table tr {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        margin-bottom: 16px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .mobile-device .mobile-table tr:active {
        transform: scale(0.99);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .mobile-device .mobile-table tr::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(to bottom, #007bff, #0056b3);
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .mobile-device .mobile-table tr:active::before {
        opacity: 1;
      }

      /* Enhanced modal improvements */
      .mobile-device .modal {
        margin: 0;
        max-height: 90vh;
        border-radius: 16px 16px 0 0;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(8px);
      }

      .mobile-device .modal.show {
        transform: translateY(0);
      }

      .mobile-device .modal-header {
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e9ecef;
        position: relative;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
      }

      .mobile-device .modal-header::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 4px;
        background: #dee2e6;
        border-radius: 2px;
      }

      /* Enhanced floating action button */
      .mobile-device .fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #007bff;
        color: white;
        border: none;
        box-shadow: 0 4px 16px rgba(0, 123, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 1000;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
      }

      .mobile-device .fab:active {
        transform: scale(0.9);
        box-shadow: 0 2px 8px rgba(0, 123, 255, 0.4);
      }

      /* Enhanced loading states */
      .mobile-device .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
        gap: 16px;
      }

      .mobile-device .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e9ecef;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .mobile-device .loading-text {
        color: #6c757d;
        font-size: 16px;
        font-weight: 500;
      }

      /* Enhanced toast notifications */
      .mobile-device .toast-container {
        position: fixed;
        top: 20px;
        left: 16px;
        right: 16px;
        z-index: 9999;
      }

      .mobile-device .toast {
        width: 100%;
        margin-bottom: 12px;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(8px);
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      /* Safe area adjustments for devices with notches */
      @supports (padding: max(0px)) {
        .mobile-device {
          padding-left: max(12px, env(safe-area-inset-left));
          padding-right: max(12px, env(safe-area-inset-right));
        }

        .mobile-device .main-header {
          padding-top: max(12px, env(safe-area-inset-top));
        }

        .mobile-device .main-content {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }

        .mobile-device .fab {
          bottom: max(24px, calc(24px + env(safe-area-inset-bottom)));
          right: max(24px, calc(24px + env(safe-area-inset-right)));
        }

        .mobile-device .toast-container {
          top: max(20px, calc(20px + env(safe-area-inset-top)));
          left: max(16px, calc(16px + env(safe-area-inset-left)));
          right: max(16px, calc(16px + env(safe-area-inset-right)));
        }
      }
    `;
    
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  return (
    <div 
      className={`mobile-optimized-container ${deviceInfo.isMobile ? 'mobile' : ''} ${deviceInfo.isTablet ? 'tablet' : ''} ${deviceInfo.orientation}`}
      data-device-info={JSON.stringify(deviceInfo)}
    >
      {children}
    </div>
  );
};

export default MobileOptimizations;