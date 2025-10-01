import { createAuditLog } from './auditTrail.js';

// Opening Balance Permissions Middleware
const openingBalancePermissions = {
  // Check if user can view opening balances
  canView: (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح بالوصول'
      });
    }

    // Admin and Financial Manager can always view
    if (['admin', 'financial_manager'].includes(user.role)) {
      return next();
    }

    // Financial Staff can view but not modify
    if (user.role === 'financial_staff') {
      return next();
    }

    // Log unauthorized access attempt
    createAuditLog({
      userId: user.id,
      action: 'OPENING_BALANCE_VIEW_DENIED',
      resource: 'opening_balances',
      details: {
        userRole: user.role,
        reason: 'Insufficient permissions'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية لعرض الأرصدة الافتتاحية'
    });
  },

  // Check if user can create opening balances
  canCreate: (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح بالوصول'
      });
    }

    // Only Admin and Financial Manager can create
    if (['admin', 'financial_manager'].includes(user.role)) {
      // Log the creation attempt
      createAuditLog({
        userId: user.id,
        action: 'OPENING_BALANCE_CREATE_ATTEMPT',
        resource: 'opening_balances',
        details: {
          userRole: user.role,
          requestData: req.body
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return next();
    }

    // Log unauthorized access attempt
    createAuditLog({
      userId: user.id,
      action: 'OPENING_BALANCE_CREATE_DENIED',
      resource: 'opening_balances',
      details: {
        userRole: user.role,
        reason: 'Insufficient permissions'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية لإنشاء الأرصدة الافتتاحية'
    });
  },

  // Check if user can update opening balances
  canUpdate: (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح بالوصول'
      });
    }

    // Only Admin can update opening balances (high security)
    if (user.role === 'admin') {
      // Log the update attempt
      createAuditLog({
        userId: user.id,
        action: 'OPENING_BALANCE_UPDATE_ATTEMPT',
        resource: 'opening_balances',
        details: {
          userRole: user.role,
          resourceId: req.params.id,
          requestData: req.body
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return next();
    }

    // Financial Manager can update with additional verification
    if (user.role === 'financial_manager') {
      // Check if there's a special authorization token for sensitive operations
      const authToken = req.headers['x-sensitive-operation'];
      
      if (!authToken) {
        return res.status(403).json({
          success: false,
          message: 'تحديث الأرصدة الافتتاحية يتطلب تأكيد إضافي',
          requiresAdditionalAuth: true
        });
      }

      // Log the update attempt with additional auth
      createAuditLog({
        userId: user.id,
        action: 'OPENING_BALANCE_UPDATE_ATTEMPT_WITH_AUTH',
        resource: 'opening_balances',
        details: {
          userRole: user.role,
          resourceId: req.params.id,
          requestData: req.body,
          hasAdditionalAuth: true
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return next();
    }

    // Log unauthorized access attempt
    createAuditLog({
      userId: user.id,
      action: 'OPENING_BALANCE_UPDATE_DENIED',
      resource: 'opening_balances',
      details: {
        userRole: user.role,
        resourceId: req.params.id,
        reason: 'Insufficient permissions'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية لتحديث الأرصدة الافتتاحية'
    });
  },

  // Check if user can delete opening balances
  canDelete: (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح بالوصول'
      });
    }

    // Only Admin can delete opening balances (highest security)
    if (user.role === 'admin') {
      // Require additional confirmation for deletion
      const confirmToken = req.headers['x-delete-confirmation'];
      
      if (!confirmToken || confirmToken !== 'CONFIRM_DELETE_OPENING_BALANCE') {
        return res.status(403).json({
          success: false,
          message: 'حذف الأرصدة الافتتاحية يتطلب تأكيد إضافي',
          requiresDeleteConfirmation: true
        });
      }

      // Log the deletion attempt
      createAuditLog({
        userId: user.id,
        action: 'OPENING_BALANCE_DELETE_ATTEMPT',
        resource: 'opening_balances',
        details: {
          userRole: user.role,
          resourceId: req.params.id,
          hasDeleteConfirmation: true
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return next();
    }

    // Log unauthorized access attempt
    createAuditLog({
      userId: user.id,
      action: 'OPENING_BALANCE_DELETE_DENIED',
      resource: 'opening_balances',
      details: {
        userRole: user.role,
        resourceId: req.params.id,
        reason: 'Insufficient permissions'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية لحذف الأرصدة الافتتاحية'
    });
  },

  // Check if user can import opening balances
  canImport: (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح بالوصول'
      });
    }

    // Only Admin and Financial Manager can import
    if (['admin', 'financial_manager'].includes(user.role)) {
      // Log the import attempt
      createAuditLog({
        userId: user.id,
        action: 'OPENING_BALANCE_IMPORT_ATTEMPT',
        resource: 'opening_balances',
        details: {
          userRole: user.role,
          fileInfo: {
            originalName: req.file?.originalname,
            size: req.file?.size,
            mimetype: req.file?.mimetype
          }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return next();
    }

    // Log unauthorized access attempt
    createAuditLog({
      userId: user.id,
      action: 'OPENING_BALANCE_IMPORT_DENIED',
      resource: 'opening_balances',
      details: {
        userRole: user.role,
        reason: 'Insufficient permissions'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية لاستيراد الأرصدة الافتتاحية'
    });
  },

  // Log successful operations
  logSuccess: (action) => {
    return (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Only log if the operation was successful
        if (res.statusCode >= 200 && res.statusCode < 300) {
          createAuditLog({
            userId: req.user?.id,
            action: `OPENING_BALANCE_${action}_SUCCESS`,
            resource: 'opening_balances',
            details: {
              userRole: req.user?.role,
              resourceId: req.params?.id,
              statusCode: res.statusCode
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
        
        originalSend.call(this, data);
      };
      
      next();
    };
  }
};

export default openingBalancePermissions;
