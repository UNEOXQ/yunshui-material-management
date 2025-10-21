import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { commonStyles } from '../styles/theme';

export default function LoadingScreen() {
  return (
    <View style={[commonStyles.container, styles.container]}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.text}>載入中...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});