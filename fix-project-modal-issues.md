# 🔧 專案模態框問題修復指南

## 🐛 已識別的問題

### 1. 視窗被切掉問題
**原因**: 購物車區域太寬，導致創建訂單按鈕超出螢幕範圍

**修復內容**:
- ✅ 增加模態框寬度：1200px → 1400px
- ✅ 調整購物車區域：35% → 400px 固定寬度
- ✅ 添加響應式設計支持不同螢幕尺寸

### 2. 新專案創建失敗問題
**原因**: 後端 API 路由沒有正確處理專案創建請求

**修復內容**:
- ✅ 添加新的 API 端點：`/orders/auxiliary-with-project` 和 `/orders/finished-with-project`
- ✅ 更新 orderService 自動選擇正確的 API 端點
- ✅ 修復專案創建邏輯

## 🚀 修復後的功能

### 視窗尺寸優化
```css
/* 桌面版 */
.material-selection-modal {
  width: 1400px;  /* 增加寬度 */
  height: 850px;  /* 增加高度 */
}

/* 購物車區域 */
.cart-section {
  flex: 0 0 400px;  /* 固定寬度，不再使用百分比 */
}
```

### 響應式設計
```css
/* 中等螢幕 */
@media (max-width: 1200px) {
  .material-selection-modal {
    width: 95vw;
    height: 90vh;
  }
  .cart-section {
    flex: 0 0 350px;
  }
}

/* 小螢幕 */
@media (max-width: 768px) {
  .selection-layout {
    flex-direction: column;  /* 垂直佈局 */
  }
  .cart-section {
    width: 100%;
    border-left: none;
    border-top: 1px solid #e0e0e0;
  }
}
```

### API 端點自動選擇
```typescript
// orderService.ts
async createAuxiliaryOrder(orderData: CreateOrderRequest) {
  // 自動選擇正確的 API 端點
  const endpoint = (orderData.projectId || orderData.newProjectName) 
    ? '/orders/auxiliary-with-project'  // 有專案數據時使用
    : '/orders/auxiliary';              // 無專案數據時使用
  
  const response = await apiClient.post(endpoint, orderData);
  return response.data;
}
```

## 🧪 測試步驟

### 1. 測試視窗尺寸
1. 開啟材料選擇模態框
2. 添加材料到購物車
3. 確認可以看到完整的「創建訂單」按鈕
4. 測試不同螢幕尺寸的響應式效果

### 2. 測試專案創建
1. 在專案選擇器中選擇「+ 創建新專案」
2. 輸入專案名稱（例如：「測試專案123」）
3. 點擊「創建」按鈕
4. 確認專案創建成功並自動選中

### 3. 測試訂單創建
1. 選擇材料並添加到購物車
2. 選擇或創建專案
3. 輸入訂單名稱（可選）
4. 點擊「創建訂單」
5. 確認訂單創建成功並顯示專案關聯

## 🔍 調試技巧

### 檢查 API 請求
```javascript
// 在瀏覽器開發者工具的 Network 標籤中查看
// 應該看到以下請求：

// 1. 獲取專案列表
GET /api/projects

// 2. 創建訂單（有專案）
POST /api/orders/auxiliary-with-project
{
  "items": [...],
  "newProjectName": "測試專案123",
  "orderName": "自定義訂單名稱"
}

// 3. 創建訂單（無專案）
POST /api/orders/auxiliary
{
  "items": [...]
}
```

### 檢查控制台錯誤
```javascript
// 如果專案創建失敗，檢查控制台是否有以下錯誤：
// - 401 Unauthorized: 檢查登入狀態
// - 400 Bad Request: 檢查請求數據格式
// - 500 Internal Server Error: 檢查後端日誌
```

## 📱 不同螢幕尺寸測試

### 大螢幕 (>1200px)
- ✅ 模態框寬度：1400px
- ✅ 購物車寬度：400px
- ✅ 所有功能完整顯示

### 中等螢幕 (768px-1200px)
- ✅ 模態框寬度：95vw
- ✅ 購物車寬度：350px
- ✅ 適應螢幕寬度

### 小螢幕 (<768px)
- ✅ 垂直佈局
- ✅ 購物車佔滿寬度
- ✅ 觸控友好界面

## 🎯 預期結果

修復後，用戶應該能夠：

1. **完整查看模態框** - 所有按鈕和內容都在可見範圍內
2. **成功創建專案** - 輸入專案名稱後能正確創建並選中
3. **正常創建訂單** - 訂單能正確關聯到選定的專案
4. **響應式體驗** - 在不同設備上都有良好的使用體驗

## 🚨 如果問題仍然存在

### 清除瀏覽器緩存
```bash
# 強制刷新頁面
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

### 檢查後端服務
```bash
# 確認後端服務正在運行
curl http://localhost:3004/health

# 檢查專案 API
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3004/api/projects
```

### 重新部署
```bash
# 重新構建並部署
npm run build
git add .
git commit -m "Fix modal sizing and project creation issues"
git push origin main
```

---

🎊 **修復完成！現在專案管理功能應該能正常工作了！**