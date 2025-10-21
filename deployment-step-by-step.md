# 🚀 雲水基材管理系統 - 部署指南

## 📋 **部署步驟總覽**
1. 創建GitHub倉庫並上傳代碼
2. 部署後端到Railway
3. 部署前端到Vercel
4. 配置環境變數
5. 測試線上系統

---

## 🔧 **步驟1: 創建GitHub倉庫**

### **1.1 創建倉庫**
1. 前往 [github.com](https://github.com)
2. 點擊右上角 "+" → "New repository"
3. 倉庫名稱：`yunshui-material-management`
4. 設為 **Public** (免費方案需要)
5. 點擊 "Create repository"

### **1.2 上傳代碼**
在你的專案目錄執行：
```bash
# 初始化Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit - 雲水基材管理系統"

# 設定主分支
git branch -M main

# 添加遠端倉庫 (替換成你的GitHub用戶名)
git remote add origin https://github.com/你的用戶名/yunshui-material-management.git

# 推送到GitHub
git push -u origin main
```

---

## 🚂 **步驟2: 部署後端到Railway**

### **2.1 註冊Railway**
1. 前往 [railway.app](https://railway.app)
2. 點擊 "Login" → "Login with GitHub"
3. 授權Railway訪問你的GitHub

### **2.2 創建後端專案**
1. 點擊 "New Project"
2. 選擇 "Deploy from GitHub repo"
3. 選擇你的 `yunshui-material-management` 倉庫
4. Railway會自動檢測到Node.js專案

### **2.3 配置後端環境變數**
在Railway專案的 "Variables" 標籤中添加：
```
NODE_ENV=production
PORT=3004
JWT_SECRET=yunshui-super-secret-jwt-key-2024
JWT_REFRESH_SECRET=yunshui-refresh-secret-key-2024
```

### **2.4 獲取後端URL**
部署完成後，Railway會提供一個URL，類似：
```
https://yunshui-backend-production-xxxx.up.railway.app
```
**記下這個URL，等等會用到！**

---

## 🌐 **步驟3: 部署前端到Vercel**

### **3.1 註冊Vercel**
1. 前往 [vercel.com](https://vercel.com)
2. 點擊 "Sign Up" → "Continue with GitHub"
3. 授權Vercel訪問你的GitHub

### **3.2 創建前端專案**
1. 點擊 "New Project"
2. 選擇你的 `yunshui-material-management` 倉庫
3. Vercel會自動檢測到Vite專案
4. **重要**: 在 "Configure Project" 中設定：
   - **Root Directory**: 保持空白 (使用根目錄)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

### **3.3 配置前端環境變數**
在Vercel專案的 "Settings" → "Environment Variables" 中添加：
```
VITE_API_URL=https://你的railway後端URL/api
VITE_WS_URL=https://你的railway後端URL
VITE_NODE_ENV=production
```

**例如：**
```
VITE_API_URL=https://yunshui-backend-production-xxxx.up.railway.app/api
VITE_WS_URL=https://yunshui-backend-production-xxxx.up.railway.app
VITE_NODE_ENV=production
```

---

## 🔄 **步驟4: 更新CORS設定**

### **4.1 獲取前端URL**
Vercel部署完成後會提供一個URL，類似：
```
https://yunshui-material-management.vercel.app
```

### **4.2 更新Railway後端CORS**
回到Railway專案，在 "Variables" 中添加：
```
CORS_ORIGIN=https://你的vercel前端URL
```

**例如：**
```
CORS_ORIGIN=https://yunshui-material-management.vercel.app
```

### **4.3 重新部署**
添加環境變數後，Railway會自動重新部署。

---

## 🧪 **步驟5: 測試線上系統**

### **5.1 訪問線上系統**
打開你的Vercel URL：
```
https://yunshui-material-management.vercel.app
```

### **5.2 測試功能**
- ✅ 登入功能 (使用快速登入)
- ✅ 儀表板數據載入
- ✅ 訂單管理
- ✅ 材料管理
- ✅ 狀態更新

### **5.3 測試帳號**
- **系統管理員**: admin / admin123
- **Jeffrey**: pm001 / pm123
- **Miya**: am001 / am123
- **Mark**: warehouse001 / wh123

---

## 🎯 **完成後你將擁有**

### **✅ 專業的線上系統**
- 🌐 **前端**: https://你的域名.vercel.app
- 🚂 **後端**: https://你的域名.railway.app
- 🔒 **SSL加密**: 自動HTTPS
- 🌍 **全球CDN**: 快速訪問

### **✅ 自動部署流程**
```
修改代碼 → git push → 自動部署 → 2-3分鐘後上線
```

### **✅ 零維護成本**
- 自動擴展
- 自動備份
- 自動SSL更新
- 99.9%可用性

---

## 💰 **成本**
- **Vercel**: 免費 (個人使用)
- **Railway**: $5/月 (500小時免費額度)
- **總計**: 免費開始，$5/月

---

## 🔧 **故障排除**

### **部署失敗**
1. 檢查GitHub倉庫是否為Public
2. 確認package.json中有正確的scripts
3. 查看部署日誌找出錯誤

### **API連接失敗**
1. 確認環境變數設定正確
2. 檢查CORS設定
3. 確認後端服務正在運行

### **登入失敗**
1. 檢查後端健康狀態
2. 確認JWT密鑰設定
3. 查看瀏覽器開發者工具的錯誤

---

## 🚀 **準備開始了嗎？**

**下一步**: 創建GitHub倉庫並上傳代碼！

需要我幫你準備Git指令嗎？