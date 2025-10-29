# API 服務層文件

本目錄包含雲水基材管理系統 Mobile App 的所有 API 服務層實作。

## 服務概覽

### 1. API 服務 (api.ts)
- **功能**: 統一的 HTTP 請求處理
- **特色**: 
  - 自動 Token 管理和刷新
  - 網路連線檢測
  - 錯誤處理和重試機制
  - 請求/響應攔截器

### 2. 認證服務 (authService.ts)
- **功能**: 用戶認證和授權管理
- **主要方法**:
  - `login()` - 用戶登入
  - `logout()` - 用戶登出
  - `refreshToken()` - 刷新 Access Token
  - `getProfile()` - 獲取用戶資料
  - `checkAutoLogin()` - 自動登入檢查

### 3. 基材管理服務 (materialService.ts)
- **功能**: 基材的 CRUD 操作
- **主要方法**:
  - `getMaterials()` - 獲取基材列表
  - `getMaterialById()` - 獲取基材詳情
  - `createMaterial()` - 創建新基材
  - `updateMaterial()` - 更新基材
  - `deleteMaterial()` - 刪除基材
  - `getCategories()` - 獲取分類列表
  - `getSuppliers()` - 獲取供應商列表

### 4. 訂單管理服務 (orderService.ts)
- **功能**: 訂單的完整生命週期管理
- **主要方法**:
  - `getOrders()` - 獲取訂單列表
  - `getOrderById()` - 獲取訂單詳情
  - `createOrder()` - 創建一般訂單
  - `createAuxiliaryOrder()` - 創建輔料訂單
  - `createFinishedOrder()` - 創建成品訂單
  - `updateOrderStatus()` - 更新訂單狀態
  - `cancelOrder()` - 取消訂單

### 5. 圖片上傳服務 (uploadService.ts)
- **功能**: 圖片上傳和處理
- **主要方法**:
  - `uploadMaterialImage()` - 上傳基材圖片
  - `deleteMaterialImage()` - 刪除基材圖片
  - `compressImage()` - 圖片壓縮
  - `validateImage()` - 圖片驗證
  - `uploadWithNetworkCheck()` - 智能上傳（根據網路狀況調整）

## 使用方式

### 基本導入
```typescript
import { 
  authService, 
  materialService, 
  orderService, 
  uploadService 
} from '../services';
```

### 認證示例
```typescript
// 登入
const loginData = await authService.login({
  username: 'admin',
  password: 'admin123'
});

// 檢查登入狀態
const isLoggedIn = authService.isAuthenticated();

// 獲取當前用戶
const currentUser = authService.getCurrentUser();
```

### 基材管理示例
```typescript
// 獲取基材列表
const materials = await materialService.getMaterials({
  type: 'AUXILIARY',
  page: 1,
  limit: 10
});

// 創建新基材
const newMaterial = await materialService.createMaterial({
  name: '新基材',
  category: '地板',
  specification: '規格說明',
  quantity: 100,
  type: 'AUXILIARY'
});
```

### 訂單管理示例
```typescript
// 獲取訂單列表
const orders = await orderService.getOrders({
  status: 'PENDING',
  page: 1,
  limit: 10
});

// 創建輔料訂單
const newOrder = await orderService.createAuxiliaryOrder({
  customerName: '客戶名稱',
  items: [
    {
      materialId: 'material-id',
      quantity: 10,
      unitPrice: 100
    }
  ]
});
```

### 圖片上傳示例
```typescript
// 上傳基材圖片
const uploadResult = await uploadService.uploadMaterialImage(
  'material-id',
  'file://path/to/image.jpg'
);

// 壓縮圖片
const compressedUri = await uploadService.compressImage(
  'file://path/to/image.jpg',
  {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8
  }
);
```

## 錯誤處理

所有服務都包含統一的錯誤處理機制：

```typescript
try {
  const result = await materialService.getMaterials();
} catch (error) {
  // 錯誤會被自動轉換為用戶友好的中文訊息
  console.error(error.message); // 例如：'網路連線異常，請檢查網路設定'
}
```

## 網路狀態處理

API 服務層會自動處理：
- 網路連線檢測
- Token 過期自動刷新
- 請求重試機制
- 離線狀態提示

## 配置

### 環境變數
在 `.env` 文件中設置：
```
REACT_APP_API_URL=http://localhost:3004
```

### 依賴套件
需要安裝以下 React Native 套件：
- `@react-native-async-storage/async-storage` - 本地儲存
- `@react-native-community/netinfo` - 網路狀態檢測
- `react-native-image-resizer` - 圖片壓縮（可選）

## 注意事項

1. **Token 管理**: 所有需要認證的 API 請求都會自動添加 Authorization 標頭
2. **錯誤處理**: 統一的錯誤處理機制，提供中文錯誤訊息
3. **網路優化**: 根據網路狀況自動調整請求策略
4. **類型安全**: 完整的 TypeScript 類型定義
5. **單例模式**: 所有服務都使用單例模式，確保狀態一致性