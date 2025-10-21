import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles } from '../styles/theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // 快速登入用戶 (與PC版相同)
  const quickLoginUsers = [
    { username: '系統管理員', originalUsername: 'admin', password: 'admin123', role: 'ADMIN' },
    { username: 'Jeffrey', originalUsername: 'pm001', password: 'pm123', role: 'PM' },
    { username: 'Miya', originalUsername: 'am001', password: 'am123', role: 'AM' },
    { username: 'Mark', originalUsername: 'warehouse001', password: 'wh123', role: 'WAREHOUSE' },
  ];

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('錯誤', '請輸入用戶名和密碼');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (!success) {
        Alert.alert('登入失敗', '用戶名或密碼錯誤');
      }
    } catch (error) {
      Alert.alert('登入失敗', '無法連接到伺服器');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user: typeof quickLoginUsers[0]) => {
    setIsLoading(true);
    try {
      const success = await login(user.originalUsername, user.password);
      if (!success) {
        Alert.alert('登入失敗', '快速登入失敗');
      }
    } catch (error) {
      Alert.alert('登入失敗', '無法連接到伺服器');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Card style={styles.loginCard}>
          <Card.Content>
            <Text style={styles.title}>雲水基材管理系統</Text>
            <Text style={styles.subtitle}>手機版</Text>

            <TextInput
              label="用戶名"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
            />

            <TextInput
              label="密碼"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            >
              登入
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.quickLoginCard}>
          <Card.Content>
            <Text style={styles.quickLoginTitle}>快速登入</Text>
            {quickLoginUsers.map((user, index) => (
              <Button
                key={index}
                mode="outlined"
                onPress={() => handleQuickLogin(user)}
                disabled={isLoading}
                style={styles.quickLoginButton}
              >
                {user.username} ({user.role})
              </Button>
            ))}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  loginCard: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#007bff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 10,
    paddingVertical: 8,
  },
  quickLoginCard: {
    marginTop: 10,
  },
  quickLoginTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  quickLoginButton: {
    marginBottom: 8,
  },
});