import { Router } from 'express';
import { MaterialController } from '../controllers/materialController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all material routes
router.use(authenticateToken);

/**
 * @route   POST /api/materials
 * @desc    Create a new material (Admin only)
 * @access  Private (Admin)
 */
router.post('/', requireRole('ADMIN'), MaterialController.createMaterial);

/**
 * @route   GET /api/materials
 * @desc    Get all materials with filtering and pagination
 * @access  Private (All authenticated users)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10, max: 100)
 * @query   type - Filter by material type (AUXILIARY, FINISHED)
 * @query   category - Filter by category
 * @query   supplier - Filter by supplier
 * @query   search - Search in name and category
 */
router.get('/', MaterialController.getMaterials);

/**
 * @route   GET /api/materials/categories
 * @desc    Get all unique categories
 * @access  Private (All authenticated users)
 * @query   type - Filter by material type (optional)
 */
router.get('/categories', MaterialController.getCategories);

/**
 * @route   GET /api/materials/suppliers
 * @desc    Get all unique suppliers
 * @access  Private (All authenticated users)
 * @query   type - Filter by material type (optional)
 */
router.get('/suppliers', MaterialController.getSuppliers);

/**
 * @route   GET /api/materials/type/:type
 * @desc    Get materials by type
 * @access  Private (All authenticated users)
 * @param   type - Material type (AUXILIARY, FINISHED)
 */
router.get('/type/:type', MaterialController.getMaterialsByType);

/**
 * @route   GET /api/materials/category/:category
 * @desc    Get materials by category
 * @access  Private (All authenticated users)
 * @param   category - Material category
 */
router.get('/category/:category', MaterialController.getMaterialsByCategory);

/**
 * @route   GET /api/materials/:id
 * @desc    Get material by ID
 * @access  Private (All authenticated users)
 * @param   id - Material UUID
 */
router.get('/:id', MaterialController.getMaterialById);

/**
 * @route   PUT /api/materials/:id
 * @desc    Update material (Admin only)
 * @access  Private (Admin)
 * @param   id - Material UUID
 */
router.put('/:id', requireRole('ADMIN'), MaterialController.updateMaterial);

/**
 * @route   PATCH /api/materials/:id/quantity
 * @desc    Update material quantity (Warehouse and Admin)
 * @access  Private (Warehouse, Admin)
 * @param   id - Material UUID
 */
router.patch('/:id/quantity', MaterialController.updateQuantity);

/**
 * @route   DELETE /api/materials/:id
 * @desc    Delete material (Admin only)
 * @access  Private (Admin)
 * @param   id - Material UUID
 */
router.delete('/:id', requireRole('ADMIN'), MaterialController.deleteMaterial);

export default router;