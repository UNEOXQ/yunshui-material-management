@echo off
chcp 65001 >nul
echo.
echo 📱 雲水基材管理系統手機版測試
echo ============================
echo.

echo 🔧 移除 Web 支援，專注手機版本...
echo.

echo 📝 更新 app.json 配置...
echo {"expo":{"name":"雲水基材管理","slug":"yunshui-mobile","version":"1.0.0","orientation":"portrait","platforms":["ios","android"],"splash":{"backgroundColor":"#007bff"},"android":{"package":"com.yunshui.mobile"},"ios":{"bundleIdentifier":"com.yunshui.mobile"}}} > app.json

echo ✅ 配置已更新為僅支援手機平台
echo.

echo 🚀 啟動手機版本 (Tunnel 模式)...
echo 📱 請使用 Expo Go 掃描 QR 碼
echo ⏱️  等待 Tunnel 建立 (可能需要 1-2 分鐘)...
echo.

npx expo start --tunnel --clear

echo.
echo 💡 如果 Expo Go 版本不相容:
echo 1. 更新 Expo Go 到最新版本
echo 2. 或在 Expo Go 中清除快取
echo 3. 重新掃描 QR 碼
echo.
pause