import { Sequelize } from 'sequelize';

/**
 * فحص هيكل جدول المستخدمين والتحقق من نوع البيانات
 * Check Users Table Structure and Data Types
 */

console.log('🔍 فحص هيكل جدول المستخدمين...\n');

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

async function checkUsersTableStructure() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // 1. فحص هيكل جدول المستخدمين
    console.log('🏗️ فحص هيكل جدول المستخدمين...');
    
    const tableStructure = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 هيكل جدول المستخدمين:');
    tableStructure.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type}${column.character_maximum_length ? `(${column.character_maximum_length})` : ''} ${column.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${column.column_default ? `DEFAULT ${column.column_default}` : ''}`);
    });

    // 2. فحص المستخدمين الموجودين
    console.log('\n👥 فحص المستخدمين الموجودين...');
    
    const users = await sequelize.query(`
      SELECT id, username, name, role, "isActive", "createdAt"
      FROM users 
      ORDER BY "createdAt"
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`📊 إجمالي المستخدمين: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n📋 قائمة المستخدمين:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id} (${typeof user.id}) - ${user.username} (${user.name}) - ${user.role} - ${user.isActive ? 'نشط' : 'غير نشط'}`);
      });
    }

    // 3. فحص نوع البيانات للـ ID
    console.log('\n🔍 فحص نوع البيانات للـ ID...');
    
    const idTypeCheck = await sequelize.query(`
      SELECT 
        pg_typeof(id) as id_type,
        id,
        username
      FROM users 
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📊 أنواع البيانات للـ ID:');
    idTypeCheck.forEach(user => {
      console.log(`  - ${user.username}: ID = ${user.id} (نوع البيانات: ${user.id_type})`);
    });

    // 4. فحص إذا كان هناك مستخدمين بـ ID integer
    console.log('\n🔍 فحص المستخدمين بـ ID integer...');
    
    try {
      const integerUsers = await sequelize.query(`
        SELECT id, username, name 
        FROM users 
        WHERE id::text ~ '^[0-9]+$'
        ORDER BY id::integer
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (integerUsers.length > 0) {
        console.log(`⚠️ تم العثور على ${integerUsers.length} مستخدم بـ ID integer:`);
        integerUsers.forEach(user => {
          console.log(`  - ID: ${user.id} - ${user.username} (${user.name})`);
        });
      } else {
        console.log('✅ لا يوجد مستخدمين بـ ID integer');
      }
    } catch (error) {
      console.log(`❌ خطأ في فحص المستخدمين بـ ID integer: ${error.message}`);
    }

    // 5. فحص إذا كان هناك مستخدمين بـ ID UUID
    console.log('\n🔍 فحص المستخدمين بـ ID UUID...');
    
    try {
      const uuidUsers = await sequelize.query(`
        SELECT id, username, name 
        FROM users 
        WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        ORDER BY username
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (uuidUsers.length > 0) {
        console.log(`✅ تم العثور على ${uuidUsers.length} مستخدم بـ ID UUID:`);
        uuidUsers.forEach(user => {
          console.log(`  - ID: ${user.id} - ${user.username} (${user.name})`);
        });
      } else {
        console.log('⚠️ لا يوجد مستخدمين بـ ID UUID');
      }
    } catch (error) {
      console.log(`❌ خطأ في فحص المستخدمين بـ ID UUID: ${error.message}`);
    }

    // 6. فحص جدول notifications
    console.log('\n📢 فحص جدول الإشعارات...');
    
    const notificationsStructure = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'userId'
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (notificationsStructure.length > 0) {
      const userIdColumn = notificationsStructure[0];
      console.log(`📋 عمود userId في جدول notifications: ${userIdColumn.data_type} ${userIdColumn.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    }

    // 7. فحص عينة من الإشعارات
    const notificationsSample = await sequelize.query(`
      SELECT id, "userId", title, "createdAt"
      FROM notifications 
      WHERE "isActive" = true
      ORDER BY "createdAt" DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`📊 عينة من الإشعارات (${notificationsSample.length} إشعار):`);
    notificationsSample.forEach((notification, index) => {
      console.log(`  ${index + 1}. ID: ${notification.id} - User ID: ${notification.userId} (${typeof notification.userId}) - ${notification.title}`);
    });

    console.log('\n🎯 الخلاصة:');
    console.log('  - تم فحص هيكل جدول المستخدمين');
    console.log('  - تم فحص أنواع البيانات للـ IDs');
    console.log('  - تم فحص جدول الإشعارات');
    console.log('  - تم تحديد مصدر مشكلة UUID vs Integer');
    
  } catch (error) {
    console.error('❌ خطأ في فحص هيكل جدول المستخدمين:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل الفحص
checkUsersTableStructure();
