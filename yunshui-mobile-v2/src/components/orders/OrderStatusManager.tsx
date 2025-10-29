import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  Dialog,
  Portal,
  RadioButton,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OrderStatus, orderService } from '../../services/orderService';

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusUpdate: (newStatus: OrderStatus) => void;
  disabled?: boolean;
}

export default function OrderStatusManager({
  orderId,
  currentStatus,
  onStatusUpdate,
  disabled = false,
}: OrderStatusManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = orderService.getOrderStatusOptions();
  const availableStatuses = statusOptions.filter(option => 
    option.value !== currentStatus
  );

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

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) {
      setShowDialog(false);
      return;
    }

    // 特殊狀態變更需要確認
    if (selectedStatus === 'CANCELLED') {
      Alert.alert(
        '確認取消',
        '確定要取消這個訂單嗎？此操作無法撤銷。',
        [
          { text: '取消', style: 'cancel' },
          { text: '確認取消', style: 'destructive', onPress: performStatusUpdate },
        ]
      );
      return;
    }

    if (selectedStatus === 'COMPLETED') {
      Alert.alert(
        '確認完成',
        '確定要將訂單標記為已完成嗎？',
        [
          { text: '取消', style: 'cancel' },
          { text: '確認完成', onPress: performStatusUpdate },
        ]
      );
      return;
    }

    performStatusUpdate();
  };

  const performStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      await orderService.updateOrderStatus(orderId, selectedStatus);
      onStatusUpdate(selectedStatus);
      setShowDialog(false);
      setComment('');
      
      Alert.alert(
        '成功',
        `訂單狀態已更新為「${orderService.getOrderStatusText(selectedStatus)}」`
      );
    } catch (error) {
      console.error('更新訂單狀態失敗:', error);
      Alert.alert('錯誤', '更新訂單狀態失敗，請稍後再試');
    } finally {
      setIsUpdating(false);
    }
  };

  const openStatusDialog = () => {
    setSelectedStatus(currentStatus);
    setComment('');
    setShowDialog(true);
  };

  const canUpdateStatus = () => {
    // 已取消或已完成的訂單通常不能再更改狀態
    return !['CANCELLED', 'COMPLETED'].includes(currentStatus) && !disabled;
  };

  const renderCurrentStatus = () => (
    <Card style={styles.statusCard}>
      <Card.Content>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>當前狀態</Text>
          {canUpdateStatus() && (
            <Button
              mode="outlined"
              onPress={openStatusDialog}
              compact
              disabled={disabled}
            >
              更新狀態
            </Button>
          )}
        </View>

        <View style={styles.currentStatusContainer}>
          <MaterialCommunityIcons
            name={getStatusIcon(currentStatus)}
            size={24}
            color={getStatusColor(currentStatus)}
          />
          <Chip
            mode="flat"
            textStyle={{ 
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
            }}
            style={{ 
              backgroundColor: getStatusColor(currentStatus),
              marginLeft: 12,
            }}
          >
            {orderService.getOrderStatusText(currentStatus)}
          </Chip>
        </View>

        {!canUpdateStatus() && (
          <Text style={styles.statusNote}>
            {currentStatus === 'COMPLETED' 
              ? '訂單已完成，無法更改狀態' 
              : '訂單已取消，無法更改狀態'
            }
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderStatusDialog = () => (
    <Portal>
      <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
        <Dialog.Title>更新訂單狀態</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogSubtitle}>選擇新的訂單狀態：</Text>
          
          <RadioButton.Group
            onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
            value={selectedStatus}
          >
            {statusOptions.map((option) => (
              <View key={option.value} style={styles.radioOption}>
                <RadioButton.Item
                  label={option.label}
                  value={option.value}
                  status={selectedStatus === option.value ? 'checked' : 'unchecked'}
                  disabled={option.value === currentStatus}
                  labelStyle={{
                    color: option.value === currentStatus ? '#999' : '#333',
                  }}
                />
                <MaterialCommunityIcons
                  name={getStatusIcon(option.value)}
                  size={20}
                  color={getStatusColor(option.value)}
                  style={styles.statusIcon}
                />
              </View>
            ))}
          </RadioButton.Group>

          <TextInput
            label="備註 (選填)"
            value={comment}
            onChangeText={setComment}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.commentInput}
            placeholder="請輸入狀態變更的備註說明..."
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowDialog(false)} disabled={isUpdating}>
            取消
          </Button>
          <Button
            onPress={handleStatusUpdate}
            loading={isUpdating}
            disabled={isUpdating || selectedStatus === currentStatus}
          >
            確認更新
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <View>
      {renderCurrentStatus()}
      {renderStatusDialog()}
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  },
  dialogSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIcon: {
    marginRight: 16,
  },
  commentInput: {
    marginTop: 16,
  },
});