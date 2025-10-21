# CORS 圖片載入問題修復總結

## 問題描述
用戶遇到圖片上傳後無法正常顯示的問題，瀏覽器 F12 顯示：
```
GET http://localhost:3004/uploads/materials/LOGO-1760471676821-730512022.png net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin 200 (OK)
```

## 根本原因
1. **端口不匹配**: 前端 Vite 代理配置指向 `localhost:3001`，但後端實際運行在 `localhost:3004`
2. **CORS 頭不完整**: 靜態文件服務缺少必要的 CORS 和 CORP 頭
3. **圖片 URL 處理**: 前端直接使用完整 URL，沒有利用 Vite 代理

## 修復方案

### 1. 修復 Vite 代理配置
**文件**: `frontend/vite.config.ts`
- 將所有代理目標從 `localhost:3001` 改為 `localhost:3004`
- 為 `/uploads` 路由添加額外的 CORS 頭

### 2. 增強後端 CORS 配置
**文件**: `backend/src/server-simple.ts` 和 `backend/src/server.ts`
- 添加完整的 CORS 頭：`Access-Control-Allow-Origin: *`
- 添加 CORP 頭：`Cross-Origin-Resource-Policy: cross-origin`
- 添加 COEP 頭：`Cross-Origin-Embedder-Policy: unsafe-none`
- 處理 OPTIONS 預檢請求

### 3. 創建圖片 URL 處理工具
**文件**: `frontend/src/utils/imageUtils.ts`
- `processImageUrl()`: 在開發環境中將完整 URL 轉換為相對路徑
- `getFullImageUrl()`: 獲取完整 URL（用於上傳等場景）
- `checkImageLoad()`: 檢查圖片是否可以載入

### 4. 修改前端組件
**文件**: `frontend/src/components/MaterialManagement/MaterialList.tsx`
- 使用 `processImageUrl()` 處理圖片 URL
- 添加更詳細的錯誤日誌

### 5. 添加環境變數
**文件**: `backend/.env.development`
- 添加 `BASE_URL=http://localhost:3004`

## 測試工具
1. **test-cors.html**: 瀏覽器端 CORS 測試頁面
2. **TestImageLoad.tsx**: React 組件測試頁面
3. **simple-test.ps1**: PowerShell 測試腳本

## 使用方法
1. 確保後端運行在 `localhost:3004`
2. 確保前端運行在 `localhost:3000`
3. 圖片將通過 Vite 代理載入，避免跨域問題

## 預期結果
- 圖片上傳後能正常顯示
- 不再出現 CORS 錯誤
- 開發和生產環境都能正常工作