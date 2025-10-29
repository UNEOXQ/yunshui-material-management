# 雲水基材管理系統 iOS 建置指南

## 概述

本指南說明如何建置雲水基材管理系統的 iOS 應用程式，包括模擬器版本、設備測試版本和 App Store 發布版本。

## 前置需求

### 必要軟體和工具

1. **macOS** (建置 iOS 應用程式必須在 macOS 上進行)
   - macOS 10.15 (Catalina) 或更新版本

2. **Xcode** (最新版本)
   - 下載: Mac App Store 或 Apple Developer 網站
   - 驗證安裝: `xcode-select --version`

3. **Xcode Command Line Tools**
   - 安裝: `xcode-select --install`

4. **Node.js** (版本 16 或以上)
   - 下載: https://nodejs.org/
   - 驗證安裝: `node --version`

5. **CocoaPods** (iOS 依賴管理)
   - 安裝: `sudo gem install cocoapods`
   - 驗證安裝: `pod --version`

### Apple 開發者帳號設定

1. **Apple Developer Program 會員資格**
   - 註冊: https://developer.apple.com/programs/
   - 年費: $99 USD

2. **開發證書設定**
   - iOS Development Certificate (開發用)
   - iOS Distribution Certificate (發布用)

3. **App ID 註冊**
   - Bundle Identifier: `com.yunshui.mobile`
   - 啟用必要的 App Services

4. **Provisioning Profiles**
   - Development Profile (開發用)
   - Ad Hoc Profile (測試用)
   - App Store Profile (發布用)

## 建置設定檔

專案包含三種 iOS 建置設定檔：

### 1. Simulator (模擬器版本)
- **用途**: 開發和初步測試
- **特點**: 只能在 iOS 模擬器中運行
- **優點**: 不需要實體設備和證書
- **建置命令**: `npm run build:ios:simulator`

### 2. Device (設備測試版本)
- **用途**: 實體設備測試
- **特點**: 可安裝在註冊的測試設備上
- **需求**: 開發證書和 Ad Hoc Provisioning Profile
- **建置命令**: `npm run build:ios:device`

### 3. App Store (正式版本)
- **用途**: 發布到 App Store
- **特點**: 經過完整優化和簽名
- **需求**: 發布證書和 App Store Provisioning Profile
- **建置命令**: `npm run build:ios:appstore`

## 快速開始

### 方法一: 使用 npm 腳本

```bash
# 安裝依賴
npm install

# 建置模擬器版本
npm run build:ios:simulator

# 建置設備測試版本
npm run build:ios:device

# 建置 App Store 版本
npm run build:ios:appstore
```

### 方法二: 使用建置腳本

```bash
# 建置模擬器版本
node scripts/build-ios.js simulator

# 建置設備測試版本
node scripts/build-ios.js device

# 建置 App Store 版本
node scripts/build-ios.js appstore
```

### 方法三: 直接使用 EAS CLI

```bash
# 建置模擬器版本
eas build --platform ios --profile development

# 建置設備測試版本
eas build --platform ios --profile preview

# 建置 App Store 版本
eas build --platform ios --profile production
```

## 證書和配置檔案管理

### 使用 EAS 管理證書

```bash
# 設定 iOS 證書
eas credentials

# 選擇選項:
# ? Select platform › iOS
# ? What do you want to do? › Build credentials
# ? Select build credentials › distribution certificate
# ? What do you want to do? › Generate a new certificate
```

### 手動管理證書

1. **生成 Certificate Signing Request (CSR)**
   - 開啟「鑰匙圈存取」
   - 選擇「鑰匙圈存取」>「憑證輔助程式」>「從憑證授權要求憑證」
   - 填寫電子郵件地址和常用名稱
   - 選擇「儲存到磁碟」

2. **在 Apple Developer 網站建立證書**
   - 登入 https://developer.apple.com/account/
   - 選擇「Certificates, Identifiers & Profiles」
   - 建立新的 iOS Development 或 iOS Distribution 證書
   - 上傳 CSR 檔案

3. **下載並安裝證書**
   - 下載 .cer 檔案
   - 雙擊安裝到鑰匙圈

4. **建立 Provisioning Profile**
   - 在 Apple Developer 網站建立新的 Provisioning Profile
   - 選擇對應的 App ID 和證書
   - 選擇測試設備 (Ad Hoc 和 Development 類型)
   - 下載 .mobileprovision 檔案

## 建置流程詳解

### 1. 環境檢查
- 檢查 macOS 版本
- 檢查 Xcode 安裝
- 檢查 Node.js 和 npm 版本
- 驗證 Apple Developer 帳號

### 2. 依賴安裝
- 安裝 npm 依賴
- 安裝 CocoaPods 依賴 (如果需要)
- 檢查 React Native 套件

### 3. 程式碼檢查
- TypeScript 類型檢查
- ESLint 程式碼檢查
- 確保沒有編譯錯誤

### 4. 資源處理
- 處理應用程式圖示
- 處理啟動畫面
- 優化圖片資源

### 5. 應用程式建置
- 編譯 JavaScript 程式碼
- 編譯原生 iOS 程式碼
- 簽名應用程式
- 生成 .ipa 檔案

## 測試和部署

### 模擬器測試

```bash
# 啟動 iOS 模擬器
open -a Simulator

# 安裝應用程式到模擬器
xcrun simctl install booted path/to/app.app
```

### 實體設備測試

1. **使用 Xcode**
   - 開啟 Xcode
   - 選擇「Window」>「Devices and Simulators」
   - 連接 iOS 設備
   - 拖拽 .ipa 檔案到設備

2. **使用 Apple Configurator 2**
   - 下載: Mac App Store
   - 連接設備並安裝應用程式

3. **使用 TestFlight**
   - 上傳到 App Store Connect
   - 邀請測試人員
   - 透過 TestFlight 應用程式安裝

### App Store 發布

1. **上傳到 App Store Connect**
   ```bash
   # 使用 Xcode
   xcrun altool --upload-app -f path/to/app.ipa -u your-apple-id -p your-app-password
   
   # 或使用 Transporter 應用程式
   ```

2. **在 App Store Connect 中設定**
   - 填寫應用程式資訊
   - 上傳截圖和描述
   - 設定價格和可用性
   - 提交審核

## 疑難排解

### 常見問題

#### 1. 建置失敗: "No matching provisioning profiles found"
**解決方案**:
- 檢查 Bundle Identifier 是否正確
- 確保 Provisioning Profile 包含正確的 App ID
- 檢查證書是否有效

#### 2. 建置失敗: "Code signing error"
**解決方案**:
- 檢查開發者證書是否安裝
- 確保證書沒有過期
- 檢查 Keychain 中的證書狀態

#### 3. 無法安裝到設備: "App installation failed"
**解決方案**:
- 檢查設備是否已註冊到 Provisioning Profile
- 確保設備 iOS 版本符合最低要求
- 檢查設備儲存空間

#### 4. 模擬器無法啟動應用程式
**解決方案**:
- 重置模擬器: `xcrun simctl erase all`
- 檢查模擬器 iOS 版本
- 重新建置應用程式

### 效能優化

1. **減少應用程式大小**
   - 移除未使用的圖片資源
   - 使用 App Thinning
   - 啟用 Bitcode

2. **提升建置速度**
   - 使用 Xcode Build Cache
   - 啟用並行建置
   - 使用更快的 Mac

3. **提高應用程式效能**
   - 啟用 Release 模式建置
   - 優化圖片載入
   - 使用 iOS 原生組件

## 版本管理

### 版本號規則
- **CFBundleShortVersionString**: 市場版本號 (1.0.0)
- **CFBundleVersion**: 建置版本號 (1)

### 更新版本號
```bash
# 使用版本管理腳本
npm run version:bump

# 手動更新 app.json
# 更新 expo.version 和 expo.ios.buildNumber
```

### 發布流程
1. 完成功能開發和測試
2. 更新版本號
3. 建置 App Store 版本
4. 上傳到 App Store Connect
5. 提交審核
6. 發布更新

## 自動化建置

### 使用 GitHub Actions

```yaml
# .github/workflows/ios-build.yml
name: iOS Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Setup EAS
      uses: expo/expo-github-action@v8
      with:
        eas-version: latest
        token: ${{ secrets.EXPO_TOKEN }}
        
    - name: Build iOS
      run: eas build --platform ios --profile preview --non-interactive
```

### 使用 Fastlane

```ruby
# Fastfile
default_platform(:ios)

platform :ios do
  desc "Build for App Store"
  lane :release do
    build_app(
      scheme: "YunShuiMobile",
      export_method: "app-store"
    )
    
    upload_to_app_store(
      skip_metadata: true,
      skip_screenshots: true
    )
  end
end
```

## 聯絡資訊

如果在 iOS 建置過程中遇到問題，請聯絡開發團隊：
- 技術支援: [技術支援信箱]
- iOS 開發文件: [iOS 開發文件連結]
- Apple Developer 支援: https://developer.apple.com/support/

---

**注意**: iOS 建置需要 macOS 環境和有效的 Apple Developer 帳號。請確保遵循 Apple 的開發者指南和政策。