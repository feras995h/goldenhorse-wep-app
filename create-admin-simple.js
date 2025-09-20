import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function createAdminSimple() {
  try {
    await client.connect();
    console.log('🔧 إنشاء مستخدم admin جديد...\n');

    // Delete existing admin user
    await client.query(`DELETE FROM users WHERE username = 'admin'`);
    console.log('🗑️ تم حذف المستخدم admin القديم');

    // Create new admin user with simple password
    const result = await client.query(`
      INSERT INTO users (
        id, username, name, email, password, role, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 'admin', 'مدير النظام', 'admin@goldenhorse.ly', 
        'admin123', 'admin', true, NOW(), NOW()
      ) RETURNING id, username
    `);

    console.log(`✅ تم إنشاء المستخدم admin الجديد: ${result.rows[0].username}`);
    console.log(`🆔 معرف المستخدم: ${result.rows[0].id}`);
    console.log('🔑 كلمة المرور: admin123');

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم admin:', error.message);
  } finally {
    await client.end();
  }
}

createAdminSimple();
