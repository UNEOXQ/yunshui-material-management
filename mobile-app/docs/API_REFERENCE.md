# API 參考文件

## 概述

本文件詳細說明雲水基材管理系統 Mobile App 使用的所有 API 端點。

## 基本資訊

- **Base URL**: `https://api.yunshui.com/v1`
- **認證方式**: Bearer Token (JWT)
- **內容類型**: `application/json`
- **字元編碼**: UTF-8

## 通用回應格式

### 成功回應
```json
{
  "success": true,
  "data": {
    // 實際資料內容
  },
  "message": "操作成功"
}
```

### 錯誤回應
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息",
    "details": {}
  }
}
```

## 認證 API

### POST /auth/login
用戶登入

**請求標頭**:
```
Content-Type: application/json
```

**請求主體**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**成功回應** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "admin",
      "email": "admin@yunshui.com",
      "role": "ADMIN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**錯誤回應** (401):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "用戶名稱或密碼錯誤"
  }
}
```

### POST /auth/refresh
刷新 JWT Token

**請求標頭**:
```
Content-Type: application/json
```

**請求主體**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

### POST /auth/logout
用戶登出

**請求標頭**:
```
Authorization: Bearer <jwt_token>
```

## 基材管理 API

### GET /materials
取得基材列表

**請求標頭**:
```
Authorization: Bearer <jwt_token>
```

**查詢參數**:
- `page` (number): 頁碼，預設 1
- `limit` (number): 每頁數量，預設 20，最大 100
- `search` (string): 搜尋關鍵字
- `category` (string): 類別篩選
- `status` (string): 狀態篩選 (available, low_stock, out_of_stock)
- `sort` (string): 排序方式 (name, price, stock, created_at)
- `order` (string): 排序順序 (asc, desc)

**成功回應** (200):
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "不鏽鋼板 304",
        "category": "不鏽鋼",
        "specification": "厚度 2mm, 尺寸 1000x2000mm",
        "unit": "片",
        "price": 1500.0000,
        "stock": 50,
        "minStock": 10,
        "imageUrl": "https://res.cloudinary.com/yunshui/image/upload/v1/materials/steel_plate.jpg",
        "description": "高品質不鏽鋼板，適用於各種工業用途",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /materials/:id
取得特定基材詳情

**路徑參數**:
- `id` (string): 基材 ID

**成功回應** (200):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "不鏽鋼板 304",
    "category": "不鏽鋼",
    "specification": "厚度 2mm, 尺寸 1000x2000mm",
    "unit": "片",
    "price": 1500.0000,
    "stock": 50,
    "minStock": 10,
    "imageUrl": "https://res.cloudinary.com/yunshui/image/upload/v1/materials/steel_plate.jpg",
    "description": "高品質不鏽鋼板，適用於各種工業用途",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /materials
新增基材

**請求標頭**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**請求主體**:
```json
{
  "name": "不鏽鋼板 316",
  "category": "不鏽鋼",
  "specification": "厚度 3mm, 尺寸 1200x2400mm",
  "unit": "片",
  "price": 2000.0000,
  "stock": 30,
  "minStock": 5,
  "imageUrl": "https://res.cloudinary.com/yunshui/image/upload/v1/materials/steel_316.jpg",
  "description": "耐腐蝕性更強的不鏽鋼板"
}
```

**成功回應** (201):
```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "name": "不鏽鋼板 316",
    "category": "不鏽鋼",
    "specification": "厚度 3mm, 尺寸 1200x2400mm",
    "unit": "片",
    "price": 2000.0000,
    "stock": 30,
    "minStock": 5,
    "imageUrl": "https://res.cloudinary.com/yunshui/image/upload/v1/materials/steel_316.jpg",
    "description": "耐腐蝕性更強的不鏽鋼板",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### PUT /materials/:id
更新基材

**路徑參數**:
- `id` (string): 基材 ID

**請求主體**: 與 POST /materials 相同，但所有欄位都是可選的

### DELETE /materials/:id
刪除基材

**路徑參數**:
- `id` (string): 基材 ID

**成功回應** (200):
```json
{
  "success": true,
  "message": "基材已成功刪除"
}
```

## 訂單管理 API

### GET /orders
取得訂單列表

**查詢參數**:
- `page` (number): 頁碼
- `limit` (number): 每頁數量
- `search` (string): 搜尋關鍵字
- `status` (string): 狀態篩選 (PENDING, PROCESSING, COMPLETED, CANCELLED)
- `dateFrom` (string): 開始日期 (ISO 8601)
- `dateTo` (string): 結束日期 (ISO 8601)

**成功回應** (200):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174002",
        "orderNumber": "ORD-2024-001",
        "customerName": "台灣鋼鐵公司",
        "customerPhone": "02-1234-5678",
        "customerEmail": "contact@steel.com.tw",
        "customerAddress": "台北市信義區信義路五段7號",
        "status": "PENDING",
        "totalAmount": 45000.00,
        "notes": "急件，請優先處理",
        "createdBy": "123e4567-e89b-12d3-a456-426614174000",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-01T10:00:00.000Z",
        "items": [
          {
            "id": "abc1234-e89b-12d3-a456-426614174003",
            "materialId": "123e4567-e89b-12d3-a456-426614174000",
            "materialName": "不鏽鋼板 304",
            "quantity": 30,
            "unitPrice": 1500.0000,
            "subtotal": 45000.00
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 75,
      "totalPages": 4
    }
  }
}
```

### POST /orders
建立新訂單

**請求主體**:
```json
{
  "customerName": "新客戶公司",
  "customerPhone": "02-9876-5432",
  "customerEmail": "new@customer.com",
  "customerAddress": "新北市板橋區中山路一段123號",
  "notes": "第一次合作",
  "items": [
    {
      "materialId": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 10,
      "unitPrice": 1500.0000
    }
  ]
}
```

### PUT /orders/:id
更新訂單

### DELETE /orders/:id
刪除訂單

### PUT /orders/:id/status
更新訂單狀態

**請求主體**:
```json
{
  "status": "PROCESSING",
  "notes": "開始處理訂單"
}
```

## 圖片上傳 API

### POST /upload/image
上傳圖片

**請求標頭**:
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**請求主體** (form-data):
- `image` (file): 圖片檔案
- `folder` (string, 可選): 儲存資料夾名稱

**成功回應** (200):
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/yunshui/image/upload/v1/materials/abc123.jpg",
    "publicId": "materials/abc123",
    "width": 800,
    "height": 600,
    "format": "jpg",
    "bytes": 245760
  }
}
```

## 狀態碼說明

| 狀態碼 | 說明 |
|--------|------|
| 200 | 請求成功 |
| 201 | 資源建立成功 |
| 400 | 請求格式錯誤 |
| 401 | 未授權 (Token 無效或過期) |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 409 | 資源衝突 (如重複建立) |
| 422 | 資料驗證失敗 |
| 500 | 伺服器內部錯誤 |

## 錯誤代碼

| 錯誤代碼 | 說明 |
|----------|------|
| INVALID_CREDENTIALS | 登入憑證無效 |
| TOKEN_EXPIRED | Token 已過期 |
| INSUFFICIENT_PERMISSIONS | 權限不足 |
| RESOURCE_NOT_FOUND | 資源不存在 |
| VALIDATION_ERROR | 資料驗證錯誤 |
| DUPLICATE_RESOURCE | 資源重複 |
| INTERNAL_ERROR | 內部伺服器錯誤 |

## 請求限制

- **請求頻率**: 每分鐘最多 100 次請求
- **檔案上傳**: 單檔最大 5MB
- **請求大小**: 最大 10MB
- **Token 有效期**: 24 小時
- **Refresh Token 有效期**: 30 天

## 範例程式碼

### JavaScript (Axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.yunshui.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 設定 Token
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// 取得基材列表
const getMaterials = async (params = {}) => {
  try {
    const response = await api.get('/materials', { params });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response.data);
    throw error;
  }
};
```

### React Native (RTK Query)
```javascript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.yunshui.com/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Material', 'Order'],
  endpoints: (builder) => ({
    getMaterials: builder.query({
      query: (params) => ({
        url: '/materials',
        params,
      }),
      providesTags: ['Material'],
    }),
    createMaterial: builder.mutation({
      query: (material) => ({
        url: '/materials',
        method: 'POST',
        body: material,
      }),
      invalidatesTags: ['Material'],
    }),
  }),
});
```

---

**最後更新**: 2024年10月  
**API 版本**: v1.0.0