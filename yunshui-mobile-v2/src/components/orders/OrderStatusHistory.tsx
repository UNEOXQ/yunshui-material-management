import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  Text,
  List,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OrderStatus, orderService } from '../../services/orderService';

interface StatusHistoryItem {
  id: string;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  comment?: string;
  createdAt: string;
  createdBy?: string;
}

interface OrderStatusHistoryProps {
  orderId: string;
}

export default function OrderStatusHistory({ orderId }: OrderStatusHistoryProps) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatusHistory();
  }, [orderId]);

  const loadStatusHistory = async () => {
    try {
      // TODO: 實作從 API 載入狀態歷史
      // 目前使用模擬數據
      const mockHistory: StatusHistoryItem[] = [
        {
          id: '1',
          orderId,
          toStatus: 'PENDING',
          comment: '訂單已建立',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          createdBy: '系統',
        },
        {
          id: '2',
          orderId,
          fromStatus: 'PENDING',
          toStatus: 'APPROVED',
          comment: '訂單已審核通過',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          createdBy: '管理員',
        },
        {
          id: '3',
          orderId,
          fromStatus: 'APPROVED',
          toStatus: 'CONFIRMED',
          comment: '客戶已確認訂單內容',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          createdBy: '客服',
        },
      ];
      
      setHistory(mockHistory);
    } catch (error) {
      console.error('載入狀態歷史失敗:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getStatusIcon = (status: OrderStatus) => {
    const statusIcons: Record<OrderStatus, string> = {
      'PENDING': 'clock-outline',
      'APPROVED': 'check-circle-outline',
      'CONFIRMED': 'shield-check-outline',
      'PROCESSING': 'cog-outline',
      'COMPLETED': 'check-all',
      'CANCELLED': 'close-circle-outline',
    };
    return statusIcons[status] || 'help-circle-outline';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = (item: StatusHistoryItem, index: number) => {
    const isLast = index === history.length - 1;
    
    return (
      <View key={item.id}>
        <View style={styles.historyItem}>
          <View style={styles.timeline}>
            <View 
              style={[
                styles.timelineDot, 
                { backgroundColor: getStatusColor(item.toStatus) }
              ]} 
            />
            {!isLast && <View style={styles.timelineLine} />}
          </View>
          
          <View style={styles.historyContent}>
            <View style={styles.historyHeader}>
              <View style={styles.statusChange}>
                {item.fromStatus && (
                  <>
                    <Text style={[styles.statusText, { color: getStatusColor(item.fromStatus) }]}>
                      {orderService.getOrderStatusText(item.fromStatus)}
                    </Text>
                    <MaterialCommunityIcons 
                      name="arrow-right" 
                      size={16} 
                      color="#666" 
                      style={styles.arrow}
                    />
                  </>
                )}
                <Text style={[styles.statusText, { color: getStatusColor(item.toStatus) }]}>
                  {orderService.getOrderStatusText(item.toStatus)}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={getStatusIcon(item.toStatus)}
                size={20}
                color={getStatusColor(item.toStatus)}
              />
            </View>
            
            {item.comment && (
              <Text style={styles.comment}>{item.comment}</Text>
            )}
            
            <View style={styles.historyMeta}>
              <Text style={styles.dateTime}>
                {formatDateTime(item.createdAt)}
              </Text>
              {item.createdBy && (
                <Text style={styles.createdBy}>
                  由 {item.createdBy} 操作
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007bff" />
            <Text style={styles.loadingText}>載入狀態歷史...</Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>狀態變更歷史</Text>
        
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={48} color="#ccc" />
            <Text style={styles.emptyText}>暫無狀態變更記錄</Text>
          </View>
        ) : (
          <ScrollView style={styles.historyList} nestedScrollEnabled>
            {history.map((item, index) => renderHistoryItem(item, index))}
          </ScrollView>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  historyList: {
    maxHeight: 300,
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
  },
  historyContent: {
    flex: 1,
    paddingBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChange: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  arrow: {
    marginHorizontal: 8,
  },
  comment: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTime: {
    fontSize: 12,
    color: '#666',
  },
  createdBy: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});