import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

/**
 * @route   POST /api/users
 * @desc    Create a new user (Admin only)
 * @access  Private (Admin)
 */
router.post('/', requireRole('ADMIN'), UserController.createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination (Admin only)
 * @access  Private (Admin)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10, max: 100)
 * @query   role - Filter by role (optional)
 */
router.get('/', requireRole('ADMIN'), UserController.getUsers);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role (Admin only)
 * @access  Private (Admin)
 * @param   role - User role (PM, AM, WAREHOUSE, ADMIN)
 */
router.get('/role/:role', requireRole('ADMIN'), UserController.getUsersByRole);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Admin or own profile)
 * @access  Private
 * @param   id - User UUID
 */
router.get('/:id', UserController.getUserById);

/**
 * @route   GET /api/users/:id/role
 * @desc    Get user role information (Admin and Warehouse only)
 * @access  Private (Admin, Warehouse)
 * @param   id - User UUID
 */
router.get('/:id/role', requireRole('ADMIN', 'WAREHOUSE'), UserController.getUserRole);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Admin or own profile, role change Admin only)
 * @access  Private
 * @param   id - User UUID
 */
router.put('/:id', UserController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only, cannot delete self)
 * @access  Private (Admin)
 * @param   id - User UUID
 */
router.delete('/:id', requireRole('ADMIN'), UserController.deleteUser);

export default router;