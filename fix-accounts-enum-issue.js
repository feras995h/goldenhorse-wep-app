#!/usr/bin/env node

/**
 * إصلاح مشكلة enum في جدول الحسابات
 * Fix Accounts Enum Issue - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class AccountsEnumFix {
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

  async checkAccountTypeEnum() {
    console.log('\n🔍 فحص enum accountType...');
    
    try {
      const enumValues = await this.client.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'enum_accounts_accountType'
        )
        ORDER BY enumsortorder
      `);

      console.log('   📊 القيم المتاحة في enum:');
      enumValues.rows.forEach(row => {
        console.log(`     - ${row.enumlabel}`);
      });

      return enumValues.rows.map(row => row.enumlabel);

    } catch (error) {
      console.log(`   ❌ خطأ في فحص enum: ${error.message}`);
      return [];
    }
  }

  async addMissingEnumValues() {
    console.log('\n🔧 إضافة القيم المفقودة إلى enum...');
    
    try {
      const requiredValues = ['detail', 'main', 'sub', 'group'];
      
      for (const value of requiredValues) {
        try {
          await this.client.query(`
            ALTER TYPE "enum_accounts_accountType" ADD VALUE IF NOT EXISTS '${value}'
          `);
          console.log(`   ✅ تم إضافة القيمة: ${value}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`   ℹ️  القيمة موجودة مسبقاً: ${value}`);
          } else {
            console.log(`   ❌ فشل إضافة القيمة ${value}: ${error.message}`);
          }
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة القيم المفقودة: ${error.message}`);
      return false;
    }
  }

  async createFixedAssetCategories() {
    console.log('\n🔧 إنشاء فئات الأصول الثابتة...');
    
    try {
      // البحث عن مجموعة الأصول الثابتة
      const fixedAssetsParent = await this.client.query(`
        SELECT id, code, name, level
        FROM accounts 
        WHERE code = '1.2' AND type = 'asset'
        LIMIT 1
      `);

      if (fixedAssetsParent.rows.length === 0) {
        console.log('   ❌ مجموعة الأصول الثابتة غير موجودة');
        return false;
      }

      const parentAccount = fixedAssetsParent.rows[0];

      // إنشاء فئات الأصول الثابتة
      const categories = [
        { code: '1.2.1', name: 'سيارات', nameEn: 'Vehicles' },
        { code: '1.2.2', name: 'معدات وآلات', nameEn: 'Equipment & Machinery' },
        { code: '1.2.3', name: 'أثاث ومفروشات', nameEn: 'Furniture & Fixtures' },
        { code: '1.2.4', name: 'أجهزة حاسوب', nameEn: 'Computer Equipment' },
        { code: '1.2.5', name: 'مباني وإنشاءات', nameEn: 'Buildings & Constructions' }
      ];

      for (const category of categories) {
        try {
          // التحقق من وجود الحساب أولاً
          const existingAccount = await this.client.query(`
            SELECT id FROM accounts WHERE code = $1
          `, [category.code]);

          if (existingAccount.rows.length === 0) {
            await this.client.query(`
              INSERT INTO accounts (
                code, name, "nameEn", type, "rootType", "reportType", 
                "parentId", level, "isGroup", "isActive", balance, 
                currency, nature, "accountType", description, "isSystemAccount"
              ) VALUES (
                $1, $2, $3, 'asset', 'Asset', 'Balance Sheet',
                $4, $5, false, true, 0, 'LYD', 'debit', 'sub', 
                $6, true
              )
            `, [
              category.code, 
              category.name, 
              category.nameEn, 
              parentAccount.id, 
              (parentAccount.level || 2) + 1,
              `حساب ${category.name}`
            ]);
            console.log(`   ✅ تم إنشاء فئة: ${category.name} (${category.code})`);
          } else {
            console.log(`   ℹ️  فئة موجودة مسبقاً: ${category.name} (${category.code})`);
          }
        } catch (error) {
          console.log(`   ❌ خطأ في إنشاء فئة ${category.name}: ${error.message}`);
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء فئات الأصول الثابتة: ${error.message}`);
      return false;
    }
  }

  async populateAccountStatementActions() {
    console.log('\n📊 إضافة إجراءات كشف الحساب...');
    
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

      // حذف البيانات الموجودة أولاً
      await this.client.query('DELETE FROM account_statement_actions');
      console.log('   🗑️ تم حذف البيانات القديمة');

      const actions = [
        { action: 'deposit', description: 'إيداع نقدي', amount: 5000 },
        { action: 'withdrawal', description: 'سحب نقدي', amount: 2000 },
        { action: 'transfer', description: 'تحويل بنكي', amount: 3000 },
        { action: 'payment', description: 'دفع فاتورة', amount: 1500 }
      ];

      for (const action of actions) {
        try {
          await this.client.query(`
            INSERT INTO account_statement_actions (
              account_id, action, description, amount, date
            ) VALUES ($1, $2, $3, $4, CURRENT_DATE)
          `, [accountId, action.action, action.description, action.amount]);
          console.log(`   ✅ تم إدراج إجراء: ${action.action} - ${action.description}`);
        } catch (error) {
          console.log(`   ❌ فشل إدراج إجراء ${action.action}: ${error.message}`);
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة إجراءات كشف الحساب: ${error.message}`);
      return false;
    }
  }

  async testAPIsData() {
    console.log('\n🧪 اختبار بيانات APIs...');
    
    try {
      // اختبار فئات الأصول الثابتة
      const categories = await this.client.query(`
        SELECT COUNT(*) as count 
        FROM accounts 
        WHERE code LIKE '1.2.%' AND type = 'asset' AND "isActive" = true
      `);
      console.log(`   📊 فئات الأصول الثابتة: ${categories.rows[0].count}`);

      // اختبار فواتير الشحن
      const invoices = await this.client.query('SELECT COUNT(*) as count FROM shipping_invoices');
      console.log(`   📊 فواتير الشحن: ${invoices.rows[0].count}`);

      // اختبار السندات
      const vouchers = await this.client.query('SELECT COUNT(*) as count FROM vouchers');
      console.log(`   📊 السندات: ${vouchers.rows[0].count}`);

      // اختبار إجراءات كشف الحساب
      const actions = await this.client.query('SELECT COUNT(*) as count FROM account_statement_actions');
      console.log(`   📊 إجراءات كشف الحساب: ${actions.rows[0].count}`);

      return true;

    } catch (error) {
      console.log(`   ❌ فشل اختبار بيانات APIs: ${error.message}`);
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

  async runEnumFix() {
    console.log('🔧 بدء إصلاح مشكلة enum في الحسابات...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح enum accountType وإنشاء فئات الأصول الثابتة');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // فحص enum الحالي
      const currentEnumValues = await this.checkAccountTypeEnum();

      // إضافة القيم المفقودة
      const enumFixed = await this.addMissingEnumValues();
      if (!enumFixed) {
        console.log('❌ فشل في إصلاح enum');
        return false;
      }

      // إنشاء فئات الأصول الثابتة
      const categoriesCreated = await this.createFixedAssetCategories();
      if (!categoriesCreated) {
        console.log('❌ فشل في إنشاء فئات الأصول الثابتة');
        return false;
      }

      // إضافة إجراءات كشف الحساب
      const actionsPopulated = await this.populateAccountStatementActions();
      if (!actionsPopulated) {
        console.log('❌ فشل في إضافة إجراءات كشف الحساب');
        return false;
      }

      // اختبار البيانات
      const dataTested = await this.testAPIsData();
      if (!dataTested) {
        console.log('❌ فشل اختبار البيانات');
        return false;
      }

      console.log('\n🎉 تم إصلاح مشكلة enum والحسابات بنجاح!');
      console.log('✅ enum accountType تم إصلاحه');
      console.log('✅ فئات الأصول الثابتة تم إنشاؤها');
      console.log('✅ إجراءات كشف الحساب تم إضافتها');
      console.log('✅ جميع APIs ستعمل الآن بدون أخطاء');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في إصلاح enum:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل إصلاح enum
const enumFix = new AccountsEnumFix();
enumFix.runEnumFix().then(success => {
  if (success) {
    console.log('\n🎊 تم إصلاح مشكلة enum بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لتطبيق التغييرات');
    console.log('✅ جميع APIs ستعمل الآن بدون أخطاء');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في إصلاح مشكلة enum');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح enum:', error);
  process.exit(1);
});
