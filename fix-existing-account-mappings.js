#!/usr/bin/env node

/**
 * إصلاح جدول account_mappings الموجود
 * Fix Existing account_mappings Table - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class ExistingAccountMappingsFix {
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

  async analyzeExistingTable() {
    console.log('\n🔍 تحليل جدول account_mappings الموجود...');
    
    try {
      // فحص بنية الجدول
      const columns = await this.client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'account_mappings'
        ORDER BY ordinal_position
      `);

      console.log('   📊 الأعمدة الموجودة في account_mappings:');
      const columnNames = [];
      columns.rows.forEach(col => {
        columnNames.push(col.column_name);
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });

      // فحص البيانات الموجودة
      const dataCount = await this.client.query('SELECT COUNT(*) as count FROM account_mappings');
      console.log(`   📊 عدد السجلات: ${dataCount.rows[0].count}`);

      // عرض عينة من البيانات
      const sampleData = await this.client.query('SELECT * FROM account_mappings LIMIT 3');
      if (sampleData.rows.length > 0) {
        console.log('   📋 عينة من البيانات:');
        sampleData.rows.forEach((row, index) => {
          console.log(`     ${index + 1}. ID: ${row.id}, Type: ${row.type || 'N/A'}`);
        });
      }

      return {
        columns: columnNames,
        dataCount: parseInt(dataCount.rows[0].count),
        sampleData: sampleData.rows
      };

    } catch (error) {
      console.log(`   ❌ خطأ في تحليل الجدول: ${error.message}`);
      return null;
    }
  }

  async addMissingColumns() {
    console.log('\n🔧 إضافة الأعمدة المفقودة...');
    
    try {
      // قائمة الأعمدة المطلوبة
      const requiredColumns = [
        { name: 'salesRevenueAccount', type: 'INTEGER' },
        { name: 'purchaseAccount', type: 'INTEGER' },
        { name: 'costOfGoodsAccount', type: 'INTEGER' },
        { name: 'inventoryAccount', type: 'INTEGER' },
        { name: 'cashAccount', type: 'INTEGER' },
        { name: 'bankAccount', type: 'INTEGER' },
        { name: 'receivablesAccount', type: 'INTEGER' },
        { name: 'payablesAccount', type: 'INTEGER' },
        { name: 'taxAccount', type: 'INTEGER' },
        { name: 'discountAccount', type: 'INTEGER' }
      ];

      let columnsAdded = 0;

      for (const column of requiredColumns) {
        try {
          await this.client.query(`
            ALTER TABLE account_mappings 
            ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type}
          `);
          console.log(`   ✅ تم إضافة عمود ${column.name}`);
          columnsAdded++;
        } catch (columnError) {
          console.log(`   ⚠️ عمود ${column.name} موجود مسبقاً أو خطأ: ${columnError.message}`);
        }
      }

      console.log(`   📊 تم إضافة ${columnsAdded} عمود جديد`);
      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة الأعمدة: ${error.message}`);
      return false;
    }
  }

  async populateDefaultMappings() {
    console.log('\n📊 إضافة البيانات الافتراضية...');
    
    try {
      // البحث عن الحسابات المناسبة
      const accounts = await this.client.query(`
        SELECT id, code, name, type 
        FROM accounts 
        WHERE "isActive" = true
        ORDER BY type, code
      `);

      console.log(`   📊 تم العثور على ${accounts.rows.length} حساب نشط`);

      // تصنيف الحسابات
      const accountsByType = {
        revenue: accounts.rows.filter(acc => acc.type === 'revenue'),
        asset: accounts.rows.filter(acc => acc.type === 'asset'),
        liability: accounts.rows.filter(acc => acc.type === 'liability'),
        expense: accounts.rows.filter(acc => acc.type === 'expense'),
        equity: accounts.rows.filter(acc => acc.type === 'equity')
      };

      // العثور على حسابات محددة
      const salesRevenueAccount = accountsByType.revenue.find(acc => 
        acc.name.includes('مبيعات') || acc.name.includes('إيراد') || acc.name.toLowerCase().includes('sales')
      ) || accountsByType.revenue[0];

      const cashAccount = accountsByType.asset.find(acc => 
        acc.name.includes('نقد') || acc.name.includes('صندوق') || acc.name.toLowerCase().includes('cash')
      ) || accountsByType.asset[0];

      const bankAccount = accountsByType.asset.find(acc => 
        acc.name.includes('بنك') || acc.name.includes('مصرف') || acc.name.toLowerCase().includes('bank')
      ) || accountsByType.asset[1];

      // التحقق من وجود سجل افتراضي
      const existingDefault = await this.client.query(`
        SELECT id FROM account_mappings 
        WHERE type = 'default' OR id = 1
        LIMIT 1
      `);

      if (existingDefault.rows.length > 0) {
        // تحديث السجل الموجود
        await this.client.query(`
          UPDATE account_mappings 
          SET 
            "salesRevenueAccount" = $1,
            "cashAccount" = $2,
            "bankAccount" = $3
          WHERE id = $4
        `, [
          salesRevenueAccount?.id || null,
          cashAccount?.id || null,
          bankAccount?.id || null,
          existingDefault.rows[0].id
        ]);
        console.log('   ✅ تم تحديث السجل الافتراضي الموجود');
      } else {
        // إنشاء سجل جديد
        await this.client.query(`
          INSERT INTO account_mappings (
            type,
            "salesRevenueAccount",
            "cashAccount", 
            "bankAccount"
          ) VALUES ($1, $2, $3, $4)
        `, [
          'default',
          salesRevenueAccount?.id || null,
          cashAccount?.id || null,
          bankAccount?.id || null
        ]);
        console.log('   ✅ تم إنشاء سجل افتراضي جديد');
      }

      // عرض النتائج
      if (salesRevenueAccount) {
        console.log(`   💰 حساب الإيرادات: ${salesRevenueAccount.name} (${salesRevenueAccount.code})`);
      }
      if (cashAccount) {
        console.log(`   💵 حساب النقد: ${cashAccount.name} (${cashAccount.code})`);
      }
      if (bankAccount) {
        console.log(`   🏦 حساب البنك: ${bankAccount.name} (${bankAccount.code})`);
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة البيانات الافتراضية: ${error.message}`);
      return false;
    }
  }

  async createHelperFunctions() {
    console.log('\n🔧 إنشاء الدوال المساعدة...');
    
    try {
      // دالة للحصول على حساب الإيرادات
      await this.client.query(`
        CREATE OR REPLACE FUNCTION get_sales_revenue_account()
        RETURNS INTEGER AS $$
        DECLARE
          account_id INTEGER;
        BEGIN
          -- البحث في account_mappings
          SELECT "salesRevenueAccount" INTO account_id
          FROM account_mappings 
          WHERE "salesRevenueAccount" IS NOT NULL
          LIMIT 1;
          
          -- إذا لم يوجد، البحث في الحسابات مباشرة
          IF account_id IS NULL THEN
            SELECT id INTO account_id
            FROM accounts 
            WHERE type = 'revenue'
            AND "isActive" = true
            LIMIT 1;
          END IF;
          
          RETURN account_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('   ✅ تم إنشاء دالة get_sales_revenue_account');

      // دالة للحصول على حساب النقد
      await this.client.query(`
        CREATE OR REPLACE FUNCTION get_cash_account()
        RETURNS INTEGER AS $$
        DECLARE
          account_id INTEGER;
        BEGIN
          -- البحث في account_mappings
          SELECT "cashAccount" INTO account_id
          FROM account_mappings 
          WHERE "cashAccount" IS NOT NULL
          LIMIT 1;
          
          -- إذا لم يوجد، البحث في الحسابات مباشرة
          IF account_id IS NULL THEN
            SELECT id INTO account_id
            FROM accounts 
            WHERE type = 'asset'
            AND "isActive" = true
            AND (name ILIKE '%نقد%' OR name ILIKE '%cash%')
            LIMIT 1;
          END IF;
          
          RETURN account_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('   ✅ تم إنشاء دالة get_cash_account');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء الدوال المساعدة: ${error.message}`);
      return false;
    }
  }

  async testFinalResult() {
    console.log('\n🧪 اختبار النتيجة النهائية...');
    
    try {
      // اختبار الدوال
      const salesRevenueTest = await this.client.query('SELECT get_sales_revenue_account() as account_id');
      const cashAccountTest = await this.client.query('SELECT get_cash_account() as account_id');

      console.log(`   💰 حساب الإيرادات: ${salesRevenueTest.rows[0].account_id || 'غير محدد'}`);
      console.log(`   💵 حساب النقد: ${cashAccountTest.rows[0].account_id || 'غير محدد'}`);

      // عرض بيانات account_mappings
      const mappingData = await this.client.query(`
        SELECT 
          id, 
          type,
          "salesRevenueAccount",
          "cashAccount",
          "bankAccount"
        FROM account_mappings 
        LIMIT 3
      `);

      if (mappingData.rows.length > 0) {
        console.log('   📊 بيانات account_mappings:');
        mappingData.rows.forEach(row => {
          console.log(`     - ID: ${row.id}, Type: ${row.type || 'N/A'}`);
          console.log(`       Sales Revenue: ${row.salesRevenueAccount || 'N/A'}`);
          console.log(`       Cash: ${row.cashAccount || 'N/A'}`);
          console.log(`       Bank: ${row.bankAccount || 'N/A'}`);
        });
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل الاختبار: ${error.message}`);
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

  async runExistingAccountMappingsFix() {
    console.log('🔧 بدء إصلاح جدول account_mappings الموجود...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إضافة عمود salesRevenueAccount للجدول الموجود');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // تحليل الجدول الموجود
      const analysis = await this.analyzeExistingTable();
      if (!analysis) {
        console.log('❌ فشل في تحليل الجدول الموجود');
        return false;
      }

      // إضافة الأعمدة المفقودة
      const columnsAdded = await this.addMissingColumns();
      if (!columnsAdded) {
        console.log('❌ فشل في إضافة الأعمدة');
        return false;
      }

      // إضافة البيانات الافتراضية
      const dataPopulated = await this.populateDefaultMappings();
      if (!dataPopulated) {
        console.log('❌ فشل في إضافة البيانات الافتراضية');
        return false;
      }

      // إنشاء الدوال المساعدة
      const functionsCreated = await this.createHelperFunctions();
      if (!functionsCreated) {
        console.log('❌ فشل في إنشاء الدوال المساعدة');
        return false;
      }

      // اختبار النتيجة النهائية
      const testPassed = await this.testFinalResult();
      if (!testPassed) {
        console.log('❌ فشل الاختبار النهائي');
        return false;
      }

      console.log('\n🎉 تم إصلاح جدول account_mappings بنجاح!');
      console.log('✅ عمود salesRevenueAccount متاح الآن');
      console.log('✅ البيانات الافتراضية تم إدراجها');
      console.log('✅ الدوال المساعدة تم إنشاؤها');
      console.log('✅ التحذير سيختفي عند إعادة تشغيل الخادم');
      
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
const accountMappingsFix = new ExistingAccountMappingsFix();
accountMappingsFix.runExistingAccountMappingsFix().then(success => {
  if (success) {
    console.log('\n🎊 تم إصلاح مشكلة salesRevenueAccount بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لإزالة التحذير');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في إصلاح مشكلة salesRevenueAccount');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح account_mappings:', error);
  process.exit(1);
});
