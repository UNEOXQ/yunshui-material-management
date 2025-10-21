@echo off
echo 正在初始化 Git 倉庫...
git init

echo 添加所有文件到 Git...
git add .

echo 創建初始提交...
git commit -m "初始提交：雲水基材管理系統完整版本"

echo 創建當前版本標籤...
git tag -a v1.0 -m "版本 1.0：完整功能版本"

echo Git 倉庫初始化完成！
echo.
echo 使用方法：
echo 1. 每次修改後執行：git add . && git commit -m "描述修改內容"
echo 2. 創建版本標籤：git tag -a v1.1 -m "版本描述"
echo 3. 查看歷史：git log --oneline
echo 4. 還原到特定版本：git checkout [版本號]
pause