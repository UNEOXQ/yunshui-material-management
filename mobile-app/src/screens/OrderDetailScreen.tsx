import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  Divider,
  List,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OrderStackScreenProps } from '../navigation/types';
import { commonStyles } from '../styles/theme';
import { orderService, OrderWithItems, OrderStatus } from '../services/orderService';
import OrderStatusManager from '../components/orders/OrderStatusManager';
import OrderStatusHistory from '../components/orders/OrderStatusHistory';

type Props = OrderStackScreenProps<'OrderDetail'>;

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('載入訂單詳情失敗:', error);
      Alert.alert('錯誤', '載入訂單詳情失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadOrderDetail();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: OrderStatus) => {
    const statusColors: Record<OrderStatus, string> = {
      'PENDING': '#ffc107',
      'APPROVED': '#17a2b8',
      'CONFIRMED': '#6f42c1',
      'PROCESSING': '#fd7e14',
      'COMPLETED': '#28a745',
      'CANCELLED': '#dc3545',
    };
    return statusColors[status] || '#6c757d';
  };

  const getStatusText = (status: OrderStatus) => {
    return orderService.getOrderStatusText(status);
  };



  const renderOrderHeader = () => (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{order?.orderNumber}</Text>
            <Text style={styles.customerName}>{order?.customerName}</Text>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ 
              color: getStatusColor(order?.status || 'PENDING'), 
              fontSize: 14,
              fontWeight: '600',
            }}
            style={{ 
              borderColor: getStatusColor(order?.status || 'PENDING'),
              height: 32,
            }}
          >
            {getStatusText(order?.status || 'PENDING')}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.orderMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={16} color="#666" />
            <Text style={styles.metaText}>
              建立時間: {order?.createdAt ? new Date(order.createdAt).toLocaleString('zh-TW') : ''}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="update" size={16} color="#666" />
            <Text style={styles.metaText}>
              更新時間: {order?.updatedAt ? new Date(order.updatedAt).toLocaleString('zh-TW') : ''}
            </Text>
          </View>
        </View>

        <View style={styles.totalAmount}>
          <Text style={styles.totalLabel}>訂單總額</Text>
          <Text style={styles.totalValue}>
            NT$ {order?.totalAmount?.toLocaleString() || '0'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderOrderItems = () => (
    <Card style={styles.itemsCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>訂單項目</Text>
        {order?.items?.map((item, index) => (
          <View key={item.id || index}>
            <View style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.materialName || item.material?.name || '未知基材'}
                </Text>
                <Text style={styles.itemCategory}>
                  {item.materialCategory || ''}
                </Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemQuantity}>
                  數量: {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>
                  單價: NT$ {item.unitPrice?.toLocaleString()}
                </Text>
                <Text style={styles.itemSubtotal}>
                  小計: NT$ {item.subtotal?.toLocaleString()}
                </Text>
              </View>
            </View>
            {index < (order?.items?.length || 0) - 1 && (
              <Divider style={styles.itemDivider} />
            )}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    if (order) {
      setOrder({ ...order, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>載入訂單詳情...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[commonStyles.container, styles.errorContainer]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#dc3545" />
        <Text style={styles.errorText}>找不到訂單資料</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          返回
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {renderOrderHeader()}
      {renderOrderItems()}
      
      {order && (
        <OrderStatusManager
          orderId={order.id}
          currentStatus={order.status}
          onStatusUpdate={handleStatusUpdate}
          disabled={isUpdatingStatus}
        />
      )}
      
      <OrderStatusHistory orderId={orderId} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007bff',
  },
  headerCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    marginVertical: 16,
  },
  orderMeta: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  totalAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  itemsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  orderItem: {
    paddingVertical: 12,
  },
  itemInfo: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  itemDivider: {
    marginVertical: 8,
  },

});