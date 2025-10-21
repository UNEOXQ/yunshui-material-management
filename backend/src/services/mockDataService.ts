/**
 * 模擬資料服務 - 用於在沒有資料庫的情況下運行系統
 */

export interface MockUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'pm' | 'am' | 'warehouse';
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockMaterial {
  id: string;
  name: string;
  category: string;
  type: 'auxiliary' | 'finished';
  unit: string;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
  supplier_id?: string;
  description?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockOrder {
  id: string;
  user_id: string;
  project_id: string;
  type: 'auxiliary' | 'finished';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  total_amount: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

class MockDataService {
  private users: MockUser[] = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@yunshui.com',
      role: 'admin',
      name: '系統管理員',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: '2',
      username: 'pm001',
      email: 'pm001@yunshui.com',
      role: 'pm',
      name: '專案經理王小明',
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02')
    },
    {
      id: '3',
      username: 'am001',
      email: 'am001@yunshui.com',
      role: 'am',
      name: '區域經理李小華',
      created_at: new Date('2024-01-03'),
      updated_at: new Date('2024-01-03')
    },
    {
      id: '4',
      username: 'warehouse001',
      email: 'warehouse001@yunshui.com',
      role: 'warehouse',
      name: '倉庫管理員張小強',
      created_at: new Date('2024-01-04'),
      updated_at: new Date('2024-01-04')
    }
  ];

  private materials: MockMaterial[] = [
    {
      id: '1',
      name: '水泥',
      category: '建材',
      type: 'auxiliary',
      unit: '包',
      price: 150,
      stock_quantity: 500,
      min_stock_level: 100,
      description: '高品質水泥，適用於各種建築工程',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: '2',
      name: '鋼筋',
      category: '建材',
      type: 'auxiliary',
      unit: '根',
      price: 80,
      stock_quantity: 1000,
      min_stock_level: 200,
      description: '標準建築用鋼筋',
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02')
    },
    {
      id: '3',
      name: '預製樑',
      category: '預製構件',
      type: 'finished',
      unit: '支',
      price: 2500,
      stock_quantity: 50,
      min_stock_level: 10,
      description: '預製混凝土樑，規格標準',
      created_at: new Date('2024-01-03'),
      updated_at: new Date('2024-01-03')
    },
    {
      id: '4',
      name: '預製柱',
      category: '預製構件',
      type: 'finished',
      unit: '支',
      price: 3200,
      stock_quantity: 30,
      min_stock_level: 5,
      description: '預製混凝土柱，高強度',
      created_at: new Date('2024-01-04'),
      updated_at: new Date('2024-01-04')
    }
  ];

  private orders: MockOrder[] = [
    {
      id: '1',
      user_id: '2',
      project_id: 'proj001',
      type: 'auxiliary',
      status: 'pending',
      total_amount: 15000,
      notes: '急需材料，請優先處理',
      created_at: new Date('2024-01-10'),
      updated_at: new Date('2024-01-10')
    },
    {
      id: '2',
      user_id: '3',
      project_id: 'proj002',
      type: 'finished',
      status: 'approved',
      total_amount: 50000,
      notes: '預製構件訂單',
      created_at: new Date('2024-01-11'),
      updated_at: new Date('2024-01-12')
    }
  ];

  // 用戶相關方法
  async getUsers(): Promise<MockUser[]> {
    return [...this.users];
  }

  async getUserById(id: string): Promise<MockUser | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<MockUser | null> {
    return this.users.find(user => user.username === username) || null;
  }

  async createUser(userData: Omit<MockUser, 'id' | 'created_at' | 'updated_at'>): Promise<MockUser> {
    const newUser: MockUser = {
      ...userData,
      id: (this.users.length + 1).toString(),
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, userData: Partial<MockUser>): Promise<MockUser | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updated_at: new Date()
    };
    return this.users[userIndex];
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
  }

  // 材料相關方法
  async getMaterials(): Promise<MockMaterial[]> {
    return [...this.materials];
  }

  async getMaterialById(id: string): Promise<MockMaterial | null> {
    return this.materials.find(material => material.id === id) || null;
  }

  async getMaterialsByType(type: 'auxiliary' | 'finished'): Promise<MockMaterial[]> {
    return this.materials.filter(material => material.type === type);
  }

  async createMaterial(materialData: Omit<MockMaterial, 'id' | 'created_at' | 'updated_at'>): Promise<MockMaterial> {
    const newMaterial: MockMaterial = {
      ...materialData,
      id: (this.materials.length + 1).toString(),
      created_at: new Date(),
      updated_at: new Date()
    };
    this.materials.push(newMaterial);
    return newMaterial;
  }

  async updateMaterial(id: string, materialData: Partial<MockMaterial>): Promise<MockMaterial | null> {
    const materialIndex = this.materials.findIndex(material => material.id === id);
    if (materialIndex === -1) return null;

    this.materials[materialIndex] = {
      ...this.materials[materialIndex],
      ...materialData,
      updated_at: new Date()
    };
    return this.materials[materialIndex];
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const materialIndex = this.materials.findIndex(material => material.id === id);
    if (materialIndex === -1) return false;

    this.materials.splice(materialIndex, 1);
    return true;
  }

  // 訂單相關方法
  async getOrders(): Promise<MockOrder[]> {
    return [...this.orders];
  }

  async getOrderById(id: string): Promise<MockOrder | null> {
    return this.orders.find(order => order.id === id) || null;
  }

  async getOrdersByUserId(userId: string): Promise<MockOrder[]> {
    return this.orders.filter(order => order.user_id === userId);
  }

  async getOrdersByType(type: 'auxiliary' | 'finished'): Promise<MockOrder[]> {
    return this.orders.filter(order => order.type === type);
  }

  async createOrder(orderData: Omit<MockOrder, 'id' | 'created_at' | 'updated_at'>): Promise<MockOrder> {
    const newOrder: MockOrder = {
      ...orderData,
      id: (this.orders.length + 1).toString(),
      created_at: new Date(),
      updated_at: new Date()
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  async updateOrder(id: string, orderData: Partial<MockOrder>): Promise<MockOrder | null> {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex === -1) return null;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      ...orderData,
      updated_at: new Date()
    };
    return this.orders[orderIndex];
  }

  async deleteOrder(id: string): Promise<boolean> {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex === -1) return false;

    this.orders.splice(orderIndex, 1);
    return true;
  }

  // 統計方法
  async getStats() {
    return {
      totalUsers: this.users.length,
      totalMaterials: this.materials.length,
      totalOrders: this.orders.length,
      auxiliaryMaterials: this.materials.filter(m => m.type === 'auxiliary').length,
      finishedMaterials: this.materials.filter(m => m.type === 'finished').length,
      pendingOrders: this.orders.filter(o => o.status === 'pending').length,
      approvedOrders: this.orders.filter(o => o.status === 'approved').length,
      completedOrders: this.orders.filter(o => o.status === 'completed').length
    };
  }
}

export const mockDataService = new MockDataService();