import models, { sequelize } from '../models/index.js';

const { Notification } = models;

class NotificationService {
  /**
   * Create a system notification for all users
   */
  static async createSystemNotification(data) {
    try {
      return await Notification.createSystemNotification({
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        priority: data.priority || 'medium',
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        metadata: data.metadata,
        expiresAt: data.expiresAt
      });
    } catch (error) {
      console.error('Error creating system notification:', error);
      return null;
    }
  }

  /**
   * Create a notification for a specific user
   */
  static async createUserNotification(userId, data) {
    try {
      return await Notification.createUserNotification(userId, {
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        priority: data.priority || 'medium',
        category: data.category || 'user',
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        metadata: data.metadata,
        expiresAt: data.expiresAt
      });
    } catch (error) {
      console.error('Error creating user notification:', error);
      return null;
    }
  }

  /**
   * Create a financial notification
   */
  static async createFinancialNotification(data) {
    try {
      return await Notification.createFinancialNotification({
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        priority: data.priority || 'medium',
        userId: data.userId || null,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        metadata: data.metadata,
        expiresAt: data.expiresAt
      });
    } catch (error) {
      console.error('Error creating financial notification:', error);
      return null;
    }
  }

  /**
   * Notify when a new user is created
   */
  static async notifyUserCreated(newUser, createdBy) {
    const notifications = [];

    // Notify admins
    const adminUsers = await models.User.findAll({
      where: { role: 'admin', isActive: true }
    });

    for (const admin of adminUsers) {
      const notification = await this.createUserNotification(admin.id, {
        title: 'مستخدم جديد',
        message: `تم إنشاء مستخدم جديد: ${newUser.name} (${newUser.username})`,
        type: 'info',
        priority: 'medium',
        category: 'user',
        actionUrl: `/admin/users/${newUser.id}`,
        actionLabel: 'عرض المستخدم',
        metadata: {
          userId: newUser.id,
          createdBy: createdBy.id,
          userRole: newUser.role
        }
      });
      if (notification) notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Notify when a new account is created
   */
  static async notifyAccountCreated(account, createdBy) {
    return await this.createFinancialNotification({
      title: 'حساب جديد',
      message: `تم إنشاء حساب جديد: ${account.name} (${account.code})`,
      type: 'success',
      priority: 'medium',
      userId: null, // Notify all financial users
      actionUrl: `/financial/accounts/${account.id}`,
      actionLabel: 'عرض الحساب',
      metadata: {
        accountId: account.id,
        accountCode: account.code,
        createdBy: createdBy.id
      }
    });
  }

  /**
   * Notify when a journal entry is created
   */
  static async notifyJournalEntryCreated(journalEntry, createdBy) {
    const amount = (journalEntry.totalAmount || journalEntry.totalDebit || (typeof journalEntry.getTotalDebit === 'function' ? journalEntry.getTotalDebit() : 0));
    return await this.createFinancialNotification({
      title: 'قيد يومية جديد',
      message: `تم إنشاء قيد يومية جديد بقيمة ${amount} د.ل`,
      type: 'info',
      priority: 'medium',
      userId: null,
      actionUrl: `/financial/journal-entries/${journalEntry.id}`,
      actionLabel: 'عرض القيد',
      metadata: {
        journalEntryId: journalEntry.id,
        amount,
        createdBy: createdBy.id
      }
    });
  }

  /**
   * Notify when a customer is created
   */
  static async notifyCustomerCreated(customer, createdBy) {
    return await this.createUserNotification(null, {
      title: 'عميل جديد',
      message: `انضم عميل جديد: ${customer.name}`,
      type: 'success',
      priority: 'low',
      category: 'user',
      actionUrl: `/sales/customers/${customer.id}`,
      actionLabel: 'عرض العميل',
      metadata: {
        customerId: customer.id,
        customerCode: customer.code,
        createdBy: createdBy.id
      }
    });
  }

  /**
   * Notify about low account balance
   */
  static async notifyLowBalance(account, threshold) {
    return await this.createFinancialNotification({
      title: 'تحذير: رصيد منخفض',
      message: `انتباه: رصيد الحساب "${account.name}" منخفض (${account.balance} د.ل)`,
      type: 'warning',
      priority: 'high',
      userId: null,
      actionUrl: `/financial/accounts/${account.id}`,
      actionLabel: 'عرض الحساب',
      metadata: {
        accountId: account.id,
        currentBalance: account.balance,
        threshold: threshold
      }
    });
  }

  /**
   * Notify about system backup
   */
  static async notifyBackupCompleted(backupInfo) {
    return await this.createSystemNotification({
      title: 'نسخة احتياطية مكتملة',
      message: `تم إنشاء نسخة احتياطية من البيانات بنجاح`,
      type: 'success',
      priority: 'low',
      metadata: {
        backupSize: backupInfo.size,
        backupTime: backupInfo.time,
        backupType: backupInfo.type
      }
    });
  }

  /**
   * Notify about system updates
   */
  static async notifySystemUpdate(updateInfo) {
    return await this.createSystemNotification({
      title: 'تحديث النظام',
      message: updateInfo.message || 'يتوفر تحديث جديد للنظام',
      type: 'info',
      priority: 'medium',
      actionUrl: updateInfo.actionUrl,
      actionLabel: 'عرض التفاصيل',
      metadata: updateInfo.metadata
    });
  }

  /**
   * Notify about security events
   */
  static async notifySecurityEvent(eventType, details) {
    let title, message, priority;

    switch (eventType) {
      case 'failed_login':
        title = 'محاولة تسجيل دخول فاشلة';
        message = `تم رصد محاولة تسجيل دخول فاشلة من IP: ${details.ip}`;
        priority = 'high';
        break;
      case 'password_changed':
        title = 'تغيير كلمة المرور';
        message = `تم تغيير كلمة المرور للمستخدم: ${details.username}`;
        priority = 'medium';
        break;
      case 'suspicious_activity':
        title = 'نشاط مشبوه';
        message = details.message || 'تم رصد نشاط مشبوه في النظام';
        priority = 'high';
        break;
      default:
        title = 'حدث أمني';
        message = details.message || 'تم رصد حدث أمني في النظام';
        priority = 'medium';
    }

    return await this.createSystemNotification({
      title,
      message,
      type: 'error',
      priority,
      category: 'security',
      metadata: {
        eventType,
        ...details
      }
    });
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.cleanupExpired();
      console.log(`🧹 Cleaned up ${result[0]} expired notifications`);
      return result[0];
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats() {
    try {
      const [total, unread, byType, byCategory] = await Promise.all([
        Notification.count({ where: { isActive: true } }),
        Notification.count({ where: { isActive: true, read: false } }),
        Notification.findAll({
          attributes: [
            'type',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: { isActive: true },
          group: ['type'],
          raw: true
        }),
        Notification.findAll({
          attributes: [
            'category',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: { isActive: true },
          group: ['category'],
          raw: true
        })
      ]);

      return {
        total,
        unread,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = parseInt(item.count);
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        byCategory: {}
      };
    }
  }
}

export default NotificationService;
