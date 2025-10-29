import React, { useRef } from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { StyleSheet, Animated, ViewStyle } from 'react-native';
import { HapticFeedback, HapticFeedbackType, AnimationUtils } from '../../utils/gestures';
import { touchTarget, responsive, spacing } from '../../utils/responsive';
import { useResponsive } from '../../hooks/useResponsive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  hapticFeedback?: HapticFeedbackType | false;
  scaleAnimation?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = 'contained',
  disabled = false,
  loading = false,
  style,
  hapticFeedback = HapticFeedbackType.LIGHT,
  scaleAnimation = true,
  size = 'medium',
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const { isSmallDevice } = useResponsive();

  const handlePressIn = () => {
    if (scaleAnimation && !disabled) {
      AnimationUtils.pressAnimation(scaleValue, true).start();
    }
  };

  const handlePressOut = () => {
    if (scaleAnimation && !disabled) {
      AnimationUtils.pressAnimation(scaleValue, false).start();
    }
  };

  const handlePress = () => {
    if (hapticFeedback && !disabled) {
      HapticFeedback.trigger(hapticFeedback);
    }
    onPress();
  };

  // 根據尺寸和設備調整按鈕大小
  const getButtonSize = () => {
    const baseHeight = touchTarget.recommended;
    const sizeMultiplier = {
      small: 0.8,
      medium: 1,
      large: 1.2,
    };
    
    const deviceMultiplier = isSmallDevice ? 0.9 : 1;
    return baseHeight * sizeMultiplier[size] * deviceMultiplier;
  };

  const buttonHeight = getButtonSize();

  const animatedStyle = scaleAnimation ? {
    transform: [{ scale: scaleValue }],
  } : {};

  const buttonStyle = [
    styles.button,
    {
      minHeight: buttonHeight,
    },
    animatedStyle,
    style,
  ];

  const contentStyle = [
    styles.content,
    {
      paddingVertical: spacing.sm,
      minHeight: buttonHeight - 4, // 減去邊框
    },
  ];

  return (
    <Animated.View style={animatedStyle}>
      <PaperButton
        mode={mode}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        loading={loading}
        style={buttonStyle}
        contentStyle={contentStyle}
        labelStyle={styles.label}
      >
        {title}
      </PaperButton>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: spacing.xs,
    borderRadius: responsive.scale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: responsive.fontSize(16),
    fontWeight: '600',
  },
});