import models from '../models/index.js';
import NotificationService from '../services/NotificationService.js';

const { Notification } = models;

async function cleanupNotifications() {
  try {
    console.log('🧹 Starting notification cleanup...');

    // Clean up expired notifications
    const expiredCount = await NotificationService.cleanupExpiredNotifications();
    console.log(`✅ Cleaned up ${expiredCount} expired notifications`);

    // Clean up old read notifications (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldReadNotifications = await Notification.update(
      { isActive: false },
      {
        where: {
          read: true,
          readAt: {
            [models.sequelize.Sequelize.Op.lt]: thirtyDaysAgo
          },
          isActive: true
        }
      }
    );

    console.log(`✅ Cleaned up ${oldReadNotifications[0]} old read notifications`);

    // Get notification statistics after cleanup
    const stats = await NotificationService.getNotificationStats();
    console.log('\n📊 Notification Statistics After Cleanup:');
    console.log(`Total active notifications: ${stats.total}`);
    console.log(`Unread notifications: ${stats.unread}`);
    console.log('By type:', stats.byType);
    console.log('By category:', stats.byCategory);

    console.log('\n🎉 Notification cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during notification cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanupNotifications();
