const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;

// 中間件
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 靜態文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 內存數據庫
let users = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@yunshui.com',
    role: 'ADMIN',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'user-2',
    username: 'pm001',
    email: 'pm001@yunshui.com',
    role: 'PM',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: 'user-3',
    username: 'am001',
    email: 'am001@yunshui.com',
    role: 'AM',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  },
  {
    id: 'user-4',
    username: 'warehouse001',
    email: 'warehouse001@yunshui.com',
    role: 'WAREHOUSE',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  }
];

let materials = [
  {
    id: 'material-1',
    name: '螺絲釘 M6x20',
    category: '五金配件',
    price: 2.5,
    quantity: 1000,
    imageUrl: '/images/screw-m6x20.jpg',
    supplier: '五金供應商A',
    type: 'AUXILIARY',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'material-2',
    name: '木板 2x4x8',
    category: '木材',
    price: 45.0,
    quantity: 200,
    imageUrl: '/images/wood-2x4x8.jpg',
    supplier: '木材供應商B',
    type: 'FINISHED',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: 'material-3',
    name: '電線 2.5mm²',
    category: '電氣材料',
    price: 8.5,
    quantity: 500,
    imageUrl: '/images/wire-2.5mm.jpg',
    supplier: '電氣供應商C',
    type: 'AUXILIARY',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  },
  {
    id: 'material-4',
    name: '水泥 50kg',
    category: '建材',
    price: 180.0,
    quantity: 100,
    imageUrl: '/images/cement-50kg.jpg',
    supplier: '建材供應商D',
    type: 'FINISHED',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  }
];

let orders = [
  {
    id: 'order-1',
    userId: 'demo-pm001',
    status: 'PENDING',
    totalAmount: 250.0,
    type: 'AUXILIARY',
    items: [
      { materialId: 'material-1', materialName: '螺絲釘 M6x20', quantity: 50, price: 2.5 },
      { materialId: 'material-3', materialName: '電線 2.5mm²', quantity: 20, price: 8.5 }
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'order-2',
    userId: 'demo-admin',
    status: 'APPROVED',
    totalAmount: 90.0,
    type: 'FINISHED',
    items: [
      { materialId: 'material-2', materialName: '木板 2x4x8', quantity: 2, price: 45.0 }
    ],
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11')
  },
  {
    id: 'id-1002',
    userId: 'demo-warehouse001',
    status: 'PENDING',
    totalAmount: 150.0,
    type: 'AUXILIARY',
    items: [
      { materialId: 'material-1', materialName: '螺絲釘 M6x20', quantity: 30, price: 2.5 },
      { materialId: 'material-3', materialName: '電線 2.5mm²', quantity: 10, price: 8.5 }
    ],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12')
  }
];

let projects = [
  {
    id: 'project-1',
    orderId: 'order-1',
    projectName: '輔材專案-2024-01-10-order-1',
    overallStatus: 'ACTIVE',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'project-2',
    orderId: 'order-2',
    projectName: '輔材專案-2024-01-11-order-2',
    overallStatus: 'ACTIVE',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11')
  },
  {
    id: 'project-1002',
    orderId: 'id-1002',
    projectName: '輔材專案-2024-01-12-id-1002',
    overallStatus: 'ACTIVE',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12')
  }
];

let statusUpdates = [];
let nextId = 1000;

// 生成 ID
function generateId() {
  return `id-${nextId++}`;
}

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development',
    version: '1.0.0'
  });
});

// 認證 API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 簡單的演示認證
  const demoAccounts = {
    'admin': 'admin123',
    'pm001': 'pm123',
    'am001': 'am123',
    'warehouse001': 'wh123'
  };
  
  if (demoAccounts[username] === password) {
    const user = users.find(u => u.username === username);
    if (user) {
      res.json({
        success: true,
        data: {
          token: `demo-token-${Date.now()}`,
          user: user
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '使用者不存在'
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: '帳號或密碼錯誤'
    });
  }
});

// 使用者 API
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users
  });
});

app.post('/api/users', (req, res) => {
  const newUser = {
    ...req.body,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  users.push(newUser);
  res.json({
    success: true,
    data: newUser
  });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: '使用者不存在'
    });
  }
  
  users[index] = {
    ...users[index],
    ...req.body,
    updatedAt: new Date()
  };
  
  res.json({
    success: true,
    data: users[index]
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: '使用者不存在'
    });
  }
  
  users.splice(index, 1);
  res.json({
    success: true
  });
});

// 材料 API
app.get('/api/materials', (req, res) => {
  const { type, category, name, page = 1, limit = 10 } = req.query;
  let filteredMaterials = [...materials];
  
  // 應用篩選
  if (type) {
    filteredMaterials = filteredMaterials.filter(m => m.type === type);
  }
  if (category) {
    filteredMaterials = filteredMaterials.filter(m => m.category.includes(category));
  }
  if (name) {
    filteredMaterials = filteredMaterials.filter(m => 
      m.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  // 分頁
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      materials: paginatedMaterials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredMaterials.length,
        totalPages: Math.ceil(filteredMaterials.length / parseInt(limit))
      }
    }
  });
});

app.post('/api/materials', (req, res) => {
  const newMaterial = {
    ...req.body,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  materials.push(newMaterial);
  res.json({
    success: true,
    data: newMaterial
  });
});

app.put('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  const index = materials.findIndex(m => m.id === id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: '材料不存在'
    });
  }
  
  materials[index] = {
    ...materials[index],
    ...req.body,
    updatedAt: new Date()
  };
  
  res.json({
    success: true,
    data: materials[index]
  });
});

app.patch('/api/materials/:id/quantity', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const index = materials.findIndex(m => m.id === id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: '材料不存在'
    });
  }
  
  materials[index] = {
    ...materials[index],
    quantity: quantity,
    updatedAt: new Date()
  };
  
  res.json({
    success: true,
    data: materials[index]
  });
});

app.delete('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  const index = materials.findIndex(m => m.id === id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: '材料不存在'
    });
  }
  
  materials.splice(index, 1);
  res.json({
    success: true
  });
});

// 訂單 API (簡化版，用於手機應用)
app.get('/api/orders', (req, res) => {
  try {
    console.log('Getting orders, total count:', orders.length);
    
    // 直接返回訂單，不處理複雜的狀態
    res.json({
      success: true,
      data: {
        orders: orders,
        pagination: {
          page: 1,
          limit: 10,
          total: orders.length,
          totalPages: Math.ceil(orders.length / 10)
        }
      }
    });
  } catch (error) {
    console.error('Orders API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/orders/auxiliary', (req, res) => {
  const auxiliaryOrders = orders.filter(order => 
    order.items && order.items.some(item => 
      materials.find(m => m.id === item.materialId && m.type === 'AUXILIARY')
    )
  );

  // 為輔材訂單添加狀態信息
  const ordersWithStatus = auxiliaryOrders.map(order => {
    const project = projects.find(p => p.orderId === order.id);
    if (!project) return order;

    // 獲取該項目的最新狀態
    const projectStatusUpdates = statusUpdates.filter(su => su.projectId === project.id);
    const latestStatuses = {
      ORDER: null,
      PICKUP: null,
      DELIVERY: null,
      CHECK: null
    };

    projectStatusUpdates.forEach(update => {
      if (!latestStatuses[update.statusType] || 
          new Date(update.createdAt) > new Date(latestStatuses[update.statusType].createdAt)) {
        latestStatuses[update.statusType] = update;
      }
    });

    return {
      ...order,
      project: project,
      statusSummary: {
        order: latestStatuses.ORDER?.statusValue || '未設定',
        pickup: latestStatuses.PICKUP?.statusValue || '未設定',
        delivery: latestStatuses.DELIVERY?.statusValue || '未設定',
        check: latestStatuses.CHECK?.statusValue || '未設定'
      },
      latestStatuses: latestStatuses
    };
  });
  
  res.json({
    success: true,
    data: {
      orders: ordersWithStatus,
      pagination: {
        page: 1,
        limit: 10,
        total: ordersWithStatus.length,
        totalPages: Math.ceil(ordersWithStatus.length / 10)
      }
    }
  });
});

app.get('/api/orders/finished', (req, res) => {
  const finishedOrders = orders.filter(order => 
    order.items && order.items.some(item => 
      materials.find(m => m.id === item.materialId && m.type === 'FINISHED')
    )
  );

  // 為成品訂單添加狀態信息
  const ordersWithStatus = finishedOrders.map(order => {
    const project = projects.find(p => p.orderId === order.id);
    if (!project) return order;

    // 獲取該項目的最新狀態
    const projectStatusUpdates = statusUpdates.filter(su => su.projectId === project.id);
    const latestStatuses = {
      ORDER: null,
      PICKUP: null,
      DELIVERY: null,
      CHECK: null
    };

    projectStatusUpdates.forEach(update => {
      if (!latestStatuses[update.statusType] || 
          new Date(update.createdAt) > new Date(latestStatuses[update.statusType].createdAt)) {
        latestStatuses[update.statusType] = update;
      }
    });

    return {
      ...order,
      project: project,
      statusSummary: {
        order: latestStatuses.ORDER?.statusValue || '未設定',
        pickup: latestStatuses.PICKUP?.statusValue || '未設定',
        delivery: latestStatuses.DELIVERY?.statusValue || '未設定',
        check: latestStatuses.CHECK?.statusValue || '未設定'
      },
      latestStatuses: latestStatuses
    };
  });
  
  res.json({
    success: true,
    data: {
      orders: ordersWithStatus,
      pagination: {
        page: 1,
        limit: 10,
        total: ordersWithStatus.length,
        totalPages: Math.ceil(ordersWithStatus.length / 10)
      }
    }
  });
});

app.post('/api/orders', (req, res) => {
  const { items } = req.body;
  
  // 計算總金額
  let totalAmount = 0;
  const orderItems = items.map(item => {
    const material = materials.find(m => m.id === item.materialId);
    const unitPrice = material ? material.price : 0;
    totalAmount += item.quantity * unitPrice;
    
    return {
      id: generateId(),
      materialId: item.materialId,
      quantity: item.quantity,
      unitPrice: unitPrice,
      material: material
    };
  });
  
  const newOrder = {
    id: generateId(),
    userId: 'current-user',
    totalAmount: totalAmount,
    status: 'PENDING',
    items: orderItems,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // 自動創建對應的項目
  const newProject = {
    id: generateId(),
    orderId: newOrder.id,
    projectName: `輔材專案-${new Date().toISOString().split('T')[0]}-${newOrder.id}`,
    overallStatus: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  orders.push(newOrder);
  projects.push(newProject);
  
  res.json({
    success: true,
    data: newOrder
  });
});

app.post('/api/orders/auxiliary', (req, res) => {
  const { items } = req.body;
  
  // 計算總金額
  let totalAmount = 0;
  const orderItems = items.map(item => {
    const material = materials.find(m => m.id === item.materialId);
    const unitPrice = material ? material.price : 0;
    totalAmount += item.quantity * unitPrice;
    
    return {
      id: generateId(),
      materialId: item.materialId,
      quantity: item.quantity,
      unitPrice: unitPrice,
      material: material
    };
  });
  
  const newOrder = {
    id: generateId(),
    userId: 'current-user',
    totalAmount: totalAmount,
    status: 'PENDING',
    items: orderItems,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // 自動創建對應的項目
  const newProject = {
    id: generateId(),
    orderId: newOrder.id,
    projectName: `輔材專案-${new Date().toISOString().split('T')[0]}-${newOrder.id}`,
    overallStatus: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  orders.push(newOrder);
  projects.push(newProject);
  
  res.json({
    success: true,
    data: newOrder
  });
});

// 材料類別和供應商 API
app.get('/api/materials/categories', (req, res) => {
  const categories = [...new Set(materials.map(m => m.category))];
  res.json({
    success: true,
    data: categories
  });
});

app.get('/api/materials/suppliers', (req, res) => {
  const suppliers = [...new Set(materials.map(m => m.supplier).filter(Boolean))];
  res.json({
    success: true,
    data: suppliers
  });
});

// 材料按類型獲取
app.get('/api/materials/auxiliary', (req, res) => {
  const auxiliaryMaterials = materials.filter(m => m.type === 'AUXILIARY');
  res.json({
    success: true,
    data: {
      materials: auxiliaryMaterials,
      pagination: {
        page: 1,
        limit: auxiliaryMaterials.length,
        total: auxiliaryMaterials.length,
        totalPages: 1
      }
    }
  });
});

app.get('/api/materials/finished', (req, res) => {
  const finishedMaterials = materials.filter(m => m.type === 'FINISHED');
  res.json({
    success: true,
    data: {
      materials: finishedMaterials,
      pagination: {
        page: 1,
        limit: finishedMaterials.length,
        total: finishedMaterials.length,
        totalPages: 1
      }
    }
  });
});

// 狀態 API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      statusUpdates: statusUpdates,
      pagination: {
        page: 1,
        limit: 10,
        total: statusUpdates.length,
        totalPages: Math.ceil(statusUpdates.length / 10)
      }
    }
  });
});

// 狀態更新 API
app.put('/api/status/orders/:orderId/status/order', (req, res) => {
  const { orderId } = req.params;
  const { primaryStatus, secondaryStatus } = req.body;
  
  // 查找項目
  const project = projects.find(p => p.orderId === orderId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Project not found for this order'
    });
  }
  
  // 構建狀態值
  let statusValue = primaryStatus;
  if (primaryStatus === 'Ordered' && secondaryStatus) {
    statusValue = `${primaryStatus} - ${secondaryStatus}`;
  }
  
  // 創建狀態更新
  const statusUpdate = {
    id: generateId(),
    projectId: project.id,
    updatedBy: 'demo-user',
    statusType: 'ORDER',
    statusValue: statusValue,
    additionalData: {
      primaryStatus,
      secondaryStatus
    },
    createdAt: new Date()
  };
  
  statusUpdates.push(statusUpdate);
  
  res.json({
    success: true,
    data: statusUpdate,
    message: 'Order status updated successfully'
  });
});

app.put('/api/status/orders/:orderId/status/pickup', (req, res) => {
  const { orderId } = req.params;
  const { primaryStatus, secondaryStatus } = req.body;
  
  // 查找項目
  const project = projects.find(p => p.orderId === orderId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Project not found for this order'
    });
  }
  
  // 構建狀態值
  const statusValue = `${primaryStatus} ${secondaryStatus}`;
  
  // 創建狀態更新
  const statusUpdate = {
    id: generateId(),
    projectId: project.id,
    updatedBy: 'demo-user',
    statusType: 'PICKUP',
    statusValue: statusValue,
    additionalData: {
      primaryStatus,
      secondaryStatus
    },
    createdAt: new Date()
  };
  
  statusUpdates.push(statusUpdate);
  
  res.json({
    success: true,
    data: statusUpdate,
    message: 'Pickup status updated successfully'
  });
});

app.put('/api/status/orders/:orderId/status/delivery', (req, res) => {
  const { orderId } = req.params;
  const { status, time, address, po, deliveredBy } = req.body;
  
  // 查找項目
  const project = projects.find(p => p.orderId === orderId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Project not found for this order'
    });
  }
  
  // 創建狀態更新
  const statusUpdate = {
    id: generateId(),
    projectId: project.id,
    updatedBy: 'demo-user',
    statusType: 'DELIVERY',
    statusValue: status,
    additionalData: status === 'Delivered' ? {
      time,
      address,
      po,
      deliveredBy
    } : undefined,
    createdAt: new Date()
  };
  
  statusUpdates.push(statusUpdate);
  
  res.json({
    success: true,
    data: statusUpdate,
    message: 'Delivery status updated successfully'
  });
});

app.put('/api/status/orders/:orderId/status/check', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  // 查找項目
  const project = projects.find(p => p.orderId === orderId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Project not found for this order'
    });
  }
  
  // 創建狀態更新
  const statusUpdate = {
    id: generateId(),
    projectId: project.id,
    updatedBy: 'demo-user',
    statusType: 'CHECK',
    statusValue: status,
    createdAt: new Date()
  };
  
  statusUpdates.push(statusUpdate);
  
  // 如果檢查完成，標記項目為完成
  if (status && status !== '') {
    project.overallStatus = 'COMPLETED';
    project.updatedAt = new Date();
  }
  
  res.json({
    success: true,
    data: statusUpdate,
    message: 'Check status updated successfully'
  });
});

// 獲取項目狀態歷史
app.get('/api/status/projects/:projectId/status', (req, res) => {
  const { projectId } = req.params;
  
  const project = projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Project not found'
    });
  }
  
  const projectStatusUpdates = statusUpdates.filter(su => su.projectId === projectId);
  
  // 獲取最新狀態
  const latestStatuses = {
    ORDER: null,
    PICKUP: null,
    DELIVERY: null,
    CHECK: null
  };
  
  projectStatusUpdates.forEach(update => {
    if (!latestStatuses[update.statusType] || 
        new Date(update.createdAt) > new Date(latestStatuses[update.statusType].createdAt)) {
      latestStatuses[update.statusType] = update;
    }
  });
  
  res.json({
    success: true,
    data: {
      project,
      statusHistory: projectStatusUpdates.map(su => ({
        ...su,
        user: {
          username: 'demo-user',
          role: 'WAREHOUSE'
        }
      })),
      latestStatuses
    },
    message: 'Project status history retrieved successfully'
  });
});

// 專案 API
app.get('/api/projects', (req, res) => {
  try {
    console.log('Getting projects, total count:', projects.length);
    
    res.json({
      success: true,
      data: projects.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Projects API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { projectName, description } = req.body;
    
    if (!projectName) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }
    
    const newProject = {
      id: generateId(),
      orderId: '', // 獨立專案沒有關聯訂單
      projectName: projectName,
      description: description || undefined,
      overallStatus: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    projects.push(newProject);
    
    res.json({
      success: true,
      data: newProject,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Create project API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, description, overallStatus } = req.body;
    
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // 更新專案
    const updatedProject = {
      ...projects[projectIndex],
      ...(projectName && { projectName }),
      ...(description !== undefined && { description }),
      ...(overallStatus && { overallStatus }),
      updatedAt: new Date()
    };
    
    projects[projectIndex] = updatedProject;
    
    console.log(`Project ${id} updated:`, { projectName, description, overallStatus });
    
    res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Update project API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // 刪除專案相關的狀態更新
    statusUpdates = statusUpdates.filter(su => su.projectId !== id);
    
    // 刪除專案
    projects.splice(projectIndex, 1);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 獲取專案下的所有訂單
app.get('/api/projects/:id/orders', (req, res) => {
  try {
    const { id } = req.params;
    
    const project = projects.find(p => p.id === id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // 如果是關聯到特定訂單的專案
    if (project.orderId) {
      const order = orders.find(o => o.id === project.orderId);
      if (order) {
        return res.json({
          success: true,
          data: {
            orders: [order],
            pagination: {
              page: 1,
              limit: 1,
              total: 1,
              totalPages: 1
            }
          }
        });
      }
    }
    
    // 如果是獨立專案，查找所有關聯的訂單
    const projectOrders = orders.filter(order => 
      order.projectId === id
    );
    
    res.json({
      success: true,
      data: {
        orders: projectOrders,
        pagination: {
          page: 1,
          limit: projectOrders.length,
          total: projectOrders.length,
          totalPages: 1
        }
      }
    });
  } catch (error) {
    console.error('Get project orders API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 上傳 API
app.post('/api/upload', (req, res) => {
  // 簡單的上傳模擬
  res.json({
    success: true,
    data: {
      filename: 'uploaded-image.jpg',
      url: '/uploads/uploaded-image.jpg'
    }
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// 錯誤處理
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📦 Materials API: http://localhost:${PORT}/api/materials`);
  console.log(`🛒 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`📋 Projects API: http://localhost:${PORT}/api/projects`);
  console.log('');
  console.log('✅ 簡化服務器啟動成功！使用內存數據庫');
  console.log(`📋 Projects loaded: ${projects.length} projects`);
});

module.exports = app;