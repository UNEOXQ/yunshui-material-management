import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { layout, deviceStyles } from '../../styles/theme';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  centerOnTablet?: boolean;
  fullWidth?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  safeArea = true,
  centerOnTablet = true,
  fullWidth = false,
}) => {
  const { isTablet, isSmallDevice } = useResponsive();

  const containerStyle = [
    layout.container,
    isSmallDevice && deviceStyles.small.container,
    isTablet && centerOnTablet && deviceStyles.tablet.container,
    fullWidth && { maxWidth: undefined },
    style,
  ];

  const Container = safeArea ? SafeAreaView : View;

  return (
    <Container style={containerStyle}>
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});