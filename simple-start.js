#!/usr/bin/env node

/**
 * 雲水材料管理系統 - 簡化啟動腳本
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 雲水材料管理系統 - 簡化啟動');
console.log('=' .repeat(50));

// 檢查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    
    server.on('error', () => resolve(false));
  });
}

async function startServices() {
  // 檢查端口
  const backendPortFree = await checkPort(3001);
  const frontendPortFree = await checkPort(3000);
  
  if (!backendPortFree) {
    console.log('⚠️  端口 3001 被占用，嘗試使用 3002');
    process.env.PORT = '3002';
  }
  
  if (!frontendPortFree) {
    console.log('⚠️  端口 3000 被占用，嘗試使用 3001');
  }
  
  console.log('\n🎯 啟動服務...');
  
  // 啟動後端
  console.log('🔧 啟動後端服務...');
  const backend = spawn('npm', ['run', 'dev'], { 
    cwd: 'backend',
    stdio: 'pipe',
    shell: true,
    env: { 
      ...process.env, 
      USE_MOCK_DATA: 'true',
      PORT: process.env.PORT || '3001'
    }
  });

  backend.stdout.on('data', (data) => {
    console.log(`[後端] ${data.toString().trim()}`);
  });

  backend.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (!message.includes('ExperimentalWarning')) {
      console.error(`[後端錯誤] ${message}`);
    }
  });

  // 等待後端啟動
  setTimeout(() => {
    console.log('🎨 啟動前端服務...');
    const frontend = spawn('npm', ['run', 'dev'], { 
      cwd: 'frontend',
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        VITE_API_URL: `http://localhost:${process.env.PORT || '3001'}/api`
      }
    });

    frontend.stdout.on('data', (data) => {
      console.log(`[前端] ${data.toString().trim()}`);
    });

    frontend.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (!message.includes('ExperimentalWarning') && !message.includes('Forced re-optimization')) {
        console.error(`[前端錯誤] ${message}`);
      }
    });

    // 顯示存取資訊
    setTimeout(() => {
      console.log('\n' + '=' .repeat(50));
      console.log('🎉 系統啟動完成！');
      console.log('\n📱 存取位址:');
      console.log(`   前端應用程式: http://localhost:3000`);
      console.log(`   後端 API: http://localhost:${process.env.PORT || '3001'}`);
      console.log(`   健康檢查: http://localhost:${process.env.PORT || '3001'}/health`);
      console.log('\n👤 演示帳號:');
      console.log('   管理員: admin / admin123');
      console.log('   專案經理: pm001 / pm123');
      console.log('   區域經理: am001 / am123');
      console.log('   倉庫管理員: warehouse001 / wh123');
      console.log('\n🛑 停止服務: 按 Ctrl+C');
      console.log('=' .repeat(50));
    }, 5000);

    // 處理程序終止
    process.on('SIGINT', () => {
      console.log('\n🛑 正在停止服務...');
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
      setTimeout(() => process.exit(0), 1000);
    });

  }, 3000);
}

startServices().catch(console.error);