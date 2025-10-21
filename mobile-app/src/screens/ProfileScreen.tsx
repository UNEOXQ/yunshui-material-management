import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, List, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles } from '../styles/theme';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      '確認登出',
      '您確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '登出', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return '系統管理員';
      case 'PM': return '專案經理';
      case 'AM': return '客戶經理';
      case 'WAREHOUSE': return '倉庫管理員';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#dc3545';
      case 'PM': return '#007bff';
      case 'AM': return '#28a745';
      case 'WAREHOUSE': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <ScrollView style={commonStyles.container}>
      <View style={commonStyles.content}>
        {/* 用戶資訊卡片 */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={user?.username?.charAt(0) || 'U'}
              style={{ backgroundColor: getRoleColor(user?.role || '') }}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.username}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={[styles.userRole, { color: getRoleColor(user?.role || '') }]}>
                {getRoleText(user?.role || '')}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* 功能選單 */}
        <Card style={styles.menuCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>功能選單</Text>
            
            <List.Item
              title="訂單管理"
              description="查看和管理所有訂單"
              left={(props) => <List.Icon {...props} icon="clipboard-list" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Orders')}
              style={styles.menuItem}
            />

            <List.Item
              title="材料管理"
              description="查看和管理庫存材料"
              left={(props) => <List.Icon {...props} icon="package-variant" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Materials')}
              style={styles.menuItem}
            />

            <List.Item
              title="狀態管理"
              description="管理訂單狀態和進度"
              left={(props) => <List.Icon {...props} icon="chart-line" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('StatusManagement')}
              style={styles.menuItem}
            />
          </Card.Content>
        </Card>

        {/* 系統資訊 */}
        <Card style={styles.systemCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>系統資訊</Text>
            
            <View style={styles.systemInfo}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="information" size={20} color="#666" />
                <Text style={styles.infoLabel}>版本</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="server" size={20} color="#666" />
                <Text style={styles.infoLabel}>後端</Text>
                <Text style={styles.infoValue}>192.168.68.99:3004</Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="update" size={20} color="#666" />
                <Text style={styles.infoLabel}>最後更新</Text>
                <Text style={styles.infoValue}>2024/10/21</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 設定選項 */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>設定</Text>
            
            <List.Item
              title="通知設定"
              description="管理推送通知偏好"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('功能開發中', '此功能正在開發中')}
              style={styles.menuItem}
            />

            <List.Item
              title="關於我們"
              description="雲水基材管理系統"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('關於', '雲水基材管理系統 v1.0.0\n\n專為建材管理而設計的移動應用程式')}
              style={styles.menuItem}
            />
          </Card.Content>
        </Card>

        {/* 登出按鈕 */}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#dc3545"
          icon="logout"
        >
          登出
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    marginBottom: 16,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  menuCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 4,
  },
  systemCard: {
    marginBottom: 16,
  },
  systemInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingsCard: {
    marginBottom: 24,
  },
  logoutButton: {
    marginBottom: 32,
    paddingVertical: 8,
  },
});