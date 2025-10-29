import * as SQLite from 'expo-sqlite';
import { Material, Order, OrderMaterial, OfflineAction } from '../types';

export interface CachedData {
  materials: Material[];
  orders: Order[];
  lastSync: number;
  version: string;
}

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static readonly DB_NAME = 'yunshui_offline.db';
  private static readonly DB_VERSION = 1;

  static async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTablesSQL = `
      -- 基材表
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        specification TEXT,
        unit TEXT,
        price REAL,
        stock INTEGER,
        imageUrl TEXT,
        description TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        isDeleted INTEGER DEFAULT 0,
        lastModified INTEGER DEFAULT (strftime('%s', 'now'))
      );

      -- 訂單表
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        orderNumber TEXT NOT NULL,
        customerName TEXT,
        status TEXT,
        totalAmount REAL,
        createdAt TEXT,
        updatedAt TEXT,
        isDeleted INTEGER DEFAULT 0,
        lastModified INTEGER DEFAULT (strftime('%s', 'now'))
      );

      -- 訂單基材關聯表
      CREATE TABLE IF NOT EXISTS order_materials (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        materialId TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders (id),
        FOREIGN KEY (materialId) REFERENCES materials (id)
      );

      -- 離線操作記錄表
      CREATE TABLE IF NOT EXISTS offline_actions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        entity TEXT NOT NULL,
        entityId TEXT,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        retryCount INTEGER DEFAULT 0,
        lastError TEXT
      );

      -- 同步狀態表
      CREATE TABLE IF NOT EXISTS sync_status (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
      );

      -- 創建索引
      CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
      CREATE INDEX IF NOT EXISTS idx_materials_lastModified ON materials(lastModified);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_lastModified ON orders(lastModified);
      CREATE INDEX IF NOT EXISTS idx_offline_actions_synced ON offline_actions(synced);
      CREATE INDEX IF NOT EXISTS idx_offline_actions_timestamp ON offline_actions(timestamp);
    `;

    await this.db.execAsync(createTablesSQL);
  }

  // 基材相關操作
  static async saveMaterials(materials: Material[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const insertSQL = `
      INSERT OR REPLACE INTO materials 
      (id, name, category, specification, unit, price, stock, imageUrl, description, createdAt, updatedAt, lastModified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const material of materials) {
      await this.db.runAsync(insertSQL, [
        material.id,
        material.name,
        material.category || '',
        material.specification || '',
        material.unit || '',
        material.price || 0,
        material.stock || 0,
        material.imageUrl || '',
        material.description || '',
        material.createdAt,
        material.updatedAt,
        Date.now()
      ]);
    }
  }

  static async getMaterials(): Promise<Material[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM materials WHERE isDeleted = 0 ORDER BY lastModified DESC'
    );

    return result.map(row => ({
      id: row.id as string,
      name: row.name as string,
      category: row.category as string,
      specification: row.specification as string,
      unit: row.unit as string,
      price: row.price as number,
      stock: row.stock as number,
      imageUrl: row.imageUrl as string,
      description: row.description as string,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));
  }

  static async getMaterialById(id: string): Promise<Material | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM materials WHERE id = ? AND isDeleted = 0',
      [id]
    );

    if (!result) return null;

    return {
      id: result.id as string,
      name: result.name as string,
      category: result.category as string,
      specification: result.specification as string,
      unit: result.unit as string,
      price: result.price as number,
      stock: result.stock as number,
      imageUrl: result.imageUrl as string,
      description: result.description as string,
      createdAt: result.createdAt as string,
      updatedAt: result.updatedAt as string,
    };
  }

  // 訂單相關操作
  static async saveOrders(orders: Order[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const insertOrderSQL = `
      INSERT OR REPLACE INTO orders 
      (id, orderNumber, customerName, status, totalAmount, createdAt, updatedAt, lastModified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertOrderMaterialSQL = `
      INSERT OR REPLACE INTO order_materials 
      (id, orderId, materialId, quantity, unitPrice, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const order of orders) {
      // 保存訂單
      await this.db.runAsync(insertOrderSQL, [
        order.id,
        order.orderNumber,
        order.customerName || '',
        order.status,
        order.totalAmount || 0,
        order.createdAt,
        order.updatedAt,
        Date.now()
      ]);

      // 刪除舊的訂單基材關聯
      await this.db.runAsync('DELETE FROM order_materials WHERE orderId = ?', [order.id]);

      // 保存訂單基材關聯
      if (order.materials && order.materials.length > 0) {
        for (const orderMaterial of order.materials) {
          const id = `${order.id}_${orderMaterial.materialId}`;
          await this.db.runAsync(insertOrderMaterialSQL, [
            id,
            order.id,
            orderMaterial.materialId,
            orderMaterial.quantity,
            orderMaterial.unitPrice,
            orderMaterial.subtotal
          ]);
        }
      }
    }
  }

  static async getOrders(): Promise<Order[]> {
    if (!this.db) throw new Error('Database not initialized');

    const ordersResult = await this.db.getAllAsync(
      'SELECT * FROM orders WHERE isDeleted = 0 ORDER BY lastModified DESC'
    );

    const orders: Order[] = [];

    for (const orderRow of ordersResult) {
      // 獲取訂單基材
      const materialsResult = await this.db.getAllAsync(`
        SELECT om.*, m.name, m.category, m.specification, m.unit, m.imageUrl, m.description
        FROM order_materials om
        LEFT JOIN materials m ON om.materialId = m.id
        WHERE om.orderId = ?
      `, [orderRow.id]);

      const materials: OrderMaterial[] = materialsResult.map(row => ({
        materialId: row.materialId as string,
        material: {
          id: row.materialId as string,
          name: row.name as string,
          category: row.category as string,
          specification: row.specification as string,
          unit: row.unit as string,
          price: row.unitPrice as number,
          stock: 0,
          imageUrl: row.imageUrl as string,
          description: row.description as string,
          createdAt: '',
          updatedAt: '',
        },
        quantity: row.quantity as number,
        unitPrice: row.unitPrice as number,
        subtotal: row.subtotal as number,
      }));

      orders.push({
        id: orderRow.id as string,
        orderNumber: orderRow.orderNumber as string,
        customerName: orderRow.customerName as string,
        materials,
        status: orderRow.status as string,
        totalAmount: orderRow.totalAmount as number,
        createdAt: orderRow.createdAt as string,
        updatedAt: orderRow.updatedAt as string,
      });
    }

    return orders;
  }

  static async getOrderById(id: string): Promise<Order | null> {
    if (!this.db) throw new Error('Database not initialized');

    const orderResult = await this.db.getFirstAsync(
      'SELECT * FROM orders WHERE id = ? AND isDeleted = 0',
      [id]
    );

    if (!orderResult) return null;

    // 獲取訂單基材
    const materialsResult = await this.db.getAllAsync(`
      SELECT om.*, m.name, m.category, m.specification, m.unit, m.imageUrl, m.description
      FROM order_materials om
      LEFT JOIN materials m ON om.materialId = m.id
      WHERE om.orderId = ?
    `, [id]);

    const materials: OrderMaterial[] = materialsResult.map(row => ({
      materialId: row.materialId as string,
      material: {
        id: row.materialId as string,
        name: row.name as string,
        category: row.category as string,
        specification: row.specification as string,
        unit: row.unit as string,
        price: row.unitPrice as number,
        stock: 0,
        imageUrl: row.imageUrl as string,
        description: row.description as string,
        createdAt: '',
        updatedAt: '',
      },
      quantity: row.quantity as number,
      unitPrice: row.unitPrice as number,
      subtotal: row.subtotal as number,
    }));

    return {
      id: orderResult.id as string,
      orderNumber: orderResult.orderNumber as string,
      customerName: orderResult.customerName as string,
      materials,
      status: orderResult.status as string,
      totalAmount: orderResult.totalAmount as number,
      createdAt: orderResult.createdAt as string,
      updatedAt: orderResult.updatedAt as string,
    };
  }

  // 離線操作記錄
  static async saveOfflineAction(action: OfflineAction): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const insertSQL = `
      INSERT INTO offline_actions 
      (id, type, entity, entityId, data, timestamp, synced, retryCount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(insertSQL, [
      action.id,
      action.type,
      action.entity,
      action.entityId || '',
      JSON.stringify(action.data),
      action.timestamp,
      action.synced ? 1 : 0,
      action.retryCount || 0
    ]);
  }

  static async getOfflineActions(): Promise<OfflineAction[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM offline_actions ORDER BY timestamp ASC'
    );

    return result.map(row => ({
      id: row.id as string,
      type: row.type as 'CREATE' | 'UPDATE' | 'DELETE',
      entity: row.entity as 'MATERIAL' | 'ORDER',
      entityId: row.entityId as string,
      data: JSON.parse(row.data as string),
      timestamp: row.timestamp as number,
      synced: (row.synced as number) === 1,
      retryCount: row.retryCount as number,
      lastError: row.lastError as string,
    }));
  }

  static async getUnsyncedActions(): Promise<OfflineAction[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM offline_actions WHERE synced = 0 ORDER BY timestamp ASC'
    );

    return result.map(row => ({
      id: row.id as string,
      type: row.type as 'CREATE' | 'UPDATE' | 'DELETE',
      entity: row.entity as 'MATERIAL' | 'ORDER',
      entityId: row.entityId as string,
      data: JSON.parse(row.data as string),
      timestamp: row.timestamp as number,
      synced: false,
      retryCount: row.retryCount as number,
      lastError: row.lastError as string,
    }));
  }

  static async markActionAsSynced(actionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE offline_actions SET synced = 1 WHERE id = ?',
      [actionId]
    );
  }

  static async updateActionError(actionId: string, error: string, retryCount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE offline_actions SET lastError = ?, retryCount = ? WHERE id = ?',
      [error, retryCount, actionId]
    );
  }

  static async deleteAction(actionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'DELETE FROM offline_actions WHERE id = ?',
      [actionId]
    );
  }

  // 同步狀態管理
  static async setSyncStatus(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'INSERT OR REPLACE INTO sync_status (key, value, updatedAt) VALUES (?, ?, ?)',
      [key, value, Date.now()]
    );
  }

  static async getSyncStatus(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT value FROM sync_status WHERE key = ?',
      [key]
    );

    return result ? result.value as string : null;
  }

  static async getLastSyncTime(): Promise<number> {
    const lastSync = await this.getSyncStatus('lastSyncTime');
    return lastSync ? parseInt(lastSync, 10) : 0;
  }

  static async setLastSyncTime(timestamp: number): Promise<void> {
    await this.setSyncStatus('lastSyncTime', timestamp.toString());
  }

  // 數據清理
  static async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const clearSQL = `
      DELETE FROM materials;
      DELETE FROM orders;
      DELETE FROM order_materials;
      DELETE FROM offline_actions;
      DELETE FROM sync_status;
    `;

    await this.db.execAsync(clearSQL);
  }

  static async clearSyncedActions(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM offline_actions WHERE synced = 1');
  }

  // 數據庫維護
  static async vacuum(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execAsync('VACUUM');
  }

  static async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}