import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  ActivityIndicator,
  Text,
  Dimensions
} from 'react-native';
import { imageOptimizationService, ImageOptimizationOptions } from '../../services/imageOptimizationService';

interface LazyImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  fadeInDuration?: number;
  threshold?: number;
  optimizationOptions?: ImageOptimizationOptions;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  blurRadius?: number;
  enableOptimization?: boolean;
  showLoadingIndicator?: boolean;
  loadingIndicatorColor?: string;
  errorText?: string;
}

interface LazyImageState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  optimizedUri?: string;
  isInView: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  source,
  style,
  containerStyle,
  placeholder,
  errorComponent,
  fadeInDuration = 300,
  threshold = 100,
  optimizationOptions,
  onLoad,
  onError,
  onLoadStart,
  resizeMode = 'cover',
  blurRadius,
  enableOptimization = true,
  showLoadingIndicator = true,
  loadingIndicatorColor = '#666',
  errorText = '圖片載入失敗'
}) => {
  const [state, setState] = useState<LazyImageState>({
    isLoading: false,
    isLoaded: false,
    hasError: false,
    isInView: false
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewRef = useRef<View>(null);
  const intersectionObserver = useRef<any>(null);

  // 獲取圖片 URI
  const getImageUri = (): string | null => {
    if (typeof source === 'number') {
      return null; // 本地圖片資源
    }
    return source.uri;
  };

  // 檢查元素是否在視窗內
  const checkIfInView = () => {
    if (!viewRef.current) return;

    viewRef.current.measure((x, y, width, height, pageX, pageY) => {
      const screenHeight = Dimensions.get('window').height;
      const isVisible = pageY + height >= -threshold && pageY <= screenHeight + threshold;
      
      if (isVisible && !state.isInView) {
        setState(prev => ({ ...prev, isInView: true }));
      }
    });
  };

  // 設置 Intersection Observer (Web 平台)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && viewRef.current) {
      intersectionObserver.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && !state.isInView) {
            setState(prev => ({ ...prev, isInView: true }));
          }
        },
        {
          rootMargin: `${threshold}px`,
          threshold: 0.1
        }
      );

      // 需要獲取實際的 DOM 元素
      const element = viewRef.current as any;
      if (element._nativeTag) {
        intersectionObserver.current.observe(element);
      }

      return () => {
        if (intersectionObserver.current) {
          intersectionObserver.current.disconnect();
        }
      };
    } else {
      // 對於 React Native，使用 scroll 事件或定時檢查
      const timer = setInterval(checkIfInView, 100);
      return () => clearInterval(timer);
    }
  }, [threshold, state.isInView]);

  // 載入圖片
  useEffect(() => {
    if (!state.isInView || state.isLoaded || state.isLoading) {
      return;
    }

    const loadImage = async () => {
      const imageUri = getImageUri();
      if (!imageUri) {
        // 本地圖片資源，直接載入
        setState(prev => ({ ...prev, isLoading: true }));
        onLoadStart?.();
        return;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true }));
        onLoadStart?.();

        let finalUri = imageUri;

        // 如果啟用優化，先優化圖片
        if (enableOptimization && optimizationOptions) {
          const result = await imageOptimizationService.optimizeImage(imageUri, optimizationOptions);
          finalUri = result.uri;
          setState(prev => ({ ...prev, optimizedUri: finalUri }));
        }

        // 預載入圖片以檢查是否能正常載入
        await new Promise<void>((resolve, reject) => {
          const testImage = new Image();
          testImage.onload = () => resolve();
          testImage.onerror = reject;
          testImage.src = finalUri;
        });

        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isLoaded: true, 
          hasError: false 
        }));

        // 淡入動畫
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: fadeInDuration,
          useNativeDriver: true,
        }).start();

        onLoad?.();
      } catch (error) {
        console.error('LazyImage load error:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          hasError: true 
        }));
        onError?.(error);
      }
    };

    loadImage();
  }, [state.isInView, state.isLoaded, state.isLoading, enableOptimization, optimizationOptions]);

  // 渲染載入中狀態
  const renderLoading = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <View style={[styles.placeholder, style]}>
        {showLoadingIndicator && (
          <ActivityIndicator size="small" color={loadingIndicatorColor} />
        )}
      </View>
    );
  };

  // 渲染錯誤狀態
  const renderError = () => {
    if (errorComponent) {
      return errorComponent;
    }

    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorText}>{errorText}</Text>
      </View>
    );
  };

  // 渲染圖片
  const renderImage = () => {
    const imageUri = getImageUri();
    const finalSource = typeof source === 'number' 
      ? source 
      : { uri: state.optimizedUri || imageUri };

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={finalSource}
          style={style}
          resizeMode={resizeMode}
          blurRadius={blurRadius}
          onLoad={() => {
            if (typeof source === 'number') {
              setState(prev => ({ 
                ...prev, 
                isLoading: false, 
                isLoaded: true 
              }));
              
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: fadeInDuration,
                useNativeDriver: true,
              }).start();
              
              onLoad?.();
            }
          }}
          onError={(error) => {
            setState(prev => ({ 
              ...prev, 
              isLoading: false, 
              hasError: true 
            }));
            onError?.(error);
          }}
        />
      </Animated.View>
    );
  };

  return (
    <View ref={viewRef} style={[styles.container, containerStyle]}>
      {!state.isInView ? (
        renderLoading()
      ) : state.hasError ? (
        renderError()
      ) : state.isLoading ? (
        renderLoading()
      ) : (
        renderImage()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  errorContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    padding: 16,
  },
  errorText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LazyImage;