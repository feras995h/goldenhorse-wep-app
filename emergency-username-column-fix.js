#!/usr/bin/env node

/**
 * إصلاح طارئ: إضافة عمود username المفقود
 * Emergency Fix: Add Missing Username Column - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class EmergencyUsernameFix {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.startTime = Date.now();
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

  async checkCurrentUsersTable() {
    console.log('\n🔍 فحص بنية جدول المستخدمين الحالية...');
    
    try {
      // فحص الأعمدة الموجودة
      const columns = await this.client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);

      console.log('   📊 الأعمدة الموجودة حالياً:');
      columns.rows.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });

      // فحص البيانات الموجودة
      const userCount = await this.client.query('SELECT COUNT(*) as count FROM users');
      console.log(`   👥 عدد المستخدمين الموجودين: ${userCount.rows[0].count}`);

      // فحص عينة من البيانات
      const sampleUsers = await this.client.query('SELECT id, email, "full_name", role FROM users LIMIT 3');
      console.log('   📋 عينة من المستخدمين:');
      sampleUsers.rows.forEach(user => {
        console.log(`     - ID: ${user.id}, Email: ${user.email}, Name: ${user.full_name}, Role: ${user.role}`);
      });

      return {
        hasUsername: columns.rows.some(col => col.column_name === 'username'),
        totalUsers: parseInt(userCount.rows[0].count),
        sampleUsers: sampleUsers.rows
      };

    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول المستخدمين: ${error.message}`);
      return null;
    }
  }

  async addUsernameColumn() {
    console.log('\n🔧 إضافة عمود username...');
    
    try {
      // إضافة عمود username
      await this.client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE
      `);
      
      console.log('   ✅ تم إضافة عمود username بنجاح');

      // تحديث البيانات الموجودة لإنشاء usernames
      console.log('   🔄 تحديث البيانات الموجودة...');

      // الحصول على جميع المستخدمين
      const users = await this.client.query('SELECT id, email, "full_name" FROM users WHERE username IS NULL');
      
      for (const user of users.rows) {
        let username;
        
        // إنشاء username بناءً على البريد الإلكتروني أو الاسم
        if (user.email) {
          username = user.email.split('@')[0].toLowerCase();
        } else if (user.full_name) {
          username = user.full_name.toLowerCase().replace(/\s+/g, '');
        } else {
          username = `user${user.id}`;
        }

        // التأكد من أن username فريد
        let finalUsername = username;
        let counter = 1;
        
        while (true) {
          const existingUser = await this.client.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [finalUsername, user.id]
          );
          
          if (existingUser.rows.length === 0) {
            break;
          }
          
          finalUsername = `${username}${counter}`;
          counter++;
        }

        // تحديث المستخدم
        await this.client.query(
          'UPDATE users SET username = $1 WHERE id = $2',
          [finalUsername, user.id]
        );

        console.log(`     ✅ تم تحديث المستخدم ${user.id}: username = ${finalUsername}`);
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة عمود username: ${error.message}`);
      return false;
    }
  }

  async updateAuthenticationQueries() {
    console.log('\n🔧 تحديث استعلامات المصادقة...');
    
    try {
      // إنشاء دالة مصادقة محدثة تدعم username و email
      await this.client.query(`
        CREATE OR REPLACE FUNCTION authenticate_user_v2(
          p_login VARCHAR(255), 
          p_password VARCHAR(255)
        )
        RETURNS TABLE(
          user_id INTEGER, 
          username VARCHAR(50),
          email VARCHAR(255), 
          full_name TEXT, 
          role VARCHAR(50), 
          is_active BOOLEAN, 
          success BOOLEAN, 
          message TEXT
        ) AS $$
        DECLARE
          user_record RECORD;
          login_attempt_count INTEGER;
        BEGIN
          -- البحث عن المستخدم بـ username أو email
          SELECT * INTO user_record 
          FROM users 
          WHERE (username = p_login OR email = p_login) 
          AND is_active = true;
          
          -- إذا لم يتم العثور على المستخدم
          IF NOT FOUND THEN
            RETURN QUERY SELECT 
              NULL::INTEGER, 
              NULL::VARCHAR(50),
              NULL::VARCHAR(255), 
              NULL::TEXT, 
              NULL::VARCHAR(50), 
              false, 
              false, 
              'المستخدم غير موجود أو غير نشط'::TEXT;
            RETURN;
          END IF;
          
          -- التحقق من كلمة المرور (هنا يجب استخدام bcrypt في التطبيق الفعلي)
          IF user_record.password = p_password THEN
            -- تحديث آخر تسجيل دخول
            UPDATE users 
            SET last_login = NOW() 
            WHERE id = user_record.id;
            
            -- إرجاع بيانات المستخدم
            RETURN QUERY SELECT 
              user_record.id, 
              user_record.username,
              user_record.email, 
              user_record.full_name, 
              user_record.role, 
              user_record.is_active, 
              true, 
              'تم تسجيل الدخول بنجاح'::TEXT;
          ELSE
            -- كلمة مرور خاطئة
            RETURN QUERY SELECT 
              NULL::INTEGER, 
              NULL::VARCHAR(50),
              NULL::VARCHAR(255), 
              NULL::TEXT, 
              NULL::VARCHAR(50), 
              false, 
              false, 
              'كلمة المرور غير صحيحة'::TEXT;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `);

      console.log('   ✅ تم إنشاء دالة المصادقة المحدثة');

      // اختبار الدالة الجديدة
      console.log('   🧪 اختبار دالة المصادقة الجديدة...');
      
      const testResult = await this.client.query(`
        SELECT * FROM authenticate_user_v2('admin', 'admin123')
      `);

      if (testResult.rows.length > 0) {
        const result = testResult.rows[0];
        console.log(`   ${result.success ? '✅' : '❌'} اختبار المصادقة: ${result.message}`);
        if (result.success) {
          console.log(`     👤 المستخدم: ${result.username} (${result.email})`);
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل تحديث استعلامات المصادقة: ${error.message}`);
      return false;
    }
  }

  async verifyFix() {
    console.log('\n✅ التحقق من الإصلاح...');
    
    try {
      // التحقق من وجود عمود username
      const columnCheck = await this.client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
      `);

      if (columnCheck.rows.length === 0) {
        console.log('   ❌ عمود username غير موجود');
        return false;
      }

      console.log('   ✅ عمود username موجود');

      // التحقق من البيانات
      const usersWithUsername = await this.client.query(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE username IS NOT NULL AND username != ''
      `);

      console.log(`   ✅ المستخدمين مع username: ${usersWithUsername.rows[0].count}`);

      // اختبار استعلام تسجيل الدخول الأصلي
      try {
        const loginTest = await this.client.query(`
          SELECT id, username, email, "full_name", role, is_active 
          FROM users 
          WHERE username = 'admin' AND is_active = true
        `);

        if (loginTest.rows.length > 0) {
          console.log('   ✅ استعلام تسجيل الدخول يعمل بنجاح');
          console.log(`     👤 تم العثور على المستخدم: ${loginTest.rows[0].username}`);
          return true;
        } else {
          console.log('   ⚠️ لم يتم العثور على مستخدم admin');
          return false;
        }
      } catch (queryError) {
        console.log(`   ❌ فشل اختبار استعلام تسجيل الدخول: ${queryError.message}`);
        return false;
      }

    } catch (error) {
      console.log(`   ❌ خطأ في التحقق من الإصلاح: ${error.message}`);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runEmergencyFix() {
    console.log('🚨 بدء الإصلاح الطارئ لعمود username المفقود...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح مشكلة تسجيل الدخول');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // فحص الوضع الحالي
      const currentState = await this.checkCurrentUsersTable();
      if (!currentState) {
        console.log('❌ فشل في فحص جدول المستخدمين');
        return false;
      }

      if (currentState.hasUsername) {
        console.log('✅ عمود username موجود مسبقاً - لا حاجة للإصلاح');
        return true;
      }

      // إضافة عمود username
      const usernameAdded = await this.addUsernameColumn();
      if (!usernameAdded) {
        console.log('❌ فشل في إضافة عمود username');
        return false;
      }

      // تحديث استعلامات المصادقة
      const authUpdated = await this.updateAuthenticationQueries();
      if (!authUpdated) {
        console.log('❌ فشل في تحديث استعلامات المصادقة');
        return false;
      }

      // التحقق من الإصلاح
      const fixVerified = await this.verifyFix();
      if (!fixVerified) {
        console.log('❌ فشل في التحقق من الإصلاح');
        return false;
      }

      console.log('\n🎉 تم الإصلاح الطارئ بنجاح!');
      console.log('✅ يمكن الآن تسجيل الدخول بنجاح');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في الإصلاح الطارئ:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل الإصلاح الطارئ
const emergencyFix = new EmergencyUsernameFix();
emergencyFix.runEmergencyFix().then(success => {
  if (success) {
    console.log('\n🎊 تم الإصلاح الطارئ بنجاح! يمكن الآن استخدام النظام بشكل طبيعي.');
    process.exit(0);
  } else {
    console.log('\n❌ فشل الإصلاح الطارئ - يرجى المراجعة اليدوية');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل الإصلاح الطارئ:', error);
  process.exit(1);
});
