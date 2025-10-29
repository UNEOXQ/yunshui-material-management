import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Image, Dimensions } from 'react-native';
import { Card, Text, Button, Chip, Searchbar, FAB, ActivityIndicator, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { commonStyles } from '../styles/theme';
import { materialService } from '../services/materialService';
import { MaterialStackScreenProps } from '../navigation/types';

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

const { width } = Dimensions.get('window');

type Props = MaterialStackScreenProps<'MaterialList'>;

export default function MaterialsScreen({ navigation }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'AUXILIARY' | 'FINISHED'>('ALL');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'quantity' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadMaterials(true);
  }, []);

  useEffect(() => {
    filterAndSortMaterials();
  }, [materials, searchQuery, selectedCategory, selectedType, sortBy, sortOrder]);

  const loadMaterials = async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const filters = {
        page: currentPage,
        limit: 20,
        ...(selectedType !== 'ALL' && { type: selectedType }),
        ...(selectedCategory !== 'ALL' && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
      };

      const response = await materialService.getMaterials(filters);
      
      if (reset) {
        setMaterials(response.materials);
      } else {
        setMaterials(prev => [...prev, ...response.materials]);
      }

      setHasMore(response.materials.length === 20);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('載入材料失敗:', error);
      Alert.alert('錯誤', '載入材料失敗，請稍後再試');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMaterials(true);
    setIsRefreshing(false);
  }, [selectedType, selectedCategory, searchQuery]);

  const filterAndSortMaterials = useCallback(() => {
    let filtered = [...materials];

    // 類型篩選
    if (selectedType !== 'ALL') {
      filtered = filtered.filter(material => material.type === selectedType);
    }

    // 分類篩選
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }

    // 搜尋篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(material =>
        material.name.toLowerCase().includes(query) ||
        material.category.toLowerCase().includes(query) ||
        material.specification.toLowerCase().includes(query) ||
        (material.supplier && material.supplier.toLowerCase().includes(query))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMaterials(filtered);
  }, [materials, searchQuery, selectedCategory, selectedType, sortBy, sortOrder]);

  const getCategories = () => {
    const categories = ['ALL', ...new Set(materials.map(m => m.category))];
    return categories.map(cat => ({
      key: cat,
      label: cat === 'ALL' ? '全部分類' : cat,
    }));
  };

  const getTypes = () => [
    { key: 'ALL', label: '全部類型' },
    { key: 'AUXILIARY', label: '輔助材料' },
    { key: 'FINISHED', label: '成品材料' },
  ];

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: '缺貨', color: '#dc3545' };
    if (quantity < 10) return { label: '庫存不足', color: '#ffc107' };
    return { label: '庫存充足', color: '#28a745' };
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setSortMenuVisible(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadMaterials(false);
    }
  };

  const updateStock = async (materialId: string, newQuantity: number) => {
    try {
      const updatedMaterial = await materialService.updateMaterialQuantity(materialId, newQuantity);
      
      setMaterials(prevMaterials =>
        prevMaterials.map(material =>
          material.id === materialId 
            ? { ...material, quantity: newQuantity }
            : material
        )
      );
      Alert.alert('成功', '庫存已更新');
    } catch (error) {
      console.error('更新庫存失敗:', error);
      Alert.alert('錯誤', '更新庫存失敗，請稍後再試');
    }
  };

  const showStockUpdateDialog = (material: Material) => {
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
              updateStock(material.id, newQuantity);
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

  const renderMaterialItem = ({ item }: { item: Material }) => {
    const stockStatus = getStockStatus(item.quantity);
    
    return (
      <Card style={styles.materialCard} onPress={() => navigation.navigate('MaterialDetail', { materialId: item.id })}>
        <Card.Content>
          <View style={styles.materialHeader}>
            <View style={styles.materialInfo}>
              <Text style={styles.materialName}>{item.name}</Text>
              <Text style={styles.materialCategory}>{item.category}</Text>
              <Text style={styles.materialSpec}>{item.specification}</Text>
              <View style={styles.typeChip}>
                <Chip
                  mode="outlined"
                  textStyle={{ fontSize: 10 }}
                  style={{ height: 20 }}
                >
                  {item.type === 'AUXILIARY' ? '輔助材料' : '成品材料'}
                </Chip>
              </View>
            </View>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.materialImage} />
            )}
          </View>

          <View style={styles.materialDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>規格:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{item.specification}</Text>
            </View>
            {item.supplier && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>供應商:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{item.supplier}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>庫存:</Text>
              <View style={styles.stockInfo}>
                <Text style={styles.detailValue}>
                  {item.quantity}
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
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('MaterialDetail', { materialId: item.id });
              }}
              style={styles.actionButton}
              compact
            >
              查看詳情
            </Button>
            <Button
              mode="contained"
              onPress={(e) => {
                e.stopPropagation();
                showStockUpdateDialog(item);
              }}
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

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.typeFilter}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={getTypes()}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Chip
              mode={selectedType === item.key ? 'flat' : 'outlined'}
              selected={selectedType === item.key}
              onPress={() => {
                setSelectedType(item.key as any);
                loadMaterials(true);
              }}
              style={styles.filterChip}
            >
              {item.label}
            </Chip>
          )}
        />
      </View>
      
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
              onPress={() => {
                setSelectedCategory(item.key);
                loadMaterials(true);
              }}
              style={styles.filterChip}
            >
              {item.label}
            </Chip>
          )}
        />
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="搜尋材料名稱、分類、規格或供應商..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          onSubmitEditing={() => loadMaterials(true)}
        />
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setSortMenuVisible(true)}
              style={styles.sortButton}
              compact
            >
              排序
            </Button>
          }
        >
          <Menu.Item onPress={() => handleSort('name')} title="按名稱排序" />
          <Menu.Item onPress={() => handleSort('category')} title="按分類排序" />
          <Menu.Item onPress={() => handleSort('quantity')} title="按庫存排序" />
          <Menu.Item onPress={() => handleSort('createdAt')} title="按建立時間排序" />
          <Divider />
          <Menu.Item 
            onPress={() => {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              setSortMenuVisible(false);
            }} 
            title={sortOrder === 'asc' ? '降序排列' : '升序排列'} 
          />
        </Menu>
      </View>
      {renderFilters()}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>載入更多...</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <Text>載入中...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <FlatList
        data={filteredMaterials}
        renderItem={renderMaterialItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant-closed" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategory !== 'ALL' || selectedType !== 'ALL' 
                  ? '沒有符合條件的材料' 
                  : '暫無材料數據'
                }
              </Text>
              {!searchQuery && selectedCategory === 'ALL' && selectedType === 'ALL' && (
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('MaterialForm')}
                  style={styles.emptyButton}
                >
                  新增第一個材料
                </Button>
              )}
            </View>
          ) : null
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('MaterialForm')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  sortButton: {
    minWidth: 60,
  },
  filtersContainer: {
    paddingHorizontal: 16,
  },
  typeFilter: {
    marginBottom: 8,
  },
  categoryFilter: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
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
    marginBottom: 2,
  },
  materialSpec: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  typeChip: {
    marginTop: 4,
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
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007bff',
  },
});