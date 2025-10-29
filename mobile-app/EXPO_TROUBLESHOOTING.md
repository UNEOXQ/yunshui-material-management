# Expo Go 連線問題故障排除指南

## 🚨 問題: `java.io.IOException: Failed to download remote update`

這個錯誤表示 Expo Go 無法從開發伺服器下載應用程式更新。

## 🔧 解決方案 (按優先順序)

### 1. 🚇 使用 Tunnel 模式 (最推薦)

**為什麼有效**: Tunnel 模式通過 Expo 的伺服器建立連線，可以繞過大部分網路限制。

**如何執行**:
```bash
# 在 mobile-app 目錄中執行
npx expo start --tunnel
```

**注意事項**:
- 首次使用可能需要 2-3 分鐘建立連線
- 速度可能比 LAN 模式慢一些
- 需要穩定的網路連線

### 2. 🌐 檢查網路設定

**確認事項**:
- ✅ 手機和電腦在同一個 WiFi 網路
- ✅ 不是公司或學校的受限網路
- ✅ 路由器沒有 AP 隔離功能啟用

**測試方法**:
```bash
# 檢查電腦 IP 地址
ipconfig

# 在手機瀏覽器中訪問
http://[電腦IP]:8081
```

### 3. 🔥 防火牆和防毒軟體

**Windows 防火牆**:
1. 開啟 Windows 設定
2. 前往「更新與安全性」>「Windows 安全性」
3. 點擊「防火牆與網路保護」
4. 暫時關閉「私人網路」防火牆

**防毒軟體**:
- 暫時關閉即時保護
- 將專案目錄加入白名單
- 檢查是否有網路保護功能

### 4. 📱 Expo Go 應用程式問題

**清除快取**:
1. 開啟 Expo Go
2. 點擊「Profile」標籤
3. 點擊「Settings」
4. 點擊「Clear cache」
5. 重新啟動 Expo Go

**更新應用程式**:
- 確保 Expo Go 是最新版本
- Android: Google Play Store
- iOS: App Store

### 5. 🔄 重新啟動服務

**重新啟動開發伺服器**:
```bash
# 停止當前服務 (Ctrl+C)
# 然後重新啟動
npx expo start --clear
```

**重新啟動設備**:
- 重新啟動電腦
- 重新啟動手機
- 重新啟動路由器

## 🎯 快速測試步驟

### 步驟 1: 使用 Tunnel 模式
```bash
cd mobile-app
npx expo start --tunnel
```

### 步驟 2: 等待 Tunnel 建立
看到類似訊息表示成功:
```
› Tunnel ready.
› Tunnel URL: exp://u.expo.dev/[project-id]
```

### 步驟 3: 掃描新的 QR 碼
- 使用 Expo Go 掃描新的 QR 碼
- 或手動輸入 Tunnel URL

### 步驟 4: 等待下載
- 首次載入可能需要 1-2 分鐘
- 看到載入進度條是正常的

## 🔍 其他連線模式

### LAN 模式
```bash
npx expo start --lan
```
- 適用於同一網路的設備
- 速度較快但可能有連線問題

### Localhost 模式
```bash
npx expo start --localhost
```
- 僅適用於模擬器
- 不適用於實體手機

## 📱 替代測試方法

### 1. 使用 Android 模擬器
如果手機連線持續有問題，可以使用 Android 模擬器:

```bash
# 安裝 Android Studio 後
npx expo start --android
```

### 2. 使用 iOS 模擬器 (僅限 macOS)
```bash
npx expo start --ios
```

### 3. 使用 Web 版本
```bash
npx expo start --web
```

## 🐛 常見錯誤和解決方案

### 錯誤: "Network response timed out"
**解決方案**: 使用 Tunnel 模式或檢查網路連線

### 錯誤: "Unable to resolve hostname"
**解決方案**: 檢查 DNS 設定或使用 Tunnel 模式

### 錯誤: "Connection refused"
**解決方案**: 檢查防火牆設定或使用不同的連線模式

### 錯誤: "Metro bundler crashed"
**解決方案**: 
```bash
npx expo start --clear
# 或
rm -rf node_modules && npm install
```

## 📞 需要更多幫助？

### 檢查 Expo 狀態
- 訪問 https://status.expo.dev/ 檢查服務狀態

### 社群支援
- Expo Discord: https://chat.expo.dev/
- Expo Forums: https://forums.expo.dev/
- Stack Overflow: 搜尋 "expo" 標籤

### 本地診斷
執行診斷腳本:
```bash
.\fix-expo-connection.ps1
```

---

## 🎯 推薦的測試流程

1. **首先嘗試 Tunnel 模式** - 解決 90% 的連線問題
2. **如果 Tunnel 太慢** - 檢查防火牆設定
3. **如果仍有問題** - 使用模擬器測試
4. **最後手段** - 重新建立專案

**記住**: Tunnel 模式是最可靠的連線方式，雖然可能較慢，但幾乎總是有效的！