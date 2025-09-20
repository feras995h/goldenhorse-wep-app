import models from '../models/index.js';

const { AuditLog } = models;

// قائمة الجداول المهمة التي تحتاج تدقيق
const AUDITED_TABLES = [
  'accounts',
  'gl_entries', 
  'journal_entries',
  'journal_entry_details',
  'invoices',
  'payments',
  'receipts',
  'customers',
  'suppliers',
  'employees',
  'fixed_assets',
  'users',
  'roles'
];

// قائمة الحقول الحساسة التي تحتاج تدقيق خاص
const SENSITIVE_FIELDS = [
  'balance',
  'debit',
  'credit',
  'amount',
  'total',
  'status',
  'isActive',
  'isCancelled',
  'password',
  'email'
];

/**
 * إنشاء سجل تدقيق للعمليات
 */
async function createAuditLog(params) {
  try {
    const {
      tableName,
      recordId,
      action,
      userId,
      oldValues = null,
      newValues = null,
      description = null,
      req = null,
      isSystemAction = false,
      severity = null,
      businessImpact = null
    } = params;

    // استخراج معلومات الطلب إذا كان متوفراً
    let ipAddress = null;
    let userAgent = null;
    let sessionId = null;

    if (req) {
      ipAddress = req.ip || req.connection.remoteAddress;
      userAgent = req.get('User-Agent');
      sessionId = req.sessionID || req.headers['x-session-id'];
    }

    // تحديد علامات الامتثال
    const complianceFlags = [];
    if (SENSITIVE_FIELDS.some(field => 
      (oldValues && oldValues[field] !== undefined) || 
      (newValues && newValues[field] !== undefined)
    )) {
      complianceFlags.push('SENSITIVE_DATA');
    }

    if (['accounts', 'gl_entries', 'journal_entries'].includes(tableName)) {
      complianceFlags.push('FINANCIAL_RECORD');
    }

    if (action === 'DELETE' || action === 'CANCEL') {
      complianceFlags.push('DATA_DELETION');
    }

    // تحديد الفئة تلقائياً إذا لم تكن محددة
    let category = null;
    const table = tableName.toLowerCase();
    if (table.includes('account') || table.includes('gl_') || table.includes('journal')) {
      category = 'ACCOUNTING';
    } else if (table.includes('invoice') || table.includes('payment')) {
      category = 'FINANCIAL';
    } else if (table.includes('customer')) {
      category = 'CUSTOMER';
    } else if (table.includes('user')) {
      category = 'USER';
    } else {
      category = 'SYSTEM';
    }

    // إنشاء سجل التدقيق
    await AuditLog.logAction({
      tableName,
      recordId,
      action,
      userId,
      oldValues,
      newValues,
      description,
      ipAddress,
      userAgent,
      sessionId,
      isSystemAction,
      severity,
      category,
      businessImpact,
      complianceFlags: complianceFlags.length > 0 ? complianceFlags : null
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء سجل التدقيق:', error);
    // لا نرمي الخطأ لتجنب إيقاف العملية الأساسية
  }
}

/**
 * Middleware لتسجيل العمليات تلقائياً
 */
function auditMiddleware(tableName, options = {}) {
  const {
    skipFields = ['updatedAt', 'createdAt'],
    customDescription = null,
    severity = null,
    businessImpact = null
  } = options;

  return {
    // Hook للإنشاء
    afterCreate: async (instance, options) => {
      if (!AUDITED_TABLES.includes(tableName)) return;

      const userId = options.userId || options.transaction?.userId || null;
      if (!userId) return;

      const newValues = instance.dataValues;
      const filteredValues = Object.fromEntries(
        Object.entries(newValues).filter(([key]) => !skipFields.includes(key))
      );

      await createAuditLog({
        tableName,
        recordId: instance.id,
        action: 'CREATE',
        userId,
        newValues: filteredValues,
        description: customDescription || `تم إنشاء سجل جديد في ${tableName}`,
        req: options.req,
        severity: severity || 'LOW',
        businessImpact
      });
    },

    // Hook للتحديث
    afterUpdate: async (instance, options) => {
      if (!AUDITED_TABLES.includes(tableName)) return;

      const userId = options.userId || options.transaction?.userId || null;
      if (!userId) return;

      const changedFields = instance.changed();
      if (!changedFields || changedFields.length === 0) return;

      const oldValues = {};
      const newValues = {};

      changedFields.forEach(field => {
        if (!skipFields.includes(field)) {
          oldValues[field] = instance._previousDataValues[field];
          newValues[field] = instance.dataValues[field];
        }
      });

      if (Object.keys(oldValues).length === 0) return;

      await createAuditLog({
        tableName,
        recordId: instance.id,
        action: 'UPDATE',
        userId,
        oldValues,
        newValues,
        description: customDescription || `تم تحديث سجل في ${tableName}`,
        req: options.req,
        severity: severity || 'MEDIUM',
        businessImpact
      });
    },

    // Hook للحذف
    afterDestroy: async (instance, options) => {
      if (!AUDITED_TABLES.includes(tableName)) return;

      const userId = options.userId || options.transaction?.userId || null;
      if (!userId) return;

      const oldValues = Object.fromEntries(
        Object.entries(instance.dataValues).filter(([key]) => !skipFields.includes(key))
      );

      await createAuditLog({
        tableName,
        recordId: instance.id,
        action: 'DELETE',
        userId,
        oldValues,
        description: customDescription || `تم حذف سجل من ${tableName}`,
        req: options.req,
        severity: severity || 'HIGH',
        businessImpact: businessImpact || 'تم حذف بيانات قد تؤثر على التقارير المالية'
      });
    }
  };
}

/**
 * تسجيل عمليات خاصة (مثل الإلغاء، النشر، إلخ)
 */
async function logSpecialAction(params) {
  const {
    tableName,
    recordId,
    action, // 'CANCEL', 'POST', 'UNPOST', etc.
    userId,
    description,
    req = null,
    relatedRecords = null,
    businessImpact = null
  } = params;

  await createAuditLog({
    tableName,
    recordId,
    action,
    userId,
    description,
    req,
    severity: 'HIGH',
    businessImpact,
    relatedRecords
  });
}

/**
 * الحصول على سجلات التدقيق لسجل معين
 */
async function getAuditTrail(tableName, recordId) {
  try {
    return await AuditLog.findByRecord(tableName, recordId);
  } catch (error) {
    console.error('❌ خطأ في استرجاع سجل التدقيق:', error);
    return [];
  }
}

/**
 * الحصول على سجلات التدقيق لمستخدم معين
 */
async function getUserAuditTrail(userId, startDate = null, endDate = null) {
  try {
    return await AuditLog.findByUser(userId, startDate, endDate);
  } catch (error) {
    console.error('❌ خطأ في استرجاع سجل تدقيق المستخدم:', error);
    return [];
  }
}

/**
 * الحصول على التغييرات المالية
 */
async function getFinancialAuditTrail(startDate = null, endDate = null) {
  try {
    return await AuditLog.findFinancialChanges(startDate, endDate);
  } catch (error) {
    console.error('❌ خطأ في استرجاع سجل التدقيق المالي:', error);
    return [];
  }
}

/**
 * Express middleware لإضافة معلومات التدقيق للطلبات
 */
function attachAuditInfo(req, res, next) {
  // إضافة دالة مساعدة للطلب
  req.auditLog = async (params) => {
    await createAuditLog({
      ...params,
      req,
      userId: params.userId || req.user?.id
    });
  };

  // إضافة دالة للعمليات الخاصة
  req.logSpecialAction = async (params) => {
    await logSpecialAction({
      ...params,
      req,
      userId: params.userId || req.user?.id
    });
  };

  next();
}

export {
  createAuditLog,
  auditMiddleware,
  logSpecialAction,
  getAuditTrail,
  getUserAuditTrail,
  getFinancialAuditTrail,
  attachAuditInfo,
  AUDITED_TABLES,
  SENSITIVE_FIELDS
};
