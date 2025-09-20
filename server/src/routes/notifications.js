import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import models from '../models/index.js';

const router = express.Router();
const { Notification, User } = models;

// GET /api/notifications - Get user notifications
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Check if Notification table exists
    if (!Notification) {
      return res.json({
        success: true,
        data: [],
        total: 0,
        unreadCount: 0,
        message: 'Notifications service not available'
      });
    }

    const userId = req.user.userId;
    const {
      page = 1,
      limit = 50,
      unreadOnly = false,
      category = null,
      type = null
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const options = {
      limit: parseInt(limit),
      offset,
      unreadOnly: unreadOnly === 'true',
      category: category || null,
      type: type || null
    };

    const result = await Notification.getUserNotifications(userId, options);

    // Format notifications for frontend
    const notifications = result.rows.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      time: notification.createdAt,
      type: notification.type,
      read: notification.read,
      priority: notification.priority,
      category: notification.category,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
      metadata: notification.metadata,
      user: notification.user
    }));

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.count,
        totalPages: Math.ceil(result.count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty notifications instead of error if table doesn't exist
    res.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      },
      message: 'Notifications service temporarily unavailable'
    });
  }
}));

// GET /api/notifications/unread-count - Get unread notifications count
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب عدد الإشعارات غير المقروءة'
    });
  }
}));

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        [models.sequelize.Sequelize.Op.or]: [
          { userId: userId },
          { userId: null } // System notifications
        ],
        isActive: true
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'تم تحديد الإشعار كمقروء'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديد الإشعار كمقروء'
    });
  }
}));

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;
    const [updatedCount] = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: `تم تحديد ${updatedCount} إشعار كمقروء`,
      updatedCount
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديد جميع الإشعارات كمقروءة'
    });
  }
}));

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        [models.sequelize.Sequelize.Op.or]: [
          { userId: userId },
          { userId: null } // System notifications
        ],
        isActive: true
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود'
      });
    }

    // Soft delete
    notification.isActive = false;
    await notification.save();

    res.json({
      success: true,
      message: 'تم حذف الإشعار'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الإشعار'
    });
  }
}));

// DELETE /api/notifications - Delete all notifications for user
router.delete('/', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;

    const [updatedCount] = await Notification.update(
      { isActive: false },
      {
        where: {
          [models.sequelize.Sequelize.Op.or]: [
            { userId: userId },
            { userId: null }
          ],
          isActive: true
        }
      }
    );

    res.json({
      success: true,
      message: `تم حذف ${updatedCount} إشعار`,
      deletedCount: updatedCount
    });

  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف جميع الإشعارات'
    });
  }
}));

// Note: Test notification endpoint removed for production use

export default router;
