import { Router } from 'express';
import { StatusController } from '../controllers/statusController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all status routes
router.use(authenticateToken);

/**
 * @route   PUT /api/projects/:projectId/status
 * @desc    Update project status (generic)
 * @access  Private (Warehouse only)
 * @param   projectId - Project UUID
 */
router.put('/projects/:projectId/status', StatusController.updateProjectStatus);

/**
 * @route   PUT /api/orders/:orderId/status/order
 * @desc    Update order status (叫貨)
 * @access  Private (Warehouse only)
 * @param   orderId - Order UUID
 */
router.put('/orders/:orderId/status/order', StatusController.updateOrderStatus);

/**
 * @route   PUT /api/orders/:orderId/status/pickup
 * @desc    Update pickup status (取貨)
 * @access  Private (Warehouse only)
 * @param   orderId - Order UUID
 */
router.put('/orders/:orderId/status/pickup', StatusController.updatePickupStatus);

/**
 * @route   PUT /api/orders/:orderId/status/delivery
 * @desc    Update delivery status (到案)
 * @access  Private (Warehouse only)
 * @param   orderId - Order UUID
 */
router.put('/orders/:orderId/status/delivery', StatusController.updateDeliveryStatus);

/**
 * @route   PUT /api/orders/:orderId/status/check
 * @desc    Update check status (點收)
 * @access  Private (Warehouse only)
 * @param   orderId - Order UUID
 */
router.put('/orders/:orderId/status/check', StatusController.updateCheckStatus);

/**
 * @route   GET /api/projects/:projectId/status
 * @desc    Get project status history
 * @access  Private (All authenticated users)
 * @param   projectId - Project UUID
 */
router.get('/projects/:projectId/status', StatusController.getProjectStatusHistory);

/**
 * @route   GET /api/status/statistics
 * @desc    Get status statistics
 * @access  Private (Admin, Warehouse only)
 */
router.get('/status/statistics', StatusController.getStatusStatistics);

/**
 * @route   GET /api/status/updates
 * @desc    Get all status updates with filtering
 * @access  Private (Admin, Warehouse only)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10, max: 100)
 * @query   statusType - Filter by status type (optional)
 * @query   projectId - Filter by project ID (optional)
 * @query   updatedBy - Filter by user ID (optional)
 */
router.get('/status/updates', StatusController.getStatusUpdates);

export default router;