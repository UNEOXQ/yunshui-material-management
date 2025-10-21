import request from 'supertest';
import express from 'express';
import { 
  errorHandler, 
  notFoundHandler, 
  AppValidationError, 
  NotFoundError, 
  UnauthorizedError,
  asyncHandler 
} from '../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('AppError Classes', () => {
    it('should create AppValidationError with correct properties', () => {
      const error = new AppValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('NOT_FOUND');
      expect(error.isOperational).toBe(true);
    });

    it('should create UnauthorizedError with correct properties', () => {
      const error = new UnauthorizedError('Access denied');
      
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('UNAUTHORIZED');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('Error Handler', () => {
    beforeEach(() => {
      // 添加測試路由
      app.get('/test-app-error', (_req, _res, next) => {
        next(new AppValidationError('Test validation error'));
      });

      app.get('/test-generic-error', (_req, _res, next) => {
        next(new Error('Generic error'));
      });

      app.get('/test-jwt-error', (_req, _res, next) => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        next(error);
      });

      app.get('/test-joi-validation', (_req, _res, next) => {
        const error = new Error('Validation failed') as any;
        error.name = 'ValidationError';
        error.details = [
          {
            path: ['username'],
            message: 'Username is required'
          }
        ];
        next(error);
      });

      // 添加錯誤處理中介軟體
      app.use(errorHandler);
    });

    it('should handle AppError correctly', async () => {
      const response = await request(app)
        .get('/test-app-error')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Test validation error'
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.path).toBe('/test-app-error');
    });

    it('should handle generic errors', async () => {
      const response = await request(app)
        .get('/test-generic-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal Server Error'
      });
    });

    it('should handle JWT errors', async () => {
      const response = await request(app)
        .get('/test-jwt-error')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid token'
      });
    });

    it('should handle Joi validation errors', async () => {
      const response = await request(app)
        .get('/test-joi-validation')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed'
      });
      expect(response.body.details).toEqual([
        {
          field: 'username',
          message: 'Username is required'
        }
      ]);
    });

    it('should include stack trace in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/test-generic-error')
        .expect(500);

      expect(response.body.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/test-generic-error')
        .expect(500);

      expect(response.body.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Not Found Handler', () => {
    beforeEach(() => {
      app.use(notFoundHandler);
      app.use(errorHandler);
    });

    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'NOT_FOUND',
        message: 'Route /non-existent-route not found'
      });
    });
  });

  describe('Async Handler', () => {
    beforeEach(() => {
      // 測試成功的非同步路由
      app.get('/test-async-success', asyncHandler(async (_req: express.Request, res: express.Response) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        res.json({ success: true });
      }));

      // 測試失敗的非同步路由
      app.get('/test-async-error', asyncHandler(async (_req: express.Request, _res: express.Response) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new AppValidationError('Async validation error');
      }));

      app.use(errorHandler);
    });

    it('should handle successful async operations', async () => {
      const response = await request(app)
        .get('/test-async-success')
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });

    it('should handle async errors', async () => {
      const response = await request(app)
        .get('/test-async-error')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Async validation error'
      });
    });
  });

  describe('Error Logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      app.get('/test-logging', (_req, _res, next) => {
        next(new Error('Test error for logging'));
      });

      app.use(errorHandler);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log errors with context information', async () => {
      await request(app)
        .get('/test-logging')
        .set('User-Agent', 'Test Agent')
        .expect(500);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          message: 'Test error for logging',
          url: '/test-logging',
          method: 'GET',
          userAgent: 'Test Agent'
        })
      );
    });
  });
});