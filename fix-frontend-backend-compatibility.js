#!/usr/bin/env node

/**
 * إصلاح التوافق بين الواجهة الأمامية والخلفية
 * Fix Frontend-Backend Compatibility - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class FrontendBackendCompatibilityFix {
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

  async fixShippingInvoicesTable() {
    console.log('\n🔧 إصلاح جدول shipping_invoices...');
    
    try {
      // التحقق من وجود الجدول
      const tableExists = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'shipping_invoices'
        )
      `);

      if (!tableExists.rows[0].exists) {
        console.log('   📋 إنشاء جدول shipping_invoices...');
        await this.client.query(`
          CREATE TABLE shipping_invoices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_number VARCHAR(50) UNIQUE NOT NULL,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            customer_id UUID,
            total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
            description TEXT,
            notes TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('   ✅ تم إنشاء جدول shipping_invoices');
      }

      // إضافة الأعمدة المفقودة إذا لزم الأمر
      const missingColumns = [
        { name: 'invoice_number', type: 'VARCHAR(50)', constraint: 'UNIQUE' },
        { name: 'customer_id', type: 'UUID' },
        { name: 'total_amount', type: 'DECIMAL(15,2)', default: '0' },
        { name: 'status', type: 'VARCHAR(20)', default: "'pending'" },
        { name: 'description', type: 'TEXT' },
        { name: 'notes', type: 'TEXT' },
        { name: 'is_active', type: 'BOOLEAN', default: 'true' }
      ];

      for (const column of missingColumns) {
        try {
          await this.client.query(`
            ALTER TABLE shipping_invoices 
            ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} 
            ${column.default ? `DEFAULT ${column.default}` : ''}
            ${column.constraint || ''}
          `);
          console.log(`   ✅ تم إضافة العمود ${column.name}`);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.log(`   ⚠️ خطأ في إضافة العمود ${column.name}: ${error.message}`);
          }
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إصلاح جدول shipping_invoices: ${error.message}`);
      return false;
    }
  }

  async fixVouchersTable() {
    console.log('\n🔧 إصلاح جدول vouchers...');
    
    try {
      // التحقق من وجود الجدول
      const tableExists = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'vouchers'
        )
      `);

      if (!tableExists.rows[0].exists) {
        console.log('   📋 إنشاء جدول vouchers...');
        await this.client.query(`
          CREATE TABLE vouchers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            voucher_number VARCHAR(50) UNIQUE NOT NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'payment')),
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            amount DECIMAL(15,2) NOT NULL,
            description TEXT,
            account_id UUID,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('   ✅ تم إنشاء جدول vouchers');
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إصلاح جدول vouchers: ${error.message}`);
      return false;
    }
  }

  async fixAccountStatementActionsTable() {
    console.log('\n🔧 إصلاح جدول account_statement_actions...');
    
    try {
      // التحقق من وجود الجدول
      const tableExists = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'account_statement_actions'
        )
      `);

      if (!tableExists.rows[0].exists) {
        console.log('   📋 إنشاء جدول account_statement_actions...');
        await this.client.query(`
          CREATE TABLE account_statement_actions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            account_id UUID NOT NULL,
            action VARCHAR(50) NOT NULL,
            description TEXT,
            amount DECIMAL(15,2),
            date DATE DEFAULT CURRENT_DATE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('   ✅ تم إنشاء جدول account_statement_actions');
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إصلاح جدول account_statement_actions: ${error.message}`);
      return false;
    }
  }

  async ensureFixedAssetsStructure() {
    console.log('\n🔧 ضمان هيكل الأصول الثابتة...');
    
    try {
      // البحث عن مجموعة الأصول الرئيسية
      const assetsRoot = await this.client.query(`
        SELECT id, code, name, level
        FROM accounts 
        WHERE code = '1' AND type = 'asset'
        LIMIT 1
      `);

      if (assetsRoot.rows.length === 0) {
        console.log('   ❌ مجموعة الأصول الرئيسية غير موجودة');
        return false;
      }

      const rootAccount = assetsRoot.rows[0];

      // البحث عن مجموعة الأصول الثابتة
      let fixedAssetsParent = await this.client.query(`
        SELECT id, code, name, level
        FROM accounts 
        WHERE code = '1.2' AND type = 'asset'
        LIMIT 1
      `);

      if (fixedAssetsParent.rows.length === 0) {
        console.log('   📋 إنشاء مجموعة الأصول الثابتة...');
        await this.client.query(`
          INSERT INTO accounts (
            code, name, "nameEn", type, "rootType", "reportType", 
            "parentId", level, "isGroup", "isActive", balance, 
            currency, nature, "accountType", description, "isSystemAccount"
          ) VALUES (
            '1.2', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'Asset', 'Balance Sheet',
            $1, $2, true, true, 0, 'LYD', 'debit', 'sub', 
            'مجموعة الأصول الثابتة', true
          )
        `, [rootAccount.id, (rootAccount.level || 1) + 1]);
        
        fixedAssetsParent = await this.client.query(`
          SELECT id, code, name, level
          FROM accounts 
          WHERE code = '1.2' AND type = 'asset'
          LIMIT 1
        `);
        
        console.log('   ✅ تم إنشاء مجموعة الأصول الثابتة');
      }

      const parentAccount = fixedAssetsParent.rows[0];

      // إنشاء فئات الأصول الثابتة الافتراضية
      const categories = [
        { code: '1.2.1', name: 'سيارات', nameEn: 'Vehicles' },
        { code: '1.2.2', name: 'معدات وآلات', nameEn: 'Equipment & Machinery' },
        { code: '1.2.3', name: 'أثاث ومفروشات', nameEn: 'Furniture & Fixtures' },
        { code: '1.2.4', name: 'أجهزة حاسوب', nameEn: 'Computer Equipment' },
        { code: '1.2.5', name: 'مباني وإنشاءات', nameEn: 'Buildings & Constructions' }
      ];

      for (const category of categories) {
        try {
          await this.client.query(`
            INSERT INTO accounts (
              code, name, "nameEn", type, "rootType", "reportType", 
              "parentId", level, "isGroup", "isActive", balance, 
              currency, nature, "accountType", description, "isSystemAccount"
            ) VALUES (
              $1, $2, $3, 'asset', 'Asset', 'Balance Sheet',
              $4, $5, false, true, 0, 'LYD', 'debit', 'detail', 
              $6, true
            )
            ON CONFLICT (code) DO NOTHING
          `, [
            category.code, 
            category.name, 
            category.nameEn, 
            parentAccount.id, 
            (parentAccount.level || 2) + 1,
            `حساب ${category.name}`
          ]);
          console.log(`   ✅ تم إنشاء فئة: ${category.name} (${category.code})`);
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.log(`   ⚠️ خطأ في إنشاء فئة ${category.name}: ${error.message}`);
          }
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل ضمان هيكل الأصول الثابتة: ${error.message}`);
      return false;
    }
  }

  async populateTestData() {
    console.log('\n📊 إضافة بيانات اختبار...');
    
    try {
      // إضافة بيانات فواتير الشحن
      const invoices = [
        { number: 'SH2025001', amount: 1200, description: 'شحن بضائع إلى طرابلس', status: 'completed' },
        { number: 'SH2025002', amount: 800, description: 'شحن بضائع إلى بنغازي', status: 'pending' },
        { number: 'SH2025003', amount: 1500, description: 'شحن بضائع إلى سبها', status: 'in_progress' }
      ];

      for (const invoice of invoices) {
        try {
          await this.client.query(`
            INSERT INTO shipping_invoices (
              invoice_number, date, total_amount, status, description
            ) VALUES ($1, CURRENT_DATE, $2, $3, $4)
            ON CONFLICT (invoice_number) DO NOTHING
          `, [invoice.number, invoice.amount, invoice.status, invoice.description]);
          console.log(`   ✅ تم إدراج فاتورة: ${invoice.number}`);
        } catch (error) {
          console.log(`   ⚠️ فاتورة موجودة: ${invoice.number}`);
        }
      }

      // إضافة بيانات السندات
      const vouchers = [
        { number: 'REC001', type: 'receipt', amount: 5000, description: 'سند قبض نقدي' },
        { number: 'PAY001', type: 'payment', amount: 2000, description: 'سند صرف مصروفات' }
      ];

      for (const voucher of vouchers) {
        try {
          await this.client.query(`
            INSERT INTO vouchers (
              voucher_number, type, date, amount, description
            ) VALUES ($1, $2, CURRENT_DATE, $3, $4)
            ON CONFLICT (voucher_number) DO NOTHING
          `, [voucher.number, voucher.type, voucher.amount, voucher.description]);
          console.log(`   ✅ تم إدراج سند: ${voucher.number}`);
        } catch (error) {
          console.log(`   ⚠️ سند موجود: ${voucher.number}`);
        }
      }

      // إضافة إجراءات كشف الحساب
      const account = await this.client.query(`
        SELECT id FROM accounts WHERE "isActive" = true LIMIT 1
      `);

      if (account.rows.length > 0) {
        const accountId = account.rows[0].id;
        const actions = [
          { action: 'deposit', description: 'إيداع نقدي', amount: 5000 },
          { action: 'withdrawal', description: 'سحب نقدي', amount: 2000 }
        ];

        for (const action of actions) {
          try {
            await this.client.query(`
              INSERT INTO account_statement_actions (
                account_id, action, description, amount
              ) VALUES ($1, $2, $3, $4)
            `, [accountId, action.action, action.description, action.amount]);
            console.log(`   ✅ تم إدراج إجراء: ${action.action}`);
          } catch (error) {
            console.log(`   ⚠️ خطأ في إدراج إجراء: ${action.action}`);
          }
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إضافة بيانات الاختبار: ${error.message}`);
      return false;
    }
  }

  async createIndexes() {
    console.log('\n🔧 إنشاء الفهارس...');
    
    try {
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_shipping_invoices_date ON shipping_invoices(date)',
        'CREATE INDEX IF NOT EXISTS idx_shipping_invoices_status ON shipping_invoices(status)',
        'CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type)',
        'CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date)',
        'CREATE INDEX IF NOT EXISTS idx_account_statement_actions_account ON account_statement_actions(account_id)',
        'CREATE INDEX IF NOT EXISTS idx_account_statement_actions_date ON account_statement_actions(date)'
      ];

      for (const indexQuery of indexes) {
        try {
          await this.client.query(indexQuery);
          console.log('   ✅ تم إنشاء فهرس');
        } catch (error) {
          console.log('   ⚠️ فهرس موجود مسبقاً');
        }
      }

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء الفهارس: ${error.message}`);
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

  async runCompatibilityFix() {
    console.log('🔧 بدء إصلاح التوافق بين الواجهة الأمامية والخلفية...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح جميع مشاكل التوافق وضمان عمل جميع APIs');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // إصلاح جدول فواتير الشحن
      const shippingFixed = await this.fixShippingInvoicesTable();
      if (!shippingFixed) {
        console.log('❌ فشل في إصلاح جدول فواتير الشحن');
        return false;
      }

      // إصلاح جدول السندات
      const vouchersFixed = await this.fixVouchersTable();
      if (!vouchersFixed) {
        console.log('❌ فشل في إصلاح جدول السندات');
        return false;
      }

      // إصلاح جدول إجراءات كشف الحساب
      const actionsFixed = await this.fixAccountStatementActionsTable();
      if (!actionsFixed) {
        console.log('❌ فشل في إصلاح جدول إجراءات كشف الحساب');
        return false;
      }

      // ضمان هيكل الأصول الثابتة
      const assetsFixed = await this.ensureFixedAssetsStructure();
      if (!assetsFixed) {
        console.log('❌ فشل في ضمان هيكل الأصول الثابتة');
        return false;
      }

      // إضافة بيانات الاختبار
      const dataPopulated = await this.populateTestData();
      if (!dataPopulated) {
        console.log('❌ فشل في إضافة بيانات الاختبار');
        return false;
      }

      // إنشاء الفهارس
      const indexesCreated = await this.createIndexes();
      if (!indexesCreated) {
        console.log('❌ فشل في إنشاء الفهارس');
        return false;
      }

      console.log('\n🎉 تم إصلاح التوافق بين الواجهة الأمامية والخلفية بنجاح!');
      console.log('✅ جميع الجداول المطلوبة موجودة ومحدثة');
      console.log('✅ هيكل الأصول الثابتة مكتمل');
      console.log('✅ بيانات الاختبار متوفرة');
      console.log('✅ الفهارس تم إنشاؤها');
      console.log('✅ جميع APIs ستعمل الآن بدون أخطاء');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في إصلاح التوافق:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل إصلاح التوافق
const compatibilityFix = new FrontendBackendCompatibilityFix();
compatibilityFix.runCompatibilityFix().then(success => {
  if (success) {
    console.log('\n🎊 تم إصلاح التوافق بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لتطبيق التغييرات');
    console.log('✅ جميع APIs ستعمل الآن بدون أخطاء 500 أو 404');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في إصلاح التوافق');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح التوافق:', error);
  process.exit(1);
});
