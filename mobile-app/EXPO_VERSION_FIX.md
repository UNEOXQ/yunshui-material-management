# Expo 版本相容性問題解決方案

## 🚨 問題描述

- **Expo Go 版本**: SDK 54
- **專案版本**: SDK 49
- **錯誤**: "Project is incompatible with this version of Expo Go"

## 🎯 解決方案 (按推薦順序)

### 方案 1: 使用 Expo Development Build (推薦)

這是最穩定的解決方案，不需要升級或降級任何版本：

```bash
# 建立 Development Build
npx expo run:android
# 或
npx expo run:ios
```

**優點**:
- 不需要修改現有代碼
- 版本完全相容
- 更接近正式版本的行為

### 方案 2: 使用 Web 版本測試

先在瀏覽器中測試應用程式：

```bash
npx expo start --web
```

**優點**:
- 立即可用
- 不需要手機
- 可以驗證應用程式邏輯

### 方案 3: 升級專案到 SDK 51+ (需要時間)

如果需要使用最新功能：

```bash
# 執行升級腳本
.\upgrade-expo-sdk.ps1

# 或手動升級
npx expo install --fix
```

**注意**: 可能需要修改代碼以適應新版本

### 方案 4: 使用舊版 Expo Go (不推薦)

下載相容 SDK 49 的 Expo Go 版本，但這不是長期解決方案。

## 🚀 立即可行的測試方案

### 1. Web 版本測試 (最快)

```bash
cd mobile-app
npx expo start --web
```

在瀏覽器中打開 `http://localhost:8081` 查看應用程式。

### 2. 建立 Development Build

```bash
# Android
npx expo run:android

# iOS (僅限 macOS)
npx expo run:ios
```

這會在你的手機上安裝一個專用的開發版本。

## 📱 測試結果預期

如果使用 Web 版本或 Development Build，你應該能看到：

```
🏗️ 雲水基材管理系統
手機版 v1.0.0
✅ 應用程式已成功啟動
```

## 🔧 故障排除

### 如果 Web 版本也失敗

檢查瀏覽器控制台的錯誤訊息：

```bash
# 清除快取重新啟動
npx expo start --web --clear
```

### 如果 Development Build 失敗

確保已安裝必要的開發工具：

```bash
# Android
# 需要 Android Studio 和 Android SDK

# iOS (僅限 macOS)
# 需要 Xcode
```

## 💡 建議的測試流程

1. **先用 Web 版本** 驗證應用程式基本功能
2. **如果 Web 版本正常**，再考慮 Development Build
3. **如果都正常**，說明專案配置沒問題，只是版本相容性問題

## 📞 需要幫助？

如果遇到其他問題：

1. **檢查錯誤日誌**: 在終端查看詳細錯誤訊息
2. **檢查網路連線**: 確保網路穩定
3. **重新啟動服務**: 停止並重新啟動 Expo 開發伺服器

---

**結論**: 版本不相容問題實際上是個好消息，表示你的專案配置基本正確！選擇上述任一方案都能讓你繼續測試應用程式。