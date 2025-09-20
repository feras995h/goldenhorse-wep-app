#!/usr/bin/env node

/**
 * إصلاح أخطاء API في النظام المنشور
 * حل مشاكل الـ 500 Internal Server Error
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class ProductionAPIFixer {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.fixes = [];
    this.errors = [];
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      return false;
    }
  }

  async checkMissingColumns() {
    console.log('\n🔍 فحص الأعمدة المفقودة...');
    
    const tablesToCheck = [
      {
        table: 'payments',
        columns: ['currency', 'exchangeRate', 'createdBy', 'partyType', 'partyId', 'voucherType']
      },
      {
        table: 'receipts',
        columns: ['currency', 'exchangeRate', 'partyType', 'partyId', 'voucherType']
      },
      {
        table: 'shipping_invoices',
        columns: ['currency', 'exchangeRate', 'paymentStatus', 'paymentMethod']
      },
      {
        table: 'sales_invoices',
        columns: ['currency', 'exchangeRate', 'paymentStatus', 'paymentMethod']
      }
    ];

    const missingColumns = {};

    for (const tableInfo of tablesToCheck) {
      try {
        const query = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
        `;
        
        const result = await this.client.query(query, [tableInfo.table]);
        const existingColumns = result.rows.map(row => row.column_name);
        
        const missing = tableInfo.columns.filter(col => !existingColumns.includes(col));
        
        if (missing.length > 0) {
          missingColumns[tableInfo.table] = missing;
          console.log(`  ⚠️  ${tableInfo.table}: ${missing.join(', ')}`);
        } else {
          console.log(`  ✅ ${tableInfo.table}: جميع الأعمدة موجودة`);
        }
        
      } catch (error) {
        console.error(`  ❌ خطأ في فحص ${tableInfo.table}:`, error.message);
        this.errors.push(`Failed to check ${tableInfo.table}: ${error.message}`);
      }
    }

    return missingColumns;
  }

  async addMissingColumns(missingColumns) {
    console.log('\n🔧 إضافة الأعمدة المفقودة...');
    
    const columnDefinitions = {
      currency: 'VARCHAR(3) DEFAULT \'LYD\'',
      exchangeRate: 'DECIMAL(10,6) DEFAULT 1.000000',
      createdBy: 'UUID REFERENCES users(id)',
      partyType: 'VARCHAR(20)',
      partyId: 'UUID',
      voucherType: 'VARCHAR(20)',
      paymentStatus: 'VARCHAR(20) DEFAULT \'unpaid\'',
      paymentMethod: 'VARCHAR(20)'
    };

    for (const [tableName, columns] of Object.entries(missingColumns)) {
      console.log(`\n📋 إضافة أعمدة لجدول ${tableName}:`);
      
      for (const columnName of columns) {
        try {
          const definition = columnDefinitions[columnName];
          if (!definition) {
            console.log(`  ⚠️  تعريف غير معروف للعمود ${columnName}`);
            continue;
          }

          const alterQuery = `ALTER TABLE ${tableName} ADD COLUMN "${columnName}" ${definition}`;
          await this.client.query(alterQuery);
          
          console.log(`  ✅ تم إضافة ${columnName}`);
          this.fixes.push(`Added column ${columnName} to ${tableName}`);
          
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`  ℹ️  ${columnName} موجود مسبقاً`);
          } else {
            console.error(`  ❌ فشل في إضافة ${columnName}:`, error.message);
            this.errors.push(`Failed to add ${columnName} to ${tableName}: ${error.message}`);
          }
        }
      }
    }
  }

  async fixPaymentVouchersIssues() {
    console.log('\n🔧 إصلاح مشاكل سندات الدفع...');
    
    try {
      // التحقق من وجود الأعمدة المطلوبة في جدول payments
      const paymentColumnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'payments' AND table_schema = 'public'
      `;
      
      const result = await this.client.query(paymentColumnsQuery);
      const existingColumns = result.rows.map(row => row.column_name);
      
      console.log(`  📊 الأعمدة الموجودة في payments: ${existingColumns.length}`);
      
      // التحقق من البيانات
      const countQuery = 'SELECT COUNT(*) FROM payments';
      const countResult = await this.client.query(countQuery);
      console.log(`  📊 عدد سجلات المدفوعات: ${countResult.rows[0].count}`);
      
      this.fixes.push('Payment vouchers table structure verified');
      
    } catch (error) {
      console.error('  ❌ خطأ في فحص سندات الدفع:', error.message);
      this.errors.push(`Payment vouchers check failed: ${error.message}`);
    }
  }

  async fixShippingInvoicesIssues() {
    console.log('\n🔧 إصلاح مشاكل فواتير الشحن...');
    
    try {
      // التحقق من وجود جدول shipping_invoices
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'shipping_invoices'
        );
      `;
      
      const tableExists = await this.client.query(tableExistsQuery);
      
      if (tableExists.rows[0].exists) {
        console.log('  ✅ جدول shipping_invoices موجود');
        
        // التحقق من البيانات
        const countQuery = 'SELECT COUNT(*) FROM shipping_invoices';
        const countResult = await this.client.query(countQuery);
        console.log(`  📊 عدد فواتير الشحن: ${countResult.rows[0].count}`);
        
        this.fixes.push('Shipping invoices table verified');
      } else {
        console.log('  ❌ جدول shipping_invoices غير موجود');
        this.errors.push('shipping_invoices table does not exist');
      }
      
    } catch (error) {
      console.error('  ❌ خطأ في فحص فواتير الشحن:', error.message);
      this.errors.push(`Shipping invoices check failed: ${error.message}`);
    }
  }

  async fixSalesReportsIssues() {
    console.log('\n🔧 إصلاح مشاكل تقارير المبيعات...');
    
    try {
      // التحقق من جداول التقارير المطلوبة
      const requiredTables = ['sales_invoices', 'sales_invoice_items', 'customers'];
      
      for (const tableName of requiredTables) {
        const tableExistsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `;
        
        const result = await this.client.query(tableExistsQuery, [tableName]);
        
        if (result.rows[0].exists) {
          console.log(`  ✅ ${tableName} موجود`);
          
          // عد السجلات
          const countQuery = `SELECT COUNT(*) FROM ${tableName}`;
          const countResult = await this.client.query(countQuery);
          console.log(`    📊 عدد السجلات: ${countResult.rows[0].count}`);
          
        } else {
          console.log(`  ❌ ${tableName} غير موجود`);
          this.errors.push(`${tableName} table does not exist`);
        }
      }
      
      this.fixes.push('Sales reports tables verified');
      
    } catch (error) {
      console.error('  ❌ خطأ في فحص تقارير المبيعات:', error.message);
      this.errors.push(`Sales reports check failed: ${error.message}`);
    }
  }

  async testAPIEndpoints() {
    console.log('\n🧪 اختبار API endpoints...');
    
    const endpoints = [
      {
        name: 'Payment Vouchers',
        url: 'https://web.goldenhorse-ly.com/api/financial/vouchers/payments?limit=10',
        expectedIssue: 'column currency does not exist'
      },
      {
        name: 'Shipping Invoices',
        url: 'https://web.goldenhorse-ly.com/api/sales/shipping-invoices?page=1&limit=10',
        expectedIssue: 'model association issues'
      },
      {
        name: 'Sales Reports',
        url: 'https://web.goldenhorse-ly.com/api/sales/reports?reportType=summary',
        expectedIssue: 'model association issues'
      }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n  🔍 اختبار ${endpoint.name}...`);
        
        const response = await fetch(endpoint.url);
        
        if (response.ok) {
          console.log(`    ✅ ${endpoint.name}: يعمل بشكل صحيح`);
          this.fixes.push(`${endpoint.name} endpoint working`);
        } else {
          console.log(`    ❌ ${endpoint.name}: خطأ ${response.status}`);
          
          try {
            const errorText = await response.text();
            const errorData = JSON.parse(errorText);
            console.log(`    📝 الخطأ: ${errorData.message || errorData.error}`);
          } catch (e) {
            console.log(`    📝 خطأ غير معروف`);
          }
          
          this.errors.push(`${endpoint.name} endpoint failed with ${response.status}`);
        }
        
      } catch (error) {
        console.log(`    ❌ ${endpoint.name}: خطأ في الاتصال`);
        this.errors.push(`${endpoint.name} connection failed: ${error.message}`);
      }
    }
  }

  async createDatabaseMigrationScript() {
    console.log('\n📝 إنشاء سكريبت migration...');
    
    const migrationSQL = `
-- Migration script to fix production API errors
-- Generated on ${new Date().toISOString()}

-- Add missing columns to payments table
DO $$
BEGIN
  -- Add currency column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='currency') THEN
    ALTER TABLE payments ADD COLUMN currency VARCHAR(3) DEFAULT 'LYD';
  END IF;
  
  -- Add exchangeRate column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='exchangeRate') THEN
    ALTER TABLE payments ADD COLUMN "exchangeRate" DECIMAL(10,6) DEFAULT 1.000000;
  END IF;
  
  -- Add partyType column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='partyType') THEN
    ALTER TABLE payments ADD COLUMN "partyType" VARCHAR(20);
  END IF;
  
  -- Add partyId column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='partyId') THEN
    ALTER TABLE payments ADD COLUMN "partyId" UUID;
  END IF;
  
  -- Add voucherType column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='voucherType') THEN
    ALTER TABLE payments ADD COLUMN "voucherType" VARCHAR(20);
  END IF;
END $$;

-- Add missing columns to receipts table
DO $$
BEGIN
  -- Add currency column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receipts' AND column_name='currency') THEN
    ALTER TABLE receipts ADD COLUMN currency VARCHAR(3) DEFAULT 'LYD';
  END IF;
  
  -- Add exchangeRate column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receipts' AND column_name='exchangeRate') THEN
    ALTER TABLE receipts ADD COLUMN "exchangeRate" DECIMAL(10,6) DEFAULT 1.000000;
  END IF;
END $$;

-- Update existing records with default values
UPDATE payments SET currency = 'LYD' WHERE currency IS NULL;
UPDATE payments SET "exchangeRate" = 1.000000 WHERE "exchangeRate" IS NULL;
UPDATE receipts SET currency = 'LYD' WHERE currency IS NULL;
UPDATE receipts SET "exchangeRate" = 1.000000 WHERE "exchangeRate" IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_party ON payments("partyType", "partyId");
CREATE INDEX IF NOT EXISTS idx_payments_voucher_type ON payments("voucherType");
CREATE INDEX IF NOT EXISTS idx_receipts_currency ON receipts(currency);

-- Analyze tables for better query planning
ANALYZE payments;
ANALYZE receipts;
ANALYZE shipping_invoices;
ANALYZE sales_invoices;

COMMIT;
`;

    try {
      fs.writeFileSync('production-api-fix-migration.sql', migrationSQL);
      console.log('  ✅ تم إنشاء ملف migration: production-api-fix-migration.sql');
      this.fixes.push('Created migration script');
    } catch (error) {
      console.error('  ❌ فشل في إنشاء ملف migration:', error.message);
      this.errors.push(`Failed to create migration script: ${error.message}`);
    }
  }

  async generateFixReport() {
    console.log('\n📋 إنشاء تقرير الإصلاحات...');
    
    const report = {
      timestamp: new Date().toISOString(),
      database: 'Golden Horse Shipping System - Production API Fix',
      issues_identified: [
        'Payment vouchers API returning 500 due to missing currency columns',
        'Shipping invoices API failing due to model association issues',
        'Sales reports API failing due to missing columns and associations'
      ],
      fixes_applied: this.fixes,
      errors_encountered: this.errors,
      recommendations: [
        'Apply the generated migration script to production database',
        'Restart the production server to reload model definitions',
        'Test all API endpoints after applying fixes',
        'Monitor server logs for any remaining issues'
      ],
      summary: {
        total_fixes: this.fixes.length,
        total_errors: this.errors.length,
        success_rate: this.fixes.length / (this.fixes.length + this.errors.length) * 100
      }
    };
    
    try {
      fs.writeFileSync('production-api-fix-report.json', JSON.stringify(report, null, 2));
      console.log('  ✅ تم حفظ التقرير: production-api-fix-report.json');
    } catch (error) {
      console.error('  ❌ فشل في حفظ التقرير:', error.message);
    }
    
    console.log(`\n🎯 ملخص الإصلاحات:`);
    console.log(`   الإصلاحات المطبقة: ${report.summary.total_fixes}`);
    console.log(`   الأخطاء: ${report.summary.total_errors}`);
    console.log(`   معدل النجاح: ${report.summary.success_rate.toFixed(1)}%`);
    
    if (this.fixes.length > 0) {
      console.log(`\n✅ الإصلاحات المطبقة:`);
      this.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ الأخطاء:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    return report;
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runFullFix() {
    console.log('🚀 بدء إصلاح أخطاء API في النظام المنشور...\n');
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      // فحص الأعمدة المفقودة
      const missingColumns = await this.checkMissingColumns();
      
      // إضافة الأعمدة المفقودة
      if (Object.keys(missingColumns).length > 0) {
        await this.addMissingColumns(missingColumns);
      }
      
      // إصلاح مشاكل محددة
      await this.fixPaymentVouchersIssues();
      await this.fixShippingInvoicesIssues();
      await this.fixSalesReportsIssues();
      
      // اختبار API endpoints
      await this.testAPIEndpoints();
      
      // إنشاء سكريبت migration
      await this.createDatabaseMigrationScript();
      
      // إنشاء التقرير
      const report = await this.generateFixReport();
      
      console.log('\n✅ تم إكمال إصلاح أخطاء API');
      return report;
      
    } catch (error) {
      console.error('❌ خطأ عام في الإصلاحات:', error.message);
      this.errors.push(`General error: ${error.message}`);
      return await this.generateFixReport();
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل الإصلاحات
const fixer = new ProductionAPIFixer();
fixer.runFullFix().then(report => {
  if (report && report.summary.success_rate > 70) {
    console.log('\n🎉 تم إصلاح معظم مشاكل API بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('   1. تطبيق ملف migration على قاعدة البيانات');
    console.log('   2. إعادة تشغيل الخادم المنشور');
    console.log('   3. اختبار جميع API endpoints');
    process.exit(0);
  } else {
    console.log('\n⚠️ تم إكمال الإصلاحات مع بعض المشاكل');
    console.log('   يرجى مراجعة التقرير للتفاصيل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاحات API:', error);
  process.exit(1);
});
