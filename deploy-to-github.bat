@echo off
echo 🚀 雲水基材管理系統 - GitHub部署腳本
echo =====================================
echo.

REM 檢查是否已經初始化Git
if not exist .git (
    echo 初始化Git倉庫...
    git init
    echo ✅ Git倉庫已初始化
) else (
    echo ✅ Git倉庫已存在
)

echo.
echo 添加所有文件到Git...
git add .

echo.
echo 提交更改...
git commit -m "準備部署: 雲水基材管理系統"

echo.
echo 設定主分支...
git branch -M main

echo.
echo ⚠️  請注意: 你需要先在GitHub創建倉庫
echo 倉庫名稱建議: yunshui-material-management
echo.
echo 創建完成後，請執行以下指令:
echo git remote add origin https://github.com/你的用戶名/yunshui-material-management.git
echo git push -u origin main
echo.

pause