#!/usr/bin/env node

/**
 * إصلاح عمود salesRevenueAccount المفقود
 * Fix Missing salesRevenueAccount Column - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class SalesRevenueAccountFix {
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

  async findAccountMappingTable() {
    console.log('\n🔍 البحث عن جدول AccountMapping...');
    
    try {
      // البحث عن الجداول التي قد تحتوي على AccountMapping
      const tables = await this.client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name ILIKE '%account%'
        ORDER BY table_name
      `);

      console.log('   📊 الجداول المتعلقة بالحسابات:');
      tables.rows.forEach(table => {
        console.log(`     - ${table.table_name}`);
      });

      // البحث عن جدول يحتوي على أعمدة mapping
      for (const table of tables.rows) {
        const columns = await this.client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1
          AND column_name ILIKE '%revenue%'
        `, [table.table_name]);

        if (columns.rows.length > 0) {
          console.log(`   ✅ تم العثور على أعمدة revenue في جدول: ${table.table_name}`);
          columns.rows.forEach(col => {
            console.log(`     - ${col.column_name}`);
          });
        }
      }

      return tables.rows;

    } catch (error) {
      console.log(`   ❌ خطأ في البحث عن الجداول: ${error.message}`);
      return [];
    }
  }

  async createAccountMappingTable() {
    console.log('\n🔧 إنشاء جدول AccountMapping...');
    
    try {
      // إنشاء جدول AccountMapping إذا لم يكن موجوداً
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS account_mapping (
          id SERIAL PRIMARY KEY,
          mapping_type VARCHAR(50) NOT NULL,
          account_id INTEGER REFERENCES accounts(id),
          account_code VARCHAR(20),
          account_name VARCHAR(255),
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('   ✅ تم إنشاء جدول account_mapping');

      // إضافة عمود salesRevenueAccount
      await this.client.query(`
        ALTER TABLE account_mapping 
        ADD COLUMN IF NOT EXISTS "salesRevenueAccount" INTEGER REFERENCES accounts(id)
      `);
      console.log('   ✅ تم إضافة عمود salesRevenueAccount');

      // إضافة أعمدة إضافية للمحاسبة
      const additionalColumns = [
        'purchaseAccount',
        'costOfGoodsAccount', 
        'inventoryAccount',
        'cashAccount',
        'bankAccount',
        'receivablesAccount',
        'payablesAccount',
        'taxAccount',
        'discountAccount'
      ];

      for (const column of additionalColumns) {
        await this.client.query(`
          ALTER TABLE account_mapping 
          ADD COLUMN IF NOT EXISTS "${column}" INTEGER REFERENCES accounts(id)
        `);
        console.log(`   ✅ تم إضافة عمود ${column}`);
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء جدول AccountMapping: ${error.message}`);
      return false;
    }
  }

  async populateDefaultAccountMapping() {
    console.log('\n📊 إضافة البيانات الافتراضية لـ AccountMapping...');
    
    try {
      // البحث عن الحسابات المناسبة
      const revenueAccount = await this.client.query(`
        SELECT id, code, name 
        FROM accounts 
        WHERE type = 'revenue' 
        OR name ILIKE '%revenue%' 
        OR name ILIKE '%إيراد%'
        OR name ILIKE '%مبيعات%'
        LIMIT 1
      `);

      const cashAccount = await this.client.query(`
        SELECT id, code, name 
        FROM accounts 
        WHERE type = 'asset' 
        AND (name ILIKE '%cash%' OR name ILIKE '%نقد%' OR name ILIKE '%صندوق%')
        LIMIT 1
      `);

      const bankAccount = await this.client.query(`
        SELECT id, code, name 
        FROM accounts 
        WHERE type = 'asset' 
        AND (name ILIKE '%bank%' OR name ILIKE '%مصرف%' OR name ILIKE '%بنك%')
        LIMIT 1
      `);

      // إدراج البيانات الافتراضية
      const defaultMapping = {
        mapping_type: 'default_sales',
        salesRevenueAccount: revenueAccount.rows[0]?.id || null,
        cashAccount: cashAccount.rows[0]?.id || null,
        bankAccount: bankAccount.rows[0]?.id || null,
        is_default: true
      };

      await this.client.query(`
        INSERT INTO account_mapping (
          mapping_type, 
          "salesRevenueAccount", 
          "cashAccount", 
          "bankAccount", 
          is_default
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [
        defaultMapping.mapping_type,
        defaultMapping.salesRevenueAccount,
        defaultMapping.cashAccount,
        defaultMapping.bankAccount,
        defaultMapping.is_default
      ]);

      console.log('   ✅ تم إدراج البيانات الافتراضية');
      
      if (revenueAccount.rows[0]) {
        console.log(`   💰 حساب الإيرادات: ${revenueAccount.rows[0].name} (${revenueAccount.rows[0].code})`);
      }
      
      if (cashAccount.rows[0]) {
        console.log(`   💵 حساب النقد: ${cashAccount.rows[0].name} (${cashAccount.rows[0].code})`);
      }
      
      if (bankAccount.rows[0]) {
        console.log(`   🏦 حساب البنك: ${bankAccount.rows[0].name} (${bankAccount.rows[0].code})`);
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة البيانات الافتراضية: ${error.message}`);
      return false;
    }
  }

  async createAccountMappingFunctions() {
    console.log('\n🔧 إنشاء دوال AccountMapping...');
    
    try {
      // دالة للحصول على حساب الإيرادات الافتراضي
      await this.client.query(`
        CREATE OR REPLACE FUNCTION get_default_sales_revenue_account()
        RETURNS INTEGER AS $$
        DECLARE
          account_id INTEGER;
        BEGIN
          SELECT "salesRevenueAccount" INTO account_id
          FROM account_mapping 
          WHERE mapping_type = 'default_sales' 
          AND is_default = true 
          AND "salesRevenueAccount" IS NOT NULL
          LIMIT 1;
          
          IF account_id IS NULL THEN
            -- البحث عن أي حساب إيرادات
            SELECT id INTO account_id
            FROM accounts 
            WHERE type = 'revenue'
            LIMIT 1;
          END IF;
          
          RETURN account_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('   ✅ تم إنشاء دالة get_default_sales_revenue_account');

      // دالة للحصول على حساب النقد الافتراضي
      await this.client.query(`
        CREATE OR REPLACE FUNCTION get_default_cash_account()
        RETURNS INTEGER AS $$
        DECLARE
          account_id INTEGER;
        BEGIN
          SELECT "cashAccount" INTO account_id
          FROM account_mapping 
          WHERE mapping_type = 'default_sales' 
          AND is_default = true 
          AND "cashAccount" IS NOT NULL
          LIMIT 1;
          
          IF account_id IS NULL THEN
            -- البحث عن أي حساب نقد
            SELECT id INTO account_id
            FROM accounts 
            WHERE type = 'asset' 
            AND (name ILIKE '%cash%' OR name ILIKE '%نقد%')
            LIMIT 1;
          END IF;
          
          RETURN account_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('   ✅ تم إنشاء دالة get_default_cash_account');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء دوال AccountMapping: ${error.message}`);
      return false;
    }
  }

  async testAccountMapping() {
    console.log('\n🧪 اختبار AccountMapping...');
    
    try {
      // اختبار الدوال
      const salesRevenueTest = await this.client.query(`
        SELECT get_default_sales_revenue_account() as account_id
      `);

      const cashAccountTest = await this.client.query(`
        SELECT get_default_cash_account() as account_id
      `);

      console.log(`   💰 حساب الإيرادات الافتراضي: ${salesRevenueTest.rows[0].account_id || 'غير محدد'}`);
      console.log(`   💵 حساب النقد الافتراضي: ${cashAccountTest.rows[0].account_id || 'غير محدد'}`);

      // عرض جميع البيانات في account_mapping
      const mappingData = await this.client.query(`
        SELECT * FROM account_mapping WHERE is_default = true
      `);

      if (mappingData.rows.length > 0) {
        console.log('   📊 بيانات AccountMapping الافتراضية:');
        mappingData.rows.forEach(row => {
          console.log(`     - النوع: ${row.mapping_type}`);
          console.log(`     - حساب الإيرادات: ${row.salesRevenueAccount || 'غير محدد'}`);
          console.log(`     - حساب النقد: ${row.cashAccount || 'غير محدد'}`);
          console.log(`     - حساب البنك: ${row.bankAccount || 'غير محدد'}`);
        });
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل اختبار AccountMapping: ${error.message}`);
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

  async runSalesRevenueAccountFix() {
    console.log('🔧 بدء إصلاح عمود salesRevenueAccount المفقود...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح تحذير AccountMapping');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // البحث عن جدول AccountMapping
      const tables = await this.findAccountMappingTable();

      // إنشاء جدول AccountMapping
      const tableCreated = await this.createAccountMappingTable();
      if (!tableCreated) {
        console.log('❌ فشل في إنشاء جدول AccountMapping');
        return false;
      }

      // إضافة البيانات الافتراضية
      const dataPopulated = await this.populateDefaultAccountMapping();
      if (!dataPopulated) {
        console.log('❌ فشل في إضافة البيانات الافتراضية');
        return false;
      }

      // إنشاء الدوال
      const functionsCreated = await this.createAccountMappingFunctions();
      if (!functionsCreated) {
        console.log('❌ فشل في إنشاء دوال AccountMapping');
        return false;
      }

      // اختبار النظام
      const testPassed = await this.testAccountMapping();
      if (!testPassed) {
        console.log('❌ فشل اختبار AccountMapping');
        return false;
      }

      console.log('\n🎉 تم إصلاح عمود salesRevenueAccount بنجاح!');
      console.log('✅ جدول account_mapping تم إنشاؤه');
      console.log('✅ عمود salesRevenueAccount متاح');
      console.log('✅ البيانات الافتراضية تم إدراجها');
      console.log('✅ الدوال المساعدة تم إنشاؤها');
      
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
const salesRevenueFix = new SalesRevenueAccountFix();
salesRevenueFix.runSalesRevenueAccountFix().then(success => {
  if (success) {
    console.log('\n🎊 تم إصلاح مشكلة salesRevenueAccount بنجاح!');
    console.log('✅ التحذير سيختفي عند إعادة تشغيل الخادم');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في إصلاح مشكلة salesRevenueAccount');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح salesRevenueAccount:', error);
  process.exit(1);
});
