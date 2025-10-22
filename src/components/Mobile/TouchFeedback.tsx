import React, { useCallback, useRef } from 'react';

interface TouchFeedbackProps {
  children: React.ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  rippleEffect?: boolean;
  className?: string;
  disabled?: boolean;
}

const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  onTap,
  onLongPress,
  hapticFeedback = 'light',
  rippleEffect = true,
  className = '',
  disabled = false
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if ('vibrate' in navigator && !disabled) {
      const patterns = {
        light: 25,
        medium: 50,
        heavy: 100
      };
      navigator.vibrate(patterns[type]);
    }
  }, [disabled]);

  const createRippleEffect = useCallback((event: React.TouchEvent) => {
    if (!rippleEffect || disabled || !elementRef.current) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const touch = event.touches[0];
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: translate(-50%, -50%);
      animation: rippleAnimation 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `;

    element.appendChild(ripple);

    // Add ripple animation keyframes if not already added
    if (!document.querySelector('#ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'ripple-styles';
      style.textContent = `
        @keyframes rippleAnimation {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }, [rippleEffect, disabled]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;

    touchStartTimeRef.current = Date.now();
    createRippleEffect(event);

    // Add visual feedback class
    if (elementRef.current) {
      elementRef.current.classList.add(`haptic-${hapticFeedback}`);
    }

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        triggerHapticFeedback('heavy');
        onLongPress();
      }, 500);
    }
  }, [disabled, createRippleEffect, hapticFeedback, onLongPress, triggerHapticFeedback]);

  const handleTouchEnd = useCallback((_event: React.TouchEvent) => {
    if (disabled) return;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Remove visual feedback class
    if (elementRef.current) {
      elementRef.current.classList.remove(`haptic-${hapticFeedback}`);
    }

    // Check if it's a tap (short touch)
    const touchDuration = Date.now() - touchStartTimeRef.current;
    if (touchDuration < 500 && onTap) {
      if (hapticFeedback !== 'none') {
        triggerHapticFeedback(hapticFeedback);
      }
      onTap();
    }
  }, [disabled, hapticFeedback, onTap, triggerHapticFeedback]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (elementRef.current) {
      elementRef.current.classList.remove(`haptic-${hapticFeedback}`);
    }
  }, [hapticFeedback]);

  return (
    <div
      ref={elementRef}
      className={`touch-feedback ${className} ${disabled ? 'disabled' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {children}
    </div>
  );
};

export default TouchFeedback;