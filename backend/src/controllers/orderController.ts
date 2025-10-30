import { Response } from 'express';
import { OrderModel } from '../models/Order';
import { MaterialModel } from '../models/Material';
import { ProjectModel } from '../models/Project';
import { StatusUpdateModel } from '../models/StatusUpdate';
import { AuthenticatedRequest, CreateOrderRequest, Order, OrderItem } from '../types';
import { memoryDb } from '../config/memory-database';
import Joi from 'joi';

// Validation schemas
const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        materialId: Joi.string()
          .custom((value, helpers) => {
            // UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            // Memory database ID format
            const memoryIdRegex = /^(user|project|material|order|item|id)-\d+$/;
            // Demo user ID format
            const demoIdRegex = /^demo-\w+$/;
            
            if (!uuidRegex.test(value) && !memoryIdRegex.test(value) && !demoIdRegex.test(value)) {
              return helpers.error('any.invalid');
            }
            return value;
          })
          .required()
          .messages({
            'any.invalid': 'Material ID must be a valid UUID or memory database ID',
            'any.required': 'Material ID is required'
          }),
        quantity: Joi.number()
          .integer()
          .min(1)
          .required()
          .messages({
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Items are required'
    }),
  projectId: Joi.string().optional().allow(''),
  newProjectName: Joi.string().optional().allow('')
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED').optional()
});

export class OrderController {
  /**
   * Create a new auxiliary material order (PM only)
   * POST /api/orders/auxiliary
   */
  static async createAuxiliaryOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user!.role;
      
      // Only PM users and ADMIN can create auxiliary material orders
      if (userRole !== 'PM' && userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only PM users and administrators can create auxiliary material orders'
        });
        return;
      }

      // Validate request body
      const { error, value } = createOrderSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const orderData: CreateOrderRequest = value;
      const userId = req.user!.userId;

      // Validate materials and ensure they are auxiliary materials
      let totalAmount = 0;
      const validatedItems: Array<{ materialId: string; quantity: number; unitPrice: number }> = [];

      for (const item of orderData.items) {
        const material = await MaterialModel.findById(item.materialId);
        
        if (!material) {
          res.status(400).json({
            success: false,
            error: 'Invalid material',
            message: `Material with ID ${item.materialId} not found`
          });
          return;
        }

        // Ensure material is auxiliary type
        if (material.type !== 'AUXILIARY') {
          res.status(400).json({
            success: false,
            error: 'Invalid material type',
            message: `Material ${material.name} is not an auxiliary material. PM users can only order auxiliary materials.`
          });
          return;
        }

        // Check if material has sufficient quantity
        if (material.quantity < item.quantity) {
          res.status(400).json({
            success: false,
            error: 'Insufficient stock',
            message: `Insufficient stock for material ${material.name}. Available: ${material.quantity}, Requested: ${item.quantity}`
          });
          return;
        }

        validatedItems.push({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: material.price
        });

        totalAmount += material.price * item.quantity;
      }

      // Create order
      const newOrder = await OrderModel.create({
        userId,
        totalAmount,
        items: validatedItems
      });

      // Update material quantities
      for (const item of validatedItems) {
        const material = await MaterialModel.findById(item.materialId);
        if (material) {
          await MaterialModel.updateQuantity(item.materialId, material.quantity - item.quantity);
        }
      }

      // Create project for auxiliary material order (requirement 2.4)
      const projectName = `輔材專案-${new Date().toISOString().split('T')[0]}-${newOrder.id.substring(0, 8)}`;
      const project = await ProjectModel.create(newOrder.id, projectName);

      // Initialize four status columns (requirement 2.5)
      // 只有叫貨狀態預設為 PENDING，其他狀態為空白以避免覆蓋問題
      const statusInitializations = [
        { statusType: 'ORDER' as const, statusValue: 'PENDING' },
        { statusType: 'PICKUP' as const, statusValue: '' },
        { statusType: 'DELIVERY' as const, statusValue: '' },
        { statusType: 'CHECK' as const, statusValue: '' }
      ];

      for (const statusInit of statusInitializations) {
        await StatusUpdateModel.create({
          projectId: project.id,
          updatedBy: userId,
          statusType: statusInit.statusType,
          statusValue: statusInit.statusValue
        });
      }

      res.status(201).json({
        success: true,
        data: {
          order: newOrder,
          project: project,
          message: 'Auxiliary material order created successfully with project and status initialization'
        }
      });
    } catch (error: any) {
      console.error('Create auxiliary order error:', error);

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
        message: 'An error occurred while creating the auxiliary material order'
      });
    }
  }

  /**
   * Create a new finished material order (AM only)
   * POST /api/orders/finished
   */
  static async createFinishedOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user!.role;
      
      // Only AM users and ADMIN can create finished material orders
      if (userRole !== 'AM' && userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only AM users and administrators can create finished material orders'
        });
        return;
      }

      // Validate request body
      const { error, value } = createOrderSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const orderData: CreateOrderRequest = value;
      const userId = req.user!.userId;

      // Validate materials and ensure they are finished materials
      let totalAmount = 0;
      const validatedItems: Array<{ materialId: string; quantity: number; unitPrice: number; supplier?: string }> = [];

      for (const item of orderData.items) {
        const material = await MaterialModel.findById(item.materialId);
        
        if (!material) {
          res.status(400).json({
            success: false,
            error: 'Invalid material',
            message: `Material with ID ${item.materialId} not found`
          });
          return;
        }

        // Ensure material is finished type
        if (material.type !== 'FINISHED') {
          res.status(400).json({
            success: false,
            error: 'Invalid material type',
            message: `Material ${material.name} is not a finished material. AM users can only order finished materials.`
          });
          return;
        }

        // Check if material has sufficient quantity
        if (material.quantity < item.quantity) {
          res.status(400).json({
            success: false,
            error: 'Insufficient stock',
            message: `Insufficient stock for material ${material.name}. Available: ${material.quantity}, Requested: ${item.quantity}`
          });
          return;
        }

        validatedItems.push({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: material.price,
          ...(material.supplier && { supplier: material.supplier }) // Include supplier information for finished materials
        });

        totalAmount += material.price * item.quantity;
      }

      // Create order
      const newOrder = await OrderModel.create({
        userId,
        totalAmount,
        items: validatedItems
      });

      // Update material quantities
      for (const item of validatedItems) {
        const material = await MaterialModel.findById(item.materialId);
        if (material) {
          await MaterialModel.updateQuantity(item.materialId, material.quantity - item.quantity);
        }
      }

      // Create project for finished material order (requirement 3.4)
      const projectName = `完成材專案-${new Date().toISOString().split('T')[0]}-${newOrder.id.substring(0, 8)}`;
      const project = await ProjectModel.create(newOrder.id, projectName);

      // Initialize four status columns (requirement 3.5)
      // 只有叫貨狀態預設為 PENDING，其他狀態為空白以避免覆蓋問題
      const statusInitializations = [
        { statusType: 'ORDER' as const, statusValue: 'PENDING' },
        { statusType: 'PICKUP' as const, statusValue: '' },
        { statusType: 'DELIVERY' as const, statusValue: '' },
        { statusType: 'CHECK' as const, statusValue: '' }
      ];

      for (const statusInit of statusInitializations) {
        await StatusUpdateModel.create({
          projectId: project.id,
          updatedBy: userId,
          statusType: statusInit.statusType,
          statusValue: statusInit.statusValue
        });
      }

      res.status(201).json({
        success: true,
        data: {
          order: newOrder,
          project: project,
          supplierInfo: validatedItems.map(item => ({
            materialId: item.materialId,
            supplier: item.supplier
          })),
          message: 'Finished material order created successfully with project and status initialization'
        }
      });
    } catch (error: any) {
      console.error('Create finished order error:', error);

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
        message: 'An error occurred while creating the finished material order'
      });
    }
  }

  /**
   * Create a new order
   * POST /api/orders
   */
  static async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createOrderSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const orderData: CreateOrderRequest = value;
      const userId = req.user!.userId;

      // Validate materials and calculate total
      let totalAmount = 0;
      const validatedItems: Array<{ materialId: string; quantity: number; unitPrice: number }> = [];

      for (const item of orderData.items) {
        const material = await MaterialModel.findById(item.materialId);
        
        if (!material) {
          res.status(400).json({
            success: false,
            error: 'Invalid material',
            message: `Material with ID ${item.materialId} not found`
          });
          return;
        }

        // Check if material has sufficient quantity
        if (material.quantity < item.quantity) {
          res.status(400).json({
            success: false,
            error: 'Insufficient stock',
            message: `Insufficient stock for material ${material.name}. Available: ${material.quantity}, Requested: ${item.quantity}`
          });
          return;
        }

        validatedItems.push({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: material.price
        });

        totalAmount += material.price * item.quantity;
      }

      // Create order
      const newOrder = await OrderModel.create({
        userId,
        totalAmount,
        items: validatedItems
      });

      // Update material quantities
      for (const item of validatedItems) {
        const material = await MaterialModel.findById(item.materialId);
        if (material) {
          await MaterialModel.updateQuantity(item.materialId, material.quantity - item.quantity);
        }
      }

      // Create project for the order
      const projectName = `專案-${new Date().toISOString().split('T')[0]}-${newOrder.id.substring(0, 8)}`;
      const project = await ProjectModel.create(newOrder.id, projectName);

      // Initialize four status columns
      // 只有叫貨狀態預設為 PENDING，其他狀態為空白以避免覆蓋問題
      const statusInitializations = [
        { statusType: 'ORDER' as const, statusValue: 'PENDING' },
        { statusType: 'PICKUP' as const, statusValue: '' },
        { statusType: 'DELIVERY' as const, statusValue: '' },
        { statusType: 'CHECK' as const, statusValue: '' }
      ];

      for (const statusInit of statusInitializations) {
        await StatusUpdateModel.create({
          projectId: project.id,
          updatedBy: userId,
          statusType: statusInit.statusType,
          statusValue: statusInit.statusValue
        });
      }

      res.status(201).json({
        success: true,
        data: newOrder,
        message: 'Order created successfully'
      });
    } catch (error: any) {
      console.error('Create order error:', error);

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
        message: 'An error occurred while creating the order'
      });
    }
  }

  /**
   * Get all orders with pagination
   * GET /api/orders
   */
  static async getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const { page, limit, status } = value;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      console.log(`Getting orders for user ${userId} (${userRole}), page ${page}, limit ${limit}`);

      let result;
      if (userRole === 'ADMIN' || userRole === 'WAREHOUSE') {
        // Admin and Warehouse can see all orders - use memory database directly
        result = await memoryDb.findAllOrders({ status }, page, limit);
      } else {
        // Other users can only see their own orders - use memory database directly
        result = await memoryDb.findOrdersByUserId(userId, { status }, page, limit);
      }

      // Convert OrderWithItems to Order format for API response
      const orders = result.orders.map(orderWithItems => ({
        id: orderWithItems.id,
        userId: orderWithItems.userId,
        totalAmount: orderWithItems.totalAmount,
        status: orderWithItems.status,
        name: orderWithItems.name,
        createdAt: orderWithItems.createdAt,
        updatedAt: orderWithItems.updatedAt,
        // Include items for mobile app compatibility
        items: orderWithItems.items?.map(item => ({
          materialId: item.materialId,
          materialName: item.materialName,
          quantity: item.quantity,
          price: item.unitPrice
        })) || []
      }));

      console.log(`Found ${orders.length} orders for user ${userId}`);

      res.status(200).json({
        success: true,
        data: {
          orders: orders,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        },
        message: 'Orders retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get orders error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving orders'
      });
    }
  }

  /**
   * Get order by ID
   * GET /api/orders/:id
   */
  static async getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Order ID must be a valid UUID'
        });
        return;
      }

      const order = await OrderModel.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Order not found'
        });
        return;
      }

      // Check if user has permission to view this order
      if (userRole !== 'ADMIN' && order.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only view your own orders'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get order by ID error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving the order'
      });
    }
  }

  /**
   * Confirm auxiliary material order and ensure project creation
   * PUT /api/orders/:id/confirm
   */
  static async confirmAuxiliaryOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Only PM users can confirm auxiliary material orders
      if (userRole !== 'PM') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only PM users can confirm auxiliary material orders'
        });
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Order ID must be a valid UUID'
        });
        return;
      }

      const order = await OrderModel.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Order not found'
        });
        return;
      }

      // Check if user owns this order
      if (order.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only confirm your own orders'
        });
        return;
      }

      // Check if order can be confirmed
      if (order.status !== 'PENDING') {
        res.status(400).json({
          success: false,
          error: 'Cannot confirm',
          message: 'Only pending orders can be confirmed'
        });
        return;
      }

      // Update order status to confirmed
      const confirmedOrder = await OrderModel.updateStatus(id, 'CONFIRMED');

      if (!confirmedOrder) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to confirm order'
        });
        return;
      }

      // Check if project already exists
      let project = await ProjectModel.findByOrderId(id);
      
      if (!project) {
        // Create project for auxiliary material order (requirement 2.4)
        const projectName = `輔材專案-${new Date().toISOString().split('T')[0]}-${id.substring(0, 8)}`;
        project = await ProjectModel.create(id, projectName);

        // Initialize four status columns (requirement 2.5)
        const statusInitializations = [
          { statusType: 'ORDER' as const, statusValue: 'PENDING' },
          { statusType: 'PICKUP' as const, statusValue: 'PENDING' },
          { statusType: 'DELIVERY' as const, statusValue: 'PENDING' },
          { statusType: 'CHECK' as const, statusValue: 'PENDING' }
        ];

        for (const statusInit of statusInitializations) {
          await StatusUpdateModel.create({
            projectId: project.id,
            updatedBy: userId,
            statusType: statusInit.statusType,
            statusValue: statusInit.statusValue
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          order: confirmedOrder,
          project: project
        },
        message: 'Auxiliary material order confirmed successfully'
      });
    } catch (error: any) {
      console.error('Confirm auxiliary order error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while confirming the auxiliary material order'
      });
    }
  }

  /**
   * Update order status
   * PUT /api/orders/:id/status
   */
  static async updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userRole = req.user!.role;

      // Only admin and warehouse staff can update order status
      if (!['ADMIN', 'WAREHOUSE'].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators and warehouse staff can update order status'
        });
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Order ID must be a valid UUID'
        });
        return;
      }

      // Validate status
      const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: 'Status must be one of: PENDING, CONFIRMED, PROCESSING, COMPLETED, CANCELLED'
        });
        return;
      }

      const updatedOrder = await OrderModel.updateStatus(id, status);

      if (!updatedOrder) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Order not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedOrder,
        message: 'Order status updated successfully'
      });
    } catch (error: any) {
      console.error('Update order status error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while updating the order status'
      });
    }
  }

  /**
   * Cancel order
   * DELETE /api/orders/:id
   */
  static async cancelOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Order ID must be a valid UUID'
        });
        return;
      }

      const order = await OrderModel.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Order not found'
        });
        return;
      }

      // Check if user has permission to cancel this order
      if (userRole !== 'ADMIN' && order.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only cancel your own orders'
        });
        return;
      }

      // Check if order can be cancelled
      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        res.status(400).json({
          success: false,
          error: 'Cannot cancel',
          message: 'Only pending or confirmed orders can be cancelled'
        });
        return;
      }

      // Cancel order
      const cancelledOrder = await OrderModel.updateStatus(id, 'CANCELLED');

      if (!cancelledOrder) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to cancel order'
        });
        return;
      }

      // Restore material quantities
      const orderItems = await OrderModel.getOrderItems(id);
      for (const item of orderItems) {
        const material = await MaterialModel.findById(item.materialId);
        if (material) {
          await MaterialModel.updateQuantity(item.materialId, material.quantity + item.quantity);
        }
      }

      res.status(200).json({
        success: true,
        data: cancelledOrder,
        message: 'Order cancelled successfully'
      });
    } catch (error: any) {
      console.error('Cancel order error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while cancelling the order'
      });
    }
  }

  /**
   * Get auxiliary material orders with project details (PM only)
   * GET /api/orders/auxiliary
   */
  static async getAuxiliaryOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user!.role;
      const userId = req.user!.userId;

      // Only PM, AM, ADMIN, and WAREHOUSE users can access auxiliary material orders
      if (!['PM', 'AM', 'ADMIN', 'WAREHOUSE'].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only PM, AM, ADMIN, and WAREHOUSE users can access auxiliary material orders'
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

      const { page, limit, status } = value;

      // Get orders based on user role
      let result;
      if (userRole === 'ADMIN' || userRole === 'WAREHOUSE') {
        // Admin and Warehouse users can see all auxiliary orders
        result = await memoryDb.findAllOrders({ status }, page, limit);
      } else {
        // PM users can only see their own orders
        result = await memoryDb.findOrdersByUserId(userId, { status }, page, limit);
      }

      // Add order items and status information to each order
      const ordersWithItems = await Promise.all(
        result.orders.map(async (order) => {
          const items = await memoryDb.getOrderItems(order.id);
          
          // Add material details to each item
          const itemsWithMaterials = await Promise.all(
            items.map(async (item) => {
              const material = await MaterialModel.findById(item.materialId);
              return {
                ...item,
                material
              };
            })
          );

          // Get project and status information
          const project = await memoryDb.findProjectByOrderId(order.id);
          let latestStatuses = {};
          let statusSummary = {
            order: '未設定',
            pickup: '未設定',
            delivery: '未設定',
            check: '未設定'
          };

          if (project) {
            const statusUpdates = await memoryDb.getStatusUpdatesByProject(project.id);
            
            // Get latest status for each type
            const statusMap: Record<string, any> = {
              ORDER: null,
              PICKUP: null,
              DELIVERY: null,
              CHECK: null
            };

            statusUpdates.forEach(update => {
              if (!statusMap[update.statusType] || 
                  new Date(update.createdAt) > new Date(statusMap[update.statusType].createdAt)) {
                statusMap[update.statusType] = update;
              }
            });

            latestStatuses = statusMap;
            statusSummary = {
              order: statusMap.ORDER?.statusValue || '未設定',
              pickup: statusMap.PICKUP?.statusValue || '未設定',
              delivery: statusMap.DELIVERY?.statusValue || '未設定',
              check: statusMap.CHECK?.statusValue || '未設定'
            };
          }
          
          return {
            ...order,
            items: itemsWithMaterials,
            project,
            latestStatuses,
            statusSummary
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          orders: ordersWithItems,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        },
        message: 'Auxiliary material orders retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get auxiliary orders error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving auxiliary material orders'
      });
    }
  }

  /**
   * Get finished material orders with project details (AM only)
   * GET /api/orders/finished
   */
  static async getFinishedOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user!.role;
      const userId = req.user!.userId;

      // Only AM, ADMIN, and WAREHOUSE users can access finished material orders
      if (!['AM', 'ADMIN', 'WAREHOUSE'].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only AM, ADMIN, and WAREHOUSE users can access finished material orders'
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

      const { page, limit, status } = value;

      // Get orders based on user role (use memory database like auxiliary orders)
      let result;
      if (userRole === 'ADMIN' || userRole === 'WAREHOUSE') {
        // Admin and Warehouse users can see all finished orders
        result = await memoryDb.findAllOrders({ status }, page, limit);
      } else {
        // AM users can only see their own orders
        result = await memoryDb.findOrdersByUserId(userId, { status }, page, limit);
      }

      // Filter orders to only include finished material orders by checking order items
      const finishedOrdersPromises = result.orders.map(async (order) => {
        const items = await memoryDb.getOrderItems(order.id);
        
        // Check if any item in the order is a finished material
        const hasFinishedMaterials = await Promise.all(
          items.map(async (item) => {
            const material = await MaterialModel.findById(item.materialId);
            return material?.type === 'FINISHED';
          })
        );
        
        // Return order if it contains finished materials
        return hasFinishedMaterials.some(isFinished => isFinished) ? order : null;
      });

      const finishedOrdersResults = await Promise.all(finishedOrdersPromises);
      const finishedOrders = finishedOrdersResults.filter(order => order !== null);

      // Add order items and status information to each order (same as auxiliary orders)
      const ordersWithItems = await Promise.all(
        finishedOrders.map(async (order) => {
          const items = await memoryDb.getOrderItems(order.id);
          
          // Add material details to each item
          const itemsWithMaterials = await Promise.all(
            items.map(async (item) => {
              const material = await MaterialModel.findById(item.materialId);
              return {
                ...item,
                material
              };
            })
          );

          // Get project and status information
          const project = await memoryDb.findProjectByOrderId(order.id);
          let latestStatuses = {};
          let statusSummary = {
            order: '未設定',
            pickup: '未設定',
            delivery: '未設定',
            check: '未設定'
          };

          if (project) {
            const statusUpdates = await memoryDb.getStatusUpdatesByProject(project.id);
            
            // Get latest status for each type
            const statusMap: Record<string, any> = {
              ORDER: null,
              PICKUP: null,
              DELIVERY: null,
              CHECK: null
            };

            statusUpdates.forEach(update => {
              if (!statusMap[update.statusType] || 
                  new Date(update.createdAt) > new Date(statusMap[update.statusType].createdAt)) {
                statusMap[update.statusType] = update;
              }
            });

            latestStatuses = statusMap;
            statusSummary = {
              order: statusMap.ORDER?.statusValue || '未設定',
              pickup: statusMap.PICKUP?.statusValue || '未設定',
              delivery: statusMap.DELIVERY?.statusValue || '未設定',
              check: statusMap.CHECK?.statusValue || '未設定'
            };
          }
          
          return {
            ...order,
            items: itemsWithMaterials,
            project,
            latestStatuses,
            statusSummary
          };
        })
      );

      // Get supplier statistics for finished material orders
      const supplierStats = await OrderController.getSupplierStatistics(finishedOrders);

      res.status(200).json({
        success: true,
        data: {
          orders: ordersWithItems,
          supplierStatistics: supplierStats,
          pagination: {
            page,
            limit,
            total: finishedOrders.length,
            totalPages: Math.ceil(finishedOrders.length / limit)
          }
        },
        message: 'Finished material orders retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get finished orders error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving finished material orders'
      });
    }
  }

  /**
   * Get supplier statistics for finished material orders
   * Helper method to analyze supplier distribution
   */
  private static async getSupplierStatistics(orders: Order[]): Promise<{
    totalSuppliers: number;
    supplierOrderCounts: Array<{ supplier: string; orderCount: number; totalAmount: number }>;
    topSuppliers: Array<{ supplier: string; orderCount: number; totalAmount: number }>;
  }> {
    const supplierMap = new Map<string, { orderCount: number; totalAmount: number }>();

    for (const order of orders) {
      const itemsWithDetails = await OrderModel.getOrderItemsWithMaterialDetails(order.id);
      
      for (const item of itemsWithDetails) {
        const supplier = item.supplier || 'Unknown Supplier';
        const itemTotal = item.quantity * item.unitPrice;
        
        if (supplierMap.has(supplier)) {
          const existing = supplierMap.get(supplier)!;
          existing.orderCount += 1;
          existing.totalAmount += itemTotal;
        } else {
          supplierMap.set(supplier, { orderCount: 1, totalAmount: itemTotal });
        }
      }
    }

    const supplierOrderCounts = Array.from(supplierMap.entries()).map(([supplier, stats]) => ({
      supplier,
      orderCount: stats.orderCount,
      totalAmount: stats.totalAmount
    }));

    // Sort by total amount descending to get top suppliers
    const topSuppliers = [...supplierOrderCounts]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    return {
      totalSuppliers: supplierMap.size,
      supplierOrderCounts,
      topSuppliers
    };
  }

  /**
   * Confirm finished material order and ensure project creation
   * PUT /api/orders/:id/confirm-finished
   */
  static async confirmFinishedOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Only AM users can confirm finished material orders
      if (userRole !== 'AM') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only AM users can confirm finished material orders'
        });
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Order ID must be a valid UUID'
        });
        return;
      }

      const order = await OrderModel.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Order not found'
        });
        return;
      }

      // Check if user owns this order
      if (order.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only confirm your own orders'
        });
        return;
      }

      // Check if order can be confirmed
      if (order.status !== 'PENDING') {
        res.status(400).json({
          success: false,
          error: 'Cannot confirm',
          message: 'Only pending orders can be confirmed'
        });
        return;
      }

      // Update order status to confirmed
      const confirmedOrder = await OrderModel.updateStatus(id, 'CONFIRMED');

      if (!confirmedOrder) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to confirm order'
        });
        return;
      }

      // Check if project already exists
      let project = await ProjectModel.findByOrderId(id);
      
      if (!project) {
        // Create project for finished material order (requirement 3.4)
        const projectName = `完成材專案-${new Date().toISOString().split('T')[0]}-${id.substring(0, 8)}`;
        project = await ProjectModel.create(id, projectName);

        // Initialize four status columns (requirement 3.5)
        const statusInitializations = [
          { statusType: 'ORDER' as const, statusValue: 'PENDING' },
          { statusType: 'PICKUP' as const, statusValue: 'PENDING' },
          { statusType: 'DELIVERY' as const, statusValue: 'PENDING' },
          { statusType: 'CHECK' as const, statusValue: 'PENDING' }
        ];

        for (const statusInit of statusInitializations) {
          await StatusUpdateModel.create({
            projectId: project.id,
            updatedBy: userId,
            statusType: statusInit.statusType,
            statusValue: statusInit.statusValue
          });
        }
      }

      // Get supplier information for the confirmed order
      const itemsWithDetails = await OrderModel.getOrderItemsWithMaterialDetails(id);
      const supplierInfo = itemsWithDetails.map(item => ({
        materialId: item.materialId,
        materialName: item.materialName,
        supplier: item.supplier || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      res.status(200).json({
        success: true,
        data: {
          order: confirmedOrder,
          project: project,
          supplierInfo
        },
        message: 'Finished material order confirmed successfully with supplier information'
      });
    } catch (error: any) {
      console.error('Confirm finished order error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while confirming the finished material order'
      });
    }
  }

  /**
   * Get order items by order ID
   * GET /api/orders/:id/items
   */
  static async getOrderItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Order ID must be a valid UUID'
        });
        return;
      }

      const order = await OrderModel.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Order not found'
        });
        return;
      }

      // Check if user has permission to view this order's items
      if (userRole !== 'ADMIN' && order.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only view your own order items'
        });
        return;
      }

      const itemsWithDetails = await OrderModel.getOrderItemsWithMaterialDetails(id);

      res.status(200).json({
        success: true,
        data: {
          orderId: id,
          items: itemsWithDetails,
          supplierSummary: OrderController.generateSupplierSummary(itemsWithDetails)
        },
        message: 'Order items retrieved successfully with supplier information'
      });
    } catch (error: any) {
      console.error('Get order items error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving order items'
      });
    }
  }

  /**
   * Generate supplier summary for order items
   * Helper method to summarize supplier information for a single order
   */
  private static generateSupplierSummary(items: Array<OrderItem & { 
    materialName: string; 
    materialCategory: string; 
    materialType: string; 
    supplier?: string; 
    imageUrl?: string; 
  }>): {
    suppliers: Array<{ supplier: string; itemCount: number; totalValue: number; items: string[] }>;
    totalValue: number;
    hasMultipleSuppliers: boolean;
  } {
    const supplierMap = new Map<string, { itemCount: number; totalValue: number; items: string[] }>();
    let totalValue = 0;

    for (const item of items) {
      const supplier = item.supplier || 'Unknown Supplier';
      const itemValue = item.quantity * item.unitPrice;
      totalValue += itemValue;

      if (supplierMap.has(supplier)) {
        const existing = supplierMap.get(supplier)!;
        existing.itemCount += 1;
        existing.totalValue += itemValue;
        existing.items.push(item.materialName);
      } else {
        supplierMap.set(supplier, {
          itemCount: 1,
          totalValue: itemValue,
          items: [item.materialName]
        });
      }
    }

    const suppliers = Array.from(supplierMap.entries()).map(([supplier, stats]) => ({
      supplier,
      itemCount: stats.itemCount,
      totalValue: stats.totalValue,
      items: stats.items
    }));

    return {
      suppliers,
      totalValue,
      hasMultipleSuppliers: suppliers.length > 1
    };
  }

  /**
   * Update order name (PM and AM only for their own orders)
   * PUT /api/orders/:id/name
   */
  static async updateOrderName(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const user = req.user!;

      // Validate name
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: '訂單名稱不能為空'
        });
        return;
      }

      if (name.trim().length > 100) {
        res.status(400).json({
          success: false,
          message: '訂單名稱不能超過100個字符'
        });
        return;
      }

      // Get the order
      const order = await memoryDb.getOrderById(id);
      if (!order) {
        res.status(404).json({
          success: false,
          message: '訂單不存在'
        });
        return;
      }

      // Check permissions - only PM/AM can update their own orders, or ADMIN can update any
      if (user.role !== 'ADMIN' && order.userId !== user.userId) {
        res.status(403).json({
          success: false,
          message: '您只能修改自己的訂單名稱'
        });
        return;
      }

      // Only PM and AM (and ADMIN) can update order names
      if (!['PM', 'AM', 'ADMIN'].includes(user.role)) {
        res.status(403).json({
          success: false,
          message: '只有PM和AM用戶可以修改訂單名稱'
        });
        return;
      }

      // Update the order name
      const updatedOrder = await memoryDb.updateOrderName(id, name.trim());
      if (!updatedOrder) {
        res.status(500).json({
          success: false,
          message: '更新訂單名稱失敗'
        });
        return;
      }

      res.json({
        success: true,
        message: '訂單名稱更新成功',
        data: {
          order: updatedOrder
        }
      });

    } catch (error: any) {
      console.error('Update order name error:', error);
      res.status(500).json({
        success: false,
        message: '更新訂單名稱時發生錯誤',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete order permanently (Admin only)
   * DELETE /api/orders/:id/delete
   */
  static async deleteOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Only ADMIN can delete orders
      if (user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: '只有管理員可以刪除訂單'
        });
        return;
      }

      // Check if order exists
      const order = await memoryDb.getOrderById(id);
      if (!order) {
        res.status(404).json({
          success: false,
          message: '訂單不存在'
        });
        return;
      }

      // Delete the order and all related data
      const deleted = await memoryDb.deleteOrder(id);
      
      if (!deleted) {
        res.status(500).json({
          success: false,
          message: '刪除訂單失敗'
        });
        return;
      }

      res.json({
        success: true,
        message: '訂單已成功刪除',
        data: {
          deletedOrderId: id
        }
      });

    } catch (error: any) {
      console.error('Delete order error:', error);
      res.status(500).json({
        success: false,
        message: '刪除訂單時發生錯誤',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}