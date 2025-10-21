# 📥 Git安裝指南

## ❌ **問題**: 'git' 不是內部或外部命令

這表示你的電腦還沒有安裝Git。Git是版本控制工具，部署到GitHub需要用到。

---

## 🔧 **解決方案: 安裝Git**

### **步驟1: 下載Git**
1. 前往 [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. 點擊 "Download for Windows"
3. 下載會自動開始

### **步驟2: 安裝Git**
1. 執行下載的安裝檔 (Git-x.xx.x-64-bit.exe)
2. **重要設定**:
   - ✅ 選擇 "Git from the command line and also from 3rd-party software"
   - ✅ 選擇 "Use Windows' default console window"
   - ✅ 其他選項保持預設即可
3. 點擊 "Install" 完成安裝

### **步驟3: 驗證安裝**
1. 開啟新的 **PowerShell** 或 **命令提示字元**
2. 輸入: `git --version`
3. 應該顯示類似: `git version 2.42.0.windows.1`

---

## 🚀 **安裝完成後**

### **重新執行部署腳本**
```powershell
# 右鍵點擊，選擇「以PowerShell執行」
.\deploy-to-github.ps1
```

### **或者手動執行Git指令**
```bash
# 初始化Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "部署準備: 雲水基材管理系統"

# 設定主分支
git branch -M main
```

---

## 🌐 **GitHub倉庫創建**

### **步驟1: 創建GitHub帳號** (如果還沒有)
1. 前往 [github.com](https://github.com)
2. 點擊 "Sign up"
3. 填寫資料並驗證email

### **步驟2: 創建新倉庫**
1. 登入GitHub後，點擊右上角 "+" 
2. 選擇 "New repository"
3. **倉庫名稱**: `yunshui-material-management`
4. **重要**: 選擇 "Public" (免費方案需要)
5. 不要勾選 "Add a README file"
6. 點擊 "Create repository"

### **步驟3: 連接本地倉庫**
GitHub會顯示指令，類似：
```bash
git remote add origin https://github.com/你的用戶名/yunshui-material-management.git
git push -u origin main
```

---

## 💡 **小提示**

### **如果還是有問題**
1. **重新啟動電腦** - 確保環境變數生效
2. **使用PowerShell** - 比命令提示字元更穩定
3. **檢查防毒軟體** - 有時會阻擋Git操作

### **替代方案: GitHub Desktop**
如果命令列太複雜，可以使用圖形界面：
1. 下載 [GitHub Desktop](https://desktop.github.com/)
2. 使用拖拽方式上傳文件

---

## 🎯 **完成後的下一步**

1. ✅ **Git安裝完成**
2. ✅ **代碼上傳到GitHub**
3. 🚀 **開始部署到Railway和Vercel**

**準備好了嗎？安裝Git後我們就可以繼續部署了！** 🚀