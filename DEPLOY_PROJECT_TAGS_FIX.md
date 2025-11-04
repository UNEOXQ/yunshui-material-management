# 專案標籤樣式修復部署

## 修復內容
- 修復專案標籤字體粗細問題（從粗體改為正常字重）
- 調整專案標籤文字垂直位置（略微向下移動）
- 確保樣式不受全局按鈕樣式影響

## 修改的文件
- `frontend/src/components/ProjectTags/ProjectTags.css`
- `frontend/src/components/OrderManagement/OrderManagement.css`

## 部署時間
- 提交時間: 2025-11-04 17:52
- 提交ID: c97962f

## 預期效果
專案標籤（如 dds, Hill, 1, 2, 3, 4）應該顯示為：
- 正常字重（不粗體）
- 文字位置更居中（略微向下調整）

## 測試方法
1. 訪問線上系統
2. 登入任何用戶
3. 進入訂單管理頁面
4. 查看頁面上方的專案標籤列表
5. 確認標籤文字不再粗體且位置正確