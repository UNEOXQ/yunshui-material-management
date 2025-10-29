# Render Keep-Alive 快速設置指南

## 🚀 快速開始

你的系統現在已經配置了完整的 Keep-Alive 防休眠功能！

### 自動功能（推薦）

✅ **內建 Keep-Alive 服務已集成到後端**
- 部署到 Render 後自動啟動
- 每 5 分鐘自動 ping `/health` 端點
- 只在生產環境運行，開發環境自動跳過

### 手動備用方案

如果需要額外保障，可以運行外部腳本：

```bash
# 方法 1: Node.js 腳本
node keep-render-alive.js https://your-app.onrender.com

# 方法 2: PowerShell 腳本
.\keep-render-alive.ps1 -Url "https://your-app.onrender.com"

# 方法 3: 批處理文件
start-keep-alive.bat https://your-app.onrender.com
```

## 📋 部署檢查清單

### 1. 部署到 Render
- [ ] 推送代碼到 GitHub
- [ ] 在 Render 觸發部署
- [ ] 等待部署完成

### 2. 驗證 Keep-Alive 功能
```bash
# 檢查健康狀態（應該包含 keepAlive 信息）
curl https://your-app.onrender.com/health

# 檢查 Keep-Alive 專用狀態
curl https://your-app.onrender.com/api/keep-alive/status
```

### 3. 監控日誌
在 Render 控制台查看日誌，應該看到：
```
🔄 啟動 Keep-Alive 服務...
✅ Keep-alive service started successfully
🏓 Keep-alive ping successful (XXXms)
```

## 🧪 測試功能

運行完整測試：
```powershell
# 測試線上服務
.\test-keep-alive-system.ps1 -RenderUrl "https://your-app.onrender.com"

# 測試本地服務
.\test-keep-alive-system.ps1 -StartLocal -BuildBackend
```

## ⚙️ 配置選項

### Render 環境變數（可選）
```bash
RENDER_EXTERNAL_URL=https://your-app.onrender.com
BASE_URL=https://your-app.onrender.com
```

### 自定義設置
編輯 `backend/src/services/keepAliveService.ts` 中的參數：
- `pingInterval`: ping 間隔（預設 5 分鐘）
- `maxRetries`: 最大重試次數（預設 3 次）

## 🔍 故障排除

### 服務仍然休眠？
1. 檢查 Render 日誌是否有 Keep-Alive 啟動信息
2. 確認 `/health` 端點可以正常訪問
3. 檢查是否設置了 `NODE_ENV=production`

### Keep-Alive 服務未啟動？
1. 確認後端代碼已正確部署
2. 檢查 TypeScript 編譯是否成功
3. 查看服務器啟動日誌

### 外部腳本連接失敗？
1. 確認 URL 格式正確
2. 檢查網絡連接
3. 嘗試手動訪問 `/health` 端點

## 📊 監控建議

1. **定期檢查**: 每天檢查一次 `/health` 端點
2. **日誌監控**: 關注 Render 日誌中的 Keep-Alive 信息
3. **性能監控**: 觀察 ping 響應時間是否正常
4. **備用方案**: 準備外部腳本作為緊急備用

## 💡 最佳實踐

- ✅ 使用內建服務作為主要方案
- ✅ 準備外部腳本作為備用
- ✅ 定期測試功能是否正常
- ✅ 監控服務器日誌
- ❌ 不要設置過於頻繁的 ping（< 3 分鐘）
- ❌ 不要在開發環境啟用 Keep-Alive

---

🎉 **恭喜！你的 Render 服務現在不會自動休眠了！**