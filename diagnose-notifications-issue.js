import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * تشخيص مشكلة نظام الإشعارات
 * Diagnose Notifications System Issue
 */

console.log('🔍 بدء تشخيص مشكلة نظام الإشعارات...\n');

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

async function diagnoseNotificationsIssue() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // فحص بنية جدول المستخدمين
    console.log('👥 فحص بنية جدول المستخدمين (users)...');
    const usersTableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 أعمدة جدول users:');
    usersTableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // فحص بنية جدول الإشعارات
    console.log('\n🔔 فحص بنية جدول الإشعارات (notifications)...');
    const notificationsTableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 أعمدة جدول notifications:');
    notificationsTableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // فحص العلاقات الخارجية
    console.log('\n🔗 فحص العلاقات الخارجية...');
    const foreignKeys = await sequelize.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'notifications'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 العلاقات الخارجية لجدول notifications:');
    foreignKeys.forEach(fk => {
      console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    // فحص عينة من البيانات
    console.log('\n📊 فحص عينة من بيانات المستخدمين...');
    const usersData = await sequelize.query(`
      SELECT id, username, name, role, "isActive"
      FROM users 
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 عينة من المستخدمين:');
    usersData.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id} (${typeof user.id}) - ${user.username} - ${user.name}`);
    });

    // فحص عينة من بيانات الإشعارات
    console.log('\n🔔 فحص عينة من بيانات الإشعارات...');
    const notificationsData = await sequelize.query(`
      SELECT id, title, "userId", type, "isActive"
      FROM notifications 
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 عينة من الإشعارات:');
    notificationsData.forEach((notification, index) => {
      console.log(`  ${index + 1}. ID: ${notification.id} - UserID: ${notification.userId} (${typeof notification.userId}) - ${notification.title}`);
    });

    // محاولة تشغيل الاستعلام المُشكِل
    console.log('\n🧪 اختبار الاستعلام المُشكِل...');
    try {
      const problematicQuery = await sequelize.query(`
        SELECT count("Notification"."id") AS "count" 
        FROM "notifications" AS "Notification" 
        LEFT OUTER JOIN "users" AS "user" ON "Notification"."userId" = "user"."id" 
        WHERE ("Notification"."expiresAt" IS NULL OR "Notification"."expiresAt" > CURRENT_TIMESTAMP) 
        AND "Notification"."isActive" = true
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('✅ الاستعلام نجح! النتيجة:', problematicQuery[0]);
    } catch (error) {
      console.log('❌ الاستعلام فشل! الخطأ:', error.message);
      
      // محاولة اختبار أنواع البيانات
      console.log('\n🔬 اختبار أنواع البيانات...');
      
      // فحص نوع userId في notifications
      const userIdType = await sequelize.query(`
        SELECT pg_typeof("userId") as user_id_type
        FROM notifications 
        WHERE "userId" IS NOT NULL
        LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (userIdType.length > 0) {
        console.log('📋 نوع userId في notifications:', userIdType[0].user_id_type);
      }
      
      // فحص نوع id في users
      const userIdTypeInUsers = await sequelize.query(`
        SELECT pg_typeof(id) as id_type
        FROM users 
        LIMIT 1
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (userIdTypeInUsers.length > 0) {
        console.log('📋 نوع id في users:', userIdTypeInUsers[0].id_type);
      }
    }

    // فحص الفهارس
    console.log('\n📇 فحص الفهارس...');
    const indexes = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('users', 'notifications')
      ORDER BY tablename, indexname
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 الفهارس:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.tablename}.${idx.indexname}`);
    });

    console.log('\n🎯 تشخيص مكتمل!');
    
  } catch (error) {
    console.error('❌ خطأ في تشخيص مشكلة الإشعارات:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل التشخيص
diagnoseNotificationsIssue();
