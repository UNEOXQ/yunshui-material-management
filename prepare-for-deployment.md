# 🔧 部署前準備工作

## 📋 **需要修改的文件**

### **1. 恢復環境變數配置**
目前我們為了修復手機訪問問題，將API URL硬編碼了。部署前需要改回環境變數：

#### 修改所有服務文件：
```javascript
// 改回這樣：
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
```

### **2. 創建生產環境配置**

#### frontend/.env.production
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_WS_URL=https://your-backend-domain.com
VITE_NODE_ENV=production
```

#### backend/.env.production
```env
NODE_ENV=production
PORT=3004
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
CORS_ORIGIN=https://your-frontend-domain.com
```

### **3. 添加部署腳本**

#### package.json (根目錄)
```json
{
  "name": "yunshui-material-management",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "start": "cd backend && npm start",
    "deploy:vercel": "cd frontend && vercel --prod",
    "deploy:railway": "cd backend && railway up"
  }
}
```

### **4. 資料庫遷移準備**

#### backend/src/database/migrations/001_initial.sql
```sql
-- 用戶表
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 材料表
CREATE TABLE materials (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    unit VARCHAR(50),
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 訂單表
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    total_amount DECIMAL(10,2) DEFAULT 0,
    created_by VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 訂單項目表
CREATE TABLE order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES orders(id),
    material_id VARCHAR(255) REFERENCES materials(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 狀態更新表
CREATE TABLE status_updates (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES orders(id),
    status VARCHAR(50) NOT NULL,
    comment TEXT,
    updated_by VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 訊息表
CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sender_id VARCHAR(255) REFERENCES users(id),
    recipient_id VARCHAR(255) REFERENCES users(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 **快速部署指令**

### **方案1: Vercel + Railway (推薦)**

#### 準備步驟：
```bash
# 1. 安裝CLI工具
npm install -g vercel @railway/cli

# 2. 登入服務
vercel login
railway login

# 3. 部署後端到Railway
cd backend
railway init
railway up

# 4. 部署前端到Vercel  
cd ../frontend
vercel init
vercel --prod
```

### **方案2: 一鍵Docker部署**

#### docker-compose.production.yml
```yaml
version: '3.8'
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.production
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - database
    
  frontend:
    build:
      context: ./frontend  
      dockerfile: Dockerfile.production
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://localhost:3004/api
    depends_on:
      - backend
      
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: yunshui
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/database/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### 部署指令：
```bash
# 創建環境變數文件
cp .env.example .env.production

# 啟動服務
docker-compose -f docker-compose.production.yml up -d
```

---

## 📝 **部署檢查清單**

### **部署前**
- [ ] 恢復環境變數配置
- [ ] 創建生產環境配置文件
- [ ] 設定資料庫連接
- [ ] 配置檔案上傳儲存
- [ ] 測試本地生產建置

### **部署中**
- [ ] 部署後端服務
- [ ] 設定資料庫
- [ ] 部署前端應用
- [ ] 配置域名和SSL

### **部署後**
- [ ] 測試所有功能
- [ ] 設定監控和日誌
- [ ] 配置備份策略
- [ ] 文檔更新

---

## 💡 **建議**

1. **先從 Vercel + Railway 開始** - 最簡單，免費額度夠用
2. **準備域名** - 讓系統看起來更專業
3. **設定SSL** - 確保安全性
4. **監控設定** - 及時發現問題

你想從哪個方案開始？我可以幫你準備具體的配置文件！