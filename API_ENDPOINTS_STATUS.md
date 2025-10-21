# 雲水基材管理系統 - API端點狀態報告

## 🔧 **已修復的問題**

### 1. Upload API 端點
- **問題**: `/api/upload/material/material-1/image` 返回 404
- **原因**: server-simple.ts 中沒有註冊 uploadRoutes
- **解決**: ✅ 已添加 `app.use('/api/upload', uploadRoutes)`

### 2. Error API 端點
- **問題**: 前端錯誤報告功能無法使用
- **缺失端點**: 
  - `/api/errors/report`
  - `/api/errors/beacon`
- **解決**: ✅ 已添加 `app.use('/api/errors', errorRoutes)`

### 3. Status API 端點
- **問題**: 狀態管理功能無法使用
- **缺失端點**: `/api/status/*`
- **解決**: ✅ 已添加 `app.use('/api/status', statusRoutes)`

### 4. Status Service 配置
- **問題**: statusService.ts 使用錯誤的API基礎URL
- **解決**: ✅ 已修正為 `http://localhost:3004/api`

## 📊 **當前API端點狀態**

### ✅ **已實現並註冊的端點**

#### 認證相關 (`/api/auth`)
- POST `/api/auth/login` - 使用者登入
- POST `/api/auth/logout` - 使用者登出
- GET `/api/auth/profile` - 獲取當前使用者資料

#### 使用者管理 (`/api/users`)
- GET `/api/users` - 獲取所有使用者 (Admin)
- POST `/api/users` - 創建新使用者 (Admin)
- GET `/api/users/:id` - 獲取特定使用者
- PUT `/api/users/:id` - 更新使用者 (Admin)
- DELETE `/api/users/:id` - 刪除使用者 (Admin)

#### 材料管理 (`/api/materials`)
- GET `/api/materials` - 獲取材料列表 (支援篩選和分頁)
- POST `/api/materials` - 創建新材料 (Admin)
- GET `/api/materials/categories` - 獲取所有分類
- GET `/api/materials/suppliers` - 獲取所有供應商
- GET `/api/materials/type/:type` - 按類型獲取材料
- GET `/api/materials/:id` - 獲取特定材料
- PUT `/api/materials/:id` - 更新材料 (Admin)
- PATCH `/api/materials/:id/quantity` - 更新材料數量
- DELETE `/api/materials/:id` - 刪除材料 (Admin)

#### 訂單管理 (`/api/orders`)
- POST `/api/orders` - 創建新訂單
- GET `/api/orders` - 獲取訂單列表
- GET `/api/orders/:id` - 獲取特定訂單
- GET `/api/orders/:id/items` - 獲取訂單項目
- PUT `/api/orders/:id/status` - 更新訂單狀態
- DELETE `/api/orders/:id` - 取消訂單

##### 輔材訂單 (PM專用)
- POST `/api/orders/auxiliary` - 創建輔材訂單
- GET `/api/orders/auxiliary` - 獲取輔材訂單列表
- PUT `/api/orders/:id/confirm` - 確認輔材訂單

##### 完成材訂單 (AM專用)
- POST `/api/orders/finished` - 創建完成材訂單
- GET `/api/orders/finished` - 獲取完成材訂單列表
- PUT `/api/orders/:id/confirm-finished` - 確認完成材訂單

#### 文件上傳 (`/api/upload`)
- POST `/api/upload/material/:id/image` - 上傳材料圖片 (Admin)
- DELETE `/api/upload/material/:id/image` - 刪除材料圖片 (Admin)
- GET `/api/upload/info` - 獲取上傳配置資訊
- GET `/api/upload/files/*` - 提供上傳的文件

#### 錯誤報告 (`/api/errors`)
- POST `/api/errors/report` - 報告錯誤
- POST `/api/errors/beacon` - Beacon方式報告錯誤
- GET `/api/errors/health` - 錯誤系統健康檢查
- GET `/api/errors/stats` - 錯誤統計 (Admin)

#### 狀態管理 (`/api/status`)
- PUT `/api/status/projects/:projectId/status` - 更新專案狀態
- PUT `/api/status/projects/:projectId/status/order` - 更新叫貨狀態
- PUT `/api/status/projects/:projectId/status/pickup` - 更新取貨狀態
- PUT `/api/status/projects/:projectId/status/delivery` - 更新到案狀態
- PUT `/api/status/projects/:projectId/status/check` - 更新點收狀態
- GET `/api/status/projects/:projectId/status` - 獲取專案狀態歷史
- GET `/api/status/statistics` - 獲取狀態統計
- GET `/api/status/updates` - 獲取狀態更新列表

#### 系統端點
- GET `/health` - 系統健康檢查
- GET `/uploads/*` - 靜態文件服務

## 🎯 **測試建議**

### 1. 圖片上傳測試
```bash
# 測試材料圖片上傳
curl -X POST http://localhost:3004/api/upload/material/material-1/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg"
```

### 2. 錯誤報告測試
```bash
# 測試錯誤報告
curl -X POST http://localhost:3004/api/errors/report \
  -H "Content-Type: application/json" \
  -d '{"message":"Test error","stack":"Test stack"}'
```

### 3. 狀態更新測試
```bash
# 測試狀態更新
curl -X PUT http://localhost:3004/api/status/projects/project-1/status/order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"primaryStatus":"已叫貨","secondaryStatus":"等待確認"}'
```

## 🚀 **啟動服務器**

修復完成後，重新啟動服務器：

```bash
cd backend
npm run dev
```

服務器啟動後會顯示所有可用的API端點：
- 🔐 Auth API: http://localhost:3004/api/auth
- 👥 Users API: http://localhost:3004/api/users
- 📦 Materials API: http://localhost:3004/api/materials
- 🛒 Orders API: http://localhost:3004/api/orders
- 📤 Upload API: http://localhost:3004/api/upload
- ❌ Error API: http://localhost:3004/api/errors
- 📊 Status API: http://localhost:3004/api/status
- 🖼️ Static files: http://localhost:3004/uploads

## ✅ **總結**

所有缺失的API端點問題已經修復：
1. ✅ 圖片上傳功能現在可以正常使用
2. ✅ 錯誤報告系統已啟用
3. ✅ 狀態管理功能已啟用
4. ✅ 所有前端服務都指向正確的API端點

你的雲水基材管理系統現在應該可以完整運行了！