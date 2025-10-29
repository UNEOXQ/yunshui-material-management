import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { deviceInfo, responsive, responsiveValue } from '../utils/responsive';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  scale: (size: number) => number;
  fontSize: (size: number) => number;
  wp: (percentage: number) => number;
  hp: (percentage: number) => number;
  responsiveValue: typeof responsiveValue;
}

export const useResponsive = (): ResponsiveInfo => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  return {
    width,
    height,
    isSmallDevice: width < 375,
    isMediumDevice: width >= 375 && width < 414,
    isLargeDevice: width >= 414 && width < 768,
    isTablet: width >= 768,
    isLandscape: width > height,
    isPortrait: height > width,
    scale: responsive.scale,
    fontSize: responsive.fontSize,
    wp: responsive.wp,
    hp: responsive.hp,
    responsiveValue,
  };
};