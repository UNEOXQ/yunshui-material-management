# 🔧 GitHub 自動備份設置指南

## 📋 概述

GitHub 自動備份功能可以將你的所有數據（材料、訂單、用戶、狀態等）定期備份到 GitHub 倉庫，確保數據永不丟失。

## 🚀 設置步驟

### 1. 創建 GitHub Personal Access Token

1. 登入 GitHub
2. 前往 **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
3. 點擊 **Generate new token (classic)**
4. 設置 Token 信息：
   - **Note**: `雲水基材管理系統備份`
   - **Expiration**: 選擇適當的過期時間（建議 1 年）
   - **Scopes**: 勾選 `repo` (完整倉庫權限)
5. 點擊 **Generate token**
6. **重要**: 複製生成的 token（只會顯示一次）

### 2. 配置環境變數

#### 方法 A: 本地開發環境

1. 複製 `backend/.env.backup.example` 為 `backend/.env.backup`
2. 填入你的 GitHub 信息：

```bash
# GitHub Personal Access Token
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub 用戶名
GITHUB_OWNER=your_username

# 倉庫名稱（建議使用當前倉庫）
GITHUB_REPO=yunshui-material-management

# 備份分支名稱（可選）
GITHUB_BACKUP_BRANCH=data-backup

# 備份間隔（分鐘，可選）
BACKUP_INTERVAL_MINUTES=30
```

3. 在 `backend/.env.development` 中添加：

```bash
# 載入備份配置
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your_username
GITHUB_REPO=yunshui-material-management
```

#### 方法 B: Render 生產環境

1. 登入 Render Dashboard
2. 選擇你的後端服務
3. 前往 **Environment** 標籤
4. 添加以下環境變數：
   - `GITHUB_TOKEN`: 你的 GitHub Token
   - `GITHUB_OWNER`: 你的 GitHub 用戶名
   - `GITHUB_REPO`: `yunshui-material-management`

### 3. 重啟服務

- **本地開發**: 重啟後端服務
- **Render**: 環境變數更新後會自動重新部署

## 📊 驗證設置

### 1. 檢查服務器日誌

啟動後應該看到：

```
✅ GitHub 自動備份已啟用
📅 備份頻率: 每 30 分鐘
📂 備份位置: GitHub data-backup 分支
```

### 2. 檢查 GitHub 倉庫

- 會自動創建 `data-backup` 分支
- 在 `data-backups/` 目錄下會有備份文件

### 3. 使用前端界面

- 前往系統管理頁面
- 查看 "GitHub 自動備份" 部分
- 可以手動觸發備份測試

## 🔄 備份機制

### 自動備份

- **頻率**: 每 30 分鐘
- **觸發條件**: 數據有變更時才備份
- **文件格式**: JSON 格式，包含所有數據
- **命名規則**: `backup-YYYY-MM-DD.json`

### 備份內容

```json
{
  "timestamp": "2025-01-23T10:30:00.000Z",
  "version": "1.0.0",
  "data": {
    "materials": [...],
    "orders": [...],
    "users": [...],
    "statusUpdates": [...],
    "messages": [...]
  }
}
```

### 文件結構

```
data-backups/
├── latest.json          # 最新備份
├── backup-2025-01-23.json
├── backup-2025-01-22.json
└── ...
```

## 🛡️ 安全性

- ✅ 所有數據加密傳輸
- ✅ 使用 GitHub 私有倉庫
- ✅ Token 權限最小化（僅 repo 權限）
- ✅ 不會覆蓋主分支代碼

## 🔧 故障排除

### 常見問題

#### 1. "GitHub 備份未配置"

**原因**: 環境變數未設置或不正確

**解決**:
- 檢查 `GITHUB_TOKEN`、`GITHUB_OWNER`、`GITHUB_REPO` 是否正確
- 確認 Token 有 `repo` 權限
- 重啟服務

#### 2. "403 Forbidden" 錯誤

**原因**: Token 權限不足或已過期

**解決**:
- 重新生成 Token 並確保勾選 `repo` 權限
- 檢查 Token 是否過期

#### 3. "404 Not Found" 錯誤

**原因**: 倉庫名稱或用戶名錯誤

**解決**:
- 確認 `GITHUB_OWNER` 和 `GITHUB_REPO` 正確
- 確認倉庫存在且 Token 有訪問權限

### 調試步驟

1. 檢查服務器啟動日誌
2. 查看 `/api/backup/status` API 響應
3. 檢查 GitHub 倉庫是否有 `data-backup` 分支
4. 嘗試手動觸發備份

## 📈 監控和維護

### 監控指標

- 備份成功率
- 最後備份時間
- 備份文件大小
- API 調用次數

### 維護建議

- 定期檢查 Token 過期時間
- 監控 GitHub API 使用量
- 清理舊備份文件（可選）

## 🆘 緊急恢復

如果需要從備份恢復數據：

1. 從 GitHub 下載最新的 `latest.json`
2. 解析 JSON 文件獲取數據
3. 重新導入到系統中

（自動恢復功能將在第二階段實施）

## 📞 支持

如果遇到問題：

1. 檢查本文檔的故障排除部分
2. 查看服務器日誌
3. 聯繫技術支持

---

**注意**: 請妥善保管你的 GitHub Token，不要分享給他人或提交到代碼倉庫中。