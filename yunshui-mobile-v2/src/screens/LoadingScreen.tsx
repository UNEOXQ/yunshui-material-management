import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { commonStyles } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const { checkAutoLogin } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [loadingMessage, setLoadingMessage] = useState(message || '初始化應用程式...');

  useEffect(() => {
    // 啟動動畫
    startAnimations();
    
    // 執行自動登入檢查
    performAutoLogin();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const performAutoLogin = async () => {
    try {
      setLoadingMessage('檢查登入狀態...');
      
      // 模擬最小載入時間，提供更好的用戶體驗
      const [autoLoginResult] = await Promise.all([
        checkAutoLogin(),
        new Promise(resolve => setTimeout(resolve, 1500)) // 最少顯示 1.5 秒
      ]);

      if (autoLoginResult) {
        setLoadingMessage('登入成功，正在載入...');
      } else {
        setLoadingMessage('準備登入畫面...');
      }
      
      // 額外延遲以顯示狀態訊息
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('自動登入檢查失敗:', error);
      setLoadingMessage('載入完成');
    }
  };

  return (
    <View style={[commonStyles.container, styles.container]}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* 應用程式 Logo */}
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>雲水</Text>
          <Text style={styles.logoSubtext}>基材管理系統</Text>
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.loadingContainer,
          { opacity: fadeAnim }
        ]}
      >
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </Animated.View>

      {/* 版本資訊 */}
      <Animated.View 
        style={[
          styles.versionContainer,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.versionText}>版本 1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  logoSubtext: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});