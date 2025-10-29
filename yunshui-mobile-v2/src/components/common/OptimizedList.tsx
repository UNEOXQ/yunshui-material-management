import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  FlatList,
  VirtualizedList,
  View,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Text,
  ViewStyle,
  ListRenderItem,
  ViewToken
} from 'react-native';
import { performanceService } from '../../services/performanceService';

// 類型定義
interface OptimizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  emptyComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: string; onRetry: () => void }>;
  error?: string;
  onRetry?: () => void;
  estimatedItemSize?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  getItemLayout?: (data: T[] | null | undefined, index: number) => { length: number; offset: number; index: number };
  horizontal?: boolean;
  numColumns?: number;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  enableVirtualization?: boolean;
  enablePerformanceMonitoring?: boolean;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  viewabilityConfig?: {
    itemVisiblePercentThreshold?: number;
    minimumViewTime?: number;
    viewAreaCoveragePercentThreshold?: number;
    waitForInteraction?: boolean;
  };
}

interface ListMetrics {
  totalItems: number;
  visibleItems: number;
  renderTime: number;
  scrollPosition: number;
  memoryUsage: number;
}

export function OptimizedList<T>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.1,
  onRefresh,
  refreshing = false,
  loading = false,
  loadingMore = false,
  emptyComponent: EmptyComponent,
  errorComponent: ErrorComponent,
  error,
  onRetry,
  estimatedItemSize = 100,
  windowSize = 10,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  getItemLayout,
  horizontal = false,
  numColumns = 1,
  style,
  contentContainerStyle,
  enableVirtualization = true,
  enablePerformanceMonitoring = false,
  onViewableItemsChanged,
  viewabilityConfig
}: OptimizedListProps<T>) {
  const [listMetrics, setListMetrics] = useState<ListMetrics>({
    totalItems: 0,
    visibleItems: 0,
    renderTime: 0,
    scrollPosition: 0,
    memoryUsage: 0
  });

  // 性能監控
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceService.startRenderTiming();
      
      return () => {
        const renderTime = performanceService.endRenderTiming();
        setListMetrics(prev => ({ ...prev, renderTime }));
      };
    }
  }, [data, enablePerformanceMonitoring]);

  // 優化的渲染項目函數
  const optimizedRenderItem = useCallback<ListRenderItem<T>>(
    ({ item, index }) => {
      if (enablePerformanceMonitoring) {
        performanceService.recordFrame();
      }
      
      return renderItem({ item, index });
    },
    [renderItem, enablePerformanceMonitoring]
  );

  // 記憶化的數據
  const memoizedData = useMemo(() => {
    if (enablePerformanceMonitoring) {
      setListMetrics(prev => ({ ...prev, totalItems: data.length }));
    }
    return data;
  }, [data, enablePerformanceMonitoring]);

  // 優化的 key 提取器
  const optimizedKeyExtractor = useCallback(
    (item: T, index: number) => {
      try {
        return keyExtractor(item, index);
      } catch (error) {
        console.warn('Key extractor error:', error);
        return `fallback_${index}`;
      }
    },
    [keyExtractor]
  );

  // 視窗項目變化處理
  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      if (enablePerformanceMonitoring) {
        setListMetrics(prev => ({ 
          ...prev, 
          visibleItems: info.viewableItems.length 
        }));
      }
      
      onViewableItemsChanged?.(info);
    },
    [onViewableItemsChanged, enablePerformanceMonitoring]
  );

  // 滾動處理
  const handleScroll = useCallback(
    (event: any) => {
      if (enablePerformanceMonitoring) {
        const scrollPosition = horizontal 
          ? event.nativeEvent.contentOffset.x
          : event.nativeEvent.contentOffset.y;
        
        setListMetrics(prev => ({ ...prev, scrollPosition }));
      }
    },
    [horizontal, enablePerformanceMonitoring]
  );

  // 到達底部處理
  const handleEndReached = useCallback(() => {
    if (!loadingMore && onEndReached) {
      onEndReached();
    }
  }, [loadingMore, onEndReached]);

  // 獲取項目佈局（如果提供）
  const optimizedGetItemLayout = useMemo(() => {
    if (getItemLayout) {
      return getItemLayout;
    }
    
    // 如果沒有提供，但啟用了虛擬化，提供估算佈局
    if (enableVirtualization && estimatedItemSize > 0) {
      return (data: T[] | null | undefined, index: number) => ({
        length: estimatedItemSize,
        offset: estimatedItemSize * index,
        index
      });
    }
    
    return undefined;
  }, [getItemLayout, enableVirtualization, estimatedItemSize]);

  // 渲染載入指示器
  const renderLoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.loadingText}>載入中...</Text>
    </View>
  );

  // 渲染載入更多指示器
  const renderLoadMoreIndicator = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadMoreText}>載入更多...</Text>
      </View>
    );
  };

  // 渲染空狀態
  const renderEmptyComponent = () => {
    if (loading) {
      return renderLoadingIndicator();
    }
    
    if (error && ErrorComponent) {
      return <ErrorComponent error={error} onRetry={onRetry || (() => {})} />;
    }
    
    if (EmptyComponent) {
      return <EmptyComponent />;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>沒有數據</Text>
      </View>
    );
  };

  // 下拉刷新控制
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#2196F3']}
      tintColor="#2196F3"
    />
  ) : undefined;

  // 性能優化的 FlatList 屬性
  const optimizedProps = {
    data: memoizedData,
    renderItem: optimizedRenderItem,
    keyExtractor: optimizedKeyExtractor,
    onEndReached: handleEndReached,
    onEndReachedThreshold,
    refreshControl,
    ListEmptyComponent: renderEmptyComponent,
    ListFooterComponent: renderLoadMoreIndicator,
    onViewableItemsChanged: handleViewableItemsChanged,
    viewabilityConfig: viewabilityConfig || {
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 100
    },
    onScroll: handleScroll,
    scrollEventThrottle: 16,
    
    // 性能優化屬性
    windowSize,
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    removeClippedSubviews,
    getItemLayout: optimizedGetItemLayout,
    
    // 佈局屬性
    horizontal,
    numColumns,
    
    // 樣式
    style: [styles.list, style],
    contentContainerStyle: [
      memoizedData.length === 0 && styles.emptyContentContainer,
      contentContainerStyle
    ]
  };

  // 根據設備能力選擇渲染方式
  const deviceCapabilities = performanceService.getDeviceCapabilities();
  const shouldUseVirtualization = enableVirtualization && 
    (!deviceCapabilities?.isLowEndDevice || memoizedData.length > 50);

  if (shouldUseVirtualization && !horizontal && numColumns === 1) {
    // 使用 VirtualizedList 進行更好的性能
    return (
      <VirtualizedList
        {...optimizedProps}
        getItem={(data, index) => data[index]}
        getItemCount={(data) => data?.length || 0}
        initialNumToRender={Math.min(windowSize, 10)}
        maxToRenderPerBatch={Math.min(maxToRenderPerBatch, 5)}
      />
    );
  }

  // 使用標準 FlatList
  return (
    <FlatList
      {...optimizedProps}
      initialNumToRender={Math.min(windowSize, 20)}
    />
  );
}

// 性能監控 Hook
export const useListPerformance = (listId: string) => {
  const [metrics, setMetrics] = useState<ListMetrics | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // 這裡可以收集列表特定的性能指標
      const currentMetrics = performanceService.getCurrentMetrics();
      if (currentMetrics) {
        setMetrics({
          totalItems: 0,
          visibleItems: 0,
          renderTime: currentMetrics.renderTime,
          scrollPosition: 0,
          memoryUsage: currentMetrics.memoryUsage
        });
      }
    }, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, [listId]);

  return metrics;
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default OptimizedList;