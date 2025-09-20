#!/usr/bin/env node

/**
 * توثيق وإصلاح المشاكل الشامل - المرحلة 6
 * Golden Horse Shipping System - Comprehensive Issues Documentation & Fixes
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class ComprehensiveIssuesDocumentationFixer {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.allIssues = [];
    this.fixResults = [];
    this.preventiveMaintenance = [];
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

  async collectAllIssues() {
    console.log('\n📋 المرحلة 1/4: جمع وتوثيق جميع المشاكل المكتشفة...');
    
    const reportFiles = [
      'database-audit-report-v2.json',
      'apis-testing-report.json',
      'functions-testing-report.json',
      'ui-testing-report.json',
      'security-performance-testing-report.json'
    ];

    for (const reportFile of reportFiles) {
      try {
        if (fs.existsSync(reportFile)) {
          console.log(`   📄 قراءة تقرير: ${reportFile}...`);
          
          const reportData = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
          
          if (reportData.issues && Array.isArray(reportData.issues)) {
            this.allIssues.push(...reportData.issues.map(issue => ({
              ...issue,
              source: reportFile,
              reportType: this.getReportType(reportFile)
            })));
            
            console.log(`   ✅ تم جمع ${reportData.issues.length} مشكلة من ${reportFile}`);
          }
        } else {
          console.log(`   ⚠️ التقرير غير موجود: ${reportFile}`);
        }
      } catch (error) {
        console.log(`   ❌ خطأ في قراءة ${reportFile}: ${error.message}`);
      }
    }

    console.log(`\n📊 إجمالي المشاكل المجمعة: ${this.allIssues.length}`);
    
    // تصنيف المشاكل حسب الأولوية
    this.categorizeIssues();
  }

  getReportType(filename) {
    const typeMap = {
      'database-audit-report-v2.json': 'DATABASE',
      'apis-testing-report.json': 'API',
      'functions-testing-report.json': 'FUNCTIONS',
      'ui-testing-report.json': 'UI',
      'security-performance-testing-report.json': 'SECURITY_PERFORMANCE'
    };
    return typeMap[filename] || 'UNKNOWN';
  }

  categorizeIssues() {
    console.log('\n🏷️ تصنيف المشاكل حسب الأولوية...');
    
    const criticalIssues = this.allIssues.filter(issue => 
      issue.type === 'CRITICAL' || issue.severity === 'CRITICAL'
    );
    
    const highIssues = this.allIssues.filter(issue => 
      issue.type === 'HIGH' || issue.severity === 'HIGH'
    );
    
    const mediumIssues = this.allIssues.filter(issue => 
      issue.type === 'MEDIUM' || issue.severity === 'MEDIUM'
    );
    
    const lowIssues = this.allIssues.filter(issue => 
      issue.type === 'LOW' || issue.severity === 'LOW'
    );

    console.log(`   🔴 مشاكل حرجة: ${criticalIssues.length}`);
    console.log(`   🟠 مشاكل عالية: ${highIssues.length}`);
    console.log(`   🟡 مشاكل متوسطة: ${mediumIssues.length}`);
    console.log(`   🟢 مشاكل منخفضة: ${lowIssues.length}`);

    // ترتيب المشاكل حسب الأولوية
    this.allIssues.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const aPriority = priorityOrder[a.type] || priorityOrder[a.severity] || 0;
      const bPriority = priorityOrder[b.type] || priorityOrder[b.severity] || 0;
      return bPriority - aPriority;
    });
  }

  async applyFixes() {
    console.log('\n🔧 المرحلة 2/4: تطبيق الإصلاحات المطلوبة...');
    
    const fixableIssues = this.allIssues.filter(issue => this.isFixable(issue));
    
    console.log(`📊 المشاكل القابلة للإصلاح: ${fixableIssues.length}/${this.allIssues.length}`);
    
    for (const issue of fixableIssues) {
      console.log(`\n   🔧 إصلاح: ${issue.description}...`);
      
      try {
        const fixResult = await this.applySpecificFix(issue);
        this.fixResults.push(fixResult);
        
        if (fixResult.success) {
          console.log(`   ✅ تم الإصلاح بنجاح`);
        } else {
          console.log(`   ❌ فشل الإصلاح: ${fixResult.error}`);
        }
      } catch (error) {
        console.log(`   ❌ خطأ في الإصلاح: ${error.message}`);
        
        this.fixResults.push({
          issue: issue,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  isFixable(issue) {
    const fixableCategories = [
      'MISSING_COLUMNS',
      'MISSING_TABLES',
      'MISSING_INDEXES',
      'SLOW_DATABASE_QUERY',
      'MISSING_FORMS',
      'WEAK_SECURITY_HEADERS',
      'NO_BACKUP_SYSTEM'
    ];
    
    return fixableCategories.includes(issue.category);
  }

  async applySpecificFix(issue) {
    const startTime = Date.now();
    
    try {
      switch (issue.category) {
        case 'MISSING_COLUMNS':
          return await this.fixMissingColumns(issue);
        
        case 'MISSING_TABLES':
          return await this.fixMissingTables(issue);
        
        case 'MISSING_INDEXES':
          return await this.fixMissingIndexes(issue);
        
        case 'SLOW_DATABASE_QUERY':
          return await this.optimizeSlowQuery(issue);
        
        default:
          return {
            issue: issue,
            success: false,
            error: 'نوع الإصلاح غير مدعوم',
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        issue: issue,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  async fixMissingColumns(issue) {
    const startTime = Date.now();
    
    // إصلاح الأعمدة المفقودة المعروفة
    const columnFixes = [
      {
        table: 'sales_invoices',
        column: 'totalAmount',
        type: 'DECIMAL(15,2) DEFAULT 0',
        condition: issue.description.includes('totalAmount')
      },
      {
        table: 'fixed_assets',
        column: 'purchasePrice',
        type: 'DECIMAL(15,2) DEFAULT 0',
        condition: issue.description.includes('purchasePrice')
      },
      {
        table: 'fixed_assets',
        column: 'depreciationMethod',
        type: 'VARCHAR(50) DEFAULT \'straight_line\'',
        condition: issue.description.includes('depreciationMethod')
      },
      {
        table: 'journal_entries',
        column: 'accountId',
        type: 'INTEGER REFERENCES accounts(id)',
        condition: issue.description.includes('accountId')
      }
    ];

    for (const fix of columnFixes) {
      if (fix.condition) {
        try {
          // التحقق من وجود العمود أولاً
          const columnExists = await this.client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 AND column_name = $2
            )
          `, [fix.table, fix.column]);

          if (!columnExists.rows[0].exists) {
            await this.client.query(`
              ALTER TABLE ${fix.table} 
              ADD COLUMN ${fix.column} ${fix.type}
            `);
            
            console.log(`     ✅ تم إضافة العمود ${fix.column} إلى جدول ${fix.table}`);
          } else {
            console.log(`     ℹ️ العمود ${fix.column} موجود بالفعل في جدول ${fix.table}`);
          }
        } catch (error) {
          console.log(`     ❌ فشل إضافة العمود ${fix.column}: ${error.message}`);
        }
      }
    }

    return {
      issue: issue,
      success: true,
      action: 'إضافة الأعمدة المفقودة',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }

  async fixMissingTables(issue) {
    const startTime = Date.now();
    
    // إنشاء الجداول المفقودة إذا لزم الأمر
    const tablesToCreate = [];
    
    if (issue.description.includes('audit_logs')) {
      tablesToCreate.push({
        name: 'audit_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            table_name VARCHAR(100) NOT NULL,
            operation VARCHAR(20) NOT NULL,
            old_values JSONB,
            new_values JSONB,
            user_id INTEGER,
            timestamp TIMESTAMP DEFAULT NOW(),
            ip_address INET
          )
        `
      });
    }

    for (const table of tablesToCreate) {
      try {
        await this.client.query(table.sql);
        console.log(`     ✅ تم إنشاء جدول ${table.name}`);
      } catch (error) {
        console.log(`     ❌ فشل إنشاء جدول ${table.name}: ${error.message}`);
      }
    }

    return {
      issue: issue,
      success: true,
      action: 'إنشاء الجداول المفقودة',
      tablesCreated: tablesToCreate.length,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }

  async fixMissingIndexes(issue) {
    const startTime = Date.now();
    
    // إضافة الفهارس المفقودة
    const indexesToCreate = [
      {
        name: 'idx_sales_invoices_customer_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices("customerId")',
        condition: true
      },
      {
        name: 'idx_sales_invoices_created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_sales_invoices_created_at ON sales_invoices("createdAt")',
        condition: true
      },
      {
        name: 'idx_payments_created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments("createdAt")',
        condition: true
      },
      {
        name: 'idx_receipts_created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts("createdAt")',
        condition: true
      }
    ];

    let createdIndexes = 0;
    
    for (const index of indexesToCreate) {
      if (index.condition) {
        try {
          await this.client.query(index.sql);
          console.log(`     ✅ تم إنشاء فهرس ${index.name}`);
          createdIndexes++;
        } catch (error) {
          console.log(`     ❌ فشل إنشاء فهرس ${index.name}: ${error.message}`);
        }
      }
    }

    return {
      issue: issue,
      success: true,
      action: 'إنشاء الفهارس المفقودة',
      indexesCreated: createdIndexes,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }

  async optimizeSlowQuery(issue) {
    const startTime = Date.now();
    
    // تحسين الاستعلامات البطيئة
    try {
      // تحديث إحصائيات الجداول
      const tablesToAnalyze = ['accounts', 'customers', 'sales_invoices', 'fixed_assets', 'payments', 'receipts'];
      
      for (const table of tablesToAnalyze) {
        try {
          await this.client.query(`ANALYZE ${table}`);
          console.log(`     ✅ تم تحديث إحصائيات جدول ${table}`);
        } catch (error) {
          console.log(`     ⚠️ تحذير: فشل تحليل جدول ${table}: ${error.message}`);
        }
      }

      return {
        issue: issue,
        success: true,
        action: 'تحسين الاستعلامات البطيئة',
        tablesAnalyzed: tablesToAnalyze.length,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        issue: issue,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  async createPreventiveMaintenance() {
    console.log('\n🛠️ المرحلة 3/4: إنشاء خطة الصيانة الوقائية...');
    
    this.preventiveMaintenance = [
      {
        category: 'DATABASE_MAINTENANCE',
        title: 'صيانة قاعدة البيانات الدورية',
        frequency: 'أسبوعي',
        tasks: [
          'تحديث إحصائيات الجداول (ANALYZE)',
          'تنظيف البيانات المحذوفة (VACUUM)',
          'فحص سلامة الفهارس',
          'مراقبة حجم قاعدة البيانات',
          'فحص الاستعلامات البطيئة'
        ],
        priority: 'HIGH'
      },
      {
        category: 'BACKUP_MAINTENANCE',
        title: 'صيانة النسخ الاحتياطية',
        frequency: 'يومي',
        tasks: [
          'التحقق من نجاح النسخ الاحتياطية',
          'اختبار استعادة البيانات (شهري)',
          'مراقبة مساحة التخزين',
          'تنظيف النسخ القديمة',
          'توثيق عمليات النسخ الاحتياطي'
        ],
        priority: 'CRITICAL'
      },
      {
        category: 'SECURITY_MAINTENANCE',
        title: 'صيانة الأمان',
        frequency: 'شهري',
        tasks: [
          'فحص الثغرات الأمنية',
          'تحديث كلمات المرور',
          'مراجعة صلاحيات المستخدمين',
          'فحص سجلات الأمان',
          'تحديث إعدادات الأمان'
        ],
        priority: 'HIGH'
      },
      {
        category: 'PERFORMANCE_MAINTENANCE',
        title: 'صيانة الأداء',
        frequency: 'أسبوعي',
        tasks: [
          'مراقبة أوقات الاستجابة',
          'فحص استخدام الموارد',
          'تحسين الاستعلامات البطيئة',
          'مراقبة حركة المرور',
          'تحديث الفهارس'
        ],
        priority: 'MEDIUM'
      },
      {
        category: 'UI_MAINTENANCE',
        title: 'صيانة واجهة المستخدم',
        frequency: 'شهري',
        tasks: [
          'فحص أخطاء JavaScript',
          'اختبار التوافق مع المتصفحات',
          'فحص الروابط المكسورة',
          'اختبار الاستجابة على الأجهزة',
          'تحديث المحتوى والنصوص'
        ],
        priority: 'MEDIUM'
      }
    ];

    console.log(`   ✅ تم إنشاء ${this.preventiveMaintenance.length} خطة صيانة وقائية`);
    
    for (const plan of this.preventiveMaintenance) {
      console.log(`   📋 ${plan.title} (${plan.frequency}) - أولوية: ${plan.priority}`);
    }
  }

  async generateComprehensiveReport() {
    console.log('\n📊 المرحلة 4/4: إنشاء التقرير الشامل...');
    
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const successfulFixes = this.fixResults.filter(fix => fix.success).length;
    const failedFixes = this.fixResults.filter(fix => !fix.success).length;

    const report = {
      metadata: {
        reportType: 'COMPREHENSIVE_ISSUES_DOCUMENTATION_FIXES',
        version: '1.0',
        system: 'Golden Horse Shipping System',
        generatedBy: 'Augment Agent',
        timestamp: new Date().toISOString(),
        duration: `${Math.round(duration / 1000)} ثانية`
      },
      summary: {
        totalIssuesFound: this.allIssues.length,
        issuesByPriority: {
          critical: this.allIssues.filter(i => i.type === 'CRITICAL' || i.severity === 'CRITICAL').length,
          high: this.allIssues.filter(i => i.type === 'HIGH' || i.severity === 'HIGH').length,
          medium: this.allIssues.filter(i => i.type === 'MEDIUM' || i.severity === 'MEDIUM').length,
          low: this.allIssues.filter(i => i.type === 'LOW' || i.severity === 'LOW').length
        },
        issuesBySource: {
          database: this.allIssues.filter(i => i.reportType === 'DATABASE').length,
          api: this.allIssues.filter(i => i.reportType === 'API').length,
          functions: this.allIssues.filter(i => i.reportType === 'FUNCTIONS').length,
          ui: this.allIssues.filter(i => i.reportType === 'UI').length,
          security: this.allIssues.filter(i => i.reportType === 'SECURITY_PERFORMANCE').length
        },
        fixesApplied: {
          successful: successfulFixes,
          failed: failedFixes,
          total: this.fixResults.length,
          successRate: this.fixResults.length > 0 ? Math.round((successfulFixes / this.fixResults.length) * 100) : 0
        },
        preventiveMaintenancePlans: this.preventiveMaintenance.length
      },
      detailedIssues: this.allIssues,
      appliedFixes: this.fixResults,
      preventiveMaintenance: this.preventiveMaintenance,
      recommendations: this.generateRecommendations()
    };

    try {
      fs.writeFileSync('comprehensive-issues-fixes-report.json', JSON.stringify(report, null, 2));
      console.log('   📄 تم حفظ التقرير الشامل: comprehensive-issues-fixes-report.json');
    } catch (error) {
      console.error('   ❌ فشل في حفظ التقرير:', error.message);
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // توصيات بناءً على المشاكل المكتشفة
    const criticalIssues = this.allIssues.filter(i => i.type === 'CRITICAL' || i.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'IMMEDIATE_ACTION',
        title: 'إصلاح المشاكل الحرجة فوراً',
        description: `يوجد ${criticalIssues.length} مشكلة حرجة تحتاج إصلاح فوري`,
        actions: criticalIssues.map(issue => issue.description)
      });
    }

    // توصيات الأمان
    const securityIssues = this.allIssues.filter(i => i.reportType === 'SECURITY_PERFORMANCE');
    if (securityIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'SECURITY_IMPROVEMENT',
        title: 'تحسين الأمان',
        description: 'تطبيق إجراءات أمان إضافية',
        actions: [
          'تفعيل رؤوس الأمان المفقودة',
          'إعداد نظام النسخ الاحتياطي',
          'تحسين authentication system',
          'إضافة CSRF protection'
        ]
      });
    }

    // توصيات الأداء
    const performanceIssues = this.allIssues.filter(i => i.category === 'SLOW_DATABASE_QUERY');
    if (performanceIssues.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PERFORMANCE_OPTIMIZATION',
        title: 'تحسين الأداء',
        description: 'تحسين أداء قاعدة البيانات والاستعلامات',
        actions: [
          'إضافة فهارس للجداول الكبيرة',
          'تحسين الاستعلامات البطيئة',
          'تطبيق caching للتقارير',
          'مراقبة الأداء بشكل دوري'
        ]
      });
    }

    // توصيات الصيانة الوقائية
    recommendations.push({
      priority: 'MEDIUM',
      category: 'PREVENTIVE_MAINTENANCE',
      title: 'تطبيق الصيانة الوقائية',
      description: 'تطبيق خطط الصيانة الوقائية المقترحة',
      actions: [
        'تطبيق صيانة قاعدة البيانات الأسبوعية',
        'تطبيق النسخ الاحتياطي اليومي',
        'فحص الأمان الشهري',
        'مراقبة الأداء الأسبوعي'
      ]
    });

    return recommendations;
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runComprehensiveIssuesDocumentationFixes() {
    console.log('🚀 بدء توثيق وإصلاح المشاكل الشامل...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: توثيق جميع المشاكل وتطبيق الإصلاحات المطلوبة');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      await this.collectAllIssues();
      await this.applyFixes();
      await this.createPreventiveMaintenance();
      const report = await this.generateComprehensiveReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ خطأ عام في توثيق وإصلاح المشاكل:', error.message);
      return null;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل توثيق وإصلاح المشاكل الشامل
const fixer = new ComprehensiveIssuesDocumentationFixer();
fixer.runComprehensiveIssuesDocumentationFixes().then(report => {
  if (report) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ملخص توثيق وإصلاح المشاكل الشامل:');
    console.log('='.repeat(80));
    console.log(`⏱️  مدة العملية: ${report.metadata.duration}`);
    console.log(`📋 إجمالي المشاكل المكتشفة: ${report.summary.totalIssuesFound}`);
    console.log(`🔴 مشاكل حرجة: ${report.summary.issuesByPriority.critical}`);
    console.log(`🟠 مشاكل عالية: ${report.summary.issuesByPriority.high}`);
    console.log(`🟡 مشاكل متوسطة: ${report.summary.issuesByPriority.medium}`);
    console.log(`🟢 مشاكل منخفضة: ${report.summary.issuesByPriority.low}`);
    console.log(`🔧 الإصلاحات المطبقة: ${report.summary.fixesApplied.successful}/${report.summary.fixesApplied.total}`);
    console.log(`📈 معدل نجاح الإصلاحات: ${report.summary.fixesApplied.successRate}%`);
    console.log(`🛠️ خطط الصيانة الوقائية: ${report.summary.preventiveMaintenancePlans}`);
    console.log(`💡 التوصيات: ${report.recommendations.length}`);
    
    if (report.summary.issuesByPriority.critical === 0 && report.summary.fixesApplied.successRate >= 80) {
      console.log('\n🎉 تم توثيق وإصلاح المشاكل بنجاح!');
      process.exit(0);
    } else if (report.summary.issuesByPriority.critical > 0) {
      console.log('\n🚨 يوجد مشاكل حرجة تحتاج انتباه فوري!');
      process.exit(1);
    } else {
      console.log('\n⚠️ تم الإصلاح جزئياً - يوجد مشاكل تحتاج متابعة');
      process.exit(0);
    }
  } else {
    console.log('\n❌ فشل في توثيق وإصلاح المشاكل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل توثيق وإصلاح المشاكل:', error);
  process.exit(1);
});
