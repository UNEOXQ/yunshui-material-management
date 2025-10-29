import React, { useRef, useState } from 'react';
import {
  ScrollView,
  RefreshControl,
  Animated,
  PanGestureHandler,
  State,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { HapticFeedback, HapticFeedbackType } from '../../utils/gestures';
import { responsive, spacing } from '../../utils/responsive';
import { typography } from '../../styles/theme';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  enabled?: boolean;
  threshold?: number;
  customRefreshComponent?: React.ReactNode;
  refreshText?: string;
  releaseText?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshing = false,
  enabled = true,
  threshold = 80,
  customRefreshComponent,
  refreshText = '下拉刷新',
  releaseText = '釋放刷新',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const { translationY: y } = event.nativeEvent;
        if (y > 0) {
          setPullDistance(y);
          
          // 更新透明度和縮放
          const progress = Math.min(y / threshold, 1);
          opacity.setValue(progress);
          scale.setValue(progress);
        }
      },
    }
  );

  const handleStateChange = async (event: any) => {
    const { state, translationY: y } = event.nativeEvent;

    if (state === State.END) {
      if (y >= threshold && enabled && !isRefreshing) {
        // 觸發刷新
        setIsRefreshing(true);
        HapticFeedback.trigger(HapticFeedbackType.MEDIUM);
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      // 重置動畫
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      setPullDistance(0);
    }
  };

  const renderRefreshIndicator = () => {
    if (customRefreshComponent) {
      return customRefreshComponent;
    }

    const isOverThreshold = pullDistance >= threshold;
    const displayText = isOverThreshold ? releaseText : refreshText;

    return (
      <Animated.View
        style={[
          styles.refreshContainer,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : (
          <View style={styles.refreshContent}>
            <Text style={[
              styles.refreshText,
              isOverThreshold && styles.refreshTextActive,
            ]}>
              {displayText}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 刷新指示器 */}
      <View style={styles.refreshIndicatorContainer}>
        {renderRefreshIndicator()}
      </View>

      {/* 主要內容 */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        enabled={enabled && !isRefreshing}
      >
        <Animated.View style={styles.content}>
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || isRefreshing}
                onRefresh={onRefresh}
                enabled={enabled}
                colors={['#007bff']}
                tintColor="#007bff"
              />
            }
          >
            {children}
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshIndicatorContainer: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  refreshContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: spacing.md,
  },
  refreshContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    ...typography.body2,
    color: '#666',
    textAlign: 'center',
  },
  refreshTextActive: {
    color: '#007bff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});