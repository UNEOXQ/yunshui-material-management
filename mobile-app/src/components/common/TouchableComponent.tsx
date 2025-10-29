import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  ViewStyle,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import { HapticFeedback, HapticFeedbackType, AnimationUtils } from '../../utils/gestures';
import { touchTarget } from '../../utils/responsive';

type TouchableType = 'opacity' | 'highlight' | 'none';

interface TouchableComponentProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  disabled?: boolean;
  type?: TouchableType;
  hapticFeedback?: HapticFeedbackType | false;
  scaleAnimation?: boolean;
  activeOpacity?: number;
  underlayColor?: string;
  delayPressIn?: number;
  delayPressOut?: number;
  delayLongPress?: number;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
  pressRetentionOffset?: { top?: number; bottom?: number; left?: number; right?: number };
  testID?: string;
}

export const TouchableComponent: React.FC<TouchableComponentProps> = ({
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  style,
  disabled = false,
  type = 'opacity',
  hapticFeedback = HapticFeedbackType.LIGHT,
  scaleAnimation = false,
  activeOpacity = 0.7,
  underlayColor = '#e0e0e0',
  delayPressIn = 0,
  delayPressOut = 100,
  delayLongPress = 500,
  hitSlop,
  pressRetentionOffset,
  testID,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  // 預設的 hitSlop，確保觸控目標足夠大
  const defaultHitSlop = {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    if (scaleAnimation) {
      AnimationUtils.pressAnimation(scaleValue, true).start();
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    if (scaleAnimation) {
      AnimationUtils.pressAnimation(scaleValue, false).start();
    }
    onPressOut?.(event);
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (hapticFeedback && !disabled) {
      HapticFeedback.trigger(hapticFeedback);
    }
    onPress?.(event);
  };

  const handleLongPress = (event: GestureResponderEvent) => {
    if (hapticFeedback && !disabled) {
      HapticFeedback.trigger(HapticFeedbackType.MEDIUM);
    }
    onLongPress?.(event);
  };

  const animatedStyle = scaleAnimation
    ? {
        transform: [{ scale: scaleValue }],
      }
    : {};

  const combinedStyle = [style, animatedStyle];

  const commonProps = {
    onPress: handlePress,
    onLongPress: handleLongPress,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    disabled,
    delayPressIn,
    delayPressOut,
    delayLongPress,
    hitSlop: hitSlop || defaultHitSlop,
    pressRetentionOffset,
    testID,
  };

  if (scaleAnimation) {
    const TouchableWrapper = type === 'highlight' ? TouchableHighlight : 
                           type === 'none' ? TouchableWithoutFeedback : TouchableOpacity;

    const touchableProps = type === 'highlight' 
      ? { ...commonProps, underlayColor }
      : type === 'opacity'
      ? { ...commonProps, activeOpacity }
      : commonProps;

    return (
      <TouchableWrapper {...touchableProps}>
        <Animated.View style={combinedStyle}>
          {children}
        </Animated.View>
      </TouchableWrapper>
    );
  }

  switch (type) {
    case 'highlight':
      return (
        <TouchableHighlight
          {...commonProps}
          style={combinedStyle}
          underlayColor={underlayColor}
        >
          {children}
        </TouchableHighlight>
      );

    case 'none':
      return (
        <TouchableWithoutFeedback {...commonProps}>
          <Animated.View style={combinedStyle}>
            {children}
          </Animated.View>
        </TouchableWithoutFeedback>
      );

    case 'opacity':
    default:
      return (
        <TouchableOpacity
          {...commonProps}
          style={combinedStyle}
          activeOpacity={activeOpacity}
        >
          {children}
        </TouchableOpacity>
      );
  }
};