// 簡單的 Node.js 啟動腳本
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 雲水基材管理系統啟動器');
console.log('========================');

// 檢查基本環境
console.log('\n1. 檢查環境...');
console.log('當前目錄:', process.cwd());
console.log('Node.js 版本:', process.version);

// 檢查項目結構
console.log('\n2. 檢查項目結構...');
const backendExists = fs.existsSync('backend');
const frontendExists = fs.existsSync('frontend');
const backendPackageExists = fs.existsSync('backend/package.json');
const frontendPackageExists = fs.existsSync('frontend/package.json');

console.log('backend 目錄:', backendExists ? '✅' : '❌');
console.log('frontend 目錄:', frontendExists ? '✅' : '❌');
console.log('backend/package.json:', backendPackageExists ? '✅' : '❌');
console.log('frontend/package.json:', frontendPackageExists ? '✅' : '❌');

if (!backendExists || !frontendExists || !backendPackageExists || !frontendPackageExists) {
    console.log('\n❌ 項目結構不完整，請檢查文件是否存在');
    process.exit(1);
}

console.log('\n3. 啟動服務...');

// 啟動後端
console.log('啟動後端服務...');
const backend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(process.cwd(), 'backend'),
    stdio: 'inherit',
    shell: true
});

backend.on('error', (err) => {
    console.error('後端啟動失敗:', err);
});

// 等待一段時間後啟動前端
setTimeout(() => {
    console.log('啟動前端服務...');
    const frontend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(process.cwd(), 'frontend'),
        stdio: 'inherit',
        shell: true
    });

    frontend.on('error', (err) => {
        console.error('前端啟動失敗:', err);
    });
}, 3000);

console.log('\n✅ 服務啟動中...');
console.log('前端: http://localhost:3002/');
console.log('後端: http://localhost:3004/');
console.log('\n按 Ctrl+C 停止服務');

// 處理退出
process.on('SIGINT', () => {
    console.log('\n正在停止服務...');
    process.exit(0);
});