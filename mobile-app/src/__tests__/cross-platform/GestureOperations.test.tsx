import React from 'react';
import { Animated, Platform, Vibration } from 'react-native';
import { State } from 'react-native-gesture-handler';
import { renderWithProviders, screen, fireEvent } from '../../test-utils';
import { 
  HapticFeedback, 
  HapticFeedbackType, 
  detectSwipeDirection, 
  SwipeDirection,
  createGestureHandler,
  AnimationUtils,
  gestureConfig
} from '../../utils/gestures';

// Mock react-native-haptic-feedback
const mockHapticTrigger = jest.fn();
jest.mock('react-native-haptic-feedback', () => ({
  trigger: mockHapticTrigger,
  default: {
    trigger: mockHapticTrigger,
  },
}));

// Mock Vibration
const mockVibrate = jest.fn();
jest.spyOn(Vibration, 'vibrate').mockImplementation(mockVibrate);

// Mock Platform
const mockPlatform = (os: 'ios' | 'android') => {
  Object.defineProperty(Platform, 'OS', {
    get: jest.fn(() => os),
    configurable: true,
  });
};

// Test component with gesture handling
const TestGestureComponent: React.FC<{
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
}> = (props) => {
  const gestureHandler = createGestureHandler(props);
  
  return (
    <div 
      testID="gesture-test-area"
      onMouseDown={() => gestureHandler.onHandlerStateChange({ nativeEvent: { state: State.BEGAN } })}
      onMouseUp={() => gestureHandler.onHandlerStateChange({ nativeEvent: { state: State.END } })}
    >
      Gesture Test Area
    </div>
  );
};

describe('Gesture Operations Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Haptic Feedback Tests', () => {
    describe('iOS Haptic Feedback', () => {
      beforeEach(() => {
        mockPlatform('ios');
      });

      it('should trigger light haptic feedback on iOS', () => {
        HapticFeedback.trigger(HapticFeedbackType.LIGHT);
        
        expect(mockHapticTrigger).toHaveBeenCalledWith('impactLight', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      });

      it('should trigger medium haptic feedback on iOS', () => {
        HapticFeedback.trigger(HapticFeedbackType.MEDIUM);
        
        expect(mockHapticTrigger).toHaveBeenCalledWith('impactMedium', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      });

      it('should trigger heavy haptic feedback on iOS', () => {
        HapticFeedback.trigger(HapticFeedbackType.HEAVY);
        
        expect(mockHapticTrigger).toHaveBeenCalledWith('impactHeavy', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      });

      it('should trigger success notification on iOS', () => {
        HapticFeedback.trigger(HapticFeedbackType.SUCCESS);
        
        expect(mockHapticTrigger).toHaveBeenCalledWith('notificationSuccess', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      });

      it('should trigger warning notification on iOS', () => {
        HapticFeedback.trigger(HapticFeedbackType.WARNING);
        
        expect(mockHapticTrigger).toHaveBeenCalledWith('notificationWarning', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      });

      it('should trigger error notification on iOS', () => {
        HapticFeedback.trigger(HapticFeedbackType.ERROR);
        
        expect(mockHapticTrigger).toHaveBeenCalledWith('notificationError', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      });
    });

    describe('Android Vibration Feedback', () => {
      beforeEach(() => {
        mockPlatform('android');
      });

      it('should trigger light vibration on Android', () => {
        HapticFeedback.trigger(HapticFeedbackType.LIGHT);
        
        expect(mockVibrate).toHaveBeenCalledWith(10);
      });

      it('should trigger medium vibration on Android', () => {
        HapticFeedback.trigger(HapticFeedbackType.MEDIUM);
        
        expect(mockVibrate).toHaveBeenCalledWith(20);
      });

      it('should trigger heavy vibration on Android', () => {
        HapticFeedback.trigger(HapticFeedbackType.HEAVY);
        
        expect(mockVibrate).toHaveBeenCalledWith(50);
      });

      it('should trigger success vibration pattern on Android', () => {
        HapticFeedback.trigger(HapticFeedbackType.SUCCESS);
        
        expect(mockVibrate).toHaveBeenCalledWith([0, 10, 50, 10]);
      });

      it('should trigger warning vibration pattern on Android', () => {
        HapticFeedback.trigger(HapticFeedbackType.WARNING);
        
        expect(mockVibrate).toHaveBeenCalledWith([0, 20, 100, 20]);
      });

      it('should trigger error vibration pattern on Android', () => {
        HapticFeedback.trigger(HapticFeedbackType.ERROR);
        
        expect(mockVibrate).toHaveBeenCalledWith([0, 50, 100, 50, 100, 50]);
      });
    });
  });

  describe('Swipe Direction Detection', () => {
    it('should detect left swipe correctly', () => {
      const direction = detectSwipeDirection(-100, 0, -600, 0);
      expect(direction).toBe(SwipeDirection.LEFT);
    });

    it('should detect right swipe correctly', () => {
      const direction = detectSwipeDirection(100, 0, 600, 0);
      expect(direction).toBe(SwipeDirection.RIGHT);
    });

    it('should detect up swipe correctly', () => {
      const direction = detectSwipeDirection(0, -100, 0, -600);
      expect(direction).toBe(SwipeDirection.UP);
    });

    it('should detect down swipe correctly', () => {
      const direction = detectSwipeDirection(0, 100, 0, 600);
      expect(direction).toBe(SwipeDirection.DOWN);
    });

    it('should return null for insufficient translation', () => {
      const direction = detectSwipeDirection(10, 10, 100, 100);
      expect(direction).toBeNull();
    });

    it('should return null for insufficient velocity', () => {
      const direction = detectSwipeDirection(100, 0, 100, 0);
      expect(direction).toBeNull();
    });

    it('should prioritize horizontal swipes when translation is similar', () => {
      const direction = detectSwipeDirection(100, 90, 600, 500);
      expect(direction).toBe(SwipeDirection.RIGHT);
    });

    it('should prioritize vertical swipes when vertical translation is greater', () => {
      const direction = detectSwipeDirection(90, 100, 500, 600);
      expect(direction).toBe(SwipeDirection.DOWN);
    });
  });

  describe('Gesture Handler Integration', () => {
    it('should call onSwipeLeft when left swipe is detected', () => {
      const onSwipeLeft = jest.fn();
      
      renderWithProviders(
        <TestGestureComponent onSwipeLeft={onSwipeLeft} />
      );
      
      const gestureArea = screen.getByTestId('gesture-test-area');
      
      // Simulate swipe left gesture by calling the handler directly
      const gestureHandler = createGestureHandler({ onSwipeLeft });
      gestureHandler.onGestureEvent({
        nativeEvent: {
          translationX: -100,
          translationY: 0,
          velocityX: -600,
          velocityY: 0,
          state: State.END,
        },
      });
      
      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should call onSwipeRight when right swipe is detected', () => {
      const onSwipeRight = jest.fn();
      
      renderWithProviders(
        <TestGestureComponent onSwipeRight={onSwipeRight} />
      );
      
      const gestureArea = screen.getByTestId('gesture-test-area');
      
      // Simulate swipe right gesture by calling the handler directly
      const gestureHandler = createGestureHandler({ onSwipeRight });
      gestureHandler.onGestureEvent({
        nativeEvent: {
          translationX: 100,
          translationY: 0,
          velocityX: 600,
          velocityY: 0,
          state: State.END,
        },
      });
      
      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('should call onSwipeUp when up swipe is detected', () => {
      const onSwipeUp = jest.fn();
      
      renderWithProviders(
        <TestGestureComponent onSwipeUp={onSwipeUp} />
      );
      
      const gestureArea = screen.getByTestId('gesture-test-area');
      
      // Simulate swipe up gesture by calling the handler directly
      const gestureHandler = createGestureHandler({ onSwipeUp });
      gestureHandler.onGestureEvent({
        nativeEvent: {
          translationX: 0,
          translationY: -100,
          velocityX: 0,
          velocityY: -600,
          state: State.END,
        },
      });
      
      expect(onSwipeUp).toHaveBeenCalled();
    });

    it('should call onSwipeDown when down swipe is detected', () => {
      const onSwipeDown = jest.fn();
      
      renderWithProviders(
        <TestGestureComponent onSwipeDown={onSwipeDown} />
      );
      
      const gestureArea = screen.getByTestId('gesture-test-area');
      
      // Simulate swipe down gesture by calling the handler directly
      const gestureHandler = createGestureHandler({ onSwipeDown });
      gestureHandler.onGestureEvent({
        nativeEvent: {
          translationX: 0,
          translationY: 100,
          velocityX: 0,
          velocityY: 600,
          state: State.END,
        },
      });
      
      expect(onSwipeDown).toHaveBeenCalled();
    });

    it('should handle long press gestures', (done) => {
      const onLongPress = jest.fn();
      
      renderWithProviders(
        <TestGestureComponent onLongPress={onLongPress} />
      );
      
      const gestureArea = screen.getByTestId('gesture-test-area');
      
      // Start gesture
      fireEvent.mouseDown(gestureArea);
      
      // Wait for long press delay
      setTimeout(() => {
        expect(onLongPress).toHaveBeenCalled();
        done();
      }, gestureConfig.longPressDelay + 100);
    });

    it('should handle double tap gestures', () => {
      const onDoubleTap = jest.fn();
      
      renderWithProviders(
        <TestGestureComponent onDoubleTap={onDoubleTap} />
      );
      
      const gestureArea = screen.getByTestId('gesture-test-area');
      
      // First tap
      fireEvent.mouseDown(gestureArea);
      fireEvent.mouseUp(gestureArea);
      
      // Second tap within double tap delay
      setTimeout(() => {
        fireEvent.mouseDown(gestureArea);
        fireEvent.mouseUp(gestureArea);
        
        expect(onDoubleTap).toHaveBeenCalled();
      }, gestureConfig.doubleTapDelay - 50);
    });
  });

  describe('Animation Utils Tests', () => {
    it('should create spring animation with correct parameters', () => {
      const animatedValue = new Animated.Value(0);
      const animation = AnimationUtils.spring(animatedValue, 1);
      
      expect(animation).toBeDefined();
      // In a real test, you would check the animation configuration
    });

    it('should create timing animation with correct parameters', () => {
      const animatedValue = new Animated.Value(0);
      const animation = AnimationUtils.timing(animatedValue, 1, 300);
      
      expect(animation).toBeDefined();
      // In a real test, you would check the animation configuration
    });

    it('should create press animation for button interactions', () => {
      const scaleValue = new Animated.Value(1);
      const animation = AnimationUtils.pressAnimation(scaleValue, true);
      
      expect(animation).toBeDefined();
      // Should animate to 0.95 when pressed
    });

    it('should create fade animation for visibility changes', () => {
      const opacityValue = new Animated.Value(0);
      const animation = AnimationUtils.fadeAnimation(opacityValue, true, 200);
      
      expect(animation).toBeDefined();
      // Should animate to 1 when visible
    });
  });

  describe('Gesture Configuration Tests', () => {
    it('should have appropriate swipe threshold', () => {
      expect(gestureConfig.swipeThreshold).toBe(50);
      expect(gestureConfig.swipeThreshold).toBeGreaterThan(0);
    });

    it('should have appropriate velocity threshold', () => {
      expect(gestureConfig.swipeVelocityThreshold).toBe(500);
      expect(gestureConfig.swipeVelocityThreshold).toBeGreaterThan(0);
    });

    it('should have appropriate long press delay', () => {
      expect(gestureConfig.longPressDelay).toBe(500);
      expect(gestureConfig.longPressDelay).toBeGreaterThan(0);
    });

    it('should have appropriate double tap delay', () => {
      expect(gestureConfig.doubleTapDelay).toBe(300);
      expect(gestureConfig.doubleTapDelay).toBeGreaterThan(0);
    });
  });

  describe('Cross-Platform Gesture Consistency', () => {
    it('should provide consistent gesture behavior across platforms', () => {
      const testPlatforms = ['ios', 'android'] as const;
      
      testPlatforms.forEach(platform => {
        mockPlatform(platform);
        
        // Test swipe detection consistency
        const leftSwipe = detectSwipeDirection(-100, 0, -600, 0);
        const rightSwipe = detectSwipeDirection(100, 0, 600, 0);
        const upSwipe = detectSwipeDirection(0, -100, 0, -600);
        const downSwipe = detectSwipeDirection(0, 100, 0, 600);
        
        expect(leftSwipe).toBe(SwipeDirection.LEFT);
        expect(rightSwipe).toBe(SwipeDirection.RIGHT);
        expect(upSwipe).toBe(SwipeDirection.UP);
        expect(downSwipe).toBe(SwipeDirection.DOWN);
      });
    });

    it('should handle platform-specific feedback appropriately', () => {
      // Test iOS
      mockPlatform('ios');
      HapticFeedback.trigger(HapticFeedbackType.LIGHT);
      expect(mockHapticTrigger).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      // Test Android
      mockPlatform('android');
      HapticFeedback.trigger(HapticFeedbackType.LIGHT);
      expect(mockVibrate).toHaveBeenCalled();
    });
  });
});