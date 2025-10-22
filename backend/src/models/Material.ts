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
  // Convert database entity to model
  private static entityToModel(entity: MaterialEntity): Material {
    return {
      id: entity.id,
      name: entity.name,
      category: entity.category,
      price: parseFloat(entity.price.toString()),
      quantity: entity.quantity,
      imageUrl: entity.image_url,
      supplier: entity.supplier,
      type: entity.type as MaterialType,
      createdAt: new Date(entity.created_at),
      updatedAt: new Date(entity.updated_at)
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
      } catch (pgError) {
        console.error('PostgreSQL query failed:', pgError);
        return null;
      }
    }
  }

  // Find all materials with filtering and pagination
  static async findAll(
    filters: { type?: MaterialType; category?: string } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ materials: Material[], total: number }> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.getAllMaterials(filters, page, limit);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      try {
        let whereClause = '';
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (filters.type) {
          whereClause += `WHERE type = $${paramIndex}`;
          queryParams.push(filters.type);
          paramIndex++;
        }

        if (filters.category) {
          whereClause += whereClause ? ` AND category = $${paramIndex}` : `WHERE category = $${paramIndex}`;
          queryParams.push(filters.category);
          paramIndex++;
        }

        // Count total
        const countQuery = `SELECT COUNT(*) FROM materials ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].count);

        // Get paginated results
        const offset = (page - 1) * limit;
        const query = `
          SELECT * FROM materials 
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const result = await pool.query(query, [...queryParams, limit, offset]);
        const materials = result.rows.map(row => this.entityToModel(row));

        return { materials, total };
      } catch (pgError) {
        console.error('PostgreSQL query failed:', pgError);
        return { materials: [], total: 0 };
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

    if (Object.keys(value).length === 0) {
      throw new Error('No fields to update');
    }

    try {
      // 使用記憶體資料庫
      return await memoryDb.updateMaterial(id, value);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      const fields = Object.keys(value);
      const values = Object.values(value);
      
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
      } catch (pgError) {
        console.error('PostgreSQL update failed:', pgError);
        return null;
      }
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

  // Update material quantity
  static async updateQuantity(id: string, quantity: number): Promise<Material | null> {
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

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

  // Get all categories
  static async getCategories(type?: MaterialType): Promise<string[]> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.getCategories(type);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      let query = 'SELECT DISTINCT category FROM materials';
      const params: any[] = [];
      
      if (type) {
        query += ' WHERE type = $1';
        params.push(type);
      }
      
      query += ' ORDER BY category';
      
      try {
        const result = await pool.query(query, params);
        return result.rows.map(row => row.category);
      } catch (pgError) {
        console.error('PostgreSQL query failed:', pgError);
        return [];
      }
    }
  }
}