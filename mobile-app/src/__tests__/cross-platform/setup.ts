// Cross-platform test setup
import { Platform, Dimensions } from 'react-native';

// Enhanced mocks for cross-platform testing
beforeEach(() => {
  // Reset Platform.OS to default
  Object.defineProperty(Platform, 'OS', {
    get: jest.fn(() => 'ios'),
    configurable: true,
  });

  // Reset Dimensions to default
  jest.spyOn(Dimensions, 'get').mockReturnValue({
    width: 390,
    height: 844,
    scale: 1,
    fontScale: 1,
  });

  // Mock addEventListener to return cleanup function
  jest.spyOn(Dimensions, 'addEventListener').mockImplementation(() => ({
    remove: jest.fn(),
  }));
});

// Global test utilities for cross-platform testing
global.mockPlatform = (os: 'ios' | 'android') => {
  Object.defineProperty(Platform, 'OS', {
    get: jest.fn(() => os),
    configurable: true,
  });
};

global.mockDimensions = (width: number, height: number) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({
    width,
    height,
    scale: 1,
    fontScale: 1,
  });

  // Trigger dimension change event
  const mockEventData = { window: { width, height, scale: 1, fontScale: 1 } };
  const listeners = (Dimensions.addEventListener as jest.Mock).mock.calls
    .filter(call => call[0] === 'change')
    .map(call => call[1]);
  
  listeners.forEach(listener => listener(mockEventData));
};

// Device configuration presets
global.devicePresets = {
  iPhoneSE: { platform: 'ios', width: 320, height: 568 },
  iPhone12: { platform: 'ios', width: 390, height: 844 },
  iPhone12ProMax: { platform: 'ios', width: 428, height: 926 },
  iPad: { platform: 'ios', width: 768, height: 1024 },
  galaxyS21: { platform: 'android', width: 360, height: 800 },
  galaxyNote: { platform: 'android', width: 412, height: 915 },
  androidTablet: { platform: 'android', width: 800, height: 1280 },
};

global.applyDevicePreset = (preset: keyof typeof global.devicePresets) => {
  const config = global.devicePresets[preset];
  global.mockPlatform(config.platform as 'ios' | 'android');
  global.mockDimensions(config.width, config.height);
};

// Enhanced gesture event simulation
global.simulateGestureEvent = (element: any, gestureType: string, params: any) => {
  const event = {
    nativeEvent: {
      ...params,
      timestamp: Date.now(),
    },
  };

  switch (gestureType) {
    case 'swipeLeft':
      event.nativeEvent = {
        ...event.nativeEvent,
        translationX: -100,
        translationY: 0,
        velocityX: -600,
        velocityY: 0,
        state: 5, // State.END
      };
      break;
    case 'swipeRight':
      event.nativeEvent = {
        ...event.nativeEvent,
        translationX: 100,
        translationY: 0,
        velocityX: 600,
        velocityY: 0,
        state: 5, // State.END
      };
      break;
    case 'swipeUp':
      event.nativeEvent = {
        ...event.nativeEvent,
        translationX: 0,
        translationY: -100,
        velocityX: 0,
        velocityY: -600,
        state: 5, // State.END
      };
      break;
    case 'swipeDown':
      event.nativeEvent = {
        ...event.nativeEvent,
        translationX: 0,
        translationY: 100,
        velocityX: 0,
        velocityY: 600,
        state: 5, // State.END
      };
      break;
  }

  // Simulate gesture event
  if (element.onGestureEvent) {
    element.onGestureEvent(event);
  }
};

// Console logging for test debugging
const originalConsoleLog = console.log;
console.log = (...args) => {
  if (process.env.NODE_ENV === 'test' && process.env.DEBUG_TESTS) {
    originalConsoleLog('[TEST]', ...args);
  }
};

// Test result reporting
afterAll(() => {
  if (process.env.NODE_ENV === 'test' && process.env.REPORT_COVERAGE) {
    console.log('Cross-platform test suite completed');
  }
});

// Type declarations for global utilities
declare global {
  var mockPlatform: (os: 'ios' | 'android') => void;
  var mockDimensions: (width: number, height: number) => void;
  var devicePresets: {
    iPhoneSE: { platform: string; width: number; height: number };
    iPhone12: { platform: string; width: number; height: number };
    iPhone12ProMax: { platform: string; width: number; height: number };
    iPad: { platform: string; width: number; height: number };
    galaxyS21: { platform: string; width: number; height: number };
    galaxyNote: { platform: string; width: number; height: number };
    androidTablet: { platform: string; width: number; height: number };
  };
  var applyDevicePreset: (preset: keyof typeof devicePresets) => void;
  var simulateGestureEvent: (element: any, gestureType: string, params: any) => void;
}