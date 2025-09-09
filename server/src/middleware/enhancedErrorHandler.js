import { ValidationError } from 'sequelize';
import fs from 'fs-extra';
import path from 'path';

/**
 * Enhanced Error Handler with Logging and Monitoring
 */

// Error logging utility
class ErrorLogger {
  constructor() {
    this.logPath = process.env.LOG_PATH || './logs';
    this.initializeLogging();
  }

  async initializeLogging() {
    try {
      await fs.ensureDir(this.logPath);
      console.log('✅ Error logging initialized');
    } catch (error) {
      console.error('❌ Failed to initialize error logging:', error.message);
    }
  }

  async logError(error, req, additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'ERROR',
      message: error.message,
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      userAgent: req?.get('User-Agent'),
      ip: req?.ip,
      userId: req?.user?.id,
      username: req?.user?.username,
      ...additionalInfo
    };

    try {
      // Write to daily log file
      const logFile = path.join(this.logPath, `error_${timestamp.split('T')[0]}.log`);
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Error logged:', logEntry);
      }
    } catch (logError) {
      console.error('❌ Failed to write error log:', logError.message);
    }
  }

  async logSecurityEvent(event, req, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'SECURITY',
      event,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      url: req?.url,
      method: req?.method,
      userId: req?.user?.id,
      username: req?.user?.username,
      ...details
    };

    try {
      const logFile = path.join(this.logPath, `security_${timestamp.split('T')[0]}.log`);
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
      
      console.warn('🔒 Security event logged:', logEntry);
    } catch (logError) {
      console.error('❌ Failed to write security log:', logError.message);
    }
  }
}

const errorLogger = new ErrorLogger();

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationAppError extends AppError {
  constructor(message, errors, field = null) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.errors = errors;
    this.field = field;
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError, operation = null) {
    super(message, 500, false, 'DATABASE_ERROR');
    this.originalError = originalError;
    this.operation = operation;
  }
}

export class SecurityError extends AppError {
  constructor(message, details = {}) {
    super(message, 403, true, 'SECURITY_ERROR');
    this.details = details;
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

// Enhanced error handler middleware
export const enhancedErrorHandler = async (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  await errorLogger.logError(err, req, {
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Sequelize validation errors
  if (err instanceof ValidationError) {
    const message = 'خطأ في التحقق من صحة البيانات';
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value,
      type: e.type
    }));
    
    return res.status(400).json({
      success: false,
      message,
      errors,
      errorCode: 'SEQUELIZE_VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Custom validation errors
  if (err instanceof ValidationAppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      field: err.field,
      errorCode: err.errorCode,
      timestamp: new Date().toISOString()
    });
  }

  // Database errors
  if (err instanceof DatabaseError) {
    const message = process.env.NODE_ENV === 'production' 
      ? 'حدث خطأ في قاعدة البيانات' 
      : err.message;
      
    return res.status(err.statusCode).json({
      success: false,
      message,
      operation: err.operation,
      errorCode: err.errorCode,
      ...(process.env.NODE_ENV === 'development' && { 
        originalError: err.originalError?.message 
      }),
      timestamp: new Date().toISOString()
    });
  }

  // Security errors
  if (err instanceof SecurityError) {
    await errorLogger.logSecurityEvent('SECURITY_ERROR', req, err.details);
    
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      timestamp: new Date().toISOString()
    });
  }

  // Rate limit errors
  if (err instanceof RateLimitError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      retryAfter: req.rateLimit?.resetTime,
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    await errorLogger.logSecurityEvent('INVALID_JWT', req, { error: err.message });
    
    return res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير صحيح',
      errorCode: 'INVALID_JWT',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    await errorLogger.logSecurityEvent('EXPIRED_JWT', req, { error: err.message });
    
    return res.status(401).json({
      success: false,
      message: 'انتهت صلاحية رمز المصادقة',
      errorCode: 'EXPIRED_JWT',
      timestamp: new Date().toISOString()
    });
  }

  // Sequelize database connection errors
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      message: 'خطأ في الاتصال بقاعدة البيانات',
      errorCode: 'DATABASE_CONNECTION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Sequelize timeout errors
  if (err.name === 'SequelizeTimeoutError') {
    return res.status(408).json({
      success: false,
      message: 'انتهت مهلة العملية',
      errorCode: 'DATABASE_TIMEOUT',
      timestamp: new Date().toISOString()
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'حجم الملف كبير جداً',
      errorCode: 'FILE_TOO_LARGE',
      maxSize: err.limit,
      timestamp: new Date().toISOString()
    });
  }

  // Custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      status: err.status,
      errorCode: err.errorCode,
      timestamp: new Date().toISOString()
    });
  }

  // Default error (unknown)
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'حدث خطأ داخلي في الخادم' 
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errorCode: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    }),
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper with enhanced error handling
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Add request context to error
      error.requestId = req.id || Date.now();
      error.endpoint = `${req.method} ${req.path}`;
      next(error);
    });
  };
};

// Not found handler
export const notFound = (req, res, next) => {
  const error = new AppError(
    `المسار ${req.originalUrl} غير موجود`, 
    404, 
    true, 
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

// Request ID middleware for tracking
export const requestId = (req, res, next) => {
  req.id = Date.now() + Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
};

export { errorLogger };

export default {
  AppError,
  ValidationAppError,
  DatabaseError,
  SecurityError,
  RateLimitError,
  enhancedErrorHandler,
  asyncHandler,
  notFound,
  requestId,
  errorLogger
};
