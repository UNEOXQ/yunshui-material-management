import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticateToken, requireStatusManager, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all order routes
router.use(authenticateToken);

/**
 * @route   POST /api/orders/auxiliary
 * @desc    Create a new auxiliary material order (PM and Admin)
 * @access  Private (PM, ADMIN)
 */
router.post('/auxiliary', requireRole('PM', 'ADMIN'), OrderController.createAuxiliaryOrder);

/**
 * @route   GET /api/orders/auxiliary
 * @desc    Get auxiliary material orders with project details (PM, Warehouse, Admin)
 * @access  Private (PM, WAREHOUSE, ADMIN)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10, max: 100)
 * @query   status - Filter by order status (optional)
 */
router.get('/auxiliary', requireRole('PM', 'WAREHOUSE', 'ADMIN'), OrderController.getAuxiliaryOrders);

/**
 * @route   POST /api/orders/finished
 * @desc    Create a new finished material order (AM and Admin)
 * @access  Private (AM, ADMIN)
 */
router.post('/finished', requireRole('AM', 'ADMIN'), OrderController.createFinishedOrder);

/**
 * @route   GET /api/orders/finished
 * @desc    Get finished material orders with project details (AM, Warehouse, Admin)
 * @access  Private (AM, WAREHOUSE, ADMIN)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10, max: 100)
 * @query   status - Filter by order status (optional)
 */
router.get('/finished', requireRole('AM', 'WAREHOUSE', 'ADMIN'), OrderController.getFinishedOrders);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (All authenticated users)
 */
router.post('/', OrderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders with pagination and filtering
 * @access  Private (Users see their own orders, Admin sees all)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10, max: 100)
 * @query   status - Filter by order status (optional)
 */
router.get('/', OrderController.getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private (Users can view their own orders, Admin can view all)
 * @param   id - Order UUID
 */
router.get('/:id', OrderController.getOrderById);

/**
 * @route   GET /api/orders/:id/items
 * @desc    Get order items by order ID
 * @access  Private (Users can view their own order items, Admin can view all)
 * @param   id - Order UUID
 */
router.get('/:id/items', OrderController.getOrderItems);

/**
 * @route   PUT /api/orders/:id/confirm
 * @desc    Confirm auxiliary material order and ensure project creation (PM and Admin)
 * @access  Private (PM, ADMIN)
 * @param   id - Order UUID
 */
router.put('/:id/confirm', requireRole('PM', 'ADMIN'), OrderController.confirmAuxiliaryOrder);

/**
 * @route   PUT /api/orders/:id/confirm-finished
 * @desc    Confirm finished material order and ensure project creation (AM and Admin)
 * @access  Private (AM, ADMIN)
 * @param   id - Order UUID
 */
router.put('/:id/confirm-finished', requireRole('AM', 'ADMIN'), OrderController.confirmFinishedOrder);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (Admin and Warehouse only)
 * @access  Private (Admin, Warehouse)
 * @param   id - Order UUID
 */
router.put('/:id/status', requireStatusManager, OrderController.updateOrderStatus);



/**
 * @route   PUT /api/orders/:id/name
 * @desc    Update order name (PM and AM can update their own orders)
 * @access  Private (PM, AM, ADMIN)
 * @param   id - Order UUID
 * @body    name - New order name
 */
router.put('/:id/name', requireRole('PM', 'AM', 'ADMIN'), OrderController.updateOrderName);

/**
 * @route   DELETE /api/orders/:id/delete
 * @desc    Delete order permanently (Admin only)
 * @access  Private (ADMIN only)
 * @param   id - Order UUID
 */
router.delete('/:id/delete', requireRole('ADMIN'), OrderController.deleteOrder);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancel order (Users can cancel their own orders, Admin can cancel any)
 * @access  Private
 * @param   id - Order UUID
 */
router.delete('/:id', OrderController.cancelOrder);

export default router;