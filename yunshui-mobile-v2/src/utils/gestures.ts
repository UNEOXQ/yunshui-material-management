import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Animated, Vibration, Platform } from 'react-native';

// 手勢配置
export const gestureConfig = {
  // 滑動閾值
  swipeThreshold: 50,
  // 滑動速度閾值
  swipeVelocityThreshold: 500,
  // 長按時間
  longPressDelay: 500,
  // 雙擊間隔
  doubleTapDelay: 300,
};

// 觸控反饋類型
export enum HapticFeedbackType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

// 觸控反饋工具
export class HapticFeedback {
  static trigger(type: HapticFeedbackType = HapticFeedbackType.LIGHT) {
    if (Platform.OS === 'ios') {
      // iOS 使用 Haptic Feedback
      try {
        const ReactNativeHapticFeedback = require('react-native-haptic-feedback');
        const hapticModule = ReactNativeHapticFeedback.default || ReactNativeHapticFeedback;
        
        const options = {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        };

        switch (type) {
          case HapticFeedbackType.LIGHT:
            hapticModule.trigger('impactLight', options);
            break;
          case HapticFeedbackType.MEDIUM:
            hapticModule.trigger('impactMedium', options);
            break;
          case HapticFeedbackType.HEAVY:
            hapticModule.trigger('impactHeavy', options);
            break;
          case HapticFeedbackType.SUCCESS:
            hapticModule.trigger('notificationSuccess', options);
            break;
          case HapticFeedbackType.WARNING:
            hapticModule.trigger('notificationWarning', options);
            break;
          case HapticFeedbackType.ERROR:
            hapticModule.trigger('notificationError', options);
            break;
        }
      } catch (error) {
        // Fallback to vibration if haptic feedback is not available
        this.triggerVibration(type);
      }
    } else {
      // Android 使用振動
      this.triggerVibration(type);
    }
  }

  private static triggerVibration(type: HapticFeedbackType) {
    switch (type) {
      case HapticFeedbackType.LIGHT:
        Vibration.vibrate(10);
        break;
      case HapticFeedbackType.MEDIUM:
        Vibration.vibrate(20);
        break;
      case HapticFeedbackType.HEAVY:
        Vibration.vibrate(50);
        break;
      case HapticFeedbackType.SUCCESS:
        Vibration.vibrate([0, 10, 50, 10]);
        break;
      case HapticFeedbackType.WARNING:
        Vibration.vibrate([0, 20, 100, 20]);
        break;
      case HapticFeedbackType.ERROR:
        Vibration.vibrate([0, 50, 100, 50, 100, 50]);
        break;
    }
  }
}

// 滑動方向
export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
}

// 滑動手勢檢測
export const detectSwipeDirection = (
  translationX: number,
  translationY: number,
  velocityX: number,
  velocityY: number
): SwipeDirection | null => {
  const absX = Math.abs(translationX);
  const absY = Math.abs(translationY);
  const absVelX = Math.abs(velocityX);
  const absVelY = Math.abs(velocityY);

  // 檢查是否達到滑動閾值
  if (absX < gestureConfig.swipeThreshold && absY < gestureConfig.swipeThreshold) {
    return null;
  }

  // 檢查速度是否足夠
  if (absVelX < gestureConfig.swipeVelocityThreshold && absVelY < gestureConfig.swipeVelocityThreshold) {
    return null;
  }

  // 判斷主要方向
  if (absX > absY) {
    return translationX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
  } else {
    return translationY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
  }
};

// 動畫工具
export class AnimationUtils {
  // 彈性動畫
  static spring(value: Animated.Value, toValue: number, config?: Partial<Animated.SpringAnimationConfig>) {
    return Animated.spring(value, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
      ...config,
    });
  }

  // 時間動畫
  static timing(value: Animated.Value, toValue: number, duration: number = 200) {
    return Animated.timing(value, {
      toValue,
      duration,
      useNativeDriver: true,
    });
  }

  // 按壓動畫
  static pressAnimation(scale: Animated.Value, pressed: boolean) {
    return this.spring(scale, pressed ? 0.95 : 1, {
      tension: 150,
      friction: 4,
    });
  }

  // 淡入淡出動畫
  static fadeAnimation(opacity: Animated.Value, visible: boolean, duration: number = 200) {
    return this.timing(opacity, visible ? 1 : 0, duration);
  }
}

// 手勢事件處理器
export interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
}

// 創建手勢處理器
export const createGestureHandler = (handlers: GestureHandlers) => {
  let lastTap = 0;
  let longPressTimer: NodeJS.Timeout | null = null;

  return {
    onGestureEvent: (event: any) => {
      const { translationX, translationY, velocityX, velocityY, state } = event.nativeEvent;

      if (state === State.END) {
        const direction = detectSwipeDirection(translationX, translationY, velocityX, velocityY);
        
        switch (direction) {
          case SwipeDirection.LEFT:
            handlers.onSwipeLeft?.();
            HapticFeedback.trigger(HapticFeedbackType.LIGHT);
            break;
          case SwipeDirection.RIGHT:
            handlers.onSwipeRight?.();
            HapticFeedback.trigger(HapticFeedbackType.LIGHT);
            break;
          case SwipeDirection.UP:
            handlers.onSwipeUp?.();
            HapticFeedback.trigger(HapticFeedbackType.LIGHT);
            break;
          case SwipeDirection.DOWN:
            handlers.onSwipeDown?.();
            HapticFeedback.trigger(HapticFeedbackType.LIGHT);
            break;
        }
      }
    },

    onHandlerStateChange: (event: any) => {
      const { state } = event.nativeEvent;

      if (state === State.BEGAN) {
        // 開始長按計時
        if (handlers.onLongPress) {
          longPressTimer = setTimeout(() => {
            handlers.onLongPress?.();
            HapticFeedback.trigger(HapticFeedbackType.MEDIUM);
          }, gestureConfig.longPressDelay);
        }
      } else if (state === State.END || state === State.CANCELLED) {
        // 清除長按計時
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }

        // 檢測雙擊
        if (handlers.onDoubleTap) {
          const now = Date.now();
          if (now - lastTap < gestureConfig.doubleTapDelay) {
            handlers.onDoubleTap();
            HapticFeedback.trigger(HapticFeedbackType.LIGHT);
            lastTap = 0;
          } else {
            lastTap = now;
          }
        }
      }
    },
  };
};