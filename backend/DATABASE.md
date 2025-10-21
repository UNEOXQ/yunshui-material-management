# 雲水基材管理系統 - 資料庫設計文件

## 概述

本系統使用 PostgreSQL 作為主要資料庫，Redis 作為快取和會話管理。資料庫架構支援多角色使用者管理、材料管理、訂單處理和專案狀態追蹤。

## 資料庫架構

### 核心表格

#### 1. users (使用者表)
- **用途**: 儲存系統使用者資訊
- **主要欄位**:
  - `id`: UUID 主鍵
  - `username`: 使用者名稱 (唯一)
  - `email`: 電子郵件 (唯一)
  - `password_hash`: 加密密碼
  - `role`: 使用者角色 (PM, AM, WAREHOUSE, ADMIN)
  - `created_at`, `updated_at`: 時間戳記

#### 2. materials (材料表)
- **用途**: 儲存材料資訊
- **主要欄位**:
  - `id`: UUID 主鍵
  - `name`: 材料名稱
  - `category`: 材料分類
  - `price`: 價格
  - `quantity`: 庫存數量
  - `image_url`: 圖片URL
  - `supplier`: 供應商 (可選)
  - `type`: 材料類型 (AUXILIARY, FINISHED)

#### 3. orders (訂單表)
- **用途**: 儲存訂單主要資訊
- **主要欄位**:
  - `id`: UUID 主鍵
  - `user_id`: 下單使用者ID (外鍵)
  - `total_amount`: 訂單總金額
  - `status`: 訂單狀態 (PENDING, CONFIRMED, PROCESSING, COMPLETED, CANCELLED)

#### 4. order_items (訂單項目表)
- **用途**: 儲存訂單中的具體材料項目
- **主要欄位**:
  - `id`: UUID 主鍵
  - `order_id`: 訂單ID (外鍵)
  - `material_id`: 材料ID (外鍵)
  - `quantity`: 數量
  - `unit_price`: 單價

#### 5. projects (專案表)
- **用途**: 儲存由訂單生成的專案資訊
- **主要欄位**:
  - `id`: UUID 主鍵
  - `order_id`: 關聯訂單ID (外鍵, 唯一)
  - `project_name`: 專案名稱
  - `overall_status`: 整體狀態 (ACTIVE, COMPLETED, CANCELLED)

#### 6. status_updates (狀態更新表)
- **用途**: 記錄專案的四個狀態欄更新歷史
- **主要欄位**:
  - `id`: UUID 主鍵
  - `project_id`: 專案ID (外鍵)
  - `updated_by`: 更新者ID (外鍵)
  - `status_type`: 狀態類型 (ORDER, PICKUP, DELIVERY, CHECK)
  - `status_value`: 狀態值
  - `additional_data`: 額外資料 (JSONB)

### 資料關係

```
users (1) -----> (N) orders
orders (1) -----> (N) order_items
materials (1) -----> (N) order_items
orders (1) -----> (1) projects
projects (1) -----> (N) status_updates
users (1) -----> (N) status_updates
```

## 環境設定

### 開發環境

1. **複製環境設定檔**:
   ```bash
   cp .env.example .env.development
   ```

2. **設定資料庫連線**:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=yun_shui_db
   DB_USER=yun_shui_user
   DB_PASSWORD=yun_shui_password
   ```

### Docker 環境

使用 Docker Compose 啟動完整環境:

```bash
# 啟動所有服務 (PostgreSQL + Redis + Backend + Frontend)
docker-compose up -d

# 僅啟動資料庫服務
docker-compose up -d postgres redis
```

## 資料庫操作

### 快速開始

```bash
# 1. 安裝依賴
npm install

# 2. 啟動資料庫服務 (使用 Docker)
docker compose up -d postgres redis

# 3. 完整資料庫設置 (推薦)
npm run db:setup

# 或者分別執行
npm run db:init      # 僅執行遷移
npm run migrate:up   # 僅執行遷移
```

### 初始化資料庫

```bash
# 完整設置 (包含遷移、驗證、初始管理員用戶)
npm run db:setup

# 僅初始化資料庫 (建立連線 + 執行遷移)
npm run db:init

# 或分別執行
npm run migrate:up
```

### 遷移管理

```bash
# 執行所有待處理的遷移
npm run migrate:up

# 回滾最後一個遷移
npm run migrate:down

# 重置資料庫 (回滾後重新執行)
npm run db:reset
```

### 架構驗證

```bash
# 驗證資料庫架構
npm run db:validate
```

## 遷移檔案

遷移檔案位於 `src/migrations/` 目錄：

1. `001_create_users_table.sql` - 建立使用者表和角色枚舉
2. `002_create_materials_table.sql` - 建立材料表和類型枚舉
3. `003_create_orders_table.sql` - 建立訂單表和狀態枚舉
4. `004_create_order_items_table.sql` - 建立訂單項目表
5. `005_create_projects_table.sql` - 建立專案表
6. `006_create_status_updates_table.sql` - 建立狀態更新表

每個遷移檔案包含 `-- UP` 和 `-- DOWN` 部分，支援正向和反向遷移。

## 索引策略

### 效能優化索引

- **使用者查詢**: `username`, `email`, `role`
- **材料查詢**: `category`, `type`, `supplier`, `name`
- **訂單查詢**: `user_id`, `status`, `created_at`
- **專案查詢**: `order_id`, `overall_status`
- **狀態更新查詢**: `project_id`, `status_type`, `updated_by`

### JSONB 索引

狀態更新表的 `additional_data` 欄位使用 GIN 索引支援高效的 JSON 查詢。

## 資料完整性

### 外鍵約束

- 訂單必須關聯有效使用者
- 訂單項目必須關聯有效訂單和材料
- 專案必須關聯有效訂單 (一對一)
- 狀態更新必須關聯有效專案和使用者

### 檢查約束

- 價格和金額必須非負數
- 數量必須為正整數
- 庫存數量必須非負數

### 唯一約束

- 使用者名稱和電子郵件唯一
- 每個訂單只能有一個專案
- 同一訂單中不能有重複的材料項目

## 觸發器

### 自動時間戳記更新

所有主要表格都有 `updated_at` 觸發器，在記錄更新時自動更新時間戳記。

## 安全性考量

### 密碼安全

- 使用 bcrypt 進行密碼雜湊 (12 rounds)
- 密碼雜湊儲存在 `password_hash` 欄位
- 原始密碼永不儲存

### 資料存取控制

- 使用連線池管理資料庫連線
- 參數化查詢防止 SQL 注入
- 角色基礎的存取控制在應用層實現

## 備份與恢復

### 開發環境

```bash
# 備份資料庫
pg_dump -h localhost -U yun_shui_user yun_shui_db > backup.sql

# 恢復資料庫
psql -h localhost -U yun_shui_user yun_shui_db < backup.sql
```

### 生產環境

建議使用自動化備份策略，包括：
- 每日完整備份
- 增量備份
- 異地備份儲存
- 定期恢復測試

## 監控與維護

### 效能監控

- 查詢執行時間監控
- 連線池使用率監控
- 索引使用情況分析
- 慢查詢日誌分析

### 定期維護

- 統計資訊更新: `ANALYZE`
- 空間回收: `VACUUM`
- 索引重建 (如需要)
- 日誌檔案清理

## 故障排除

### 常見問題

1. **連線失敗**
   - 檢查資料庫服務是否運行
   - 驗證連線參數
   - 檢查防火牆設定

2. **遷移失敗**
   - 檢查資料庫權限
   - 查看遷移日誌
   - 驗證 SQL 語法

3. **效能問題**
   - 分析查詢計劃
   - 檢查索引使用
   - 監控資源使用

### 日誌位置

- 應用日誌: 控制台輸出
- PostgreSQL 日誌: Docker 容器日誌或系統日誌
- Redis 日誌: Docker 容器日誌

## 開發指南

### 新增遷移

1. 在 `src/migrations/` 建立新檔案
2. 使用序號命名: `007_description.sql`
3. 包含 `-- UP` 和 `-- DOWN` 部分
4. 測試正向和反向遷移

### 模型開發

1. 更新 `src/types/index.ts` 中的型別定義
2. 在 `src/models/` 建立對應模型類別
3. 實現 CRUD 操作和業務邏輯
4. 新增適當的驗證和錯誤處理

### 測試

```bash
# 執行資料庫相關測試
npm test -- --testPathPattern=database

# 執行所有測試
npm test
```