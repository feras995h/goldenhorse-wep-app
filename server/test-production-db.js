import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تحميل متغيرات البيئة من المجلد الجذر
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 اختبار شامل لقاعدة البيانات الإنتاج...');

const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;
console.log('🔗 Database URL:', databaseUrl ? databaseUrl.replace(/:[^:@]*@/, ':***@') : 'NOT SET');

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function testProductionDatabase() {
  try {
    console.log('\n🔗 اختبار الاتصال...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات PostgreSQL بنجاح');
    
    // اختبار 1: فحص الجداول الموجودة
    console.log('\n📋 فحص الجداول الموجودة...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`📊 عدد الجداول: ${tables.length}`);
    tables.forEach(table => console.log(`  - ${table.table_name}`));
    
    // اختبار 2: فحص جدول الحسابات
    console.log('\n💰 اختبار جدول الحسابات...');
    try {
      const [accountsResult] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
      const accountsCount = accountsResult[0].count;
      console.log(`✅ عدد الحسابات: ${accountsCount}`);
      
      if (accountsCount < 40) {
        console.log('⚠️  عدد الحسابات قليل - قد تحتاج لاستعادة الحسابات');
      }
      
      // عينة من الحسابات
      const [sampleAccounts] = await sequelize.query(`
        SELECT code, name, type, "isActive" 
        FROM accounts 
        ORDER BY code 
        LIMIT 5
      `);
      
      console.log('📋 عينة من الحسابات:');
      sampleAccounts.forEach(acc => {
        console.log(`  ${acc.code} - ${acc.name} (${acc.type}) - ${acc.isActive ? 'نشط' : 'غير نشط'}`);
      });
      
    } catch (error) {
      console.error('❌ خطأ في جدول الحسابات:', error.message);
    }
    
    // اختبار 3: فحص جدول الإشعارات
    console.log('\n📬 اختبار جدول الإشعارات...');
    try {
      const [notificationsResult] = await sequelize.query('SELECT COUNT(*) as count FROM notifications');
      const notificationsCount = notificationsResult[0].count;
      console.log(`✅ عدد الإشعارات: ${notificationsCount}`);
      
      // اختبار إدراج إشعار تجريبي
      await sequelize.query(`
        INSERT INTO notifications (title, message, type, "userId", "createdAt", "updatedAt")
        VALUES ('اختبار', 'إشعار تجريبي', 'info', NULL, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ اختبار إدراج الإشعارات نجح');
      
    } catch (error) {
      console.error('❌ خطأ في جدول الإشعارات:', error.message);
    }
    
    // اختبار 4: فحص جدول المستخدمين
    console.log('\n👥 اختبار جدول المستخدمين...');
    try {
      const [usersResult] = await sequelize.query('SELECT COUNT(*) as count FROM users');
      const usersCount = usersResult[0].count;
      console.log(`✅ عدد المستخدمين: ${usersCount}`);
      
      const [sampleUsers] = await sequelize.query(`
        SELECT username, role, "isActive" 
        FROM users 
        LIMIT 3
      `);
      
      console.log('📋 عينة من المستخدمين:');
      sampleUsers.forEach(user => {
        console.log(`  ${user.username} (${user.role}) - ${user.isActive ? 'نشط' : 'غير نشط'}`);
      });
      
    } catch (error) {
      console.error('❌ خطأ في جدول المستخدمين:', error.message);
    }
    
    // اختبار 5: فحص جدول الإعدادات
    console.log('\n⚙️  اختبار جدول الإعدادات...');
    try {
      const [settingsResult] = await sequelize.query('SELECT COUNT(*) as count FROM settings');
      const settingsCount = settingsResult[0].count;
      console.log(`✅ عدد الإعدادات: ${settingsCount}`);
      
      // فحص إعدادات الشعار
      const [logoSettings] = await sequelize.query(`
        SELECT key, value 
        FROM settings 
        WHERE key LIKE 'logo%' 
        ORDER BY key
      `);
      
      if (logoSettings.length > 0) {
        console.log('🖼️  إعدادات الشعار:');
        logoSettings.forEach(setting => {
          console.log(`  ${setting.key}: ${setting.value}`);
        });
      } else {
        console.log('⚠️  لا توجد إعدادات شعار');
      }
      
    } catch (error) {
      console.error('❌ خطأ في جدول الإعدادات:', error.message);
    }
    
    // اختبار 6: اختبار استعلام معقد
    console.log('\n🔍 اختبار استعلام معقد...');
    try {
      const [complexResult] = await sequelize.query(`
        SELECT 
          a.type,
          COUNT(*) as count,
          SUM(CAST(a.balance AS DECIMAL)) as total_balance
        FROM accounts a
        WHERE a."isActive" = true
        GROUP BY a.type
        ORDER BY count DESC
      `);
      
      console.log('📊 ملخص الحسابات حسب النوع:');
      complexResult.forEach(row => {
        console.log(`  ${row.type}: ${row.count} حساب، الرصيد الإجمالي: ${row.total_balance || 0} LYD`);
      });
      
    } catch (error) {
      console.error('❌ خطأ في الاستعلام المعقد:', error.message);
    }
    
    console.log('\n🎉 انتهى الاختبار الشامل بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار قاعدة البيانات:', error);
    console.error('تفاصيل الخطأ:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 نصائح لحل المشكلة:');
      console.log('  1. تحقق من صحة عنوان الخادم');
      console.log('  2. تحقق من اتصال الإنترنت');
      console.log('  3. تحقق من إعدادات الجدار الناري');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 نصائح لحل المشكلة:');
      console.log('  1. تحقق من اسم المستخدم وكلمة المرور');
      console.log('  2. تحقق من صلاحيات المستخدم');
    }
    
  } finally {
    await sequelize.close();
    console.log('\n🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

testProductionDatabase();
