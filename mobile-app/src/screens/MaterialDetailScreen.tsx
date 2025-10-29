import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  ActivityIndicator,
  FAB,
  Divider,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { commonStyles } from '../styles/theme';
import { materialService } from '../services/materialService';
import { MaterialStackScreenProps } from '../navigation/types';

const { width, height } = Dimensions.get('window');

interface Material {
  id: string;
  name: string;
  category: string;
  specification: string;
  quantity: number;
  imageUrl?: string;
  supplier?: string;
  type: 'AUXILIARY' | 'FINISHED';
  createdAt: string;
  updatedAt: string;
}

type Props = MaterialStackScreenProps<'MaterialDetail'>;

export default function MaterialDetailScreen({ navigation, route }: Props) {
  const { materialId } = route.params;
  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadMaterial();
  }, [materialId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <IconButton
            icon="pencil"
            size={24}
            onPress={() => navigation.navigate('MaterialForm', { materialId })}
          />
          <IconButton
            icon="delete"
            size={24}
            onPress={handleDelete}
          />
        </View>
      ),
    });
  }, [navigation, materialId]);

  const loadMaterial = async () => {
    try {
      setIsLoading(true);
      const materialData = await materialService.getMaterialById(materialId);
      setMaterial(materialData);
    } catch (error) {
      console.error('載入材料詳情失敗:', error);
      Alert.alert('錯誤', '載入材料詳情失敗，請稍後再試', [
        { text: '確定', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '確認刪除',
      `確定要刪除材料「${material?.name}」嗎？此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!material) return;

    try {
      setIsDeleting(true);
      await materialService.deleteMaterial(material.id);
      Alert.alert('成功', '材料已刪除', [
        { text: '確定', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('刪除材料失敗:', error);
      Alert.alert('錯誤', '刪除材料失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
    }
  };

  const updateQuantity = async (newQuantity: number) => {
    if (!material) return;

    try {
      await materialService.updateMaterialQuantity(material.id, newQuantity);
      setMaterial(prev => prev ? { ...prev, quantity: newQuantity } : null);
      Alert.alert('成功', '庫存已更新');
    } catch (error) {
      console.error('更新庫存失敗:', error);
      Alert.alert('錯誤', '更新庫存失敗，請稍後再試');
    }
  };

  const showQuantityUpdateDialog = () => {
    if (!material) return;

    Alert.prompt(
      '更新庫存',
      `${material.name}\n當前庫存: ${material.quantity}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '更新',
          onPress: (value) => {
            const newQuantity = parseInt(value || '0');
            if (!isNaN(newQuantity) && newQuantity >= 0) {
              updateQuantity(newQuantity);
            } else {
              Alert.alert('錯誤', '請輸入有效的數量');
            }
          },
        },
      ],
      'plain-text',
      material.quantity.toString()
    );
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: '缺貨', color: '#dc3545', icon: 'alert-circle' };
    if (quantity < 10) return { label: '庫存不足', color: '#ffc107', icon: 'alert' };
    return { label: '庫存充足', color: '#28a745', icon: 'check-circle' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  if (!material) {
    return (
      <View style={[commonStyles.container, styles.errorContainer]}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#dc3545" />
        <Text style={styles.errorText}>找不到材料資料</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          返回
        </Button>
      </View>
    );
  }

  const stockStatus = getStockStatus(material.quantity);

  return (
    <View style={commonStyles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 材料圖片 */}
        {material.imageUrl && (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => setImageModalVisible(true)}
          >
            <Image source={{ uri: material.imageUrl }} style={styles.materialImage} />
            <View style={styles.imageOverlay}>
              <MaterialCommunityIcons name="magnify" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
        )}

        {/* 基本資訊 */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.titleSection}>
              <Text style={styles.materialName}>{material.name}</Text>
              <Chip
                mode="outlined"
                style={styles.typeChip}
                textStyle={styles.typeChipText}
              >
                {material.type === 'AUXILIARY' ? '輔助材料' : '成品材料'}
              </Chip>
            </View>

            <View style={styles.categorySection}>
              <MaterialCommunityIcons name="tag" size={16} color="#666" />
              <Text style={styles.categoryText}>{material.category}</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>規格說明</Text>
                <Text style={styles.detailValue}>{material.specification}</Text>
              </View>

              {material.supplier && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>供應商</Text>
                  <Text style={styles.detailValue}>{material.supplier}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>建立時間</Text>
                <Text style={styles.detailValue}>{formatDate(material.createdAt)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>更新時間</Text>
                <Text style={styles.detailValue}>{formatDate(material.updatedAt)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 庫存資訊 */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.stockHeader}>
              <Text style={styles.sectionTitle}>庫存資訊</Text>
              <MaterialCommunityIcons 
                name={stockStatus.icon as any} 
                size={20} 
                color={stockStatus.color} 
              />
            </View>

            <View style={styles.stockContent}>
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>當前庫存</Text>
                <Text style={styles.quantityValue}>{material.quantity}</Text>
              </View>

              <Chip
                mode="outlined"
                textStyle={{ color: stockStatus.color }}
                style={{ borderColor: stockStatus.color }}
              >
                {stockStatus.label}
              </Chip>
            </View>

            <Button
              mode="contained"
              onPress={showQuantityUpdateDialog}
              style={styles.updateButton}
              icon="pencil"
            >
              更新庫存
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 圖片查看模態框 */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              {material.imageUrl && (
                <Image
                  source={{ uri: material.imageUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
              <IconButton
                icon="close"
                size={30}
                iconColor="#ffffff"
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 編輯按鈕 */}
      <FAB
        icon="pencil"
        style={styles.fab}
        onPress={() => navigation.navigate('MaterialForm', { materialId })}
        disabled={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 16,
    color: '#666',
    marginVertical: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
    backgroundColor: '#f5f5f5',
  },
  materialImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  materialName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  typeChip: {
    height: 28,
  },
  typeChipText: {
    fontSize: 12,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  divider: {
    marginVertical: 16,
  },
  detailSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantitySection: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  updateButton: {
    marginTop: 8,
  },
  bottomSpacing: {
    height: 80,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.7,
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007bff',
  },
});