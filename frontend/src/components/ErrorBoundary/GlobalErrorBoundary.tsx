import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 生成唯一的錯誤 ID
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 記錄錯誤到控制台
    console.error('Global Error Boundary caught an error:', error, errorInfo);

    // 調用自定義錯誤處理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 發送錯誤報告到後端
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.getUserId(),
        sessionId: this.getSessionId()
      };

      // 使用 fetch 發送錯誤報告
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(errorReport)
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      
      // 如果無法發送到後端，嘗試使用 sendBeacon
      if ('navigator' in window && 'sendBeacon' in navigator) {
        try {
          const errorData = {
            errorId: this.state.errorId,
            message: error.message,
            timestamp: new Date().toISOString(),
            url: window.location.href
          };
          
          navigator.sendBeacon('/api/errors/beacon', JSON.stringify(errorData));
        } catch (beaconError) {
          console.error('Failed to send error via beacon:', beaconError);
        }
      }
    }
  };

  private getUserId = (): string | null => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || null;
      }
    } catch (e) {
      console.warn('Failed to get user ID:', e);
    }
    return null;
  };

  private getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // 使用自定義 fallback 如果提供
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 預設錯誤 UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  onRetry: () => void;
  onReload: () => void;
  onGoHome: () => void;
  showDetails?: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  onRetry,
  onReload,
  onGoHome,
  showDetails = false
}) => {
  const isNetworkError = error?.message.includes('fetch') || error?.message.includes('network');
  const isChunkError = error?.message.includes('Loading chunk') || error?.message.includes('ChunkLoadError');

  const getErrorTitle = () => {
    if (isNetworkError) {
      return '網路連線問題';
    }
    if (isChunkError) {
      return '應用程式更新';
    }
    return '應用程式發生錯誤';
  };

  const getErrorMessage = () => {
    if (isNetworkError) {
      return '無法連接到伺服器，請檢查您的網路連線。';
    }
    if (isChunkError) {
      return '應用程式已更新，請重新載入頁面以獲得最新版本。';
    }
    return '很抱歉，應用程式遇到了意外錯誤。我們已經記錄了這個問題，請稍後再試。';
  };

  const getErrorIcon = () => {
    if (isNetworkError) {
      return '🌐';
    }
    if (isChunkError) {
      return '🔄';
    }
    return '⚠️';
  };

  const getPrimaryAction = () => {
    if (isChunkError) {
      return { label: '重新載入', action: onReload };
    }
    if (isNetworkError) {
      return { label: '重試', action: onRetry };
    }
    return { label: '重試', action: onRetry };
  };

  const primaryAction = getPrimaryAction();

  return (
    <div className="error-boundary-container">
      <div className="error-content">
        <div className="error-icon">
          {getErrorIcon()}
        </div>
        
        <h1 className="error-title">
          {getErrorTitle()}
        </h1>
        
        <p className="error-message">
          {getErrorMessage()}
        </p>

        <div className="error-id">
          錯誤 ID: <code>{errorId}</code>
        </div>

        <div className="error-actions">
          <button 
            className="btn btn-primary"
            onClick={primaryAction.action}
          >
            {primaryAction.label}
          </button>
          
          {!isChunkError && (
            <button 
              className="btn btn-secondary"
              onClick={onReload}
            >
              重新載入頁面
            </button>
          )}
          
          <button 
            className="btn btn-outline"
            onClick={onGoHome}
          >
            返回首頁
          </button>
        </div>

        {showDetails && error && (
          <details className="error-details">
            <summary>技術詳情</summary>
            <div className="error-stack">
              <h4>錯誤訊息:</h4>
              <pre>{error.message}</pre>
              
              {error.stack && (
                <>
                  <h4>堆疊追蹤:</h4>
                  <pre>{error.stack}</pre>
                </>
              )}
              
              {errorInfo?.componentStack && (
                <>
                  <h4>組件堆疊:</h4>
                  <pre>{errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          </details>
        )}

        <div className="error-help">
          <p>如果問題持續發生，請聯繫技術支援並提供錯誤 ID。</p>
        </div>
      </div>

      <style>{`
        .error-boundary-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .error-content {
          max-width: 500px;
          width: 100%;
          text-align: center;
          background: white;
          border-radius: 16px;
          padding: 40px 32px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .error-icon {
          font-size: 64px;
          margin-bottom: 24px;
          opacity: 0.8;
        }

        .error-title {
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .error-message {
          font-size: 16px;
          color: #4a5568;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .error-id {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 32px;
          font-size: 14px;
          color: #718096;
        }

        .error-id code {
          background: #edf2f7;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          color: #2d3748;
        }

        .error-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .btn {
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-secondary {
          background: #718096;
          color: white;
        }

        .btn-outline {
          background: transparent;
          color: #4a5568;
          border: 2px solid #e2e8f0;
        }

        .btn-outline:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .error-details {
          text-align: left;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .error-details summary {
          padding: 16px;
          background: #f7fafc;
          cursor: pointer;
          font-weight: 600;
          color: #4a5568;
          border-bottom: 1px solid #e2e8f0;
        }

        .error-details summary:hover {
          background: #edf2f7;
        }

        .error-stack {
          padding: 16px;
          max-height: 300px;
          overflow-y: auto;
        }

        .error-stack h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .error-stack pre {
          background: #1a202c;
          color: #e2e8f0;
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.4;
          overflow-x: auto;
          margin: 0 0 16px 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .error-help {
          padding: 16px;
          background: #ebf8ff;
          border: 1px solid #bee3f8;
          border-radius: 8px;
          font-size: 14px;
          color: #2c5282;
        }

        .error-help p {
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 480px) {
          .error-boundary-container {
            padding: 16px;
          }

          .error-content {
            padding: 32px 24px;
          }

          .error-title {
            font-size: 24px;
          }

          .error-message {
            font-size: 14px;
          }

          .btn {
            font-size: 14px;
            padding: 12px 20px;
          }
        }

        @media (prefers-color-scheme: dark) {
          .error-boundary-container {
            background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          }

          .error-content {
            background: #2d3748;
            color: #e2e8f0;
            border-color: #4a5568;
          }

          .error-title {
            color: #f7fafc;
          }

          .error-message {
            color: #cbd5e0;
          }

          .error-id {
            background: #4a5568;
            border-color: #718096;
            color: #e2e8f0;
          }

          .error-id code {
            background: #718096;
            color: #f7fafc;
          }

          .error-details summary {
            background: #4a5568;
            color: #e2e8f0;
            border-color: #718096;
          }

          .error-help {
            background: #2c5282;
            border-color: #3182ce;
            color: #bee3f8;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalErrorBoundary;