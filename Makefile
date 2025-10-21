# Yun Shui Material Management System - Docker Commands

.PHONY: help dev prod build up down logs clean restart shell db-backup db-restore

# 預設目標
help: ## 顯示幫助訊息
	@echo "Yun Shui Material Management System - Docker Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# 開發環境
dev: ## 啟動開發環境
	@echo "🚀 Starting development environment..."
	@cp -n .env.example .env 2>/dev/null || true
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Development environment started!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:3001"
	@echo "🗄️  Database: localhost:5433"
	@echo "🔴 Redis: localhost:6380"
	@echo "🛠️  pgAdmin: http://localhost:5050"

dev-build: ## 重新建置並啟動開發環境
	@echo "🔨 Building and starting development environment..."
	@docker-compose -f docker-compose.dev.yml up -d --build

dev-logs: ## 查看開發環境日誌
	@docker-compose -f docker-compose.dev.yml logs -f

dev-down: ## 停止開發環境
	@echo "🛑 Stopping development environment..."
	@docker-compose -f docker-compose.dev.yml down

# 生產環境
prod: ## 啟動生產環境
	@echo "🚀 Starting production environment..."
	@if [ ! -f .env ]; then echo "❌ .env file not found! Please copy .env.example to .env and configure it."; exit 1; fi
	@docker-compose up -d
	@echo "✅ Production environment started!"
	@echo "🌐 Application: http://localhost"

prod-build: ## 重新建置並啟動生產環境
	@echo "🔨 Building and starting production environment..."
	@docker-compose up -d --build

prod-logs: ## 查看生產環境日誌
	@docker-compose logs -f

prod-down: ## 停止生產環境
	@echo "🛑 Stopping production environment..."
	@docker-compose down

# 建置
build: ## 建置所有映像
	@echo "🔨 Building all images..."
	@docker-compose build

build-backend: ## 建置後端映像
	@echo "🔨 Building backend image..."
	@docker-compose build backend

build-frontend: ## 建置前端映像
	@echo "🔨 Building frontend image..."
	@docker-compose build frontend

# 通用操作
up: dev ## 啟動開發環境 (預設)

down: ## 停止所有環境
	@echo "🛑 Stopping all environments..."
	@docker-compose down 2>/dev/null || true
	@docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

logs: ## 查看日誌
	@docker-compose logs -f 2>/dev/null || docker-compose -f docker-compose.dev.yml logs -f

restart: ## 重啟服務
	@echo "🔄 Restarting services..."
	@docker-compose restart 2>/dev/null || docker-compose -f docker-compose.dev.yml restart

# 清理
clean: ## 清理未使用的 Docker 資源
	@echo "🧹 Cleaning up Docker resources..."
	@docker system prune -f
	@docker volume prune -f
	@echo "✅ Cleanup completed!"

clean-all: ## 清理所有 Docker 資源 (包含映像)
	@echo "🧹 Cleaning up all Docker resources..."
	@docker-compose down -v 2>/dev/null || true
	@docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
	@docker system prune -af
	@docker volume prune -f
	@echo "✅ Complete cleanup finished!"

# 容器操作
shell-backend: ## 進入後端容器
	@docker-compose exec backend sh 2>/dev/null || docker-compose -f docker-compose.dev.yml exec backend sh

shell-frontend: ## 進入前端容器
	@docker-compose exec frontend sh 2>/dev/null || docker-compose -f docker-compose.dev.yml exec frontend sh

shell-db: ## 進入資料庫容器
	@docker-compose exec database psql -U postgres -d yun_shui_materials 2>/dev/null || docker-compose -f docker-compose.dev.yml exec database psql -U postgres -d yun_shui_materials_dev

shell-redis: ## 進入 Redis 容器
	@docker-compose exec redis redis-cli 2>/dev/null || docker-compose -f docker-compose.dev.yml exec redis redis-cli

# 資料庫操作
db-backup: ## 備份資料庫
	@echo "💾 Backing up database..."
	@mkdir -p backups
	@docker-compose exec database pg_dump -U postgres yun_shui_materials > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql 2>/dev/null || \
	 docker-compose -f docker-compose.dev.yml exec database pg_dump -U postgres yun_shui_materials_dev > backups/backup_dev_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backup completed!"

db-restore: ## 還原資料庫 (需要指定檔案: make db-restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "❌ Please specify backup file: make db-restore FILE=backup.sql"; exit 1; fi
	@echo "📥 Restoring database from $(FILE)..."
	@docker-compose exec -T database psql -U postgres yun_shui_materials < $(FILE) 2>/dev/null || \
	 docker-compose -f docker-compose.dev.yml exec -T database psql -U postgres yun_shui_materials_dev < $(FILE)
	@echo "✅ Database restore completed!"

# 狀態檢查
status: ## 查看服務狀態
	@echo "📊 Service Status:"
	@docker-compose ps 2>/dev/null || docker-compose -f docker-compose.dev.yml ps

health: ## 檢查服務健康狀態
	@echo "🏥 Health Check:"
	@curl -s http://localhost/health 2>/dev/null || curl -s http://localhost:3001/health || echo "❌ Health check failed"

# 測試
test: ## 執行測試
	@echo "🧪 Running tests..."
	@docker-compose -f docker-compose.dev.yml exec backend npm test
	@docker-compose -f docker-compose.dev.yml exec frontend npm test

# 初始化
init: ## 初始化專案 (首次設定)
	@echo "🎯 Initializing project..."
	@cp -n .env.example .env 2>/dev/null || true
	@echo "📝 Please edit .env file with your configuration"
	@echo "🚀 Run 'make dev' to start development environment"

# 更新
update: ## 更新並重啟服務
	@echo "🔄 Updating services..."
	@git pull
	@docker-compose build --no-cache
	@docker-compose up -d
	@echo "✅ Update completed!"