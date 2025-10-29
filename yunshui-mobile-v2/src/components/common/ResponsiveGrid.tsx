import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { layout, spacing } from '../../styles/theme';

interface ResponsiveGridProps {
  children: React.ReactNode;
  style?: ViewStyle;
  spacing?: number;
  columns?: {
    small?: number;
    medium?: number;
    large?: number;
    tablet?: number;
  };
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  style,
  spacing: customSpacing = spacing.xs,
  columns = {
    small: 1,
    medium: 2,
    large: 2,
    tablet: 3,
  },
}) => {
  const { isSmallDevice, isMediumDevice, isLargeDevice, isTablet } = useResponsive();

  // 決定當前螢幕的欄數
  let currentColumns = columns.small || 1;
  if (isTablet && columns.tablet) {
    currentColumns = columns.tablet;
  } else if (isLargeDevice && columns.large) {
    currentColumns = columns.large;
  } else if (isMediumDevice && columns.medium) {
    currentColumns = columns.medium;
  }

  const gridStyle = [
    layout.grid,
    { marginHorizontal: -customSpacing },
    style,
  ];

  const itemWidth = `${100 / currentColumns}%`;

  return (
    <View style={gridStyle}>
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: itemWidth,
            paddingHorizontal: customSpacing,
            marginBottom: customSpacing * 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};