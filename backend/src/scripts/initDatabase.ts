import { pool } from '../config/database';
import { memoryDb } from '../config/memory-database';

// 資料庫表格創建 SQL
const createTablesSQL = `
-- 用戶表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'PM', 'AM', 'WAREHOUSE')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 材料表
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    supplier VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('AUXILIARY', 'FINISHED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 訂單表
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 訂單項目表
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    material_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- 專案表
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    overall_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 狀態更新表
CREATE TABLE IF NOT EXISTS status_updates (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    status_type VARCHAR(50) NOT NULL CHECK (status_type IN ('ORDER', 'PICKUP', 'DELIVERY', 'CHECK')),
    status_value TEXT NOT NULL,
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 留言表
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    from_user_id VARCHAR(255) NOT NULL,
    from_username VARCHAR(255) NOT NULL,
    to_user_id VARCHAR(255) NOT NULL,
    to_username VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_projects_order_id ON projects(order_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_project_id ON status_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
`;

// 遷移記憶體資料庫資料到 PostgreSQL
export async function migrateMemoryDataToPostgreSQL(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating database tables...');
    await client.query(createTablesSQL);
    
    console.log('Migrating users...');
    const users = await memoryDb.getAllUsers();
    for (const user of users) {
      await client.query(
        `INSERT INTO users (id, username, email, role, password_hash, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO UPDATE SET 
         username = EXCLUDED.username,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         password_hash = EXCLUDED.password_hash,
         updated_at = EXCLUDED.updated_at`,
        [user.id, user.username, user.email, user.role, user.passwordHash, user.createdAt, user.updatedAt]
      );
    }
    
    console.log('Migrating materials...');
    const materialsResult = await memoryDb.getAllMaterials({}, 1, 1000);
    for (const material of materialsResult.materials) {
      await client.query(
        `INSERT INTO materials (id, name, category, price, quantity, image_url, supplier, type, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         price = EXCLUDED.price,
         quantity = EXCLUDED.quantity,
         image_url = EXCLUDED.image_url,
         supplier = EXCLUDED.supplier,
         type = EXCLUDED.type,
         updated_at = EXCLUDED.updated_at`,
        [material.id, material.name, material.category, material.price, material.quantity, 
         material.imageUrl, material.supplier, material.type, material.createdAt, material.updatedAt]
      );
    }
    
    console.log('Migrating orders...');
    const ordersResult = await memoryDb.findAllOrders({}, 1, 1000);
    for (const order of ordersResult.orders) {
      await client.query(
        `INSERT INTO orders (id, user_id, name, status, total_amount, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO UPDATE SET 
         user_id = EXCLUDED.user_id,
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         total_amount = EXCLUDED.total_amount,
         updated_at = EXCLUDED.updated_at`,
        [order.id, order.userId, order.name || null, order.status, order.totalAmount, order.createdAt, order.updatedAt]
      );
      
      // 遷移訂單項目
      if (order.items) {
        for (const item of order.items) {
          await client.query(
            `INSERT INTO order_items (id, order_id, material_id, quantity, unit_price) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (id) DO UPDATE SET 
             order_id = EXCLUDED.order_id,
             material_id = EXCLUDED.material_id,
             quantity = EXCLUDED.quantity,
             unit_price = EXCLUDED.unit_price`,
            [item.id, item.orderId, item.materialId, item.quantity, item.unitPrice]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('Database migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 初始化資料庫
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');
    
    // 測試連接
    const client = await pool.connect();
    console.log('PostgreSQL connection successful');
    client.release();
    
    // 執行遷移
    await migrateMemoryDataToPostgreSQL();
    
    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}