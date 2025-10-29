import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Chip, Searchbar, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { commonStyles } from '../styles/theme';
import apiClient from '../services/api';

interface Order {
  id: string;
  projectName: string;
  customerName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const statusOptions = [
    { key: 'ALL', label: '全部', color: '#6c757d' },
    { key: 'PENDING', label: '待處理', color: '#ffc107' },
    { key: 'PROCESSING', label: '處理中', color: '#17a2b8' },
    { key: 'COMPLETED', label: '已完成', color: '#28a745' },
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, selectedStatus]);

  const loadOrders = async () => {
    try {
      const response = await apiClient.get('/orders');
      if (response.data.success) {
        const ordersData = response.data.data.orders || response.data.data;
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('載入訂單失敗:', error);
      Alert.alert('錯誤', '載入訂單失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  const filterOrders = () => {
    let filtered = orders;

    // 狀態篩選
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // 搜尋篩選
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(`/orders/${orderId}/status`, {
        status: newStatus,
        comment: `狀態更新為${getStatusText(newStatus)}`
      });

      if (response.data.success) {
        // 更新本地狀態
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        Alert.alert('成功', '訂單狀態已更新');
      }
    } catch (error) {
      console.error('更新訂單狀態失敗:', error);
      Alert.alert('錯誤', '更新訂單狀態失敗');
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(option => option.key === status);
    return statusOption?.color || '#6c757d';
  };

  const getStatusText = (status: string) => {
    const statusOption = statusOptions.find(option => option.key === status);
    return statusOption?.label || status;
  };

  const showStatusUpdateDialog = (order: Order) => {
    const availableStatuses = statusOptions.filter(option => 
      option.key !== 'ALL' && option.key !== order.status
    );

    Alert.alert(
      '更新訂單狀態',
      `訂單 #${order.id}`,
      [
        ...availableStatuses.map(status => ({
          text: status.label,
          onPress: () => updateOrderStatus(order.id, status.key),
        })),
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{item.id}</Text>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}
            style={{ 
              borderColor: getStatusColor(item.status),
              height: 28,
            }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>

        <Text style={styles.projectName}>{item.projectName}</Text>
        <Text style={styles.customerName}>{item.customerName}</Text>

        <View style={styles.orderFooter}>
          <Text style={styles.amount}>
            NT$ {item.totalAmount?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('zh-TW')}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            style={styles.actionButton}
            compact
          >
            查看詳情
          </Button>
          <Button
            mode="contained"
            onPress={() => showStatusUpdateDialog(item)}
            style={styles.actionButton}
            compact
          >
            更新狀態
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderStatusFilter = () => (
    <View style={styles.statusFilter}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={statusOptions}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <Chip
            mode={selectedStatus === item.key ? 'flat' : 'outlined'}
            selected={selectedStatus === item.key}
            onPress={() => setSelectedStatus(item.key)}
            style={styles.statusChip}
            textStyle={{
              color: selectedStatus === item.key ? '#ffffff' : item.color,
            }}
          >
            {item.label}
          </Chip>
        )}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <Text>載入中...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="搜尋訂單..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {renderStatusFilter()}

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>暫無訂單數據</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('OrderForm', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007bff',
  },
});