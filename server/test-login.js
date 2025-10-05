import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: false 
});

async function testLogin() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');

    // البحث عن المستخدم
    const [users] = await sequelize.query(`
      SELECT id, username, password, name, role, "isActive"
      FROM users 
      WHERE username = 'admin';
    `);

    if (users.length === 0) {
      console.log('❌ المستخدم admin غير موجود');
      await sequelize.close();
      return;
    }

    const user = users[0];
    console.log('✅ المستخدم موجود:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    console.log('   Password Hash Length:', user.password.length);
    console.log();

    // اختبار كلمة المرور
    const testPassword = 'admin123';
    console.log('🔐 اختبار كلمة المرور:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ كلمة المرور صحيحة!');
      console.log('\n🎉 يمكنك تسجيل الدخول بنجاح');
    } else {
      console.log('❌ كلمة المرور خاطئة!');
      console.log('\n⚠️  قد تحتاج إلى إعادة إنشاء المستخدم');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ خطأ:', error);
    await sequelize.close();
  }
}

testLogin();
