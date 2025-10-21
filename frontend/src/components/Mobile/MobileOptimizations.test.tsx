import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import MobileOptimizations from './MobileOptimizations';

// Mock window properties
const mockWindow = {
  innerWidth: 375,
  innerHeight: 667,
  screen: {
    height: 667
  },
  devicePixelRatio: 2,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Mock navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  maxTouchPoints: 5,
  onLine: true
};

describe('MobileOptimizations', () => {
  beforeEach(() => {
    // Reset window and navigator mocks
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: mockWindow.innerWidth,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: mockWindow.innerHeight,
    });

    Object.defineProperty(window, 'screen', {
      writable: true,
      configurable: true,
      value: mockWindow.screen,
    });

    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: mockNavigator.userAgent,
    });

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: mockNavigator.maxTouchPoints,
    });

    // Mock CSS.supports
    global.CSS = {
      supports: vi.fn().mockReturnValue(true)
    } as any;

    // Clear document head
    document.head.innerHTML = '';
    document.body.className = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.head.innerHTML = '';
    document.body.className = '';
  });

  it('renders children correctly', () => {
    render(
      <MobileOptimizations>
        <div data-testid="test-child">Test Content</div>
      </MobileOptimizations>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('detects mobile device correctly', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const container = screen.getByText('Test').closest('.mobile-optimized-container');
    expect(container).toHaveClass('mobile');
  });

  it('detects tablet device correctly', () => {
    // Set tablet dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
    });

    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const container = screen.getByText('Test').closest('.mobile-optimized-container');
    expect(container).toHaveClass('tablet');
  });

  it('detects desktop device correctly', () => {
    // Set desktop dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: 1200,
    });

    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const container = screen.getByText('Test').closest('.mobile-optimized-container');
    expect(container).not.toHaveClass('mobile');
    expect(container).not.toHaveClass('tablet');
  });

  it('detects orientation correctly', () => {
    // Portrait orientation
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
    });

    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const container = screen.getByText('Test').closest('.mobile-optimized-container');
    expect(container).toHaveClass('portrait');

    // Landscape orientation
    Object.defineProperty(window, 'innerWidth', {
      value: 667,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 375,
    });

    fireEvent(window, new Event('resize'));

    waitFor(() => {
      expect(container).toHaveClass('landscape');
    });
  });

  it('adds device classes to body', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    expect(document.body).toHaveClass('mobile-device');
    expect(document.body).toHaveClass('touch-device');
  });

  it('creates viewport meta tag for mobile', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    expect(viewportMeta).toBeInTheDocument();
    expect(viewportMeta.content).toContain('user-scalable=no');
  });

  it('prevents zoom on double tap', () => {
    const preventDefault = vi.fn();
    const mockTouchEvent = {
      preventDefault,
      timeStamp: Date.now()
    };

    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    // Simulate double tap
    fireEvent.touchEnd(document, mockTouchEvent);
    
    // Wait a bit and fire another touch end
    setTimeout(() => {
      fireEvent.touchEnd(document, mockTouchEvent);
    }, 200);

    // The second touch should be prevented
    waitFor(() => {
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  it('detects keyboard visibility on mobile', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    // Simulate keyboard opening (screen height reduction)
    Object.defineProperty(window, 'innerHeight', {
      value: 400, // Reduced height
    });

    fireEvent(window, new Event('resize'));

    waitFor(() => {
      expect(document.body).toHaveClass('keyboard-visible');
    });
  });

  it('handles orientation change', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    // Change to landscape
    Object.defineProperty(window, 'innerWidth', {
      value: 667,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 375,
    });

    fireEvent(window, new Event('orientationchange'));

    const container = screen.getByText('Test').closest('.mobile-optimized-container');
    
    waitFor(() => {
      expect(container).toHaveClass('landscape');
    });
  });

  it('provides device info in data attribute', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const container = screen.getByText('Test').closest('.mobile-optimized-container');
    const deviceInfo = container?.getAttribute('data-device-info');
    
    expect(deviceInfo).toBeTruthy();
    
    if (deviceInfo) {
      const parsedInfo = JSON.parse(deviceInfo);
      expect(parsedInfo).toHaveProperty('isMobile');
      expect(parsedInfo).toHaveProperty('touchSupport');
      expect(parsedInfo).toHaveProperty('orientation');
    }
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('cleans up body classes on unmount', () => {
    const { unmount } = render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    expect(document.body).toHaveClass('mobile-device');

    unmount();

    expect(document.body).not.toHaveClass('mobile-device');
    expect(document.body).not.toHaveClass('touch-device');
  });

  it('adds touch-friendly styles dynamically', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    // Check if style element was added to head
    const styleElements = document.head.querySelectorAll('style');
    expect(styleElements.length).toBeGreaterThan(0);

    // Check if touch-friendly styles are included
    const styleContent = Array.from(styleElements)
      .map(style => style.textContent)
      .join('');
    
    expect(styleContent).toContain('touch-device');
    expect(styleContent).toContain('min-height: 44px');
  });

  it('handles different device pixel ratios', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 3,
    });

    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const container = screen.getByText('Test').closest('.mobile-optimized-container');
    const deviceInfo = container?.getAttribute('data-device-info');
    
    if (deviceInfo) {
      const parsedInfo = JSON.parse(deviceInfo);
      expect(parsedInfo.pixelRatio).toBe(3);
    }
  });

  it('handles missing devicePixelRatio gracefully', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      value: undefined,
    });

    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const container = screen.getByText('Test').closest('.mobile-optimized-container');
    const deviceInfo = container?.getAttribute('data-device-info');
    
    if (deviceInfo) {
      const parsedInfo = JSON.parse(deviceInfo);
      expect(parsedInfo.pixelRatio).toBe(1); // Default fallback
    }
  });

  it('applies enhanced touch-friendly styles', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    // Check if enhanced style element was added to head
    const styleElements = document.head.querySelectorAll('style');
    expect(styleElements.length).toBeGreaterThan(0);

    // Check if enhanced touch-friendly styles are included
    const styleContent = Array.from(styleElements)
      .map(style => style.textContent)
      .join('');
    
    expect(styleContent).toContain('min-height: 48px');
    expect(styleContent).toContain('touch-action: manipulation');
    expect(styleContent).toContain('transform: scale(0.96)');
  });

  it('handles safe area insets for devices with notches', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const styleElements = document.head.querySelectorAll('style');
    const styleContent = Array.from(styleElements)
      .map(style => style.textContent)
      .join('');
    
    expect(styleContent).toContain('env(safe-area-inset-');
    expect(styleContent).toContain('@supports (padding: max(0px))');
  });

  it('provides enhanced keyboard visibility handling', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    // Simulate keyboard opening with more significant height reduction
    Object.defineProperty(window, 'innerHeight', {
      value: 300, // Significantly reduced height
    });

    fireEvent(window, new Event('resize'));

    waitFor(() => {
      expect(document.body).toHaveClass('keyboard-visible');
    });

    const styleElements = document.head.querySelectorAll('style');
    const styleContent = Array.from(styleElements)
      .map(style => style.textContent)
      .join('');
    
    expect(styleContent).toContain('.keyboard-visible .main-content');
    expect(styleContent).toContain('.keyboard-visible .modal');
    expect(styleContent).toContain('.keyboard-visible .fab');
  });

  it('applies enhanced modal improvements for mobile', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const styleElements = document.head.querySelectorAll('style');
    const styleContent = Array.from(styleElements)
      .map(style => style.textContent)
      .join('');
    
    expect(styleContent).toContain('backdrop-filter: blur(8px)');
    expect(styleContent).toContain('cubic-bezier(0.4, 0, 0.2, 1)');
    expect(styleContent).toContain('border-radius: 16px 16px 0 0');
  });

  it('provides enhanced loading states', () => {
    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    const styleElements = document.head.querySelectorAll('style');
    const styleContent = Array.from(styleElements)
      .map(style => style.textContent)
      .join('');
    
    expect(styleContent).toContain('.loading-overlay');
    expect(styleContent).toContain('.loading-spinner');
    expect(styleContent).toContain('.loading-text');
    expect(styleContent).toContain('backdrop-filter: blur(4px)');
  });

  it('handles landscape orientation with enhanced adjustments', () => {
    // Set landscape orientation
    Object.defineProperty(window, 'innerWidth', {
      value: 667,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 375,
    });

    render(
      <MobileOptimizations>
        <div>Test</div>
      </MobileOptimizations>
    );

    fireEvent(window, new Event('orientationchange'));

    const container = screen.getByText('Test').closest('.mobile-optimized-container');
    
    waitFor(() => {
      expect(container).toHaveClass('landscape');
    });

    const styleElements = document.head.querySelectorAll('style');
    const styleContent = Array.from(styleElements)
      .map(style => style.textContent)
      .join('');
    
    expect(styleContent).toContain('@media (orientation: landscape) and (max-height: 500px)');
    expect(styleContent).toContain('transform: translate(-50%, -50%)');
  });
});