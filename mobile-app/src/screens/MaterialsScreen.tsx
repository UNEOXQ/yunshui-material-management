import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Image } from 'react-native';
import { Card, Text, Button, Chip, Searchbar, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { commonStyles } from '../styles/theme';
import apiClient from '../services/api';

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  createdAt: string;
}

export default function MaterialsScreen({ navigation }: any) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery, selectedCategory]);

  const loadMaterials = async () => {
    try {
      const response = await apiClient.get('/materials');
      if (response.data.success) {
        const materialsData = response.data.data.materials || response.data.data;
        setMaterials(materialsData);
      }
    } catch (error) {
      console.error('載入材料失敗:', error);
      Alert.alert('錯誤', '載入材料失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadMaterials();
    setIsRefreshing(false);
  };

  const filterMaterials = () => {
    let filtered = materials;

    // 分類篩選
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }

    // 搜尋篩選
    if (searchQuery) {
      filtered = filtered.filter(material =>
        material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMaterials(filtered);
  };

  const getCategories = () => {
    const categories = ['ALL', ...new Set(materials.map(m => m.category))];
    return categories.map(cat => ({
      key: cat,
      label: cat === 'ALL' ? '全部' : cat,
    }));
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: '缺貨', color: '#dc3545' };
    if (quantity < 10) return { label: '庫存不足', color: '#ffc107' };
    return { label: '庫存充足', color: '#28a745' };
  };

  const updateStock = async (materialId: string, newQuantity: number) => {
    try {
      const response = await apiClient.put(`/materials/${materialId}`, {
        stockQuantity: newQuantity
      });

      if (response.data.success) {
        setMaterials(prevMaterials =>
          prevMaterials.map(material =>
            material.id === materialId 
              ? { ...material, stockQuantity: newQuantity }
              : material
          )
        );
        Alert.alert('成功', '庫存已更新');
      }
    } catch (error) {
      console.error('更新庫存失敗:', error);
      Alert.alert('錯誤', '更新庫存失敗');
    }
  };

  const showStockUpdateDialog = (material: Material) => {
    Alert.prompt(
      '更新庫存',
      `${material.name}\n當前庫存: ${material.stockQuantity} ${material.unit}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '更新',
          onPress: (value) => {
            const newQuantity = parseInt(value || '0');
            if (!isNaN(newQuantity) && newQuantity >= 0) {
              updateStock(material.id, newQuantity);
            } else {
              Alert.alert('錯誤', '請輸入有效的數量');
            }
          },
        },
      ],
      'plain-text',
      material.stockQuantity.toString()
    );
  };

  const renderMaterialItem = ({ item }: { item: Material }) => {
    const stockStatus = getStockStatus(item.stockQuantity);
    
    return (
      <Card style={styles.materialCard}>
        <Card.Content>
          <View style={styles.materialHeader}>
            <View style={styles.materialInfo}>
              <Text style={styles.materialName}>{item.name}</Text>
              <Text style={styles.materialCategory}>{item.category}</Text>
            </View>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.materialImage} />
            )}
          </View>

          <View style={styles.materialDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>單價:</Text>
              <Text style={styles.detailValue}>NT$ {item.price?.toLocaleString() || '0'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>庫存:</Text>
              <View style={styles.stockInfo}>
                <Text style={styles.detailValue}>
                  {item.stockQuantity} {item.unit}
                </Text>
                <Chip
                  mode="outlined"
                  textStyle={{ color: stockStatus.color, fontSize: 10 }}
                  style={{ 
                    borderColor: stockStatus.color,
                    height: 24,
                    marginLeft: 8,
                  }}
                >
                  {stockStatus.label}
                </Chip>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('MaterialDetail', { materialId: item.id })}
              style={styles.actionButton}
              compact
            >
              查看詳情
            </Button>
            <Button
              mode="contained"
              onPress={() => showStockUpdateDialog(item)}
              style={styles.actionButton}
              compact
            >
              更新庫存
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={getCategories()}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <Chip
            mode={selectedCategory === item.key ? 'flat' : 'outlined'}
            selected={selectedCategory === item.key}
            onPress={() => setSelectedCategory(item.key)}
            style={styles.categoryChip}
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
          placeholder="搜尋材料..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={filteredMaterials}
        renderItem={renderMaterialItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant-closed" size={64} color="#ccc" />
            <Text style={styles.emptyText}>暫無材料數據</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateMaterial')}
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
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
  },
  materialCard: {
    marginBottom: 12,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  materialCategory: {
    fontSize: 14,
    color: '#666',
  },
  materialImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  materialDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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