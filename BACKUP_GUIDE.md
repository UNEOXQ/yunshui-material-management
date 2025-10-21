# 雲水基材管理系統 - 備份與還原指南

## 🔄 快速開始

### 1. 立即創建備份
```cmd
# 基本備份
.\create-backup.ps1

# 帶描述的備份
.\create-backup.ps1 -Description "修復AM狀態顯示問題"

# 指定備份位置
.\create-backup.ps1 -BackupLocation "D:\MyBackups"
```

### 2. 還原備份
```cmd
# 查看可用備份並還原
.\quick-restore.ps1

# 直接還原指定備份
.\quick-restore.ps1 -BackupPath "C:\Backups\YunShuiSystem\雲水基材管理系統_2024-01-01_12-00-00"
```

## 📋 備份方案對比

| 方案 | 優點 | 缺點 | 適用場景 |
|------|------|------|----------|
| **Git版本控制** | 精確追蹤變更、分支管理、協作友好 | 需要學習Git命令 | 開發過程、團隊協作 |
| **文件夾備份** | 簡單直觀、完整備份 | 佔用空間大 | 重要節點備份 |
| **自動備份** | 無需手動操作、定期執行 | 可能備份不必要文件 | 日常保護 |

## 🛠️ 詳細使用方法

### Git 版本控制（推薦用於開發）

1. **初始化倉庫**
   ```cmd
   .\backup-commands.bat
   ```

2. **日常提交**
   ```cmd
   git add .
   git commit -m "修復功能描述"
   ```

3. **創建版本標籤**
   ```cmd
   git tag -a v1.1 -m "版本1.1：新增訂單名稱編輯功能"
   ```

4. **查看歷史**
   ```cmd
   git log --oneline --graph
   ```

5. **還原到特定版本**
   ```cmd
   git checkout v1.0  # 還原到v1.0版本
   git checkout main  # 回到最新版本
   ```

### 完整備份（推薦用於重要節點）

1. **手動備份**
   ```powershell
   .\create-backup.ps1 -Description "功能完成版本"
   ```

2. **自動備份設置**
   ```powershell
   .\auto-backup-setup.ps1 -IntervalHours 6 -KeepBackups 15
   ```

## 🚨 緊急還原步驟

### 如果系統完全損壞：

1. **找到最近的備份**
   ```cmd
   dir "C:\Backups\YunShuiSystem" /od
   ```

2. **執行還原**
   ```powershell
   .\quick-restore.ps1 -BackupPath "最新備份路徑"
   ```

3. **重新安裝依賴**
   ```cmd
   cd backend
   npm install
   cd ..\frontend
   npm install
   ```

4. **啟動系統**
   ```cmd
   .\start-system.bat
   ```

## 📁 備份內容說明

### 包含的文件：
- ✅ 所有源代碼（frontend、backend）
- ✅ 配置文件（package.json、tsconfig.json等）
- ✅ 數據庫文件（memory-db.json）
- ✅ 上傳的圖片文件
- ✅ 腳本文件（.bat、.ps1）
- ✅ 文檔文件（.md）

### 排除的文件：
- ❌ node_modules（可重新安裝）
- ❌ dist/build（可重新編譯）
- ❌ 日誌文件（.log）
- ❌ 臨時文件（.tmp）
- ❌ 緩存文件

## 🔧 故障排除

### 常見問題：

1. **PowerShell執行策略錯誤**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **權限不足**
   - 以管理員身份運行PowerShell
   - 或修改備份位置到用戶目錄

3. **備份失敗**
   - 檢查磁盤空間
   - 確認目標目錄可寫入
   - 關閉防毒軟件實時掃描

4. **還原後無法啟動**
   ```cmd
   cd backend && npm install
   cd ..\frontend && npm install
   ```

## 📅 建議的備份策略

### 開發階段：
- 每天結束工作前：Git提交
- 完成重要功能：創建Git標籤 + 文件夾備份
- 每週：完整備份到外部存儲

### 生產階段：
- 每4小時：自動備份
- 每天：手動備份到不同位置
- 每週：備份到雲端存儲
- 重大更新前：完整備份

## 🌐 雲端備份建議

可以將備份上傳到：
- Google Drive
- OneDrive
- Dropbox
- GitHub（使用Git）

## 📞 緊急聯絡

如果遇到無法解決的問題：
1. 保留錯誤信息截圖
2. 記錄操作步驟
3. 檢查最近的備份時間
4. 準備系統環境信息