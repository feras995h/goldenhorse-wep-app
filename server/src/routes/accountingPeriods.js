/**
 * API Routes للفترات المحاسبية (Accounting Periods)
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import models from '../models/index.js';

const router = express.Router();
const { AccountingPeriod, User } = models;

/**
 * GET /api/accounting-periods
 * الحصول على جميع الفترات المحاسبية
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, year, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (year) where.year = parseInt(year);
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows: periods } = await AccountingPeriod.findAndCountAll({
      where,
      include: [
        { model: User, as: 'closedByUser', attributes: ['id', 'name', 'username'] },
        { model: User, as: 'archivedByUser', attributes: ['id', 'name', 'username'] }
      ],
      order: [['year', 'DESC'], ['month', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      success: true,
      data: periods,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching accounting periods:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفترات المحاسبية',
      error: error.message
    });
  }
});

/**
 * GET /api/accounting-periods/current
 * الحصول على الفترة المحاسبية الحالية
 */
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const period = await AccountingPeriod.getCurrentPeriod();
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'لا توجد فترة محاسبية للشهر الحالي'
      });
    }
    
    res.json({
      success: true,
      data: period
    });
  } catch (error) {
    console.error('Error fetching current period:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفترة الحالية',
      error: error.message
    });
  }
});

/**
 * GET /api/accounting-periods/open
 * الحصول على جميع الفترات المفتوحة
 */
router.get('/open', authenticateToken, async (req, res) => {
  try {
    const periods = await AccountingPeriod.getOpenPeriods();
    
    res.json({
      success: true,
      data: periods
    });
  } catch (error) {
    console.error('Error fetching open periods:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفترات المفتوحة',
      error: error.message
    });
  }
});

/**
 * GET /api/accounting-periods/check-date/:date
 * التحقق من إمكانية الترحيل في تاريخ معين
 */
router.get('/check-date/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const result = await AccountingPeriod.canPostOnDate(date);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error checking date:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من التاريخ',
      error: error.message
    });
  }
});

/**
 * GET /api/accounting-periods/:id
 * الحصول على فترة محاسبية محددة
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const period = await AccountingPeriod.findByPk(id, {
      include: [
        { model: User, as: 'closedByUser', attributes: ['id', 'name', 'username'] },
        { model: User, as: 'archivedByUser', attributes: ['id', 'name', 'username'] }
      ]
    });
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'الفترة المحاسبية غير موجودة'
      });
    }
    
    res.json({
      success: true,
      data: period
    });
  } catch (error) {
    console.error('Error fetching accounting period:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفترة المحاسبية',
      error: error.message
    });
  }
});

/**
 * POST /api/accounting-periods
 * إنشاء فترة محاسبية جديدة
 */
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { year, month, notes } = req.body;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'السنة والشهر مطلوبان'
      });
    }
    
    // التحقق من عدم وجود فترة بنفس السنة والشهر
    const existing = await AccountingPeriod.findOne({
      where: { year: parseInt(year), month: parseInt(month) }
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'توجد فترة محاسبية لهذا الشهر بالفعل'
      });
    }
    
    // إنشاء تواريخ البداية والنهاية تلقائياً
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    const period = await AccountingPeriod.create({
      year: parseInt(year),
      month: parseInt(month),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'open',
      notes
    });
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفترة المحاسبية بنجاح',
      data: period
    });
  } catch (error) {
    console.error('Error creating accounting period:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الفترة المحاسبية',
      error: error.message
    });
  }
});

/**
 * POST /api/accounting-periods/:id/close
 * إقفال فترة محاسبية
 */
router.post('/:id/close', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { createClosingEntries = true } = req.body;
    
    const period = await AccountingPeriod.findByPk(id);
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'الفترة المحاسبية غير موجودة'
      });
    }
    
    if (period.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'يمكن إقفال الفترات المفتوحة فقط'
      });
    }
    
    // إقفال الفترة مع إنشاء قيود الإقفال
    await period.close(req.user.id, { createClosingEntries });
    
    // إعادة جلب الفترة مع البيانات المحدثة
    const updatedPeriod = await AccountingPeriod.findByPk(id, {
      include: [
        { model: User, as: 'closedByUser', attributes: ['id', 'name', 'username'] }
      ]
    });
    
    res.json({
      success: true,
      message: 'تم إقفال الفترة المحاسبية بنجاح',
      data: updatedPeriod
    });
  } catch (error) {
    console.error('Error closing accounting period:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في إقفال الفترة المحاسبية',
      error: error.message
    });
  }
});

/**
 * POST /api/accounting-periods/:id/reopen
 * إعادة فتح فترة محاسبية مقفلة
 */
router.post('/:id/reopen', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const period = await AccountingPeriod.findByPk(id);
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'الفترة المحاسبية غير موجودة'
      });
    }
    
    await period.reopen();
    
    res.json({
      success: true,
      message: 'تم إعادة فتح الفترة المحاسبية بنجاح',
      data: period
    });
  } catch (error) {
    console.error('Error reopening accounting period:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في إعادة فتح الفترة المحاسبية',
      error: error.message
    });
  }
});

/**
 * POST /api/accounting-periods/:id/archive
 * أرشفة فترة محاسبية مقفلة
 */
router.post('/:id/archive', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const period = await AccountingPeriod.findByPk(id);
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'الفترة المحاسبية غير موجودة'
      });
    }
    
    await period.archive(req.user.id);
    
    const updatedPeriod = await AccountingPeriod.findByPk(id, {
      include: [
        { model: User, as: 'archivedByUser', attributes: ['id', 'name', 'username'] }
      ]
    });
    
    res.json({
      success: true,
      message: 'تم أرشفة الفترة المحاسبية بنجاح',
      data: updatedPeriod
    });
  } catch (error) {
    console.error('Error archiving accounting period:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في أرشفة الفترة المحاسبية',
      error: error.message
    });
  }
});

/**
 * PUT /api/accounting-periods/:id
 * تحديث فترة محاسبية
 */
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const period = await AccountingPeriod.findByPk(id);
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'الفترة المحاسبية غير موجودة'
      });
    }
    
    if (period.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعديل الفترات المؤرشفة'
      });
    }
    
    // السماح بتعديل الملاحظات فقط
    await period.update({ notes });
    
    res.json({
      success: true,
      message: 'تم تحديث الفترة المحاسبية بنجاح',
      data: period
    });
  } catch (error) {
    console.error('Error updating accounting period:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في تحديث الفترة المحاسبية',
      error: error.message
    });
  }
});

/**
 * DELETE /api/accounting-periods/:id
 * حذف فترة محاسبية (المفتوحة والفارغة فقط)
 */
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const period = await AccountingPeriod.findByPk(id);
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'الفترة المحاسبية غير موجودة'
      });
    }
    
    if (period.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'يمكن حذف الفترات المفتوحة فقط'
      });
    }
    
    if (period.totalTransactions > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف فترة تحتوي على معاملات'
      });
    }
    
    await period.destroy();
    
    res.json({
      success: true,
      message: 'تم حذف الفترة المحاسبية بنجاح'
    });
  } catch (error) {
    console.error('Error deleting accounting period:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الفترة المحاسبية',
      error: error.message
    });
  }
});

export default router;


