import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Keyboard } from 'react-native';
import { TextInput, Button, Text, Card, HelperText, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles, layout, typography, spacing, margins, paddings } from '../styles/theme';
import { ValidationService } from '../utils/validation';
import { Input } from '../components/common/Input';
import { Button as CustomButton } from '../components/common/Button';
import { ResponsiveContainer } from '../components/common/ResponsiveContainer';
import { ResponsiveText } from '../components/common/ResponsiveText';
import { useResponsive } from '../hooks/useResponsive';
import { useOrientation } from '../hooks/useOrientation';

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  // 快速登入用戶 (與PC版相同)
  const quickLoginUsers = [
    { username: '系統管理員', originalUsername: 'admin', password: 'admin123', role: 'ADMIN' },
    { username: 'Jeffrey', originalUsername: 'pm001', password: 'pm123', role: 'PM' },
    { username: 'Miya', originalUsername: 'am001', password: 'am123', role: 'AM' },
    { username: 'Mark', originalUsername: 'warehouse001', password: 'wh123', role: 'WAREHOUSE' },
  ];

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!ValidationService.validateRequired(username)) {
      newErrors.username = ValidationService.getErrorMessage('用戶名', 'required');
    } else if (!ValidationService.validateMinLength(username, 3)) {
      newErrors.username = ValidationService.getErrorMessage('用戶名', 'minLength', 3);
    }

    if (!ValidationService.validateRequired(password)) {
      newErrors.password = ValidationService.getErrorMessage('密碼', 'required');
    } else if (!ValidationService.validateMinLength(password, 6)) {
      newErrors.password = ValidationService.getErrorMessage('密碼', 'minLength', 6);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 清除特定欄位錯誤
  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 處理用戶名變更
  const handleUsernameChange = (text: string) => {
    setUsername(text);
    clearFieldError('username');
    clearFieldError('general');
  };

  // 處理密碼變更
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    clearFieldError('password');
    clearFieldError('general');
  };

  const handleLogin = async () => {
    // 隱藏鍵盤
    Keyboard.dismiss();

    // 驗證表單
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const success = await login(username, password);
      if (!success) {
        setErrors({ general: '用戶名或密碼錯誤，請重新輸入' });
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      setErrors({ general: '無法連接到伺服器，請檢查網路連線' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user: typeof quickLoginUsers[0]) => {
    Keyboard.dismiss();
    setIsLoading(true);
    setErrors({});

    try {
      const success = await login(user.originalUsername, user.password);
      if (!success) {
        setErrors({ general: '快速登入失敗，請稍後再試' });
      }
    } catch (error) {
      console.error('快速登入錯誤:', error);
      setErrors({ general: '無法連接到伺服器，請檢查網路連線' });
    } finally {
      setIsLoading(false);
    }
  };

  const { isTablet, isLandscape } = useResponsive();
  const orientation = useOrientation();

  return (
    <ResponsiveContainer safeArea={true}>
      <ScrollView 
        style={layout.container} 
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          isLandscape && styles.landscapeScrollContent,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[
          styles.container,
          isTablet && styles.tabletContainer,
        ]}>
          <Card style={[
            styles.loginCard,
            isTablet && styles.tabletCard,
          ]}>
            <Card.Content style={paddings.lg}>
              <ResponsiveText variant="h2" style={styles.title}>
                雲水基材管理系統
              </ResponsiveText>
              <ResponsiveText variant="body1" style={styles.subtitle}>
                手機版
              </ResponsiveText>

            {/* 通用錯誤訊息 */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <ResponsiveText variant="body2" style={styles.errorText}>
                  {errors.general}
                </ResponsiveText>
              </View>
            )}

            {/* 用戶名輸入 */}
            <View style={styles.inputContainer}>
              <Input
                label="用戶名"
                value={username}
                onChangeText={handleUsernameChange}
                error={errors.username}
                disabled={isLoading}
                keyboardType="default"
              />
              {errors.username && (
                <HelperText type="error" visible={!!errors.username}>
                  {errors.username}
                </HelperText>
              )}
            </View>

            {/* 密碼輸入 */}
            <View style={styles.inputContainer}>
              <TextInput
                label="密碼"
                value={password}
                onChangeText={handlePasswordChange}
                mode="outlined"
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                error={!!errors.password}
                disabled={isLoading}
                style={styles.input}
              />
              {errors.password && (
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password}
                </HelperText>
              )}
            </View>

            {/* 登入按鈕 */}
            <CustomButton
              title={isLoading ? "登入中..." : "登入"}
              onPress={handleLogin}
              disabled={isLoading || !username || !password}
              loading={isLoading}
              style={styles.loginButton}
            />

            {/* 載入指示器 */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007bff" />
                <ResponsiveText variant="body2" style={styles.loadingText}>
                  正在驗證身份...
                </ResponsiveText>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* 快速登入區域 */}
        <Card style={[
          styles.quickLoginCard,
          isTablet && styles.tabletCard,
        ]}>
          <Card.Content style={paddings.md}>
            <ResponsiveText variant="h4" style={styles.quickLoginTitle}>
              快速登入
            </ResponsiveText>
            <ResponsiveText variant="body2" style={styles.quickLoginSubtitle}>
              點擊下方按鈕快速登入測試帳號
            </ResponsiveText>
            {quickLoginUsers.map((user, index) => (
              <CustomButton
                key={index}
                title={`${user.username} (${user.role})`}
                mode="outlined"
                onPress={() => handleQuickLogin(user)}
                disabled={isLoading}
                style={styles.quickLoginButton}
              />
            ))}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    ...paddings.lg,
    paddingBottom: spacing.xxl,
  },
  tabletScrollContent: {
    ...paddings.xl,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  landscapeScrollContent: {
    paddingVertical: spacing.md,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  tabletContainer: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  loginCard: {
    ...margins.vertical.md,
    ...layout.card,
    elevation: 4,
  },
  tabletCard: {
    elevation: 6,
    borderRadius: spacing.md,
  },
  title: {
    textAlign: 'center',
    ...margins.vertical.sm,
    color: '#007bff',
  },
  subtitle: {
    textAlign: 'center',
    ...margins.vertical.lg,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: spacing.sm,
    ...paddings.sm,
    ...margins.vertical.md,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  inputContainer: {
    ...margins.vertical.sm,
  },
  input: {
    ...margins.vertical.xs,
  },
  loginButton: {
    ...margins.vertical.lg,
    ...layout.button,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...margins.vertical.md,
    ...paddings.sm,
    backgroundColor: '#f5f5f5',
    borderRadius: spacing.sm,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: '#666',
  },
  quickLoginCard: {
    ...margins.vertical.sm,
    ...layout.card,
    elevation: 2,
  },
  quickLoginTitle: {
    textAlign: 'center',
    ...margins.vertical.sm,
    color: '#333',
  },
  quickLoginSubtitle: {
    textAlign: 'center',
    ...margins.vertical.md,
    color: '#666',
  },
  quickLoginButton: {
    ...margins.vertical.xs,
  },
});