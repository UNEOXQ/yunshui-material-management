import React from 'react';
import { Text, TextStyle } from 'react-native';
import { typography } from '../../styles/theme';
import { useResponsive } from '../../hooks/useResponsive';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption' | 'button';

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  style?: TextStyle;
  color?: string;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  variant = 'body1',
  style,
  color,
  numberOfLines,
  adjustsFontSizeToFit = false,
  minimumFontScale = 0.8,
  ...props
}) => {
  const { isSmallDevice } = useResponsive();

  const baseStyle = typography[variant];
  
  // 在小螢幕設備上稍微縮小字體
  const adjustedStyle = isSmallDevice ? {
    ...baseStyle,
    fontSize: baseStyle.fontSize * 0.95,
  } : baseStyle;

  const textStyle = [
    adjustedStyle,
    color && { color },
    style,
  ];

  return (
    <Text
      style={textStyle}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      {...props}
    >
      {children}
    </Text>
  );
};