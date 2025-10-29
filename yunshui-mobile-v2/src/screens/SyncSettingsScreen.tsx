import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Switch,
  Button,
  Card,
  Title,
  Paragraph,
  Divider,
  List,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useSyncSettings, useSync, useOfflineActions } from '../hooks/useSync';
import { SyncStatus } from '../components/common/SyncStatus';
import { SyncService } from '../services/syncService';
import { OfflineService } from '../services/offlineService';

export const SyncSettingsScreen: React.FC = () => {
  const { settings, isLoading, updateSettings } = useSyncSettings();
  const { manualSync, forceSync, lastSyncResult } = useSync();
  const { pendingActions, refreshPendingActions } = useOfflineActions();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAutoSyncToggle = async (value: boolean) => {
    try {
      setIsUpdating(true);
      await updateSettings({ autoSync: value });
      showSnackbar(value ? '自動同步已啟用' : '自動同步已停用');
    } catch (error) {
      console.error('Error updating auto sync:', error);
      showSnackbar('更新設定失敗');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWifiOnlyToggle = async (value: boolean) => {
    try {
      setIsUpdating(true);
      await updateSettings({ wifiOnly: value });
      showSnackbar(value ? '已設定僅在 WiFi 下同步' : '已允許使用行動網路同步');
    } catch (error) {
      console.error('Error updating wifi only:', error);
      showSnackbar('更新設定失敗');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSyncIntervalChange = async (interval: number) => {
    try {
      setIsUpdating(true);
      await updateSettings({ syncInterval: interval });
      showSnackbar(`同步間隔已設定為 ${interval} 分鐘`);
    } catch (error) {
      console.error('Error updating sync interval:', error);
      showSnackbar('更新設定失敗');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualSync = async () => {
    try {
      await manualSync();
      showSnackbar('手動同步完成');
      refreshPendingActions();
    } catch (error) {
      console.error('Manual sync failed:', error);
      showSnackbar('手動同步失敗');
    }
  };

  const handleForceSync = async () => {
    Alert.alert(
      '強制同步',
      '這將忽略網路限制進行同步，可能會消耗較多流量。確定要繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: async () => {
            try {
              await forceSync();
              showSnackbar('強制同步完成');
              refreshPendingActions();
            } catch (error) {
              console.error('Force sync failed:', error);
              showSnackbar('強制同步失敗');
            }
          },
        },
      ]
    );
  };

  const handleClearOfflineData = async () => {
    Alert.alert(
      '清除離線數據',
      '這將刪除所有本地快取的數據和未同步的操作。確定要繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'destructive',
          onPress: async () => {
            try {
              await OfflineService.clearOfflineData();
              showSnackbar('離線數據已清除');
              refreshPendingActions();
            } catch (error) {
              console.error('Error clearing offline data:', error);
              showSnackbar('清除數據失敗');
            }
          },
        },
      ]
    );
  };

  const handleResetSyncState = async () => {
    Alert.alert(
      '重置同步狀態',
      '這將重置同步狀態，清除已同步的操作記錄。確定要繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'destructive',
          onPress: async () => {
            try {
              await SyncService.resetSyncState();
              showSnackbar('同步狀態已重置');
              refreshPendingActions();
            } catch (error) {
              console.error('Error resetting sync state:', error);
              showSnackbar('重置同步狀態失敗');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>載入同步設定中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 同步狀態 */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>同步狀態</Title>
          <SyncStatus showDetails />
          {pendingActions > 0 && (
            <Paragraph style={styles.pendingText}>
              有 {pendingActions} 項操作等待同步
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* 同步設定 */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>同步設定</Title>
          
          <List.Item
            title="自動同步"
            description="在背景自動同步數據"
            right={() => (
              <Switch
                value={settings.autoSync}
                onValueChange={handleAutoSyncToggle}
                disabled={isUpdating}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="僅在 WiFi 下同步"
            description="避免使用行動網路進行同步"
            right={() => (
              <Switch
                value={settings.wifiOnly}
                onValueChange={handleWifiOnlyToggle}
                disabled={isUpdating}
              />
            )}
          />
          
          <Divider />
          
          <View style={styles.intervalSection}>
            <Text style={styles.intervalTitle}>同步間隔</Text>
            <Text style={styles.intervalDescription}>
              自動同步的時間間隔
            </Text>
            <View style={styles.intervalButtons}>
              {[1, 5, 15, 30, 60].map((interval) => (
                <Button
                  key={interval}
                  mode={settings.syncInterval === interval ? 'contained' : 'outlined'}
                  onPress={() => handleSyncIntervalChange(interval)}
                  disabled={isUpdating}
                  style={styles.intervalButton}
                  compact
                >
                  {interval}分
                </Button>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 手動操作 */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>手動操作</Title>
          
          <Button
            mode="contained"
            onPress={handleManualSync}
            style={styles.actionButton}
            icon="sync"
          >
            立即同步
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleForceSync}
            style={styles.actionButton}
            icon="sync-alert"
          >
            強制同步
          </Button>
        </Card.Content>
      </Card>

      {/* 數據管理 */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>數據管理</Title>
          
          <Button
            mode="outlined"
            onPress={handleClearOfflineData}
            style={styles.actionButton}
            icon="delete-sweep"
            textColor="#FF5722"
          >
            清除離線數據
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleResetSyncState}
            style={styles.actionButton}
            icon="restore"
            textColor="#FF5722"
          >
            重置同步狀態
          </Button>
        </Card.Content>
      </Card>

      {/* 同步結果 */}
      {lastSyncResult && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>最近同步結果</Title>
            <View style={styles.syncResult}>
              <Text style={[
                styles.syncResultText,
                { color: lastSyncResult.success ? '#4CAF50' : '#F44336' }
              ]}>
                {lastSyncResult.success ? '同步成功' : '同步失敗'}
              </Text>
              <Text style={styles.syncResultDetail}>
                已同步: {lastSyncResult.syncedActions} 項
              </Text>
              {lastSyncResult.failedActions > 0 && (
                <Text style={styles.syncResultDetail}>
                  失敗: {lastSyncResult.failedActions} 項
                </Text>
              )}
              {lastSyncResult.errors.length > 0 && (
                <Text style={styles.errorText}>
                  錯誤: {lastSyncResult.errors[0]}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  pendingText: {
    marginTop: 8,
    color: '#FF5722',
    fontWeight: '500',
  },
  intervalSection: {
    paddingVertical: 16,
  },
  intervalTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  intervalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  intervalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalButton: {
    minWidth: 60,
  },
  actionButton: {
    marginVertical: 4,
  },
  syncResult: {
    marginTop: 8,
  },
  syncResultText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  syncResultDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
});

export default SyncSettingsScreen;