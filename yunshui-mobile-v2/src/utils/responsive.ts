import { Dimensions, PixelRatio } from 'react-native';

// 獲取設備尺寸
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 設計稿基準尺寸 (iPhone 12 Pro)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// 響應式尺寸計算
export const responsive = {
  // 寬度比例
  wp: (percentage: number): number => {
    const value = (percentage * SCREEN_WIDTH) / 100;
    return Math.round(PixelRatio.roundToNearestPixel(value));
  },

  // 高度比例
  hp: (percentage: number): number => {
    const value = (percentage * SCREEN_HEIGHT) / 100;
    return Math.round(PixelRatio.roundToNearestPixel(value));
  },

  // 基於設計稿的寬度縮放
  scale: (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },

  // 基於設計稿的高度縮放
  verticalScale: (size: number): number => {
    const scale = SCREEN_HEIGHT / BASE_HEIGHT;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },

  // 適中縮放 (介於寬度和高度縮放之間)
  moderateScale: (size: number, factor: number = 0.5): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size + (scale - 1) * factor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  },

  // 字體大小縮放
  fontSize: (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * scale;
    // 限制字體縮放範圍，避免過大或過小
    const minScale = 0.85;
    const maxScale = 1.3;
    const limitedScale = Math.max(minScale, Math.min(maxScale, scale));
    return Math.round(PixelRatio.roundToNearestPixel(size * limitedScale));
  },
};

// 設備類型判斷
export const deviceInfo = {
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
  isTablet: SCREEN_WIDTH >= 768,
  
  // 螢幕方向
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  isPortrait: SCREEN_HEIGHT > SCREEN_WIDTH,
  
  // 螢幕密度
  pixelDensity: PixelRatio.get(),
  isHighDensity: PixelRatio.get() >= 3,
};

// 間距系統
export const spacing = {
  xs: responsive.scale(4),
  sm: responsive.scale(8),
  md: responsive.scale(16),
  lg: responsive.scale(24),
  xl: responsive.scale(32),
  xxl: responsive.scale(48),
};

// 觸控目標最小尺寸 (遵循 iOS 和 Android 設計規範)
export const touchTarget = {
  minSize: 44, // iOS 最小觸控尺寸
  androidMinSize: 48, // Android 最小觸控尺寸
  recommended: responsive.scale(48), // 推薦尺寸
};

// 斷點系統
export const breakpoints = {
  small: 0,
  medium: 375,
  large: 414,
  tablet: 768,
  desktop: 1024,
};

// 根據螢幕尺寸返回不同的值
export const responsiveValue = <T>(values: {
  small?: T;
  medium?: T;
  large?: T;
  tablet?: T;
  default: T;
}): T => {
  if (deviceInfo.isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  if (deviceInfo.isLargeDevice && values.large !== undefined) {
    return values.large;
  }
  if (deviceInfo.isMediumDevice && values.medium !== undefined) {
    return values.medium;
  }
  if (deviceInfo.isSmallDevice && values.small !== undefined) {
    return values.small;
  }
  return values.default;
};

// 獲取當前螢幕尺寸
export const getScreenDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
});

// 監聽螢幕方向變化
export const onOrientationChange = (callback: (dimensions: { width: number; height: number }) => void) => {
  const subscription = Dimensions.addEventListener('change', ({ window }) => {
    callback({ width: window.width, height: window.height });
  });
  
  return () => subscription?.remove();
};