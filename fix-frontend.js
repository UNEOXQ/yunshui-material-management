#!/usr/bin/env node

/**
 * 修復前端啟動問題
 * 主要解決路徑中文字符導致的 Vite 掃描問題
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 修復前端啟動問題...');

// 檢查並修復 vite.config.ts
const viteConfigPath = 'frontend/vite.config.ts';
const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
    force: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})`;

fs.writeFileSync(viteConfigPath, viteConfig);
console.log('✅ 更新 vite.config.ts');

// 檢查並創建缺少的檔案
const requiredFiles = [
  {
    path: 'frontend/src/vite-env.d.ts',
    content: `/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_NODE_ENV: string
  readonly VITE_ENABLE_MOCK_DATA: string
  readonly VITE_ENABLE_DEBUG_MODE: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_DEFAULT_LANGUAGE: string
  readonly VITE_THEME: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_FILE_TYPES: string
  readonly VITE_CACHE_DURATION: string
  readonly VITE_PAGINATION_SIZE: string
  readonly VITE_DEBOUNCE_DELAY: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_AUTO_LOGOUT_WARNING: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}`
  }
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file.path)) {
    fs.writeFileSync(file.path, file.content);
    console.log(`✅ 創建 ${file.path}`);
  }
});

// 清理 node_modules 和重新安裝依賴
console.log('🧹 清理前端快取...');

try {
  // 刪除 node_modules/.vite 快取
  const viteCachePath = 'frontend/node_modules/.vite';
  if (fs.existsSync(viteCachePath)) {
    fs.rmSync(viteCachePath, { recursive: true, force: true });
    console.log('✅ 清理 Vite 快取');
  }

  // 刪除 dist 目錄
  const distPath = 'frontend/dist';
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('✅ 清理 dist 目錄');
  }

} catch (error) {
  console.log('⚠️  清理快取時發生錯誤:', error.message);
}

console.log('\n🎯 修復完成！');
console.log('\n請嘗試以下步驟：');
console.log('1. cd frontend');
console.log('2. npm run dev');
console.log('\n或者使用：');
console.log('node start-demo.js');