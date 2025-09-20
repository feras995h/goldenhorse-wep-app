import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping'
});

async function checkUsers() {
  try {
    await client.connect();
    console.log('🔍 فحص بيانات المستخدمين...\n');

    const users = await client.query(`
      SELECT id, username, name, email, role, "isActive", "createdAt"
      FROM users
      ORDER BY "createdAt"
    `);

    console.log(`📊 عدد المستخدمين: ${users.rows.length}\n`);

    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.name} (${user.role})`);
      console.log(`   - البريد: ${user.email}`);
      console.log(`   - نشط: ${user.isActive ? 'نعم' : 'لا'}`);
      console.log(`   - تاريخ الإنشاء: ${user.createdAt}`);
      console.log('');
    });

    // Check if admin user exists and is active
    const adminUser = users.rows.find(u => u.username === 'admin');
    if (adminUser) {
      console.log('✅ المستخدم admin موجود');
      console.log(`   - نشط: ${adminUser.isActive ? 'نعم' : 'لا'}`);
      console.log(`   - الدور: ${adminUser.role}`);
    } else {
      console.log('❌ المستخدم admin غير موجود');
    }

  } catch (error) {
    console.error('❌ خطأ في فحص المستخدمين:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
