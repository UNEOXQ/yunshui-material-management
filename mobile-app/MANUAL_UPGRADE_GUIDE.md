# 手動升級 Expo SDK 指南

## 🎯 目標
將專案從 SDK 49 升級到 SDK 51，以相容 Expo Go SDK 54

## 📋 升級步驟

### 步驟 1: 備份現有專案
```bash
# 在 mobile-app 的上層目錄執行
cp -r mobile-app mobile-app-backup-$(date +%Y%m%d)
```

### 步驟 2: 升級核心 Expo 套件
```bash
cd mobile-app
npm install expo@~51.0.0
```

### 步驟 3: 升級相關依賴
```bash
npx expo install --fix
```

### 步驟 4: 手動更新特定套件 (如果自動升級失敗)
```bash
npm install react-native@0.74.5
npm install @expo/cli@latest
npm install expo-image-picker@~15.0.7
npm install expo-image-manipulator@~12.0.5
npm install expo-sqlite@~14.0.6
```

### 步驟 5: 清除快取並重新安裝
```bash
rm -rf node_modules package-lock.json
npm install
```

### 步驟 6: 更新配置文件

#### 更新 app.json
```json
{
  "expo": {
    "name": "雲水基材管理",
    "slug": "yunshui-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android"],
    "splash": {
      "backgroundColor": "#007bff"
    },
    "android": {
      "package": "com.yunshui.mobile"
    },
    "ios": {
      "bundleIdentifier": "com.yunshui.mobile"
    }
  }
}
```

### 步驟 7: 測試啟動
```bash
npx expo start --tunnel
```

## 🔧 如果升級失敗

### 方案 A: 建立全新專案
```bash
# 在上層目錄執行
npx create-expo-app yunshui-mobile-new --template blank-typescript
cd yunshui-mobile-new

# 複製現有程式碼
cp ../mobile-app/App.tsx ./App.tsx
cp ../mobile-app/app.json ./app.json

# 啟動測試
npx expo start --tunnel
```

### 方案 B: 使用 Development Build
```bash
# 安裝 dev client
npx expo install expo-dev-client

# 建立 development build
npx expo run:android
```

## 📱 版本對應表

| Expo Go 版本 | 支援的 SDK 版本 |
|--------------|----------------|
| SDK 54 | SDK 51, 52, 53, 54 |
| SDK 53 | SDK 50, 51, 52, 53 |
| SDK 52 | SDK 49, 50, 51, 52 |

## 🎯 預期結果

升級成功後，你應該能夠：
1. ✅ 在 Expo Go 中正常載入應用程式
2. ✅ 看到「雲水基材管理系統」測試頁面
3. ✅ 沒有版本相容性錯誤

## 🐛 常見問題

### Q: 升級後出現新的錯誤
A: 檢查 package.json 中的依賴版本，確保都是 SDK 51 相容的版本

### Q: 某些套件無法升級
A: 暫時移除有問題的套件，先讓基本應用程式運行

### Q: Development Build 失敗
A: 確保已安裝 Android Studio 並設定好 Android SDK

## 💡 建議

1. **優先嘗試自動升級** (`npx expo install --fix`)
2. **如果失敗，建立新專案** (最穩定的方案)
3. **保留備份** 以防需要回滾
4. **逐步測試** 每個步驟完成後都測試一下

---

**記住**: 版本升級可能會帶來一些相容性問題，但基本的 React Native 程式碼應該都能正常工作。