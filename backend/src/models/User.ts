import { pool } from '../config/database';
import { memoryDb } from '../config/memory-database';
import { User, UserEntity, UserRole, CreateUserRequest } from '../types';
import bcrypt from 'bcrypt';
import Joi from 'joi';

// Validation schemas
export const createUserSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  role: Joi.string()
    .valid('PM', 'AM', 'WAREHOUSE', 'ADMIN')
    .required()
    .messages({
      'any.only': 'Role must be one of: PM, AM, WAREHOUSE, ADMIN',
      'any.required': 'Role is required'
    })
});

export const updateUserSchema = Joi.object({
  username: Joi.string(),
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  role: Joi.string()
    .valid('PM', 'AM', 'WAREHOUSE', 'ADMIN')
    .messages({
      'any.only': 'Role must be one of: PM, AM, WAREHOUSE, ADMIN'
    }),
  password: Joi.string()
}).min(1);

export class UserModel {
  // Convert database entity to domain model
  private static entityToModel(entity: UserEntity): User {
    return {
      id: entity.id,
      username: entity.username,
      email: entity.email,
      passwordHash: entity.password_hash,
      role: entity.role,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    };
  }

  // Create a new user
  static async create(userData: CreateUserRequest): Promise<User> {
    // Validate input
    const { error, value } = createUserSchema.validate(userData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const { username, email, password, role } = value;

    try {
      // 嘗試使用內存數據庫
      // 檢查用戶名和郵箱是否已存在
      const existingUserByUsername = await memoryDb.getUserByUsername(username);
      if (existingUserByUsername) {
        throw new Error('Username already exists');
      }

      const existingUserByEmail = await memoryDb.getUserByEmail(email);
      if (existingUserByEmail) {
        throw new Error('Email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 創建用戶數據
      const newUserData = {
        username,
        email,
        passwordHash,
        role: role as UserRole
      };

      const newUser = await memoryDb.createUser(newUserData);
      return newUser;
    } catch (error: any) {
      console.warn('Memory database failed, trying PostgreSQL:', error);

      // 回退到 PostgreSQL
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      try {
        const result = await pool.query(query, [username, email, passwordHash, role]);
        return this.entityToModel(result.rows[0]);
      } catch (dbError: any) {
        if (dbError.code === '23505') { // Unique violation
          if (dbError.constraint === 'users_username_key') {
            throw new Error('Username already exists');
          }
          if (dbError.constraint === 'users_email_key') {
            throw new Error('Email already exists');
          }
        }
        throw dbError;
      }
    }
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.entityToModel(result.rows[0]);
  }

  // Find user by username
  static async findByUsername(username: string): Promise<User | null> {
    try {
      // 嘗試使用內存數據庫
      return await memoryDb.getUserByUsername(username);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);

      // 回退到 PostgreSQL
      try {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await pool.query(query, [username]);

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

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    try {
      // 嘗試使用內存數據庫
      const users = await memoryDb.getAllUsers();
      return users.find(u => u.email === email) || null;
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);

      // 回退到 PostgreSQL
      try {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);

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

  // Get all users with pagination
  static async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    try {
      // 嘗試使用內存數據庫
      const allUsers = await memoryDb.getAllUsers();
      const total = allUsers.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = allUsers.slice(startIndex, endIndex);

      return {
        users: paginatedUsers,
        total
      };
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);

      // 回退到 PostgreSQL
      const offset = (page - 1) * limit;

      const countQuery = 'SELECT COUNT(*) FROM users';
      const dataQuery = `
        SELECT * FROM users 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery),
        pool.query(dataQuery, [limit, offset])
      ]);

      return {
        users: dataResult.rows.map((row: any) => this.entityToModel(row)),
        total: parseInt(countResult.rows[0].count)
      };
    }
  }

  // Update user
  static async update(id: string, updateData: Partial<CreateUserRequest>): Promise<User | null> {
    // Validate input
    const { error, value } = updateUserSchema.validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Validate user ID format (should be UUID or memory DB ID)
    if (!this.isValidUUID(id)) {
      throw new Error('User ID must be a valid UUID');
    }

    // Process password if provided
    const processedData = { ...value };
    if (processedData.password) {
      processedData.passwordHash = await bcrypt.hash(processedData.password, 12);
      delete processedData.password;
    }

    try {
      // 嘗試使用內存數據庫
      const user = await memoryDb.updateUser(id, processedData);
      return user;
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);

      // 回退到 PostgreSQL
      const fields = Object.keys(processedData);
      const values = Object.values(processedData);

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      // Build dynamic query with proper parameter placeholders
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const query = `
        UPDATE users 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING *
      `;

      try {
        const result = await pool.query(query, [id, ...values]);

        if (result.rows.length === 0) {
          return null;
        }

        return this.entityToModel(result.rows[0]);
      } catch (error: any) {
        if (error.code === '23505') { // Unique violation
          if (error.constraint === 'users_username_key') {
            throw new Error('Username already exists');
          }
          if (error.constraint === 'users_email_key') {
            throw new Error('Email already exists');
          }
        }
        throw error;
      }
    }
  }

  // Delete user
  static async delete(id: string): Promise<boolean> {
    // Validate user ID format (should be UUID or memory DB ID)
    if (!this.isValidUUID(id)) {
      throw new Error('User ID must be a valid UUID');
    }

    try {
      // 嘗試使用內存數據庫
      return await memoryDb.deleteUser(id);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);

      // 回退到 PostgreSQL
      const query = 'DELETE FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    }
  }

  // Verify password
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  // Get users by role
  static async findByRole(role: UserRole): Promise<User[]> {
    const query = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [role]);
    return result.rows.map((row: any) => this.entityToModel(row));
  }

  // Check if user exists
  static async exists(id: string): Promise<boolean> {
    // Validate user ID format (should be UUID or memory DB ID)
    if (!this.isValidUUID(id)) {
      throw new Error('User ID must be a valid UUID');
    }

    try {
      // 嘗試使用內存數據庫
      const users = await memoryDb.getAllUsers();
      return users.some(u => u.id === id);
    } catch (error) {
      console.warn('Memory database failed, trying PostgreSQL:', error);

      // 回退到 PostgreSQL
      const query = 'SELECT 1 FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    }
  }

  // Helper method to validate UUID format (also accepts memory database IDs)
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const memoryDbIdRegex = /^(user|material|order|item)-\d+$/; // 內存數據庫 ID 格式
    return uuidRegex.test(uuid) || memoryDbIdRegex.test(uuid);
  }
}