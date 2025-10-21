import { Response } from 'express';
import { StatusUpdateModel } from '../models/StatusUpdate';
import { ProjectModel } from '../models/Project';
import { UserModel } from '../models/User';
import { AuthenticatedRequest, StatusType } from '../types';
import { getWebSocketService } from '../services/websocketService';
import { memoryDb } from '../config/memory-database';
import Joi from 'joi';

// Validation schemas
const updateStatusSchema = Joi.object({
  statusType: Joi.string()
    .valid('ORDER', 'PICKUP', 'DELIVERY', 'CHECK')
    .required()
    .messages({
      'any.only': 'Status type must be one of: ORDER, PICKUP, DELIVERY, CHECK',
      'any.required': 'Status type is required'
    }),
  statusValue: Joi.string()
    .min(0)
    .max(100)
    .required()
    .messages({
      'string.max': 'Status value cannot exceed 100 characters',
      'any.required': 'Status value is required'
    }),
  additionalData: Joi.object()
    .pattern(Joi.string(), Joi.any())
    .optional()
    .messages({
      'object.base': 'Additional data must be an object'
    })
});

const orderStatusSchema = Joi.object({
  primaryStatus: Joi.string()
    .valid('Ordered', '')
    .required()
    .messages({
      'any.only': 'Primary status must be "Ordered" or empty',
      'any.required': 'Primary status is required'
    }),
  secondaryStatus: Joi.string()
    .valid('Processing', 'waiting for pick', 'pending', '')
    .when('primaryStatus', {
      is: 'Ordered',
      then: Joi.required(),
      otherwise: Joi.valid('')
    })
    .messages({
      'any.only': 'Secondary status must be one of: Processing, waiting for pick, pending',
      'any.required': 'Secondary status is required when primary status is "Ordered"'
    })
});

const pickupStatusSchema = Joi.object({
  primaryStatus: Joi.string()
    .valid('Picked', 'Failed')
    .required()
    .messages({
      'any.only': 'Primary status must be "Picked" or "Failed"',
      'any.required': 'Primary status is required'
    }),
  secondaryStatus: Joi.string()
    .when('primaryStatus', {
      is: 'Picked',
      then: Joi.valid('(B.T.W)', '(D.T.S)', '(B.T.W/MP)', '(D.T.S/MP)').required(),
      otherwise: Joi.valid('(E.S)', '(E.H)').required()
    })
    .messages({
      'any.only': 'Invalid secondary status for the selected primary status',
      'any.required': 'Secondary status is required'
    })
});

const deliveryStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Delivered', '')
    .required()
    .messages({
      'any.only': 'Status must be "Delivered" or empty',
      'any.required': 'Status is required'
    }),
  time: Joi.string()
    .when('status', {
      is: 'Delivered',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.required': 'Time is required when status is "Delivered"'
    }),
  address: Joi.string()
    .when('status', {
      is: 'Delivered',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.required': 'Address is required when status is "Delivered"'
    }),
  po: Joi.string()
    .when('status', {
      is: 'Delivered',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.required': 'P.O is required when status is "Delivered"'
    }),
  deliveredBy: Joi.string()
    .when('status', {
      is: 'Delivered',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.required': 'Delivered By is required when status is "Delivered"'
    })
});

const checkStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Check and sign(C.B/PM)', '(C.B)', 'WH)')
    .required()
    .messages({
      'any.only': 'Status must be one of: Check and sign(C.B/PM), (C.B), WH)',
      'any.required': 'Status is required'
    })
});

export class StatusController {
  /**
   * Helper method to broadcast status update via WebSocket
   */
  private static async broadcastStatusUpdate(
    statusUpdate: any,
    projectId: string,
    updatedBy: string
  ): Promise<void> {
    try {
      const websocketService = getWebSocketService();
      const user = await UserModel.findById(updatedBy);
      
      if (user) {
        websocketService.broadcastStatusUpdate({
          projectId,
          statusType: statusUpdate.statusType,
          statusValue: statusUpdate.statusValue,
          updatedBy: updatedBy,
          updatedByUsername: user.username,
          updatedByRole: user.role,
          timestamp: statusUpdate.createdAt,
          additionalData: statusUpdate.additionalData
        });
      }
    } catch (error) {
      console.error('Failed to broadcast status update:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
  /**
   * Update project status
   * PUT /api/projects/:projectId/status
   */
  static async updateProjectStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Only warehouse staff can update status
      if (userRole !== 'WAREHOUSE') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only warehouse staff can update project status'
        });
        return;
      }

      // Validate ID format (UUID or memory database ID)
      const isValidId = (id: string): boolean => {
        // UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        // Memory database ID format
        const memoryIdRegex = /^(user|project|material|order|item|id)-\d+$/;
        // Demo user ID format
        const demoIdRegex = /^demo-\w+$/;
        
        return uuidRegex.test(id) || memoryIdRegex.test(id) || demoIdRegex.test(id);
      };

      if (!isValidId(projectId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Project ID must be a valid UUID or memory database ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const { statusType, statusValue, additionalData } = value;

      // Check if project exists
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Project not found'
        });
        return;
      }

      // Get current status for validation
      const currentStatuses = await StatusUpdateModel.getLatestStatusesByProject(projectId);
      const currentStatus = currentStatuses[statusType as StatusType];

      // Validate status transition
      const validation = StatusUpdateModel.validateStatusTransition(
        statusType as StatusType,
        currentStatus?.statusValue || null,
        statusValue
      );

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid status transition',
          message: validation.message
        });
        return;
      }

      // Create status update
      const statusUpdate = await StatusUpdateModel.create({
        projectId,
        updatedBy: userId,
        statusType: statusType as StatusType,
        statusValue,
        additionalData
      });

      // Broadcast status update via WebSocket
      await StatusController.broadcastStatusUpdate(statusUpdate, projectId, userId);

      res.status(200).json({
        success: true,
        data: statusUpdate,
        message: 'Status updated successfully'
      });
    } catch (error: any) {
      console.error('Update status error:', error);

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
        message: 'An error occurred while updating status'
      });
    }
  }

  /**
   * Update order status (叫貨)
   * PUT /api/projects/:projectId/status/order
   */
  static async updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;



      // Allow warehouse staff, PM, and admin to update status
      if (!['WAREHOUSE', 'PM', 'ADMIN'].includes(userRole)) {
        console.log('Permission denied for role:', userRole);
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only warehouse staff, PM, and admin can update order status'
        });
        return;
      }

      // Validate request body
      const { error, value } = orderStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const { primaryStatus, secondaryStatus } = value;

      // Find project by order ID
      const project = await ProjectModel.findByOrderId(orderId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Project not found for this order'
        });
        return;
      }

      // Construct status value
      let statusValue = primaryStatus;
      if (primaryStatus === 'Ordered' && secondaryStatus) {
        statusValue = `${primaryStatus} - ${secondaryStatus}`;
      }



      // Create status update
      const statusUpdate = await StatusUpdateModel.create({
        projectId: project.id,
        updatedBy: userId,
        statusType: 'ORDER',
        statusValue,
        additionalData: {
          primaryStatus,
          secondaryStatus
        }
      });

      // Broadcast status update via WebSocket
      await StatusController.broadcastStatusUpdate(statusUpdate, project.id, userId);

      res.status(200).json({
        success: true,
        data: statusUpdate,
        message: 'Order status updated successfully'
      });
    } catch (error: any) {
      console.error('Update order status error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while updating order status'
      });
    }
  }

  /**
   * Update pickup status (取貨)
   * PUT /api/projects/:projectId/status/pickup
   */
  static async updatePickupStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Allow warehouse staff, PM, and admin to update status
      if (!['WAREHOUSE', 'PM', 'ADMIN'].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only warehouse staff, PM, and admin can update pickup status'
        });
        return;
      }

      // Validate request body
      const { error, value } = pickupStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const { primaryStatus, secondaryStatus } = value;

      // Find project by order ID
      const project = await ProjectModel.findByOrderId(orderId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Project not found for this order'
        });
        return;
      }

      // Construct status value
      const statusValue = `${primaryStatus} ${secondaryStatus}`;

      // Create status update
      const statusUpdate = await StatusUpdateModel.create({
        projectId: project.id,
        updatedBy: userId,
        statusType: 'PICKUP',
        statusValue,
        additionalData: {
          primaryStatus,
          secondaryStatus
        }
      });

      // Broadcast status update via WebSocket
      await StatusController.broadcastStatusUpdate(statusUpdate, project.id, userId);

      res.status(200).json({
        success: true,
        data: statusUpdate,
        message: 'Pickup status updated successfully'
      });
    } catch (error: any) {
      console.error('Update pickup status error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while updating pickup status'
      });
    }
  }

  /**
   * Update delivery status (到案)
   * PUT /api/projects/:projectId/status/delivery
   */
  static async updateDeliveryStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Allow warehouse staff, PM, and admin to update status
      if (!['WAREHOUSE', 'PM', 'ADMIN'].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only warehouse staff, PM, and admin can update delivery status'
        });
        return;
      }

      // Validate request body
      const { error, value } = deliveryStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const { status, time, address, po, deliveredBy } = value;

      // Find project by order ID
      const project = await ProjectModel.findByOrderId(orderId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Project not found for this order'
        });
        return;
      }

      // Create status update
      const statusUpdateData: any = {
        projectId: project.id,
        updatedBy: userId,
        statusType: 'DELIVERY',
        statusValue: status
      };

      if (status === 'Delivered') {
        statusUpdateData.additionalData = {
          time,
          address,
          po,
          deliveredBy
        };
      }

      const statusUpdate = await StatusUpdateModel.create(statusUpdateData);

      // Broadcast status update via WebSocket
      await StatusController.broadcastStatusUpdate(statusUpdate, project.id, userId);

      res.status(200).json({
        success: true,
        data: statusUpdate,
        message: 'Delivery status updated successfully'
      });
    } catch (error: any) {
      console.error('Update delivery status error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while updating delivery status'
      });
    }
  }

  /**
   * Update check status (點收)
   * PUT /api/projects/:projectId/status/check
   */
  static async updateCheckStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Allow warehouse staff, PM, and admin to update status
      if (!['WAREHOUSE', 'PM', 'ADMIN'].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only warehouse staff, PM, and admin can update check status'
        });
        return;
      }

      // Validate request body
      const { error, value } = checkStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const { status } = value;

      // Find project by order ID
      const project = await ProjectModel.findByOrderId(orderId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Project not found for this order'
        });
        return;
      }

      // Create status update
      const statusUpdate = await StatusUpdateModel.create({
        projectId: project.id,
        updatedBy: userId,
        statusType: 'CHECK',
        statusValue: status
      });

      // Broadcast status update via WebSocket
      await StatusController.broadcastStatusUpdate(statusUpdate, project.id, userId);

      // If check is completed, mark project as completed
      if (status && status !== '') {
        await ProjectModel.updateStatus(project.id, 'COMPLETED');
        
        // Broadcast project completion
        try {
          const websocketService = getWebSocketService();
          const user = await UserModel.findById(userId);
          const projectData = await ProjectModel.findById(project.id);
          
          if (user && projectData) {
            websocketService.broadcastProjectUpdate({
              projectId: project.id,
              projectName: projectData.projectName,
              overallStatus: 'COMPLETED',
              updatedBy: userId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Failed to broadcast project completion:', error);
        }
      }

      res.status(200).json({
        success: true,
        data: statusUpdate,
        message: 'Check status updated successfully'
      });
    } catch (error: any) {
      console.error('Update check status error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while updating check status'
      });
    }
  }

  /**
   * Get project status history
   * GET /api/projects/:projectId/status
   */
  static async getProjectStatusHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      // Validate ID format (UUID or memory database ID)
      const isValidId = (id: string): boolean => {
        // UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        // Memory database ID format
        const memoryIdRegex = /^(user|project|material|order|item|id)-\d+$/;
        // Demo user ID format
        const demoIdRegex = /^demo-\w+$/;
        
        return uuidRegex.test(id) || memoryIdRegex.test(id) || demoIdRegex.test(id);
      };

      if (!isValidId(projectId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'Project ID must be a valid UUID or memory database ID'
        });
        return;
      }

      // Check if project exists
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Project not found'
        });
        return;
      }

      // Helper functions to get user info from ID
      const getUsernameFromId = (userId: string): string => {
        if (userId.includes('pm')) return 'PM001';
        if (userId.includes('admin')) return 'Admin';
        if (userId.includes('warehouse')) return 'Warehouse001';
        if (userId.includes('am')) return 'AM001';
        return userId;
      };

      const getRoleFromUserId = (userId: string): string => {
        if (userId.includes('pm')) return 'PM';
        if (userId.includes('admin')) return 'ADMIN';
        if (userId.includes('warehouse')) return 'WAREHOUSE';
        if (userId.includes('am')) return 'AM';
        return 'USER';
      };

      // Get status updates for the project from memory database
      const statusUpdates = await memoryDb.getStatusUpdatesByProject(projectId);
      
      // Add user details to status updates
      const statusHistory = statusUpdates.map(update => ({
        ...update,
        user: {
          username: getUsernameFromId(update.updatedBy),
          role: getRoleFromUserId(update.updatedBy)
        }
      }));

      // Get latest status for each type
      const latestStatuses: Record<string, any> = {
        ORDER: null,
        PICKUP: null,
        DELIVERY: null,
        CHECK: null
      };

      statusHistory.forEach(update => {
        if (!latestStatuses[update.statusType] || 
            new Date(update.createdAt) > new Date(latestStatuses[update.statusType].createdAt)) {
          latestStatuses[update.statusType] = update;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          project,
          statusHistory,
          latestStatuses
        },
        message: 'Project status history retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get project status history error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving project status history'
      });
    }
  }

  /**
   * Get status statistics
   * GET /api/status/statistics
   */
  static async getStatusStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user!.role;

      // Only admin and warehouse staff can view statistics
      if (!['ADMIN', 'WAREHOUSE'].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators and warehouse staff can view status statistics'
        });
        return;
      }

      const statistics = await StatusUpdateModel.getStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Status statistics retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get status statistics error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving status statistics'
      });
    }
  }

  /**
   * Get all status updates with filtering
   * GET /api/status/updates
   */
  static async getStatusUpdates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user!.role;

      // Only admin and warehouse staff can view all status updates
      if (!['ADMIN', 'WAREHOUSE'].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only administrators and warehouse staff can view all status updates'
        });
        return;
      }

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const statusType = req.query.statusType as StatusType;
      const projectId = req.query.projectId as string;
      const updatedBy = req.query.updatedBy as string;

      const filters: any = {};
      if (statusType) filters.statusType = statusType;
      if (projectId) filters.projectId = projectId;
      if (updatedBy) filters.updatedBy = updatedBy;

      const result = await StatusUpdateModel.findAll(filters, page, limit);

      res.status(200).json({
        success: true,
        data: {
          updates: result.updates,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        },
        message: 'Status updates retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get status updates error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving status updates'
      });
    }
  }
}