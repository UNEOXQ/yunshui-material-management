import { Response } from 'express';
import { UserModel } from '../models/User';
import { AuthenticatedRequest, CreateUserRequest, UserRole } from '../types';
import Joi from 'joi';

// 驗證 ID 格式（支持 UUID 和內存數據庫格式）
function isValidId(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const memoryIdRegex = /^(user|material|order|project)-\w+$/i;
  return uuidRegex.test(id) || memoryIdRegex.test(id);
}

// Validation schemas
const createUserSchema = Joi.object({
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

const updateUserSchema = Joi.object({
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
    .min(6)
    .messages({
      'string.min': 'Password must be at least 6 characters long'
    })
}).min(1);

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid('PM', 'AM', 'WAREHOUSE', 'ADMIN').optional()
});

export class UserController {
  /**
   * Create a new user
   * POST /api/users
   */
  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user has admin privileges
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can create users'
        });
        return;
      }

      // Validate request body
      const { error, value } = createUserSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const userData: CreateUserRequest = value;

      // Create user
      const newUser = await UserModel.create(userData);

      // Remove password hash from response
      const { passwordHash, ...userResponse } = newUser;

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'User created successfully'
      });
    } catch (error: any) {
      console.error('Create user error:', error);

      if (error.message === 'Username already exists' || error.message === 'Email already exists') {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: error.message
        });
        return;
      }

      if (error.message.startsWith('Validation error:')) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.message.replace('Validation error: ', '')
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while creating the user'
      });
    }
  }

  /**
   * Get all users with pagination
   * GET /api/users
   */
  static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user has admin privileges
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can view all users'
        });
        return;
      }

      // Validate query parameters
      const { error, value } = paginationSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const { page, limit, role } = value;

      let result;
      if (role) {
        // Get users by role
        const users = await UserModel.findByRole(role as UserRole);
        result = {
          users: users,
          total: users.length
        };
      } else {
        // Get all users with pagination
        result = await UserModel.findAll(page, limit);
      }

      // Remove password hashes from response
      const usersWithoutPasswords = result.users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.status(200).json({
        success: true,
        data: {
          users: usersWithoutPasswords,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        },
        message: 'Users retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get users error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving users'
      });
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user has admin/warehouse privileges or is requesting their own data
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'WAREHOUSE' && req.user?.userId !== id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only access your own user data'
        });
        return;
      }

      // Validate ID format
      if (!isValidId(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'User ID must be a valid UUID or memory database ID'
        });
        return;
      }

      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'User not found'
        });
        return;
      }

      // Remove password hash from response
      const { passwordHash, ...userResponse } = user;

      res.status(200).json({
        success: true,
        data: userResponse,
        message: 'User retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get user by ID error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving the user'
      });
    }
  }

  /**
   * Get user role information
   * GET /api/users/:id/role
   */
  static async getUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: targetUserId } = req.params;
      const userRole = req.user!.role;

      // 驗證 ID 格式
      if (!isValidId(targetUserId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'User ID must be a valid UUID or memory database ID'
        });
        return;
      }

      // 檢查權限：只有管理員和倉管可以查看
      if (userRole !== 'ADMIN' && userRole !== 'WAREHOUSE') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators and warehouse staff can access user roles'
        });
        return;
      }

      const user = await UserModel.findById(targetUserId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'User not found'
        });
        return;
      }

      // 只返回基本的角色信息
      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        message: 'User role retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get user role error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve user role'
      });
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user has admin privileges or is updating their own data
      if (req.user?.role !== 'ADMIN' && req.user?.userId !== id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only update your own user data'
        });
        return;
      }

      // Validate ID format
      if (!isValidId(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'User ID must be a valid UUID or memory database ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      // Non-admin users cannot change their role
      if (req.user?.role !== 'ADMIN' && value.role) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can change user roles'
        });
        return;
      }

      const updateData = value;

      // Update user
      const updatedUser = await UserModel.update(id, updateData);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'User not found'
        });
        return;
      }

      // Remove password hash from response
      const { passwordHash, ...userResponse } = updatedUser;

      res.status(200).json({
        success: true,
        data: userResponse,
        message: 'User updated successfully'
      });
    } catch (error: any) {
      console.error('Update user error:', error);

      if (error.message === 'Username already exists' || error.message === 'Email already exists') {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: error.message
        });
        return;
      }

      if (error.message.startsWith('Validation error:')) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.message.replace('Validation error: ', '')
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while updating the user'
      });
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Only admins can delete users
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can delete users'
        });
        return;
      }

      // Prevent self-deletion
      if (req.user?.userId === id) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'You cannot delete your own account'
        });
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'User ID must be a valid UUID'
        });
        return;
      }

      // Check if user exists
      const userExists = await UserModel.exists(id);
      if (!userExists) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'User not found'
        });
        return;
      }

      // Delete user
      const deleted = await UserModel.delete(id);

      if (!deleted) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to delete user'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete user error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while deleting the user'
      });
    }
  }

  /**
   * Get users by role
   * GET /api/users/role/:role
   */
  static async getUsersByRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user has admin privileges
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can view users by role'
        });
        return;
      }

      const { role } = req.params;

      // Validate role
      const validRoles = ['PM', 'AM', 'WAREHOUSE', 'ADMIN'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          error: 'Invalid role',
          message: 'Role must be one of: PM, AM, WAREHOUSE, ADMIN'
        });
        return;
      }

      const users = await UserModel.findByRole(role as UserRole);

      // Remove password hashes from response
      const usersWithoutPasswords = users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.status(200).json({
        success: true,
        data: {
          users: usersWithoutPasswords,
          role: role,
          count: usersWithoutPasswords.length
        },
        message: `Users with role ${role} retrieved successfully`
      });
    } catch (error: any) {
      console.error('Get users by role error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving users by role'
      });
    }
  }
}