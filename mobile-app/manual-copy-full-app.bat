@echo off
chcp 65001 >nul
echo.
echo 🚀 手動複製完整功能 - 逐步執行
echo ============================
echo.

echo 📋 步驟 1: 檢查目標目錄
if not exist "..\yunshui-mobile-v2" (
    echo ❌ 找不到 yunshui-mobile-v2 目錄
    pause
    exit /b 1
)
echo ✅ 目標目錄存在

echo.
echo 📋 步驟 2: 複製 src 目錄
echo 正在複製完整的功能代碼...
xcopy "src" "..\yunshui-mobile-v2\src" /E /I /Y
if %errorlevel% neq 0 (
    echo ❌ src 目錄複製失敗
    pause
    exit /b 1
)
echo ✅ src 目錄複製完成

echo.
echo 📋 步驟 3: 複製主要文件
copy "App.tsx" "..\yunshui-mobile-v2\App.tsx" /Y
echo ✅ App.tsx 複製完成

echo.
echo 📋 步驟 4: 檢查 package.json 版本相容性
echo 正在檢查原始 package.json...
type package.json | findstr "expo"
echo.
echo 正在檢查目標 package.json...
type "..\yunshui-mobile-v2\package.json" | findstr "expo"

echo.
echo ⚠️  重要: 我們需要保持 SDK 51 版本以避免相容性問題
echo 不複製 package.json，保持新專案的 SDK 51 版本
echo.

echo 📋 步驟 5: 進入目標目錄
cd ..\yunshui-mobile-v2
echo 當前目錄: %CD%

echo.
echo 📋 步驟 6: 檢查目錄內容
echo 檢查 src 目錄是否存在...
if exist "src" (
    echo ✅ src 目錄存在
    dir src /b
) else (
    echo ❌ src 目錄不存在
    pause
    exit /b 1
)

echo.
echo 📋 步驟 7: 安裝必要的依賴
echo 安裝 React Navigation...
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context

echo.
echo 安裝 Redux 和其他依賴...
npm install @reduxjs/toolkit react-redux axios react-native-paper

echo.
echo 📋 步驟 8: 檢查 App.tsx
echo 檢查 App.tsx 內容...
type App.tsx | more

echo.
echo 📋 步驟 9: 啟動應用程式
echo 🚀 啟動完整的雲水基材管理系統...
echo 📱 保持 SDK 51 版本以確保相容性
echo.

npx expo start --tunnel --clear

echo.
echo 如果看到這行，表示 Expo 已停止
pause