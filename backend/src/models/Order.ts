import { pool } from '../config/database';
import { memoryDb } from '../config/memory-database';
import { Order, OrderEntity, OrderItem, OrderItemEntity, OrderStatus } from '../types';
import Joi from 'joi';

// Validation schemas
export const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        materialId: Joi.string()
          .uuid()
          .required()
          .messages({
            'string.uuid': 'Material ID must be a valid UUID',
            'any.required': 'Material ID is required'
          }),
        quantity: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.integer': 'Quantity must be an integer',
            'number.positive': 'Quantity must be positive',
            'any.required': 'Quantity is required'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Order must contain at least one item',
      'any.required': 'Order items are required'
    })
});

export class OrderModel {
  // Convert database entity to domain model
  private static entityToModel(entity: OrderEntity): Order {
    return {
      id: entity.id,
      userId: entity.user_id,
      totalAmount: parseFloat(entity.total_amount.toString()),
      status: entity.status,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    };
  }

  private static orderItemEntityToModel(entity: OrderItemEntity): OrderItem {
    return {
      id: entity.id,
      orderId: entity.order_id,
      materialId: entity.material_id,
      quantity: entity.quantity,
      unitPrice: parseFloat(entity.unit_price.toString())
    };
  }

  // Create a new order with items
  static async create(orderData: { userId: string; totalAmount: number; items: Array<{ materialId: string; quantity: number; unitPrice: number; supplier?: string }> }): Promise<Order> {
    // No validation needed here as it's done in the controller

    const { userId, totalAmount, items } = orderData;

    try {
      // 嘗試使用內存數據庫
      const order = await memoryDb.createOrder({
        userId,
        totalAmount,
        status: 'PENDING'
      });

      // Create order items in memory database
      for (const item of items) {
        await memoryDb.createOrderItem({
          orderId: order.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });
      }

      return order;
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // Fallback to PostgreSQL
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Create order
        const orderQuery = `
          INSERT INTO orders (user_id, total_amount, status)
          VALUES ($1, $2, $3)
          RETURNING *
        `;

        const orderResult = await client.query(orderQuery, [userId, totalAmount, 'PENDING']);
        const order = this.entityToModel(orderResult.rows[0]);

        // Create order items
        for (const item of items) {
          const itemQuery = `
            INSERT INTO order_items (order_id, material_id, quantity, unit_price)
            VALUES ($1, $2, $3, $4)
          `;

          await client.query(itemQuery, [
            order.id,
            item.materialId,
            item.quantity,
            item.unitPrice
          ]);
        }

        await client.query('COMMIT');
        return order;

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }

  // Find order by ID
  static async findById(id: string): Promise<Order | null> {
    const query = 'SELECT * FROM orders WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.entityToModel(result.rows[0]);
  }

  // Get order with items
  static async findByIdWithItems(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
    const orderQuery = 'SELECT * FROM orders WHERE id = $1';
    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
    
    const [orderResult, itemsResult] = await Promise.all([
      pool.query(orderQuery, [id]),
      pool.query(itemsQuery, [id])
    ]);
    
    if (orderResult.rows.length === 0) {
      return null;
    }
    
    const order = this.entityToModel(orderResult.rows[0]);
    const items = itemsResult.rows.map((row: any) => this.orderItemEntityToModel(row));
    
    return { ...order, items };
  }



  // Get all orders with filtering and pagination
  static async findAll(
    filters: {
      status?: OrderStatus;
      userId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: Order[], total: number }> {
    const offset = (page - 1) * limit;
    
    // Build WHERE clause dynamically
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      values.push(filters.userId);
    }

    if (filters.dateFrom) {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(filters.dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) FROM orders ${whereClause}`;
    const dataQuery = `
      SELECT * FROM orders 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(dataQuery, [...values, limit, offset])
    ]);
    
    return {
      orders: dataResult.rows.map((row: any) => this.entityToModel(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  // Update order status
  static async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const validStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const query = `
      UPDATE orders 
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;

    const result = await pool.query(query, [id, status]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.entityToModel(result.rows[0]);
  }

  // Cancel order and restore material quantities
  static async cancel(id: string): Promise<Order | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get order with items
      const orderWithItems = await this.findByIdWithItems(id);
      if (!orderWithItems) {
        return null;
      }

      if (orderWithItems.status === 'CANCELLED') {
        throw new Error('Order is already cancelled');
      }

      if (orderWithItems.status === 'COMPLETED') {
        throw new Error('Cannot cancel completed order');
      }

      // Restore material quantities
      for (const item of orderWithItems.items) {
        await client.query(
          'UPDATE materials SET quantity = quantity + $1 WHERE id = $2',
          [item.quantity, item.materialId]
        );
      }

      // Update order status
      const updateQuery = `
        UPDATE orders 
        SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING *
      `;

      const result = await client.query(updateQuery, [id]);
      
      await client.query('COMMIT');
      return this.entityToModel(result.rows[0]);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete order (only if pending)
  static async delete(id: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check order status
      const order = await this.findById(id);
      if (!order) {
        return false;
      }

      if (order.status !== 'PENDING') {
        throw new Error('Can only delete pending orders');
      }

      // Get order items to restore quantities
      const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
      const itemsResult = await client.query(itemsQuery, [id]);

      // Restore material quantities
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE materials SET quantity = quantity + $1 WHERE id = $2',
          [item.quantity, item.material_id]
        );
      }

      // Delete order (cascade will delete items)
      const deleteQuery = 'DELETE FROM orders WHERE id = $1';
      const result = await client.query(deleteQuery, [id]);

      await client.query('COMMIT');
      return (result.rowCount ?? 0) > 0;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Check if order exists
  static async exists(id: string): Promise<boolean> {
    const query = 'SELECT 1 FROM orders WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Get order statistics
  static async getStatistics(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    completed: number;
    cancelled: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled
      FROM orders
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    return {
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      confirmed: parseInt(stats.confirmed),
      processing: parseInt(stats.processing),
      completed: parseInt(stats.completed),
      cancelled: parseInt(stats.cancelled)
    };
  }

  // Get order items by order ID
  static async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const query = 'SELECT * FROM order_items WHERE order_id = $1';
    const result = await pool.query(query, [orderId]);
    return result.rows.map((row: any) => this.orderItemEntityToModel(row));
  }

  // Get order items with material details including supplier information
  static async getOrderItemsWithMaterialDetails(orderId: string): Promise<Array<OrderItem & { 
    materialName: string; 
    materialCategory: string; 
    materialType: string; 
    supplier?: string; 
    imageUrl?: string; 
  }>> {
    try {
      // 嘗試使用內存數據庫
      const orderItems = await memoryDb.getOrderItems(orderId);
      const result = [];
      
      for (const item of orderItems) {
        const material = await memoryDb.getMaterialById(item.materialId);
        if (material) {
          result.push({
            id: item.id,
            orderId: item.orderId,
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            materialName: material.name,
            materialCategory: material.category,
            materialType: material.type as string,
            supplier: material.supplier || undefined,
            imageUrl: material.imageUrl || undefined
          });
        }
      }
      
      return result as Array<OrderItem & { 
        materialName: string; 
        materialCategory: string; 
        materialType: string; 
        supplier?: string; 
        imageUrl?: string; 
      }>;
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // Fallback to PostgreSQL
      const query = `
        SELECT 
          oi.*,
          m.name as material_name,
          m.category as material_category,
          m.type as material_type,
          m.supplier,
          m.image_url
        FROM order_items oi
        JOIN materials m ON oi.material_id = m.id
        WHERE oi.order_id = $1
        ORDER BY oi.id
      `;
      
      const result = await pool.query(query, [orderId]);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        orderId: row.order_id,
        materialId: row.material_id,
        quantity: row.quantity,
        unitPrice: parseFloat(row.unit_price.toString()),
        materialName: row.material_name,
        materialCategory: row.material_category,
        materialType: row.material_type,
        supplier: row.supplier,
        imageUrl: row.image_url
      }));
    }
  }

  // Get orders by user ID with filters
  static async findByUserId(
    userId: string,
    filters: { status?: OrderStatus } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: Order[], total: number }> {
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const conditions = ['user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    const countQuery = `SELECT COUNT(*) FROM orders ${whereClause}`;
    const dataQuery = `
      SELECT * FROM orders 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(dataQuery, [...values, limit, offset])
    ]);
    
    return {
      orders: dataResult.rows.map((row: any) => this.entityToModel(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  // Get orders by user ID with filters using memory database
  static async findByUserIdMemory(
    userId: string,
    filters: { status?: OrderStatus } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: Order[], total: number }> {
    try {
      // 使用內存數據庫
      const allOrders = await memoryDb.getAllOrders();
      let userOrders = allOrders.filter(order => order.userId === userId);
      
      // Apply status filter if provided
      if (filters.status) {
        userOrders = userOrders.filter(order => order.status === filters.status);
      }
      
      // Sort by creation date (newest first)
      userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Apply pagination
      const total = userOrders.length;
      const offset = (page - 1) * limit;
      const paginatedOrders = userOrders.slice(offset, offset + limit);
      
      return {
        orders: paginatedOrders,
        total
      };
    } catch (error) {
      console.error('Memory database error:', error);
      return { orders: [], total: 0 };
    }
  }
}