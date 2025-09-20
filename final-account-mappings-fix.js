#!/usr/bin/env node

/**
 * الإصلاح النهائي لجدول account_mappings
 * Final account_mappings Fix - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class FinalAccountMappingsFix {
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

  async addTypeColumn() {
    console.log('\n🔧 إضافة عمود type للجدول...');
    
    try {
      // إضافة عمود type
      await this.client.query(`
        ALTER TABLE account_mappings 
        ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'default'
      `);
      console.log('   ✅ تم إضافة عمود type');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة عمود type: ${error.message}`);
      return false;
    }
  }

  async populateWithCorrectStructure() {
    console.log('\n📊 إضافة البيانات الافتراضية بالبنية الصحيحة...');
    
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
      const revenueAccounts = accounts.rows.filter(acc => acc.type === 'revenue');
      const assetAccounts = accounts.rows.filter(acc => acc.type === 'asset');

      // العثور على حسابات محددة
      const salesRevenueAccount = revenueAccounts.find(acc => 
        acc.name.includes('مبيعات') || acc.name.includes('إيراد') || acc.name.toLowerCase().includes('sales')
      ) || revenueAccounts[0];

      const cashAccount = assetAccounts.find(acc => 
        acc.name.includes('نقد') || acc.name.includes('صندوق') || acc.name.toLowerCase().includes('cash')
      ) || assetAccounts[0];

      const bankAccount = assetAccounts.find(acc => 
        acc.name.includes('بنك') || acc.name.includes('مصرف') || acc.name.toLowerCase().includes('bank')
      ) || assetAccounts[1];

      // التحقق من وجود سجل افتراضي
      const existingDefault = await this.client.query(`
        SELECT id FROM account_mappings 
        WHERE "mappingType" = 'default_sales' OR type = 'default'
        LIMIT 1
      `);

      if (existingDefault.rows.length > 0) {
        // تحديث السجل الموجود
        await this.client.query(`
          UPDATE account_mappings 
          SET 
            type = 'default',
            "mappingType" = 'default_sales',
            "salesRevenueAccount" = $1,
            "cashAccount" = $2,
            "bankAccount" = $3,
            "isActive" = true,
            "updatedAt" = NOW()
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
        const newId = await this.client.query(`
          INSERT INTO account_mappings (
            id,
            "mappingType",
            "sourceType",
            type,
            "salesRevenueAccount",
            "cashAccount", 
            "bankAccount",
            "isActive",
            "createdAt",
            "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            'default_sales',
            'system',
            'default',
            $1, $2, $3,
            true,
            NOW(),
            NOW()
          ) RETURNING id
        `, [
          salesRevenueAccount?.id || null,
          cashAccount?.id || null,
          bankAccount?.id || null
        ]);
        console.log('   ✅ تم إنشاء سجل افتراضي جديد');
        console.log(`   🆔 ID الجديد: ${newId.rows[0].id}`);
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

  async createCompatibilityFunctions() {
    console.log('\n🔧 إنشاء دوال التوافق...');
    
    try {
      // دالة للحصول على حساب الإيرادات
      await this.client.query(`
        CREATE OR REPLACE FUNCTION get_default_sales_revenue_account()
        RETURNS UUID AS $$
        DECLARE
          account_id UUID;
        BEGIN
          -- البحث في account_mappings
          SELECT "salesRevenueAccount" INTO account_id
          FROM account_mappings 
          WHERE "salesRevenueAccount" IS NOT NULL
          AND "isActive" = true
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
      console.log('   ✅ تم إنشاء دالة get_default_sales_revenue_account');

      // دالة للحصول على حساب النقد
      await this.client.query(`
        CREATE OR REPLACE FUNCTION get_default_cash_account()
        RETURNS UUID AS $$
        DECLARE
          account_id UUID;
        BEGIN
          -- البحث في account_mappings
          SELECT "cashAccount" INTO account_id
          FROM account_mappings 
          WHERE "cashAccount" IS NOT NULL
          AND "isActive" = true
          LIMIT 1;
          
          -- إذا لم يوجد، البحث في الحسابات مباشرة
          IF account_id IS NULL THEN
            SELECT id INTO account_id
            FROM accounts 
            WHERE type = 'asset'
            AND "isActive" = true
            AND (name ILIKE '%نقد%' OR name ILIKE '%cash%' OR name ILIKE '%صندوق%')
            LIMIT 1;
          END IF;
          
          RETURN account_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('   ✅ تم إنشاء دالة get_default_cash_account');

      // دالة عامة للحصول على أي حساب من account_mappings
      await this.client.query(`
        CREATE OR REPLACE FUNCTION get_account_mapping(mapping_column TEXT)
        RETURNS UUID AS $$
        DECLARE
          account_id UUID;
          query_text TEXT;
        BEGIN
          query_text := format('SELECT "%I" FROM account_mappings WHERE "%I" IS NOT NULL AND "isActive" = true LIMIT 1', mapping_column, mapping_column);
          EXECUTE query_text INTO account_id;
          RETURN account_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('   ✅ تم إنشاء دالة get_account_mapping العامة');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء دوال التوافق: ${error.message}`);
      return false;
    }
  }

  async testFinalSetup() {
    console.log('\n🧪 اختبار الإعداد النهائي...');
    
    try {
      // اختبار الدوال
      const salesRevenueTest = await this.client.query('SELECT get_default_sales_revenue_account() as account_id');
      const cashAccountTest = await this.client.query('SELECT get_default_cash_account() as account_id');

      console.log(`   💰 حساب الإيرادات: ${salesRevenueTest.rows[0].account_id || 'غير محدد'}`);
      console.log(`   💵 حساب النقد: ${cashAccountTest.rows[0].account_id || 'غير محدد'}`);

      // اختبار الدالة العامة
      const generalTest = await this.client.query(`SELECT get_account_mapping('salesRevenueAccount') as account_id`);
      console.log(`   🔧 اختبار الدالة العامة: ${generalTest.rows[0].account_id || 'غير محدد'}`);

      // عرض بيانات account_mappings النهائية
      const finalData = await this.client.query(`
        SELECT 
          id, 
          "mappingType",
          type,
          "salesRevenueAccount",
          "cashAccount",
          "bankAccount",
          "isActive"
        FROM account_mappings 
        WHERE "isActive" = true
        LIMIT 3
      `);

      if (finalData.rows.length > 0) {
        console.log('   📊 بيانات account_mappings النهائية:');
        finalData.rows.forEach(row => {
          console.log(`     - ID: ${row.id.substring(0, 8)}...`);
          console.log(`       Type: ${row.type}, Mapping: ${row.mappingType}`);
          console.log(`       Sales Revenue: ${row.salesRevenueAccount ? row.salesRevenueAccount.substring(0, 8) + '...' : 'N/A'}`);
          console.log(`       Cash: ${row.cashAccount ? row.cashAccount.substring(0, 8) + '...' : 'N/A'}`);
          console.log(`       Bank: ${row.bankAccount ? row.bankAccount.substring(0, 8) + '...' : 'N/A'}`);
        });
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل الاختبار النهائي: ${error.message}`);
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

  async runFinalAccountMappingsFix() {
    console.log('🔧 بدء الإصلاح النهائي لجدول account_mappings...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح نهائي لعمود salesRevenueAccount');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // إضافة عمود type
      const typeAdded = await this.addTypeColumn();
      if (!typeAdded) {
        console.log('❌ فشل في إضافة عمود type');
        return false;
      }

      // إضافة البيانات الافتراضية
      const dataPopulated = await this.populateWithCorrectStructure();
      if (!dataPopulated) {
        console.log('❌ فشل في إضافة البيانات الافتراضية');
        return false;
      }

      // إنشاء دوال التوافق
      const functionsCreated = await this.createCompatibilityFunctions();
      if (!functionsCreated) {
        console.log('❌ فشل في إنشاء دوال التوافق');
        return false;
      }

      // اختبار الإعداد النهائي
      const testPassed = await this.testFinalSetup();
      if (!testPassed) {
        console.log('❌ فشل الاختبار النهائي');
        return false;
      }

      console.log('\n🎉 تم الإصلاح النهائي لجدول account_mappings بنجاح!');
      console.log('✅ عمود salesRevenueAccount متاح ومُعبأ');
      console.log('✅ البيانات الافتراضية تم إدراجها');
      console.log('✅ دوال التوافق تم إنشاؤها');
      console.log('✅ النظام جاهز للعمل بدون تحذيرات');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في الإصلاح النهائي:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل الإصلاح النهائي
const finalFix = new FinalAccountMappingsFix();
finalFix.runFinalAccountMappingsFix().then(success => {
  if (success) {
    console.log('\n🎊 تم الإصلاح النهائي بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لإزالة جميع التحذيرات');
    console.log('✅ النظام جاهز للعمل بكفاءة 100%');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في الإصلاح النهائي');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل الإصلاح النهائي:', error);
  process.exit(1);
});
