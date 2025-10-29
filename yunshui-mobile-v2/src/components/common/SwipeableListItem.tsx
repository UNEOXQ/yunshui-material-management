import React, { useRef } from 'react';
import {
  View,
  Text,
  Animated,
  PanGestureHandler,
  State,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { TouchableComponent } from './TouchableComponent';
import { HapticFeedback, HapticFeedbackType } from '../../utils/gestures';
import { responsive, spacing, touchTarget } from '../../utils/responsive';
import { layout, typography } from '../../styles/theme';

interface SwipeAction {
  text: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  icon?: string;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onPress,
  onLongPress,
  style,
  disabled = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const isOpen = useRef(false);

  const SWIPE_THRESHOLD = 80;
  const ACTION_WIDTH = 80;

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const handleStateChange = (event: any) => {
    const { state, translationX: gestureX } = event.nativeEvent;

    if (state === State.END) {
      const totalOffset = lastOffset.current + gestureX;
      let targetOffset = 0;

      // 決定最終位置
      if (totalOffset > SWIPE_THRESHOLD && leftActions.length > 0) {
        targetOffset = leftActions.length * ACTION_WIDTH;
        isOpen.current = true;
        HapticFeedback.trigger(HapticFeedbackType.LIGHT);
      } else if (totalOffset < -SWIPE_THRESHOLD && rightActions.length > 0) {
        targetOffset = -rightActions.length * ACTION_WIDTH;
        isOpen.current = true;
        HapticFeedback.trigger(HapticFeedbackType.LIGHT);
      } else {
        targetOffset = 0;
        isOpen.current = false;
      }

      // 動畫到目標位置
      Animated.spring(translateX, {
        toValue: targetOffset,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();

      lastOffset.current = targetOffset;
    }
  };

  const closeSwipe = () => {
    if (isOpen.current) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
      lastOffset.current = 0;
      isOpen.current = false;
    }
  };

  const handleActionPress = (action: SwipeAction) => {
    closeSwipe();
    action.onPress();
    HapticFeedback.trigger(HapticFeedbackType.MEDIUM);
  };

  const handleItemPress = () => {
    if (isOpen.current) {
      closeSwipe();
    } else {
      onPress?.();
    }
  };

  const renderActions = (actions: SwipeAction[], isLeft: boolean) => {
    if (actions.length === 0) return null;

    return (
      <View style={[
        styles.actionsContainer,
        isLeft ? styles.leftActions : styles.rightActions,
        { width: actions.length * ACTION_WIDTH },
      ]}>
        {actions.map((action, index) => (
          <TouchableComponent
            key={index}
            style={[
              styles.actionButton,
              { backgroundColor: action.backgroundColor },
            ]}
            onPress={() => handleActionPress(action)}
            hapticFeedback={HapticFeedbackType.LIGHT}
          >
            <Text style={[styles.actionText, { color: action.color }]}>
              {action.text}
            </Text>
          </TouchableComponent>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* 左側動作 */}
      {renderActions(leftActions, true)}
      
      {/* 右側動作 */}
      {renderActions(rightActions, false)}

      {/* 主要內容 */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        enabled={!disabled && (leftActions.length > 0 || rightActions.length > 0)}
      >
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <TouchableComponent
            onPress={handleItemPress}
            onLongPress={onLongPress}
            style={styles.itemContent}
            disabled={disabled}
            hapticFeedback={HapticFeedbackType.LIGHT}
          >
            {children}
          </TouchableComponent>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#fff',
  },
  content: {
    backgroundColor: '#fff',
    zIndex: 1,
  },
  itemContent: {
    ...layout.listItem,
    backgroundColor: '#fff',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 0,
  },
  leftActions: {
    left: 0,
  },
  rightActions: {
    right: 0,
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
});