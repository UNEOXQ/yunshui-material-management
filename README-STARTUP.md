# 雲水基材管理系統 - 啟動指南

## 🚀 新版啟動文件說明

為了解決中文資料夾路徑問題和提升系統穩定性，我們創建了新的啟動文件：

### 📁 文件列表

| 文件名 | 類型 | 說明 |
|--------|------|------|
| `start-system-fixed.bat` | 批處理 | Windows 批處理啟動腳本（推薦） |
| `start-system-fixed.ps1` | PowerShell | PowerShell 啟動腳本（功能更強） |
| `stop-system-fixed.bat` | 批處理 | 停止系統服務 |
| `stop-system-fixed.ps1` | PowerShell | PowerShell 停止腳本 |
| `quick-test-fixed.bat` | 批處理 | 快速測試系統狀態 |

### 🎯 推薦使用方式

#### 方式一：批處理文件（最簡單）
```bash
# 啟動系統
.\start-system-fixed.bat

# 停止系統
.\stop-system-fixed.bat

# 快速測試
.\quick-test-fixed.bat
```

#### 方式二：PowerShell（功能更強）
```powershell
# 啟動系統
.\start-system-fixed.ps1

# 停止系統
.\stop-system-fixed.ps1
```

### ✨ 新版特性

#### 🔧 智能環境檢查
- ✅ 自動檢查 Node.js 和 npm 環境
- ✅ 自動檢查項目目錄結構
- ✅ 自動安裝缺失的依賴包

#### 🌐 端口管理
- ✅ 自動檢查端口占用情況
- ✅ 自動終止占用端口的進程
- ✅ 智能等待服務啟動完成

#### 📁 路徑處理
- ✅ 完美支持中文資料夾路徑
- ✅ UTF-8 編碼支持
- ✅ 自動創建必要的目錄

#### 🔍 服務監控
- ✅ 實時檢查後端服務狀態
- ✅ 自動驗證 API 端點可用性
- ✅ 詳細的啟動日誌輸出

#### 🎨 用戶體驗
- ✅ 彩色輸出和進度提示
- ✅ 自動打開瀏覽器
- ✅ 詳細的使用說明

### 📊 系統信息

啟動成功後，系統將提供以下服務：

#### 🌐 訪問地址
- **前端應用**: http://localhost:3000/
- **後端 API**: http://localhost:3004/
- **健康檢查**: http://localhost:3004/health

#### 📡 API 端點
- 🔐 **認證**: http://localhost:3004/api/auth
- 👥 **用戶**: http://localhost:3004/api/users
- 📦 **材料**: http://localhost:3004/api/materials
- 🛒 **訂單**: http://localhost:3004/api/orders
- 📤 **上傳**: http://localhost:3004/api/upload
- 📊 **狀態**: http://localhost:3004/api/status
- ❌ **錯誤**: http://localhost:3004/api/errors

#### 🎭 演示帳號
| 角色 | 用戶名 | 密碼 | 權限 |
|------|--------|------|------|
| 系統管理員 | admin | admin123 | 全部功能 |
| 專案經理 | pm001 | pm123 | 輔材訂單管理 |
| 區域經理 | am001 | am123 | 完成材訂單管理 |
| 倉庫管理員 | warehouse001 | wh123 | 狀態管理 |

### 🛠️ 故障排除

#### 問題：端口被占用
```bash
# 手動停止服務
.\stop-system-fixed.bat

# 或者手動終止進程
netstat -ano | findstr :3004
taskkill /PID [進程ID] /F
```

#### 問題：依賴安裝失敗
```bash
# 清理並重新安裝
cd backend
rmdir /s node_modules
npm install

cd ../frontend
rmdir /s node_modules
npm install
```

#### 問題：服務啟動失敗
```bash
# 檢查日誌
# 查看啟動窗口中的錯誤信息
# 或運行快速測試
.\quick-test-fixed.bat
```

### 💡 使用提示

1. **首次運行**：系統會自動安裝依賴，請耐心等待
2. **開發模式**：代碼修改後會自動重載，無需重啟
3. **圖片上傳**：確保以管理員身份登入才能上傳圖片
4. **多窗口**：前端和後端在獨立窗口運行，方便查看日誌
5. **停止服務**：關閉對應窗口或運行停止腳本

### 🔄 更新說明

相比舊版啟動文件，新版本修復了：
- ❌ 中文路徑問題
- ❌ 端口占用衝突
- ❌ 依賴檢查缺失
- ❌ 服務啟動順序
- ❌ 錯誤處理不完善

### 📞 技術支持

如果遇到問題，請：
1. 查看啟動窗口的錯誤信息
2. 運行 `quick-test-fixed.bat` 檢查系統狀態
3. 檢查 Node.js 版本是否符合要求
4. 確保網絡連接正常（用於下載依賴）

---

**🎉 現在可以使用新的啟動文件來啟動你的雲水基材管理系統了！**