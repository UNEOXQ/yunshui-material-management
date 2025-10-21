// Export all middleware functions for easy importing
export {
  authenticateToken,
  requireRole,
  requireAdmin,
  requirePM,
  requireAM,
  requireWarehouse,
  requireMaterialManager,
  requireStatusManager,
  requireAuth,
  requireOwnership,
  requireMaterialTypeAccess,
  optionalAuth,
  rateLimit
} from './auth';

// Common middleware combinations
import { 
  authenticateToken, 
  requireAdmin, 
  requirePM, 
  requireAM, 
  requireWarehouse,
  requireMaterialManager,
  requireStatusManager,
  requireMaterialTypeAccess,
  rateLimit
} from './auth';

/**
 * Middleware combinations for common use cases
 */

// Admin routes - require authentication and admin role
export const adminOnly = [authenticateToken, requireAdmin];

// PM routes - require authentication and PM role
export const pmOnly = [authenticateToken, requirePM];

// AM routes - require authentication and AM role  
export const amOnly = [authenticateToken, requireAM];

// Warehouse routes - require authentication and warehouse role
export const warehouseOnly = [authenticateToken, requireWarehouse];

// Material management routes - require authentication and PM/AM role
export const materialManagerOnly = [authenticateToken, requireMaterialManager];

// Status management routes - require authentication and warehouse/admin role
export const statusManagerOnly = [authenticateToken, requireStatusManager];

// Material type specific routes - require authentication and material type access
export const materialTypeAccess = [authenticateToken, requireMaterialTypeAccess];

// Rate limited auth routes
export const rateLimitedAuth = [rateLimit(10, 15 * 60 * 1000), authenticateToken];

// Public routes with rate limiting
export const rateLimitedPublic = [rateLimit(20, 15 * 60 * 1000)];