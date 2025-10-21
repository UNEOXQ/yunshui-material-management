import { Request, Response, NextFunction } from 'express';
// import { ValidationError as JoiValidationError } from 'joi';

// 定義錯誤類型
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 預定義的錯誤類型
export class AppValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

// 錯誤處理中介軟體
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let details: any = undefined;

  // 記錄錯誤
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 處理不同類型的錯誤
  if (error instanceof AppError) {
    // 自定義應用錯誤
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode || 'APP_ERROR';
  } else if (error.name === 'ValidationError') {
    // Joi 驗證錯誤
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    
    if ('details' in error) {
      const validationError = error as any;
      details = validationError.details?.map((detail: any) => ({
        field: detail.path?.join('.'),
        message: detail.message
      }));
    }
  } else if (error.name === 'JsonWebTokenError') {
    // JWT 錯誤
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    // JWT 過期錯誤
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  } else if (error.name === 'CastError') {
    // 資料庫類型轉換錯誤
    statusCode = 400;
    message = 'Invalid ID format';
    errorCode = 'INVALID_ID';
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    // MongoDB 錯誤
    const mongoError = error as any;
    if (mongoError.code === 11000) {
      statusCode = 409;
      message = 'Duplicate key error';
      errorCode = 'DUPLICATE_KEY';
      
      // 提取重複的欄位資訊
      const duplicateField = Object.keys(mongoError.keyPattern || {})[0];
      if (duplicateField) {
        details = { field: duplicateField };
      }
    }
  } else if (error.message.includes('ENOENT')) {
    // 檔案不存在錯誤
    statusCode = 404;
    message = 'File not found';
    errorCode = 'FILE_NOT_FOUND';
  } else if (error.message.includes('EACCES')) {
    // 權限錯誤
    statusCode = 403;
    message = 'Permission denied';
    errorCode = 'PERMISSION_DENIED';
  }

  // 在開發環境中包含堆疊追蹤
  const response: any = {
    success: false,
    error: errorCode,
    message,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  // 發送錯誤回應
  res.status(statusCode).json(response);
};

// 404 錯誤處理中介軟體
export const notFoundHandler = (
  req: Request,
  _res: Response,
  _next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  _next(error);
};

// 非同步錯誤包裝器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 錯誤記錄服務
export class ErrorLogger {
  static async logError(error: Error, context?: any): Promise<void> {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: context || {}
    };

    // 在這裡可以整合外部錯誤監控服務
    // 例如 Sentry, LogRocket, 或自定義日誌服務
    console.error('Error logged:', errorLog);

    // 如果是嚴重錯誤，可以發送通知
    if (error instanceof InternalServerError) {
      // 發送緊急通知給開發團隊
      await this.sendCriticalErrorNotification(errorLog);
    }
  }

  private static async sendCriticalErrorNotification(_errorLog: any): Promise<void> {
    // 實作緊急錯誤通知邏輯
    // 例如發送 email、Slack 訊息等
    console.warn('Critical error detected:', _errorLog);
  }
}

// 健康檢查錯誤
export class HealthCheckError extends AppError {
  constructor(service: string, details?: any) {
    super(`Health check failed for ${service}`, 503, 'HEALTH_CHECK_FAILED');
    this.name = 'HealthCheckError';
    if (details) {
      (this as any).details = details;
    }
  }
}

// 速率限制錯誤
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// 檔案上傳錯誤
export class FileUploadError extends AppError {
  constructor(message: string) {
    super(message, 400, 'FILE_UPLOAD_ERROR');
  }
}

// 資料庫連線錯誤
export class DatabaseError extends AppError {
  constructor(message: string = 'Database connection failed') {
    super(message, 503, 'DATABASE_ERROR');
  }
}