#!/usr/bin/env node

/**
 * 雲水材料管理系統 - 演示模式啟動腳本
 * 此腳本會在模擬資料模式下啟動系統，無需資料庫
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 雲水材料管理系統 - 演示模式');
console.log('=' .repeat(50));

// 檢查 Node.js 版本
const nodeVersion = process.version;
console.log(`📦 Node.js 版本: ${nodeVersion}`);

if (parseInt(nodeVersion.slice(1)) < 16) {
  console.error('❌ 需要 Node.js 16 或更高版本');
  process.exit(1);
}

// 檢查必要檔案
const requiredFiles = [
  'backend/package.json',
  'frontend/package.json',
  'backend/.env.development',
  'frontend/.env.development'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ 缺少必要檔案: ${file}`);
    process.exit(1);
  }
}

console.log('✅ 檔案檢查通過');

// 檢查依賴是否安裝
if (!fs.existsSync('backend/node_modules')) {
  console.log('📦 安裝後端依賴...');
  const backendInstall = spawn('npm', ['install'], { 
    cwd: 'backend', 
    stdio: 'inherit',
    shell: true 
  });
  
  backendInstall.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ 後端依賴安裝失敗');
      process.exit(1);
    }
    checkFrontendDeps();
  });
} else {
  checkFrontendDeps();
}

function checkFrontendDeps() {
  if (!fs.existsSync('frontend/node_modules')) {
    console.log('📦 安裝前端依賴...');
    const frontendInstall = spawn('npm', ['install'], { 
      cwd: 'frontend', 
      stdio: 'inherit',
      shell: true 
    });
    
    frontendInstall.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ 前端依賴安裝失敗');
        process.exit(1);
      }
      startServices();
    });
  } else {
    startServices();
  }
}

function startServices() {
  console.log('\n🎯 啟動服務...');
  
  // 啟動後端
  console.log('🔧 啟動後端服務 (端口 3001)...');
  const backend = spawn('npm', ['run', 'dev'], { 
    cwd: 'backend',
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, USE_MOCK_DATA: 'true' }
  });

  backend.stdout.on('data', (data) => {
    console.log(`[後端] ${data.toString().trim()}`);
  });

  backend.stderr.on('data', (data) => {
    console.error(`[後端錯誤] ${data.toString().trim()}`);
  });

  // 等待後端啟動後再啟動前端
  setTimeout(() => {
    console.log('🎨 啟動前端服務 (端口 3000)...');
    const frontend = spawn('npm', ['run', 'dev'], { 
      cwd: 'frontend',
      stdio: 'pipe',
      shell: true 
    });

    frontend.stdout.on('data', (data) => {
      console.log(`[前端] ${data.toString().trim()}`);
    });

    frontend.stderr.on('data', (data) => {
      console.error(`[前端錯誤] ${data.toString().trim()}`);
    });

    // 顯示存取資訊
    setTimeout(() => {
      console.log('\n' + '=' .repeat(50));
      console.log('🎉 系統啟動完成！');
      console.log('\n📱 存取位址:');
      console.log('   前端應用程式: http://localhost:3000');
      console.log('   後端 API: http://localhost:3001');
      console.log('   健康檢查: http://localhost:3001/health');
      console.log('\n👤 演示帳號:');
      console.log('   管理員: admin / admin123');
      console.log('   專案經理: pm001 / pm123');
      console.log('   區域經理: am001 / am123');
      console.log('   倉庫管理員: warehouse001 / wh123');
      console.log('\n⚠️  注意: 此為演示模式，資料僅存在記憶體中');
      console.log('   重新啟動後資料會重置');
      console.log('\n🛑 停止服務: 按 Ctrl+C');
      console.log('=' .repeat(50));
    }, 3000);

  }, 2000);

  // 處理程序終止
  process.on('SIGINT', () => {
    console.log('\n🛑 正在停止服務...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
}