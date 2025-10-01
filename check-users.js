/**
 * Check Users - التحقق من المستخدمين
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkUsers() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });

  try {
    console.log('\n🔍 التحقق من المستخدمين...\n');
    await client.connect();

    // التحقق من وجود جدول المستخدمين
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ جدول users غير موجود!\n');
      return;
    }

    // عرض جميع المستخدمين
    const users = await client.query(`
      SELECT id, username, email, role, "isActive", "createdAt"
      FROM users
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);

    if (users.rows.length === 0) {
      console.log('⚠️  لا يوجد مستخدمين في قاعدة البيانات!\n');
      console.log('💡 هل تريد إنشاء مستخدم admin؟\n');
    } else {
      console.log('📊 المستخدمين الموجودين:\n');
      console.table(users.rows);
      
      // التحقق من وجود admin
      const adminUser = users.rows.find(u => u.username === 'admin' || u.role === 'admin');
      if (adminUser) {
        console.log('\n✅ يوجد مستخدم admin:');
        console.log(`   Username: ${adminUser.username}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Active: ${adminUser.isActive}`);
      } else {
        console.log('\n⚠️  لا يوجد مستخدم admin!');
      }
    }

    // إحصائيات
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "isActive" = true) as active,
        COUNT(*) FILTER (WHERE role = 'admin') as admins
      FROM users
    `);

    console.log('\n📊 إحصائيات المستخدمين:');
    console.table(stats.rows);

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 تم إغلاق الاتصال\n');
  }
}

checkUsers();
