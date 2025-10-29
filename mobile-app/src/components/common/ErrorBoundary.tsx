import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { ResponsiveText } from './ResponsiveText';
import { ResponsiveContainer } from './ResponsiveContainer';
import { spacing, responsive } from '../../utils/responsive';
import { typography, layout } from '../../styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 調用外部錯誤處理器
    this.props.onError?.(error, errorInfo);

    // 記錄錯誤到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ResponsiveContainer>
          <ScrollView contentContainerStyle={styles.container}>
            <Card style={styles.errorCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <ResponsiveText variant="h1" style={styles.errorIcon}>
                    ⚠️
                  </ResponsiveText>
                </View>

                <ResponsiveText variant="h3" style={styles.title}>
                  應用程式發生錯誤
                </ResponsiveText>

                <ResponsiveText variant="body1" style={styles.description}>
                  很抱歉，應用程式遇到了意外錯誤。請嘗試重新載入，如果問題持續發生，請聯繫技術支援。
                </ResponsiveText>

                {__DEV__ && this.state.error && (
                  <View style={styles.debugContainer}>
                    <ResponsiveText variant="h4" style={styles.debugTitle}>
                      錯誤詳情 (開發模式)
                    </ResponsiveText>
                    <ScrollView style={styles.debugScroll}>
                      <Text style={styles.debugText}>
                        {this.state.error.toString()}
                      </Text>
                      {this.state.errorInfo && (
                        <Text style={styles.debugText}>
                          {this.state.errorInfo.componentStack}
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={this.handleRetry}
                    style={styles.retryButton}
                  >
                    重新載入
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>
        </ResponsiveContainer>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorCard: {
    ...layout.card,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  errorIcon: {
    fontSize: responsive.fontSize(48),
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
    color: '#d32f2f',
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: '#666',
    lineHeight: responsive.fontSize(22),
  },
  debugContainer: {
    width: '100%',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#f5f5f5',
    borderRadius: responsive.scale(8),
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  debugTitle: {
    marginBottom: spacing.sm,
    color: '#ff9800',
  },
  debugScroll: {
    maxHeight: responsive.scale(200),
  },
  debugText: {
    ...typography.caption,
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: responsive.fontSize(16),
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.lg,
  },
  retryButton: {
    paddingVertical: spacing.xs,
  },
});