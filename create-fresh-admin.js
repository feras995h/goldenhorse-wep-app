import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function createFreshAdmin() {
  try {
    await client.connect();
    console.log('🔧 إنشاء مستخدم admin جديد تماماً...\n');

    // First, let's see what users exist
    const existingUsers = await client.query(`
      SELECT username, "isActive" FROM users ORDER BY "createdAt"
    `);
    
    console.log('👥 المستخدمون الموجودون:');
    existingUsers.rows.forEach(user => {
      console.log(`  - ${user.username} (${user.isActive ? 'نشط' : 'غير نشط'})`);
    });

    // Create a new admin user with a different username
    const newAdminUsername = 'admin2';
    
    // Check if admin2 already exists
    const existingAdmin2 = await client.query(`
      SELECT id FROM users WHERE username = $1
    `, [newAdminUsername]);

    if (existingAdmin2.rows.length > 0) {
      console.log(`✅ المستخدم ${newAdminUsername} موجود بالفعل`);
    } else {
      // Create new admin user
      const result = await client.query(`
        INSERT INTO users (
          id, username, name, email, password, role, "isActive", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, 'مدير النظام 2', 'admin2@goldenhorse.ly', 
          '123456', 'admin', true, NOW(), NOW()
        ) RETURNING id, username
      `, [newAdminUsername]);

      console.log(`✅ تم إنشاء المستخدم الجديد: ${result.rows[0].username}`);
      console.log(`🆔 معرف المستخدم: ${result.rows[0].id}`);
      console.log('🔑 كلمة المرور: 123456');
    }

    // Test login with the new user
    console.log('\n🧪 اختبار تسجيل الدخول...');
    const testLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: newAdminUsername,
        password: '123456'
      })
    });

    if (testLogin.ok) {
      const loginData = await testLogin.json();
      console.log('✅ تم تسجيل الدخول بنجاح!');
      console.log(`🎫 Token: ${loginData.accessToken.substring(0, 20)}...`);
    } else {
      const errorText = await testLogin.text();
      console.log(`❌ فشل تسجيل الدخول: ${testLogin.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم admin:', error.message);
  } finally {
    await client.end();
  }
}

createFreshAdmin();
