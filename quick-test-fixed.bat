@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🧪 雲水基材管理系統 - 快速測試
echo ================================
echo.

:: 測試後端健康檢查
echo 🔍 測試後端服務...
curl -s http://localhost:3004/health >nul 2>&1
if errorlevel 1 (
    echo ❌ 後端服務未運行 (端口 3004)
    echo 請先運行: start-system-fixed.bat
    goto :end
) else (
    echo ✅ 後端服務正常運行
)

:: 測試前端服務
echo 🔍 測試前端服務...
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo ❌ 前端服務未運行 (端口 3000)
) else (
    echo ✅ 前端服務正常運行
)

:: 測試 API 端點
echo.
echo 🔍 測試 API 端點...

:: 測試健康檢查
echo 📊 健康檢查...
curl -s http://localhost:3004/health | findstr "OK" >nul
if not errorlevel 1 (
    echo ✅ 健康檢查端點正常
) else (
    echo ❌ 健康檢查端點異常
)

:: 測試材料 API
echo 📦 材料 API...
curl -s http://localhost:3004/api/materials | findstr "success" >nul
if not errorlevel 1 (
    echo ✅ 材料 API 正常
) else (
    echo ❌ 材料 API 異常
)

:: 測試上傳信息端點（需要認證，預期會返回 401）
echo 📤 上傳 API...
curl -s http://localhost:3004/api/upload/info 2>&1 | findstr "401\|Unauthorized" >nul
if not errorlevel 1 (
    echo ✅ 上傳 API 端點存在（需要認證）
) else (
    curl -s http://localhost:3004/api/upload/info | findstr "success" >nul
    if not errorlevel 1 (
        echo ✅ 上傳 API 正常
    ) else (
        echo ❌ 上傳 API 異常
    )
)

echo.
echo ================================
echo 🎯 測試完成
echo ================================
echo.
echo 🌐 訪問地址:
echo    前端: http://localhost:3000/
echo    後端: http://localhost:3004/
echo.

:end
pause