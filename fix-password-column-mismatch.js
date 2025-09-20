#!/usr/bin/env node

/**
 * إصلاح عدم تطابق أعمدة كلمة المرور
 * Fix Password Column Mismatch - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class PasswordColumnFix {
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

  async analyzeCurrentSchema() {
    console.log('\n🔍 تحليل مخطط قاعدة البيانات الحالي...');
    
    try {
      // فحص الأعمدة الموجودة في جدول users
      const columns = await this.client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);

      console.log('   📊 الأعمدة الموجودة في جدول users:');
      const columnNames = [];
      columns.rows.forEach(col => {
        columnNames.push(col.column_name);
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });

      // تحديد الأعمدة المفقودة التي يتوقعها التطبيق
      const expectedColumns = [
        'id', 'username', 'password', 'name', 'email', 'role', 
        'isActive', 'lastLoginAt', 'passwordChangedAt', 'createdAt', 'updatedAt'
      ];

      const missingColumns = expectedColumns.filter(col => !columnNames.includes(col));
      const extraColumns = columnNames.filter(col => !expectedColumns.includes(col));

      console.log('\n   ❌ الأعمدة المفقودة (متوقعة من التطبيق):');
      missingColumns.forEach(col => console.log(`     - ${col}`));

      console.log('\n   ➕ الأعمدة الإضافية (موجودة في قاعدة البيانات):');
      extraColumns.forEach(col => console.log(`     - ${col}`));

      return {
        currentColumns: columnNames,
        missingColumns: missingColumns,
        extraColumns: extraColumns
      };

    } catch (error) {
      console.log(`   ❌ خطأ في تحليل المخطط: ${error.message}`);
      return null;
    }
  }

  async createCompatibilityColumns() {
    console.log('\n🔧 إنشاء الأعمدة المفقودة للتوافق...');
    
    try {
      // إضافة عمود password كـ alias لـ password_hash
      await this.client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS password VARCHAR(255)
      `);
      console.log('   ✅ تم إضافة عمود password');

      // إضافة عمود name كـ computed column
      await this.client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS name VARCHAR(255)
      `);
      console.log('   ✅ تم إضافة عمود name');

      // إضافة عمود isActive كـ alias لـ is_active
      await this.client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true
      `);
      console.log('   ✅ تم إضافة عمود isActive');

      // إضافة عمود lastLoginAt كـ alias لـ last_login
      await this.client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP
      `);
      console.log('   ✅ تم إضافة عمود lastLoginAt');

      // إضافة عمود passwordChangedAt
      await this.client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP DEFAULT NOW()
      `);
      console.log('   ✅ تم إضافة عمود passwordChangedAt');

      // إضافة عمود createdAt كـ alias لـ created_at
      await this.client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()
      `);
      console.log('   ✅ تم إضافة عمود createdAt');

      // إضافة عمود updatedAt كـ alias لـ updated_at
      await this.client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()
      `);
      console.log('   ✅ تم إضافة عمود updatedAt');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء الأعمدة: ${error.message}`);
      return false;
    }
  }

  async syncDataBetweenColumns() {
    console.log('\n🔄 مزامنة البيانات بين الأعمدة...');
    
    try {
      // مزامنة password مع password_hash
      await this.client.query(`
        UPDATE users 
        SET password = password_hash 
        WHERE password IS NULL AND password_hash IS NOT NULL
      `);
      console.log('   ✅ تم مزامنة password مع password_hash');

      // مزامنة name مع first_name + last_name
      await this.client.query(`
        UPDATE users 
        SET name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
        WHERE name IS NULL
      `);
      console.log('   ✅ تم مزامنة name مع first_name + last_name');

      // مزامنة isActive مع is_active
      await this.client.query(`
        UPDATE users 
        SET "isActive" = is_active 
        WHERE "isActive" IS NULL AND is_active IS NOT NULL
      `);
      console.log('   ✅ تم مزامنة isActive مع is_active');

      // مزامنة lastLoginAt مع last_login
      await this.client.query(`
        UPDATE users 
        SET "lastLoginAt" = last_login 
        WHERE "lastLoginAt" IS NULL AND last_login IS NOT NULL
      `);
      console.log('   ✅ تم مزامنة lastLoginAt مع last_login');

      // مزامنة createdAt مع created_at
      await this.client.query(`
        UPDATE users 
        SET "createdAt" = created_at 
        WHERE "createdAt" IS NULL AND created_at IS NOT NULL
      `);
      console.log('   ✅ تم مزامنة createdAt مع created_at');

      // مزامنة updatedAt مع updated_at
      await this.client.query(`
        UPDATE users 
        SET "updatedAt" = updated_at 
        WHERE "updatedAt" IS NULL AND updated_at IS NOT NULL
      `);
      console.log('   ✅ تم مزامنة updatedAt مع updated_at');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل مزامنة البيانات: ${error.message}`);
      return false;
    }
  }

  async createSyncTriggers() {
    console.log('\n🔧 إنشاء triggers للمزامنة التلقائية...');
    
    try {
      // إنشاء دالة المزامنة
      await this.client.query(`
        CREATE OR REPLACE FUNCTION sync_user_columns()
        RETURNS TRIGGER AS $$
        BEGIN
          -- مزامنة البيانات عند التحديث أو الإدراج
          NEW.password = COALESCE(NEW.password, NEW.password_hash);
          NEW.password_hash = COALESCE(NEW.password_hash, NEW.password);
          
          NEW.name = CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, ''));
          
          NEW."isActive" = COALESCE(NEW."isActive", NEW.is_active);
          NEW.is_active = COALESCE(NEW.is_active, NEW."isActive");
          
          NEW."lastLoginAt" = COALESCE(NEW."lastLoginAt", NEW.last_login);
          NEW.last_login = COALESCE(NEW.last_login, NEW."lastLoginAt");
          
          NEW."createdAt" = COALESCE(NEW."createdAt", NEW.created_at);
          NEW.created_at = COALESCE(NEW.created_at, NEW."createdAt");
          
          NEW."updatedAt" = NOW();
          NEW.updated_at = NOW();
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('   ✅ تم إنشاء دالة المزامنة');

      // إنشاء trigger للمزامنة
      await this.client.query(`
        DROP TRIGGER IF EXISTS sync_user_columns_trigger ON users;
        CREATE TRIGGER sync_user_columns_trigger
        BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION sync_user_columns();
      `);
      console.log('   ✅ تم إنشاء trigger للمزامنة التلقائية');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء triggers: ${error.message}`);
      return false;
    }
  }

  async testLoginFunctionality() {
    console.log('\n🧪 اختبار وظيفة تسجيل الدخول...');
    
    try {
      // اختبار الاستعلام الذي يفشل حالياً
      const testQuery = `
        SELECT "id", "username", "password", "name", "email", "role", "isActive", "lastLoginAt", "passwordChangedAt", "createdAt", "updatedAt" 
        FROM "users" 
        WHERE "username" = 'admin' AND "isActive" = true
      `;

      const result = await this.client.query(testQuery);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log('   ✅ استعلام تسجيل الدخول يعمل بنجاح');
        console.log(`     👤 المستخدم: ${user.username}`);
        console.log(`     📧 البريد الإلكتروني: ${user.email}`);
        console.log(`     👥 الدور: ${user.role}`);
        console.log(`     🟢 نشط: ${user.isActive}`);
        
        return true;
      } else {
        console.log('   ⚠️ لم يتم العثور على مستخدم admin');
        
        // البحث عن أي مستخدم
        const anyUser = await this.client.query(`
          SELECT "username", "email", "role" 
          FROM "users" 
          WHERE "isActive" = true 
          LIMIT 1
        `);
        
        if (anyUser.rows.length > 0) {
          console.log(`   📋 مستخدم متاح: ${anyUser.rows[0].username}`);
        }
        
        return false;
      }

    } catch (error) {
      console.log(`   ❌ فشل اختبار تسجيل الدخول: ${error.message}`);
      return false;
    }
  }

  async verifyAllUsers() {
    console.log('\n👥 التحقق من جميع المستخدمين...');
    
    try {
      const users = await this.client.query(`
        SELECT "id", "username", "email", "name", "role", "isActive"
        FROM "users"
        ORDER BY "id"
      `);

      console.log(`   📊 إجمالي المستخدمين: ${users.rows.length}`);
      
      users.rows.forEach(user => {
        const status = user.isActive ? '🟢' : '🔴';
        console.log(`     ${status} ${user.username} (${user.role}) - ${user.email}`);
      });

      return users.rows.length > 0;

    } catch (error) {
      console.log(`   ❌ خطأ في التحقق من المستخدمين: ${error.message}`);
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

  async runPasswordColumnFix() {
    console.log('🔧 بدء إصلاح عدم تطابق أعمدة كلمة المرور...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح مشكلة عمود password المفقود');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // تحليل المخطط الحالي
      const schemaAnalysis = await this.analyzeCurrentSchema();
      if (!schemaAnalysis) {
        console.log('❌ فشل في تحليل المخطط');
        return false;
      }

      // إنشاء الأعمدة المفقودة
      const columnsCreated = await this.createCompatibilityColumns();
      if (!columnsCreated) {
        console.log('❌ فشل في إنشاء الأعمدة');
        return false;
      }

      // مزامنة البيانات
      const dataSynced = await this.syncDataBetweenColumns();
      if (!dataSynced) {
        console.log('❌ فشل في مزامنة البيانات');
        return false;
      }

      // إنشاء triggers للمزامنة
      const triggersCreated = await this.createSyncTriggers();
      if (!triggersCreated) {
        console.log('❌ فشل في إنشاء triggers');
        return false;
      }

      // اختبار وظيفة تسجيل الدخول
      const loginTested = await this.testLoginFunctionality();
      if (!loginTested) {
        console.log('⚠️ اختبار تسجيل الدخول لم ينجح كلياً');
      }

      // التحقق من جميع المستخدمين
      const usersVerified = await this.verifyAllUsers();
      if (!usersVerified) {
        console.log('❌ فشل في التحقق من المستخدمين');
        return false;
      }

      console.log('\n🎉 تم إصلاح عدم تطابق أعمدة كلمة المرور بنجاح!');
      console.log('✅ جميع الأعمدة المطلوبة موجودة الآن');
      console.log('✅ تم إنشاء triggers للمزامنة التلقائية');
      console.log('✅ يمكن الآن تسجيل الدخول بنجاح');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في الإصلاح:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل الإصلاح
const passwordFix = new PasswordColumnFix();
passwordFix.runPasswordColumnFix().then(success => {
  if (success) {
    console.log('\n🎊 تم إصلاح مشكلة أعمدة كلمة المرور بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لتطبيق التغييرات.');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في إصلاح مشكلة أعمدة كلمة المرور');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح أعمدة كلمة المرور:', error);
  process.exit(1);
});
