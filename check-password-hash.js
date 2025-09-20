import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function checkPasswordHash() {
  try {
    await client.connect();
    console.log('🔍 فحص كلمة مرور admin...\n');

    const adminUser = await client.query(`
      SELECT id, username, password, "isActive"
      FROM users WHERE username = 'admin'
    `);

    if (adminUser.rows.length === 0) {
      console.log('❌ المستخدم admin غير موجود');
      return;
    }

    const user = adminUser.rows[0];
    console.log(`👤 المستخدم: ${user.username}`);
    console.log(`🔑 كلمة المرور (مشفرة): ${user.password}`);
    console.log(`✅ نشط: ${user.isActive ? 'نعم' : 'لا'}`);

    // Test different passwords
    const testPasswords = ['admin123', 'admin', 'password', '123456', 'goldenhorse'];
    
    console.log('\n🧪 اختبار كلمات المرور:');
    for (const password of testPasswords) {
      try {
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`${password}: ${isValid ? '✅ صحيح' : '❌ خطأ'}`);
        if (isValid) {
          console.log(`🎉 كلمة المرور الصحيحة هي: ${password}`);
          break;
        }
      } catch (error) {
        console.log(`${password}: ❌ خطأ في التحقق`);
      }
    }

    // If no password works, create a new hash
    console.log('\n🔧 إنشاء كلمة مرور جديدة...');
    const newPassword = 'admin123';
    const newHash = await bcrypt.hash(newPassword, 10);
    
    await client.query(`
      UPDATE users 
      SET password = $1, "updatedAt" = NOW()
      WHERE username = 'admin'
    `, [newHash]);

    console.log(`✅ تم تحديث كلمة مرور admin إلى: ${newPassword}`);
    console.log(`🔑 التشفير الجديد: ${newHash}`);

  } catch (error) {
    console.error('❌ خطأ في فحص كلمة مرور admin:', error.message);
  } finally {
    await client.end();
  }
}

checkPasswordHash();
