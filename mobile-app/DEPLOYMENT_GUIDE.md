# 雲水基材管理系統 Mobile App 部署指南

## 概述

本指南提供雲水基材管理系統 Mobile App 的完整部署流程，包括開發環境設置、建置流程、測試驗證和發布到應用商店的詳細步驟。

## 目錄

1. [環境準備](#環境準備)
2. [專案設置](#專案設置)
3. [建置流程](#建置流程)
4. [測試驗證](#測試驗證)
5. [應用商店發布](#應用商店發布)
6. [部署後維護](#部署後維護)
7. [疑難排解](#疑難排解)

## 環境準備

### 系統需求

#### 開發環境
- **作業系統**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 版本 16.0 或以上
- **npm**: 版本 8.0 或以上
- **Git**: 最新版本

#### Android 開發 (可選，用於本地建置)
- **Android Studio**: 最新版本
- **Android SDK**: API Level 28 或以上
- **Java JDK**: 版本 11 或以上

#### iOS 開發 (僅限 macOS)
- **Xcode**: 最新版本
- **iOS SDK**: iOS 12.0 或以上
- **Apple Developer Account**: 用於發布

### 必要工具安裝

#### 1. Node.js 和 npm
```bash
# 下載並安裝 Node.js (包含 npm)
# https://nodejs.org/

# 驗證安裝
node --version  # 應顯示 v16.0.0 或以上
npm --version   # 應顯示 8.0.0 或以上
```

#### 2. EAS CLI (Expo Application Services)
```bash
# 全域安裝 EAS CLI
npm install -g eas-cli

# 驗證安裝
eas --version

# 登入 Expo 帳號
eas login
```

#### 3. Git
```bash
# Windows: 下載 Git for Windows
# https://git-scm.com/download/win

# macOS: 使用 Homebrew
brew install git

# Ubuntu: 使用 apt
sudo apt update
sudo apt install git

# 驗證安裝
git --version
```

### Expo 帳號設置

1. **註冊 Expo 帳號**
   - 前往 https://expo.dev/signup
   - 使用電子郵件註冊帳號
   - 驗證電子郵件地址

2. **建立專案**
   - 登入 Expo Dashboard
   - 建立新專案或連接現有專案
   - 記錄專案 slug 和組織名稱

## 專案設置

### 1. 取得原始碼

```bash
# 複製專案儲存庫
git clone [專案儲存庫URL]
cd yunshui-mobile

# 切換到 mobile-app 目錄
cd mobile-app
```

### 2. 安裝依賴

```bash
# 安裝 npm 依賴
npm install

# 清除快取 (如果遇到問題)
npm run clean
```

### 3. 環境變數設置

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯環境變數
# 設置 API 端點、Cloudinary 設定等
```

### 4. 專案配置檢查

```bash
# 檢查 TypeScript 配置
npm run type-check

# 檢查程式碼品質
npm run lint

# 格式化程式碼
npm run format
```

## 建置流程

### Android 建置

#### 1. 開發版本 (Debug APK)
```bash
# 建置開發版本
npm run build:android:debug

# 或使用自動化腳本
npm run build:auto:debug
```

#### 2. 預覽版本 (Preview APK)
```bash
# 建置預覽版本 (用於測試)
npm run build:android:apk

# 或使用自動化腳本
npm run build:auto
```

#### 3. 正式版本 (Production AAB)
```bash
# 建置正式版本 (用於 Google Play)
npm run build:android

# 或使用自動化腳本
npm run build:auto:production
```

### iOS 建置

#### 1. 模擬器版本
```bash
# 建置模擬器版本
npm run build:ios:simulator

# 或使用自動化腳本
npm run build:ios:auto:simulator
```

#### 2. 設備測試版本
```bash
# 建置設備測試版本
npm run build:ios:device

# 或使用自動化腳本
npm run build:ios:auto
```

#### 3. App Store 版本
```bash
# 建置 App Store 版本
npm run build:ios:appstore

# 或使用自動化腳本
npm run build:ios:auto:appstore
```

### 建置狀態監控

```bash
# 查看建置狀態
eas build:list

# 查看特定建置詳情
eas build:view [BUILD_ID]

# 下載建置檔案
eas build:download [BUILD_ID]
```

## 測試驗證

### 1. 自動化測試

```bash
# 執行單元測試
npm test

# 執行跨平台測試
npm run test:cross-platform

# 執行最終測試
npm run test:final

# 生成測試覆蓋率報告
npm run test:coverage
```

### 2. APK 測試

```bash
# 測試 APK 檔案
npm run test:apk [APK_PATH]

# 完整建置和測試流程
npm run build:test
```

### 3. 手動測試檢查清單

#### 功能測試
- [ ] 用戶登入/登出功能
- [ ] 基材管理 (新增、編輯、刪除、查看)
- [ ] 訂單管理 (建立、更新、狀態變更)
- [ ] 圖片上傳功能
- [ ] 離線功能
- [ ] 資料同步

#### 用戶介面測試
- [ ] 響應式設計
- [ ] 觸控操作
- [ ] 手勢支援
- [ ] 載入狀態
- [ ] 錯誤處理

#### 效能測試
- [ ] 應用程式啟動時間 (<3秒)
- [ ] 頁面切換流暢度
- [ ] 記憶體使用量
- [ ] 電池消耗

#### 相容性測試
- [ ] 不同 Android 版本 (8.0+)
- [ ] 不同 iOS 版本 (12.0+)
- [ ] 不同螢幕尺寸
- [ ] 不同網路環境

## 應用商店發布

### Google Play Store 發布

#### 1. 準備工作
```bash
# 建置正式版 AAB
npm run build:android

# 確保版本號已更新
npm run version:show
npm run version:bump  # 如需要
```

#### 2. Google Play Console 設置
1. 登入 [Google Play Console](https://play.google.com/console)
2. 建立新應用程式或選擇現有應用程式
3. 填寫應用程式資訊：
   - 應用程式名稱: "雲水基材管理系統"
   - 簡短描述: "專業的基材庫存管理解決方案"
   - 完整描述: [參考用戶手冊中的描述]
   - 應用程式類別: "商業"
   - 內容分級: 適合所有年齡

#### 3. 上傳 AAB 檔案
1. 前往「發布」>「正式版」
2. 建立新版本
3. 上傳 AAB 檔案
4. 填寫版本資訊
5. 檢查並提交審核

#### 4. 商店資料
- **應用程式圖示**: 512x512 PNG
- **功能圖片**: 1024x500 PNG
- **手機截圖**: 至少 2 張，最多 8 張
- **平板截圖**: 至少 1 張 (如支援)
- **隱私權政策**: 必須提供 URL

### Apple App Store 發布

#### 1. 準備工作
```bash
# 建置 App Store 版本
npm run build:ios:appstore

# 確保版本號已更新
npm run version:show
npm run version:bump  # 如需要
```

#### 2. App Store Connect 設置
1. 登入 [App Store Connect](https://appstoreconnect.apple.com)
2. 建立新 App 或選擇現有 App
3. 填寫 App 資訊：
   - App 名稱: "雲水基材管理系統"
   - 副標題: "專業基材管理"
   - 類別: "商業"
   - 內容分級: 4+

#### 3. 上傳 IPA 檔案
1. 使用 Xcode 或 Transporter 上傳
2. 等待處理完成
3. 在 App Store Connect 中選擇建置版本

#### 4. App Store 資料
- **App 圖示**: 1024x1024 PNG
- **iPhone 截圖**: 6.5" 和 5.5" 顯示器
- **iPad 截圖**: 12.9" 和 11" 顯示器 (如支援)
- **App 預覽**: 可選，最多 3 個影片
- **描述**: 最多 4000 字元
- **關鍵字**: 最多 100 字元
- **支援 URL**: 必須提供
- **隱私權政策 URL**: 必須提供

## 部署後維護

### 1. 監控和分析

#### 應用程式效能監控
- 使用 Expo Analytics 監控使用情況
- 監控崩潰報告和錯誤日誌
- 追蹤關鍵效能指標 (KPI)

#### 用戶反饋收集
- 監控應用商店評論和評分
- 設置用戶反饋收集機制
- 定期分析用戶行為數據

### 2. 版本更新流程

#### 熱更新 (Over-the-Air Updates)
```bash
# 發布熱更新 (僅限 JavaScript 變更)
eas update --branch production --message "修復登入問題"

# 查看更新狀態
eas update:list --branch production
```

#### 完整版本更新
```bash
# 更新版本號
npm run version:bump

# 建置新版本
npm run build:auto:production  # Android
npm run build:ios:auto:appstore  # iOS

# 發布到應用商店
# (按照上述發布流程)
```

### 3. 備份和災難恢復

#### 程式碼備份
- 定期推送到 Git 儲存庫
- 建立版本標籤 (Git Tags)
- 維護多個分支 (development, staging, production)

#### 建置檔案備份
- 保存重要版本的 APK/IPA 檔案
- 備份簽名金鑰和證書
- 記錄建置配置和環境變數

## 疑難排解

### 常見建置問題

#### 1. EAS CLI 相關問題

**問題**: `eas: command not found`
```bash
# 解決方案: 重新安裝 EAS CLI
npm uninstall -g eas-cli
npm install -g eas-cli
```

**問題**: `Authentication failed`
```bash
# 解決方案: 重新登入
eas logout
eas login
```

#### 2. Android 建置問題

**問題**: `Gradle build failed`
```bash
# 解決方案: 清除快取並重新建置
npm run clean
rm -rf node_modules
npm install
npm run build:android:debug
```

**問題**: `APK 檔案過大`
```bash
# 解決方案: 使用 AAB 格式和啟用 App Bundle
# 在 eas.json 中設置:
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

#### 3. iOS 建置問題

**問題**: `No matching provisioning profiles found`
```bash
# 解決方案: 重新設置證書
eas credentials
# 選擇 iOS > Build credentials > All
```

**問題**: `Code signing error`
```bash
# 解決方案: 檢查 Apple Developer 帳號狀態
# 確保證書和 Provisioning Profile 有效
```

### 效能優化

#### 1. 應用程式大小優化
```bash
# 分析 bundle 大小
npx react-native-bundle-visualizer

# 移除未使用的依賴
npx depcheck

# 優化圖片資源
npm run optimize
```

#### 2. 建置時間優化
```bash
# 使用本地建置 (需要本地 SDK)
eas build --platform android --profile preview --local

# 啟用建置快取
# 在 eas.json 中設置 cache 選項
```

### 支援資源

#### 官方文件
- [Expo 文件](https://docs.expo.dev/)
- [React Native 文件](https://reactnative.dev/docs/getting-started)
- [EAS Build 文件](https://docs.expo.dev/build/introduction/)

#### 社群支援
- [Expo Discord](https://chat.expo.dev/)
- [React Native Community](https://reactnative.dev/community/overview)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

#### 聯絡資訊
- **技術支援**: [技術支援信箱]
- **專案文件**: [專案文件連結]
- **問題回報**: [GitHub Issues 連結]

---

## 附錄

### A. 環境變數範本

```bash
# .env 檔案範本
API_BASE_URL=https://your-api-domain.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SENTRY_DSN=your-sentry-dsn
```

### B. 建置配置範本

```json
// eas.json 範本
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### C. 版本管理腳本

```javascript
// scripts/version-manager.js 使用範例
const versionManager = require('./version-manager');

// 顯示當前版本
versionManager.show();

// 自動增加修訂版本號
versionManager.bump();

// 增加次版本號
versionManager.bump('minor');

// 設置特定版本號
versionManager.set('1.2.0');
```

---

**最後更新**: 2024年10月
**文件版本**: 1.0.0
**適用於**: 雲水基材管理系統 Mobile App v1.0.0+