#!/usr/bin/env node

/**
 * فحص شامل لقاعدة البيانات المنشورة
 * التحقق من سلامة الهيكل والبيانات والعلاقات
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

// معلومات الاتصال بقاعدة البيانات
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class DatabaseChecker {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.results = {
      connection: false,
      tables: {},
      constraints: {},
      indexes: {},
      data: {},
      errors: [],
      warnings: [],
      summary: {}
    };
  }

  async connect() {
    try {
      await this.client.connect();
      this.results.connection = true;
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      this.results.errors.push(`Connection failed: ${error.message}`);
      return false;
    }
  }

  async checkTables() {
    console.log('\n🔍 فحص الجداول...');
    
    try {
      // قائمة الجداول المطلوبة للنظام المالي
      const requiredTables = [
        'accounts', 'journal_entries', 'journal_entry_details', 'gl_entries',
        'customers', 'suppliers', 'employees', 'users', 'roles',
        'payments', 'receipts', 'sales_invoices', 'sales_invoice_items',
        'fixed_assets', 'payroll_entries', 'notifications',
        'settings', 'audit_logs'
      ];

      // جلب جميع الجداول الموجودة
      const tablesQuery = `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      
      const tablesResult = await this.client.query(tablesQuery);
      const existingTables = tablesResult.rows.map(row => row.table_name);
      
      console.log(`📊 عدد الجداول الموجودة: ${existingTables.length}`);
      
      // التحقق من وجود الجداول المطلوبة
      for (const table of requiredTables) {
        if (existingTables.includes(table)) {
          this.results.tables[table] = { exists: true, status: 'OK' };
          console.log(`  ✅ ${table}`);
        } else {
          this.results.tables[table] = { exists: false, status: 'MISSING' };
          console.log(`  ❌ ${table} - مفقود`);
          this.results.errors.push(`Missing table: ${table}`);
        }
      }

      // فحص الجداول الإضافية
      const extraTables = existingTables.filter(table => !requiredTables.includes(table));
      if (extraTables.length > 0) {
        console.log(`\n📋 جداول إضافية موجودة: ${extraTables.join(', ')}`);
      }

      return true;
    } catch (error) {
      console.error('❌ خطأ في فحص الجداول:', error.message);
      this.results.errors.push(`Tables check failed: ${error.message}`);
      return false;
    }
  }

  async checkTableStructures() {
    console.log('\n🏗️ فحص هياكل الجداول...');
    
    try {
      // فحص هيكل جدول الحسابات
      await this.checkAccountsTable();
      
      // فحص هيكل جدول القيود
      await this.checkJournalEntriesTable();
      
      // فحص هيكل جدول العملاء
      await this.checkCustomersTable();
      
      // فحص هيكل جدول المدفوعات
      await this.checkPaymentsTable();
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في فحص هياكل الجداول:', error.message);
      this.results.errors.push(`Table structures check failed: ${error.message}`);
      return false;
    }
  }

  async checkAccountsTable() {
    const requiredColumns = [
      'id', 'code', 'name', 'type', 'balance', 'currency', 
      'parent_id', 'level', 'is_active', 'created_at', 'updated_at'
    ];
    
    await this.checkTableColumns('accounts', requiredColumns);
  }

  async checkJournalEntriesTable() {
    const requiredColumns = [
      'id', 'entry_number', 'date', 'total_debit', 'total_credit',
      'status', 'description', 'created_at', 'updated_at'
    ];
    
    await this.checkTableColumns('journal_entries', requiredColumns);
  }

  async checkCustomersTable() {
    const requiredColumns = [
      'id', 'name', 'email', 'phone', 'balance', 'account_id',
      'is_active', 'created_at', 'updated_at'
    ];
    
    await this.checkTableColumns('customers', requiredColumns);
  }

  async checkPaymentsTable() {
    const requiredColumns = [
      'id', 'payment_number', 'customer_id', 'amount', 'date',
      'payment_method', 'status', 'created_at', 'updated_at'
    ];
    
    await this.checkTableColumns('payments', requiredColumns);
  }

  async checkTableColumns(tableName, requiredColumns) {
    try {
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      const result = await this.client.query(columnsQuery, [tableName]);
      const existingColumns = result.rows.map(row => row.column_name);
      
      const tableResult = {
        exists: existingColumns.length > 0,
        columns: {},
        missingColumns: [],
        extraColumns: []
      };

      if (existingColumns.length === 0) {
        console.log(`  ❌ ${tableName} - الجدول غير موجود`);
        this.results.tables[tableName] = tableResult;
        return;
      }

      // التحقق من الأعمدة المطلوبة
      for (const column of requiredColumns) {
        if (existingColumns.includes(column)) {
          const columnInfo = result.rows.find(row => row.column_name === column);
          tableResult.columns[column] = {
            exists: true,
            type: columnInfo.data_type,
            nullable: columnInfo.is_nullable === 'YES',
            default: columnInfo.column_default
          };
        } else {
          tableResult.missingColumns.push(column);
          console.log(`    ⚠️  ${tableName}.${column} - عمود مفقود`);
          this.results.warnings.push(`Missing column: ${tableName}.${column}`);
        }
      }

      // البحث عن أعمدة إضافية
      tableResult.extraColumns = existingColumns.filter(col => !requiredColumns.includes(col));

      this.results.tables[tableName] = { ...this.results.tables[tableName], ...tableResult };
      
      if (tableResult.missingColumns.length === 0) {
        console.log(`  ✅ ${tableName} - هيكل سليم`);
      }

    } catch (error) {
      console.error(`❌ خطأ في فحص جدول ${tableName}:`, error.message);
      this.results.errors.push(`Table ${tableName} check failed: ${error.message}`);
    }
  }

  async checkConstraints() {
    console.log('\n🔗 فحص القيود والعلاقات...');
    
    try {
      // فحص المفاتيح الأساسية
      const primaryKeysQuery = `
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name;
      `;
      
      const pkResult = await this.client.query(primaryKeysQuery);
      console.log(`📋 المفاتيح الأساسية: ${pkResult.rows.length}`);
      
      // فحص المفاتيح الخارجية
      const foreignKeysQuery = `
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name;
      `;
      
      const fkResult = await this.client.query(foreignKeysQuery);
      console.log(`🔗 المفاتيح الخارجية: ${fkResult.rows.length}`);
      
      this.results.constraints = {
        primaryKeys: pkResult.rows,
        foreignKeys: fkResult.rows
      };

      // التحقق من العلاقات المهمة
      await this.checkImportantRelations(fkResult.rows);
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في فحص القيود:', error.message);
      this.results.errors.push(`Constraints check failed: ${error.message}`);
      return false;
    }
  }

  async checkImportantRelations(foreignKeys) {
    const importantRelations = [
      { table: 'customers', column: 'account_id', references: 'accounts' },
      { table: 'journal_entry_details', column: 'journal_entry_id', references: 'journal_entries' },
      { table: 'journal_entry_details', column: 'account_id', references: 'accounts' },
      { table: 'gl_entries', column: 'account_id', references: 'accounts' },
      { table: 'payments', column: 'customer_id', references: 'customers' }
    ];

    for (const relation of importantRelations) {
      const exists = foreignKeys.some(fk => 
        fk.table_name === relation.table && 
        fk.column_name === relation.column &&
        fk.foreign_table_name === relation.references
      );

      if (exists) {
        console.log(`  ✅ ${relation.table}.${relation.column} -> ${relation.references}`);
      } else {
        console.log(`  ⚠️  ${relation.table}.${relation.column} -> ${relation.references} - علاقة مفقودة`);
        this.results.warnings.push(`Missing relation: ${relation.table}.${relation.column} -> ${relation.references}`);
      }
    }
  }

  async checkIndexes() {
    console.log('\n📇 فحص الفهارس...');
    
    try {
      const indexesQuery = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `;
      
      const result = await this.client.query(indexesQuery);
      console.log(`📊 عدد الفهارس: ${result.rows.length}`);
      
      this.results.indexes = result.rows;
      
      // التحقق من الفهارس المهمة
      const importantIndexes = [
        'accounts_code',
        'customers_email',
        'journal_entries_entry_number',
        'payments_payment_number'
      ];

      for (const indexName of importantIndexes) {
        const exists = result.rows.some(idx => idx.indexname.includes(indexName.split('_')[1]));
        if (exists) {
          console.log(`  ✅ ${indexName}`);
        } else {
          console.log(`  ⚠️  ${indexName} - فهرس مفقود`);
          this.results.warnings.push(`Missing index: ${indexName}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في فحص الفهارس:', error.message);
      this.results.errors.push(`Indexes check failed: ${error.message}`);
      return false;
    }
  }

  async checkDataIntegrity() {
    console.log('\n🔍 فحص سلامة البيانات...');
    
    try {
      // فحص الحسابات
      await this.checkAccountsData();
      
      // فحص العملاء
      await this.checkCustomersData();
      
      // فحص القيود المحاسبية
      await this.checkJournalEntriesData();
      
      // فحص المدفوعات
      await this.checkPaymentsData();
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في فحص سلامة البيانات:', error.message);
      this.results.errors.push(`Data integrity check failed: ${error.message}`);
      return false;
    }
  }

  async checkAccountsData() {
    try {
      // عدد الحسابات
      const countResult = await this.client.query('SELECT COUNT(*) FROM accounts');
      const accountsCount = parseInt(countResult.rows[0].count);
      console.log(`📊 عدد الحسابات: ${accountsCount}`);
      
      // التحقق من الأكواد المكررة
      const duplicatesQuery = `
        SELECT code, COUNT(*) as count 
        FROM accounts 
        GROUP BY code 
        HAVING COUNT(*) > 1
      `;
      const duplicatesResult = await this.client.query(duplicatesQuery);
      
      if (duplicatesResult.rows.length > 0) {
        console.log(`  ⚠️  أكواد حسابات مكررة: ${duplicatesResult.rows.length}`);
        this.results.warnings.push(`Duplicate account codes: ${duplicatesResult.rows.length}`);
      } else {
        console.log(`  ✅ لا توجد أكواد مكررة`);
      }

      // التحقق من الحسابات بدون أسماء
      const emptyNamesQuery = `SELECT COUNT(*) FROM accounts WHERE name IS NULL OR name = ''`;
      const emptyNamesResult = await this.client.query(emptyNamesQuery);
      const emptyNamesCount = parseInt(emptyNamesResult.rows[0].count);
      
      if (emptyNamesCount > 0) {
        console.log(`  ⚠️  حسابات بدون أسماء: ${emptyNamesCount}`);
        this.results.warnings.push(`Accounts without names: ${emptyNamesCount}`);
      } else {
        console.log(`  ✅ جميع الحسابات لها أسماء`);
      }

      this.results.data.accounts = {
        total: accountsCount,
        duplicateCodes: duplicatesResult.rows.length,
        emptyNames: emptyNamesCount
      };

    } catch (error) {
      console.error('❌ خطأ في فحص بيانات الحسابات:', error.message);
      this.results.errors.push(`Accounts data check failed: ${error.message}`);
    }
  }

  async checkCustomersData() {
    try {
      const countResult = await this.client.query('SELECT COUNT(*) FROM customers');
      const customersCount = parseInt(countResult.rows[0].count);
      console.log(`👥 عدد العملاء: ${customersCount}`);

      // التحقق من العملاء المرتبطين بحسابات
      const linkedQuery = `
        SELECT COUNT(*) 
        FROM customers c 
        JOIN accounts a ON c.account_id = a.id
      `;
      const linkedResult = await this.client.query(linkedQuery);
      const linkedCount = parseInt(linkedResult.rows[0].count);
      
      console.log(`  ✅ عملاء مرتبطين بحسابات: ${linkedCount}/${customersCount}`);
      
      if (linkedCount < customersCount) {
        const unlinkedCount = customersCount - linkedCount;
        console.log(`  ⚠️  عملاء غير مرتبطين: ${unlinkedCount}`);
        this.results.warnings.push(`Unlinked customers: ${unlinkedCount}`);
      }

      this.results.data.customers = {
        total: customersCount,
        linked: linkedCount,
        unlinked: customersCount - linkedCount
      };

    } catch (error) {
      console.error('❌ خطأ في فحص بيانات العملاء:', error.message);
      this.results.errors.push(`Customers data check failed: ${error.message}`);
    }
  }

  async checkJournalEntriesData() {
    try {
      const countResult = await this.client.query('SELECT COUNT(*) FROM journal_entries');
      const entriesCount = parseInt(countResult.rows[0].count);
      console.log(`📝 عدد القيود: ${entriesCount}`);

      // التحقق من توازن القيود
      const unbalancedQuery = `
        SELECT COUNT(*) 
        FROM journal_entries 
        WHERE ABS(total_debit - total_credit) > 0.01
      `;
      const unbalancedResult = await this.client.query(unbalancedQuery);
      const unbalancedCount = parseInt(unbalancedResult.rows[0].count);
      
      if (unbalancedCount > 0) {
        console.log(`  ❌ قيود غير متوازنة: ${unbalancedCount}`);
        this.results.errors.push(`Unbalanced journal entries: ${unbalancedCount}`);
      } else {
        console.log(`  ✅ جميع القيود متوازنة`);
      }

      this.results.data.journalEntries = {
        total: entriesCount,
        unbalanced: unbalancedCount
      };

    } catch (error) {
      console.error('❌ خطأ في فحص بيانات القيود:', error.message);
      this.results.errors.push(`Journal entries data check failed: ${error.message}`);
    }
  }

  async checkPaymentsData() {
    try {
      const countResult = await this.client.query('SELECT COUNT(*) FROM payments');
      const paymentsCount = parseInt(countResult.rows[0].count);
      console.log(`💰 عدد المدفوعات: ${paymentsCount}`);

      // التحقق من المدفوعات بدون عملاء
      const orphanedQuery = `
        SELECT COUNT(*) 
        FROM payments p 
        LEFT JOIN customers c ON p.customer_id = c.id 
        WHERE c.id IS NULL AND p.customer_id IS NOT NULL
      `;
      const orphanedResult = await this.client.query(orphanedQuery);
      const orphanedCount = parseInt(orphanedResult.rows[0].count);
      
      if (orphanedCount > 0) {
        console.log(`  ⚠️  مدفوعات بدون عملاء: ${orphanedCount}`);
        this.results.warnings.push(`Orphaned payments: ${orphanedCount}`);
      } else {
        console.log(`  ✅ جميع المدفوعات مرتبطة بعملاء`);
      }

      this.results.data.payments = {
        total: paymentsCount,
        orphaned: orphanedCount
      };

    } catch (error) {
      console.error('❌ خطأ في فحص بيانات المدفوعات:', error.message);
      this.results.errors.push(`Payments data check failed: ${error.message}`);
    }
  }

  async generateSummary() {
    console.log('\n📋 ملخص الفحص...');
    
    const totalErrors = this.results.errors.length;
    const totalWarnings = this.results.warnings.length;
    
    this.results.summary = {
      status: totalErrors === 0 ? (totalWarnings === 0 ? 'EXCELLENT' : 'GOOD') : 'NEEDS_ATTENTION',
      totalErrors,
      totalWarnings,
      tablesChecked: Object.keys(this.results.tables).length,
      timestamp: new Date().toISOString()
    };

    console.log(`\n🎯 النتيجة النهائية:`);
    console.log(`   الحالة: ${this.results.summary.status}`);
    console.log(`   الأخطاء: ${totalErrors}`);
    console.log(`   التحذيرات: ${totalWarnings}`);
    console.log(`   الجداول المفحوصة: ${this.results.summary.tablesChecked}`);

    if (totalErrors === 0 && totalWarnings === 0) {
      console.log(`\n✅ قاعدة البيانات في حالة ممتازة!`);
    } else if (totalErrors === 0) {
      console.log(`\n⚠️  قاعدة البيانات في حالة جيدة مع بعض التحذيرات`);
    } else {
      console.log(`\n❌ قاعدة البيانات تحتاج إلى إصلاحات`);
    }
  }

  async saveReport() {
    const reportData = {
      checkDate: new Date().toISOString(),
      databaseUrl: DATABASE_URL.replace(/:[^:@]*@/, ':****@'), // إخفاء كلمة المرور
      results: this.results
    };

    const reportJson = JSON.stringify(reportData, null, 2);
    const reportFileName = `database-check-report-${new Date().toISOString().split('T')[0]}.json`;
    
    fs.writeFileSync(reportFileName, reportJson);
    console.log(`\n💾 تم حفظ التقرير في: ${reportFileName}`);
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runFullCheck() {
    console.log('🚀 بدء فحص قاعدة البيانات الشامل...\n');
    
    const connected = await this.connect();
    if (!connected) {
      return this.results;
    }

    try {
      await this.checkTables();
      await this.checkTableStructures();
      await this.checkConstraints();
      await this.checkIndexes();
      await this.checkDataIntegrity();
      await this.generateSummary();
      await this.saveReport();
    } catch (error) {
      console.error('❌ خطأ عام في الفحص:', error.message);
      this.results.errors.push(`General check error: ${error.message}`);
    } finally {
      await this.disconnect();
    }

    return this.results;
  }
}

// تشغيل الفحص
const checker = new DatabaseChecker();
checker.runFullCheck().then(results => {
  process.exit(results.summary?.status === 'EXCELLENT' ? 0 : 1);
}).catch(error => {
  console.error('❌ فشل في تشغيل الفحص:', error);
  process.exit(1);
});
