import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function checkAdminPassword() {
  try {
    await client.connect();
    console.log('🔍 فحص كلمة مرور المستخدم admin...\n');

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

    // Try to update admin password to a known value
    console.log('\n🔧 تحديث كلمة مرور admin...');
    const newPassword = 'admin123'; // Simple password for testing
    
    await client.query(`
      UPDATE users 
      SET password = $1, "updatedAt" = NOW()
      WHERE username = 'admin'
    `, [newPassword]);

    console.log('✅ تم تحديث كلمة مرور admin إلى: admin123');

  } catch (error) {
    console.error('❌ خطأ في فحص كلمة مرور admin:', error.message);
  } finally {
    await client.end();
  }
}

checkAdminPassword();
