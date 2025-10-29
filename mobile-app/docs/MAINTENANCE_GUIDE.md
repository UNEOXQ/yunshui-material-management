# 維護指南

## 概述

本指南提供雲水基材管理系統 Mobile App 的日常維護、監控、更新和故障排除指南。

## 日常維護

### 系統監控

#### 1. 應用程式效能監控
```bash
# 檢查應用程式狀態
npm run status:check

# 查看效能指標
npm run performance:report

# 檢查記憶體使用
npm run memory:analyze
```

#### 2. API 健康檢查
```javascript
// scripts/health-check.js
const axios = require('axios');

const healthCheck = async () => {
  try {
    const response = await axios.get('https://api.yunshui.com/v1/health');
    console.log('API Status:', response.data.status);
    console.log('Response Time:', response.headers['x-response-time']);
  } catch (error) {
    console.error('API Health Check Failed:', error.message);
  }
};

healthCheck();
```

#### 3. 錯誤監控
- 使用 Sentry 或類似服務監控崩潰
- 定期檢查錯誤日誌
- 監控 API 錯誤率

### 定期維護任務

#### 每日檢查
- [ ] 檢查應用程式崩潰報告
- [ ] 監控 API 回應時間
- [ ] 檢查用戶反饋和評論
- [ ] 驗證關鍵功能正常運作

#### 每週檢查
- [ ] 更新依賴套件
- [ ] 檢查安全漏洞
- [ ] 分析效能指標
- [ ] 備份重要配置檔案

#### 每月檢查
- [ ] 檢查應用商店政策更新
- [ ] 評估新功能需求
- [ ] 進行完整的功能測試
- [ ] 更新文件和指南

## 版本更新

### 依賴套件更新

#### 1. 檢查過期套件
```bash
# 檢查過期的套件
npm outdated

# 檢查安全漏洞
npm audit

# 自動修復安全問題
npm audit fix
```

#### 2. 更新策略
```bash
# 更新次要版本 (安全)
npm update

# 更新主要版本 (需要測試)
npm install package@latest

# 更新所有套件到最新版本 (謹慎使用)
npx npm-check-updates -u
npm install
```

#### 3. 更新後驗證
```bash
# 執行測試
npm test

# 檢查建置
npm run build:android:debug

# 檢查類型
npm run type-check
```

### 應用程式版本更新

#### 1. 版本號管理
```bash
# 查看當前版本
npm run version:show

# 自動增加修訂版本號 (1.0.0 -> 1.0.1)
npm run version:bump

# 增加次版本號 (1.0.1 -> 1.1.0)
npm run version:bump:minor

# 增加主版本號 (1.1.0 -> 2.0.0)
npm run version:bump:major
```

#### 2. 發布流程
```bash
# 準備發布
npm run prepare:release

# 建置生產版本
npm run build:auto:production

# 發布到應用商店
# (手動上傳到 Google Play Console / App Store Connect)
```

### 熱更新 (OTA Updates)

#### 1. 發布熱更新
```bash
# 發布到生產環境
eas update --branch production --message "修復登入問題"

# 發布到測試環境
eas update --branch staging --message "新增功能測試"
```

#### 2. 回滾更新
```bash
# 查看更新歷史
eas update:list --branch production

# 回滾到特定版本
eas update:republish --branch production --group [GROUP_ID]
```

## 效能優化

### 應用程式效能

#### 1. 記憶體優化
```javascript
// utils/memoryOptimizer.js
class MemoryOptimizer {
  static clearImageCache() {
    // 清除圖片快取
    if (global.gc) {
      global.gc();
    }
  }

  static optimizeListRendering(data, itemHeight) {
    return {
      data,
      getItemLayout: (data, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      }),
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      windowSize: 10,
    };
  }
}
```

#### 2. 網路優化
```javascript
// services/networkOptimizer.js
import NetInfo from '@react-native-community/netinfo';

class NetworkOptimizer {
  static async checkConnection() {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected,
      type: state.type,
      isWifiEnabled: state.type === 'wifi',
    };
  }

  static optimizeForConnection(connectionType) {
    switch (connectionType) {
      case 'wifi':
        return { imageQuality: 1.0, batchSize: 20 };
      case 'cellular':
        return { imageQuality: 0.7, batchSize: 10 };
      default:
        return { imageQuality: 0.5, batchSize: 5 };
    }
  }
}
```

### 資料庫優化

#### 1. 查詢優化
```sql
-- 檢查慢查詢
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 分析查詢計劃
EXPLAIN ANALYZE SELECT * FROM materials 
WHERE category = 'steel' 
ORDER BY created_at DESC 
LIMIT 20;
```

#### 2. 索引維護
```sql
-- 檢查索引使用情況
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 重建索引
REINDEX INDEX idx_materials_category;
```

## 故障排除

### 常見問題診斷

#### 1. 應用程式崩潰
```bash
# 檢查崩潰日誌
adb logcat | grep -i "yunshui"  # Android
# iOS: 使用 Xcode Console

# 分析崩潰報告
npm run crash:analyze
```

#### 2. 效能問題
```javascript
// utils/performanceMonitor.js
class PerformanceMonitor {
  static measureRenderTime(componentName, renderFunction) {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    
    console.log(`${componentName} render time: ${endTime - startTime}ms`);
    return result;
  }

  static trackMemoryUsage() {
    if (performance.memory) {
      console.log('Memory usage:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB',
      });
    }
  }
}
```

#### 3. 網路問題
```javascript
// utils/networkDiagnostics.js
class NetworkDiagnostics {
  static async testApiConnection() {
    const endpoints = [
      '/health',
      '/auth/ping',
      '/materials?limit=1',
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        await api.get(endpoint);
        const responseTime = Date.now() - startTime;
        console.log(`${endpoint}: ${responseTime}ms`);
      } catch (error) {
        console.error(`${endpoint}: Failed - ${error.message}`);
      }
    }
  }

  static async measureBandwidth() {
    const testImageUrl = 'https://via.placeholder.com/1024x1024.jpg';
    const startTime = Date.now();
    
    try {
      const response = await fetch(testImageUrl);
      const blob = await response.blob();
      const endTime = Date.now();
      const sizeInMB = blob.size / (1024 * 1024);
      const timeInSeconds = (endTime - startTime) / 1000;
      const speedMbps = (sizeInMB * 8) / timeInSeconds;
      
      console.log(`Bandwidth: ${speedMbps.toFixed(2)} Mbps`);
    } catch (error) {
      console.error('Bandwidth test failed:', error);
    }
  }
}
```

### 緊急修復流程

#### 1. 嚴重錯誤修復
```bash
# 1. 建立緊急修復分支
git checkout -b hotfix/critical-bug-fix

# 2. 修復問題
# (進行必要的程式碼修改)

# 3. 測試修復
npm test
npm run build:android:debug

# 4. 發布熱更新
eas update --branch production --message "緊急修復: 修復登入問題"

# 5. 合併到主分支
git checkout main
git merge hotfix/critical-bug-fix
git tag v1.0.1
```

#### 2. 回滾策略
```bash
# 回滾熱更新
eas update:republish --branch production --group [PREVIOUS_GROUP_ID]

# 回滾應用商店版本 (需要手動操作)
# 1. 登入 Google Play Console / App Store Connect
# 2. 停用當前版本
# 3. 啟用前一個穩定版本
```

## 監控和警報

### 設置監控

#### 1. Sentry 錯誤監控
```javascript
// utils/errorTracking.js
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production',
});

export const trackError = (error, context = {}) => {
  Sentry.captureException(error, {
    tags: context,
  });
};

export const trackEvent = (eventName, data = {}) => {
  Sentry.addBreadcrumb({
    message: eventName,
    data,
    level: 'info',
  });
};
```

#### 2. 效能監控
```javascript
// utils/performanceTracking.js
class PerformanceTracker {
  static trackScreenLoad(screenName) {
    const startTime = Date.now();
    
    return () => {
      const loadTime = Date.now() - startTime;
      console.log(`Screen ${screenName} loaded in ${loadTime}ms`);
      
      // 發送到分析服務
      analytics.track('screen_load_time', {
        screen: screenName,
        duration: loadTime,
      });
    };
  }

  static trackApiCall(endpoint, method) {
    const startTime = Date.now();
    
    return (success, statusCode) => {
      const duration = Date.now() - startTime;
      
      analytics.track('api_call', {
        endpoint,
        method,
        success,
        statusCode,
        duration,
      });
    };
  }
}
```

### 警報設置

#### 1. 錯誤率警報
```javascript
// 當錯誤率超過 5% 時發送警報
const ERROR_THRESHOLD = 0.05;

const checkErrorRate = async () => {
  const stats = await getAppStats();
  const errorRate = stats.errors / stats.totalRequests;
  
  if (errorRate > ERROR_THRESHOLD) {
    sendAlert({
      type: 'high_error_rate',
      message: `錯誤率過高: ${(errorRate * 100).toFixed(2)}%`,
      severity: 'critical',
    });
  }
};
```

#### 2. 效能警報
```javascript
// 當 API 回應時間超過 3 秒時發送警報
const RESPONSE_TIME_THRESHOLD = 3000;

const checkApiPerformance = async () => {
  const avgResponseTime = await getAverageResponseTime();
  
  if (avgResponseTime > RESPONSE_TIME_THRESHOLD) {
    sendAlert({
      type: 'slow_api_response',
      message: `API 回應時間過慢: ${avgResponseTime}ms`,
      severity: 'warning',
    });
  }
};
```

## 備份和恢復

### 配置備份

#### 1. 自動備份腳本
```bash
#!/bin/bash
# scripts/backup-config.sh

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# 備份配置檔案
cp .env $BACKUP_DIR/
cp eas.json $BACKUP_DIR/
cp package.json $BACKUP_DIR/
cp app.json $BACKUP_DIR/

# 備份重要腳本
cp -r scripts/ $BACKUP_DIR/

# 壓縮備份
tar -czf "${BACKUP_DIR}.tar.gz" $BACKUP_DIR
rm -rf $BACKUP_DIR

echo "備份完成: ${BACKUP_DIR}.tar.gz"
```

#### 2. 恢復腳本
```bash
#!/bin/bash
# scripts/restore-config.sh

if [ -z "$1" ]; then
  echo "使用方式: ./restore-config.sh <backup_file.tar.gz>"
  exit 1
fi

BACKUP_FILE=$1
RESTORE_DIR="./restore_temp"

# 解壓縮備份
tar -xzf $BACKUP_FILE -C ./
mv ./backups/*/* $RESTORE_DIR/

# 恢復配置檔案
cp $RESTORE_DIR/.env ./
cp $RESTORE_DIR/eas.json ./
cp $RESTORE_DIR/package.json ./
cp $RESTORE_DIR/app.json ./

# 清理
rm -rf $RESTORE_DIR

echo "配置恢復完成"
```

### 資料備份

#### 1. 本地資料備份
```javascript
// utils/dataBackup.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class DataBackup {
  static async backupUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const settings = await AsyncStorage.getItem('appSettings');
      const cache = await AsyncStorage.getItem('apiCache');
      
      const backup = {
        userData: userData ? JSON.parse(userData) : null,
        settings: settings ? JSON.parse(settings) : null,
        cache: cache ? JSON.parse(cache) : null,
        timestamp: new Date().toISOString(),
      };
      
      return backup;
    } catch (error) {
      console.error('備份失敗:', error);
      throw error;
    }
  }

  static async restoreUserData(backup) {
    try {
      if (backup.userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(backup.userData));
      }
      if (backup.settings) {
        await AsyncStorage.setItem('appSettings', JSON.stringify(backup.settings));
      }
      if (backup.cache) {
        await AsyncStorage.setItem('apiCache', JSON.stringify(backup.cache));
      }
      
      console.log('資料恢復完成');
    } catch (error) {
      console.error('恢復失敗:', error);
      throw error;
    }
  }
}
```

## 安全維護

### 安全檢查

#### 1. 依賴套件安全掃描
```bash
# 檢查已知安全漏洞
npm audit

# 自動修復
npm audit fix

# 檢查過期套件
npm outdated

# 使用 Snyk 進行深度掃描
npx snyk test
```

#### 2. 程式碼安全檢查
```bash
# 使用 ESLint 安全規則
npm install --save-dev eslint-plugin-security

# 在 .eslintrc.js 中添加
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"]
}
```

### 憑證管理

#### 1. JWT Token 安全
```javascript
// utils/tokenSecurity.js
import * as Keychain from 'react-native-keychain';

class TokenSecurity {
  static async storeToken(token) {
    try {
      await Keychain.setInternetCredentials(
        'auth_token',
        'token',
        token,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
          authenticatePrompt: '請驗證身份以存取應用程式',
        }
      );
    } catch (error) {
      console.error('Token 儲存失敗:', error);
    }
  }

  static async getToken() {
    try {
      const credentials = await Keychain.getInternetCredentials('auth_token');
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Token 讀取失敗:', error);
      return null;
    }
  }

  static async clearToken() {
    try {
      await Keychain.resetInternetCredentials('auth_token');
    } catch (error) {
      console.error('Token 清除失敗:', error);
    }
  }
}
```

## 文件維護

### 文件更新流程

1. **定期檢查**: 每月檢查文件是否需要更新
2. **版本同步**: 確保文件版本與應用程式版本同步
3. **內容驗證**: 驗證文件內容的準確性
4. **格式統一**: 保持文件格式的一致性

### 文件檢查清單

- [ ] API 文件是否反映最新的端點變更
- [ ] 安裝指南是否包含最新的系統需求
- [ ] 故障排除指南是否涵蓋新發現的問題
- [ ] 程式碼範例是否使用最新的語法和最佳實踐
- [ ] 截圖和圖表是否需要更新

---

**最後更新**: 2024年10月  
**文件版本**: 1.0.0  
**維護週期**: 每月更新