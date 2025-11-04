# 🚀 雲水基材管理系統 - 部署指南

## 概述
本指南將幫助您將雲水基材管理系統部署到生產環境：
- **後端**: Render (免費方案)
- **前端**: Vercel (免費方案)

## 📋 部署前準備

### 必要工具
1. **Node.js** (v16 或更高版本)
2. **Git** 
3. **Vercel CLI** (可選，但推薦)
   ```bash
   npm install -g vercel
   ```

### 帳號準備
1. **Render 帳號**: https://render.com
2. **Vercel 帳號**: https://vercel.com
3. **GitHub 帳號**: 確保代碼已推送到 GitHub

## 🚀 快速部署

### 方法 1: 一鍵完整部署 (推薦)
```powershell
./deploy-complete.ps1
```

這個腳本會：
- ✅ 檢查環境和依賴
- 🔨 構建前端和後端
- 📝 提交代碼變更
- 🚀 部署到 Render 和 Vercel
- 📊 提供部署狀態摘要

### 方法 2: 分別部署

#### 部署後端到 Render
```powershell
./deploy-to-render.ps1
```

#### 部署前端到 Vercel  
```powershell
./deploy-to-vercel.ps1
```

## 🔍 檢查部署狀態

```powershell
./check-deployment-status.ps1
```

## 📊 部署配置

### Render 配置 (後端)
- **服務名稱**: yunshui-backend
- **環境**: Node.js
- **構建命令**: `cd backend && npm install && npm run build`
- **啟動命令**: `cd backend && npm start`
- **URL**: https://yunshui-backend1.onrender.com

### Vercel 配置 (前端)
- **框架**: Vite
- **構建命令**: `cd frontend && npm install && npm run build`
- **輸出目錄**: `frontend/dist`
- **API URL**: https://yunshui-backend1.onrender.com/api

## 🔧 環境變數

### 後端 (Render)
```yaml
NODE_ENV: production
JWT_SECRET: yunshui-super-secret-jwt-key-2024
JWT_REFRESH_SECRET: yunshui-refresh-secret-key-2024
DEPLOY_VERSION: 1.0.3-project-tags-fix
PORT: 10000
```

### 前端 (Vercel)
```json
{
  "VITE_API_URL": "https://yunshui-backend1.onrender.com/api",
  "VITE_WS_URL": "https://yunshui-backend1.onrender.com",
  "VITE_NODE_ENV": "production"
}
```

## 🧪 部署後測試

### 1. 後端測試
```bash
# 健康檢查
curl https://yunshui-backend1.onrender.com/api/health

# API 端點測試
curl https://yunshui-backend1.onrender.com/api/users
```

### 2. 前端測試
1. 打開 Vercel 部署的 URL
2. 測試登入功能
3. 檢查專案標籤是否正確居中
4. 測試訂單管理功能

## 🔗 有用的連結

- **Render 控制台**: https://dashboard.render.com
- **Vercel 控制台**: https://vercel.com/dashboard  
- **後端 URL**: https://yunshui-backend1.onrender.com
- **後端健康檢查**: https://yunshui-backend1.onrender.com/api/health

## 🐛 常見問題

### 1. Render 部署失敗
- 檢查 `render.yaml` 配置
- 確認 Node.js 版本兼容性
- 查看 Render 控制台的構建日誌

### 2. Vercel 部署失敗
- 檢查 `vercel.json` 配置
- 確認前端構建成功
- 檢查環境變數設置

### 3. API 連接問題
- 確認後端 URL 正確
- 檢查 CORS 設置
- 驗證環境變數

### 4. 專案標籤顯示問題
- 清除瀏覽器緩存
- 檢查 CSS 文件是否正確部署
- 驗證樣式修正是否生效

## 📝 部署檢查清單

- [ ] 代碼已提交到 Git
- [ ] 前端構建成功
- [ ] 後端構建成功  
- [ ] Render 服務運行正常
- [ ] Vercel 部署成功
- [ ] API 連接正常
- [ ] 登入功能正常
- [ ] 專案標籤居中顯示
- [ ] 訂單管理功能正常

## 🔄 更新部署

當您有新的代碼變更時：

1. **提交變更**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **重新部署**:
   ```powershell
   ./deploy-complete.ps1
   ```

Render 會自動檢測 Git 推送並重新部署後端。
Vercel 需要手動重新部署或設置自動部署。

## 💡 最佳實踐

1. **定期備份**: 確保代碼定期推送到 GitHub
2. **監控日誌**: 定期檢查 Render 和 Vercel 的部署日誌
3. **測試環境**: 考慮設置測試環境進行預發布測試
4. **版本管理**: 使用語義化版本號管理發布

---

🎉 **恭喜！您的雲水基材管理系統現在已部署到生產環境！**