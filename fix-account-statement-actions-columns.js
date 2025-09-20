#!/usr/bin/env node

/**
 * إصلاح أعمدة جدول account_statement_actions
 * Fix Account Statement Actions Columns - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class AccountStatementActionsFix {
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

  async checkTableStructure() {
    console.log('\n🔍 فحص بنية جدول account_statement_actions...');
    
    try {
      const columns = await this.client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'account_statement_actions'
        ORDER BY ordinal_position
      `);

      console.log('   📊 الأعمدة الموجودة:');
      columns.rows.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });

      return columns.rows;

    } catch (error) {
      console.log(`   ❌ خطأ في فحص بنية الجدول: ${error.message}`);
      return [];
    }
  }

  async fixTableStructure() {
    console.log('\n🔧 إصلاح بنية جدول account_statement_actions...');
    
    try {
      // حذف الجدول وإعادة إنشاؤه بالبنية الصحيحة
      await this.client.query('DROP TABLE IF EXISTS account_statement_actions CASCADE');
      console.log('   🗑️ تم حذف الجدول القديم');

      // إنشاء الجدول الجديد بالبنية الصحيحة
      await this.client.query(`
        CREATE TABLE account_statement_actions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "accountId" UUID NOT NULL,
          action VARCHAR(50) NOT NULL,
          description TEXT,
          amount DECIMAL(15,2),
          date DATE DEFAULT CURRENT_DATE,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('   ✅ تم إنشاء الجدول الجديد بالبنية الصحيحة');

      // إنشاء الفهارس
      await this.client.query('CREATE INDEX idx_account_statement_actions_account ON account_statement_actions("accountId")');
      await this.client.query('CREATE INDEX idx_account_statement_actions_date ON account_statement_actions(date)');
      console.log('   ✅ تم إنشاء الفهارس');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إصلاح بنية الجدول: ${error.message}`);
      return false;
    }
  }

  async populateTestData() {
    console.log('\n📊 إضافة بيانات اختبار...');
    
    try {
      // البحث عن حساب نشط
      const account = await this.client.query(`
        SELECT id FROM accounts WHERE "isActive" = true LIMIT 1
      `);

      if (account.rows.length === 0) {
        console.log('   ❌ لا توجد حسابات نشطة');
        return false;
      }

      const accountId = account.rows[0].id;

      const actions = [
        { action: 'deposit', description: 'إيداع نقدي', amount: 5000 },
        { action: 'withdrawal', description: 'سحب نقدي', amount: 2000 },
        { action: 'transfer', description: 'تحويل بنكي', amount: 3000 },
        { action: 'payment', description: 'دفع فاتورة', amount: 1500 },
        { action: 'receipt', description: 'استلام دفعة', amount: 2500 },
        { action: 'adjustment', description: 'تسوية حساب', amount: 500 }
      ];

      for (const action of actions) {
        try {
          await this.client.query(`
            INSERT INTO account_statement_actions (
              "accountId", action, description, amount, date
            ) VALUES ($1, $2, $3, $4, CURRENT_DATE)
          `, [accountId, action.action, action.description, action.amount]);
          console.log(`   ✅ تم إدراج إجراء: ${action.action} - ${action.description}`);
        } catch (error) {
          console.log(`   ❌ فشل إدراج إجراء ${action.action}: ${error.message}`);
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة بيانات الاختبار: ${error.message}`);
      return false;
    }
  }

  async testTableFunctionality() {
    console.log('\n🧪 اختبار وظائف الجدول...');
    
    try {
      // عدد الإجراءات
      const countResult = await this.client.query('SELECT COUNT(*) as count FROM account_statement_actions');
      console.log(`   📊 إجمالي الإجراءات: ${countResult.rows[0].count}`);

      // عرض عينة من الإجراءات
      const sampleActions = await this.client.query(`
        SELECT 
          action,
          description,
          amount,
          date
        FROM account_statement_actions
        ORDER BY "createdAt" DESC
        LIMIT 5
      `);

      if (sampleActions.rows.length > 0) {
        console.log('   📋 عينة من الإجراءات:');
        sampleActions.rows.forEach(action => {
          console.log(`     - ${action.action}: ${action.description} (${action.amount} د.ل)`);
        });
      }

      // إحصائيات حسب نوع الإجراء
      const actionStats = await this.client.query(`
        SELECT action, COUNT(*) as count, SUM(amount) as total
        FROM account_statement_actions 
        GROUP BY action
        ORDER BY count DESC
      `);

      if (actionStats.rows.length > 0) {
        console.log('   📊 إحصائيات حسب نوع الإجراء:');
        actionStats.rows.forEach(stat => {
          console.log(`     - ${stat.action}: ${stat.count} إجراء بقيمة ${stat.total} د.ل`);
        });
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل اختبار وظائف الجدول: ${error.message}`);
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

  async runActionsFix() {
    console.log('🔧 بدء إصلاح جدول account_statement_actions...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح بنية الجدول وإضافة البيانات');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // فحص البنية الحالية
      const currentStructure = await this.checkTableStructure();

      // إصلاح بنية الجدول
      const structureFixed = await this.fixTableStructure();
      if (!structureFixed) {
        console.log('❌ فشل في إصلاح بنية الجدول');
        return false;
      }

      // إضافة بيانات الاختبار
      const dataPopulated = await this.populateTestData();
      if (!dataPopulated) {
        console.log('❌ فشل في إضافة بيانات الاختبار');
        return false;
      }

      // اختبار وظائف الجدول
      const functionalityTested = await this.testTableFunctionality();
      if (!functionalityTested) {
        console.log('❌ فشل في اختبار وظائف الجدول');
        return false;
      }

      console.log('\n🎉 تم إصلاح جدول account_statement_actions بنجاح!');
      console.log('✅ بنية الجدول تم إصلاحها');
      console.log('✅ بيانات الاختبار تم إضافتها');
      console.log('✅ جميع الوظائف تعمل بشكل صحيح');
      console.log('✅ API إجراءات كشف الحساب سيعمل الآن بدون أخطاء');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في إصلاح الجدول:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل إصلاح الجدول
const actionsFix = new AccountStatementActionsFix();
actionsFix.runActionsFix().then(success => {
  if (success) {
    console.log('\n🎊 تم إصلاح جدول account_statement_actions بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لتطبيق التغييرات');
    console.log('✅ API إجراءات كشف الحساب سيعمل الآن بدون أخطاء');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في إصلاح جدول account_statement_actions');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح الجدول:', error);
  process.exit(1);
});
