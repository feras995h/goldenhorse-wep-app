import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: false 
});

/**
 * سكريبت إنشاء مستخدم admin افتراضي
 */
async function createAdminUser() {
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بنجاح\n');

    console.log('👤 إنشاء مستخدم admin...\n');

    // التحقق من وجود المستخدم
    const [existingUsers] = await sequelize.query(`
      SELECT * FROM users WHERE username = 'admin';
    `);

    if (existingUsers.length > 0) {
      console.log('⚠️  المستخدم admin موجود بالفعل');
      console.log('   ID:', existingUsers[0].id);
      console.log('   Username:', existingUsers[0].username);
      console.log('   Role:', existingUsers[0].role);
      console.log('\n✅ لا حاجة لإنشاء مستخدم جديد');
      await sequelize.close();
      return;
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // إنشاء المستخدم
    await sequelize.query(`
      INSERT INTO users (
        username, 
        email, 
        password, 
        name, 
        role, 
        "isActive",
        "createdAt",
        "updatedAt"
      ) VALUES (
        'admin',
        'admin@goldenhorse.ly',
        '${hashedPassword}',
        'مدير النظام',
        'admin',
        true,
        NOW(),
        NOW()
      );
    `);

    console.log('✅ تم إنشاء مستخدم admin بنجاح!\n');
    console.log('📋 معلومات المستخدم:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@goldenhorse.ly');
    console.log('   Role: admin');
    console.log('   Name: مدير النظام');
    console.log('\n🔐 يمكنك الآن تسجيل الدخول بهذه البيانات');

    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ خطأ في إنشاء المستخدم:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// تشغيل السكريبت
createAdminUser();
