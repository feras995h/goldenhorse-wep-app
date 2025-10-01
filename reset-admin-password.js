/**
 * Reset Admin Password - إعادة تعيين كلمة مرور المدير
 */

import pg from 'pg';
import bcrypt from './server/node_modules/bcryptjs/index.js';
const { Client } = pg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function resetAdminPassword() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });

  try {
    console.log('\n🔐 إعادة تعيين كلمة مرور admin...\n');
    await client.connect();

    // كلمة المرور الجديدة
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // تحديث كلمة المرور
    const result = await client.query(`
      UPDATE users 
      SET password = $1, "updatedAt" = NOW()
      WHERE username = 'admin'
      RETURNING id, username, email, role
    `, [hashedPassword]);

    if (result.rows.length > 0) {
      console.log('✅ تم تحديث كلمة المرور بنجاح!\n');
      console.log('📊 معلومات المستخدم:');
      console.table(result.rows);
      console.log('\n🔑 معلومات تسجيل الدخول:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   أو');
      console.log('   Email: admin@goldenhorse.com');
      console.log('   Password: admin123\n');
    } else {
      console.log('❌ لم يتم العثور على مستخدم admin!\n');
    }

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
  } finally {
    await client.end();
    console.log('🔌 تم إغلاق الاتصال\n');
  }
}

resetAdminPassword();
