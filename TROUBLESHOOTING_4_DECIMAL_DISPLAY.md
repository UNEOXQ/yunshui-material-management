# 4位小數顯示問題排查指南

## 問題描述
用戶輸入4位小數（如2.2257）後，顯示仍然只有2位小數並且會自動進位。

## 已完成的修復
✅ 後端 Joi 驗證支援4位小數 (`precision(4)`)
✅ 前端輸入欄位支援4位小數 (`step="0.0001"`)
✅ 創建統一的價格格式化工具 (`frontend/src/utils/priceUtils.ts`)
✅ 更新所有相關組件使用新的格式化函數
✅ 格式化函數測試通過

## 排查步驟

### 1. 清除瀏覽器緩存
**重要：** 請清除瀏覽器緩存並強制刷新頁面
- Chrome/Edge: `Ctrl + Shift + R` 或 `F12` -> Network -> Disable cache
- Firefox: `Ctrl + Shift + R`
- Safari: `Cmd + Option + R`

### 2. 檢查前端是否使用最新代碼
確保前端已重新構建：
```bash
cd frontend
npm run build
```

### 3. 檢查後端是否正在運行
確保後端服務正在運行：
```bash
cd backend
npm run dev:simple
```

### 4. 測試新創建的材料
現有的材料數據可能只有2位小數。請：
1. 創建一個新的測試材料，價格設為 `2.2257`
2. 檢查新材料的顯示是否正確

### 5. 使用測試頁面驗證
打開 `test-4-decimal-price.html` 進行測試：
1. 測試前端格式化函數
2. 創建新的測試材料
3. 檢查API響應和顯示

## 預期結果
- 輸入 `2.2257` 應該顯示為 `CAD $2.2257`
- 輸入 `14.3276` 應該顯示為 `CAD $14.3276`
- 輸入 `123.45` 應該顯示為 `CAD $123.45`
- 輸入 `100` 應該顯示為 `CAD $100.00`

## 如果問題仍然存在

### 檢查瀏覽器開發者工具
1. 打開 F12 開發者工具
2. 查看 Console 是否有錯誤
3. 查看 Network 標籤，檢查API響應中的價格數據
4. 確認 `formatPrice` 函數是否被正確調用

### 檢查數據庫數據
現有材料的價格可能確實只有2位小數。請創建新材料進行測試。

### 手動驗證格式化函數
在瀏覽器控制台中運行：
```javascript
// 複製格式化函數
const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return 'CAD $0.00';
  }
  const formattedNumber = price.toFixed(4).replace(/\.?0+$/, '');
  const finalNumber = formattedNumber.includes('.') ? formattedNumber : `${formattedNumber}.00`;
  return `CAD $${finalNumber}`;
};

// 測試
console.log(formatPrice(2.2257)); // 應該輸出: CAD $2.2257
```

## 聯繫支援
如果以上步驟都無法解決問題，請提供：
1. 瀏覽器類型和版本
2. 開發者工具中的錯誤訊息
3. API響應的原始數據
4. 測試頁面的結果截圖