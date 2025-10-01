/**
 * Test User Query - اختبار استعلام المستخدم
 */

import models from './server/src/models/index.js';
const { User } = models;

async function testUserQuery() {
  try {
    console.log('\n🔍 البحث عن المستخدم admin...\n');

    // البحث بنفس الطريقة التي يستخدمها auth.js
    const user = await User.findOne({
      where: { username: 'admin', isActive: true }
    });

    if (user) {
      console.log('✅ تم العثور على المستخدم:');
      console.log({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password,
        passwordLength: user.password?.length
      });
    } else {
      console.log('❌ لم يتم العثور على المستخدم!');
      
      // جرب بدون isActive
      const userWithoutActive = await User.findOne({
        where: { username: 'admin' }
      });
      
      if (userWithoutActive) {
        console.log('\n⚠️  المستخدم موجود لكن isActive = false:');
        console.log({
          username: userWithoutActive.username,
          isActive: userWithoutActive.isActive
        });
      } else {
        console.log('\n❌ المستخدم غير موجود في جدول users');
        
        // عرض جميع المستخدمين
        const allUsers = await User.findAll({ limit: 5 });
        console.log('\n📊 جميع المستخدمين:');
        console.table(allUsers.map(u => ({
          username: u.username,
          email: u.email,
          isActive: u.isActive
        })));
      }
    }

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testUserQuery();
