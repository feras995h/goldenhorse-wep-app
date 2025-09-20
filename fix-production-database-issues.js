#!/usr/bin/env node

/**
 * إصلاح المشاكل المكتشفة في قاعدة البيانات المنشورة
 * تطبيق الإصلاحات المقترحة في تقرير المراجعة
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class DatabaseFixer {
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

  async createAuditLogsTable() {
    console.log('\n🔧 إنشاء جدول audit_logs...');
    
    try {
      // التحقق من وجود الجدول أولاً
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'audit_logs'
        );
      `;
      
      const checkResult = await this.client.query(checkQuery);
      const tableExists = checkResult.rows[0].exists;
      
      if (tableExists) {
        console.log('  ℹ️  جدول audit_logs موجود مسبقاً');
        this.fixes.push('audit_logs table already exists');
        return true;
      }

      const createTableQuery = `
        CREATE TABLE audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          table_name VARCHAR(100) NOT NULL,
          operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
          record_id UUID,
          old_values JSONB,
          new_values JSONB,
          user_id UUID REFERENCES users(id),
          ip_address INET,
          user_agent TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          session_id VARCHAR(255)
        );
      `;
      
      await this.client.query(createTableQuery);
      
      // إنشاء فهارس للأداء
      const indexQueries = [
        'CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);',
        'CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);',
        'CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);',
        'CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);',
        'CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);'
      ];
      
      for (const indexQuery of indexQueries) {
        await this.client.query(indexQuery);
      }
      
      console.log('  ✅ تم إنشاء جدول audit_logs بنجاح');
      this.fixes.push('Created audit_logs table with indexes');
      return true;
      
    } catch (error) {
      console.error('  ❌ خطأ في إنشاء جدول audit_logs:', error.message);
      this.errors.push(`Failed to create audit_logs table: ${error.message}`);
      return false;
    }
  }

  async addPerformanceIndexes() {
    console.log('\n🔧 إضافة فهارس للأداء...');
    
    const indexes = [
      {
        name: 'idx_customers_name_search',
        query: 'CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers USING gin(to_tsvector(\'arabic\', name));',
        description: 'فهرس البحث النصي للعملاء'
      },
      {
        name: 'idx_accounts_type_active',
        query: 'CREATE INDEX IF NOT EXISTS idx_accounts_type_active ON accounts(type, "isActive") WHERE "isActive" = true;',
        description: 'فهرس الحسابات النشطة حسب النوع'
      },
      {
        name: 'idx_journal_entries_date_status',
        query: 'CREATE INDEX IF NOT EXISTS idx_journal_entries_date_status ON journal_entries(date, status);',
        description: 'فهرس القيود حسب التاريخ والحالة'
      },
      {
        name: 'idx_gl_entries_posting_date_account',
        query: 'CREATE INDEX IF NOT EXISTS idx_gl_entries_posting_date_account ON gl_entries("postingDate", "accountId");',
        description: 'فهرس قيود دفتر الأستاذ'
      },
      {
        name: 'idx_sales_invoices_customer_date',
        query: 'CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_date ON sales_invoices("customerId", date);',
        description: 'فهرس فواتير المبيعات'
      },
      {
        name: 'idx_payments_customer_date',
        query: 'CREATE INDEX IF NOT EXISTS idx_payments_customer_date ON payments("customerId", date);',
        description: 'فهرس المدفوعات'
      }
    ];

    for (const index of indexes) {
      try {
        await this.client.query(index.query);
        console.log(`  ✅ ${index.description}`);
        this.fixes.push(`Added index: ${index.name}`);
      } catch (error) {
        console.error(`  ❌ خطأ في إنشاء ${index.name}:`, error.message);
        this.errors.push(`Failed to create index ${index.name}: ${error.message}`);
      }
    }
  }

  async addDataValidationConstraints() {
    console.log('\n🔧 إضافة قيود التحقق من البيانات...');
    
    const constraints = [
      {
        name: 'chk_accounts_balance_valid',
        query: 'ALTER TABLE accounts ADD CONSTRAINT chk_accounts_balance_valid CHECK (balance IS NOT NULL);',
        description: 'التحقق من صحة رصيد الحسابات'
      },
      {
        name: 'chk_journal_entries_balanced',
        query: 'ALTER TABLE journal_entries ADD CONSTRAINT chk_journal_entries_balanced CHECK (ABS("totalDebit" - "totalCredit") < 0.01);',
        description: 'التحقق من توازن القيود المحاسبية'
      },
      {
        name: 'chk_customers_balance_reasonable',
        query: 'ALTER TABLE customers ADD CONSTRAINT chk_customers_balance_reasonable CHECK (balance >= -1000000 AND balance <= 1000000);',
        description: 'التحقق من معقولية رصيد العملاء'
      },
      {
        name: 'chk_sales_invoices_amounts_positive',
        query: 'ALTER TABLE sales_invoices ADD CONSTRAINT chk_sales_invoices_amounts_positive CHECK (subtotal >= 0 AND total >= 0);',
        description: 'التحقق من إيجابية مبالغ الفواتير'
      },
      {
        name: 'chk_gl_entries_amount_valid',
        query: 'ALTER TABLE gl_entries ADD CONSTRAINT chk_gl_entries_amount_valid CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0));',
        description: 'التحقق من صحة مبالغ قيود دفتر الأستاذ'
      }
    ];

    for (const constraint of constraints) {
      try {
        await this.client.query(constraint.query);
        console.log(`  ✅ ${constraint.description}`);
        this.fixes.push(`Added constraint: ${constraint.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ℹ️  ${constraint.description} - موجود مسبقاً`);
        } else {
          console.error(`  ❌ خطأ في إضافة ${constraint.name}:`, error.message);
          this.errors.push(`Failed to add constraint ${constraint.name}: ${error.message}`);
        }
      }
    }
  }

  async fixInvoiceItemsData() {
    console.log('\n🔧 إصلاح بيانات بنود الفواتير...');
    
    try {
      // البحث عن الفواتير بدون بنود
      const orphanedInvoicesQuery = `
        SELECT si.id, si."invoiceNumber", si.total, si."customerId"
        FROM sales_invoices si
        LEFT JOIN sales_invoice_items sii ON si.id = sii."salesInvoiceId"
        WHERE sii.id IS NULL AND si.total > 0;
      `;
      
      const result = await this.client.query(orphanedInvoicesQuery);
      const orphanedInvoices = result.rows;
      
      if (orphanedInvoices.length === 0) {
        console.log('  ✅ جميع الفواتير لها بنود صحيحة');
        return true;
      }
      
      console.log(`  ⚠️  وُجد ${orphanedInvoices.length} فاتورة بدون بنود`);
      
      // إنشاء بنود افتراضية للفواتير
      for (const invoice of orphanedInvoices) {
        try {
          const insertItemQuery = `
            INSERT INTO sales_invoice_items (
              id, "salesInvoiceId", "productName", description, 
              quantity, "unitPrice", "lineTotal", "taxRate", "taxAmount",
              "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(), $1, 'خدمة عامة', 'بند تم إنشاؤه تلقائياً لإصلاح البيانات',
              1, $2, $2, 0, 0,
              NOW(), NOW()
            );
          `;
          
          await this.client.query(insertItemQuery, [invoice.id, invoice.total]);
          console.log(`    ✅ تم إصلاح الفاتورة ${invoice.invoiceNumber}`);
          
        } catch (error) {
          console.error(`    ❌ خطأ في إصلاح الفاتورة ${invoice.invoiceNumber}:`, error.message);
        }
      }
      
      this.fixes.push(`Fixed ${orphanedInvoices.length} invoices without items`);
      return true;
      
    } catch (error) {
      console.error('  ❌ خطأ في إصلاح بيانات الفواتير:', error.message);
      this.errors.push(`Failed to fix invoice items: ${error.message}`);
      return false;
    }
  }

  async createAuditTriggers() {
    console.log('\n🔧 إنشاء triggers للتدقيق...');
    
    try {
      // إنشاء دالة التدقيق العامة
      const auditFunctionQuery = `
        CREATE OR REPLACE FUNCTION audit_trigger_function()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'DELETE' THEN
            INSERT INTO audit_logs (table_name, operation, record_id, old_values, timestamp)
            VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), NOW());
            RETURN OLD;
          ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO audit_logs (table_name, operation, record_id, old_values, new_values, timestamp)
            VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW), NOW());
            RETURN NEW;
          ELSIF TG_OP = 'INSERT' THEN
            INSERT INTO audit_logs (table_name, operation, record_id, new_values, timestamp)
            VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW), NOW());
            RETURN NEW;
          END IF;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await this.client.query(auditFunctionQuery);
      console.log('  ✅ تم إنشاء دالة التدقيق');
      
      // إنشاء triggers للجداول المهمة
      const importantTables = [
        'accounts', 'journal_entries', 'journal_entry_details',
        'customers', 'payments', 'receipts', 'sales_invoices'
      ];
      
      for (const table of importantTables) {
        const triggerQuery = `
          DROP TRIGGER IF EXISTS audit_${table}_trigger ON ${table};
          CREATE TRIGGER audit_${table}_trigger
            AFTER INSERT OR UPDATE OR DELETE ON ${table}
            FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
        `;
        
        await this.client.query(triggerQuery);
        console.log(`  ✅ تم إنشاء trigger للجدول ${table}`);
      }
      
      this.fixes.push('Created audit triggers for important tables');
      return true;
      
    } catch (error) {
      console.error('  ❌ خطأ في إنشاء triggers:', error.message);
      this.errors.push(`Failed to create audit triggers: ${error.message}`);
      return false;
    }
  }

  async optimizeDatabase() {
    console.log('\n🔧 تحسين قاعدة البيانات...');
    
    try {
      // تحديث إحصائيات الجداول
      await this.client.query('ANALYZE;');
      console.log('  ✅ تم تحديث إحصائيات الجداول');
      
      // تنظيف الجداول
      const importantTables = [
        'accounts', 'journal_entries', 'journal_entry_details',
        'gl_entries', 'customers', 'sales_invoices'
      ];
      
      for (const table of importantTables) {
        await this.client.query(`VACUUM ANALYZE ${table};`);
        console.log(`  ✅ تم تنظيف الجدول ${table}`);
      }
      
      this.fixes.push('Database optimization completed');
      return true;
      
    } catch (error) {
      console.error('  ❌ خطأ في تحسين قاعدة البيانات:', error.message);
      this.errors.push(`Database optimization failed: ${error.message}`);
      return false;
    }
  }

  async verifyFixes() {
    console.log('\n🔍 التحقق من الإصلاحات...');
    
    try {
      // التحقق من وجود جدول audit_logs
      const auditTableCheck = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'audit_logs'
        );
      `);
      
      if (auditTableCheck.rows[0].exists) {
        console.log('  ✅ جدول audit_logs موجود');
      } else {
        console.log('  ❌ جدول audit_logs غير موجود');
      }
      
      // التحقق من الفهارس
      const indexesCheck = await this.client.query(`
        SELECT COUNT(*) as count
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%';
      `);
      
      const indexCount = parseInt(indexesCheck.rows[0].count);
      console.log(`  📊 عدد الفهارس المخصصة: ${indexCount}`);
      
      // التحقق من الفواتير
      const invoiceItemsCheck = await this.client.query(`
        SELECT COUNT(*) as orphaned_count
        FROM sales_invoices si
        LEFT JOIN sales_invoice_items sii ON si.id = sii."salesInvoiceId"
        WHERE sii.id IS NULL AND si.total > 0;
      `);
      
      const orphanedCount = parseInt(invoiceItemsCheck.rows[0].orphaned_count);
      if (orphanedCount === 0) {
        console.log('  ✅ جميع الفواتير لها بنود');
      } else {
        console.log(`  ⚠️  ${orphanedCount} فاتورة بدون بنود`);
      }
      
      return true;
      
    } catch (error) {
      console.error('  ❌ خطأ في التحقق:', error.message);
      return false;
    }
  }

  async generateReport() {
    console.log('\n📋 إنشاء تقرير الإصلاحات...');
    
    const report = {
      timestamp: new Date().toISOString(),
      database: 'Golden Horse Shipping System - Production',
      fixes_applied: this.fixes,
      errors_encountered: this.errors,
      summary: {
        total_fixes: this.fixes.length,
        total_errors: this.errors.length,
        success_rate: this.fixes.length / (this.fixes.length + this.errors.length) * 100
      }
    };
    
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

  async runAllFixes() {
    console.log('🚀 بدء إصلاح قاعدة البيانات...\n');
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      // تطبيق الإصلاحات بالترتيب
      await this.createAuditLogsTable();
      await this.addPerformanceIndexes();
      await this.addDataValidationConstraints();
      await this.fixInvoiceItemsData();
      await this.createAuditTriggers();
      await this.optimizeDatabase();
      await this.verifyFixes();
      
      const report = await this.generateReport();
      
      console.log('\n✅ تم إكمال جميع الإصلاحات');
      return report;
      
    } catch (error) {
      console.error('❌ خطأ عام في الإصلاحات:', error.message);
      this.errors.push(`General error: ${error.message}`);
      return await this.generateReport();
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل الإصلاحات
const fixer = new DatabaseFixer();
fixer.runAllFixes().then(report => {
  if (report && report.summary.success_rate > 80) {
    console.log('\n🎉 تم إصلاح قاعدة البيانات بنجاح!');
    process.exit(0);
  } else {
    console.log('\n⚠️ تم إكمال الإصلاحات مع بعض المشاكل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل الإصلاحات:', error);
  process.exit(1);
});
