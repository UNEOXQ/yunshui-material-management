# 雲水基材管理系統 - 材料精度更新

## 更新概述

根據用戶需求，對材料管理系統進行了以下兩項重要改進：

1. **價格精度提升**：從小數點後2位提升到4位
2. **庫存數量支援**：允許輸入0值

## 修改詳情

### 1. 後端修改

#### 文件：`backend/src/models/Material.ts`

**價格驗證更新：**
```typescript
// 修改前
price: Joi.number()
  .positive()
  .precision(2)  // 只支援2位小數

// 修改後  
price: Joi.number()
  .positive()
  .precision(4)  // 支援4位小數
```

**數量驗證更新：**
```typescript
// 修改前
quantity: Joi.number()
  .integer()
  .min(0)  // 已經支援0，但錯誤訊息不清楚

// 修改後
quantity: Joi.number()
  .integer()
  .min(0)  // 明確說明支援0或更大的值
  .messages({
    'number.min': 'Quantity must be 0 or greater'  // 更清楚的錯誤訊息
  })
```

#### 文件：`backend/src/migrations/007_update_materials_price_precision.sql`

**數據庫結構更新：**
```sql
-- 修改材料表的價格字段，支援4位小數
ALTER TABLE materials 
ALTER COLUMN price TYPE DECIMAL(12,4);

-- 更新檢查約束
ALTER TABLE materials 
DROP CONSTRAINT IF EXISTS materials_price_check;

ALTER TABLE materials 
ADD CONSTRAINT materials_price_check CHECK (price >= 0);
```

### 2. 前端修改

#### 文件：`frontend/src/components/MaterialManagement/MaterialForm.tsx`

**價格輸入欄位更新：**
```tsx
// 修改前
<input
  type="number"
  step="0.01"      // 只支援2位小數
  placeholder="0.00"
/>

// 修改後
<input
  type="number"
  step="0.0001"    // 支援4位小數
  placeholder="0.0000"
/>
```

**價格驗證邏輯更新：**
```typescript
// 新增小數位數檢查
const decimalPlaces = (formData.price.split('.')[1] || '').length;
if (decimalPlaces > 4) {
  newErrors.price = '價格最多只能有4位小數';
}

// 更新最大值限制
if (price > 999999.9999) {  // 從 999999.99 改為 999999.9999
  newErrors.price = '價格不能超過999,999.9999';
}
```

**數量驗證訊息更新：**
```typescript
// 修改前
newErrors.quantity = '數量必須為非負整數';

// 修改後
newErrors.quantity = '數量必須為0或正整數';
```

#### 文件：`frontend/src/components/MaterialManagement/MaterialList.tsx`

**價格顯示格式更新：**
```typescript
// 修改前
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 2  // 只顯示2位小數
  }).format(price);
};

// 修改後
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 4  // 顯示最多4位小數
  }).format(price);
};
```

## 測試驗證

### 價格精度測試案例

✅ **通過的案例：**
- 14.3276 （4位小數）
- 123.4567 （4位小數）
- 0.0001 （4位小數）
- 999999.9999 （最大值）

❌ **應該失敗的案例：**
- 14.32765 （超過4位小數）
- -1.23 （負數）
- 1000000.0000 （超過最大值）

### 庫存數量測試案例

✅ **通過的案例：**
- 0 （零庫存）
- 1 （正整數）
- 999999 （最大值）

❌ **應該失敗的案例：**
- -1 （負數）
- 1.5 （非整數）
- 1000000 （超過最大值）

## 使用說明

### 1. 價格輸入
- 現在可以輸入最多4位小數的價格
- 例如：14.3276、0.0001、123.4567
- 系統會自動驗證小數位數不超過4位

### 2. 庫存數量輸入
- 現在明確支援輸入0作為庫存數量
- 適用於缺貨或新材料尚未入庫的情況
- 數量必須為非負整數

### 3. 顯示格式
- 價格顯示會根據實際小數位數自動調整
- 最多顯示4位小數，不足的不會補零

## 兼容性說明

- ✅ 向後兼容：現有的2位小數價格仍然有效
- ✅ 數據安全：現有的0庫存數據不受影響
- ⚠️ 數據庫遷移：需要運行遷移腳本更新PostgreSQL結構
- ✅ 內存數據庫：自動支援新的精度要求

## 部署注意事項

1. **數據庫遷移**：
   ```bash
   cd backend
   npm run migrate:up
   ```

2. **前端重新構建**：
   ```bash
   cd frontend
   npm run build
   ```

3. **測試驗證**：
   - 打開 `test-material-precision.html` 進行功能測試
   - 驗證價格4位小數輸入
   - 驗證0庫存數量輸入

## 問題修復

### 顯示進位問題修復

**問題描述：**
用戶反映雖然可以輸入4位小數（如2.2257），但顯示時會自動進位為2位小數（如2.23）。

**根本原因：**
`Intl.NumberFormat` 的貨幣格式化會自動進位，即使設定了 `maximumFractionDigits: 4`。

**解決方案：**
1. 創建了統一的價格格式化工具 `frontend/src/utils/priceUtils.ts`
2. 使用自定義格式化邏輯，避免自動進位
3. 更新所有相關組件使用新的格式化函數

**修復後的格式化邏輯：**
```typescript
const formatPrice = (price: number): string => {
  const formattedNumber = price.toFixed(4).replace(/\.?0+$/, '');
  const finalNumber = formattedNumber.includes('.') ? formattedNumber : `${formattedNumber}.00`;
  return `CAD $${finalNumber}`;
};
```

**測試驗證：**
- 2.2257 → 顯示為 "CAD $2.2257" ✅
- 14.3276 → 顯示為 "CAD $14.3276" ✅
- 123.45 → 顯示為 "CAD $123.45" ✅
- 100 → 顯示為 "CAD $100.00" ✅

## 更新完成時間

2024年10月28日

## 技術負責人

Kiro AI Assistant