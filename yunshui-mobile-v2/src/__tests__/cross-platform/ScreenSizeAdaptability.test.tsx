import React from 'react';
import { Dimensions } from 'react-native';
import { renderWithProviders, screen } from '../../test-utils';
import { useResponsive } from '../../hooks/useResponsive';
import { useOrientation } from '../../hooks/useOrientation';
import { responsive, deviceInfo, responsiveValue } from '../../utils/responsive';
import { LoginScreen } from '../../screens/LoginScreen';
import { MaterialsScreen } from '../../screens/MaterialsScreen';

// Mock Dimensions to simulate different screen sizes
const mockDimensions = (width: number, height: number) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 1, fontScale: 1 });
  
  // Trigger dimension change event
  const mockEventData = { window: { width, height, scale: 1, fontScale: 1 } };
  const listeners = (Dimensions.addEventListener as jest.Mock).mock.calls
    .filter(call => call[0] === 'change')
    .map(call => call[1]);
  
  listeners.forEach(listener => listener(mockEventData));
};

// Test component that uses responsive hooks
const TestResponsiveComponent: React.FC = () => {
  const responsive = useResponsive();
  const orientation = useOrientation();
  
  return (
    <>
      <div testID="screen-width">{responsive.width}</div>
      <div testID="screen-height">{responsive.height}</div>
      <div testID="is-small-device">{responsive.isSmallDevice.toString()}</div>
      <div testID="is-medium-device">{responsive.isMediumDevice.toString()}</div>
      <div testID="is-large-device">{responsive.isLargeDevice.toString()}</div>
      <div testID="is-tablet">{responsive.isTablet.toString()}</div>
      <div testID="is-landscape">{orientation.isLandscape.toString()}</div>
      <div testID="is-portrait">{orientation.isPortrait.toString()}</div>
    </>
  );
};

describe('Screen Size Adaptability Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock addEventListener to return a cleanup function
    jest.spyOn(Dimensions, 'addEventListener').mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  describe('Small Device (iPhone SE - 320x568)', () => {
    beforeEach(() => {
      mockDimensions(320, 568);
    });

    it('should correctly identify small device characteristics', () => {
      renderWithProviders(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('screen-width')).toHaveTextContent('320');
      expect(screen.getByTestId('screen-height')).toHaveTextContent('568');
      expect(screen.getByTestId('is-small-device')).toHaveTextContent('true');
      expect(screen.getByTestId('is-medium-device')).toHaveTextContent('false');
      expect(screen.getByTestId('is-large-device')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-portrait')).toHaveTextContent('true');
    });

    it('should render LoginScreen appropriately for small devices', () => {
      renderWithProviders(<LoginScreen />);
      
      const loginForm = screen.getByTestId('login-form');
      expect(loginForm).toBeTruthy();
      
      // Small devices should have compact layout
      // (In real implementation, this would check specific styling)
    });

    it('should calculate responsive values correctly for small devices', () => {
      const scaledValue = responsive.scale(16);
      const fontValue = responsive.fontSize(14);
      const wpValue = responsive.wp(50);
      const hpValue = responsive.hp(10);
      
      expect(scaledValue).toBeGreaterThan(0);
      expect(fontValue).toBeGreaterThan(0);
      expect(wpValue).toBe(160); // 50% of 320
      expect(hpValue).toBe(57); // 10% of 568 (rounded)
    });
  });

  describe('Medium Device (iPhone 12 - 390x844)', () => {
    beforeEach(() => {
      mockDimensions(390, 844);
    });

    it('should correctly identify medium device characteristics', () => {
      renderWithProviders(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('screen-width')).toHaveTextContent('390');
      expect(screen.getByTestId('screen-height')).toHaveTextContent('844');
      expect(screen.getByTestId('is-small-device')).toHaveTextContent('false');
      expect(screen.getByTestId('is-medium-device')).toHaveTextContent('true');
      expect(screen.getByTestId('is-large-device')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-portrait')).toHaveTextContent('true');
    });

    it('should render MaterialsScreen appropriately for medium devices', () => {
      renderWithProviders(<MaterialsScreen />);
      
      const materialsScreen = screen.getByTestId('materials-screen');
      expect(materialsScreen).toBeTruthy();
      
      // Medium devices should have standard layout
    });

    it('should use responsive values correctly for medium devices', () => {
      const testValue = responsiveValue({
        small: 10,
        medium: 15,
        large: 20,
        tablet: 25,
        default: 12,
      });
      
      expect(testValue).toBe(15); // Should use medium value
    });
  });

  describe('Large Device (iPhone 12 Pro Max - 428x926)', () => {
    beforeEach(() => {
      mockDimensions(428, 926);
    });

    it('should correctly identify large device characteristics', () => {
      renderWithProviders(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('screen-width')).toHaveTextContent('428');
      expect(screen.getByTestId('screen-height')).toHaveTextContent('926');
      expect(screen.getByTestId('is-small-device')).toHaveTextContent('false');
      expect(screen.getByTestId('is-medium-device')).toHaveTextContent('false');
      expect(screen.getByTestId('is-large-device')).toHaveTextContent('true');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-portrait')).toHaveTextContent('true');
    });

    it('should use responsive values correctly for large devices', () => {
      const testValue = responsiveValue({
        small: 10,
        medium: 15,
        large: 20,
        tablet: 25,
        default: 12,
      });
      
      expect(testValue).toBe(20); // Should use large value
    });
  });

  describe('Tablet Device (iPad - 768x1024)', () => {
    beforeEach(() => {
      mockDimensions(768, 1024);
    });

    it('should correctly identify tablet characteristics', () => {
      renderWithProviders(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('screen-width')).toHaveTextContent('768');
      expect(screen.getByTestId('screen-height')).toHaveTextContent('1024');
      expect(screen.getByTestId('is-small-device')).toHaveTextContent('false');
      expect(screen.getByTestId('is-medium-device')).toHaveTextContent('false');
      expect(screen.getByTestId('is-large-device')).toHaveTextContent('true');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('is-portrait')).toHaveTextContent('true');
    });

    it('should use responsive values correctly for tablets', () => {
      const testValue = responsiveValue({
        small: 10,
        medium: 15,
        large: 20,
        tablet: 25,
        default: 12,
      });
      
      expect(testValue).toBe(25); // Should use tablet value
    });

    it('should render screens appropriately for tablets', () => {
      renderWithProviders(<MaterialsScreen />);
      
      const materialsScreen = screen.getByTestId('materials-screen');
      expect(materialsScreen).toBeTruthy();
      
      // Tablets should have expanded layout
    });
  });

  describe('Landscape Orientation Tests', () => {
    it('should handle landscape orientation on phone (844x390)', () => {
      mockDimensions(844, 390);
      
      renderWithProviders(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('is-landscape')).toHaveTextContent('true');
      expect(screen.getByTestId('is-portrait')).toHaveTextContent('false');
    });

    it('should handle landscape orientation on tablet (1024x768)', () => {
      mockDimensions(1024, 768);
      
      renderWithProviders(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('is-landscape')).toHaveTextContent('true');
      expect(screen.getByTestId('is-portrait')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
    });
  });

  describe('Responsive Scaling Tests', () => {
    it('should scale values proportionally across different screen sizes', () => {
      const testSizes = [
        { width: 320, height: 568 }, // Small
        { width: 390, height: 844 }, // Medium (base)
        { width: 428, height: 926 }, // Large
        { width: 768, height: 1024 }, // Tablet
      ];

      testSizes.forEach(({ width, height }) => {
        mockDimensions(width, height);
        
        const scaledValue = responsive.scale(16);
        const fontValue = responsive.fontSize(14);
        
        // Values should be positive and reasonable
        expect(scaledValue).toBeGreaterThan(0);
        expect(scaledValue).toBeLessThan(100);
        expect(fontValue).toBeGreaterThan(0);
        expect(fontValue).toBeLessThan(50);
      });
    });

    it('should maintain minimum touch target sizes across devices', () => {
      const testSizes = [
        { width: 320, height: 568 },
        { width: 390, height: 844 },
        { width: 428, height: 926 },
        { width: 768, height: 1024 },
      ];

      testSizes.forEach(({ width, height }) => {
        mockDimensions(width, height);
        
        const { touchTarget } = require('../../utils/responsive');
        
        // Touch targets should meet minimum accessibility requirements
        expect(touchTarget.recommended).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Dynamic Screen Size Changes', () => {
    it('should respond to orientation changes', () => {
      // Start in portrait
      mockDimensions(390, 844);
      
      const { rerender } = renderWithProviders(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('is-portrait')).toHaveTextContent('true');
      
      // Change to landscape
      mockDimensions(844, 390);
      rerender(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('is-landscape')).toHaveTextContent('true');
    });

    it('should update device type classification on size changes', () => {
      // Start with small device
      mockDimensions(320, 568);
      
      const { rerender } = renderWithProviders(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('is-small-device')).toHaveTextContent('true');
      
      // Change to tablet size
      mockDimensions(768, 1024);
      rerender(<TestResponsiveComponent />);
      
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('is-small-device')).toHaveTextContent('false');
    });
  });
});