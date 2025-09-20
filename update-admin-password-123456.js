import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function updateAdminPassword() {
  try {
    await client.connect();
    console.log('🔧 تحديث كلمة مرور admin إلى 123456...\n');

    // This is the hash for '123456' using bcrypt with salt rounds 12
    const password123456Hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QjK.2a';
    
    // Update admin password with hash for '123456'
    await client.query(`
      UPDATE users 
      SET password = $1, "updatedAt" = NOW()
      WHERE username = 'admin'
    `, [password123456Hash]);

    console.log('✅ تم تحديث كلمة مرور admin');
    console.log('🔑 كلمة المرور: 123456');
    console.log('🔑 التشفير: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QjK.2a');

    // Verify the update
    const adminUser = await client.query(`
      SELECT username, password, "isActive"
      FROM users WHERE username = 'admin'
    `);

    if (adminUser.rows.length > 0) {
      const user = adminUser.rows[0];
      console.log(`\n👤 المستخدم: ${user.username}`);
      console.log(`🔑 كلمة المرور (مشفرة): ${user.password}`);
      console.log(`✅ نشط: ${user.isActive ? 'نعم' : 'لا'}`);
    }

  } catch (error) {
    console.error('❌ خطأ في تحديث كلمة مرور admin:', error.message);
  } finally {
    await client.end();
  }
}

updateAdminPassword();
