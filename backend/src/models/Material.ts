import { pool } from '../config/database';
import { memoryDb } from '../config/memory-database';
import { Material, MaterialEntity, MaterialType, CreateMaterialRequest, UpdateMaterialRequest } from '../types';
import Joi from 'joi';

// Validation schemas
export const createMaterialSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Material name cannot be empty',
      'string.max': 'Material name cannot exceed 255 characters',
      'any.required': 'Material name is required'
    }),
  category: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Category cannot be empty',
      'string.max': 'Category cannot exceed 100 characters',
      'any.required': 'Category is required'
    }),
  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Price must be a positive number',
      'number.precision': 'Price cannot have more than 2 decimal places',
      'any.required': 'Price is required'
    }),
  quantity: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity cannot be negative',
      'any.required': 'Quantity is required'
    }),
  supplier: Joi.string()
    .max(255)
    .allow('')
    .messages({
      'string.max': 'Supplier name cannot exceed 255 characters'
    }),
  type: Joi.string()
    .valid('AUXILIARY', 'FINISHED')
    .required()
    .messages({
      'any.only': 'Type must be either AUXILIARY or FINISHED',
      'any.required': 'Type is required'
    })
});

export const updateMaterialSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .messages({
      'string.min': 'Material name cannot be empty',
      'string.max': 'Material name cannot exceed 255 characters'
    }),
  category: Joi.string()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Category cannot be empty',
      'string.max': 'Category cannot exceed 100 characters'
    }),
  price: Joi.number()
    .positive()
    .precision(2)
    .messages({
      'number.positive': 'Price must be a positive number',
      'number.precision': 'Price cannot have more than 2 decimal places'
    }),
  quantity: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity cannot be negative'
    }),
  supplier: Joi.string()
    .max(255)
    .allow('')
    .messages({
      'string.max': 'Supplier name cannot exceed 255 characters'
    }),
  type: Joi.string()
    .valid('AUXILIARY', 'FINISHED')
    .messages({
      'any.only': 'Type must be either AUXILIARY or FINISHED'
    })
}).min(1);

export class MaterialModel {
  // Convert database entity to domain model
  private static entityToModel(entity: MaterialEntity): Material {
    return {
      id: entity.id,
      name: entity.name,
      category: entity.category,
      price: parseFloat(entity.price.toString()),
      quantity: entity.quantity,
      imageUrl: entity.image_url || '',
      supplier: entity.supplier || undefined,
      type: entity.type,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    };
  }

  // Create a new material
  static async create(materialData: CreateMaterialRequest): Promise<Material> {
    // Validate input
    const { error, value } = createMaterialSchema.validate(materialData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const { name, category, price, quantity, supplier, type } = value;

    try {
      // 使用記憶體資料庫
      const newMaterial = await memoryDb.createMaterial({
        name,
        category,
        price,
        quantity,
        supplier: supplier || '',
        type,
        imageUrl: ''
      });
      
      return newMaterial;
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      const query = `
        INSERT INTO materials (name, category, price, quantity, supplier, type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await pool.query(query, [name, category, price, quantity, supplier || null, type]);
      return this.entityToModel(result.rows[0]);
    }
  }

  // Find material by ID
  static async findById(id: string): Promise<Material | null> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.getMaterialById(id);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      try {
        const query = 'SELECT * FROM materials WHERE id = $1';
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return this.entityToModel(result.rows[0]);
      } catch (dbError) {
        console.error('PostgreSQL also failed:', dbError);
        return null;
      }
    }
  }

  // Get all materials with filtering and pagination
  static async findAll(
    filters: {
      type?: MaterialType;
      category?: string;
      supplier?: string;
      search?: string;
    } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ materials: Material[], total: number }> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.getAllMaterials(filters, page, limit);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
    }
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause dynamically
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(filters.type);
    }

    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      values.push(filters.category);
    }

    if (filters.supplier) {
      conditions.push(`supplier = $${paramIndex++}`);
      values.push(filters.supplier);
    }

    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIndex++} OR category ILIKE $${paramIndex++})`);
      values.push(`%${filters.search}%`, `%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) FROM materials ${whereClause}`;
    const dataQuery = `
      SELECT * FROM materials 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(dataQuery, [...values, limit, offset])
    ]);
    
    return {
      materials: dataResult.rows.map((row: any) => this.entityToModel(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  // Get materials by type
  static async findByType(type: MaterialType): Promise<Material[]> {
    const query = 'SELECT * FROM materials WHERE type = $1 ORDER BY category, name';
    const result = await pool.query(query, [type]);
    return result.rows.map((row: any) => this.entityToModel(row));
  }

  // Get materials by category
  static async findByCategory(category: string): Promise<Material[]> {
    const query = 'SELECT * FROM materials WHERE category = $1 ORDER BY name';
    const result = await pool.query(query, [category]);
    return result.rows.map((row: any) => this.entityToModel(row));
  }

  // Get unique categories
  static async getCategories(type?: MaterialType): Promise<string[]> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.getCategories(type);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      try {
        let query = 'SELECT DISTINCT category FROM materials';
        const values: any[] = [];
        
        if (type) {
          query += ' WHERE type = $1';
          values.push(type);
        }
        
        query += ' ORDER BY category';
        
        const result = await pool.query(query, values);
        return result.rows.map((row: any) => row.category);
      } catch (dbError) {
        console.error('PostgreSQL also failed:', dbError);
        return [];
      }
    }
  }

  // Get unique suppliers
  static async getSuppliers(type?: MaterialType): Promise<string[]> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.getSuppliers(type);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      try {
        let query = 'SELECT DISTINCT supplier FROM materials WHERE supplier IS NOT NULL';
        const values: any[] = [];
        
        if (type) {
          query += ' AND type = $1';
          values.push(type);
        }
        
        query += ' ORDER BY supplier';
        
        const result = await pool.query(query, values);
        return result.rows.map((row: any) => row.supplier);
      } catch (dbError) {
        console.error('PostgreSQL also failed:', dbError);
        return [];
      }
    }
  }

  // Update material
  static async update(id: string, updateData: UpdateMaterialRequest): Promise<Material | null> {
    // Validate input
    const { error, value } = updateMaterialSchema.validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const fields = Object.keys(value);
    const values = Object.values(value);
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Build dynamic query
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      UPDATE materials 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;

    const result = await pool.query(query, [id, ...values]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.entityToModel(result.rows[0]);
  }

  // Update material image URL
  static async updateImageUrl(id: string, imageUrl: string): Promise<Material | null> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.updateMaterialImageUrl(id, imageUrl);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      try {
        const query = `
          UPDATE materials 
          SET image_url = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 
          RETURNING *
        `;

        const result = await pool.query(query, [id, imageUrl]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return this.entityToModel(result.rows[0]);
      } catch (dbError) {
        console.error('PostgreSQL also failed:', dbError);
        return null;
      }
    }
  }

  // Update material quantity
  static async updateQuantity(id: string, quantity: number): Promise<Material | null> {
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    try {
      // 嘗試使用內存數據庫
      return await memoryDb.updateMaterial(id, { quantity });
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // Fallback to PostgreSQL
      const query = `
        UPDATE materials 
        SET quantity = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING *
      `;

      const result = await pool.query(query, [id, quantity]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.entityToModel(result.rows[0]);
    }
  }

  // Delete material
  static async delete(id: string): Promise<boolean> {
    try {
      // 使用記憶體資料庫
      return await memoryDb.deleteMaterial(id);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      const query = 'DELETE FROM materials WHERE id = $1';
      const result = await pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    }
  }

  // Check if material exists
  static async exists(id: string): Promise<boolean> {
    try {
      // 使用記憶體資料庫
      const material = await memoryDb.getMaterialById(id);
      return material !== null;
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      const query = 'SELECT 1 FROM materials WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    }
  }

  // Check if material has sufficient quantity
  static async hasQuantity(id: string, requiredQuantity: number): Promise<boolean> {
    const query = 'SELECT quantity FROM materials WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return result.rows[0].quantity >= requiredQuantity;
  }
}