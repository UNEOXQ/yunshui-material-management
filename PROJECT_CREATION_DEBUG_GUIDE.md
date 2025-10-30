# 🔍 專案創建調試指南

## 🐛 問題描述
- 輸入專案名稱後沒有新增任何東西
- F12 開發者工具沒有顯示 API 請求
- 選擇現有專案並送出訂單後沒有看到變化

## 🧪 調試步驟

### 1. 檢查瀏覽器開發者工具

1. **打開開發者工具** (F12)
2. **切換到 Network 標籤**
3. **清除現有記錄** (點擊清除按鈕)
4. **嘗試創建專案**，觀察是否有以下請求：

```
預期的 API 請求：
- GET /api/projects (載入專案列表)
- POST /api/projects (創建新專案)
- POST /api/orders/auxiliary-with-project (創建訂單)
```

### 2. 檢查控制台錯誤

在 **Console 標籤** 中查看是否有錯誤訊息：

```javascript
// 常見錯誤類型：
- 401 Unauthorized: 登入狀態過期
- 404 Not Found: API 端點不存在
- 500 Internal Server Error: 後端錯誤
- CORS 錯誤: 跨域請求問題
```

### 3. 測試專案創建流程

#### 步驟 A: 測試專案選擇器
1. 點擊專案下拉選單
2. 選擇「+ 創建新專案」
3. 輸入專案名稱（例如：「測試專案123」）
4. 點擊「創建」按鈕
5. **檢查 Network 標籤是否有 POST /api/projects 請求**

#### 步驟 B: 測試訂單創建
1. 選擇材料並添加到購物車
2. 在專案選擇器中選擇專案
3. 點擊「創建訂單」
4. **檢查 Network 標籤是否有 POST /api/orders/auxiliary-with-project 請求**

### 4. 手動 API 測試

如果前端沒有發送請求，可以手動測試 API：

#### 獲取認證 Token
1. 在開發者工具的 **Application 標籤**
2. 展開 **Local Storage**
3. 找到 `authToken` 的值

#### 測試專案 API
```bash
# 在 PowerShell 中運行
.\debug-project-creation.ps1 -Token "你的認證Token"
```

### 5. 檢查後端日誌

如果是本地開發，檢查後端控制台輸出：

```
預期的日誌訊息：
🔍 創建輔材訂單（支持專案）- 開始
📝 請求數據: {...}
✅ 驗證通過 - 用戶ID: ...
🏗️ 創建新專案: 測試專案123
✅ 新專案創建成功: id-xxxx 測試專案123
```

## 🔧 常見問題和解決方案

### 問題 1: 沒有 API 請求
**可能原因**: 前端事件處理器沒有正確綁定

**解決方案**:
1. 檢查瀏覽器控制台是否有 JavaScript 錯誤
2. 嘗試重新整理頁面
3. 清除瀏覽器緩存 (Ctrl+F5)

### 問題 2: 401 Unauthorized
**可能原因**: 登入狀態過期

**解決方案**:
1. 重新登入系統
2. 檢查 localStorage 中的 authToken 是否存在

### 問題 3: 404 Not Found
**可能原因**: API 端點不存在或路由配置錯誤

**解決方案**:
1. 確認後端服務正在運行
2. 檢查 API 端點 URL 是否正確
3. 確認路由配置已正確部署

### 問題 4: 500 Internal Server Error
**可能原因**: 後端邏輯錯誤

**解決方案**:
1. 檢查後端控制台日誌
2. 確認數據庫連接正常
3. 檢查請求數據格式是否正確

## 📋 調試檢查清單

- [ ] 開發者工具 Network 標籤已打開
- [ ] 嘗試創建專案時有 API 請求
- [ ] 控制台沒有 JavaScript 錯誤
- [ ] authToken 存在且有效
- [ ] 後端服務正在運行
- [ ] API 端點返回正確的響應

## 🆘 如果問題仍然存在

請提供以下信息：

1. **瀏覽器控制台截圖** (Console 和 Network 標籤)
2. **具體的錯誤訊息**
3. **操作步驟** (什麼時候出現問題)
4. **後端日誌** (如果可以訪問)

## 🎯 預期的正常流程

1. **載入專案列表**: GET /api/projects → 200 OK
2. **創建新專案**: POST /api/projects → 201 Created
3. **創建訂單**: POST /api/orders/auxiliary-with-project → 201 Created
4. **重新載入訂單列表**: GET /api/orders/auxiliary → 200 OK

---

🔍 **現在請按照這個指南進行調試，並告訴我你在哪一步遇到了問題！**