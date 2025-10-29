import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import {
  useGetStatusesQuery,
  useGetStatusCategoriesQuery,
  useGetAllStatusHistoryQuery,
  SystemStatus,
  StatusHistory,
} from '../store/api/statusApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setFilters, clearFilters, selectStatusFilters } from '../store/slices/statusSlice';
import { useStatusSync } from '../hooks/useStatusSync';
import StatusUpdateForm from '../components/forms/StatusUpdateForm';

interface StatusItemProps {
  status: SystemStatus;
  onPress: () => void;
  onUpdate: (status: SystemStatus) => void;
}

const StatusItem: React.FC<StatusItemProps> = ({ status, onPress, onUpdate }) => {
  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'TEXT':
        return 'text';
      case 'NUMBER':
        return 'numeric';
      case 'BOOLEAN':
        return 'toggle-switch';
      case 'DATE':
        return 'calendar';
      default:
        return 'information';
    }
  };

  const formatValue = (value: string, type: string) => {
    switch (type) {
      case 'BOOLEAN':
        return value === 'true' ? '是' : '否';
      case 'DATE':
        return new Date(value).toLocaleDateString('zh-TW');
      default:
        return value;
    }
  };

  return (
    <TouchableOpacity style={styles.statusItem} onPress={onPress}>
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <MaterialCommunityIcons
            name={getStatusIcon(status.type) as any}
            size={24}
            color="#007bff"
            style={styles.statusIcon}
          />
          <View style={styles.statusDetails}>
            <Text style={styles.statusName}>{status.name}</Text>
            <Text style={styles.statusCategory}>{status.category}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => onUpdate(status)}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#007bff" />
        </TouchableOpacity>
      </View>
      <View style={styles.statusValue}>
        <Text style={styles.valueLabel}>當前值:</Text>
        <Text style={styles.valueText}>{formatValue(status.value, status.type)}</Text>
      </View>
      {status.description && (
        <Text style={styles.statusDescription}>{status.description}</Text>
      )}
      <Text style={styles.statusUpdated}>
        更新時間: {new Date(status.updatedAt).toLocaleString('zh-TW')}
      </Text>
    </TouchableOpacity>
  );
};

const StatusManagementScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectStatusFilters);
  
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SystemStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '');

  // Real-time sync hook
  const { syncStatuses, isConnected, isRealTimeEnabled } = useStatusSync({
    enableRealTime: true,
    autoReconnect: true,
  });

  // API hooks
  const {
    data: statuses = [],
    isLoading,
    error,
    refetch,
  } = useGetStatusesQuery(filters);

  const { data: categories = [] } = useGetStatusCategoriesQuery();

  const {
    data: historyData,
    isLoading: historyLoading,
  } = useGetAllStatusHistoryQuery(
    { statusId: selectedStatus?.id },
    { skip: !selectedStatus || !showHistoryModal }
  );



  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        syncStatuses(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, syncStatuses]);

  // Focus effect to refresh data
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Filter handlers
  const handleApplyFilters = () => {
    dispatch(setFilters({
      searchTerm: searchTerm.trim() || undefined,
      category: selectedCategory || undefined,
    }));
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    dispatch(clearFilters());
    setShowFilters(false);
  };

  // Status update handlers
  const handleUpdatePress = (status: SystemStatus) => {
    setSelectedStatus(status);
    setShowUpdateModal(true);
  };

  const handleUpdateComplete = (success: boolean) => {
    setShowUpdateModal(false);
    setSelectedStatus(null);
    if (success) {
      // Optionally refresh the list or rely on real-time updates
      refetch();
    }
  };

  // History handlers
  const handleShowHistory = (status: SystemStatus) => {
    setSelectedStatus(status);
    setShowHistoryModal(true);
  };

  const renderStatusItem = ({ item }: { item: SystemStatus }) => (
    <StatusItem
      status={item}
      onPress={() => handleShowHistory(item)}
      onUpdate={handleUpdatePress}
    />
  );

  const renderHistoryItem = ({ item }: { item: StatusHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>
          {new Date(item.updatedAt).toLocaleString('zh-TW')}
        </Text>
        <Text style={styles.historyUser}>{item.updatedBy}</Text>
      </View>
      <View style={styles.historyChange}>
        <Text style={styles.historyLabel}>變更:</Text>
        <Text style={styles.historyValue}>
          {item.oldValue} → {item.newValue}
        </Text>
      </View>
      {item.reason && (
        <Text style={styles.historyReason}>原因: {item.reason}</Text>
      )}
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#dc3545" />
          <Text style={styles.errorText}>載入狀態資料失敗</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>重試</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>狀態管理</Text>
          {isRealTimeEnabled && (
            <View style={styles.syncStatus}>
              <MaterialCommunityIcons
                name={isConnected() ? "wifi" : "wifi-off"}
                size={16}
                color={isConnected() ? "#28a745" : "#dc3545"}
              />
              <Text style={[
                styles.syncStatusText,
                { color: isConnected() ? "#28a745" : "#dc3545" }
              ]}>
                {isConnected() ? "即時同步" : "離線"}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <MaterialCommunityIcons name="filter" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Status List */}
      <FlatList
        data={statuses}
        renderItem={renderStatusItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="database-off" size={48} color="#666" />
            <Text style={styles.emptyText}>
              {isLoading ? '載入中...' : '沒有找到狀態資料'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>篩選條件</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Search */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>搜尋</Text>
              <TextInput
                style={styles.filterInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="輸入狀態名稱或描述"
                placeholderTextColor="#999"
              />
            </View>

            {/* Category */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>類別</Text>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    !selectedCategory && styles.categoryItemSelected,
                  ]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      !selectedCategory && styles.categoryTextSelected,
                    ]}
                  >
                    全部
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryItem,
                      selectedCategory === category && styles.categoryItemSelected,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category && styles.categoryTextSelected,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearButtonText}>清除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>套用</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>更新狀態</Text>
            <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedStatus && (
            <StatusUpdateForm
              status={selectedStatus}
              onUpdate={handleUpdateComplete}
              onCancel={() => setShowUpdateModal(false)}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedStatus?.name} - 歷史記錄
            </Text>
            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={historyData?.history || []}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="history" size={48} color="#666" />
                <Text style={styles.emptyText}>
                  {historyLoading ? '載入中...' : '沒有歷史記錄'}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  filterButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  statusItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusDetails: {
    flex: 1,
  },
  statusName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statusCategory: {
    fontSize: 14,
    color: '#666',
  },
  updateButton: {
    padding: 8,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusUpdated: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryItemSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 6,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  statusInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyList: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historyUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  historyChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyReason: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default StatusManagementScreen;