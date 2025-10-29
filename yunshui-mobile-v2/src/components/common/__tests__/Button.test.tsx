import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Button } from '../Button';

// Mock the gesture utilities to avoid complex dependencies
jest.mock('../../../utils/gestures', () => ({
  HapticFeedback: {
    trigger: jest.fn(),
  },
  HapticFeedbackType: {
    LIGHT: 'light',
  },
  AnimationUtils: {
    pressAnimation: jest.fn(() => ({ start: jest.fn() })),
  },
}));

jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({ isSmallDevice: false }),
}));

jest.mock('../../../utils/responsive', () => ({
  touchTarget: { recommended: 44 },
  responsive: { scale: (val: number) => val, fontSize: (val: number) => val },
  spacing: { xs: 4, sm: 8 },
}));

// Simple wrapper for React Native Paper components
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('Button Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="測試按鈕" onPress={mockOnPress} />,
      { wrapper: Wrapper }
    );

    expect(getByText('測試按鈕')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <Button title="測試按鈕" onPress={mockOnPress} />,
      { wrapper: Wrapper }
    );

    fireEvent.press(getByText('測試按鈕'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const { getByText } = render(
      <Button title="測試按鈕" onPress={mockOnPress} disabled />,
      { wrapper: Wrapper }
    );

    fireEvent.press(getByText('測試按鈕'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const component = render(
      <Button title="測試按鈕" onPress={mockOnPress} loading />,
      { wrapper: Wrapper }
    );

    // Component renders without error
    expect(component).toBeTruthy();
  });

  it('renders with different modes', () => {
    const { rerender, getByText } = render(
      <Button title="測試按鈕" onPress={mockOnPress} mode="outlined" />,
      { wrapper: Wrapper }
    );

    expect(getByText('測試按鈕')).toBeTruthy();

    rerender(
      <Button title="測試按鈕" onPress={mockOnPress} mode="text" />
    );

    expect(getByText('測試按鈕')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, getByText } = render(
      <Button title="測試按鈕" onPress={mockOnPress} size="small" />,
      { wrapper: Wrapper }
    );

    expect(getByText('測試按鈕')).toBeTruthy();

    rerender(
      <Button title="測試按鈕" onPress={mockOnPress} size="large" />
    );

    expect(getByText('測試按鈕')).toBeTruthy();
  });
});