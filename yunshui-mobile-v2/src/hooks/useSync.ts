import { useState, useEffect, useCallback } from 'react';
import { SyncService } from '../services/syncService';
import { NetworkService } from '../services/networkService';
import { OfflineService } from '../services/offlineService';
import { SyncResult, NetworkState } from '../types';

interface SyncState {
  issyncing: boolean;
  lastSyncTime: number;
  pendingActions: number;
  networkState: NetworkState;
  canSync: boolean;
  lastSyncResult: SyncResult | null;
}

interface UseSyncReturn extends SyncState {
  manualSync: () => Promise<SyncResult>;
  forceSync: () => Promise<SyncResult>;
  refreshStats: () => Promise<void>;
}

export const useSync = (): UseSyncReturn => {
  const [syncState, setSyncState] = useState<SyncState>({
    issyncing: false,
    lastSyncTime: 0,
    pendingActions: 0,
    networkState: {
      isConnected: false,
      isInternetReachable: null,
      type: 'unknown',
    },
    canSync: false,
    lastSyncResult: null,
  });

  // 刷新同步統計信息
  const refreshStats = useCallback(async () => {
    try {
      const stats = await SyncService.getSyncStats();
      const networkState = NetworkService.getCurrentState();
      
      setSyncState(prev => ({
        ...prev,
        lastSyncTime: stats.lastSyncTime,
        pendingActions: stats.pendingActions,
        networkState,
        canSync: stats.canSync,
      }));
    } catch (error) {
      console.error('Error refreshing sync stats:', error);
    }
  }, []);

  // 手動同步
  const manualSync = useCallback(async (): Promise<SyncResult> => {
    try {
      const result = await SyncService.manualSync();
      setSyncState(prev => ({
        ...prev,
        lastSyncResult: result,
      }));
      await refreshStats();
      return result;
    } catch (error) {
      console.error('Error in manual sync:', error);
      const errorResult: SyncResult = {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      };
      setSyncState(prev => ({
        ...prev,
        lastSyncResult: errorResult,
      }));
      throw error;
    }
  }, [refreshStats]);

  // 強制同步
  const forceSync = useCallback(async (): Promise<SyncResult> => {
    try {
      const result = await SyncService.forceSync();
      setSyncState(prev => ({
        ...prev,
        lastSyncResult: result,
      }));
      await refreshStats();
      return result;
    } catch (error) {
      console.error('Error in force sync:', error);
      const errorResult: SyncResult = {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      };
      setSyncState(prev => ({
        ...prev,
        lastSyncResult: errorResult,
      }));
      throw error;
    }
  }, [refreshStats]);

  useEffect(() => {
    // 初始化時獲取統計信息
    refreshStats();

    // 監聽同步狀態變化
    const removeSyncListener = SyncService.addSyncListener((issyncing, result) => {
      setSyncState(prev => ({
        ...prev,
        issyncing,
        lastSyncResult: result || prev.lastSyncResult,
      }));
      
      if (!issyncing && result) {
        // 同步完成後刷新統計信息
        refreshStats();
      }
    });

    // 監聽網路狀態變化
    const removeNetworkListener = NetworkService.addListener((networkState) => {
      setSyncState(prev => ({
        ...prev,
        networkState,
      }));
      
      // 網路狀態變化後刷新統計信息
      refreshStats();
    });

    // 定期刷新統計信息
    const statsInterval = setInterval(refreshStats, 30000); // 每30秒刷新一次

    return () => {
      removeSyncListener();
      removeNetworkListener();
      clearInterval(statsInterval);
    };
  }, [refreshStats]);

  return {
    ...syncState,
    manualSync,
    forceSync,
    refreshStats,
  };
};

// 網路狀態 Hook
export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: false,
    isInternetReachable: null,
    type: 'unknown',
  });

  useEffect(() => {
    // 獲取當前網路狀態
    const currentState = NetworkService.getCurrentState();
    setNetworkState(currentState);

    // 監聽網路狀態變化
    const removeListener = NetworkService.addListener(setNetworkState);

    return removeListener;
  }, []);

  return {
    ...networkState,
    isOnline: networkState.isConnected,
    isOffline: !networkState.isConnected,
    connectionType: NetworkService.getConnectionTypeDescription(),
    shouldSync: (wifiOnly: boolean = false) => NetworkService.shouldSync(wifiOnly),
  };
};

// 離線操作 Hook
export const useOfflineActions = () => {
  const [pendingActions, setPendingActions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPendingActions = useCallback(async () => {
    try {
      setIsLoading(true);
      const count = await OfflineService.getPendingActionsCount();
      setPendingActions(count);
    } catch (error) {
      console.error('Error refreshing pending actions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPendingActions();

    // 監聽同步狀態變化，同步完成後刷新
    const removeSyncListener = SyncService.addSyncListener((issyncing) => {
      if (!issyncing) {
        refreshPendingActions();
      }
    });

    // 定期刷新
    const interval = setInterval(refreshPendingActions, 60000); // 每分鐘刷新一次

    return () => {
      removeSyncListener();
      clearInterval(interval);
    };
  }, [refreshPendingActions]);

  return {
    pendingActions,
    isLoading,
    refreshPendingActions,
    hasPendingActions: pendingActions > 0,
  };
};

// 同步設定 Hook
export const useSyncSettings = () => {
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 5,
    wifiOnly: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const updateSettings = useCallback(async (newSettings: Partial<typeof settings>) => {
    try {
      await SyncService.updateSyncSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating sync settings:', error);
      throw error;
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const stats = await SyncService.getSyncStats();
      // 這裡需要從 SyncService 獲取設定，暫時使用默認值
      setSettings({
        autoSync: true,
        syncInterval: 5,
        wifiOnly: false,
      });
    } catch (error) {
      console.error('Error refreshing sync settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return {
    settings,
    isLoading,
    updateSettings,
    refreshSettings,
  };
};