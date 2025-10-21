# 雲水材料管理系統 - 啟動指南

## 前置需求

由於您的系統沒有 Docker，需要手動安裝以下軟體：

### 1. 資料庫服務
- **PostgreSQL** (版本 12+)
- **Redis** (版本 6+)

### 2. 安裝 PostgreSQL
```bash
# Windows 用戶請到官網下載安裝程式
# https://www.postgresql.org/download/windows/

# 安裝後創建資料庫
psql -U postgres
CREATE DATABASE yun_shui_materials_dev;
\q
```

### 3. 安裝 Redis
```bash
# Windows 用戶可以使用 WSL 或下載 Windows 版本
# https://redis.io/download
```

## 啟動步驟

### 步驟 1: 確保資料庫服務運行
```bash
# 檢查 PostgreSQL 是否運行
psql -U postgres -c "SELECT version();"

# 檢查 Redis 是否運行
redis-cli ping
```

### 步驟 2: 設定資料庫
```bash
# 在 backend 目錄執行資料庫初始化
cd backend
npm run db:setup
```

### 步驟 3: 啟動後端 (在一個終端視窗)
```bash
cd backend
npm run dev
```

### 步驟 4: 啟動前端 (在另一個終端視窗)
```bash
cd frontend
npm run dev
```

## 存取位址

啟動成功後，您可以透過以下位址存取：

- **前端應用程式**: http://localhost:3000
- **後端 API**: http://localhost:3001
- **健康檢查**: http://localhost:3001/health

## 🎯 快速演示模式 (推薦)

如果您想快速體驗系統而不安裝資料庫，可以使用演示模式：

```bash
# 一鍵啟動演示模式
node start-demo.js
```

演示模式特點：
- ✅ 無需安裝 PostgreSQL 和 Redis
- ✅ 使用模擬資料，包含完整的測試資料
- ✅ 自動安裝依賴並啟動前後端
- ✅ 提供演示帳號可直接登入
- ⚠️ 資料僅存在記憶體中，重啟後會重置

### 演示帳號
- **管理員**: admin / admin123
- **專案經理**: pm001 / pm123  
- **區域經理**: am001 / am123
- **倉庫管理員**: warehouse001 / wh123

## 完整安裝模式

如果您需要完整的生產環境，請按照以下步驟安裝資料庫：

## 故障排除

### 常見問題

1. **端口被佔用**
   - 後端預設使用 3001 端口
   - 前端預設使用 3000 端口
   - 如果被佔用，請修改環境配置檔案

2. **資料庫連接失敗**
   - 檢查 PostgreSQL 服務是否運行
   - 確認資料庫名稱、用戶名、密碼正確

3. **Redis 連接失敗**
   - 檢查 Redis 服務是否運行
   - 確認 Redis 端口 (預設 6379) 可用

## 開發工具

### 有用的命令
```bash
# 檢查後端健康狀態
curl http://localhost:3001/health

# 查看後端日誌 (如果有設定)
tail -f backend/logs/app.log

# 執行測試
cd backend && npm test
cd frontend && npm test
```

### 資料庫管理
```bash
# 連接到開發資料庫
psql -U postgres -d yun_shui_materials_dev

# 查看資料表
\dt

# 執行資料庫遷移
cd backend && npm run migrate:up
```

## 注意事項

⚠️ **重要**: 
- 請確保在啟動應用程式前，PostgreSQL 和 Redis 服務都在運行
- 如果遇到權限問題，請以管理員身份執行命令
- 開發環境的資料庫密碼在 `backend/.env.development` 中設定

🔧 **開發提示**:
- 後端使用 nodemon，會自動重新載入程式碼變更
- 前端使用 Vite，支援熱重載
- 修改環境變數後需要重新啟動對應服務