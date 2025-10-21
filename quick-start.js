#!/usr/bin/env node

/**
 * 雲水材料管理系統 - 快速啟動腳本
 * 此腳本會檢查環境並提供啟動指導
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 雲水材料管理系統 - 快速啟動');
console.log('=' .repeat(50));

// 檢查 Node.js 版本
const nodeVersion = process.version;
console.log(`📦 Node.js 版本: ${nodeVersion}`);

// 檢查依賴安裝狀態
console.log('\n📋 檢查系統狀態:');

const backendDepsInstalled = fs.existsSync('backend/node_modules');
const frontendDepsInstalled = fs.existsSync('frontend/node_modules');

console.log(`✅ 後端依賴: ${backendDepsInstalled ? '已安裝' : '❌ 未安裝'}`);
console.log(`✅ 前端依賴: ${frontendDepsInstalled ? '已安裝' : '❌ 未安裝'}`);

// 檢查資料庫
console.log('\n🗄️ 檢查資料庫:');
let hasPostgreSQL = false;
let hasRedis = false;

try {
  execSync('psql --version', { stdio: 'pipe' });
  hasPostgreSQL = true;
  console.log('✅ PostgreSQL: 已安裝');
} catch {
  console.log('❌ PostgreSQL: 未安裝');
}

try {
  execSync('redis-cli --version', { stdio: 'pipe' });
  hasRedis = true;
  console.log('✅ Redis: 已安裝');
} catch {
  console.log('❌ Redis: 未安裝');
}

// 提供啟動建議
console.log('\n' + '=' .repeat(50));
console.log('🎯 啟動建議:');

if (!backendDepsInstalled || !frontendDepsInstalled) {
  console.log('\n📦 首先安裝依賴:');
  if (!backendDepsInstalled) {
    console.log('   cd backend && npm install');
  }
  if (!frontendDepsInstalled) {
    console.log('   cd frontend && npm install');
  }
}

if (!hasPostgreSQL || !hasRedis) {
  console.log('\n🎭 推薦使用演示模式 (無需資料庫):');
  console.log('   node start-demo.js');
  console.log('');
  console.log('   演示模式特點:');
  console.log('   • 使用模擬資料，無需安裝資料庫');
  console.log('   • 包含完整的測試資料和演示帳號');
  console.log('   • 一鍵啟動前後端服務');
} else {
  console.log('\n🏗️ 完整模式 (需要資料庫):');
  console.log('   1. 設定資料庫: cd backend && npm run db:setup');
  console.log('   2. 啟動後端: cd backend && npm run dev');
  console.log('   3. 啟動前端: cd frontend && npm run dev');
}

console.log('\n📚 更多資訊:');
console.log('   • 詳細指南: 查看 STARTUP_GUIDE.md');
console.log('   • 系統檢查: node scripts/check-system-status.js');

console.log('\n🌐 預期存取位址:');
console.log('   • 前端: http://localhost:3000');
console.log('   • 後端: http://localhost:3001');
console.log('   • 健康檢查: http://localhost:3001/health');

console.log('\n' + '=' .repeat(50));