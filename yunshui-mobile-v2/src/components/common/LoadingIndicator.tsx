import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Modal,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { ActivityIndicator, ProgressBar } from 'react-native-paper';
import { ResponsiveText } from './ResponsiveText';
import { responsive, spacing } from '../../utils/responsive';
import { typography, layout } from '../../styles/theme';

type LoadingType = 'spinner' | 'dots' | 'progress' | 'skeleton';
type LoadingSize = 'small' | 'medium' | 'large';

interface LoadingIndicatorProps {
  visible?: boolean;
  type?: LoadingType;
  size?: LoadingSize;
  text?: string;
  progress?: number; // 0-1 for progress bar
  overlay?: boolean;
  style?: ViewStyle;
  color?: string;
  backgroundColor?: string;
  transparent?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  visible = true,
  type = 'spinner',
  size = 'medium',
  text,
  progress,
  overlay = false,
  style,
  color = '#007bff',
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  transparent = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // 旋轉動畫 (for dots type)
      if (type === 'dots') {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ).start();
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, type]);

  const getSizeValue = () => {
    const sizes = {
      small: responsive.scale(20),
      medium: responsive.scale(30),
      large: responsive.scale(40),
    };
    return sizes[size];
  };

  const renderSpinner = () => (
    <ActivityIndicator
      size={getSizeValue()}
      color={color}
      animating={visible}
    />
  );

  const renderDots = () => {
    const dotSize = getSizeValue() / 3;
    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.dotsContainer,
          { transform: [{ rotate }] },
        ]}
      >
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                backgroundColor: color,
                marginHorizontal: dotSize / 4,
              },
            ]}
          />
        ))}
      </Animated.View>
    );
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <ProgressBar
        progress={progress || 0}
        color={color}
        style={[styles.progressBar, { height: getSizeValue() / 4 }]}
      />
      {text && (
        <ResponsiveText variant="body2" style={styles.progressText}>
          {Math.round((progress || 0) * 100)}%
        </ResponsiveText>
      )}
    </View>
  );

  const renderSkeleton = () => {
    const skeletonHeight = getSizeValue();
    return (
      <View style={styles.skeletonContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.skeletonLine,
              {
                height: skeletonHeight / 3,
                backgroundColor: color,
                opacity: fadeAnim,
                marginBottom: spacing.xs,
                width: `${100 - index * 20}%`,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderLoadingContent = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'progress':
        return renderProgress();
      case 'skeleton':
        return renderSkeleton();
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  const loadingContent = (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <View style={[
        styles.content,
        transparent && styles.transparentContent,
      ]}>
        {renderLoadingContent()}
        {text && type !== 'progress' && (
          <ResponsiveText variant="body2" style={styles.text}>
            {text}
          </ResponsiveText>
        )}
      </View>
    </Animated.View>
  );

  if (!visible) {
    return null;
  }

  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="none"
      >
        <View style={[
          styles.overlay,
          { backgroundColor: transparent ? 'transparent' : backgroundColor },
        ]}>
          {loadingContent}
        </View>
      </Modal>
    );
  }

  return loadingContent;
};

// 全屏載入組件
export const FullScreenLoading: React.FC<{
  visible: boolean;
  text?: string;
}> = ({ visible, text = '載入中...' }) => (
  <LoadingIndicator
    visible={visible}
    overlay
    text={text}
    size="large"
  />
);

// 內聯載入組件
export const InlineLoading: React.FC<{
  visible: boolean;
  text?: string;
  size?: LoadingSize;
}> = ({ visible, text, size = 'small' }) => (
  <LoadingIndicator
    visible={visible}
    text={text}
    size={size}
    transparent
  />
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: responsive.scale(12),
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: responsive.scale(120),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transparentContent: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: '#666',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 50,
  },
  progressContainer: {
    width: responsive.scale(200),
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    borderRadius: responsive.scale(4),
  },
  progressText: {
    marginTop: spacing.sm,
    color: '#666',
    fontWeight: '600',
  },
  skeletonContainer: {
    width: responsive.scale(200),
  },
  skeletonLine: {
    borderRadius: responsive.scale(4),
  },
});