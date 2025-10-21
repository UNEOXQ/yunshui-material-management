# 使用官方 Node.js 18 LTS 映像作為基礎
FROM node:18-alpine AS base

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production && npm cache clean --force

# 開發階段
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# 建置階段
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# 生產階段
FROM node:18-alpine AS production

# 創建非 root 使用者
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# 複製 package.json 和安裝生產依賴
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 複製建置後的應用程式
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/uploads ./uploads

# 切換到非 root 使用者
USER nodejs

# 暴露端口
EXPOSE 3001

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/scripts/health-check.js || exit 1

# 啟動應用程式
CMD ["node", "dist/server.js"]