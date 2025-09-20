import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function createTestUser() {
  try {
    await client.connect();
    console.log('🔧 إنشاء مستخدم تجريبي للاختبار...\n');

    // Check if test user already exists
    const existingUser = await client.query(`
      SELECT id FROM users WHERE username = 'testuser'
    `);

    if (existingUser.rows.length > 0) {
      console.log('✅ المستخدم testuser موجود بالفعل');
      await client.end();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Create test user
    const result = await client.query(`
      INSERT INTO users (
        id, username, name, email, password, role, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 'testuser', 'مستخدم تجريبي', 'test@goldenhorse.ly', 
        $1, 'admin', true, NOW(), NOW()
      ) RETURNING id, username
    `, [hashedPassword]);

    console.log(`✅ تم إنشاء المستخدم التجريبي: ${result.rows[0].username}`);
    console.log(`🆔 معرف المستخدم: ${result.rows[0].id}`);
    console.log('🔑 كلمة المرور: test123');

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم التجريبي:', error.message);
  } finally {
    await client.end();
  }
}

createTestUser();
