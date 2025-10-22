import { Response } from 'express';
import { MaterialModel } from '../models/Material';
import { AuthenticatedRequest, CreateMaterialRequest, UpdateMaterialRequest, MaterialType } from '../types';
import Joi from 'joi';

// 驗�? ID ?��??��??�函??
function isValidId(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const memoryIdRegex = /^(material|user|order|project)-\w+$/i;
  const simpleMemoryIdRegex = /^id-\d+$/i; // ?��? id-2000 ?��?
  
  return uuidRegex.test(id) || memoryIdRegex.test(id) || simpleMemoryIdRegex.test(id);
}

// Validation schemas
const createMaterialSchema = Joi.object({
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
    .optional()
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

const updateMaterialSchema = Joi.object({
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
  type: Joi.string()
    .valid('AUXILIARY', 'FINISHED')
    .messages({
      'any.only': 'Type must be either AUXILIARY or FINISHED'
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
    })
}).min(1);

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string().valid('AUXILIARY', 'FINISHED').optional(),
  category: Joi.string().max(100).optional(),
  supplier: Joi.string().max(255).optional(),
  search: Joi.string().max(255).optional()
});

export class MaterialController {
  /**
   * Create a new material
   * POST /api/materials
   */
  static async createMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user has admin privileges
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can create materials'
        });
        return;
      }

      // Validate request body
      const { error, value } = createMaterialSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const materialData: CreateMaterialRequest = value;

      // Create material
      const newMaterial = await MaterialModel.create(materialData);

      res.status(201).json({
        success: true,
        data: newMaterial,
        message: 'Material created successfully'
      });
    } catch (error: any) {
      console.error('Create material error:', error);

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
        message: 'An error occurred while creating the material'
      });
    }
  }

  /**
   * Get all materials with filtering and pagination
   * GET /api/materials
   */
  static async getMaterials(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = querySchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const { page, limit, type, category, supplier, search } = value;

      // Build filters object
      const filters: any = {};
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (supplier) filters.supplier = supplier;
      if (search) filters.search = search;

      // Get materials with pagination
      const result = await MaterialModel.findAll(filters, page, limit);

      res.status(200).json({
        success: true,
        data: {
          materials: result.materials,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        },
        message: 'Materials retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get materials error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving materials'
      });
    }
  }

  /**
   * Get material by ID
   * GET /api/materials/:id
   */
  static async getMaterialById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!isValidId(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Material ID must be a valid UUID or memory database ID'
        });
        return;
      }

      const material = await MaterialModel.findById(id);

      if (!material) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Material not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: material,
        message: 'Material retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get material by ID error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving the material'
      });
    }
  }

  /**
   * Update material
   * PUT /api/materials/:id
   */
  static async updateMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user has admin privileges
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can update materials'
        });
        return;
      }

      // Validate ID format
      if (!isValidId(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Material ID must be a valid UUID or memory database ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateMaterialSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const updateData: UpdateMaterialRequest = value;

      // Update material
      const updatedMaterial = await MaterialModel.update(id, updateData);

      if (!updatedMaterial) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Material not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedMaterial,
        message: 'Material updated successfully'
      });
    } catch (error: any) {
      console.error('Update material error:', error);

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
        message: 'An error occurred while updating the material'
      });
    }
  }

  /**
   * Delete material
   * DELETE /api/materials/:id
   */
  static async deleteMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user has admin privileges
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators can delete materials'
        });
        return;
      }

      // Validate ID format
      if (!isValidId(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Material ID must be a valid UUID or memory database ID'
        });
        return;
      }

      // Check if material exists
      const materialExists = await MaterialModel.exists(id);
      if (!materialExists) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Material not found'
        });
        return;
      }

      // Delete material
      const deleted = await MaterialModel.delete(id);

      if (!deleted) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to delete material'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Material deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete material error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while deleting the material'
      });
    }
  }

  /**
   * Get materials by type
   * GET /api/materials/type/:type
   */
  static async getMaterialsByType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params;

      // Validate type
      const validTypes = ['AUXILIARY', 'FINISHED'];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Invalid type',
          message: 'Type must be either AUXILIARY or FINISHED'
        });
        return;
      }

      const materials = await MaterialModel.findByType(type as MaterialType);

      res.status(200).json({
        success: true,
        data: {
          materials,
          type,
          count: materials.length
        },
        message: `Materials of type ${type} retrieved successfully`
      });
    } catch (error: any) {
      console.error('Get materials by type error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving materials by type'
      });
    }
  }

  /**
   * Get materials by category
   * GET /api/materials/category/:category
   */
  static async getMaterialsByCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category } = req.params;

      if (!category || category.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid category',
          message: 'Category cannot be empty'
        });
        return;
      }

      const materials = await MaterialModel.findByCategory(category);

      res.status(200).json({
        success: true,
        data: {
          materials,
          category,
          count: materials.length
        },
        message: `Materials in category ${category} retrieved successfully`
      });
    } catch (error: any) {
      console.error('Get materials by category error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving materials by category'
      });
    }
  }

  /**
   * Get all categories
   * GET /api/materials/categories
   */
  static async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type } = req.query;

      // Validate type if provided
      if (type && !['AUXILIARY', 'FINISHED'].includes(type as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid type',
          message: 'Type must be either AUXILIARY or FINISHED'
        });
        return;
      }

      const categories = await MaterialModel.getCategories(type as MaterialType);

      res.status(200).json({
        success: true,
        data: {
          categories,
          type: type || 'all',
          count: categories.length
        },
        message: 'Categories retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get categories error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving categories'
      });
    }
  }

  /**
   * Get all suppliers
   * GET /api/materials/suppliers
   */
  static async getSuppliers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type } = req.query;

      // Validate type if provided
      if (type && !['AUXILIARY', 'FINISHED'].includes(type as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid type',
          message: 'Type must be either AUXILIARY or FINISHED'
        });
        return;
      }

      const suppliers = await MaterialModel.getSuppliers(type as MaterialType);

      res.status(200).json({
        success: true,
        data: {
          suppliers,
          type: type || 'all',
          count: suppliers.length
        },
        message: 'Suppliers retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get suppliers error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving suppliers'
      });
    }
  }

  /**
   * Update material quantity
   * PATCH /api/materials/:id/quantity
   */
  static async updateQuantity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      // Check if user has warehouse or admin privileges
      if (!['WAREHOUSE', 'ADMIN'].includes(req.user?.role || '')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only warehouse managers and administrators can update material quantities'
        });
        return;
      }

      // Validate ID format
      if (!isValidId(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Material ID must be a valid UUID or memory database ID'
        });
        return;
      }

      // Validate quantity
      if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
        res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be a non-negative integer'
        });
        return;
      }

      // Update quantity
      const updatedMaterial = await MaterialModel.updateQuantity(id, quantity);

      if (!updatedMaterial) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Material not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedMaterial,
        message: 'Material quantity updated successfully'
      });
    } catch (error: any) {
      console.error('Update quantity error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while updating the material quantity'
      });
    }
  }
}
