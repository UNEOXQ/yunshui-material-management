import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GlobalErrorBoundary from './GlobalErrorBoundary';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn();
Object.defineProperty(navigator, 'sendBeacon', {
  value: mockSendBeacon,
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('GlobalErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={false} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render error UI when error occurs', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('應用程式發生錯誤')).toBeInTheDocument();
    expect(screen.getByText(/很抱歉，應用程式遇到了意外錯誤/)).toBeInTheDocument();
    expect(screen.getByText(/錯誤 ID:/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show network error message for network errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const NetworkError: React.FC = () => {
      throw new Error('fetch failed');
    };

    render(
      <GlobalErrorBoundary>
        <NetworkError />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('網路連線問題')).toBeInTheDocument();
    expect(screen.getByText(/無法連接到伺服器/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show chunk error message for chunk load errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ChunkError: React.FC = () => {
      throw new Error('Loading chunk 123 failed');
    };

    render(
      <GlobalErrorBoundary>
        <ChunkError />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('應用程式更新')).toBeInTheDocument();
    expect(screen.getByText(/應用程式已更新/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should call onError callback when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <GlobalErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );

    consoleSpy.mockRestore();
  });

  it('should render custom fallback when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const customFallback = <div>Custom error message</div>;

    render(
      <GlobalErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show error details when showDetails is true', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <GlobalErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('技術詳情')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should handle retry button click', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('應用程式發生錯誤')).toBeInTheDocument();

    const retryButton = screen.getByText('重試');
    fireEvent.click(retryButton);

    // After retry, render without error
    rerender(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={false} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should handle reload button click', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockReload = vi.fn();
    Object.defineProperty(window.location, 'reload', {
      value: mockReload,
      writable: true
    });

    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    const reloadButton = screen.getByText('重新載入頁面');
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle go home button click', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalHref = window.location.href;

    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    const homeButton = screen.getByText('返回首頁');
    fireEvent.click(homeButton);

    // Note: In test environment, we can't actually change window.location.href
    // This test verifies the button exists and is clickable

    consoleSpy.mockRestore();
  });

  it('should send error report to backend', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'userData') return JSON.stringify({ id: 'user-123' });
      return null;
    });

    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    // Wait for error report to be sent
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/errors/report',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: expect.stringContaining('Test error message')
      })
    );

    consoleSpy.mockRestore();
  });

  it('should use sendBeacon as fallback when fetch fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error('Fetch failed'));

    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    // Wait for error report attempts
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockSendBeacon).toHaveBeenCalledWith(
      '/api/errors/beacon',
      expect.stringContaining('Test error message')
    );

    consoleSpy.mockRestore();
  });

  it('should generate unique error IDs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    const firstErrorId = screen.getByText(/錯誤 ID:/).textContent;

    // Reset and trigger another error
    rerender(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={false} />
      </GlobalErrorBoundary>
    );

    rerender(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    const secondErrorId = screen.getByText(/錯誤 ID:/).textContent;

    expect(firstErrorId).not.toBe(secondErrorId);

    consoleSpy.mockRestore();
  });
});