// 簡單的後端啟動腳本，不使用 nodemon
const { spawn } = require('child_process');
const path = require('path');

console.log('啟動簡單後端服務器...');

// 直接使用 ts-node 運行，不使用 nodemon
const server = spawn('npx', ['ts-node', 'src/server.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('服務器啟動錯誤:', err);
});

server.on('exit', (code) => {
  console.log(`服務器進程退出，代碼: ${code}`);
});

// 處理進程退出
process.on('SIGINT', () => {
  console.log('正在停止服務器...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('正在停止服務器...');
  server.kill('SIGTERM');
  process.exit(0);
});