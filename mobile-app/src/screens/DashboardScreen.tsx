import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles } from '../styles/theme';
import apiClient from '../services/api';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockMaterials: number;
  unreadMessages: number;
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    lowStockMaterials: 0,
    unreadMessages: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 載入統計數據
      const [ordersResponse, materialsResponse, messagesResponse] = await Promise.all([
        apiClient.get('/orders'),
        apiClient.get('/materials'),
        apiClient.get('/messages/unread'),
      ]);

      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.data.orders || ordersResponse.data.data;
        const pendingCount = orders.filter((order: any) => order.status === 'PENDING').length;
        const completedCount = orders.filter((order: any) => order.status === 'COMPLETED').length;
        
        setStats(prev => ({
          ...prev,
          totalOrders: orders.length,
          pendingOrders: pendingCount,
          completedOrders: completedCount,
        }));

        // 設定最近訂單 (最多5個)
        setRecentOrders(orders.slice(0, 5));
      }

      if (materialsResponse.data.success) {
        const materials = materialsResponse.data.data.materials || materialsResponse.data.data;
        const lowStockCount = materials.filter((material: any) => 
          material.stockQuantity < 10
        ).length;
        
        setStats(prev => ({
          ...prev,
          lowStockMaterials: lowStockCount,
        }));
      }

      if (messagesResponse.data.success) {
        const messages = messagesResponse.data.data;
        setStats(prev => ({
          ...prev,
          unreadMessages: Array.isArray(messages) ? messages.length : 0,
        }));
      }
    } catch (error) {
      console.error('載入儀表板數據失敗:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#ffc107';
      case 'PROCESSING': return '#17a2b8';
      case 'COMPLETED': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '待處理';
      case 'PROCESSING': return '處理中';
      case 'COMPLETED': return '已完成';
      default: return status;
    }
  };

  return (
    <ScrollView 
      style={commonStyles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={commonStyles.content}>
        {/* 歡迎訊息 */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text style={styles.greeting}>
              {getGreeting()}，{user?.username}
            </Text>
            <Text style={styles.welcomeText}>
              歡迎使用雲水基材管理系統
            </Text>
          </Card.Content>
        </Card>

        {/* 統計卡片 */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="clipboard-list" size={24} color="#007bff" />
                <Text style={styles.statNumber}>{stats.totalOrders}</Text>
                <Text style={styles.statLabel}>總訂單</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="clock-outline" size={24} color="#ffc107" />
                <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
                <Text style={styles.statLabel}>待處理</Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="package-variant" size={24} color="#dc3545" />
                <Text style={styles.statNumber}>{stats.lowStockMaterials}</Text>
                <Text style={styles.statLabel}>庫存警告</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="message" size={24} color="#17a2b8" />
                <Text style={styles.statNumber}>{stats.unreadMessages}</Text>
                <Text style={styles.statLabel}>未讀訊息</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* 快速操作 */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>快速操作</Text>
            <View style={styles.quickActionsContainer}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Orders')}
                style={styles.quickActionButton}
                icon="clipboard-list"
              >
                查看訂單
              </Button>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Materials')}
                style={styles.quickActionButton}
                icon="package-variant"
              >
                管理庫存
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 最近訂單 */}
        <Card style={styles.recentOrdersCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>最近訂單</Text>
            {recentOrders.length > 0 ? (
              recentOrders.map((order: any, index) => (
                <View key={order.id || index} style={styles.orderItem}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>#{order.id}</Text>
                    <Chip 
                      mode="outlined"
                      textStyle={{ color: getStatusColor(order.status), fontSize: 12 }}
                      style={{ 
                        borderColor: getStatusColor(order.status),
                        height: 28,
                      }}
                    >
                      {getStatusText(order.status)}
                    </Chip>
                  </View>
                  <Text style={styles.orderProject}>{order.projectName}</Text>
                  <Text style={styles.orderCustomer}>{order.customerName}</Text>
                  <Text style={styles.orderAmount}>
                    NT$ {order.totalAmount?.toLocaleString() || '0'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>暫無訂單數據</Text>
            )}
            
            {recentOrders.length > 0 && (
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Orders')}
                style={styles.viewAllButton}
              >
                查看所有訂單
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  welcomeCard: {
    marginBottom: 16,
    backgroundColor: '#007bff',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  recentOrdersCard: {
    marginBottom: 16,
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  orderProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  viewAllButton: {
    marginTop: 16,
  },
});