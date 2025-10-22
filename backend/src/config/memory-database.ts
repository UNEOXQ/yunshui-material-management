// 內存數據庫配置 - 用於開發和測試
import { User, Material, Order, OrderItem, OrderWithItems, Project, StatusUpdate, Message } from '../types';
import fs from 'fs';
import path from 'path';

// 內存數據存儲
export class MemoryDatabase {
  private users: User[] = [
    {
      id: 'user-1',
      username: 'admin',
      email: 'admin@yunshui.com',
      role: 'ADMIN',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO', // admin123
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'user-2',
      username: 'pm001',
      email: 'pm001@yunshui.com',
      role: 'PM',
      passwordHash: '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // pm123
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    },
    {
      id: 'user-3',
      username: 'am001',
      email: 'am001@yunshui.com',
      role: 'AM',
      passwordHash: '$2b$12$8k2ydShrf92wRSu0Cxn2lOm.hl0oBBXXisop.CqvN/9tQiJMXvne6', // am123
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03')
    },
    {
      id: 'user-4',
      username: 'warehouse001',
      email: 'warehouse001@yunshui.com',
      role: 'WAREHOUSE',
      passwordHash: '$2b$12$6BNUHWuoAhHfufkBMy4MJ.qiAiHXVBFy4XGaGILoxN05oy01L9Hhm', // wh123
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04')
    }
  ];

  private materials: Material[] = [
    {
      id: 'material-1',
      name: '螺絲釘 M6x20',
      category: '五金配件',
      price: 2.5,
      quantity: 1000,
      imageUrl: null,
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
      imageUrl: null,
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
      imageUrl: null,
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
      imageUrl: null,
      supplier: '建材供應商D',
      type: 'FINISHED',
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04')
    }
  ];

  private orders: Order[] = [
    {
      id: 'order-1',
      userId: 'demo-pm001', // PM user (matches JWT token)
      status: 'PENDING',
      totalAmount: 250.0,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: 'order-2',
      userId: 'demo-admin', // Admin user (matches JWT token)
      status: 'APPROVED',
      totalAmount: 90.0,
      createdAt: new Date('2024-01-11'),
      updatedAt: new Date('2024-01-11')
    },
    {
      id: 'id-1002',
      userId: 'demo-warehouse001', // Warehouse user
      status: 'PENDING',
      totalAmount: 150.0,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12')
    }
  ];

  private orderItems: OrderItem[] = [
    {
      id: 'item-1',
      orderId: 'order-1',
      materialId: 'material-1',
      quantity: 100,
      unitPrice: 2.5
    },
    {
      id: 'item-2',
      orderId: 'order-2',
      materialId: 'material-2',
      quantity: 2,
      unitPrice: 45.0
    }
  ];

  private projects: Project[] = [
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

  private statusUpdates: StatusUpdate[] = [];

  private messages: Message[] = [];

  private nextId = 2000;

  constructor() {
    this.restoreImageUrls();
  }

  // 恢復圖片 URL（服務器重啟後）
  private restoreImageUrls() {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'materials');
      
      if (!fs.existsSync(uploadsDir)) {
        return;
      }

      const files = fs.readdirSync(uploadsDir);
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
      
      if (imageFiles.length > 0) {
        // 為第一個材料分配最新的圖片
        const latestImage = imageFiles
          .map(file => ({
            file,
            time: fs.statSync(path.join(uploadsDir, file)).mtime
          }))
          .sort((a, b) => b.time.getTime() - a.time.getTime())[0];

        if (latestImage && this.materials.length > 0) {
          const baseUrl = process.env.BASE_URL || 'http://localhost:3004';
          this.materials[0].imageUrl = `${baseUrl}/uploads/materials/${latestImage.file}`;
          console.log(`Restored image URL for ${this.materials[0].name}: ${this.materials[0].imageUrl}`);
        }
      }
    } catch (error) {
      console.warn('Error restoring image URLs:', error);
    }
  }

  // 生成新 ID
  private generateId(): string {
    return `id-${this.nextId++}`;
  }

  // 更新nextId以避免與現有數據衝突
  private updateNextId() {
    const allIds = [
      ...this.orders.map(o => o.id),
      ...this.projects.map(p => p.id),
      ...this.statusUpdates.map(s => s.id)
    ];
    
    let maxId = this.nextId;
    for (const id of allIds) {
      if (id.startsWith('id-')) {
        const numId = parseInt(id.substring(3));
        if (!isNaN(numId) && numId >= maxId) {
          maxId = numId + 1;
        }
      }
    }
    
    this.nextId = maxId;
    console.log(`Updated nextId to ${this.nextId} to avoid conflicts`);
  }

  // 用戶操作
  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    
    // 立即保存用戶創建
    this.saveToFile();
    
    return newUser;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    this.users[index] = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    };
    
    // 立即保存用戶更新
    this.saveToFile();
    
    return this.users[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    
    // 立即保存用戶刪除
    this.saveToFile();
    
    return true;
  }

  // 材料操作
  async getAllMaterials(filters?: any, page = 1, limit = 10): Promise<{ materials: Material[], total: number }> {
    let filteredMaterials = [...this.materials];

    // 應用篩選
    if (filters?.type) {
      filteredMaterials = filteredMaterials.filter(m => m.type === filters.type);
    }
    if (filters?.category) {
      filteredMaterials = filteredMaterials.filter(m => m.category.includes(filters.category));
    }
    if (filters?.name) {
      filteredMaterials = filteredMaterials.filter(m => m.name.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters?.supplier) {
      filteredMaterials = filteredMaterials.filter(m => m.supplier === filters.supplier);
    }

    // 應用分頁
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

    return {
      materials: paginatedMaterials,
      total: filteredMaterials.length
    };
  }

  async getMaterialById(id: string): Promise<Material | null> {
    return this.materials.find(m => m.id === id) || null;
  }

  async createMaterial(materialData: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> {
    const newMaterial: Material = {
      ...materialData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.materials.push(newMaterial);
    this.hasUnsavedChanges = true;
    
    // 立即保存材料創建（重要數據）
    this.saveToFile();
    
    return newMaterial;
  }

  async updateMaterial(id: string, materialData: Partial<Material>): Promise<Material | null> {
    const index = this.materials.findIndex(m => m.id === id);
    if (index === -1) return null;

    this.materials[index] = {
      ...this.materials[index],
      ...materialData,
      updatedAt: new Date()
    };
    this.hasUnsavedChanges = true;
    
    // 立即保存材料更新（重要數據）
    this.saveToFile();
    
    return this.materials[index];
  }

  async updateMaterialImageUrl(id: string, imageUrl: string): Promise<Material | null> {
    const index = this.materials.findIndex(m => m.id === id);
    if (index === -1) return null;

    this.materials[index] = {
      ...this.materials[index],
      imageUrl: imageUrl,
      updatedAt: new Date()
    };
    this.hasUnsavedChanges = true;
    
    // 立即保存圖片更新（重要數據）
    this.saveToFile();
    
    return this.materials[index];
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const index = this.materials.findIndex(m => m.id === id);
    if (index === -1) return false;

    this.materials.splice(index, 1);
    this.hasUnsavedChanges = true;
    
    // 立即保存材料刪除（重要數據）
    this.saveToFile();
    
    return true;
  }

  // 獲取所有分類
  async getCategories(type?: string): Promise<string[]> {
    let materials = [...this.materials];
    
    if (type) {
      materials = materials.filter(m => m.type === type);
    }
    
    const categories = [...new Set(materials.map(m => m.category))];
    return categories.sort();
  }

  // 獲取所有供應商
  async getSuppliers(type?: string): Promise<string[]> {
    let materials = [...this.materials];
    
    if (type) {
      materials = materials.filter(m => m.type === type);
    }
    
    const suppliers = [...new Set(materials.map(m => m.supplier).filter((s): s is string => s !== undefined && s !== ''))];
    return suppliers.sort();
  }

  // 訂單操作
  async getAllOrders(): Promise<OrderWithItems[]> {
    const orders = [...this.orders];
    // 豐富每個訂單的材料信息
    const enrichedOrders = await Promise.all(
      orders.map(order => this.enrichOrderWithMaterials(order))
    );
    return enrichedOrders;
  }

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const newOrder: Order = {
      ...orderData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.push(newOrder);
    this.hasUnsavedChanges = true;
    
    // 立即保存訂單創建（重要數據）
    this.saveToFile();
    
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | null> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      status: status as any,
      updatedAt: new Date()
    };
    this.hasUnsavedChanges = true;
    
    // 立即保存重要的狀態更新
    this.saveToFile();
    
    return this.orders[index];
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orders.find(o => o.id === id) || null;
  }

  async updateOrderName(id: string, name: string): Promise<Order | null> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      name: name,
      updatedAt: new Date()
    };
    this.hasUnsavedChanges = true;
    
    // 立即保存重要的更新
    this.saveToFile();
    
    return this.orders[index];
  }

  async deleteOrder(id: string): Promise<boolean> {
    const orderIndex = this.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return false;

    // 刪除訂單
    this.orders.splice(orderIndex, 1);

    // 刪除相關的訂單項目
    this.orderItems = this.orderItems.filter(item => item.orderId !== id);

    // 刪除相關的項目
    const project = this.projects.find(p => p.orderId === id);
    if (project) {
      // 刪除項目相關的狀態更新
      this.statusUpdates = this.statusUpdates.filter(su => su.projectId !== project.id);
      
      // 刪除項目
      this.projects = this.projects.filter(p => p.id !== project.id);
    }

    this.hasUnsavedChanges = true;
    
    // 立即保存重要的刪除操作
    this.saveToFile();
    
    return true;
  }

  // OrderItem 操作
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.orderItems.filter(item => item.orderId === orderId);
  }

  async createOrderItem(itemData: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    const newItem: OrderItem = {
      ...itemData,
      id: this.generateId()
    };
    this.orderItems.push(newItem);
    this.hasUnsavedChanges = true; // 標記有未保存的更改
    
    // 立即保存訂單項目創建（重要數據）
    this.saveToFile();
    
    return newItem;
  }

  // 豐富訂單數據，包含完整的材料信息
  private async enrichOrderWithMaterials(order: Order): Promise<OrderWithItems> {
    const orderItems = this.orderItems.filter(item => item.orderId === order.id);
    
    const enrichedItems = await Promise.all(orderItems.map(async (item) => {
      const material = this.materials.find(m => m.id === item.materialId);
      
      return {
        ...item,
        materialName: material?.name || '未知材料',
        materialCategory: material?.category || '',
        materialType: material?.type || 'AUXILIARY',
        supplier: material?.supplier || '',
        imageUrl: material?.imageUrl || '',
        material: material ? {
          id: material.id,
          name: material.name,
          category: material.category,
          price: material.price,
          quantity: material.quantity,
          supplier: material.supplier || '',
          imageUrl: material.imageUrl || '',
          type: material.type,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt
        } : undefined
      };
    }));

    return {
      ...order,
      items: enrichedItems
    };
  }

  async findOrdersByUserId(userId: string, filters?: any, page: number = 1, limit: number = 10): Promise<{orders: OrderWithItems[], total: number}> {
    let filteredOrders = this.orders.filter(order => order.userId === userId);
    
    if (filters?.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status);
    }
    
    // 按創建時間排序（最新的在前）
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const total = filteredOrders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    // 豐富每個訂單的材料信息
    const enrichedOrders = await Promise.all(
      paginatedOrders.map(order => this.enrichOrderWithMaterials(order))
    );
    
    return {
      orders: enrichedOrders,
      total
    };
  }

  async findAllOrders(filters?: any, page: number = 1, limit: number = 10): Promise<{orders: OrderWithItems[], total: number}> {
    let filteredOrders = [...this.orders];
    
    if (filters?.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status);
    }
    
    // 按創建時間排序（最新的在前）
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const total = filteredOrders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    // 豐富每個訂單的材料信息
    const enrichedOrders = await Promise.all(
      paginatedOrders.map(order => this.enrichOrderWithMaterials(order))
    );
    
    return {
      orders: enrichedOrders,
      total
    };
  }

  // Project methods
  async findProjectByOrderId(orderId: string): Promise<Project | null> {
    return this.projects.find(p => p.orderId === orderId) || null;
  }

  async createProject(orderId: string, projectName: string): Promise<Project> {
    const newProject: Project = {
      id: this.generateId(),
      orderId,
      projectName,
      overallStatus: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.push(newProject);
    return newProject;
  }

  async updateProjectStatus(id: string, status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'): Promise<Project | null> {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.projects[index] = {
      ...this.projects[index],
      overallStatus: status,
      updatedAt: new Date()
    };
    return this.projects[index];
  }

  async findProjectById(id: string): Promise<Project | null> {
    return this.projects.find(p => p.id === id) || null;
  }

  // Status Update methods
  async createStatusUpdate(statusUpdateData: {
    projectId: string;
    updatedBy: string;
    statusType: 'ORDER' | 'PICKUP' | 'DELIVERY' | 'CHECK';
    statusValue: string;
    additionalData?: Record<string, any>;
  }): Promise<StatusUpdate> {
    const newStatusUpdate: StatusUpdate = {
      id: this.generateId(),
      projectId: statusUpdateData.projectId,
      updatedBy: statusUpdateData.updatedBy,
      statusType: statusUpdateData.statusType,
      statusValue: statusUpdateData.statusValue,
      additionalData: statusUpdateData.additionalData,
      createdAt: new Date()
    };
    this.statusUpdates.push(newStatusUpdate);
    this.hasUnsavedChanges = true;
    
    // 立即保存狀態更新（重要數據）
    this.saveToFile();
    
    return newStatusUpdate;
  }

  async getStatusUpdatesByProject(projectId: string): Promise<StatusUpdate[]> {
    return this.statusUpdates.filter(su => su.projectId === projectId);
  }

  // 持久化功能 - 在 Render 上使用 /tmp 目錄（臨時解決方案）
  private dataFilePath = process.env.NODE_ENV === 'production' 
    ? path.join('/tmp', 'memory-db.json')
    : path.join(process.cwd(), 'data', 'memory-db.json');

  private ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  saveToFile() {
    try {
      this.ensureDataDirectory();
      const data = {
        users: this.users,
        materials: this.materials,
        orders: this.orders,
        orderItems: this.orderItems, // 添加 orderItems 到持久化數據
        projects: this.projects,
        statusUpdates: this.statusUpdates,
        messages: this.messages, // 添加 messages 到持久化數據
        nextId: this.nextId, // 保存 nextId 以避免 ID 衝突
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2));
      this.hasUnsavedChanges = false;
      console.log('Memory database saved to file');
    } catch (error) {
      console.error('Failed to save memory database:', error);
    }
  }

  loadFromFile() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.dataFilePath, 'utf8'));
        
        // 載入所有數據，包括用戶數據
        if (data.users) this.users = data.users;
        if (data.materials) this.materials = data.materials;
        if (data.orders) this.orders = data.orders;
        if (data.orderItems) this.orderItems = data.orderItems; // 加載 orderItems
        if (data.projects) this.projects = data.projects;
        if (data.statusUpdates) this.statusUpdates = data.statusUpdates;
        if (data.messages) this.messages = data.messages; // 加載 messages
        if (data.nextId) this.nextId = data.nextId; // 恢復 nextId
        
        // 更新nextId以避免ID衝突
        this.updateNextId();
        
        console.log('Memory database loaded from file');
        console.log(`Loaded: ${this.users.length} users, ${this.orders.length} orders, ${this.orderItems.length} order items, ${this.statusUpdates.length} status updates, ${this.messages.length} messages`);
      } else {
        console.log('No existing database file found, using default data');
        // 在 Render 上文件可能會被清除，確保基本數據存在
        this.ensureBasicData();
      }
    } catch (error) {
      console.error('Failed to load memory database:', error);
      // 如果載入失敗，確保基本數據存在
      this.ensureBasicData();
    }
  }

  // 確保基本數據存在（用於 Render 等臨時文件系統）
  private ensureBasicData() {
    // 確保至少有基本的用戶數據
    if (this.users.length === 0) {
      console.log('Restoring default users...');
      // 用戶數據已在構造函數中初始化
    }
    
    // 確保有一些基本的材料數據
    if (this.materials.length === 0) {
      console.log('Restoring basic materials...');
      // 材料數據已在構造函數中初始化
    }
    
    console.log(`Ensured basic data: ${this.users.length} users, ${this.materials.length} materials`);
  }

  // 自動保存功能
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private hasUnsavedChanges: boolean = false;

  startAutoSave(intervalMs: number = 300000) { // 每5分鐘自動保存，減少頻率
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = setInterval(() => {
      if (this.hasUnsavedChanges) {
        this.saveToFile();
        this.hasUnsavedChanges = false;
      }
    }, intervalMs);
    console.log(`Auto-save started with ${intervalMs}ms interval`);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('Auto-save stopped');
    }
  }

  // 留言系統方法
  async createMessage(messageData: {
    fromUserId: string;
    fromUsername: string;
    toUserId: string;
    toUsername: string;
    content: string;
    isRead: boolean;
  }): Promise<Message> {
    // 刪除該用戶的所有舊留言（只保留一條最新的）
    this.messages = this.messages.filter(msg => msg.toUserId !== messageData.toUserId);
    
    const newMessage: Message = {
      id: this.generateId(),
      fromUserId: messageData.fromUserId,
      fromUsername: messageData.fromUsername,
      toUserId: messageData.toUserId,
      toUsername: messageData.toUsername,
      content: messageData.content,
      isRead: messageData.isRead,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.messages.push(newMessage);
    this.hasUnsavedChanges = true;
    
    // 立即保存重要數據
    this.saveToFile();
    
    return newMessage;
  }

  async getUnreadMessages(userId: string): Promise<Message[]> {
    return this.messages
      .filter(msg => msg.toUserId === userId && !msg.isRead)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<boolean> {
    const messageIndex = this.messages.findIndex(msg => 
      msg.id === messageId && msg.toUserId === userId
    );
    
    if (messageIndex === -1) return false;

    this.messages[messageIndex] = {
      ...this.messages[messageIndex],
      isRead: true,
      updatedAt: new Date()
    };
    
    this.hasUnsavedChanges = true;
    this.saveToFile();
    
    return true;
  }

  async getLatestMessage(userId: string): Promise<Message | null> {
    // 獲取該用戶的所有留言，按創建時間降序排列
    const userMessages = this.messages
      .filter(msg => msg.toUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return userMessages.length > 0 ? userMessages[0] : null;
  }

  async deleteMessage(messageId: string, fromUserId: string): Promise<boolean> {
    const messageIndex = this.messages.findIndex(msg => 
      msg.id === messageId && msg.fromUserId === fromUserId
    );
    
    if (messageIndex === -1) return false;

    this.messages.splice(messageIndex, 1);
    this.hasUnsavedChanges = true;
    this.saveToFile();
    
    return true;
  }

  async deleteAllMessagesForUser(toUserId: string): Promise<boolean> {
    const originalLength = this.messages.length;
    this.messages = this.messages.filter(msg => msg.toUserId !== toUserId);
    
    if (this.messages.length !== originalLength) {
      this.hasUnsavedChanges = true;
      this.saveToFile();
      return true;
    }
    
    return false;
  }

  async getAllMessages(userId?: string): Promise<Message[]> {
    if (userId) {
      return this.messages.filter(msg => msg.toUserId === userId || msg.fromUserId === userId);
    }
    return [...this.messages];
  }
}

// 單例實例
export const memoryDb = new MemoryDatabase();

// 啟動時加載數據
memoryDb.loadFromFile();

// 啟動自動保存（縮短間隔以防止數據丟失）
if (process.env.NODE_ENV === 'development') {
  memoryDb.startAutoSave(30000); // 開發環境每30秒保存一次
} else {
  memoryDb.startAutoSave(60000); // 生產環境每1分鐘保存一次（Render 重啟頻繁）
}

// 優雅關閉處理 - 確保在服務關閉時保存數據
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, saving database before shutdown...');
  memoryDb.saveToFile();
  memoryDb.stopAutoSave();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, saving database before shutdown...');
  memoryDb.saveToFile();
  memoryDb.stopAutoSave();
  process.exit(0);
});

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  memoryDb.saveToFile();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  memoryDb.saveToFile();
});

// 進程退出時保存數據
process.on('SIGINT', () => {
  console.log('Saving memory database before exit...');
  memoryDb.saveToFile();
  memoryDb.stopAutoSave();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Saving memory database before exit...');
  memoryDb.saveToFile();
  memoryDb.stopAutoSave();
  process.exit(0);
});