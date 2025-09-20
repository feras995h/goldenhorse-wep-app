import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function createCorrectHash() {
  try {
    await client.connect();
    console.log('🔧 إنشاء hash صحيح لكلمة المرور 123456...\n');

    // This is the correct hash for '123456' using bcrypt
    const correctHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    // Update admin password with correct hash
    await client.query(`
      UPDATE users 
      SET password = $1, "updatedAt" = NOW()
      WHERE username = 'admin'
    `, [correctHash]);

    console.log('✅ تم تحديث كلمة مرور admin');
    console.log('🔑 كلمة المرور: 123456');
    console.log('🔑 التشفير الصحيح: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

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

createCorrectHash();
