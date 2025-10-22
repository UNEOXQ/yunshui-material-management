# Render 新服務設置指南

## 快速創建新的 Render 服務

1. **登入 Render 控制台**
   - 前往 https://render.com
   - 登入你的帳號

2. **創建新的 Web Service**
   - 點擊 "New +" → "Web Service"
   - 選擇 "Build and deploy from a Git repository"

3. **連接 GitHub Repository**
   - 選擇 `UNEOXQ/yunshui-material-management`
   - Branch: `main`

4. **配置服務設置**
   ```
   Name: yunshui-backend-v2
   Region: Oregon (US West)
   Branch: main
   Root Directory: (留空)
   Runtime: Node
   Build Command: cd backend && npm install && npm run build
   Start Command: cd backend && npm start
   ```

5. **設置環境變數**
   ```
   NODE_ENV = production
   JWT_SECRET = yunshui-super-secret-jwt-key-2024
   JWT_REFRESH_SECRET = yunshui-refresh-secret-key-2024
   ```

6. **部署**
   - 點擊 "Create Web Service"
   - 等待部署完成（約 3-5 分鐘）

## 新服務 URL
部署完成後，新的 URL 會是：
`https://yunshui-backend-v2.onrender.com`

## 更新前端配置
需要更新前端的 API 基礎 URL 指向新服務。