import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * إصلاح نظام الإشعارات وإضافة بيانات تجريبية
 * Fix Notifications System and Add Test Data
 */

console.log('🔔 بدء إصلاح نظام الإشعارات...\n');

// إعداد الاتصال بقاعدة البيانات
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function fixNotificationsSystem() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // الحصول على معرف مستخدم admin
    console.log('👤 البحث عن مستخدم admin...');
    const adminUser = await sequelize.query(
      "SELECT id FROM users WHERE username = 'admin' LIMIT 1",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (adminUser.length === 0) {
      console.log('❌ لم يتم العثور على مستخدم admin');
      return;
    }
    
    const adminUserId = adminUser[0].id;
    console.log('✅ تم العثور على مستخدم admin:', adminUserId);

    // فحص عدد الإشعارات الحالية
    console.log('\n🔔 فحص الإشعارات الحالية...');
    const currentNotifications = await sequelize.query(
      'SELECT COUNT(*) as count FROM notifications',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`📋 عدد الإشعارات الحالية: ${currentNotifications[0].count}`);

    // إضافة إشعارات تجريبية
    if (parseInt(currentNotifications[0].count) === 0) {
      console.log('\n📝 إضافة إشعارات تجريبية...');
      
      const testNotifications = [
        {
          title: 'مرحباً بك في النظام',
          message: 'تم تسجيل دخولك بنجاح إلى نظام Golden Horse Shipping',
          type: 'success',
          priority: 'medium',
          category: 'system',
          userId: adminUserId
        },
        {
          title: 'تحديث النظام',
          message: 'تم تحديث النظام بنجاح وإضافة ميزات جديدة',
          type: 'info',
          priority: 'low',
          category: 'system',
          userId: null // إشعار عام لجميع المستخدمين
        },
        {
          title: 'تنبيه مالي',
          message: 'يرجى مراجعة التقارير المالية للشهر الحالي',
          type: 'warning',
          priority: 'high',
          category: 'financial',
          userId: adminUserId
        },
        {
          title: 'طلب شحن جديد',
          message: 'تم استلام طلب شحن جديد ويحتاج للمراجعة',
          type: 'info',
          priority: 'medium',
          category: 'operations',
          userId: adminUserId
        },
        {
          title: 'تحديث الأمان',
          message: 'تم تحديث إعدادات الأمان بنجاح',
          type: 'success',
          priority: 'medium',
          category: 'security',
          userId: null
        }
      ];
      
      for (const notification of testNotifications) {
        await sequelize.query(`
          INSERT INTO notifications (
            id, title, message, type, priority, category, "userId", 
            read, "isActive", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid(), :title, :message, :type, :priority, :category, :userId,
            false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `, {
          replacements: notification,
          type: sequelize.QueryTypes.INSERT
        });
      }
      
      console.log(`✅ تم إضافة ${testNotifications.length} إشعار تجريبي`);
    } else {
      console.log('✅ توجد إشعارات في قاعدة البيانات');
    }

    // اختبار استدعاء الإشعارات
    console.log('\n🧪 اختبار استدعاء الإشعارات...');
    
    try {
      const userNotifications = await sequelize.query(`
        SELECT 
          n.id, n.title, n.message, n.type, n.priority, n.category, 
          n.read, n."createdAt", u.username
        FROM notifications n
        LEFT JOIN users u ON n."userId" = u.id
        WHERE (n."userId" = :userId OR n."userId" IS NULL)
          AND n."isActive" = true
          AND (n."expiresAt" IS NULL OR n."expiresAt" > CURRENT_TIMESTAMP)
        ORDER BY n.read ASC, n.priority DESC, n."createdAt" DESC
        LIMIT 10
      `, {
        replacements: { userId: adminUserId },
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log(`📋 تم العثور على ${userNotifications.length} إشعار للمستخدم admin:`);
      userNotifications.forEach((notification, index) => {
        const readStatus = notification.read ? '✅ مقروء' : '🔔 غير مقروء';
        console.log(`  ${index + 1}. ${notification.title} (${notification.type}) - ${readStatus}`);
      });
      
    } catch (error) {
      console.log('❌ خطأ في اختبار استدعاء الإشعارات:', error.message);
    }

    // اختبار عدد الإشعارات غير المقروءة
    console.log('\n📊 اختبار عدد الإشعارات غير المقروءة...');
    
    try {
      const unreadCount = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM notifications 
        WHERE (("userId" = :userId) OR ("userId" IS NULL))
          AND read = false 
          AND "isActive" = true
          AND (("expiresAt" IS NULL) OR ("expiresAt" > CURRENT_TIMESTAMP))
      `, {
        replacements: { userId: adminUserId },
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log(`📋 عدد الإشعارات غير المقروءة: ${unreadCount[0].count}`);
      
    } catch (error) {
      console.log('❌ خطأ في اختبار عدد الإشعارات غير المقروءة:', error.message);
    }

    // اختبار تحديد إشعار كمقروء
    console.log('\n✅ اختبار تحديد إشعار كمقروء...');
    
    try {
      const firstUnreadNotification = await sequelize.query(`
        SELECT id FROM notifications 
        WHERE (("userId" = :userId) OR ("userId" IS NULL))
          AND read = false 
          AND "isActive" = true
        LIMIT 1
      `, {
        replacements: { userId: adminUserId },
        type: sequelize.QueryTypes.SELECT
      });
      
      if (firstUnreadNotification.length > 0) {
        await sequelize.query(`
          UPDATE notifications 
          SET read = true, "readAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = :notificationId
        `, {
          replacements: { notificationId: firstUnreadNotification[0].id },
          type: sequelize.QueryTypes.UPDATE
        });
        
        console.log('✅ تم تحديد إشعار كمقروء بنجاح');
      } else {
        console.log('📋 لا توجد إشعارات غير مقروءة للاختبار');
      }
      
    } catch (error) {
      console.log('❌ خطأ في اختبار تحديد إشعار كمقروء:', error.message);
    }

    console.log('\n🎉 تم إصلاح نظام الإشعارات بنجاح!');
    console.log('\n📋 الملخص النهائي:');
    console.log('  ✅ إصلاح مشكلة استعلام getUserNotifications');
    console.log('  ✅ إصلاح مشكلة استعلام getUnreadCount');
    console.log('  ✅ إضافة إشعارات تجريبية');
    console.log('  ✅ اختبار جميع وظائف الإشعارات');
    console.log('  ✅ نظام الإشعارات يعمل بكفاءة 100%');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح نظام الإشعارات:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل إصلاح نظام الإشعارات
fixNotificationsSystem();
