# 雲水基材管理系統 (Yun Shui Material Management System)

一個專為裝修公司內部使用的訂單倉庫物流系統，支援輔材和完成材的管理，提供完整的訂單流程追蹤功能。

## 功能特色

- **多角色權限管理**: 支援PM、AM、倉庫管理員、伺服器管理者四種角色
- **材料分類管理**: 區分輔材和完成材，支援圖片上傳和供應商資訊
- **訂單流程追蹤**: 四階段狀態管理（叫貨、取貨、到案、點收）
- **即時狀態更新**: WebSocket實時通訊
- **響應式設計**: 支援多裝置存取

## 技術架構

### 前端
- React 18 + TypeScript
- Redux Toolkit (狀態管理)
- Vite (建置工具)
- Socket.io-client (即時通訊)

### 後端
- Node.js + Express + TypeScript
- PostgreSQL (主資料庫)
- Redis (快取)
- Socket.io (WebSocket)
- JWT (身份驗證)

## 快速開始

### 環境需求
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### 安裝步驟

1. 複製專案
```bash
git clone <repository-url>
cd yun-shui-material-management
```

2. 環境配置設定
```bash
# 使用互動式設定腳本 (推薦)
node scripts/setup-environment.js

# 或手動複製範例檔案
cp .env.example .env
# 編輯 .env 檔案設定資料庫和其他配置
```

3. 使用 Docker Compose 啟動服務
```bash
# 開發環境
make dev

# 生產環境
make prod

# 或直接使用 docker-compose
docker-compose -f docker-compose.dev.yml up -d
```

4. 或手動安裝依賴
```bash
# 安裝後端依賴
cd backend
npm install

# 安裝前端依賴
cd ../frontend
npm install
```

5. 驗證環境配置
```bash
# 驗證後端配置
cd backend && npm run env:validate

# 檢查服務健康狀態
curl http://localhost:3001/health
```

6. 啟動開發服務
```bash
# 啟動後端 (在 backend 目錄)
npm run dev

# 啟動前端 (在 frontend 目錄)
npm run dev
```

## 專案結構

```
yun-shui-material-management/
├── frontend/                 # React 前端應用
│   ├── src/
│   │   ├── components/      # React 組件
│   │   ├── services/        # API 服務
│   │   ├── store/          # Redux 狀態管理
│   │   ├── types/          # TypeScript 類型定義
│   │   └── utils/          # 工具函數
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                  # Node.js 後端 API
│   ├── src/
│   │   ├── controllers/     # API 控制器
│   │   ├── models/         # 資料模型
│   │   ├── services/       # 業務邏輯服務
│   │   ├── middleware/     # Express 中介軟體
│   │   ├── routes/         # API 路由
│   │   ├── types/          # TypeScript 類型定義
│   │   ├── utils/          # 工具函數
│   │   └── config/         # 配置檔案
│   ├── package.json
│   └── tsconfig.json
├── database/                 # 資料庫相關檔案
├── docker-compose.yml       # Docker 服務配置
└── README.md
```

## API 端點

### 認證
- `POST /api/auth/login` - 使用者登入
- `POST /api/auth/logout` - 使用者登出
- `GET /api/auth/profile` - 取得使用者資料

### 使用者管理
- `GET /api/users` - 取得使用者列表 (僅管理員)
- `POST /api/users` - 創建新使用者 (僅管理員)
- `PUT /api/users/:id` - 更新使用者 (僅管理員)
- `DELETE /api/users/:id` - 刪除使用者 (僅管理員)

### 材料管理
- `GET /api/materials` - 取得材料列表
- `POST /api/materials` - 創建新材料 (僅管理員)
- `PUT /api/materials/:id` - 更新材料 (僅管理員)
- `DELETE /api/materials/:id` - 刪除材料 (僅管理員)

### 訂單管理
- `GET /api/orders` - 取得訂單列表
- `POST /api/orders` - 創建新訂單
- `GET /api/orders/:id` - 取得訂單詳情
- `PUT /api/orders/:id/status` - 更新訂單狀態

## 開發指南

### 程式碼風格
- 使用 TypeScript 進行類型檢查
- 遵循 ESLint 規則
- 使用 Prettier 格式化程式碼

### 測試
```bash
# 執行後端測試
cd backend
npm test

# 執行前端測試
cd frontend
npm test
```

### 建置
```bash
# 建置後端
cd backend
npm run build

# 建置前端
cd frontend
npm run build
```

## 環境配置

本專案支援多環境配置，詳細說明請參考 [環境配置指南](ENVIRONMENT.md)。

### 快速配置
```bash
# 自動設定所有環境
node scripts/setup-environment.js

# 驗證配置
cd backend && npm run env:validate
```

### 環境變數
- **開發環境**: `.env.development`
- **測試環境**: `.env.test`  
- **生產環境**: `.env.production`

## 部署

### Docker 部署
```bash
# 開發環境
make dev

# 生產環境
make prod

# 查看所有可用命令
make help
```

### 手動部署
```bash
# 建置應用程式
npm run build

# 啟動生產服務
NODE_ENV=production npm start
```

詳細部署說明請參考 [Docker 部署指南](DOCKER.md)。

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個專案。