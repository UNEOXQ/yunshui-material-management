import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  touchSupport: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasNotch: boolean;
  pixelRatio: number;
}

interface UseDeviceDetectionReturn extends DeviceInfo {
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  isKeyboardVisible: boolean;
  connectionType: string;
  isOnline: boolean;
}

export const useDeviceDetection = (): UseDeviceDetectionReturn => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent;
    
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width <= 1024,
      isDesktop: width > 1024,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      hasNotch: CSS.supports('padding: max(0px)') && window.screen.height > 800,
      pixelRatio: window.devicePixelRatio || 1
    };
  });

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [connectionType, setConnectionType] = useState('unknown');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;
      
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width <= 1024,
        isDesktop: width > 1024,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isIOS: /iPad|iPhone|iPod/.test(userAgent),
        isAndroid: /Android/.test(userAgent),
        hasNotch: CSS.supports('padding: max(0px)') && window.screen.height > 800,
        pixelRatio: window.devicePixelRatio || 1
      });
    };

    // Detect virtual keyboard on mobile
    const handleResize = () => {
      updateDeviceInfo();
      
      if (deviceInfo.isMobile) {
        const heightDiff = window.screen.height - window.innerHeight;
        setIsKeyboardVisible(heightDiff > 150);
      }
    };

    // Handle orientation change
    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(updateDeviceInfo, 100);
    };

    // Handle connection changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Get connection type if available
    const updateConnectionType = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };

    // Initial setup
    updateDeviceInfo();
    updateConnectionType();

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection change listener
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionType);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, [deviceInfo.isMobile]);

  // Add device classes to body
  useEffect(() => {
    const body = document.body;
    
    // Remove existing classes
    body.classList.remove(
      'mobile-device', 'tablet-device', 'desktop-device',
      'touch-device', 'ios-device', 'android-device',
      'has-notch', 'keyboard-visible', 'portrait', 'landscape'
    );

    // Add current classes
    if (deviceInfo.isMobile) body.classList.add('mobile-device');
    if (deviceInfo.isTablet) body.classList.add('tablet-device');
    if (deviceInfo.isDesktop) body.classList.add('desktop-device');
    if (deviceInfo.touchSupport) body.classList.add('touch-device');
    if (deviceInfo.isIOS) body.classList.add('ios-device');
    if (deviceInfo.isAndroid) body.classList.add('android-device');
    if (deviceInfo.hasNotch) body.classList.add('has-notch');
    if (isKeyboardVisible) body.classList.add('keyboard-visible');
    body.classList.add(deviceInfo.orientation);

    return () => {
      body.classList.remove(
        'mobile-device', 'tablet-device', 'desktop-device',
        'touch-device', 'ios-device', 'android-device',
        'has-notch', 'keyboard-visible', 'portrait', 'landscape'
      );
    };
  }, [deviceInfo, isKeyboardVisible]);

  // Update viewport meta tag for mobile optimization
  useEffect(() => {
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    if (deviceInfo.isMobile) {
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    } else {
      viewportMeta.content = 'width=device-width, initial-scale=1.0';
    }
  }, [deviceInfo.isMobile]);

  return {
    ...deviceInfo,
    isSmallScreen: deviceInfo.screenWidth < 576,
    isMediumScreen: deviceInfo.screenWidth >= 576 && deviceInfo.screenWidth < 992,
    isLargeScreen: deviceInfo.screenWidth >= 992,
    isKeyboardVisible,
    connectionType,
    isOnline
  };
};

export default useDeviceDetection;