@echo off
chcp 65001 >nul
echo.
echo 🎯 設置雲水基材管理系統內容
echo ========================
echo.

echo 📁 移動到新專案目錄...
cd ..\yunshui-mobile-v2

if not exist "package.json" (
    echo ❌ 找不到新專案目錄
    echo 請確認 yunshui-mobile-v2 目錄存在
    pause
    exit /b 1
)

echo ✅ 在新專案目錄中
echo.

echo 📄 複製雲水基材管理系統的 App.tsx...
copy "..\mobile-app\App.tsx" "App.tsx" /Y

if %errorlevel% neq 0 (
    echo ⚠️  複製失敗，手動建立 App.tsx...
    echo import React from 'react'; > App.tsx
    echo import { View, Text } from 'react-native'; >> App.tsx
    echo. >> App.tsx
    echo export default function App() { >> App.tsx
    echo   return ( >> App.tsx
    echo     ^<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}^> >> App.tsx
    echo       ^<Text style={{ fontSize: 24, color: '#007bff', marginBottom: 20 }}^> >> App.tsx
    echo         🏗️ 雲水基材管理系統 >> App.tsx
    echo       ^</Text^> >> App.tsx
    echo       ^<Text style={{ fontSize: 16, color: '#666' }}^> >> App.tsx
    echo         手機版 v2.0.0 >> App.tsx
    echo       ^</Text^> >> App.tsx
    echo       ^<Text style={{ fontSize: 14, color: '#28a745', marginTop: 20 }}^> >> App.tsx
    echo         ✅ 新版本成功啟動！ >> App.tsx
    echo       ^</Text^> >> App.tsx
    echo     ^</View^> >> App.tsx
    echo   ); >> App.tsx
    echo } >> App.tsx
)

echo.
echo 🔧 更新 app.json 配置...
echo {"expo":{"name":"雲水基材管理系統","slug":"yunshui-mobile-v2","version":"2.0.0","orientation":"portrait","platforms":["ios","android"],"splash":{"backgroundColor":"#007bff"},"android":{"package":"com.yunshui.mobile.v2"},"ios":{"bundleIdentifier":"com.yunshui.mobile.v2"}}} > app.json

echo.
echo ✅ 設置完成！
echo.
echo 🚀 重新啟動 Expo 以載入新內容...
echo 📱 請重新掃描 QR 碼
echo.

npx expo start --tunnel --clear

pause