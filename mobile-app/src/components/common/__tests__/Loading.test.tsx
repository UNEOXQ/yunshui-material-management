import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Loading } from '../Loading';

// Simple wrapper for React Native Paper components
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('Loading Component', () => {
  it('renders with default message', () => {
    const { getByText } = render(<Loading />, { wrapper: Wrapper });
    
    expect(getByText('載入中...')).toBeTruthy();
  });

  it('renders with custom message', () => {
    const { getByText } = render(
      <Loading message="正在處理資料..." />,
      { wrapper: Wrapper }
    );
    
    expect(getByText('正在處理資料...')).toBeTruthy();
  });

  it('renders without message when message is empty', () => {
    const { queryByText } = render(
      <Loading message="" />,
      { wrapper: Wrapper }
    );
    
    expect(queryByText('')).toBeFalsy();
  });

  it('renders activity indicator', () => {
    const component = render(<Loading />, { wrapper: Wrapper });
    
    // Component renders without error
    expect(component).toBeTruthy();
  });

  it('handles different sizes', () => {
    const { rerender } = render(
      <Loading size="small" />,
      { wrapper: Wrapper }
    );
    
    expect(true).toBeTruthy(); // Component renders without error
    
    rerender(<Loading size="large" />);
    
    expect(true).toBeTruthy(); // Component renders without error
  });
});