#!/usr/bin/env node

/**
 * فحص شامل ومكثف لقاعدة البيانات - المرحلة 1
 * Golden Horse Shipping System - Database Comprehensive Audit
 * تحديث: 2025-09-20 - فحص متقدم وشامل
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class ComprehensiveDatabaseAuditor {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.auditResults = {
      tables: [],
      relationships: [],
      indexes: [],
      columns: [],
      accountingEquation: {},
      performance: {},
      issues: [],
      recommendations: [],
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

  async auditTables() {
    console.log('\n📊 المرحلة 1/6: فحص الجداول والعلاقات...');
    
    try {
      // فحص جميع الجداول
      const tablesQuery = `
        SELECT 
          schemaname,
          tablename,
          tableowner,
          hasindexes,
          hasrules,
          hastriggers,
          rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `;
      
      const tablesResult = await this.client.query(tablesQuery);
      this.auditResults.tables = tablesResult.rows;
      
      console.log(`   ✅ تم فحص ${tablesResult.rows.length} جدول`);
      
      // فحص العلاقات الخارجية
      const relationshipsQuery = `
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
        ORDER BY tc.table_name
      `;
      
      const relationshipsResult = await this.client.query(relationshipsQuery);
      this.auditResults.relationships = relationshipsResult.rows;
      
      console.log(`   ✅ تم فحص ${relationshipsResult.rows.length} علاقة خارجية`);
      
      // فحص الجداول المطلوبة
      const requiredTables = [
        'accounts', 'users', 'customers', 'suppliers', 'products',
        'sales_invoices', 'sales_invoice_items', 'shipping_invoices',
        'payments', 'receipts', 'fixed_assets', 'journal_entries',
        'account_mappings', 'audit_logs', 'company_settings'
      ];
      
      const missingTables = requiredTables.filter(table => 
        !this.auditResults.tables.some(t => t.tablename === table)
      );
      
      if (missingTables.length > 0) {
        this.auditResults.issues.push({
          type: 'CRITICAL',
          category: 'MISSING_TABLES',
          description: `جداول مفقودة: ${missingTables.join(', ')}`,
          impact: 'HIGH',
          tables: missingTables
        });
      }
      
    } catch (error) {
      console.error('   ❌ خطأ في فحص الجداول:', error.message);
      this.auditResults.issues.push({
        type: 'ERROR',
        category: 'TABLE_AUDIT',
        description: `فشل فحص الجداول: ${error.message}`,
        impact: 'HIGH'
      });
    }
  }

  async auditIndexes() {
    console.log('\n🔍 المرحلة 2/6: فحص الفهارس والأداء...');
    
    try {
      // فحص جميع الفهارس
      const indexesQuery = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `;
      
      const indexesResult = await this.client.query(indexesQuery);
      this.auditResults.indexes = indexesResult.rows;
      
      console.log(`   ✅ تم فحص ${indexesResult.rows.length} فهرس`);
      
      // فحص الفهارس المفقودة المهمة
      const missingIndexes = await this.checkMissingIndexes();
      if (missingIndexes.length > 0) {
        this.auditResults.issues.push({
          type: 'MEDIUM',
          category: 'MISSING_INDEXES',
          description: `فهارس مفقودة مهمة للأداء`,
          impact: 'MEDIUM',
          indexes: missingIndexes
        });
      }
      
      // فحص أداء الاستعلامات
      await this.checkQueryPerformance();
      
    } catch (error) {
      console.error('   ❌ خطأ في فحص الفهارس:', error.message);
      this.auditResults.issues.push({
        type: 'ERROR',
        category: 'INDEX_AUDIT',
        description: `فشل فحص الفهارس: ${error.message}`,
        impact: 'MEDIUM'
      });
    }
  }

  async checkMissingIndexes() {
    const criticalIndexes = [
      { table: 'accounts', column: 'code', reason: 'البحث السريع بالكود' },
      { table: 'accounts', column: 'parentId', reason: 'الاستعلامات الهرمية' },
      { table: 'sales_invoices', column: 'customerId', reason: 'فواتير العملاء' },
      { table: 'payments', column: 'createdAt', reason: 'ترتيب المدفوعات' },
      { table: 'receipts', column: 'createdAt', reason: 'ترتيب المقبوضات' },
      { table: 'journal_entries', column: 'accountId', reason: 'قيود الحسابات' }
    ];
    
    const missingIndexes = [];
    
    for (const index of criticalIndexes) {
      const exists = this.auditResults.indexes.some(idx => 
        idx.tablename === index.table && 
        idx.indexdef.includes(index.column)
      );
      
      if (!exists) {
        missingIndexes.push(index);
      }
    }
    
    return missingIndexes;
  }

  async checkQueryPerformance() {
    console.log('   🚀 فحص أداء الاستعلامات الحرجة...');
    
    const criticalQueries = [
      {
        name: 'accounts_count',
        query: 'SELECT COUNT(*) FROM accounts',
        expectedTime: 100
      },
      {
        name: 'sales_invoices_count',
        query: 'SELECT COUNT(*) FROM sales_invoices',
        expectedTime: 200
      },
      {
        name: 'payments_count',
        query: 'SELECT COUNT(*) FROM payments',
        expectedTime: 200
      }
    ];
    
    this.auditResults.performance = {};
    
    for (const query of criticalQueries) {
      try {
        const startTime = Date.now();
        await this.client.query(query.query);
        const executionTime = Date.now() - startTime;
        
        this.auditResults.performance[query.name] = {
          executionTime,
          expectedTime: query.expectedTime,
          status: executionTime <= query.expectedTime ? 'GOOD' : 'SLOW'
        };
        
        if (executionTime > query.expectedTime) {
          this.auditResults.issues.push({
            type: 'MEDIUM',
            category: 'SLOW_QUERY',
            description: `استعلام بطيء: ${query.name} (${executionTime}ms)`,
            impact: 'MEDIUM',
            query: query.name
          });
        }
        
      } catch (error) {
        this.auditResults.performance[query.name] = {
          error: error.message,
          status: 'ERROR'
        };
      }
    }
  }

  async auditAccountingEquation() {
    console.log('\n⚖️ المرحلة 3/6: فحص المعادلة المحاسبية...');
    
    try {
      // حساب إجمالي الأصول
      const assetsQuery = `
        SELECT COALESCE(SUM(balance), 0) as total_assets
        FROM accounts 
        WHERE type = 'asset' AND "isActive" = true
      `;
      
      const assetsResult = await this.client.query(assetsQuery);
      const totalAssets = parseFloat(assetsResult.rows[0].total_assets) || 0;
      
      // حساب إجمالي الخصوم
      const liabilitiesQuery = `
        SELECT COALESCE(SUM(balance), 0) as total_liabilities
        FROM accounts 
        WHERE type = 'liability' AND "isActive" = true
      `;
      
      const liabilitiesResult = await this.client.query(liabilitiesQuery);
      const totalLiabilities = parseFloat(liabilitiesResult.rows[0].total_liabilities) || 0;
      
      // حساب إجمالي حقوق الملكية
      const equityQuery = `
        SELECT COALESCE(SUM(balance), 0) as total_equity
        FROM accounts 
        WHERE type = 'equity' AND "isActive" = true
      `;
      
      const equityResult = await this.client.query(equityQuery);
      const totalEquity = parseFloat(equityResult.rows[0].total_equity) || 0;
      
      // حساب الفرق
      const liabilitiesAndEquity = totalLiabilities + totalEquity;
      const difference = Math.abs(totalAssets - liabilitiesAndEquity);
      const tolerance = 0.01;
      
      this.auditResults.accountingEquation = {
        totalAssets,
        totalLiabilities,
        totalEquity,
        liabilitiesAndEquity,
        difference,
        isBalanced: difference <= tolerance,
        tolerance
      };
      
      if (difference > tolerance) {
        this.auditResults.issues.push({
          type: 'CRITICAL',
          category: 'ACCOUNTING_IMBALANCE',
          description: `المعادلة المحاسبية غير متوازنة - الفرق: ${difference.toFixed(2)}`,
          impact: 'CRITICAL',
          details: {
            assets: totalAssets,
            liabilities: totalLiabilities,
            equity: totalEquity,
            difference
          }
        });
      }
      
      console.log(`   ✅ الأصول: ${totalAssets.toFixed(2)}`);
      console.log(`   ✅ الخصوم: ${totalLiabilities.toFixed(2)}`);
      console.log(`   ✅ حقوق الملكية: ${totalEquity.toFixed(2)}`);
      console.log(`   ${difference <= tolerance ? '✅' : '❌'} المعادلة ${difference <= tolerance ? 'متوازنة' : 'غير متوازنة'}`);
      
    } catch (error) {
      console.error('   ❌ خطأ في فحص المعادلة المحاسبية:', error.message);
      this.auditResults.issues.push({
        type: 'ERROR',
        category: 'ACCOUNTING_AUDIT',
        description: `فشل فحص المعادلة المحاسبية: ${error.message}`,
        impact: 'CRITICAL'
      });
    }
  }

  async runComprehensiveAudit() {
    console.log('🚀 بدء الفحص الشامل لقاعدة البيانات...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: فحص شامل ومكثف لجميع جوانب قاعدة البيانات');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      await this.auditTables();
      await this.auditIndexes();
      await this.auditAccountingEquation();
      
      // إنشاء الملخص
      const endTime = Date.now();
      const duration = endTime - this.startTime;
      
      this.auditResults.summary = {
        auditDate: new Date().toISOString(),
        duration: `${Math.round(duration / 1000)} ثانية`,
        tablesChecked: this.auditResults.tables.length,
        relationshipsChecked: this.auditResults.relationships.length,
        indexesChecked: this.auditResults.indexes.length,
        totalIssues: this.auditResults.issues.length,
        criticalIssues: this.auditResults.issues.filter(i => i.type === 'CRITICAL').length,
        highIssues: this.auditResults.issues.filter(i => i.impact === 'HIGH').length,
        mediumIssues: this.auditResults.issues.filter(i => i.impact === 'MEDIUM').length,
        accountingBalanced: this.auditResults.accountingEquation.isBalanced,
        overallHealth: this.calculateOverallHealth()
      };
      
      // حفظ التقرير
      const reportData = {
        ...this.auditResults,
        metadata: {
          auditType: 'COMPREHENSIVE_DATABASE_AUDIT',
          version: '2.0',
          database: 'Golden Horse Shipping System',
          auditor: 'Augment Agent',
          timestamp: new Date().toISOString()
        }
      };
      
      try {
        fs.writeFileSync('database-audit-report-v2.json', JSON.stringify(reportData, null, 2));
        console.log('\n📄 تم حفظ التقرير: database-audit-report-v2.json');
      } catch (error) {
        console.error('❌ فشل في حفظ التقرير:', error.message);
      }
      
      return this.auditResults;
      
    } catch (error) {
      console.error('❌ خطأ عام في الفحص:', error.message);
      this.auditResults.issues.push({
        type: 'ERROR',
        category: 'GENERAL_ERROR',
        description: `خطأ عام: ${error.message}`,
        impact: 'HIGH'
      });
      return this.auditResults;
    } finally {
      await this.disconnect();
    }
  }

  calculateOverallHealth() {
    const totalIssues = this.auditResults.issues.length;
    const criticalIssues = this.auditResults.issues.filter(i => i.type === 'CRITICAL').length;
    const highIssues = this.auditResults.issues.filter(i => i.impact === 'HIGH').length;
    
    if (criticalIssues > 0) return 'CRITICAL';
    if (highIssues > 2) return 'POOR';
    if (totalIssues > 5) return 'FAIR';
    if (totalIssues > 0) return 'GOOD';
    return 'EXCELLENT';
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }
}

// تشغيل الفحص الشامل
const auditor = new ComprehensiveDatabaseAuditor();
auditor.runComprehensiveAudit().then(results => {
  if (results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ملخص نتائج الفحص الشامل:');
    console.log('='.repeat(80));
    console.log(`⏱️  مدة الفحص: ${results.summary.duration}`);
    console.log(`📊 الجداول المفحوصة: ${results.summary.tablesChecked}`);
    console.log(`🔗 العلاقات المفحوصة: ${results.summary.relationshipsChecked}`);
    console.log(`🔍 الفهارس المفحوصة: ${results.summary.indexesChecked}`);
    console.log(`⚖️  المعادلة المحاسبية: ${results.summary.accountingBalanced ? '✅ متوازنة' : '❌ غير متوازنة'}`);
    console.log(`🚨 إجمالي المشاكل: ${results.summary.totalIssues}`);
    console.log(`   - حرجة: ${results.summary.criticalIssues}`);
    console.log(`   - عالية: ${results.summary.highIssues}`);
    console.log(`   - متوسطة: ${results.summary.mediumIssues}`);
    console.log(`🏥 الحالة العامة: ${results.summary.overallHealth}`);
    
    if (results.summary.overallHealth === 'EXCELLENT') {
      console.log('\n🎉 قاعدة البيانات في حالة ممتازة!');
      process.exit(0);
    } else if (results.summary.criticalIssues > 0) {
      console.log('\n🚨 يوجد مشاكل حرجة تحتاج إصلاح فوري!');
      process.exit(1);
    } else {
      console.log('\n⚠️ يوجد مشاكل تحتاج انتباه');
      process.exit(0);
    }
  } else {
    console.log('\n❌ فشل في إجراء الفحص الشامل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل الفحص الشامل:', error);
  process.exit(1);
});
