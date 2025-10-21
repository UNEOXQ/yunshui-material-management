# 🚀 雲水基材管理系統 - 線上部署指南

## 📋 **部署方案比較**

| 方案 | 難度 | 成本/月 | 優點 | 缺點 |
|------|------|---------|------|------|
| Vercel + Railway | ⭐ | 免費-$20 | 自動部署、零維護 | 功能限制 |
| VPS (Linode/DigitalOcean) | ⭐⭐ | $5-15 | 完全控制、便宜 | 需要維護 |
| AWS/GCP | ⭐⭐⭐ | $10-50 | 專業級、可擴展 | 複雜設定 |

## 🎯 **推薦方案: Vercel + Railway**

### **為什麼推薦這個組合？**
- ✅ **前端 (Vercel)**: 免費、自動部署、CDN加速
- ✅ **後端 (Railway)**: 免費額度、支援Node.js、自動SSL
- ✅ **資料庫**: Railway內建PostgreSQL
- ✅ **檔案儲存**: 可整合Cloudinary

---

## 🔧 **方案1: Vercel + Railway 部署**

### **步驟1: 準備代碼**

#### 1.1 修改API配置為環境變數
```javascript
// 所有服務文件改為：
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
```

#### 1.2 創建環境變數文件
```bash
# frontend/.env.production
VITE_API_URL=https://your-backend.railway.app/api

# backend/.env.production  
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### **步驟2: 後端部署到Railway**

#### 2.1 註冊Railway
1. 前往 [railway.app](https://railway.app)
2. 使用GitHub帳號註冊

#### 2.2 創建專案
1. 點擊 "New Project"
2. 選擇 "Deploy from GitHub repo"
3. 連接你的GitHub倉庫

#### 2.3 配置後端
```json
// backend/package.json 添加
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "postinstall": "npm run build"
  }
}
```

#### 2.4 添加Railway配置
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

### **步驟3: 前端部署到Vercel**

#### 3.1 註冊Vercel
1. 前往 [vercel.com](https://vercel.com)
2. 使用GitHub帳號註冊

#### 3.2 部署前端
1. 點擊 "New Project"
2. 選擇你的GitHub倉庫
3. 設定根目錄為 `frontend`
4. 添加環境變數：`VITE_API_URL`

---

## 🔧 **方案2: VPS 部署 (進階)**

### **推薦VPS提供商**
- **Linode**: $5/月，簡單易用
- **DigitalOcean**: $6/月，文檔豐富  
- **Vultr**: $3.5/月，便宜實惠

### **VPS部署步驟**

#### 2.1 購買VPS
- 選擇Ubuntu 22.04 LTS
- 最小配置：1GB RAM, 1 CPU

#### 2.2 安裝環境
```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安裝PM2 (進程管理)
sudo npm install -g pm2

# 安裝Nginx (反向代理)
sudo apt install nginx -y
```

#### 2.3 部署應用
```bash
# 克隆代碼
git clone your-repo.git
cd your-project

# 安裝依賴
cd backend && npm install
cd ../frontend && npm install

# 建置前端
npm run build

# 啟動後端
cd ../backend
pm2 start npm --name "backend" -- start
```

#### 2.4 配置Nginx
```nginx
# /etc/nginx/sites-available/yunshui
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 後端API
    location /api {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 **方案3: Docker 部署**

### **Docker配置文件**

#### 3.1 後端Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3004
CMD ["npm", "start"]
```

#### 3.2 前端Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3.3 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
    
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
      
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: yunshui
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 📝 **部署前準備清單**

### **代碼準備**
- [ ] 將硬編碼的IP改回環境變數
- [ ] 添加生產環境配置
- [ ] 設定資料庫連接
- [ ] 配置檔案上傳儲存

### **域名和SSL**
- [ ] 購買域名 (可選)
- [ ] 設定DNS指向
- [ ] 配置SSL憑證

### **監控和備份**
- [ ] 設定錯誤監控
- [ ] 配置資料庫備份
- [ ] 設定日誌記錄

---

## 💰 **成本估算**

### **方案1: Vercel + Railway**
- Vercel: 免費 (個人使用)
- Railway: 免費額度 → $5/月
- **總計**: 免費 → $5/月

### **方案2: VPS**
- VPS: $5-15/月
- 域名: $10-15/年
- **總計**: $6-17/月

### **方案3: 雲端平台**
- AWS/GCP: $10-50/月
- 域名: $10-15/年
- **總計**: $11-52/月

---

## 🎯 **建議開始方式**

1. **先試用 Vercel + Railway** (免費)
2. **如果需要更多控制，升級到VPS**
3. **業務成長後，考慮專業雲端平台**

需要我幫你設定哪個方案嗎？