# 🛡️ 雲水基材管理系統 - 備份與回復指南

## 📋 **快速操作**

### **創建備份**
```powershell
# 創建當前狀態的備份
.\backup-system.ps1 -Action backup -Name "新功能完成"

# 或者手動創建
git tag -a v1.1-stable -m "描述"
git push origin v1.1-stable
```

### **查看所有備份點**
```powershell
.\backup-system.ps1 -Action list
```

### **緊急回復**
```powershell
# 回復到穩定版本
.\backup-system.ps1 -Action restore -Tag "v1.0-stable"

# 回復到特定備份
.\backup-system.ps1 -Action restore -Tag "backup-新功能-20241022-154500"
```

## 🎯 **重要備份點**

### **v1.0-stable** ✅
- **狀態**: 前後端連接正常
- **功能**: 訂單排序、CORS 修復完成
- **部署**: Vercel + Render 正常運行
- **回復指令**: `.\backup-system.ps1 -Action restore -Tag "v1.0-stable"`

## 🔄 **自動備份機制**

### **Git 版本控制**
- 每次 `git commit` 都是一個還原點
- 每次 `git push` 都會觸發自動部署

### **部署平台備份**
- **Vercel**: 每次部署都有歷史記錄，可在 Deployments 頁面回復
- **Render**: 每次部署都有歷史記錄，可在 Dashboard 回復

## 🚨 **緊急情況處理**

### **如果網站掛了**
1. **立即回復到穩定版本**:
   ```powershell
   .\backup-system.ps1 -Action restore -Tag "v1.0-stable"
   ```

2. **檢查部署狀態**:
   - Vercel: https://vercel.com/dashboard
   - Render: https://dashboard.render.com

3. **查看錯誤日誌**:
   - 瀏覽器開發者工具 (F12)
   - Render 服務日誌

### **如果資料遺失**
- 後端使用記憶體資料庫，重啟會重置
- 重要資料應該定期匯出備份

## 📝 **最佳實踐**

### **開發新功能前**
```powershell
# 1. 創建備份點
.\backup-system.ps1 -Action backup -Name "開始開發新功能"

# 2. 創建新分支（可選）
git checkout -b feature/new-feature

# 3. 開發完成後測試
# 4. 合併到主分支
# 5. 創建穩定版本標籤
```

### **定期備份**
- 每週創建一個穩定版本標籤
- 重大功能完成後立即備份
- 部署前必須備份

## 🔧 **手動操作**

### **查看 Git 歷史**
```powershell
git log --oneline -10
git tag -l --sort=-version:refname
```

### **手動回復**
```powershell
# 回復到特定 commit
git reset --hard <commit-hash>
git push --force-with-lease

# 回復到特定標籤
git reset --hard v1.0-stable
git push --force-with-lease
```

## ⚠️ **注意事項**

1. **回復操作會覆蓋當前所有變更**
2. **回復前會自動創建緊急備份**
3. **部署平台會自動重新部署**
4. **資料庫資料可能會遺失（記憶體資料庫）**

---

**記住：備份是最好的保險！** 🛡️