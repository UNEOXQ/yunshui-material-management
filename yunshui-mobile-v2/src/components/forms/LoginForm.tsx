import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  loading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading = false,
  error,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (username.trim() && password.trim()) {
      onSubmit(username.trim(), password);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="headlineSmall" style={styles.title}>
          雲水基材管理系統
        </Text>
        
        <Input
          label="帳號"
          value={username}
          onChangeText={setUsername}
          placeholder="請輸入帳號"
          disabled={loading}
        />
        
        <Input
          label="密碼"
          value={password}
          onChangeText={setPassword}
          placeholder="請輸入密碼"
          secureTextEntry
          disabled={loading}
        />
        
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
        
        <Button
          title="登入"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !username.trim() || !password.trim()}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 8,
  },
});