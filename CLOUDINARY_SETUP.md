# 🖼️ Cloudinary 圖片存儲設置指南

## 為什麼需要 Cloudinary？

目前圖片存儲在本地，導致：
- ✅ 你的電腦可以看到圖片
- ❌ 其他裝置看不到圖片
- ❌ Render 部署時會清除上傳的文件

使用 Cloudinary 後：
- ✅ 所有裝置都能看到圖片
- ✅ 圖片永久存儲在雲端
- ✅ 自動圖片優化和壓縮
- ✅ 免費額度很大（25GB 存儲，25GB 月流量）

## 設置步驟

### 1. 註冊 Cloudinary 帳號

1. 前往 [Cloudinary 官網](https://cloudinary.com/)
2. 點擊 "Sign Up for Free"
3. 填寫資料並註冊

### 2. 獲取 API 憑證

1. 登入 Cloudinary Dashboard
2. 在首頁可以看到：
   - **Cloud Name**: 你的雲端名稱
   - **API Key**: API 金鑰
   - **API Secret**: API 密鑰（點擊眼睛圖標顯示）

### 3. 設置環境變數

在 Render 部署設置中添加環境變數：

```
CLOUDINARY_CLOUD_NAME=你的雲端名稱
CLOUDINARY_API_KEY=你的API金鑰
CLOUDINARY_API_SECRET=你的API密鑰
```

### 4. 本地測試（可選）

如果要在本地測試，創建 `backend/.env` 文件：

```env
CLOUDINARY_CLOUD_NAME=你的雲端名稱
CLOUDINARY_API_KEY=你的API金鑰
CLOUDINARY_API_SECRET=你的API密鑰
```

## 設置完成後的效果

- 🖼️ 新上傳的圖片會存儲在 Cloudinary
- 🌐 圖片 URL 會是 `https://res.cloudinary.com/你的雲端名稱/...`
- 📱 所有裝置都能正常顯示圖片
- 🔄 舊的本地圖片仍然可以正常顯示（向後兼容）

## 費用說明

Cloudinary 免費方案包含：
- 25GB 雲端存儲
- 25GB 月流量
- 25,000 次圖片轉換

對於一般使用完全足夠！

## 需要幫助？

設置完成後，請告訴我：
1. 是否成功註冊 Cloudinary
2. 是否已在 Render 設置環境變數
3. 測試上傳圖片是否正常

我會協助你完成整個設置過程！