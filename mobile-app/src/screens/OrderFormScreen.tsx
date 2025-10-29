import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  List,
  Divider,
  FAB,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OrderStackScreenProps } from '../navigation/types';
import { commonStyles } from '../styles/theme';
import { 
  orderService, 
  CreateOrderRequest, 
  OrderWithItems 
} from '../services/orderService';
import { materialService, Material } from '../services/materialService';

type Props = OrderStackScreenProps<'OrderForm'>;

interface OrderItem {
  materialId: string;
  material?: Material;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export default function OrderFormScreen({ route, navigation }: Props) {
  const { orderId } = route.params || {};
  const isEditing = !!orderId;

  const [customerName, setCustomerName] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);

  useEffect(() => {
    loadMaterials();
    if (isEditing) {
      loadOrderData();
    }
  }, [orderId]);

  const loadMaterials = async () => {
    try {
      const materialsData = await materialService.getMaterials();
      setMaterials(materialsData.materials || []);
    } catch (error) {
      console.error('載入基材列表失敗:', error);
      Alert.alert('錯誤', '載入基材列表失敗');
    }
  };

  const loadOrderData = async () => {
    if (!orderId) return;

    setIsLoading(true);
    try {
      const orderData = await orderService.getOrderById(orderId);
      setCustomerName(orderData.customerName);
      
      const items: OrderItem[] = orderData.items?.map(item => ({
        materialId: item.materialId,
        material: item.material,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })) || [];
      
      setOrderItems(items);
    } catch (error) {
      console.error('載入訂單資料失敗:', error);
      Alert.alert('錯誤', '載入訂單資料失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const addMaterial = (material: Material) => {
    const existingItemIndex = orderItems.findIndex(
      item => item.materialId === material.id
    );

    if (existingItemIndex >= 0) {
      // 如果已存在，增加數量
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].subtotal = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setOrderItems(updatedItems);
    } else {
      // 新增項目
      const newItem: OrderItem = {
        materialId: material.id,
        material,
        quantity: 1,
        unitPrice: material.price || 0,
        subtotal: material.price || 0,
      };
      setOrderItems([...orderItems, newItem]);
    }
    setShowMaterialSelector(false);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    const updatedItems = [...orderItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].subtotal = quantity * updatedItems[index].unitPrice;
    setOrderItems(updatedItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    const updatedItems = [...orderItems];
    updatedItems[index].unitPrice = price;
    updatedItems[index].subtotal = updatedItems[index].quantity * price;
    setOrderItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!customerName.trim()) {
      errors.push('請輸入客戶名稱');
    }

    if (orderItems.length === 0) {
      errors.push('請至少添加一個基材項目');
    }

    orderItems.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`項目 ${index + 1}: 數量必須大於 0`);
      }
      if (item.unitPrice <= 0) {
        errors.push(`項目 ${index + 1}: 單價必須大於 0`);
      }
    });

    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('表單驗證失敗', errors.join('\n'));
      return;
    }

    setIsSaving(true);
    try {
      const orderData: CreateOrderRequest = {
        customerName: customerName.trim(),
        items: orderItems.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      if (isEditing) {
        // TODO: 實作編輯功能
        Alert.alert('提示', '編輯功能尚未實作');
      } else {
        await orderService.createOrder(orderData);
        Alert.alert('成功', '訂單建立成功', [
          { text: '確定', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('儲存訂單失敗:', error);
      Alert.alert('錯誤', '儲存訂單失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCustomerInfo = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>客戶資訊</Text>
        <TextInput
          label="客戶名稱 *"
          value={customerName}
          onChangeText={setCustomerName}
          mode="outlined"
          style={styles.input}
          placeholder="請輸入客戶名稱"
        />
      </Card.Content>
    </Card>
  );

  const renderOrderItems = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>訂單項目</Text>
          <Chip
            mode="outlined"
            onPress={() => setShowMaterialSelector(true)}
            icon="plus"
            style={styles.addButton}
          >
            添加基材
          </Chip>
        </View>

        {orderItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={48} color="#ccc" />
            <Text style={styles.emptyText}>尚未添加任何基材</Text>
            <Text style={styles.emptySubtext}>點擊上方按鈕添加基材</Text>
          </View>
        ) : (
          orderItems.map((item, index) => (
            <View key={`${item.materialId}-${index}`}>
              <View style={styles.orderItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>
                    {item.material?.name || '未知基材'}
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => removeItem(index)}
                    compact
                    textColor="#dc3545"
                  >
                    移除
                  </Button>
                </View>

                <View style={styles.itemInputs}>
                  <TextInput
                    label="數量"
                    value={item.quantity.toString()}
                    onChangeText={(text) => {
                      const quantity = parseInt(text) || 0;
                      updateItemQuantity(index, quantity);
                    }}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.quantityInput}
                  />
                  <TextInput
                    label="單價"
                    value={item.unitPrice.toString()}
                    onChangeText={(text) => {
                      const price = parseFloat(text) || 0;
                      updateItemPrice(index, price);
                    }}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.priceInput}
                  />
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.subtotalLabel}>小計:</Text>
                  <Text style={styles.subtotalValue}>
                    NT$ {item.subtotal.toLocaleString()}
                  </Text>
                </View>
              </View>
              {index < orderItems.length - 1 && <Divider style={styles.itemDivider} />}
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );

  const renderOrderSummary = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>項目數量:</Text>
          <Text style={styles.summaryValue}>{orderItems.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>總數量:</Text>
          <Text style={styles.summaryValue}>
            {orderItems.reduce((total, item) => total + item.quantity, 0)}
          </Text>
        </View>
        <Divider style={styles.summaryDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>訂單總額:</Text>
          <Text style={styles.totalValue}>
            NT$ {calculateTotal().toLocaleString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderMaterialSelector = () => {
    if (!showMaterialSelector) return null;

    return (
      <Card style={styles.selectorCard}>
        <Card.Content>
          <View style={styles.selectorHeader}>
            <Text style={styles.sectionTitle}>選擇基材</Text>
            <Button
              mode="text"
              onPress={() => setShowMaterialSelector(false)}
              compact
            >
              取消
            </Button>
          </View>
          <ScrollView style={styles.materialList} nestedScrollEnabled>
            {materials.map((material) => (
              <List.Item
                key={material.id}
                title={material.name}
                description={`${material.category} - NT$ ${material.price?.toLocaleString()}`}
                left={(props) => (
                  <List.Icon {...props} icon="package-variant-closed" />
                )}
                onPress={() => addMaterial(material)}
                style={styles.materialItem}
              />
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>載入訂單資料...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={commonStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderCustomerInfo()}
        {renderOrderItems()}
        {renderOrderSummary()}
        {renderMaterialSelector()}

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
            disabled={isSaving}
          >
            取消
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.actionButton}
            loading={isSaving}
            disabled={isSaving}
          >
            {isEditing ? '更新訂單' : '建立訂單'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#e3f2fd',
  },
  input: {
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  orderItem: {
    paddingVertical: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  itemInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quantityInput: {
    flex: 1,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    marginLeft: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: 14,
    color: '#666',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  itemDivider: {
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryDivider: {
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  selectorCard: {
    marginBottom: 16,
    maxHeight: 300,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialList: {
    maxHeight: 200,
  },
  materialItem: {
    paddingVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});