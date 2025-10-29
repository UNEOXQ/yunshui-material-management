# Render Keep-Alive 防休眠指南

## 概述

Render 免費版服務會在 15 分鐘無活動後自動休眠。這個 Keep-Alive 系統通過定期發送 ping 請求來保持服務活躍，防止自動休眠。

## 功能特點

- ✅ **自動 ping**: 每 5 分鐘自動發送健康檢查請求
- ✅ **智能重試**: 失敗時自動重試，最多 3 次
- ✅ **生產環境專用**: 只在生產環境（Render）啟用
- ✅ **狀態監控**: 提供詳細的運行狀態和統計信息
- ✅ **多種實現**: 內建服務 + 外部腳本雙重保障

## 實現方案

### 方案一：內建 Keep-Alive 服務（推薦）

後端服務器自動集成的 keep-alive 功能，無需額外配置。

**特點：**
- 自動啟動，無需手動干預
- 與主服務集成，資源消耗最小
- 只在生產環境啟用

**狀態檢查：**
```bash
# 檢查健康狀態（包含 keep-alive 信息）
curl https://your-app.onrender.com/health

# 檢查 keep-alive 專用狀態
curl https://your-app.onrender.com/api/keep-alive/status
```

### 方案二：外部 Keep-Alive 腳本

獨立運行的 ping 腳本，可在本地或其他服務器運行。

#### Node.js 版本

```bash
# 基本使用
node keep-render-alive.js https://your-app.onrender.com

# 使用環境變數
set RENDER_URL=https://your-app.onrender.com
node keep-render-alive.js

# 使用批處理文件
start-keep-alive.bat https://your-app.onrender.com
```

#### PowerShell 版本

```powershell
# 基本使用
.\keep-render-alive.ps1 -Url "https://your-app.onrender.com"

# 自定義參數
.\keep-render-alive.ps1 -Url "https://your-app.onrender.com" -IntervalMinutes 3 -MaxRetries 5

# 使用環境變數
$env:RENDER_URL="https://your-app.onrender.com"
.\keep-render-alive.ps1
```

## 配置選項

### 環境變數

在 Render 服務中設置以下環境變數：

```bash
# Keep-alive 目標 URL（可選，自動檢測）
RENDER_EXTERNAL_URL=https://your-app.onrender.com

# 基礎 URL（備用）
BASE_URL=https://your-app.onrender.com
```

### 配置文件

編輯 `keep-alive-config.json` 來自定義設置：

```json
{
  "render": {
    "url": "https://your-app.onrender.com",
    "pingInterval": 5,        // ping 間隔（分鐘）
    "maxRetries": 3,          // 最大重試次數
    "timeout": 10             // 請求超時（秒）
  }
}
```

## 測試和監控

### 功能測試

```powershell
# 運行完整測試（2分鐘）
.\test-keep-alive.ps1 -Url "https://your-app.onrender.com"

# 延長測試時間
.\test-keep-alive.ps1 -Url "https://your-app.onrender.com" -TestDuration 10
```

### 監控指標

Keep-alive 服務提供以下監控信息：

- **運行狀態**: 服務是否正在運行
- **ping 間隔**: 當前設置的 ping 頻率
- **成功率**: ping 請求的成功率
- **響應時間**: 平均響應時間
- **錯誤日誌**: 失敗請求的詳細信息

## 部署步驟

### 1. 後端部署

內建的 keep-alive 服務會自動啟動，無需額外配置。

### 2. 外部腳本部署（可選）

如果需要額外保障，可以在本地或其他服務器運行外部腳本：

```bash
# 1. 下載腳本文件
# keep-render-alive.js
# keep-render-alive.ps1
# start-keep-alive.bat

# 2. 設置目標 URL
set RENDER_URL=https://your-app.onrender.com

# 3. 啟動服務
node keep-render-alive.js
# 或
.\keep-render-alive.ps1
# 或
start-keep-alive.bat
```

### 3. 驗證部署

```bash
# 檢查服務狀態
curl https://your-app.onrender.com/health

# 查看 keep-alive 狀態
curl https://your-app.onrender.com/api/keep-alive/status
```

## 故障排除

### 常見問題

1. **服務仍然休眠**
   - 檢查 ping 間隔是否小於 15 分鐘
   - 確認健康檢查端點正常工作
   - 查看服務器日誌確認 keep-alive 服務已啟動

2. **ping 請求失敗**
   - 檢查 URL 是否正確
   - 確認網絡連接正常
   - 檢查防火牆設置

3. **內建服務未啟動**
   - 確認 NODE_ENV=production
   - 檢查服務器啟動日誌
   - 驗證依賴項是否正確安裝

### 日誌檢查

```bash
# 查看服務器日誌（Render 控制台）
# 尋找以下關鍵信息：
# "🔄 啟動 Keep-Alive 服務..."
# "✅ Keep-alive service started successfully"
# "🏓 Keep-alive ping successful"
```

## 最佳實踐

1. **雙重保障**: 使用內建服務 + 外部腳本
2. **監控告警**: 定期檢查 keep-alive 狀態
3. **日誌記錄**: 保留 ping 請求的歷史記錄
4. **資源優化**: 避免過於頻繁的 ping 請求
5. **錯誤處理**: 實現完善的重試和錯誤恢復機制

## 注意事項

- Keep-alive 只在生產環境啟用，開發環境會自動跳過
- 過於頻繁的 ping 可能被視為濫用，建議間隔不少於 3 分鐘
- 外部腳本需要穩定的網絡連接和運行環境
- 定期檢查 Render 的服務政策變化

## 支援

如果遇到問題，請檢查：

1. 服務器健康狀態：`/health`
2. Keep-alive 狀態：`/api/keep-alive/status`
3. 服務器日誌中的 keep-alive 相關信息
4. 網絡連接和 DNS 解析