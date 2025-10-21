# 使用官方 Node.js 18 LTS 映像作為基礎
FROM node:18-alpine AS base

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci && npm cache clean --force

# 開發階段
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# 建置階段
FROM base AS build
COPY . .
RUN npm run build

# 生產階段 - 使用 nginx 提供靜態檔案
FROM nginx:alpine AS production

# 複製自定義 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 複製建置後的檔案到 nginx 目錄
COPY --from=build /app/dist /usr/share/nginx/html

# 創建非 root 使用者
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginx -u 1001

# 設定正確的權限
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R nginx:nginx /var/cache/nginx
RUN chown -R nginx:nginx /var/log/nginx
RUN chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx:nginx /var/run/nginx.pid

# 切換到非 root 使用者
USER nginx

# 暴露端口
EXPOSE 80

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]