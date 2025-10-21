#!/usr/bin/env node

/**
 * 最簡化的後端伺服器 - 用於測試基本功能
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 基本中間件
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 模擬資料
const mockUsers = [
  { id: '1', username: 'admin', email: 'admin@yunshui.com', role: 'admin', name: '系統管理員' },
  { id: '2', username: 'pm001', email: 'pm001@yunshui.com', role: 'pm', name: '專案經理王小明' }
];

const mockMaterials = [
  { id: '1', name: '水泥', category: '建材', type: 'auxiliary', unit: '包', price: 150, stock_quantity: 500 },
  { id: '2', name: '鋼筋', category: '建材', type: 'auxiliary', unit: '根', price: 80, stock_quantity: 1000 }
];

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '雲水材料管理系統 - 演示模式運行中',
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo'
  });
});

// 用戶 API
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: mockUsers,
    total: mockUsers.length
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = mockUsers.find(u => u.id === req.params.id);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(404).json({ success: false, error: '用戶不存在' });
  }
});

// 材料 API
app.get('/api/materials', (req, res) => {
  res.json({
    success: true,
    materials: mockMaterials,
    total: mockMaterials.length
  });
});

app.get('/api/materials/:id', (req, res) => {
  const material = mockMaterials.find(m => m.id === req.params.id);
  if (material) {
    res.json({ success: true, material });
  } else {
    res.status(404).json({ success: false, error: '材料不存在' });
  }
});

// 認證 API (簡化版)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 簡單的演示認證
  const demoCredentials = {
    'admin': 'admin123',
    'pm001': 'pm123',
    'am001': 'am123',
    'warehouse001': 'wh123'
  };
  
  if (demoCredentials[username] === password) {
    const user = mockUsers.find(u => u.username === username) || 
                 { id: Date.now().toString(), username, role: 'user', name: username };
    
    res.json({
      success: true,
      message: '登入成功',
      token: 'demo-token-' + Date.now(),
      user
    });
  } else {
    res.status(401).json({
      success: false,
      error: '用戶名或密碼錯誤'
    });
  }
});

// 訂單 API (簡化版)
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    orders: [
      { id: '1', project_id: 'proj001', status: 'pending', total_amount: 15000, created_at: new Date() }
    ],
    total: 1
  });
});

// 狀態 API (簡化版)
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: [
      { id: '1', project_id: 'proj001', status: 'Order Placed', created_at: new Date() }
    ]
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '找不到請求的資源',
    path: req.originalUrl
  });
});

// 錯誤處理
app.use((error, req, res, next) => {
  console.error('伺服器錯誤:', error);
  res.status(500).json({
    success: false,
    error: '伺服器內部錯誤',
    message: error.message
  });
});

// 啟動伺服器
app.listen(PORT, () => {
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
  console.log('=' .repeat(50));
});

module.exports = app;