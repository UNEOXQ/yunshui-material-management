import { pool } from '../config/database';
import { memoryDb } from '../config/memory-database';
import { Project, ProjectEntity, ProjectStatus } from '../types';
import Joi from 'joi';

// Helper function to validate UUID or memory database ID format
const isValidId = (id: string): boolean => {
  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // Memory database ID format (e.g., user-1, project-1, material-1)
  const memoryIdRegex = /^(user|project|material|order|item|id)-\d+$/;
  // Demo user ID format (e.g., demo-warehouse001, demo-admin)
  const demoIdRegex = /^demo-\w+$/;
  
  return uuidRegex.test(id) || memoryIdRegex.test(id) || demoIdRegex.test(id);
};

// Validation schemas
export const createProjectSchema = Joi.object({
  orderId: Joi.string()
    .custom((value, helpers) => {
      if (!isValidId(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'any.invalid': 'Order ID must be a valid UUID or memory database ID',
      'any.required': 'Order ID is required'
    }),
  projectName: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Project name cannot be empty',
      'string.max': 'Project name cannot exceed 255 characters',
      'any.required': 'Project name is required'
    })
});

export const updateProjectSchema = Joi.object({
  projectName: Joi.string()
    .min(1)
    .max(255)
    .messages({
      'string.min': 'Project name cannot be empty',
      'string.max': 'Project name cannot exceed 255 characters'
    }),
  overallStatus: Joi.string()
    .valid('ACTIVE', 'COMPLETED', 'CANCELLED')
    .messages({
      'any.only': 'Status must be one of: ACTIVE, COMPLETED, CANCELLED'
    })
}).min(1);

export class ProjectModel {
  // Convert database entity to domain model
  private static entityToModel(entity: ProjectEntity): Project {
    return {
      id: entity.id,
      orderId: entity.order_id,
      projectName: entity.project_name,
      overallStatus: entity.overall_status,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    };
  }

  // Create a new project
  static async create(orderId: string, projectName: string): Promise<Project> {
    // Validate input
    const { error } = createProjectSchema.validate({ orderId, projectName });
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    try {
      // 嘗試使用內存數據庫
      return await memoryDb.createProject(orderId, projectName);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // Fallback to PostgreSQL
      const query = `
        INSERT INTO projects (order_id, project_name, overall_status)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      try {
        const result = await pool.query(query, [orderId, projectName, 'ACTIVE']);
        return this.entityToModel(result.rows[0]);
      } catch (error: any) {
        if (error.code === '23505' && error.constraint === 'idx_projects_order_unique') {
          throw new Error('A project already exists for this order');
        }
        if (error.code === '23503') { // Foreign key violation
          throw new Error('Order not found');
        }
        throw error;
      }
    }
  }

  // Find project by ID
  static async findById(id: string): Promise<Project | null> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.findProjectById(id);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      try {
        const query = 'SELECT * FROM projects WHERE id = $1';
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

  // Find project by order ID
  static async findByOrderId(orderId: string): Promise<Project | null> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.findProjectByOrderId(orderId);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      try {
        const query = 'SELECT * FROM projects WHERE order_id = $1';
        const result = await pool.query(query, [orderId]);
        
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

  // Get all projects with filtering and pagination
  static async findAll(
    filters: {
      status?: ProjectStatus;
      userId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ projects: Project[], total: number }> {
    const offset = (page - 1) * limit;
    
    // Build WHERE clause dynamically
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`p.overall_status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.userId) {
      conditions.push(`o.user_id = $${paramIndex++}`);
      values.push(filters.userId);
    }

    if (filters.dateFrom) {
      conditions.push(`p.created_at >= $${paramIndex++}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`p.created_at <= $${paramIndex++}`);
      values.push(filters.dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM projects p 
      JOIN orders o ON p.order_id = o.id 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT p.* 
      FROM projects p 
      JOIN orders o ON p.order_id = o.id 
      ${whereClause}
      ORDER BY p.created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(dataQuery, [...values, limit, offset])
    ]);
    
    return {
      projects: dataResult.rows.map((row: any) => this.entityToModel(row)),
      total: parseInt(countResult.rows[0].count)
    };
  }

  // Get projects by status
  static async findByStatus(status: ProjectStatus): Promise<Project[]> {
    const query = 'SELECT * FROM projects WHERE overall_status = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [status]);
    return result.rows.map((row: any) => this.entityToModel(row));
  }

  // Get active projects
  static async findActive(): Promise<Project[]> {
    return this.findByStatus('ACTIVE');
  }

  // Update project
  static async update(id: string, updateData: { projectName?: string; overallStatus?: ProjectStatus }): Promise<Project | null> {
    // Validate input
    const { error, value } = updateProjectSchema.validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const fields = Object.keys(value);
    const values = Object.values(value);
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Convert camelCase to snake_case for database fields
    const dbFields = fields.map(field => {
      switch (field) {
        case 'projectName':
          return 'project_name';
        case 'overallStatus':
          return 'overall_status';
        default:
          return field;
      }
    });

    // Build dynamic query
    const setClause = dbFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      UPDATE projects 
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

  // Update project status
  static async updateStatus(id: string, status: ProjectStatus): Promise<Project | null> {
    const validStatuses: ProjectStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    try {
      // 嘗試使用內存數據庫
      return await memoryDb.updateProjectStatus(id, status);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);
      
      // 回退到 PostgreSQL
      const query = `
        UPDATE projects 
        SET overall_status = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING *
      `;

      const result = await pool.query(query, [id, status]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.entityToModel(result.rows[0]);
    }
  }

  // Complete project
  static async complete(id: string): Promise<Project | null> {
    return this.updateStatus(id, 'COMPLETED');
  }

  // Cancel project
  static async cancel(id: string): Promise<Project | null> {
    return this.updateStatus(id, 'CANCELLED');
  }

  // Delete project
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM projects WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Check if project exists
  static async exists(id: string): Promise<boolean> {
    const query = 'SELECT 1 FROM projects WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Get project with order details
  static async findByIdWithOrder(id: string): Promise<(Project & { order: any }) | null> {
    const query = `
      SELECT 
        p.*,
        o.user_id,
        o.total_amount,
        o.status as order_status,
        o.created_at as order_created_at
      FROM projects p
      JOIN orders o ON p.order_id = o.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const project = this.entityToModel({
      id: row.id,
      order_id: row.order_id,
      project_name: row.project_name,
      overall_status: row.overall_status,
      created_at: row.created_at,
      updated_at: row.updated_at
    });

    const order = {
      id: row.order_id,
      userId: row.user_id,
      totalAmount: parseFloat(row.total_amount.toString()),
      status: row.order_status,
      createdAt: row.order_created_at
    };

    return { ...project, order };
  }

  // Get project statistics
  static async getStatistics(): Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN overall_status = 'ACTIVE' THEN 1 END) as active,
        COUNT(CASE WHEN overall_status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN overall_status = 'CANCELLED' THEN 1 END) as cancelled
      FROM projects
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    return {
      total: parseInt(stats.total),
      active: parseInt(stats.active),
      completed: parseInt(stats.completed),
      cancelled: parseInt(stats.cancelled)
    };
  }

  // Search projects by name
  static async searchByName(searchTerm: string, limit: number = 10): Promise<Project[]> {
    const query = `
      SELECT * FROM projects 
      WHERE project_name ILIKE $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;

    const result = await pool.query(query, [`%${searchTerm}%`, limit]);
    return result.rows.map((row: any) => this.entityToModel(row));
  }
}