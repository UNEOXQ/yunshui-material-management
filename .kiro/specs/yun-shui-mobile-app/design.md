# 雲水基材管理系統 Mobile App 設計文件

## Overview

雲水基材管理系統 Mobile App 將使用 React Native 框架開發，提供跨平台的原生應用體驗。APP 將重用現有的後端 API，確保與網頁版系統的完全同步。設計重點在於移動設備的用戶體驗優化，包括觸控友好的界面、相機整合和離線功能支援。

## Architecture

### 技術架構

```
┌─────────────────────────────────────┐
│           Mobile App Layer          │
│  ┌─────────────┐ ┌─────────────────┐│
│  │   iOS App   │ │  Android App    ││
│  │             │ │                 ││
│  └─────────────┘ └─────────────────┘│
└─────────────────────────────────────┘
                    │
                    │ HTTP/HTTPS
                    │
┌─────────────────────────────────────┐
│        Existing Backend API         │
│  ┌─────────────┐ ┌─────────────────┐│
│  │   Node.js   │ │   PostgreSQL    ││
│  │   Express   │ │   Database      ││
│  └─────────────┘ └─────────────────┘│
└─────────────────────────────────────┘
```

### 技術選型

- **前端框架**: React Native 0.72+
- **狀態管理**: Redux Toolkit + RTK Query
- **導航**: React Navigation 6
- **UI 組件庫**: React Native Elements / NativeBase
- **圖片處理**: react-native-image-picker + react-native-image-resizer
- **網路請求**: Axios (與現有 API 保持一致)
- **本地儲存**: AsyncStorage + SQLite (離線功能)
- **推播通知**: React Native Push Notification

## Components and Interfaces

### 核心組件架構

```
src/
├── components/           # 可重用 UI 組件
│   ├── common/          # 通用組件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Loading.tsx
│   │   └── ImagePicker.tsx
│   ├── forms/           # 表單組件
│   │   ├── MaterialForm.tsx
│   │   ├── OrderForm.tsx
│   │   └── LoginForm.tsx
│   └── lists/           # 列表組件
│       ├── MaterialList.tsx
│       ├── OrderList.tsx
│       └── StatusList.tsx
├── screens/             # 頁面組件
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── SplashScreen.tsx
│   ├── materials/
│   │   ├── MaterialListScreen.tsx
│   │   ├── MaterialDetailScreen.tsx
│   │   └── MaterialFormScreen.tsx
│   ├── orders/
│   │   ├── OrderListScreen.tsx
│   │   ├── OrderDetailScreen.tsx
│   │   └── OrderFormScreen.tsx
│   └── status/
│       └── StatusManagementScreen.tsx
├── services/            # API 服務層
│   ├── api.ts          # API 配置
│   ├── authService.ts  # 認證服務
│   ├── materialService.ts
│   ├── orderService.ts
│   └── uploadService.ts
├── store/              # Redux 狀態管理
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── materialSlice.ts
│   │   ├── orderSlice.ts
│   │   └── statusSlice.ts
│   └── store.ts
├── navigation/         # 導航配置
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── TabNavigator.tsx
└── utils/              # 工具函數
    ├── storage.ts      # 本地儲存
    ├── validation.ts   # 表單驗證
    └── helpers.ts      # 通用工具
```

### API 服務層設計

```typescript
// services/api.ts
class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = 'https://your-backend-api.com';
    this.token = null;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  async request(endpoint: string, options: RequestOptions) {
    // 統一的 API 請求處理
    // 包含錯誤處理、重試機制、離線檢測
  }
}
```

### 狀態管理設計

```typescript
// store/slices/materialSlice.ts
interface MaterialState {
  materials: Material[];
  loading: boolean;
  error: string | null;
  selectedMaterial: Material | null;
  filters: MaterialFilters;
}

// RTK Query API 定義
export const materialApi = createApi({
  reducerPath: 'materialApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/materials',
    prepareHeaders: (headers, { getState }) => {
      const token = selectAuthToken(getState());
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Material'],
  endpoints: (builder) => ({
    getMaterials: builder.query<Material[], void>({
      query: () => '',
      providesTags: ['Material'],
    }),
    createMaterial: builder.mutation<Material, CreateMaterialRequest>({
      query: (material) => ({
        url: '',
        method: 'POST',
        body: material,
      }),
      invalidatesTags: ['Material'],
    }),
  }),
});
```

## Data Models

### 核心數據模型

```typescript
// 與現有 API 保持一致的數據模型
interface Material {
  id: string;
  name: string;
  category: string;
  specification: string;
  unit: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  materials: OrderMaterial[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderMaterial {
  materialId: string;
  material: Material;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  token: string;
}
```

### 本地儲存模型

```typescript
// 離線功能的本地數據結構
interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'MATERIAL' | 'ORDER';
  data: any;
  timestamp: number;
  synced: boolean;
}

interface CachedData {
  materials: Material[];
  orders: Order[];
  lastSync: number;
  version: string;
}
```

## Error Handling

### 錯誤處理策略

1. **網路錯誤處理**
   - 自動重試機制（最多 3 次）
   - 離線模式切換
   - 用戶友好的錯誤訊息

2. **API 錯誤處理**
   - 統一的錯誤響應格式
   - 錯誤碼對應的本地化訊息
   - 自動登出處理（401 錯誤）

3. **表單驗證錯誤**
   - 即時驗證反饋
   - 多語言錯誤訊息
   - 視覺化錯誤指示

```typescript
// utils/errorHandler.ts
export class ErrorHandler {
  static handleApiError(error: ApiError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return '網路連線異常，請檢查網路設定';
      case 'UNAUTHORIZED':
        return '登入已過期，請重新登入';
      case 'VALIDATION_ERROR':
        return error.message || '資料格式錯誤';
      default:
        return '系統發生錯誤，請稍後再試';
    }
  }

  static showError(message: string) {
    // 顯示錯誤提示（Toast 或 Alert）
  }
}
```

## Testing Strategy

### 測試架構

1. **單元測試**
   - Jest + React Native Testing Library
   - 組件邏輯測試
   - 工具函數測試
   - API 服務測試

2. **整合測試**
   - Redux 狀態管理測試
   - API 整合測試
   - 導航流程測試

3. **端到端測試**
   - Detox 自動化測試
   - 關鍵用戶流程測試
   - 跨平台兼容性測試

4. **手動測試**
   - 設備兼容性測試
   - 性能測試
   - 用戶體驗測試

### 測試覆蓋率目標

- 單元測試覆蓋率：≥ 80%
- 整合測試覆蓋率：≥ 70%
- 關鍵功能 E2E 測試：100%

## Mobile-Specific Features

### 相機整合

```typescript
// components/ImagePicker.tsx
interface ImagePickerProps {
  onImageSelected: (imageUri: string) => void;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelected,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.8,
}) => {
  const showImagePicker = () => {
    Alert.alert(
      '選擇圖片',
      '請選擇圖片來源',
      [
        { text: '相機', onPress: openCamera },
        { text: '相簿', onPress: openGallery },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const openCamera = () => {
    launchCamera({
      mediaType: 'photo',
      maxWidth,
      maxHeight,
      quality,
    }, handleImageResponse);
  };

  const openGallery = () => {
    launchImageLibrary({
      mediaType: 'photo',
      maxWidth,
      maxHeight,
      quality,
    }, handleImageResponse);
  };
};
```

### 離線功能

```typescript
// services/offlineService.ts
export class OfflineService {
  static async saveOfflineAction(action: OfflineAction) {
    const actions = await this.getOfflineActions();
    actions.push(action);
    await AsyncStorage.setItem('offlineActions', JSON.stringify(actions));
  }

  static async syncOfflineActions() {
    const actions = await this.getOfflineActions();
    const unsynced = actions.filter(action => !action.synced);
    
    for (const action of unsynced) {
      try {
        await this.executeAction(action);
        action.synced = true;
      } catch (error) {
        console.error('Sync failed for action:', action.id, error);
      }
    }
    
    await AsyncStorage.setItem('offlineActions', JSON.stringify(actions));
  }
}
```

### 推播通知

```typescript
// services/notificationService.ts
export class NotificationService {
  static async initialize() {
    const permission = await messaging().requestPermission();
    if (permission === messaging.AuthorizationStatus.AUTHORIZED) {
      const token = await messaging().getToken();
      // 將 token 發送到後端
      await this.registerDevice(token);
    }
  }

  static setupMessageHandlers() {
    // 前景訊息處理
    messaging().onMessage(async remoteMessage => {
      this.showLocalNotification(remoteMessage);
    });

    // 背景訊息處理
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message:', remoteMessage);
    });
  }
}
```

## Performance Optimization

### 性能優化策略

1. **圖片優化**
   - 自動壓縮上傳圖片
   - 使用 WebP 格式（支援的設備）
   - 圖片快取機制

2. **列表優化**
   - FlatList 虛擬化
   - 分頁載入
   - 圖片懶載入

3. **狀態管理優化**
   - RTK Query 快取
   - 選擇性重新渲染
   - 記憶化計算

4. **包大小優化**
   - 代碼分割
   - 移除未使用的依賴
   - 圖片資源優化

## Security Considerations

### 安全措施

1. **API 安全**
   - JWT Token 管理
   - 自動 Token 刷新
   - 安全的 Token 儲存

2. **數據安全**
   - 敏感數據加密
   - 安全的本地儲存
   - 網路傳輸加密

3. **應用安全**
   - 代碼混淆
   - 防止逆向工程
   - 應用簽名驗證

```typescript
// utils/security.ts
export class SecurityManager {
  static async storeSecureData(key: string, value: string) {
    // 使用 Keychain (iOS) 或 Keystore (Android)
    await Keychain.setInternetCredentials(key, key, value);
  }

  static async getSecureData(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      return credentials ? credentials.password : null;
    } catch (error) {
      return null;
    }
  }
}
```