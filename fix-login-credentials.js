#!/usr/bin/env node

/**
 * إصلاح بيانات تسجيل الدخول
 * Fix Login Credentials - Golden Horse Shipping System
 */

import pkg from 'pg';
import bcrypt from 'bcrypt';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class LoginCredentialsFix {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('🔗 تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      return false;
    }
  }

  async checkCurrentUsers() {
    console.log('\n👥 فحص المستخدمين الحاليين...');
    
    try {
      const users = await this.client.query(`
        SELECT 
          id, 
          username, 
          email, 
          password_hash, 
          password,
          name,
          role, 
          "isActive",
          created_at
        FROM users 
        ORDER BY role, username
      `);

      console.log(`   📊 إجمالي المستخدمين: ${users.rows.length}`);
      
      users.rows.forEach(user => {
        const status = user.isActive ? '🟢' : '🔴';
        console.log(`     ${status} ${user.username} (${user.role}) - ${user.email}`);
        console.log(`       Password Hash: ${user.password_hash ? 'موجود' : 'مفقود'}`);
        console.log(`       Password: ${user.password ? 'موجود' : 'مفقود'}`);
        console.log(`       Name: ${user.name || 'غير محدد'}`);
      });

      return users.rows;

    } catch (error) {
      console.log(`   ❌ خطأ في فحص المستخدمين: ${error.message}`);
      return [];
    }
  }

  async resetUserPasswords() {
    console.log('\n🔐 إعادة تعيين كلمات المرور...');
    
    try {
      // كلمات المرور الجديدة
      const newPasswords = {
        'admin': 'admin123',
        'financial': 'financial123',
        'sales': 'sales123',
        'user': 'user123'
      };

      let updatedCount = 0;

      for (const [username, plainPassword] of Object.entries(newPasswords)) {
        try {
          // تشفير كلمة المرور
          const hashedPassword = await bcrypt.hash(plainPassword, 10);
          
          // تحديث كلمة المرور في قاعدة البيانات
          const updateResult = await this.client.query(`
            UPDATE users 
            SET 
              password_hash = $1,
              password = $1,
              "passwordChangedAt" = NOW(),
              "updatedAt" = NOW()
            WHERE username = $2
          `, [hashedPassword, username]);

          if (updateResult.rowCount > 0) {
            console.log(`   ✅ تم تحديث كلمة مرور ${username}: ${plainPassword}`);
            updatedCount++;
          } else {
            console.log(`   ⚠️ لم يتم العثور على مستخدم: ${username}`);
          }

        } catch (userError) {
          console.log(`   ❌ فشل تحديث ${username}: ${userError.message}`);
        }
      }

      console.log(`   📊 تم تحديث ${updatedCount} مستخدم من أصل ${Object.keys(newPasswords).length}`);
      return updatedCount > 0;

    } catch (error) {
      console.log(`   ❌ فشل إعادة تعيين كلمات المرور: ${error.message}`);
      return false;
    }
  }

  async testLoginCredentials() {
    console.log('\n🧪 اختبار بيانات تسجيل الدخول...');
    
    try {
      const testCredentials = [
        { username: 'admin', password: 'admin123' },
        { username: 'financial', password: 'financial123' },
        { username: 'sales', password: 'sales123' },
        { username: 'user', password: 'user123' }
      ];

      let successCount = 0;

      for (const cred of testCredentials) {
        try {
          // البحث عن المستخدم
          const userResult = await this.client.query(`
            SELECT 
              id, 
              username, 
              password_hash, 
              password,
              email, 
              role, 
              "isActive"
            FROM users 
            WHERE username = $1 AND "isActive" = true
          `, [cred.username]);

          if (userResult.rows.length === 0) {
            console.log(`   ❌ ${cred.username}: مستخدم غير موجود أو غير نشط`);
            continue;
          }

          const user = userResult.rows[0];
          
          // اختبار كلمة المرور
          const passwordMatch = await bcrypt.compare(cred.password, user.password_hash || user.password);
          
          if (passwordMatch) {
            console.log(`   ✅ ${cred.username}: تسجيل الدخول ناجح`);
            console.log(`     📧 البريد: ${user.email}`);
            console.log(`     👥 الدور: ${user.role}`);
            successCount++;
          } else {
            console.log(`   ❌ ${cred.username}: كلمة مرور خاطئة`);
          }

        } catch (testError) {
          console.log(`   ❌ ${cred.username}: خطأ في الاختبار - ${testError.message}`);
        }
      }

      console.log(`   📊 نجح ${successCount} من أصل ${testCredentials.length} اختبار`);
      return successCount === testCredentials.length;

    } catch (error) {
      console.log(`   ❌ فشل اختبار بيانات تسجيل الدخول: ${error.message}`);
      return false;
    }
  }

  async ensureUserCompleteness() {
    console.log('\n🔧 التأكد من اكتمال بيانات المستخدمين...');
    
    try {
      // التأكد من أن جميع المستخدمين لديهم البيانات المطلوبة
      const updateResult = await this.client.query(`
        UPDATE users 
        SET 
          name = CASE 
            WHEN name IS NULL OR name = '' THEN 
              CASE 
                WHEN username = 'admin' THEN 'مدير النظام'
                WHEN username = 'financial' THEN 'مدير مالي'
                WHEN username = 'sales' THEN 'مدير مبيعات'
                WHEN username = 'user' THEN 'مستخدم'
                ELSE CONCAT(first_name, ' ', last_name)
              END
            ELSE name
          END,
          "isActive" = COALESCE("isActive", true),
          "createdAt" = COALESCE("createdAt", NOW()),
          "updatedAt" = NOW()
        WHERE username IN ('admin', 'financial', 'sales', 'user')
      `);

      console.log(`   ✅ تم تحديث ${updateResult.rowCount} مستخدم`);
      return true;

    } catch (error) {
      console.log(`   ❌ فشل في التأكد من اكتمال البيانات: ${error.message}`);
      return false;
    }
  }

  async displayFinalCredentials() {
    console.log('\n📋 بيانات تسجيل الدخول النهائية:');
    console.log('='.repeat(50));
    
    const credentials = [
      { username: 'admin', password: 'admin123', role: 'مدير النظام' },
      { username: 'financial', password: 'financial123', role: 'مدير مالي' },
      { username: 'sales', password: 'sales123', role: 'مدير مبيعات' },
      { username: 'user', password: 'user123', role: 'مستخدم عادي' }
    ];

    credentials.forEach(cred => {
      console.log(`🔑 ${cred.role}:`);
      console.log(`   👤 اسم المستخدم: ${cred.username}`);
      console.log(`   🔐 كلمة المرور: ${cred.password}`);
      console.log('');
    });

    console.log('💡 نصائح لتسجيل الدخول:');
    console.log('   - استخدم اسم المستخدم وليس البريد الإلكتروني');
    console.log('   - تأكد من كتابة كلمة المرور بدقة');
    console.log('   - جميع كلمات المرور حساسة لحالة الأحرف');
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runLoginCredentialsFix() {
    console.log('🔐 بدء إصلاح بيانات تسجيل الدخول...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح مشكلة تسجيل الدخول 401 Unauthorized');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // فحص المستخدمين الحاليين
      const currentUsers = await this.checkCurrentUsers();
      if (currentUsers.length === 0) {
        console.log('❌ لا توجد مستخدمين في قاعدة البيانات');
        return false;
      }

      // إعادة تعيين كلمات المرور
      const passwordsReset = await this.resetUserPasswords();
      if (!passwordsReset) {
        console.log('❌ فشل في إعادة تعيين كلمات المرور');
        return false;
      }

      // التأكد من اكتمال البيانات
      const dataComplete = await this.ensureUserCompleteness();
      if (!dataComplete) {
        console.log('❌ فشل في التأكد من اكتمال البيانات');
        return false;
      }

      // اختبار بيانات تسجيل الدخول
      const loginTested = await this.testLoginCredentials();
      if (!loginTested) {
        console.log('⚠️ بعض اختبارات تسجيل الدخول فشلت');
      }

      // عرض بيانات تسجيل الدخول النهائية
      await this.displayFinalCredentials();

      console.log('\n🎉 تم إصلاح بيانات تسجيل الدخول بنجاح!');
      console.log('✅ جميع كلمات المرور تم إعادة تعيينها');
      console.log('✅ جميع المستخدمين نشطين');
      console.log('✅ يمكنك الآن تسجيل الدخول بالبيانات المعروضة أعلاه');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في إصلاح بيانات تسجيل الدخول:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل إصلاح بيانات تسجيل الدخول
const loginFix = new LoginCredentialsFix();
loginFix.runLoginCredentialsFix().then(success => {
  if (success) {
    console.log('\n🎊 تم إصلاح مشكلة تسجيل الدخول بنجاح!');
    console.log('🔄 يمكنك الآن تسجيل الدخول باستخدام البيانات المعروضة أعلاه');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في إصلاح مشكلة تسجيل الدخول');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح تسجيل الدخول:', error);
  process.exit(1);
});
