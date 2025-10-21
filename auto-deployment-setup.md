# 🚀 自動部署設定 - Vercel + Railway

## 🎯 **完美的更新流程**

```
修改代碼 → git push → 自動部署 → 2分鐘後上線！
```

---

## 📋 **設定步驟 (一次設定，終身受用)**

### **步驟1: 準備GitHub倉庫**

#### 1.1 創建GitHub倉庫
1. 前往 [github.com](https://github.com)
2. 點擊 "New repository"
3. 倉庫名稱：`yunshui-material-management`
4. 設為 Public (免費方案需要)

#### 1.2 上傳代碼
```bash
# 在你的專案目錄執行
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用戶名/yunshui-material-management.git
git push -u origin main
```

---

### **步驟2: 部署後端到Railway**

#### 2.1 註冊Railway
1. 前往 [railway.app](https://railway.app)
2. 點擊 "Login" → "Login with GitHub"
3. 授權Railway訪問你的GitHub

#### 2.2 創建後端專案
1. 點擊 "New Project"
2. 選擇 "Deploy from GitHub repo"
3. 選擇你的 `yunshui-material-management` 倉庫
4. 選擇 `backend` 資料夾

#### 2.3 配置環境變數
在Railway專案設定中添加：
```env
NODE_ENV=production
PORT=3004
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
```

#### 2.4 獲取後端URL
部署完成後，Railway會給你一個URL，類似：
`https://backend-production-xxxx.up.railway.app`

---

### **步驟3: 部署前端到Vercel**

#### 3.1 註冊Vercel
1. 前往 [vercel.com](https://vercel.com)
2. 點擊 "Sign Up" → "Continue with GitHub"
3. 授權Vercel訪問你的GitHub

#### 3.2 創建前端專案
1. 點擊 "New Project"
2. 選擇你的 `yunshui-material-management` 倉庫
3. 設定：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 3.3 配置環境變數
在Vercel專案設定中添加：
```env
VITE_API_URL=https://你的railway後端URL/api
```

---

## 🔧 **準備部署配置文件**

讓我為你創建必要的配置文件：

### **backend/package.json** (確保有這些腳本)
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "nodemon src/server.ts"
  }
}
```

### **frontend/package.json** (確保有這些腳本)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

## ⚡ **自動部署的魔法**

### **設定完成後，你的工作流程：**

#### 🔄 **日常更新流程**
```bash
# 1. 修改代碼 (在VS Code或任何編輯器)
# 2. 提交更改
git add .
git commit -m "修復訂單狀態顯示問題"
git push

# 3. 🎉 自動發生：
# - Railway 自動重新部署後端 (2分鐘)
# - Vercel 自動重新部署前端 (1分鐘)
# - 用戶看到最新版本！
```

#### 📱 **即時預覽**
- **前端**: 每次push都會生成預覽URL
- **後端**: 自動重啟，立即生效
- **回滾**: 一鍵回到上一版本

---

## 🎯 **為什麼這個方案最適合你？**

### ✅ **超級簡單更新**
- 不需要SSH連接伺服器
- 不需要手動上傳文件
- 不需要重啟服務

### ✅ **快速部署**
- 前端：1-2分鐘
- 後端：2-3分鐘
- 總計：3-5分鐘就能看到更新

### ✅ **安全可靠**
- 自動SSL憑證
- CDN加速
- 自動備份

### ✅ **免費開始**
- Vercel：個人使用免費
- Railway：每月$5 (500小時免費)

---

## 🚀 **與其他方案比較**

### **VPS方案的更新流程** (複雜)
```bash
# 1. SSH連接伺服器
ssh user@your-server.com

# 2. 拉取最新代碼
git pull origin main

# 3. 重新建置
npm run build

# 4. 重啟服務
pm2 restart all

# 5. 檢查是否正常
# 總時間：10-15分鐘，還可能出錯
```

### **Vercel + Railway的更新流程** (簡單)
```bash
git push
# 完成！等2-3分鐘就好
```

---

## 💡 **額外好處**

### **🔍 部署日誌**
- 每次部署都有詳細日誌
- 出錯時可以快速定位問題

### **🌍 全球CDN**
- 用戶訪問速度更快
- 自動優化圖片和資源

### **📊 使用統計**
- 可以看到網站訪問量
- 性能監控

### **🔄 一鍵回滾**
- 如果新版本有問題
- 可以立即回到上一版本

---

## 🎯 **總結**

**Vercel + Railway = 最適合你的方案**

- ✅ **更新超簡單**: git push 就完成
- ✅ **速度超快**: 2-3分鐘就上線
- ✅ **不會太難**: 一次設定，終身受用
- ✅ **成本合理**: 免費開始，$5/月
- ✅ **專業級**: 大公司都在用的方案

**你想要我幫你開始設定嗎？** 我可以一步步指導你完成整個設定過程！