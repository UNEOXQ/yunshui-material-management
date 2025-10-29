import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { NetworkState } from '../types';
import { OfflineService } from './offlineService';

export class NetworkService {
  private static subscription: NetInfoSubscription | null = null;
  private static listeners: ((networkState: NetworkState) => void)[] = [];
  private static currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: 'unknown',
  };

  // 初始化網路監控
  static async initialize(): Promise<void> {
    try {
      // 獲取當前網路狀態
      const state = await NetInfo.fetch();
      this.updateNetworkState(state);

      // 監聽網路狀態變化
      this.subscription = NetInfo.addEventListener(this.handleNetworkStateChange.bind(this));
      
      console.log('Network service initialized successfully');
    } catch (error) {
      console.error('Error initializing network service:', error);
      throw error;
    }
  }

  // 處理網路狀態變化
  private static handleNetworkStateChange(state: NetInfoState): void {
    const previousState = { ...this.currentState };
    this.updateNetworkState(state);

    // 檢查是否從離線變為在線
    if (!previousState.isConnected && this.currentState.isConnected) {
      console.log('Network connection restored');
      this.onNetworkRestored();
    }

    // 檢查是否從在線變為離線
    if (previousState.isConnected && !this.currentState.isConnected) {
      console.log('Network connection lost');
      this.onNetworkLost();
    }

    // 通知所有監聽器
    this.notifyListeners(this.currentState);
  }

  // 更新網路狀態
  private static updateNetworkState(state: NetInfoState): void {
    this.currentState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    };

    // 保存到離線服務
    OfflineService.setNetworkState(this.currentState);
  }

  // 網路恢復時的處理
  private static onNetworkRestored(): void {
    // 觸發自動同步
    import('./syncService').then(({ SyncService }) => {
      SyncService.triggerAutoSync();
    });
  }

  // 網路斷開時的處理
  private static onNetworkLost(): void {
    console.log('Switched to offline mode');
  }

  // 通知所有監聽器
  private static notifyListeners(networkState: NetworkState): void {
    this.listeners.forEach(listener => {
      try {
        listener(networkState);
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });
  }

  // 添加網路狀態監聽器
  static addListener(listener: (networkState: NetworkState) => void): () => void {
    this.listeners.push(listener);
    
    // 立即調用一次監聽器，提供當前狀態
    listener(this.currentState);

    // 返回取消監聽的函數
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 移除網路狀態監聽器
  static removeListener(listener: (networkState: NetworkState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 獲取當前網路狀態
  static getCurrentState(): NetworkState {
    return { ...this.currentState };
  }

  // 檢查是否在線
  static isOnline(): boolean {
    return this.currentState.isConnected;
  }

  // 檢查是否可以訪問互聯網
  static isInternetReachable(): boolean {
    return this.currentState.isInternetReachable === true;
  }

  // 檢查是否為 WiFi 連接
  static isWiFiConnection(): boolean {
    return this.currentState.type === 'wifi';
  }

  // 檢查是否為蜂窩網路連接
  static isCellularConnection(): boolean {
    return this.currentState.type === 'cellular';
  }

  // 手動刷新網路狀態
  static async refresh(): Promise<NetworkState> {
    try {
      const state = await NetInfo.fetch();
      this.updateNetworkState(state);
      this.notifyListeners(this.currentState);
      return this.currentState;
    } catch (error) {
      console.error('Error refreshing network state:', error);
      return this.currentState;
    }
  }

  // 測試網路連接
  static async testConnection(url: string = 'https://www.google.com', timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Network connection test failed:', error);
      return false;
    }
  }

  // 等待網路連接
  static async waitForConnection(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        removeListener();
        resolve(false);
      }, timeout);

      const removeListener = this.addListener((networkState) => {
        if (networkState.isConnected) {
          clearTimeout(timeoutId);
          removeListener();
          resolve(true);
        }
      });
    });
  }

  // 清理資源
  static cleanup(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners = [];
    console.log('Network service cleaned up');
  }

  // 獲取網路類型描述
  static getConnectionTypeDescription(): string {
    const { type, isConnected } = this.currentState;
    
    if (!isConnected) {
      return '離線';
    }

    switch (type) {
      case 'wifi':
        return 'WiFi';
      case 'cellular':
        return '行動網路';
      case 'ethernet':
        return '有線網路';
      case 'bluetooth':
        return '藍牙';
      case 'wimax':
        return 'WiMAX';
      case 'vpn':
        return 'VPN';
      default:
        return '未知網路';
    }
  }

  // 檢查是否應該進行同步（基於網路類型和設定）
  static shouldSync(wifiOnly: boolean = false): boolean {
    if (!this.isOnline()) {
      return false;
    }

    if (wifiOnly && !this.isWiFiConnection()) {
      return false;
    }

    return this.isInternetReachable();
  }
}