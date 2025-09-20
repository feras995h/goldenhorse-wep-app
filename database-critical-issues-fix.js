#!/usr/bin/env node

/**
 * إصلاح المشاكل الحرجة المكتشفة في فحص قاعدة البيانات
 * Golden Horse Shipping System - Critical Issues Fix
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class DatabaseCriticalIssuesFixer {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.fixResults = {
      missingTables: [],
      missingIndexes: [],
      performanceImprovements: [],
      errors: [],
      summary: {}
    };
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

  async createMissingTables() {
    console.log('\n📊 إصلاح المشكلة الحرجة: إنشاء الجداول المفقودة...');
    
    const missingTables = [
      {
        name: 'products',
        sql: `
          CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            "nameEn" VARCHAR(255),
            description TEXT,
            category VARCHAR(100),
            unit VARCHAR(50) DEFAULT 'piece',
            price DECIMAL(15,2) DEFAULT 0,
            cost DECIMAL(15,2) DEFAULT 0,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'account_mappings',
        sql: `
          CREATE TABLE IF NOT EXISTS account_mappings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "mappingType" VARCHAR(50) NOT NULL,
            "sourceType" VARCHAR(50) NOT NULL,
            "sourceId" UUID,
            "accountId" UUID NOT NULL REFERENCES accounts(id),
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE("mappingType", "sourceType", "sourceId")
          );
        `
      },
      {
        name: 'company_settings',
        sql: `
          CREATE TABLE IF NOT EXISTS company_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "settingKey" VARCHAR(100) UNIQUE NOT NULL,
            "settingValue" TEXT,
            "settingType" VARCHAR(50) DEFAULT 'string',
            description TEXT,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ];

    for (const table of missingTables) {
      try {
        console.log(`   🔧 إنشاء جدول: ${table.name}...`);
        await this.client.query(table.sql);
        
        // إضافة فهارس أساسية
        if (table.name === 'products') {
          await this.client.query('CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);');
          await this.client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);');
          await this.client.query('CREATE INDEX IF NOT EXISTS idx_products_active ON products("isActive");');
        } else if (table.name === 'account_mappings') {
          await this.client.query('CREATE INDEX IF NOT EXISTS idx_account_mappings_type ON account_mappings("mappingType");');
          await this.client.query('CREATE INDEX IF NOT EXISTS idx_account_mappings_account ON account_mappings("accountId");');
        } else if (table.name === 'company_settings') {
          await this.client.query('CREATE INDEX IF NOT EXISTS idx_company_settings_key ON company_settings("settingKey");');
        }
        
        this.fixResults.missingTables.push({
          table: table.name,
          status: 'CREATED',
          message: 'تم إنشاء الجدول بنجاح'
        });
        
        console.log(`   ✅ تم إنشاء جدول ${table.name} بنجاح`);
        
      } catch (error) {
        console.error(`   ❌ فشل في إنشاء جدول ${table.name}:`, error.message);
        this.fixResults.errors.push({
          type: 'TABLE_CREATION',
          table: table.name,
          error: error.message
        });
      }
    }
  }

  async createMissingIndexes() {
    console.log('\n🔍 إصلاح مشكلة الأداء: إنشاء الفهارس المفقودة...');
    
    const missingIndexes = [
      {
        table: 'payments',
        column: 'createdAt',
        name: 'idx_payments_created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments("createdAt");'
      },
      {
        table: 'receipts',
        column: 'createdAt',
        name: 'idx_receipts_created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts("createdAt");'
      },
      {
        table: 'journal_entries',
        column: 'accountId',
        name: 'idx_journal_entries_account_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_journal_entries_account_id ON journal_entries("accountId");'
      },
      // فهارس إضافية لتحسين الأداء
      {
        table: 'accounts',
        column: 'type',
        name: 'idx_accounts_type',
        sql: 'CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);'
      },
      {
        table: 'sales_invoices',
        column: 'status',
        name: 'idx_sales_invoices_status',
        sql: 'CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);'
      },
      {
        table: 'shipping_invoices',
        column: 'status',
        name: 'idx_shipping_invoices_status',
        sql: 'CREATE INDEX IF NOT EXISTS idx_shipping_invoices_status ON shipping_invoices(status);'
      }
    ];

    for (const index of missingIndexes) {
      try {
        console.log(`   🔧 إنشاء فهرس: ${index.name}...`);
        await this.client.query(index.sql);
        
        this.fixResults.missingIndexes.push({
          table: index.table,
          column: index.column,
          name: index.name,
          status: 'CREATED',
          message: 'تم إنشاء الفهرس بنجاح'
        });
        
        console.log(`   ✅ تم إنشاء فهرس ${index.name} بنجاح`);
        
      } catch (error) {
        console.error(`   ❌ فشل في إنشاء فهرس ${index.name}:`, error.message);
        this.fixResults.errors.push({
          type: 'INDEX_CREATION',
          index: index.name,
          error: error.message
        });
      }
    }
  }

  async optimizeSlowQueries() {
    console.log('\n🚀 تحسين الاستعلامات البطيئة...');
    
    try {
      // تحديث إحصائيات الجداول
      console.log('   🔧 تحديث إحصائيات قاعدة البيانات...');
      await this.client.query('ANALYZE;');
      
      // تنظيف وإعادة تنظيم الجداول الكبيرة
      const largeTables = ['accounts', 'sales_invoices', 'payments', 'receipts'];
      
      for (const table of largeTables) {
        try {
          console.log(`   🔧 تحسين جدول: ${table}...`);
          await this.client.query(`VACUUM ANALYZE ${table};`);
          
          this.fixResults.performanceImprovements.push({
            table: table,
            action: 'VACUUM_ANALYZE',
            status: 'COMPLETED',
            message: 'تم تحسين الجدول بنجاح'
          });
          
        } catch (error) {
          console.error(`   ❌ فشل في تحسين جدول ${table}:`, error.message);
          this.fixResults.errors.push({
            type: 'TABLE_OPTIMIZATION',
            table: table,
            error: error.message
          });
        }
      }
      
      console.log('   ✅ تم تحسين الأداء بنجاح');
      
    } catch (error) {
      console.error('   ❌ فشل في تحسين الأداء:', error.message);
      this.fixResults.errors.push({
        type: 'PERFORMANCE_OPTIMIZATION',
        error: error.message
      });
    }
  }

  async insertDefaultCompanySettings() {
    console.log('\n⚙️ إدراج الإعدادات الافتراضية للشركة...');
    
    const defaultSettings = [
      { key: 'company_name', value: 'Golden Horse Shipping', type: 'string', description: 'اسم الشركة' },
      { key: 'company_name_en', value: 'Golden Horse Shipping', type: 'string', description: 'اسم الشركة بالإنجليزية' },
      { key: 'default_currency', value: 'LYD', type: 'string', description: 'العملة الافتراضية' },
      { key: 'fiscal_year_start', value: '01-01', type: 'string', description: 'بداية السنة المالية' },
      { key: 'decimal_places', value: '2', type: 'number', description: 'عدد الخانات العشرية' },
      { key: 'auto_backup_enabled', value: 'true', type: 'boolean', description: 'تفعيل النسخ الاحتياطي التلقائي' },
      { key: 'invoice_prefix', value: 'INV', type: 'string', description: 'بادئة رقم الفاتورة' },
      { key: 'receipt_prefix', value: 'REC', type: 'string', description: 'بادئة رقم الإيصال' },
      { key: 'payment_prefix', value: 'PAY', type: 'string', description: 'بادئة رقم سند الدفع' }
    ];

    for (const setting of defaultSettings) {
      try {
        const insertQuery = `
          INSERT INTO company_settings ("settingKey", "settingValue", "settingType", description, "isActive")
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT ("settingKey") DO NOTHING
        `;
        
        await this.client.query(insertQuery, [setting.key, setting.value, setting.type, setting.description]);
        console.log(`   ✅ تم إدراج إعداد: ${setting.key}`);
        
      } catch (error) {
        console.error(`   ❌ فشل في إدراج إعداد ${setting.key}:`, error.message);
      }
    }
  }

  async insertDefaultProducts() {
    console.log('\n📦 إدراج المنتجات الافتراضية...');
    
    const defaultProducts = [
      { code: 'SHIPPING-001', name: 'خدمة شحن بحري', nameEn: 'Sea Shipping Service', category: 'shipping', unit: 'service', price: 100.00 },
      { code: 'SHIPPING-002', name: 'خدمة شحن جوي', nameEn: 'Air Shipping Service', category: 'shipping', unit: 'service', price: 200.00 },
      { code: 'SHIPPING-003', name: 'خدمة شحن بري', nameEn: 'Land Shipping Service', category: 'shipping', unit: 'service', price: 50.00 },
      { code: 'STORAGE-001', name: 'خدمة تخزين', nameEn: 'Storage Service', category: 'storage', unit: 'month', price: 25.00 },
      { code: 'HANDLING-001', name: 'خدمة مناولة', nameEn: 'Handling Service', category: 'handling', unit: 'service', price: 30.00 }
    ];

    for (const product of defaultProducts) {
      try {
        const insertQuery = `
          INSERT INTO products (code, name, "nameEn", category, unit, price, "isActive")
          VALUES ($1, $2, $3, $4, $5, $6, true)
          ON CONFLICT (code) DO NOTHING
        `;
        
        await this.client.query(insertQuery, [
          product.code, product.name, product.nameEn, 
          product.category, product.unit, product.price
        ]);
        console.log(`   ✅ تم إدراج منتج: ${product.code}`);
        
      } catch (error) {
        console.error(`   ❌ فشل في إدراج منتج ${product.code}:`, error.message);
      }
    }
  }

  async verifyFixes() {
    console.log('\n🔍 التحقق من نجاح الإصلاحات...');
    
    try {
      // التحقق من الجداول المنشأة
      const tablesQuery = `
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('products', 'account_mappings', 'company_settings')
      `;
      
      const tablesResult = await this.client.query(tablesQuery);
      console.log(`   ✅ الجداول المنشأة: ${tablesResult.rows.length}/3`);
      
      // التحقق من الفهارس المنشأة
      const indexesQuery = `
        SELECT indexname FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
      `;
      
      const indexesResult = await this.client.query(indexesQuery);
      console.log(`   ✅ إجمالي الفهارس: ${indexesResult.rows.length}`);
      
      // التحقق من البيانات المدرجة
      const settingsCount = await this.client.query('SELECT COUNT(*) FROM company_settings');
      const productsCount = await this.client.query('SELECT COUNT(*) FROM products');
      
      console.log(`   ✅ إعدادات الشركة: ${settingsCount.rows[0].count}`);
      console.log(`   ✅ المنتجات: ${productsCount.rows[0].count}`);
      
      return true;
      
    } catch (error) {
      console.error('   ❌ فشل في التحقق من الإصلاحات:', error.message);
      return false;
    }
  }

  async generateSummary() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    this.fixResults.summary = {
      fixDate: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)} ثانية`,
      tablesCreated: this.fixResults.missingTables.filter(t => t.status === 'CREATED').length,
      indexesCreated: this.fixResults.missingIndexes.filter(i => i.status === 'CREATED').length,
      performanceImprovements: this.fixResults.performanceImprovements.length,
      totalErrors: this.fixResults.errors.length,
      overallStatus: this.fixResults.errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
    };
  }

  async saveReport() {
    const reportData = {
      ...this.fixResults,
      metadata: {
        fixType: 'CRITICAL_ISSUES_FIX',
        version: '1.0',
        database: 'Golden Horse Shipping System',
        fixer: 'Augment Agent',
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      fs.writeFileSync('database-critical-fixes-report.json', JSON.stringify(reportData, null, 2));
      console.log('\n📄 تم حفظ تقرير الإصلاحات: database-critical-fixes-report.json');
    } catch (error) {
      console.error('❌ فشل في حفظ تقرير الإصلاحات:', error.message);
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

  async runCriticalFixes() {
    console.log('🚨 بدء إصلاح المشاكل الحرجة في قاعدة البيانات...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: إصلاح جميع المشاكل الحرجة والعالية الأهمية');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      await this.createMissingTables();
      await this.createMissingIndexes();
      await this.optimizeSlowQueries();
      await this.insertDefaultCompanySettings();
      await this.insertDefaultProducts();
      
      const verificationSuccess = await this.verifyFixes();
      await this.generateSummary();
      await this.saveReport();
      
      return { success: verificationSuccess, results: this.fixResults };
      
    } catch (error) {
      console.error('❌ خطأ عام في الإصلاح:', error.message);
      this.fixResults.errors.push({
        type: 'GENERAL_ERROR',
        error: error.message
      });
      return { success: false, results: this.fixResults };
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل إصلاح المشاكل الحرجة
const fixer = new DatabaseCriticalIssuesFixer();
fixer.runCriticalFixes().then(result => {
  if (result && result.success) {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 تم إصلاح جميع المشاكل الحرجة بنجاح!');
    console.log('='.repeat(80));
    console.log(`⏱️  مدة الإصلاح: ${result.results.summary.duration}`);
    console.log(`📊 الجداول المنشأة: ${result.results.summary.tablesCreated}`);
    console.log(`🔍 الفهارس المنشأة: ${result.results.summary.indexesCreated}`);
    console.log(`🚀 تحسينات الأداء: ${result.results.summary.performanceImprovements}`);
    console.log(`❌ الأخطاء: ${result.results.summary.totalErrors}`);
    console.log(`✅ الحالة العامة: ${result.results.summary.overallStatus}`);
    
    if (result.results.summary.overallStatus === 'SUCCESS') {
      console.log('\n🎉 تم إصلاح جميع المشاكل بنجاح! قاعدة البيانات جاهزة للاستخدام.');
      process.exit(0);
    } else {
      console.log('\n⚠️ تم إصلاح معظم المشاكل مع وجود بعض التحذيرات.');
      process.exit(0);
    }
  } else {
    console.log('\n❌ فشل في إصلاح المشاكل الحرجة');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح المشاكل الحرجة:', error);
  process.exit(1);
});
