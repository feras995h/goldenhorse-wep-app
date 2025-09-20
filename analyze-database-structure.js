#!/usr/bin/env node

/**
 * تحليل مفصل لهيكل قاعدة البيانات المنشورة
 * للحصول على فهم دقيق للأعمدة والعلاقات الموجودة
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class DatabaseAnalyzer {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
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

  async analyzeTableStructure(tableName) {
    try {
      const query = `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      const result = await this.client.query(query, [tableName]);
      return result.rows;
    } catch (error) {
      console.error(`خطأ في تحليل جدول ${tableName}:`, error.message);
      return [];
    }
  }

  async analyzeAllTables() {
    console.log('\n🔍 تحليل هياكل الجداول الرئيسية...\n');
    
    const mainTables = [
      'accounts', 'journal_entries', 'journal_entry_details', 'gl_entries',
      'customers', 'suppliers', 'employees', 'users', 'payments', 'receipts',
      'sales_invoices', 'sales_invoice_items', 'fixed_assets'
    ];

    const analysis = {};

    for (const tableName of mainTables) {
      console.log(`📋 تحليل جدول: ${tableName}`);
      const columns = await this.analyzeTableStructure(tableName);
      
      if (columns.length > 0) {
        analysis[tableName] = columns;
        console.log(`   ✅ ${columns.length} عمود`);
        
        // عرض الأعمدة
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          console.log(`      ${col.column_name}: ${col.data_type}${length} ${nullable}`);
        });
      } else {
        console.log(`   ❌ الجدول غير موجود أو فارغ`);
      }
      console.log('');
    }

    return analysis;
  }

  async checkForeignKeys() {
    console.log('\n🔗 تحليل المفاتيح الخارجية...\n');
    
    try {
      const query = `
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
      `;
      
      const result = await this.client.query(query);
      
      console.log(`📊 إجمالي المفاتيح الخارجية: ${result.rows.length}\n`);
      
      const groupedByTable = {};
      result.rows.forEach(row => {
        if (!groupedByTable[row.table_name]) {
          groupedByTable[row.table_name] = [];
        }
        groupedByTable[row.table_name].push(row);
      });

      Object.keys(groupedByTable).forEach(tableName => {
        console.log(`📋 ${tableName}:`);
        groupedByTable[tableName].forEach(fk => {
          console.log(`   ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        console.log('');
      });

      return result.rows;
    } catch (error) {
      console.error('خطأ في تحليل المفاتيح الخارجية:', error.message);
      return [];
    }
  }

  async checkDataCounts() {
    console.log('\n📊 إحصائيات البيانات...\n');
    
    const tables = [
      'accounts', 'customers', 'suppliers', 'employees', 'users',
      'journal_entries', 'journal_entry_details', 'gl_entries',
      'payments', 'receipts', 'sales_invoices', 'sales_invoice_items',
      'fixed_assets', 'notifications', 'settings'
    ];

    const counts = {};

    for (const table of tables) {
      try {
        const result = await this.client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        counts[table] = count;
        console.log(`📋 ${table}: ${count} سجل`);
      } catch (error) {
        console.log(`❌ ${table}: خطأ في العد - ${error.message}`);
        counts[table] = 'ERROR';
      }
    }

    return counts;
  }

  async checkAccountingEquation() {
    console.log('\n⚖️ فحص معادلة المحاسبة...\n');
    
    try {
      // حساب إجمالي الأصول
      const assetsQuery = `
        SELECT COALESCE(SUM(balance), 0) as total_assets
        FROM accounts 
        WHERE type = 'asset' AND "isActive" = true
      `;
      
      // حساب إجمالي الخصوم
      const liabilitiesQuery = `
        SELECT COALESCE(SUM(balance), 0) as total_liabilities
        FROM accounts 
        WHERE type = 'liability' AND "isActive" = true
      `;
      
      // حساب إجمالي حقوق الملكية
      const equityQuery = `
        SELECT COALESCE(SUM(balance), 0) as total_equity
        FROM accounts 
        WHERE type = 'equity' AND "isActive" = true
      `;

      const [assetsResult, liabilitiesResult, equityResult] = await Promise.all([
        this.client.query(assetsQuery),
        this.client.query(liabilitiesQuery),
        this.client.query(equityQuery)
      ]);

      const totalAssets = parseFloat(assetsResult.rows[0].total_assets);
      const totalLiabilities = parseFloat(liabilitiesResult.rows[0].total_liabilities);
      const totalEquity = parseFloat(equityResult.rows[0].total_equity);

      console.log(`📊 إجمالي الأصول: ${totalAssets.toFixed(2)} LYD`);
      console.log(`📊 إجمالي الخصوم: ${totalLiabilities.toFixed(2)} LYD`);
      console.log(`📊 إجمالي حقوق الملكية: ${totalEquity.toFixed(2)} LYD`);

      const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity));
      console.log(`📊 الفرق: ${difference.toFixed(2)} LYD`);

      if (difference < 0.01) {
        console.log(`✅ معادلة المحاسبة متوازنة`);
      } else {
        console.log(`⚠️ معادلة المحاسبة غير متوازنة`);
      }

      return {
        totalAssets,
        totalLiabilities,
        totalEquity,
        difference,
        balanced: difference < 0.01
      };

    } catch (error) {
      console.error('خطأ في فحص معادلة المحاسبة:', error.message);
      return null;
    }
  }

  async checkSystemUsers() {
    console.log('\n👥 فحص المستخدمين...\n');
    
    try {
      const usersQuery = `
        SELECT 
          id, email, "firstName", "lastName", role, "isActive",
          "hasFinancialAccess", "createdAt"
        FROM users 
        ORDER BY "createdAt"
      `;
      
      const result = await this.client.query(usersQuery);
      
      console.log(`📊 إجمالي المستخدمين: ${result.rows.length}\n`);
      
      result.rows.forEach((user, index) => {
        const status = user.isActive ? '✅ نشط' : '❌ غير نشط';
        const financial = user.hasFinancialAccess ? '💰 مالي' : '📋 عادي';
        console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
        console.log(`   الدور: ${user.role} | الحالة: ${status} | الصلاحية: ${financial}`);
        console.log(`   تاريخ الإنشاء: ${new Date(user.createdAt).toLocaleDateString('ar')}\n`);
      });

      return result.rows;
    } catch (error) {
      console.error('خطأ في فحص المستخدمين:', error.message);
      return [];
    }
  }

  async generateDetailedReport() {
    console.log('🚀 بدء التحليل المفصل لقاعدة البيانات...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      database: 'Golden Horse Shipping System - Production',
      analysis: {}
    };

    try {
      // تحليل هياكل الجداول
      report.analysis.tableStructures = await this.analyzeAllTables();
      
      // تحليل المفاتيح الخارجية
      report.analysis.foreignKeys = await this.checkForeignKeys();
      
      // إحصائيات البيانات
      report.analysis.dataCounts = await this.checkDataCounts();
      
      // فحص معادلة المحاسبة
      report.analysis.accountingEquation = await this.checkAccountingEquation();
      
      // فحص المستخدمين
      report.analysis.systemUsers = await this.checkSystemUsers();

      // حفظ التقرير
      const reportFileName = `detailed-database-analysis-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
      console.log(`\n💾 تم حفظ التقرير المفصل في: ${reportFileName}`);

      return report;

    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error.message);
      return null;
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

  async run() {
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      const report = await this.generateDetailedReport();
      return report;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل التحليل
const analyzer = new DatabaseAnalyzer();
analyzer.run().then(report => {
  if (report) {
    console.log('\n✅ تم إكمال التحليل بنجاح');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في التحليل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ خطأ في تشغيل التحليل:', error);
  process.exit(1);
});
