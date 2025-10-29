import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Input } from '../Input';

// Simple wrapper for React Native Paper components
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('Input Component', () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    mockOnChangeText.mockClear();
  });

  it('renders correctly with label', () => {
    const { getByText } = render(
      <Input
        label="測試輸入框"
        value=""
        onChangeText={mockOnChangeText}
      />,
      { wrapper: Wrapper }
    );

    expect(getByText('測試輸入框')).toBeTruthy();
  });

  it('displays value correctly', () => {
    const { getByDisplayValue } = render(
      <Input
        label="測試輸入框"
        value="測試值"
        onChangeText={mockOnChangeText}
      />,
      { wrapper: Wrapper }
    );

    expect(getByDisplayValue('測試值')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const { getByDisplayValue } = render(
      <Input
        label="測試輸入框"
        value=""
        onChangeText={mockOnChangeText}
      />,
      { wrapper: Wrapper }
    );

    const input = getByDisplayValue('');
    fireEvent.changeText(input, '新文字');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('新文字');
  });

  it('shows placeholder when provided', () => {
    const { getByPlaceholderText } = render(
      <Input
        label="測試輸入框"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="請輸入文字"
      />,
      { wrapper: Wrapper }
    );

    expect(getByPlaceholderText('請輸入文字')).toBeTruthy();
  });

  it('handles secure text entry', () => {
    const { getByDisplayValue } = render(
      <Input
        label="密碼"
        value="password"
        onChangeText={mockOnChangeText}
        secureTextEntry
      />,
      { wrapper: Wrapper }
    );

    const input = getByDisplayValue('password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('handles disabled state', () => {
    const { getByDisplayValue } = render(
      <Input
        label="測試輸入框"
        value="測試值"
        onChangeText={mockOnChangeText}
        disabled
      />,
      { wrapper: Wrapper }
    );

    const input = getByDisplayValue('測試值');
    expect(input.props.editable).toBe(false);
  });

  it('handles multiline input', () => {
    const { getByDisplayValue } = render(
      <Input
        label="多行輸入"
        value="第一行\n第二行"
        onChangeText={mockOnChangeText}
        multiline
        numberOfLines={3}
      />,
      { wrapper: Wrapper }
    );

    const input = getByDisplayValue('第一行\n第二行');
    expect(input.props.multiline).toBe(true);
  });

  it('handles different keyboard types', () => {
    const { getByDisplayValue } = render(
      <Input
        label="電子郵件"
        value="test@example.com"
        onChangeText={mockOnChangeText}
        keyboardType="email-address"
      />,
      { wrapper: Wrapper }
    );

    const input = getByDisplayValue('test@example.com');
    expect(input.props.keyboardType).toBe('email-address');
  });
});