# 背景圖片設定

## 背景圖片已移除

背景圖片功能已被移除，系統現在使用簡潔的純色背景：
- 主背景色：#f0f8ff (很淡的淡藍色 - Alice Blue)
- 卡片背景：#ffffff (白色)
- 陰影效果：保留以增加層次感

## 如果需要重新啟用背景圖片

如果未來需要重新添加背景圖片功能，可以：
1. 將圖片保存為 `yunshui-background.jpg` 並放置在此目錄
2. 在 App.css 中重新添加 .yunshui-background 樣式
3. 在 App.tsx 中重新添加 `<div className="yunshui-background"></div>` 元素

建議圖片規格：
   - 格式：JPG 或 PNG
   - 尺寸：至少 1920x1080 像素
   - 檔案大小：建議小於 2MB
   - 風格：淡雅的山水畫或自然風景