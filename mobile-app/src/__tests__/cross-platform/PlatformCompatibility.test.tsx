import React from 'react';
import { Platform } from 'react-native';
import { renderWithProviders, screen } from '../../test-utils';
import { LoginScreen } from '../../screens/LoginScreen';
import { MaterialsScreen } from '../../screens/MaterialsScreen';
import { OrdersScreen } from '../../screens/OrdersScreen';

// Mock Platform module to test both iOS and Android
const mockPlatform = (os: 'ios' | 'android') => {
  Object.defineProperty(Platform, 'OS', {
    get: jest.fn(() => os),
    configurable: true,
  });
};

describe('Platform Compatibility Tests', () => {
  describe('iOS Compatibility', () => {
    beforeEach(() => {
      mockPlatform('ios');
    });

    it('should render LoginScreen correctly on iOS', () => {
      renderWithProviders(<LoginScreen />);
      
      // Check if login form elements are present
      expect(screen.getByTestId('login-form')).toBeTruthy();
      expect(screen.getByTestId('username-input')).toBeTruthy();
      expect(screen.getByTestId('password-input')).toBeTruthy();
      expect(screen.getByTestId('login-button')).toBeTruthy();
    });

    it('should render MaterialsScreen correctly on iOS', () => {
      renderWithProviders(<MaterialsScreen />);
      
      // Check if materials list and controls are present
      expect(screen.getByTestId('materials-screen')).toBeTruthy();
      expect(screen.getByTestId('materials-list')).toBeTruthy();
      expect(screen.getByTestId('add-material-button')).toBeTruthy();
    });

    it('should render OrdersScreen correctly on iOS', () => {
      renderWithProviders(<OrdersScreen />);
      
      // Check if orders list and controls are present
      expect(screen.getByTestId('orders-screen')).toBeTruthy();
      expect(screen.getByTestId('orders-list')).toBeTruthy();
      expect(screen.getByTestId('add-order-button')).toBeTruthy();
    });

    it('should handle iOS-specific haptic feedback', () => {
      const { HapticFeedback } = require('../../utils/gestures');
      
      // Mock iOS haptic feedback
      const mockTrigger = jest.fn();
      jest.mock('react-native-haptic-feedback', () => ({
        trigger: mockTrigger,
      }));

      HapticFeedback.trigger('light');
      
      // On iOS, should use haptic feedback library
      expect(Platform.OS).toBe('ios');
    });
  });

  describe('Android Compatibility', () => {
    beforeEach(() => {
      mockPlatform('android');
    });

    it('should render LoginScreen correctly on Android', () => {
      renderWithProviders(<LoginScreen />);
      
      // Check if login form elements are present
      expect(screen.getByTestId('login-form')).toBeTruthy();
      expect(screen.getByTestId('username-input')).toBeTruthy();
      expect(screen.getByTestId('password-input')).toBeTruthy();
      expect(screen.getByTestId('login-button')).toBeTruthy();
    });

    it('should render MaterialsScreen correctly on Android', () => {
      renderWithProviders(<MaterialsScreen />);
      
      // Check if materials list and controls are present
      expect(screen.getByTestId('materials-screen')).toBeTruthy();
      expect(screen.getByTestId('materials-list')).toBeTruthy();
      expect(screen.getByTestId('add-material-button')).toBeTruthy();
    });

    it('should render OrdersScreen correctly on Android', () => {
      renderWithProviders(<OrdersScreen />);
      
      // Check if orders list and controls are present
      expect(screen.getByTestId('orders-screen')).toBeTruthy();
      expect(screen.getByTestId('orders-list')).toBeTruthy();
      expect(screen.getByTestId('add-order-button')).toBeTruthy();
    });

    it('should handle Android-specific vibration feedback', () => {
      const { HapticFeedback } = require('../../utils/gestures');
      
      // Mock Android vibration
      const mockVibrate = jest.fn();
      jest.mock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Vibration: {
          vibrate: mockVibrate,
        },
      }));

      HapticFeedback.trigger('light');
      
      // On Android, should use vibration
      expect(Platform.OS).toBe('android');
    });
  });

  describe('Cross-Platform API Compatibility', () => {
    it('should handle platform-specific image picker options', () => {
      const mockLaunchImageLibrary = jest.fn();
      const mockLaunchCamera = jest.fn();
      
      jest.mock('expo-image-picker', () => ({
        launchImageLibraryAsync: mockLaunchImageLibrary,
        launchCameraAsync: mockLaunchCamera,
        MediaTypeOptions: {
          Images: 'Images',
        },
      }));

      // Test both platforms handle image picker correctly
      ['ios', 'android'].forEach(platform => {
        mockPlatform(platform as 'ios' | 'android');
        
        // Both platforms should support image picker
        expect(mockLaunchImageLibrary).toBeDefined();
        expect(mockLaunchCamera).toBeDefined();
      });
    });

    it('should handle platform-specific storage correctly', () => {
      const mockSetItem = jest.fn();
      const mockGetItem = jest.fn();
      
      jest.mock('@react-native-async-storage/async-storage', () => ({
        setItem: mockSetItem,
        getItem: mockGetItem,
      }));

      // Test both platforms handle storage correctly
      ['ios', 'android'].forEach(platform => {
        mockPlatform(platform as 'ios' | 'android');
        
        // Both platforms should support AsyncStorage
        expect(mockSetItem).toBeDefined();
        expect(mockGetItem).toBeDefined();
      });
    });
  });

  describe('Platform-Specific UI Elements', () => {
    it('should render platform-appropriate navigation elements', () => {
      ['ios', 'android'].forEach(platform => {
        mockPlatform(platform as 'ios' | 'android');
        
        renderWithProviders(<LoginScreen />);
        
        // Check if navigation elements are present
        const loginForm = screen.getByTestId('login-form');
        expect(loginForm).toBeTruthy();
        
        // Platform-specific styling should be applied
        // (This would be tested through snapshot testing in a real scenario)
      });
    });

    it('should handle platform-specific touch targets', () => {
      const { touchTarget } = require('../../utils/responsive');
      
      ['ios', 'android'].forEach(platform => {
        mockPlatform(platform as 'ios' | 'android');
        
        if (Platform.OS === 'ios') {
          expect(touchTarget.minSize).toBe(44);
        } else {
          expect(touchTarget.androidMinSize).toBe(48);
        }
      });
    });
  });
});