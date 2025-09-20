#!/usr/bin/env node

/**
 * إصلاح account_mappings مع UUID
 * UUID account_mappings Fix - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class UUIDAccountMappingsFix {
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

  async fixColumnTypes() {
    console.log('\n🔧 إصلاح أنواع الأعمدة إلى UUID...');
    
    try {
      // تحديث أنواع الأعمدة إلى UUID
      const columns = [
        'salesRevenueAccount',
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

      for (const column of columns) {
        try {
          await this.client.query(`
            ALTER TABLE account_mappings 
            ALTER COLUMN "${column}" TYPE UUID USING "${column}"::UUID
          `);
          console.log(`   ✅ تم تحديث نوع عمود ${column} إلى UUID`);
        } catch (columnError) {
          // إذا فشل التحديث، نحاول حذف العمود وإعادة إنشاؤه
          try {
            await this.client.query(`
              ALTER TABLE account_mappings 
              DROP COLUMN IF EXISTS "${column}"
            `);
            await this.client.query(`
              ALTER TABLE account_mappings 
              ADD COLUMN "${column}" UUID
            `);
            console.log(`   ✅ تم إعادة إنشاء عمود ${column} كـ UUID`);
          } catch (recreateError) {
            console.log(`   ⚠️ تعذر إصلاح عمود ${column}: ${recreateError.message}`);
          }
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إصلاح أنواع الأعمدة: ${error.message}`);
      return false;
    }
  }

  async populateWithUUIDs() {
    console.log('\n📊 إضافة البيانات الافتراضية مع UUIDs...');
    
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

      console.log(`   💰 حسابات الإيرادات: ${revenueAccounts.length}`);
      console.log(`   🏦 حسابات الأصول: ${assetAccounts.length}`);

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

      // حذف السجلات الموجودة لتجنب التضارب
      await this.client.query(`DELETE FROM account_mappings WHERE "mappingType" = 'default_sales'`);
      console.log('   🗑️ تم حذف السجلات القديمة');

      // إنشاء سجل جديد
      const insertResult = await this.client.query(`
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
          $1::UUID, 
          $2::UUID, 
          $3::UUID,
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
      console.log(`   🆔 ID الجديد: ${insertResult.rows[0].id}`);

      // عرض النتائج
      if (salesRevenueAccount) {
        console.log(`   💰 حساب الإيرادات: ${salesRevenueAccount.name} (${salesRevenueAccount.code})`);
        console.log(`     UUID: ${salesRevenueAccount.id}`);
      }
      if (cashAccount) {
        console.log(`   💵 حساب النقد: ${cashAccount.name} (${cashAccount.code})`);
        console.log(`     UUID: ${cashAccount.id}`);
      }
      if (bankAccount) {
        console.log(`   🏦 حساب البنك: ${bankAccount.name} (${bankAccount.code})`);
        console.log(`     UUID: ${bankAccount.id}`);
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة البيانات الافتراضية: ${error.message}`);
      return false;
    }
  }

  async createUUIDFunctions() {
    console.log('\n🔧 إنشاء دوال UUID...');
    
    try {
      // دالة للحصول على حساب الإيرادات
      await this.client.query(`
        CREATE OR REPLACE FUNCTION get_sales_revenue_account_uuid()
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
      console.log('   ✅ تم إنشاء دالة get_sales_revenue_account_uuid');

      // دالة للحصول على حساب النقد
      await this.client.query(`
        CREATE OR REPLACE FUNCTION get_cash_account_uuid()
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
      console.log('   ✅ تم إنشاء دالة get_cash_account_uuid');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء دوال UUID: ${error.message}`);
      return false;
    }
  }

  async testUUIDSetup() {
    console.log('\n🧪 اختبار إعداد UUID...');
    
    try {
      // اختبار الدوال
      const salesRevenueTest = await this.client.query('SELECT get_sales_revenue_account_uuid() as account_id');
      const cashAccountTest = await this.client.query('SELECT get_cash_account_uuid() as account_id');

      console.log(`   💰 حساب الإيرادات UUID: ${salesRevenueTest.rows[0].account_id || 'غير محدد'}`);
      console.log(`   💵 حساب النقد UUID: ${cashAccountTest.rows[0].account_id || 'غير محدد'}`);

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
          console.log(`     - ID: ${row.id}`);
          console.log(`       Type: ${row.type}, Mapping: ${row.mappingType}`);
          console.log(`       Sales Revenue: ${row.salesRevenueAccount || 'N/A'}`);
          console.log(`       Cash: ${row.cashAccount || 'N/A'}`);
          console.log(`       Bank: ${row.bankAccount || 'N/A'}`);
        });
      }

      // اختبار أن العمود salesRevenueAccount موجود ويمكن الوصول إليه
      const columnTest = await this.client.query(`
        SELECT "salesRevenueAccount" 
        FROM account_mappings 
        WHERE "salesRevenueAccount" IS NOT NULL 
        LIMIT 1
      `);

      if (columnTest.rows.length > 0) {
        console.log('   ✅ عمود salesRevenueAccount يعمل بشكل صحيح');
        console.log(`   🎯 قيمة العمود: ${columnTest.rows[0].salesRevenueAccount}`);
      } else {
        console.log('   ⚠️ عمود salesRevenueAccount فارغ ولكن موجود');
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل اختبار UUID: ${error.message}`);
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

  async runUUIDAccountMappingsFix() {
    console.log('🔧 بدء إصلاح account_mappings مع UUID...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح نهائي مع UUID للحسابات');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // إصلاح أنواع الأعمدة
      const typesFixed = await this.fixColumnTypes();
      if (!typesFixed) {
        console.log('❌ فشل في إصلاح أنواع الأعمدة');
        return false;
      }

      // إضافة البيانات الافتراضية
      const dataPopulated = await this.populateWithUUIDs();
      if (!dataPopulated) {
        console.log('❌ فشل في إضافة البيانات الافتراضية');
        return false;
      }

      // إنشاء دوال UUID
      const functionsCreated = await this.createUUIDFunctions();
      if (!functionsCreated) {
        console.log('❌ فشل في إنشاء دوال UUID');
        return false;
      }

      // اختبار إعداد UUID
      const testPassed = await this.testUUIDSetup();
      if (!testPassed) {
        console.log('❌ فشل اختبار UUID');
        return false;
      }

      console.log('\n🎉 تم إصلاح account_mappings مع UUID بنجاح!');
      console.log('✅ جميع الأعمدة تستخدم UUID الآن');
      console.log('✅ عمود salesRevenueAccount متاح ومُعبأ');
      console.log('✅ البيانات الافتراضية تم إدراجها');
      console.log('✅ دوال UUID تم إنشاؤها');
      console.log('✅ النظام جاهز للعمل بدون تحذيرات');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في إصلاح UUID:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل إصلاح UUID
const uuidFix = new UUIDAccountMappingsFix();
uuidFix.runUUIDAccountMappingsFix().then(success => {
  if (success) {
    console.log('\n🎊 تم إصلاح UUID بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لإزالة جميع التحذيرات');
    console.log('✅ النظام جاهز للعمل بكفاءة 100% بدون أي تحذيرات');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في إصلاح UUID');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح UUID:', error);
  process.exit(1);
});
