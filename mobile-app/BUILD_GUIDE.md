# 雲水基材管理系統 Mobile App 建置指南

## 概述

本指南說明如何建置雲水基材管理系統的 Android APK 檔案，包括開發版、預覽版和正式版的建置流程。

## 前置需求

### 必要軟體

1. **Node.js** (版本 16 或以上)
   - 下載: https://nodejs.org/
   - 驗證安裝: `node --version`

2. **npm** (通常隨 Node.js 一起安裝)
   - 驗證安裝: `npm --version`

3. **Git** (用於版本控制)
   - 下載: https://git-scm.com/
   - 驗證安裝: `git --version`

### Expo 帳號設置

1. 註冊 Expo 帳號: https://expo.dev/signup
2. 安裝 EAS CLI: `npm install -g eas-cli`
3. 登入帳號: `eas login`

## 建置設定檔

專案包含三種建置設定檔：

### 1. Development (開發版)
- **用途**: 開發和除錯
- **特點**: 包含除錯資訊，支援熱重載
- **檔案大小**: 較大
- **建置命令**: `npm run build:android:debug`

### 2. Preview (預覽版)
- **用途**: 內部測試和展示
- **特點**: 優化過的 APK，但仍可安裝在任何設備
- **檔案大小**: 中等
- **建置命令**: `npm run build:android:apk`

### 3. Production (正式版)
- **用途**: 發布到 Google Play Store
- **特點**: 完全優化，生成 AAB 格式
- **檔案大小**: 最小
- **建置命令**: `npm run build:android`

## 快速開始

### 方法一: 使用批次檔 (Windows)

1. 雙擊 `build-apk.bat`
2. 選擇建置模式 (debug/preview/release)
3. 等待建置完成

### 方法二: 使用 PowerShell 腳本

```powershell
# 建置預覽版 APK
.\build-apk.ps1 preview

# 建置除錯版 APK
.\build-apk.ps1 debug

# 使用本地建置
.\build-apk.ps1 preview -Local

# 查看說明
.\build-apk.ps1 -Help
```

### 方法三: 使用 npm 腳本

```bash
# 安裝依賴
npm install

# 建置預覽版 APK
npm run build:android:apk

# 建置除錯版 APK
npm run build:android:debug

# 建置正式版 (AAB)
npm run build:android
```

### 方法四: 直接使用 EAS CLI

```bash
# 建置預覽版 APK
eas build --platform android --profile preview

# 建置除錯版 APK
eas build --platform android --profile development

# 本地建置 (需要 Android SDK)
eas build --platform android --profile preview --local
```

## 建置流程詳解

### 1. 環境檢查
- 檢查 Node.js 和 npm 版本
- 檢查 EAS CLI 安裝狀態
- 驗證 Expo 帳號登入狀態

### 2. 依賴安裝
- 自動安裝專案依賴
- 檢查必要的 React Native 套件

### 3. 程式碼檢查
- 執行 TypeScript 類型檢查
- 執行 ESLint 程式碼檢查
- 確保沒有編譯錯誤

### 4. 資源處理
- 壓縮圖片資源
- 優化字體檔案
- 處理應用程式圖示

### 5. APK 生成
- 編譯 JavaScript 程式碼
- 打包原生程式碼
- 簽名 APK 檔案
- 生成最終的 APK

## 建置輸出

### 檔案位置
建置完成後，APK 檔案會儲存在：
- **雲端建置**: 下載連結會顯示在終端機中
- **本地建置**: `./build/` 目錄下

### 檔案命名規則
- `yunshui-mobile-debug.apk` - 除錯版
- `yunshui-mobile-preview.apk` - 預覽版
- `yunshui-mobile-release.aab` - 正式版 (AAB 格式)

## 安裝和測試

### 安裝 APK
1. 將 APK 檔案傳輸到 Android 設備
2. 在設備上啟用「未知來源」安裝
3. 點擊 APK 檔案進行安裝

### 測試檢查清單
- [ ] 應用程式正常啟動
- [ ] 登入功能正常
- [ ] 基材管理功能正常
- [ ] 訂單管理功能正常
- [ ] 圖片上傳功能正常
- [ ] 離線功能正常
- [ ] 效能表現良好

## 疑難排解

### 常見問題

#### 1. 建置失敗: "未找到 EAS CLI"
**解決方案**:
```bash
npm install -g eas-cli
eas login
```

#### 2. 建置失敗: "未登入 Expo 帳號"
**解決方案**:
```bash
eas login
# 輸入您的 Expo 帳號和密碼
```

#### 3. 建置失敗: "依賴套件錯誤"
**解決方案**:
```bash
# 清除快取並重新安裝
rm -rf node_modules package-lock.json
npm install
```

#### 4. APK 檔案過大
**解決方案**:
- 使用 `preview` 或 `production` 設定檔
- 檢查是否包含不必要的資源檔案
- 考慮使用 AAB 格式 (Android App Bundle)

#### 5. 安裝時顯示「未知來源」警告
**解決方案**:
- 在 Android 設定中啟用「允許安裝未知來源的應用程式」
- 或使用 `adb install` 命令安裝

### 效能優化建議

1. **減少 APK 大小**:
   - 移除未使用的圖片資源
   - 使用 WebP 格式的圖片
   - 啟用程式碼壓縮

2. **提升建置速度**:
   - 使用本地建置 (`--local` 參數)
   - 啟用建置快取
   - 使用更快的網路連線

3. **提高應用程式效能**:
   - 啟用 Hermes JavaScript 引擎
   - 使用 Release 模式建置
   - 優化圖片載入

## 版本管理

### 版本號規則
- **主版本號**: 重大功能更新
- **次版本號**: 新功能添加
- **修訂版本號**: 錯誤修復

### 更新版本號
1. 修改 `package.json` 中的 `version`
2. 修改 `app.json` 中的 `version` 和 `versionCode`
3. 提交版本變更到 Git

### 發布流程
1. 完成功能開發和測試
2. 更新版本號
3. 建置正式版 APK/AAB
4. 上傳到 Google Play Console
5. 發布更新

## 聯絡資訊

如果在建置過程中遇到問題，請聯絡開發團隊：
- 技術支援: [技術支援信箱]
- 專案文件: [專案文件連結]
- 問題回報: [GitHub Issues 連結]

---

**注意**: 本指南會隨著專案發展持續更新，請定期查看最新版本。