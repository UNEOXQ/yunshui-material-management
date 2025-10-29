import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { ResponsiveText } from './ResponsiveText';
import { spacing, responsive } from '../../utils/responsive';
import { layout } from '../../styles/theme';

export enum ErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

interface ErrorDisplayProps {
  error?: Error | string | null;
  type?: ErrorType;
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  type = ErrorType.UNKNOWN,
  title,
  message,
  showRetry = true,
  onRetry,
  style,
  compact = false,
}) => {
  const getErrorInfo = () => {
    if (title && message) {
      return { title, message };
    }

    if (typeof error === 'string') {
      return {
        title: '發生錯誤',
        message: error,
      };
    }

    if (error instanceof Error) {
      return {
        title: '發生錯誤',
        message: error.message,
      };
    }

    switch (type) {
      case ErrorType.NETWORK:
        return {
          title: '網路連線錯誤',
          message: '無法連接到伺服器，請檢查您的網路連線並重試。',
          icon: '📡',
        };
      case ErrorType.SERVER:
        return {
          title: '伺服器錯誤',
          message: '伺服器暫時無法處理您的請求，請稍後再試。',
          icon: '🔧',
        };
      case ErrorType.VALIDATION:
        return {
          title: '資料驗證錯誤',
          message: '請檢查您輸入的資料是否正確。',
          icon: '⚠️',
        };
      case ErrorType.AUTHENTICATION:
        return {
          title: '身份驗證失敗',
          message: '您的登入已過期，請重新登入。',
          icon: '🔐',
        };
      case ErrorType.PERMISSION:
        return {
          title: '權限不足',
          message: '您沒有執行此操作的權限。',
          icon: '🚫',
        };
      case ErrorType.NOT_FOUND:
        return {
          title: '找不到資源',
          message: '請求的資源不存在或已被刪除。',
          icon: '🔍',
        };
      default:
        return {
          title: '未知錯誤',
          message: '發生了未預期的錯誤，請稍後再試。',
          icon: '❌',
        };
    }
  };

  const errorInfo = getErrorInfo();

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <ResponsiveText variant="body2" style={styles.compactText}>
          {errorInfo.icon} {errorInfo.message}
        </ResponsiveText>
        {showRetry && onRetry && (
          <Button
            mode="text"
            onPress={onRetry}
            style={styles.compactRetryButton}
            labelStyle={styles.compactRetryLabel}
          >
            重試
          </Button>
        )}
      </View>
    );
  }

  return (
    <Card style={[styles.container, style]}>
      <Card.Content style={styles.content}>
        {errorInfo.icon && (
          <ResponsiveText variant="h2" style={styles.icon}>
            {errorInfo.icon}
          </ResponsiveText>
        )}
        
        <ResponsiveText variant="h4" style={styles.title}>
          {errorInfo.title}
        </ResponsiveText>
        
        <ResponsiveText variant="body1" style={styles.message}>
          {errorInfo.message}
        </ResponsiveText>

        {showRetry && onRetry && (
          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.retryButton}
          >
            重試
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

// 網路錯誤組件
export const NetworkError: React.FC<{
  onRetry?: () => void;
  style?: ViewStyle;
}> = ({ onRetry, style }) => (
  <ErrorDisplay
    type={ErrorType.NETWORK}
    onRetry={onRetry}
    style={style}
  />
);

// 伺服器錯誤組件
export const ServerError: React.FC<{
  onRetry?: () => void;
  style?: ViewStyle;
}> = ({ onRetry, style }) => (
  <ErrorDisplay
    type={ErrorType.SERVER}
    onRetry={onRetry}
    style={style}
  />
);

// 空狀態組件
export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
}> = ({
  title = '暫無資料',
  message = '目前沒有可顯示的內容',
  icon = '📭',
  actionText,
  onAction,
  style,
}) => (
  <Card style={[styles.container, style]}>
    <Card.Content style={styles.content}>
      <ResponsiveText variant="h2" style={styles.icon}>
        {icon}
      </ResponsiveText>
      
      <ResponsiveText variant="h4" style={styles.title}>
        {title}
      </ResponsiveText>
      
      <ResponsiveText variant="body1" style={styles.message}>
        {message}
      </ResponsiveText>

      {actionText && onAction && (
        <Button
          mode="outlined"
          onPress={onAction}
          style={styles.retryButton}
        >
          {actionText}
        </Button>
      )}
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    ...layout.card,
    margin: spacing.md,
  },
  content: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: '#d32f2f',
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: '#666',
    lineHeight: responsive.fontSize(22),
  },
  retryButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    backgroundColor: '#ffebee',
    borderRadius: responsive.scale(8),
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  compactText: {
    flex: 1,
    color: '#d32f2f',
    marginRight: spacing.sm,
  },
  compactRetryButton: {
    marginLeft: spacing.sm,
  },
  compactRetryLabel: {
    fontSize: responsive.fontSize(12),
  },
});