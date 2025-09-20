import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function createAdminWithBcrypt() {
  try {
    await client.connect();
    console.log('🔧 إنشاء مستخدم admin مع bcrypt...\n');

    // This is the hash for '123456' using bcrypt
    const passwordHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    // Update admin2 password with proper hash
    await client.query(`
      UPDATE users 
      SET password = $1, "updatedAt" = NOW()
      WHERE username = 'admin2'
    `, [passwordHash]);

    console.log('✅ تم تحديث كلمة مرور admin2');
    console.log('🔑 كلمة المرور: 123456');
    console.log('🔑 التشفير: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

    // Test login with the updated user
    console.log('\n🧪 اختبار تسجيل الدخول...');
    const testLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin2',
        password: '123456'
      })
    });

    if (testLogin.ok) {
      const loginData = await testLogin.json();
      console.log('✅ تم تسجيل الدخول بنجاح!');
      console.log(`🎫 Token: ${loginData.accessToken.substring(0, 20)}...`);
      
      // Now test the shipments API
      console.log('\n📦 اختبار API الشحنات...');
      const shipmentsResponse = await fetch('http://localhost:5000/api/sales/shipments?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${loginData.accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (shipmentsResponse.ok) {
        const shipmentsData = await shipmentsResponse.json();
        console.log(`✅ تم جلب الشحنات بنجاح: ${shipmentsData.data.length} شحنة`);
      } else {
        const errorText = await shipmentsResponse.text();
        console.log(`❌ خطأ في جلب الشحنات: ${shipmentsResponse.status} - ${errorText}`);
      }
      
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

createAdminWithBcrypt();
