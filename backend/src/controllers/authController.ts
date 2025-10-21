import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest, LoginRequest } from '../types';
import Joi from 'joi';

// Validation schemas
const loginSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 255 characters',
      'any.required': 'Username or email is required'
    }),
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Password is required',
      'any.required': 'Password is required'
    })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

export class AuthController {
  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const credentials: LoginRequest = value;

      // Authenticate user
      const loginResponse = await AuthService.authenticate(credentials);

      res.status(200).json({
        success: true,
        data: loginResponse,
        message: 'Login successful'
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message === 'Invalid credentials') {
        res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid username or password'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during login'
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = refreshTokenSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const { refreshToken } = value;

      // Refresh access token
      const result = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      });
    } catch (error: any) {
      console.error('Token refresh error:', error);
      
      if (error.message.includes('token') || error.message.includes('Token')) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: error.message
        });
        return;
      }

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User associated with token not found'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during token refresh'
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // In a stateless JWT implementation, logout is handled client-side
      // by removing the token from storage. However, we can log the logout event.
      
      const user = req.user;
      if (user) {
        console.log(`User ${user.username} (${user.userId}) logged out`);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during logout'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      // Get full user data from database
      const { UserModel } = await import('../models/User');
      const fullUser = await UserModel.findById(user.userId);
      
      if (!fullUser) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User profile not found'
        });
        return;
      }

      // Return user data without password hash
      const { passwordHash, ...userProfile } = fullUser;

      res.status(200).json({
        success: true,
        data: userProfile,
        message: 'Profile retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving profile'
      });
    }
  }

  /**
   * Validate token endpoint (for debugging/testing)
   * POST /api/auth/validate
   */
  static async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthService.extractTokenFromHeader(authHeader);

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Missing token',
          message: 'Authorization token is required'
        });
        return;
      }

      // Verify token
      const payload = AuthService.verifyAccessToken(token);

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          payload: payload
        },
        message: 'Token is valid'
      });
    } catch (error: any) {
      console.error('Token validation error:', error);
      
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: error.message,
        data: {
          valid: false
        }
      });
    }
  }
}