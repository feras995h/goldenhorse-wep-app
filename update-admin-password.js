import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function updateAdminPassword() {
  try {
    await client.connect();
    console.log('🔧 تحديث كلمة مرور admin...\n');

    // Update admin password to simple text (for testing)
    await client.query(`
      UPDATE users 
      SET password = 'admin123', "updatedAt" = NOW()
      WHERE username = 'admin'
    `);

    console.log('✅ تم تحديث كلمة مرور admin');
    console.log('🔑 كلمة المرور الجديدة: admin123');

    // Verify the update
    const adminUser = await client.query(`
      SELECT username, password, "isActive"
      FROM users WHERE username = 'admin'
    `);

    if (adminUser.rows.length > 0) {
      const user = adminUser.rows[0];
      console.log(`\n👤 المستخدم: ${user.username}`);
      console.log(`🔑 كلمة المرور: ${user.password}`);
      console.log(`✅ نشط: ${user.isActive ? 'نعم' : 'لا'}`);
    }

  } catch (error) {
    console.error('❌ خطأ في تحديث كلمة مرور admin:', error.message);
  } finally {
    await client.end();
  }
}

updateAdminPassword();
