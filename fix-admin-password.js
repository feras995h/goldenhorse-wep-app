import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function fixAdminPassword() {
  try {
    await client.connect();
    console.log('🔧 إصلاح كلمة مرور admin...\n');

    // Set a simple password hash that matches what the server expects
    // This is the hash for 'admin123' using bcrypt
    const admin123Hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    await client.query(`
      UPDATE users 
      SET password = $1, "updatedAt" = NOW()
      WHERE username = 'admin'
    `, [admin123Hash]);

    console.log('✅ تم تحديث كلمة مرور admin');
    console.log('🔑 كلمة المرور: admin123');
    console.log('🔑 التشفير: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

  } catch (error) {
    console.error('❌ خطأ في إصلاح كلمة مرور admin:', error.message);
  } finally {
    await client.end();
  }
}

fixAdminPassword();
