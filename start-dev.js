const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 啟動雲水基材管理系統...\n');

// 檢查 Node.js
exec('node --version', (error, stdout) => {
    if (error) {
        console.error('❌ Node.js 未安裝');
        process.exit(1);
    }
    console.log(`✅ Node.js 版本: ${stdout.trim()}`);
    startServices();
});

function startServices() {
    // 清理現有進程
    console.log('🧹 清理現有進程...');
    exec('taskkill /f /im node.exe', () => {
        setTimeout(() => {
            startBackend();
        }, 2000);
    });
}

function startBackend() {
    console.log('🔧 啟動後端服務...');
    
    const backend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit',
        shell: true,
        detached: true
    });

    backend.on('error', (err) => {
        console.error('❌ 後端啟動失敗:', err.message);
    });

    // 等待後端啟動
    setTimeout(() => {
        startFrontend();
    }, 5000);
}

function startFrontend() {
    console.log('🎨 啟動前端服務...');
    
    const frontend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'frontend'),
        stdio: 'inherit',
        shell: true,
        detached: true
    });

    frontend.on('error', (err) => {
        console.error('❌ 前端啟動失敗:', err.message);
    });

    setTimeout(() => {
        console.log('\n✅ 服務啟動完成!');
        console.log('📱 前端: http://localhost:3002/');
        console.log('🔧 後端: http://localhost:3004/');
        console.log('\n💡 按 Ctrl+C 停止服務');
        
        // 打開瀏覽器
        const open = require('child_process').exec;
        open('start http://localhost:3002/', (err) => {
            if (err) {
                console.log('請手動打開: http://localhost:3002/');
            }
        });
    }, 3000);
}

// 處理退出信號
process.on('SIGINT', () => {
    console.log('\n🛑 正在停止服務...');
    exec('taskkill /f /im node.exe', () => {
        console.log('✅ 服務已停止');
        process.exit(0);
    });
});