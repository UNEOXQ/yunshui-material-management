# 雲水基材管理系統 Mobile App 技術文件

## 概述

本文件提供雲水基材管理系統 Mobile App 的完整技術資訊，包括架構設計、API 規格、開發指南和維護說明。

## 目錄

1. [技術架構](#技術架構)
2. [開發環境設置](#開發環境設置)
3. [API 規格](#api-規格)
4. [資料庫設計](#資料庫設計)
5. [安全性設計](#安全性設計)
6. [效能優化](#效能優化)
7. [測試策略](#測試策略)
8. [部署架構](#部署架構)
9. [監控和日誌](#監控和日誌)
10. [維護指南](#維護指南)

## 技術架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App Layer                     │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   iOS App       │    │      Android App            │ │
│  │  (React Native) │    │    (React Native)           │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │
┌─────────────────────────────────────────────────────────┐
│                   Backend Services                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Node.js   │  │   Express   │  │   JWT Auth      │ │
│  │   Server    │  │   Router    │  │   Service       │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              │
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ PostgreSQL  │  │ Cloudinary  │  │   File Storage  │ │
│  │ Database    │  │ Image CDN   │  │   Service       │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 技術堆疊

#### 前端技術
- **框架**: React Native 0.72.6
- **語言**: TypeScript 5.1.3
- **狀態管理**: Redux Toolkit + RTK Query
- **導航**: React Navigation 6
- **UI 組件**: React Native Paper 5.11.1
- **圖片處理**: Expo Image Picker + Image Manipulator

#### 後端技術
- **運行環境**: Node.js 18+
- **框架**: Express.js
- **資料庫**: PostgreSQL 14+
- **認證**: JWT (JSON Web Tokens)
- **圖片儲存**: Cloudinary
- **API 文件**: OpenAPI 3.0

#### 開發工具
- **建置工具**: EAS Build (Expo Application Services)
- **版本控制**: Git
- **程式碼品質**: ESLint + Prettier
- **測試框架**: Jest + React Native Testing Library
- **CI/CD**: GitHub Actions (可選)

## 開發環境設置

### 必要軟體安裝

#### 1. Node.js 和 npm
```bash
# 使用 Node Version Manager (推薦)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 驗證安裝
node --version  # v18.x.x
npm --version   # 9.x.x
```

#### 2. React Native 開發環境
```bash
# 安裝 Expo CLI
npm install -g @expo/cli

# 安裝 EAS CLI
npm install -g eas-cli

# 驗證安裝
expo --version
eas --version
```

#### 3. 開發工具設置
```bash
# 安裝 TypeScript
npm install -g typescript

# 安裝程式碼品質工具
npm install -g eslint prettier

# 驗證安裝
tsc --version
eslint --version
prettier --version
```

### 專案設置

#### 1. 複製專案
```bash
git clone [專案儲存庫URL]
cd yunshui-mobile/mobile-app
```

#### 2. 安裝依賴
```bash
npm install
```

#### 3. 環境變數設置
```bash
cp .env.example .env
# 編輯 .env 檔案設置必要的環境變數
```

#### 4. 啟動開發伺服器
```bash
npm start
```

## API 規格

### 基本資訊
- **Base URL**: `https://api.yunshui.com/v1`
- **認證方式**: Bearer Token (JWT)
- **資料格式**: JSON
- **字元編碼**: UTF-8

### 認證 API

#### POST /auth/login
登入系統並取得 JWT Token

**請求**:
```json
{
  "username": "string",
  "password": "string"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "ADMIN|USER"
    }
  }
}
```

#### POST /auth/refresh
刷新 JWT Token

**請求**:
```json
{
  "refreshToken": "string"
}
```

#### POST /auth/logout
登出系統

**請求**: 需要 Authorization Header

### 基材管理 API

#### GET /materials
取得基材列表

**查詢參數**:
- `page`: 頁碼 (預設: 1)
- `limit`: 每頁數量 (預設: 20)
- `search`: 搜尋關鍵字
- `category`: 類別篩選
- `status`: 狀態篩選

**回應**:
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "string",
        "name": "string",
        "category": "string",
        "specification": "string",
        "unit": "string",
        "price": "number",
        "stock": "number",
        "imageUrl": "string",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "totalPages": "number"
    }
  }
}
```

#### POST /materials
新增基材

**請求**:
```json
{
  "name": "string",
  "category": "string",
  "specification": "string",
  "unit": "string",
  "price": "number",
  "stock": "number",
  "description": "string"
}
```

#### PUT /materials/:id
更新基材

#### DELETE /materials/:id
刪除基材

### 訂單管理 API

#### GET /orders
取得訂單列表

#### POST /orders
建立新訂單

#### PUT /orders/:id
更新訂單

#### DELETE /orders/:id
刪除訂單

### 圖片上傳 API

#### POST /upload/image
上傳圖片到 Cloudinary

**請求**: multipart/form-data
- `image`: 圖片檔案
- `folder`: 儲存資料夾 (可選)

**回應**:
```json
{
  "success": true,
  "data": {
    "url": "string",
    "publicId": "string",
    "width": "number",
    "height": "number"
  }
}
```

## 資料庫設計

### 主要資料表

#### users 表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### materials 表
```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  specification TEXT,
  unit VARCHAR(20),
  price DECIMAL(10,4),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### orders 表
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  customer_address TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  total_amount DECIMAL(12,2),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### order_items 表
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id),
  quantity DECIMAL(10,4) NOT NULL,
  unit_price DECIMAL(10,4) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 索引設計

```sql
-- 效能優化索引
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_name ON materials USING gin(to_tsvector('english', name));
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

## 安全性設計

### 認證和授權

#### JWT Token 設計
```javascript
// Token 結構
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "username": "user_name",
    "role": "USER|ADMIN",
    "iat": 1234567890,
    "exp": 1234567890
  }
}
```

#### 權限控制
```javascript
// 權限矩陣
const permissions = {
  'USER': [
    'materials:read',
    'orders:read',
    'orders:create',
    'orders:update:own'
  ],
  'ADMIN': [
    'materials:*',
    'orders:*',
    'users:*',
    'system:*'
  ]
};
```

### 資料安全

#### 敏感資料加密
```javascript
// 密碼雜湊
const bcrypt = require('bcrypt');
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

#### API 安全措施
- **HTTPS**: 所有 API 請求必須使用 HTTPS
- **CORS**: 設定適當的 CORS 政策
- **Rate Limiting**: 實施請求頻率限制
- **Input Validation**: 嚴格驗證所有輸入資料

### 行動應用安全

#### 本地儲存安全
```javascript
// 使用 React Native Keychain 儲存敏感資料
import * as Keychain from 'react-native-keychain';

// 儲存 Token
await Keychain.setInternetCredentials(
  'auth_token',
  'token',
  jwtToken
);

// 讀取 Token
const credentials = await Keychain.getInternetCredentials('auth_token');
```

#### 網路安全
```javascript
// SSL Pinning (可選)
const sslPinning = {
  hostname: 'api.yunshui.com',
  sslPinning: {
    certs: ['sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=']
  }
};
```

## 效能優化

### 前端優化

#### 圖片優化
```javascript
// 圖片壓縮設定
const imageConfig = {
  compress: 0.8,
  format: ImageManipulator.SaveFormat.JPEG,
  result: 'file'
};

// 懶載入實作
const LazyImage = ({ source, style }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <View style={style}>
      {!loaded && <ActivityIndicator />}
      <Image
        source={source}
        style={[style, { opacity: loaded ? 1 : 0 }]}
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
};
```

#### 列表優化
```javascript
// FlatList 優化設定
<FlatList
  data={materials}
  renderItem={renderMaterialItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 後端優化

#### 資料庫查詢優化
```sql
-- 使用適當的索引
EXPLAIN ANALYZE SELECT * FROM materials 
WHERE category = 'steel' 
ORDER BY created_at DESC 
LIMIT 20;

-- 避免 N+1 查詢問題
SELECT o.*, oi.*, m.name as material_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN materials m ON oi.material_id = m.id
WHERE o.status = 'PENDING';
```

#### API 回應優化
```javascript
// 分頁實作
const getPaginatedMaterials = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  
  const [materials, total] = await Promise.all([
    Material.findAll({
      limit,
      offset,
      order: [['created_at', 'DESC']]
    }),
    Material.count()
  ]);
  
  return {
    materials,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
```

### 快取策略

#### 前端快取
```javascript
// RTK Query 快取設定
export const materialApi = createApi({
  reducerPath: 'materialApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/materials',
  }),
  tagTypes: ['Material'],
  endpoints: (builder) => ({
    getMaterials: builder.query({
      query: (params) => ({
        url: '',
        params,
      }),
      providesTags: ['Material'],
      // 快取 5 分鐘
      keepUnusedDataFor: 300,
    }),
  }),
});
```

#### 後端快取
```javascript
// Redis 快取實作
const redis = require('redis');
const client = redis.createClient();

const getCachedMaterials = async (key) => {
  const cached = await client.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const materials = await Material.findAll();
  await client.setex(key, 300, JSON.stringify(materials)); // 快取 5 分鐘
  return materials;
};
```

---

**注意**: 本文件會隨著專案發展持續更新，請定期查看最新版本。

**最後更新**: 2024年10月  
**文件版本**: 1.0.0  
**適用版本**: 雲水基材管理系統 Mobile App v1.0.0+