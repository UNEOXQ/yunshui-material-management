import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

class MobileErrorBoundaryClass extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error('Mobile Error Boundary caught an error:', error, errorInfo);

    // Send error to monitoring service (if available)
    if ('navigator' in window && 'sendBeacon' in navigator) {
      const errorData = {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

      try {
        navigator.sendBeacon('/api/errors', JSON.stringify(errorData));
      } catch (e) {
        console.warn('Failed to send error report:', e);
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = () => {
    const maxRetries = 3;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));

      // Provide haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  handleReload = () => {
    // Provide haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
    
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default mobile-optimized error UI
      return (
        <MobileErrorFallback
          error={this.state.error}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

interface MobileErrorFallbackProps {
  error?: Error;
  retryCount: number;
  onRetry: () => void;
  onReload: () => void;
}

const MobileErrorFallback: React.FC<MobileErrorFallbackProps> = ({
  error,
  retryCount,
  onRetry,
  onReload
}) => {
  const deviceInfo = useDeviceDetection();
  const maxRetries = 3;
  const canRetry = retryCount < maxRetries;

  const getErrorMessage = () => {
    if (!deviceInfo.isOnline) {
      return '網路連線中斷，請檢查您的網路連線';
    }
    
    if (deviceInfo.connectionType === 'slow-2g' || deviceInfo.connectionType === '2g') {
      return '網路連線緩慢，載入時發生錯誤';
    }

    return '應用程式發生錯誤，請稍後再試';
  };

  const getErrorIcon = () => {
    if (!deviceInfo.isOnline) {
      return '📡';
    }
    
    if (deviceInfo.connectionType === 'slow-2g' || deviceInfo.connectionType === '2g') {
      return '🐌';
    }

    return '⚠️';
  };

  return (
    <div className="mobile-error-boundary">
      <div className="error-content">
        <div className="error-icon">
          {getErrorIcon()}
        </div>
        
        <h2 className="error-title">
          糟糕！出了點問題
        </h2>
        
        <p className="error-message">
          {getErrorMessage()}
        </p>

        {error && process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>技術詳情</summary>
            <pre className="error-stack">
              {error.message}
              {error.stack && (
                <>
                  <br />
                  <br />
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}

        <div className="error-actions">
          {canRetry && (
            <button 
              className="btn btn-primary error-btn"
              onClick={onRetry}
              disabled={!deviceInfo.isOnline}
            >
              重試 {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </button>
          )}
          
          <button 
            className="btn btn-secondary error-btn"
            onClick={onReload}
          >
            重新載入頁面
          </button>
        </div>

        {!deviceInfo.isOnline && (
          <div className="offline-notice">
            <p>請檢查您的網路連線後重試</p>
          </div>
        )}

        {deviceInfo.connectionType === 'slow-2g' || deviceInfo.connectionType === '2g' ? (
          <div className="slow-connection-notice">
            <p>偵測到網路連線緩慢，建議切換到更穩定的網路環境</p>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .mobile-error-boundary {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background: #f8f9fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .error-content {
          max-width: 400px;
          width: 100%;
          text-align: center;
          background: white;
          border-radius: 12px;
          padding: 32px 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .error-title {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .error-message {
          font-size: 16px;
          color: #666;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .error-details {
          text-align: left;
          margin-bottom: 24px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          background: #f8f9fa;
        }

        .error-details summary {
          cursor: pointer;
          font-weight: 500;
          color: #495057;
          margin-bottom: 8px;
        }

        .error-stack {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          color: #dc3545;
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
          max-height: 200px;
          overflow-y: auto;
        }

        .error-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .error-btn {
          width: 100%;
          min-height: 48px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
        }

        .error-btn:active {
          transform: scale(0.98);
        }

        .error-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .offline-notice,
        .slow-connection-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 12px;
          margin-top: 16px;
        }

        .offline-notice p,
        .slow-connection-notice p {
          margin: 0;
          font-size: 14px;
          color: #856404;
        }

        .slow-connection-notice {
          background: #d1ecf1;
          border-color: #bee5eb;
        }

        .slow-connection-notice p {
          color: #0c5460;
        }

        @media (max-width: 480px) {
          .mobile-error-boundary {
            padding: 16px;
          }

          .error-content {
            padding: 24px 20px;
          }

          .error-title {
            font-size: 20px;
          }

          .error-message {
            font-size: 14px;
          }

          .error-btn {
            min-height: 44px;
            font-size: 14px;
          }
        }

        @media (prefers-color-scheme: dark) {
          .mobile-error-boundary {
            background: #1a1a1a;
          }

          .error-content {
            background: #2d2d2d;
            color: #ffffff;
          }

          .error-title {
            color: #ffffff;
          }

          .error-message {
            color: #adb5bd;
          }

          .error-details {
            background: #3d3d3d;
            border-color: #555555;
          }

          .error-details summary {
            color: #e9ecef;
          }
        }
      `}</style>
    </div>
  );
};

// Wrapper component to use hooks
const MobileErrorBoundary: React.FC<Props> = (props) => {
  return <MobileErrorBoundaryClass {...props} />;
};

export default MobileErrorBoundary;