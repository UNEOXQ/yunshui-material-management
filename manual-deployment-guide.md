# 🚀 手動部署指南 (不需要Git)

## 🎯 **如果Git安裝有問題，可以用這個方法**

---

## 📦 **方法1: 使用GitHub網頁上傳**

### **步驟1: 創建GitHub倉庫**
1. 前往 [github.com](https://github.com) 並登入
2. 點擊右上角 "+" → "New repository"
3. 倉庫名稱: `yunshui-material-management`
4. 選擇 "Public"
5. 點擊 "Create repository"

### **步驟2: 上傳文件**
1. 在新創建的倉庫頁面，點擊 "uploading an existing file"
2. 將你的整個專案資料夾拖拽到網頁上
3. 或點擊 "choose your files" 選擇所有文件
4. 在底部輸入提交訊息: "Initial commit"
5. 點擊 "Commit changes"

---

## 🚂 **方法2: 直接部署到Railway**

### **步驟1: 註冊Railway**
1. 前往 [railway.app](https://railway.app)
2. 點擊 "Login" → "Login with GitHub"
3. 授權Railway訪問你的GitHub

### **步驟2: 部署後端**
1. 點擊 "New Project"
2. 選擇 "Deploy from GitHub repo"
3. 選擇你剛上傳的倉庫
4. Railway會自動檢測Node.js專案

### **步驟3: 配置環境變數**
在Railway專案的 "Variables" 標籤添加:
```
NODE_ENV=production
PORT=3004
JWT_SECRET=yunshui-super-secret-jwt-key-2024
JWT_REFRESH_SECRET=yunshui-refresh-secret-key-2024
```

### **步驟4: 獲取後端URL**
部署完成後，記下Railway提供的URL，例如:
```
https://yunshui-backend-production-xxxx.up.railway.app
```

---

## 🌐 **方法3: 部署前端到Vercel**

### **步驟1: 註冊Vercel**
1. 前往 [vercel.com](https://vercel.com)
2. 點擊 "Sign Up" → "Continue with GitHub"
3. 授權Vercel訪問你的GitHub

### **步驟2: 部署前端**
1. 點擊 "New Project"
2. 選擇你的GitHub倉庫
3. 在 "Configure Project" 設定:
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

### **步驟3: 配置環境變數**
在Vercel的 "Environment Variables" 添加:
```
VITE_API_URL=https://你的railway後端URL/api
VITE_WS_URL=https://你的railway後端URL
VITE_NODE_ENV=production
```

**例如:**
```
VITE_API_URL=https://yunshui-backend-production-xxxx.up.railway.app/api
VITE_WS_URL=https://yunshui-backend-production-xxxx.up.railway.app
VITE_NODE_ENV=production
```

---

## 🔄 **方法4: 更新CORS設定**

### **回到Railway後端**
在 "Variables" 中添加:
```
CORS_ORIGIN=https://你的vercel前端URL
```

**例如:**
```
CORS_ORIGIN=https://yunshui-material-management.vercel.app
```

---

## 🧪 **測試部署結果**

### **訪問你的線上系統**
打開Vercel提供的URL，例如:
```
https://yunshui-material-management.vercel.app
```

### **測試功能**
- 登入 (使用快速登入按鈕)
- 查看儀表板
- 測試訂單管理
- 測試材料管理

---

## 💡 **優點和缺點**

### **✅ 優點**
- 不需要安裝Git
- 使用網頁界面，比較直觀
- 一樣能實現自動部署

### **❌ 缺點**
- 每次更新需要重新上傳文件
- 沒有版本控制歷史
- 無法使用 `git push` 快速更新

---

## 🚀 **建議**

### **短期方案**
使用手動上傳方式先把系統部署上線

### **長期方案**
還是建議安裝Git，這樣以後更新會很方便:
```bash
git add .
git commit -m "更新功能"
git push
# 自動部署完成！
```

---

## 🆘 **需要幫助？**

如果在任何步驟遇到問題，告訴我:
1. 在哪個步驟卡住了
2. 看到什麼錯誤訊息
3. 螢幕截圖 (如果可能)

我會幫你解決！

**準備開始手動部署了嗎？** 🚀