# Docker 部署指南

本專案使用 Docker 和 Docker Compose 進行容器化部署，支援開發和生產環境。

## 系統需求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 至少 4GB RAM
- 至少 10GB 可用磁碟空間

## 快速開始

### 開發環境

1. 複製環境變數檔案：
```bash
cp .env.example .env
```

2. 啟動開發環境：
```bash
docker-compose -f docker-compose.dev.yml up -d
```

3. 查看服務狀態：
```bash
docker-compose -f docker-compose.dev.yml ps
```

4. 查看日誌：
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

### 生產環境

1. 設定環境變數：
```bash
cp .env.example .env
# 編輯 .env 檔案，設定安全的密碼和金鑰
```

2. 啟動生產環境：
```bash
docker-compose up -d
```

3. 查看服務狀態：
```bash
docker-compose ps
```

## 服務說明

### 開發環境服務

- **frontend-dev**: 前端開發服務器 (http://localhost:3000)
- **backend-dev**: 後端 API 服務器 (http://localhost:3001)
- **database**: PostgreSQL 資料庫 (localhost:5433)
- **redis**: Redis 快取服務 (localhost:6380)
- **pgadmin**: 資料庫管理工具 (http://localhost:5050)

### 生產環境服務

- **frontend**: Nginx 前端服務器 (http://localhost:80)
- **backend**: Node.js 後端 API 服務器
- **database**: PostgreSQL 資料庫
- **redis**: Redis 快取服務

## 常用命令

### 建置映像

```bash
# 建置所有服務
docker-compose build

# 建置特定服務
docker-compose build backend
docker-compose build frontend

# 強制重新建置
docker-compose build --no-cache
```

### 服務管理

```bash
# 啟動所有服務
docker-compose up -d

# 啟動特定服務
docker-compose up -d database redis

# 停止所有服務
docker-compose down

# 停止並移除所有資料
docker-compose down -v

# 重啟服務
docker-compose restart backend
```

### 日誌查看

```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f backend

# 查看最近 100 行日誌
docker-compose logs --tail=100 backend
```

### 進入容器

```bash
# 進入後端容器
docker-compose exec backend sh

# 進入資料庫容器
docker-compose exec database psql -U postgres -d yun_shui_materials

# 進入 Redis 容器
docker-compose exec redis redis-cli
```

## 資料庫管理

### 初始化資料庫

資料庫會在首次啟動時自動初始化，初始化腳本位於 `database/init/` 目錄。

### 備份資料庫

```bash
# 備份資料庫
docker-compose exec database pg_dump -U postgres yun_shui_materials > backup.sql

# 還原資料庫
docker-compose exec -T database psql -U postgres yun_shui_materials < backup.sql
```

### 使用 pgAdmin

開發環境包含 pgAdmin 管理工具：

1. 訪問 http://localhost:5050
2. 使用帳號：admin@yunshui.com，密碼：admin
3. 新增伺服器連線：
   - 主機：database
   - 端口：5432
   - 使用者：postgres
   - 密碼：dev_password

## 環境變數說明

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| NODE_ENV | 應用程式環境 | production |
| DB_HOST | 資料庫主機 | database |
| DB_PORT | 資料庫端口 | 5432 |
| DB_NAME | 資料庫名稱 | yun_shui_materials |
| DB_USER | 資料庫使用者 | postgres |
| DB_PASSWORD | 資料庫密碼 | - |
| REDIS_HOST | Redis 主機 | redis |
| REDIS_PORT | Redis 端口 | 6379 |
| REDIS_PASSWORD | Redis 密碼 | - |
| JWT_SECRET | JWT 金鑰 | - |
| JWT_EXPIRES_IN | JWT 過期時間 | 24h |
| FRONTEND_PORT | 前端端口 | 80 |
| BACKEND_PORT | 後端端口 | 3001 |

## 故障排除

### 常見問題

1. **端口衝突**
   ```bash
   # 檢查端口使用情況
   netstat -tulpn | grep :3000
   
   # 修改 docker-compose.yml 中的端口映射
   ```

2. **權限問題**
   ```bash
   # 修復檔案權限
   sudo chown -R $USER:$USER .
   ```

3. **磁碟空間不足**
   ```bash
   # 清理未使用的映像和容器
   docker system prune -a
   
   # 清理未使用的卷
   docker volume prune
   ```

4. **服務無法啟動**
   ```bash
   # 查看詳細錯誤訊息
   docker-compose logs service_name
   
   # 重新建置映像
   docker-compose build --no-cache service_name
   ```

### 健康檢查

所有服務都配置了健康檢查，可以使用以下命令查看狀態：

```bash
# 查看服務健康狀態
docker-compose ps

# 查看特定服務的健康檢查日誌
docker inspect --format='{{json .State.Health}}' container_name
```

## 安全注意事項

1. **生產環境**：
   - 修改所有預設密碼
   - 使用強密碼和安全的 JWT 金鑰
   - 限制資料庫和 Redis 的外部存取
   - 定期更新映像和依賴

2. **網路安全**：
   - 使用 HTTPS（需要額外配置 SSL 憑證）
   - 配置防火牆規則
   - 限制不必要的端口暴露

3. **資料保護**：
   - 定期備份資料庫
   - 使用加密的儲存卷
   - 監控系統資源使用情況

## 監控和日誌

建議在生產環境中配置：

- 日誌聚合（如 ELK Stack）
- 監控系統（如 Prometheus + Grafana）
- 錯誤追蹤（如 Sentry）
- 效能監控（如 New Relic）