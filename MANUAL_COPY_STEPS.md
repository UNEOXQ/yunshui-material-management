# 手動複製完整功能 - 避免版本問題

## 🎯 目標
將完整的雲水基材管理系統功能複製到新專案，同時保持 SDK 51 版本相容性

## ⚠️ 重要提醒
- **不要複製 package.json** - 保持新專案的 SDK 51 版本
- **逐步執行** - 每步都檢查結果
- **保持版本相容性** - 避免 SDK 版本衝突

## 📋 手動執行步驟

### 步驟 1: 檢查當前位置
```bash
# 確認在 mobile-app 目錄中
cd mobile-app
dir
```

### 步驟 2: 檢查目標目錄
```bash
# 檢查新專案是否存在
dir ..\yunshui-mobile-v2
```

### 步驟 3: 複製完整功能代碼
```bash
# 複製整個 src 目錄
xcopy src ..\yunshui-mobile-v2\src /E /I /Y
```

### 步驟 4: 複製主要文件 (但不包括 package.json)
```bash
# 只複製 App.tsx
copy App.tsx ..\yunshui-mobile-v2\App.tsx /Y

# 不要複製 package.json - 保持新專案的版本
```

### 步驟 5: 進入新專案目錄
```bash
cd ..\yunshui-mobile-v2
```

### 步驟 6: 檢查複製結果
```bash
# 檢查 src 目錄
dir src

# 檢查 App.tsx
type App.tsx
```

### 步驟 7: 安裝必要依賴
```bash
# 安裝 React Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context

# 安裝狀態管理
npm install @reduxjs/toolkit react-redux

# 安裝 API 客戶端
npm install axios

# 安裝 UI 組件
npm install react-native-paper

# 安裝其他工具
npm install @react-native-async-storage/async-storage
```

### 步驟 8: 檢查版本相容性
```bash
# 檢查 Expo 版本
npx expo --version

# 檢查 package.json 中的 expo 版本
type package.json | findstr expo
```

### 步驟 9: 啟動應用程式
```bash
npx expo start --tunnel --clear
```

## 🔍 如果遇到問題

### 問題 1: 依賴安裝失敗
```bash
# 清除快取
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 問題 2: 版本相容性錯誤
```bash
# 檢查是否意外複製了舊版本的 package.json
# 如果是，恢復新專案的 package.json
```

### 問題 3: 模組找不到
```bash
# 安裝缺少的依賴
npm install [缺少的模組名稱]
```

## 📱 預期結果

如果一切順利，你應該會看到：
1. ✅ 完整的登入頁面
2. ✅ 底部導航 (儀表板、訂單、基材、狀態、個人資料)
3. ✅ 所有功能頁面都能正常運作
4. ✅ 沒有版本相容性錯誤

## 🎯 版本安全檢查

在啟動前，確認：
- ✅ 新專案使用 SDK 51
- ✅ Expo Go 版本是 SDK 54 (相容 SDK 51)
- ✅ 沒有複製舊的 package.json
- ✅ 所有依賴都是相容版本

---

**記住**: 保持 SDK 51 版本是關鍵，這樣就不會再遇到版本不匹配問題！