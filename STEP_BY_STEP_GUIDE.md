# 手動建立新 Expo 專案 - 逐步指南

## 🎯 目標
建立一個全新的 SDK 51 專案來解決版本相容性問題

## 📋 手動執行步驟

### 步驟 1: 檢查當前位置
```bash
# 確認你在 mobile-app 目錄中
pwd
# 應該顯示: .../雲水基材管理系統1/mobile-app
```

### 步驟 2: 移動到上層目錄
```bash
cd ..
# 現在應該在 雲水基材管理系統1 目錄中
```

### 步驟 3: 建立新的 Expo 專案
```bash
npx create-expo-app yunshui-mobile-v2 --template blank-typescript
```

**注意**: 這個步驟可能需要 3-5 分鐘，請耐心等待

### 步驟 4: 檢查專案是否建立成功
```bash
ls -la
# 應該看到 yunshui-mobile-v2 目錄
```

### 步驟 5: 複製現有程式碼
```bash
# 複製 App.tsx
cp mobile-app/App.tsx yunshui-mobile-v2/App.tsx

# 進入新專案目錄
cd yunshui-mobile-v2
```

### 步驟 6: 更新 app.json
建立或編輯 `app.json` 檔案：
```json
{
  "expo": {
    "name": "雲水基材管理 v2",
    "slug": "yunshui-mobile-v2",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android"],
    "splash": {
      "backgroundColor": "#007bff"
    },
    "android": {
      "package": "com.yunshui.mobile.v2"
    },
    "ios": {
      "bundleIdentifier": "com.yunshui.mobile.v2"
    }
  }
}
```

### 步驟 7: 啟動新專案
```bash
npx expo start --tunnel
```

## 🔍 如果步驟 3 失敗

### 可能的原因和解決方案:

#### 1. 網路連線問題
```bash
# 檢查網路連線
ping google.com

# 如果網路有問題，嘗試使用手機熱點
```

#### 2. npm 快取問題
```bash
# 清除 npm 快取
npm cache clean --force

# 重新嘗試
npx create-expo-app yunshui-mobile-v2 --template blank-typescript
```

#### 3. 權限問題
```bash
# 以管理員身份運行 CMD
# 然後重新執行命令
```

## 🎯 預期結果

如果一切順利，你應該會看到：
1. ✅ 新目錄 `yunshui-mobile-v2` 建立成功
2. ✅ Expo 開發伺服器啟動
3. ✅ QR 碼顯示
4. ✅ 用 Expo Go 掃描後能正常載入

## 📱 測試步驟

1. 用 Expo Go 掃描 QR 碼
2. 應該看到載入畫面
3. 最終顯示「雲水基材管理系統 手機版 v1.0.0」
4. **沒有版本相容性錯誤！**

## 🐛 如果還是有問題

### 檢查 Expo CLI 版本
```bash
npx expo --version
# 應該是最新版本
```

### 檢查 Node.js 版本
```bash
node --version
# 應該是 v16+ 
```

### 完全重新開始
```bash
# 刪除失敗的專案
rm -rf yunshui-mobile-v2

# 重新建立
npx create-expo-app yunshui-mobile-v2 --template blank-typescript
```

---

**記住**: 這個新專案完全獨立，不會影響你的 PC 系統或原本的 mobile-app 目錄！