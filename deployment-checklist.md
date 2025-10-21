# ✅ 部署檢查清單

## 📋 **部署前準備** (已完成)
- [x] 恢復環境變數配置
- [x] 創建生產環境配置文件
- [x] 創建Vercel配置文件
- [x] 創建Railway配置文件
- [x] 準備部署腳本

## 🚀 **部署步驟**

### **第1步: GitHub倉庫**
- [ ] 前往 [github.com](https://github.com) 創建新倉庫
- [ ] 倉庫名稱: `yunshui-material-management`
- [ ] 設為 Public
- [ ] 執行 `deploy-to-github.bat` 上傳代碼

### **第2步: Railway後端部署**
- [ ] 前往 [railway.app](https://railway.app) 註冊
- [ ] 使用GitHub登入
- [ ] 創建新專案，選擇GitHub倉庫
- [ ] 添加環境變數:
  ```
  NODE_ENV=production
  PORT=3004
  JWT_SECRET=yunshui-super-secret-jwt-key-2024
  JWT_REFRESH_SECRET=yunshui-refresh-secret-key-2024
  ```
- [ ] 記錄Railway URL: `https://________.railway.app`

### **第3步: Vercel前端部署**
- [ ] 前往 [vercel.com](https://vercel.com) 註冊
- [ ] 使用GitHub登入
- [ ] 創建新專案，選擇GitHub倉庫
- [ ] 配置建置設定:
  - Build Command: `cd frontend && npm run build`
  - Output Directory: `frontend/dist`
  - Install Command: `cd frontend && npm install`
- [ ] 添加環境變數:
  ```
  VITE_API_URL=https://你的railway後端URL/api
  VITE_WS_URL=https://你的railway後端URL
  VITE_NODE_ENV=production
  ```
- [ ] 記錄Vercel URL: `https://________.vercel.app`

### **第4步: 更新CORS設定**
- [ ] 回到Railway，添加環境變數:
  ```
  CORS_ORIGIN=https://你的vercel前端URL
  ```
- [ ] 等待自動重新部署

### **第5步: 測試線上系統**
- [ ] 訪問Vercel URL
- [ ] 測試登入功能
- [ ] 測試訂單管理
- [ ] 測試材料管理
- [ ] 測試所有功能

## 🎯 **部署完成後**

### **你將擁有:**
- 🌐 **線上網址**: https://你的域名.vercel.app
- 🔄 **自動部署**: git push → 自動更新
- 🔒 **SSL加密**: 自動HTTPS
- 📱 **手機友好**: 響應式設計

### **日常更新流程:**
```bash
# 1. 修改代碼
# 2. 提交更新
git add .
git commit -m "更新功能"
git push

# 3. 🎉 2-3分鐘後自動上線！
```

## 💰 **成本**
- **Vercel**: 免費
- **Railway**: $5/月 (有免費額度)
- **域名**: 可選 ($10-15/年)

## 🆘 **需要幫助？**
如果遇到問題，請告訴我具體的錯誤訊息，我會幫你解決！

---
**🚀 準備開始部署了嗎？從第1步開始吧！**