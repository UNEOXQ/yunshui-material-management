import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanGestureHandler,
  State,
} from 'react-native';
import { ResponsiveText } from './ResponsiveText';
import { spacing, responsive } from '../../utils/responsive';
import { HapticFeedback, HapticFeedbackType } from '../../utils/gestures';

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
  position?: 'top' | 'bottom';
  swipeToDismiss?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = ToastType.INFO,
  duration = 3000,
  onHide,
  position = 'top',
  swipeToDismiss = true,
}) => {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      // 顯示動畫
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 觸覺反饋
      switch (type) {
        case ToastType.SUCCESS:
          HapticFeedback.trigger(HapticFeedbackType.SUCCESS);
          break;
        case ToastType.ERROR:
          HapticFeedback.trigger(HapticFeedbackType.ERROR);
          break;
        case ToastType.WARNING:
          HapticFeedback.trigger(HapticFeedbackType.WARNING);
          break;
        default:
          HapticFeedback.trigger(HapticFeedbackType.LIGHT);
      }

      // 自動隱藏
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    } else {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, type, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    const { state, translationX } = event.nativeEvent;

    if (state === State.END) {
      if (Math.abs(translationX) > 100) {
        // 滑動距離足夠，隱藏 Toast
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: translationX > 0 ? 300 : -300,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide?.();
        });
      } else {
        // 回彈到原位
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const getToastStyle = () => {
    switch (type) {
      case ToastType.SUCCESS:
        return {
          backgroundColor: '#4caf50',
          icon: '✅',
        };
      case ToastType.ERROR:
        return {
          backgroundColor: '#f44336',
          icon: '❌',
        };
      case ToastType.WARNING:
        return {
          backgroundColor: '#ff9800',
          icon: '⚠️',
        };
      case ToastType.INFO:
      default:
        return {
          backgroundColor: '#2196f3',
          icon: 'ℹ️',
        };
    }
  };

  const toastStyle = getToastStyle();

  if (!visible) {
    return null;
  }

  const toastContent = (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        {
          backgroundColor: toastStyle.backgroundColor,
          opacity,
          transform: [
            { translateY },
            { translateX },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={hideToast}
        activeOpacity={0.8}
      >
        <ResponsiveText variant="body2" style={styles.icon}>
          {toastStyle.icon}
        </ResponsiveText>
        <ResponsiveText variant="body2" style={styles.message}>
          {message}
        </ResponsiveText>
      </TouchableOpacity>
    </Animated.View>
  );

  if (swipeToDismiss) {
    return (
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
      >
        {toastContent}
      </PanGestureHandler>
    );
  }

  return toastContent;
};

// Toast Manager
class ToastManager {
  private static instance: ToastManager;
  private toastRef: React.RefObject<any> = React.createRef();

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  setRef(ref: React.RefObject<any>) {
    this.toastRef = ref;
  }

  show(message: string, type: ToastType = ToastType.INFO, duration: number = 3000) {
    this.toastRef.current?.show(message, type, duration);
  }

  success(message: string, duration?: number) {
    this.show(message, ToastType.SUCCESS, duration);
  }

  error(message: string, duration?: number) {
    this.show(message, ToastType.ERROR, duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, ToastType.WARNING, duration);
  }

  info(message: string, duration?: number) {
    this.show(message, ToastType.INFO, duration);
  }
}

export const toastManager = ToastManager.getInstance();

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    borderRadius: responsive.scale(8),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 9999,
  },
  topPosition: {
    top: spacing.xl,
  },
  bottomPosition: {
    bottom: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
    color: '#fff',
  },
  message: {
    flex: 1,
    color: '#fff',
    fontWeight: '500',
  },
});