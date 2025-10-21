import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest, UserRole } from '../types';

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Access token is required'
      });
      return;
    }

    // Verify token format
    if (!AuthService.isValidTokenFormat(token)) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token format'
      });
      return;
    }

    // Verify and decode token
    const payload = AuthService.verifyAccessToken(token);
    
    // Attach user info to request
    req.user = payload;
    
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    
    let message = 'Authentication failed';
    let statusCode = 401;

    if (error.message === 'Token expired') {
      message = 'Access token has expired';
    } else if (error.message === 'Invalid token') {
      message = 'Invalid access token';
    } else if (error.message === 'Token verification failed') {
      message = 'Token verification failed';
    }

    res.status(statusCode).json({
      success: false,
      error: 'Unauthorized',
      message: message
    });
  }
};

/**
 * Authorization middleware factory - checks user roles
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error('Authorization error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during authorization'
      });
    }
  };
};

/**
 * Role-specific middleware functions
 */

// Admin only access
export const requireAdmin = requireRole('ADMIN');

// PM only access
export const requirePM = requireRole('PM');

// AM only access
export const requireAM = requireRole('AM');

// Warehouse manager only access
export const requireWarehouse = requireRole('WAREHOUSE');

// PM or AM access (material managers)
export const requireMaterialManager = requireRole('PM', 'AM');

// Warehouse or Admin access (status managers)
export const requireStatusManager = requireRole('WAREHOUSE', 'ADMIN');

// Any authenticated user
export const requireAuth = authenticateToken;

/**
 * Resource ownership middleware - checks if user owns the resource
 */
export const requireOwnership = (userIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      const resourceUserId = req.params[userIdField] || req.body[userIdField];

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      // Admin can access any resource
      if (user.role === 'ADMIN') {
        next();
        return;
      }

      // Check if user owns the resource
      if (user.userId !== resourceUserId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied. You can only access your own resources'
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error('Ownership check error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during ownership verification'
      });
    }
  };
};

/**
 * Material type access control - ensures users can only access their material types
 */
export const requireMaterialTypeAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;
    const materialType = req.query.type || req.body.type;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Admin can access all material types
    if (user.role === 'ADMIN') {
      next();
      return;
    }

    // PM can only access auxiliary materials
    if (user.role === 'PM' && materialType !== 'AUXILIARY') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'PM users can only access auxiliary materials'
      });
      return;
    }

    // AM can only access finished materials
    if (user.role === 'AM' && materialType !== 'FINISHED') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'AM users can only access finished materials'
      });
      return;
    }

    // Warehouse can access all materials for status updates
    if (user.role === 'WAREHOUSE') {
      next();
      return;
    }

    next();
  } catch (error: any) {
    console.error('Material type access error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during material type access verification'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Token provided, try to verify it
    if (AuthService.isValidTokenFormat(token)) {
      try {
        const payload = AuthService.verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Invalid token, but don't fail the request
        console.warn('Optional auth failed:', error);
      }
    }

    next();
  } catch (error: any) {
    console.error('Optional authentication error:', error);
    // Don't fail the request for optional auth
    next();
  }
};

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize counter
      requestCounts.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }
    
    if (clientData.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
      return;
    }
    
    clientData.count++;
    next();
  };
};