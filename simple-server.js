#!/usr/bin/env node

/**
 * 純 Node.js 簡化伺服器 - 無需額外依賴
 */

const http = require('http');
const url = require('url');

const PORT = 8080;

// 模擬資料
const mockData = {
  users: [
    { id: '1', username: 'admin', email: 'admin@yunshui.com', role: 'admin', name: '系統管理員' },
    { id: '2', username: 'pm001', email: 'pm001@yunshui.com', role: 'pm', name: '專案經理王小明' }
  ],
  materials: [
    { id: '1', name: '水泥', category: '建材', type: 'auxiliary', unit: '包', price: 150, stock_quantity: 500 },
    { id: '2', name: '鋼筋', category: '建材', type: 'auxiliary', unit: '根', price: 80, stock_quantity: 1000 }
  ]
};

// 簡單的 JSON 回應函數
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

// 處理 POST 請求的 body
function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

// 創建伺服器
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // 處理 CORS 預檢請求
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  console.log(`${method} ${path}`);

  try {
    // 路由處理
    if (path === '/health') {
      sendJSON(res, 200, {
        success: true,
        message: '雲水材料管理系統 - 演示模式運行中',
        timestamp: new Date().toISOString(),
        version: '1.0.0-demo'
      });
    }
    else if (path === '/api/users') {
      sendJSON(res, 200, {
        success: true,
        users: mockData.users,
        total: mockData.users.length
      });
    }
    else if (path.startsWith('/api/users/')) {
      const id = path.split('/')[3];
      const user = mockData.users.find(u => u.id === id);
      if (user) {
        sendJSON(res, 200, { success: true, user });
      } else {
        sendJSON(res, 404, { success: false, error: '用戶不存在' });
      }
    }
    else if (path === '/api/materials') {
      sendJSON(res, 200, {
        success: true,
        materials: mockData.materials,
        total: mockData.materials.length
      });
    }
    else if (path.startsWith('/api/materials/')) {
      const id = path.split('/')[3];
      const material = mockData.materials.find(m => m.id === id);
      if (material) {
        sendJSON(res, 200, { success: true, material });
      } else {
        sendJSON(res, 404, { success: false, error: '材料不存在' });
      }
    }
    else if (path === '/api/auth/login' && method === 'POST') {
      const body = await getRequestBody(req);
      const { username, password } = body;
      
      // 簡單的演示認證
      const demoCredentials = {
        'admin': 'admin123',
        'pm001': 'pm123',
        'am001': 'am123',
        'warehouse001': 'wh123'
      };
      
      if (demoCredentials[username] === password) {
        const user = mockData.users.find(u => u.username === username) || 
                     { id: Date.now().toString(), username, role: 'user', name: username };
        
        sendJSON(res, 200, {
          success: true,
          message: '登入成功',
          token: 'demo-token-' + Date.now(),
          user
        });
      } else {
        sendJSON(res, 401, {
          success: false,
          error: '用戶名或密碼錯誤'
        });
      }
    }
    else if (path === '/api/orders') {
      sendJSON(res, 200, {
        success: true,
        orders: [
          { id: '1', project_id: 'proj001', status: 'pending', total_amount: 15000, created_at: new Date() }
        ],
        total: 1
      });
    }
    else if (path === '/api/status') {
      sendJSON(res, 200, {
        success: true,
        status: [
          { id: '1', project_id: 'proj001', status: 'Order Placed', created_at: new Date() }
        ]
      });
    }
    else {
      // 404 處理
      sendJSON(res, 404, {
        success: false,
        error: '找不到請求的資源',
        path: path
      });
    }
  } catch (error) {
    console.error('伺服器錯誤:', error);
    sendJSON(res, 500, {
      success: false,
      error: '伺服器內部錯誤',
      message: error.message
    });
  }
});

// 啟動伺服器
server.listen(PORT, () => {
  console.log('🚀 雲水材料管理系統 - 演示模式');
  console.log('=' .repeat(50));
  console.log(`🔧 後端服務運行在: http://localhost:${PORT}`);
  console.log(`📊 健康檢查: http://localhost:${PORT}/health`);
  console.log(`👥 用戶 API: http://localhost:${PORT}/api/users`);
  console.log(`📦 材料 API: http://localhost:${PORT}/api/materials`);
  console.log(`🔐 登入 API: http://localhost:${PORT}/api/auth/login`);
  console.log('');
  console.log('🎭 演示帳號:');
  console.log('   admin / admin123');
  console.log('   pm001 / pm123');
  console.log('   am001 / am123');
  console.log('   warehouse001 / wh123');
  console.log('');
  console.log('🧪 測試命令:');
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log(`   curl http://localhost:${PORT}/api/users`);
  console.log('');
  console.log('🛑 停止服務: 按 Ctrl+C');
  console.log('=' .repeat(50));
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n🛑 正在停止服務...');
  server.close(() => {
    console.log('✅ 服務已停止');
    process.exit(0);
  });
});