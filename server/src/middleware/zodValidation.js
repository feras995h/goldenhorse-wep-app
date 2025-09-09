import { ZodError } from 'zod';
import { ValidationAppError } from './errorHandler.js';

// Zod validation middleware
export const validateZod = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body, query, and params
      const dataToValidate = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      // Parse and validate the data
      const validatedData = schema.parse(dataToValidate);

      // Update request with validated data
      req.body = validatedData.body || req.body;
      req.query = validatedData.query || req.query;
      req.params = validatedData.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
          code: err.code
        }));

        // Create custom validation error
        const validationError = new ValidationAppError(
          'بيانات غير صحيحة',
          formattedErrors
        );

        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

// Partial validation for specific parts of the request
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validatedBody = schema.parse(req.body);
      req.body = validatedBody;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
          code: err.code
        }));

        const validationError = new ValidationAppError(
          'بيانات الطلب غير صحيحة',
          formattedErrors
        );

        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
          code: err.code
        }));

        const validationError = new ValidationAppError(
          'معاملات البحث غير صحيحة',
          formattedErrors
        );

        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
          code: err.code
        }));

        const validationError = new ValidationAppError(
          'معاملات المسار غير صحيحة',
          formattedErrors
        );

        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

// Custom validation for specific use cases
export const validatePagination = (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    if (page && (isNaN(page) || parseInt(page) < 1)) {
      return res.status(400).json({
        success: false,
        message: 'رقم الصفحة يجب أن يكون رقم موجب',
        field: 'page',
        value: page
      });
    }
    
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      return res.status(400).json({
        success: false,
        message: 'الحد يجب أن يكون بين 1 و 100',
        field: 'limit',
        value: limit
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const validateDateRange = (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return res.status(400).json({
        success: false,
        message: 'تاريخ البداية غير صحيح',
        field: 'dateFrom',
        value: dateFrom
      });
    }
    
    if (dateTo && isNaN(Date.parse(dateTo))) {
      return res.status(400).json({
        success: false,
        message: 'تاريخ النهاية غير صحيح',
        field: 'dateTo',
        value: dateTo
      });
    }
    
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      return res.status(400).json({
        success: false,
        message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
        fields: ['dateFrom', 'dateTo']
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  validateZod,
  validateBody,
  validateQuery,
  validateParams,
  validatePagination,
  validateDateRange,
};
