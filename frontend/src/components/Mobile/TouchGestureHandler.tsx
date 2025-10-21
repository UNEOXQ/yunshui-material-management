import React, { useRef, useCallback, useEffect } from 'react';

interface TouchGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  pinchThreshold?: number;
  rotateThreshold?: number;
  className?: string;
  disabled?: boolean;
  preventScroll?: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  isLongPress: boolean;
  initialDistance?: number;
  initialAngle?: number;
  lastScale?: number;
  lastRotation?: number;
}

const TouchGestureHandler: React.FC<TouchGestureHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  onPinch,
  onRotate,
  swipeThreshold = 50,
  longPressDelay = 500,
  pinchThreshold = 0.1,
  rotateThreshold = 15,
  className = '',
  disabled = false,
  preventScroll = false
}) => {
  const touchDataRef = useRef<TouchData | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper functions for multi-touch gestures
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getAngle = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    const now = Date.now();

    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      isLongPress: false
    };

    // Handle multi-touch for pinch and rotate
    if (e.touches.length === 2 && (onPinch || onRotate)) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      touchDataRef.current.initialDistance = getDistance(touch1, touch2);
      touchDataRef.current.initialAngle = getAngle(touch1, touch2);
      touchDataRef.current.lastScale = 1;
      touchDataRef.current.lastRotation = 0;
    }

    // Start long press timer for single touch
    if (e.touches.length === 1 && onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        if (touchDataRef.current && e.touches.length === 1) {
          touchDataRef.current.isLongPress = true;
          onLongPress();
          
          // Provide haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }
      }, longPressDelay);
    }

    // Prevent scroll if requested
    if (preventScroll) {
      e.preventDefault();
    }
  }, [disabled, onLongPress, onPinch, onRotate, longPressDelay, preventScroll, getDistance, getAngle]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !touchDataRef.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchDataRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchDataRef.current.startY);

    // Handle multi-touch gestures
    if (e.touches.length === 2 && touchDataRef.current.initialDistance && touchDataRef.current.initialAngle !== undefined) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const currentDistance = getDistance(touch1, touch2);
      const currentAngle = getAngle(touch1, touch2);
      
      // Handle pinch gesture
      if (onPinch && touchDataRef.current.initialDistance) {
        const scale = currentDistance / touchDataRef.current.initialDistance;
        const scaleChange = Math.abs(scale - (touchDataRef.current.lastScale || 1));
        
        if (scaleChange > pinchThreshold) {
          onPinch(scale);
          touchDataRef.current.lastScale = scale;
        }
      }
      
      // Handle rotate gesture
      if (onRotate && touchDataRef.current.initialAngle !== undefined) {
        let rotation = currentAngle - touchDataRef.current.initialAngle;
        
        // Normalize rotation to -180 to 180
        while (rotation > 180) rotation -= 360;
        while (rotation < -180) rotation += 360;
        
        const rotationChange = Math.abs(rotation - (touchDataRef.current.lastRotation || 0));
        
        if (rotationChange > rotateThreshold) {
          onRotate(rotation);
          touchDataRef.current.lastRotation = rotation;
        }
      }
      
      // Prevent default for multi-touch
      e.preventDefault();
      return;
    }

    // Cancel long press if finger moves too much (single touch only)
    if (e.touches.length === 1 && (deltaX > 10 || deltaY > 10) && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Prevent scroll if requested and we're handling gestures
    if (preventScroll && (deltaX > 5 || deltaY > 5)) {
      e.preventDefault();
    }
  }, [disabled, onPinch, onRotate, pinchThreshold, rotateThreshold, preventScroll, getDistance, getAngle]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (disabled || !touchDataRef.current) return;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Don't process other gestures if it was a long press or multi-touch
    if (touchDataRef.current.isLongPress || e.touches.length > 0) {
      // Reset touch data if all touches are gone
      if (e.touches.length === 0) {
        touchDataRef.current = null;
      }
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchDataRef.current.startX;
    const deltaY = touch.clientY - touchDataRef.current.startY;
    const deltaTime = Date.now() - touchDataRef.current.startTime;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check for swipe gestures
    if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
          // Provide haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(25);
          }
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
          // Provide haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(25);
          }
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
          // Provide haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(25);
          }
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
          // Provide haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(25);
          }
        }
      }
    } else if (deltaTime < 300 && absDeltaX < 10 && absDeltaY < 10) {
      // Tap gesture
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;

      if (timeSinceLastTap < 300 && onDoubleTap) {
        // Double tap
        onDoubleTap();
        lastTapTimeRef.current = 0; // Reset to prevent triple tap
        // Provide haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate([25, 50, 25]);
        }
      } else {
        // Single tap
        if (onTap) {
          onTap();
        }
        lastTapTimeRef.current = now;
      }
    }

    touchDataRef.current = null;
  }, [disabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, swipeThreshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add touch event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);

      // Clear any pending timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div 
      ref={containerRef}
      className={`touch-gesture-handler ${className}`}
      style={{ 
        touchAction: 'manipulation', // Optimize for touch
        userSelect: 'none' // Prevent text selection during gestures
      }}
    >
      {children}
    </div>
  );
};

export default TouchGestureHandler;