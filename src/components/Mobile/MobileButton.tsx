import React, { useState, useRef, useCallback } from 'react';
import TouchFeedback from './TouchFeedback';

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  onClick,
  onLongPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  hapticFeedback = 'light',
  className = '',
  type = 'button',
  ariaLabel
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleTouchStart = useCallback(() => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  }, [disabled, loading]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  }, [disabled, loading, onClick]);

  const handleLongPress = useCallback(() => {
    if (!disabled && !loading && onLongPress) {
      onLongPress();
    }
  }, [disabled, loading, onLongPress]);

  const getVariantClasses = () => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      success: 'btn-success',
      danger: 'btn-danger',
      warning: 'btn-warning',
      info: 'btn-info',
      light: 'btn-light',
      dark: 'btn-dark'
    };
    return variants[variant];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg'
    };
    return sizes[size];
  };

  return (
    <TouchFeedback
      onTap={handleClick}
      onLongPress={handleLongPress}
      hapticFeedback={hapticFeedback}
      disabled={disabled || loading}
      className="mobile-button-wrapper"
    >
      <button
        ref={buttonRef}
        type={type}
        className={`
          mobile-btn
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${fullWidth ? 'btn-full-width' : ''}
          ${disabled ? 'btn-disabled' : ''}
          ${loading ? 'btn-loading' : ''}
          ${isPressed ? 'btn-pressed' : ''}
          ${className}
        `.trim()}
        disabled={disabled || loading}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label={ariaLabel}
        aria-disabled={disabled || loading}
      >
        {loading && (
          <span className="btn-spinner">
            <div className="spinner" />
          </span>
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="btn-icon btn-icon-left">
            {icon}
          </span>
        )}
        
        <span className={`btn-content ${loading ? 'btn-content-loading' : ''}`}>
          {children}
        </span>
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="btn-icon btn-icon-right">
            {icon}
          </span>
        )}
      </button>

      <style>{`
        .mobile-button-wrapper {
          display: inline-block;
          width: ${fullWidth ? '100%' : 'auto'};
        }

        .mobile-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 500;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          width: ${fullWidth ? '100%' : 'auto'};
          min-width: 48px;
          min-height: 48px;
        }

        /* Size variants */
        .btn-sm {
          padding: 8px 16px;
          font-size: 14px;
          min-height: 40px;
          border-radius: 6px;
        }

        .btn-md {
          padding: 12px 20px;
          font-size: 16px;
          min-height: 48px;
        }

        .btn-lg {
          padding: 16px 24px;
          font-size: 18px;
          min-height: 56px;
          border-radius: 10px;
        }

        /* Color variants */
        .btn-primary {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: linear-gradient(135deg, #6c757d 0%, #545b62 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
        }

        .btn-success {
          background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        }

        .btn-danger {
          background: linear-gradient(135deg, #dc3545 0%, #bd2130 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
        }

        .btn-warning {
          background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
          color: #212529;
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
        }

        .btn-info {
          background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
        }

        .btn-light {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          color: #212529;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #dee2e6;
        }

        .btn-dark {
          background: linear-gradient(135deg, #343a40 0%, #23272b 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(52, 58, 64, 0.3);
        }

        /* States */
        .btn-pressed {
          transform: scale(0.98) translateY(1px);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }

        .btn-disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .btn-loading {
          cursor: wait;
          pointer-events: none;
        }

        /* Content and icons */
        .btn-content {
          transition: opacity 0.2s ease;
        }

        .btn-content-loading {
          opacity: 0;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2em;
        }

        .btn-icon-left {
          margin-right: 4px;
        }

        .btn-icon-right {
          margin-left: 4px;
        }

        /* Loading spinner */
        .btn-spinner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Ripple effect */
        .mobile-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.3s ease, height 0.3s ease;
          pointer-events: none;
        }

        .mobile-btn:active:not(:disabled)::before {
          width: 200px;
          height: 200px;
        }

        /* Focus styles */
        .mobile-btn:focus-visible {
          outline: 3px solid rgba(0, 123, 255, 0.5);
          outline-offset: 2px;
        }

        /* Full width */
        .btn-full-width {
          width: 100%;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .btn-light {
            background: linear-gradient(135deg, #495057 0%, #343a40 100%);
            color: #f8f9fa;
            border-color: #6c757d;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .mobile-btn {
            border: 2px solid currentColor;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .mobile-btn {
            transition: none;
          }
          
          .mobile-btn::before {
            transition: none;
          }
          
          .spinner {
            animation: none;
          }
        }
      `}</style>
    </TouchFeedback>
  );
};

export default MobileButton;