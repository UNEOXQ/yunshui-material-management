import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, StatusBar } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function SplashScreen() {
  const { checkAutoLogin, isLoading } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [loadingMessage, setLoadingMessage] = useState('啟動應用程式...');
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // 啟動進入動畫
    startEnterAnimation();
    
    try {
      // 設置狀態訊息
      setLoadingMessage('檢查系統狀態...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setLoadingMessage('驗證登入狀態...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 執行自動登入檢查
      const isLoggedIn = await checkAutoLogin();
      
      if (isLoggedIn) {
        setLoadingMessage('歡迎回來！');
      } else {
        setLoadingMessage('準備登入...');
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 啟動退出動畫
      startExitAnimation();
      
    } catch (error) {
      console.error('應用程式初始化失敗:', error);
      setLoadingMessage('初始化完成');
      await new Promise(resolve => setTimeout(resolve, 500));
      startExitAnimation();
    }
  };

  const startEnterAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimationComplete(true);
    });
  };

  const startExitAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <>
      <StatusBar backgroundColor="#007bff" barStyle="light-content" />
      <View style={styles.container}>
        {/* 背景漸層效果 */}
        <View style={styles.backgroundGradient} />
        
        {/* 主要內容 */}
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* 應用程式 Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>雲水</Text>
            </View>
            <Text style={styles.appTitle}>基材管理系統</Text>
            <Text style={styles.appSubtitle}>Material Management System</Text>
          </View>

          {/* 載入指示器 */}
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="large" 
              color="#ffffff" 
              style={styles.loadingIndicator}
            />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </Animated.View>

        {/* 底部資訊 */}
        <Animated.View 
          style={[
            styles.footerContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.versionText}>版本 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 雲水科技</Text>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#007bff',
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingIndicator: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});