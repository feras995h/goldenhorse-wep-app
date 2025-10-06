import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد الاتصال بقاعدة البيانات
const cleanDBUrl = process.env.DB_URL ? process.env.DB_URL.trim().replace(/^=+/, '') : null;
const cleanDatabaseUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim().replace(/^=+/, '') : null;
const DATABASE_URL = cleanDBUrl || cleanDatabaseUrl;

let sequelize;

if (DATABASE_URL && DATABASE_URL.trim() !== '') {
  sequelize = new Sequelize(DATABASE_URL.trim(), {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: false
    }
  });
} else if (process.env.DB_DIALECT === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database/development.sqlite',
    logging: false
  });
} else {
  // استخدام معاملات الاتصال الفردية
  sequelize = new Sequelize(
    process.env.DB_NAME || 'golden_horse',
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: false
      }
    }
  );
}

// قائمة بجميع النماذج
const modelFiles = [
  'Account', 'AccountMapping', 'AccountProvision', 'AccountingPeriod',
  'AuditLog', 'CompanyLogo', 'Customer', 'Employee', 'EmployeeAdvance',
  'FixedAsset', 'GLEntry', 'Invoice', 'InvoicePayment', 'InvoiceReceipt',
  'JournalEntry', 'JournalEntryDetail', 'Notification', 'Payment',
  'PaymentVoucher', 'PayrollEntry', 'PurchaseInvoice', 'PurchaseInvoicePayment',
  'Receipt', 'ReceiptVoucher', 'Role', 'SalesInvoice', 'SalesInvoiceItem',
  'SalesInvoicePayment', 'SalesReturn', 'Setting', 'Shipment',
  'ShipmentMovement', 'ShippingInvoice', 'StockMovement', 'Supplier',
  'User', 'Warehouse', 'WarehouseReleaseOrder'
];

async function checkDatabaseCompatibility() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalModels: 0,
      totalTables: 0,
      matchingTables: 0,
      missingTables: [],
      extraTables: [],
      issues: []
    },
    modelDetails: {},
    tableDetails: {}
  };

  try {
    await sequelize.authenticate();
    console.log('✓ تم الاتصال بقاعدة البيانات بنجاح\n');

    // 1. الحصول على جميع الجداول من قاعدة البيانات
    const dialect = sequelize.getDialect();
    let tables;
    
    if (dialect === 'sqlite') {
      [tables] = await sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
    } else if (dialect === 'postgres') {
      [tables] = await sequelize.query(
        "SELECT table_name as name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
      );
    }
    
    report.summary.totalTables = tables.length;
    console.log(`📊 عدد الجداول في قاعدة البيانات: ${tables.length}\n`);

    const dbTables = new Set(tables.map(t => t.name));
    const modelTables = new Set();

    // 2. تحليل كل نموذج
    console.log('🔍 فحص النماذج...\n');
    
    for (const modelName of modelFiles) {
      try {
        const modelPath = path.join(__dirname, 'src', 'models', `${modelName}.js`);
        
        if (!fs.existsSync(modelPath)) {
          report.summary.issues.push({
            type: 'MODEL_FILE_NOT_FOUND',
            model: modelName,
            severity: 'HIGH',
            message: `ملف النموذج ${modelName}.js غير موجود`
          });
          continue;
        }

        // قراءة محتوى النموذج
        const modelContent = fs.readFileSync(modelPath, 'utf8');
        
        // استخراج اسم الجدول
        let tableName = modelName;
        const tableNameMatch = modelContent.match(/tableName:\s*['"`]([^'"`]+)['"`]/);
        if (tableNameMatch) {
          tableName = tableNameMatch[1];
        } else {
          // Sequelize يستخدم صيغة الجمع بشكل افتراضي
          tableName = modelName.toLowerCase() + 's';
        }

        modelTables.add(tableName);
        
        const modelInfo = {
          modelName,
          tableName,
          fields: {},
          associations: [],
          indexes: [],
          issues: []
        };

        // استخراج الحقول من النموذج
        const fieldMatches = modelContent.matchAll(/(\w+):\s*{[^}]*type:\s*DataTypes\.(\w+)/g);
        for (const match of fieldMatches) {
          const fieldName = match[1];
          const fieldType = match[2];
          modelInfo.fields[fieldName] = {
            type: fieldType,
            inModel: true,
            inDatabase: false
          };
        }

        // التحقق من وجود الجدول في قاعدة البيانات
        if (dbTables.has(tableName)) {
          report.summary.matchingTables++;
          
          // الحصول على معلومات الأعمدة من قاعدة البيانات
          let columns;
          
          if (dialect === 'sqlite') {
            [columns] = await sequelize.query(`PRAGMA table_info(${tableName})`);
            columns = columns.map(c => ({
              name: c.name,
              type: c.type,
              nullable: c.notnull === 0,
              defaultValue: c.dflt_value,
              primaryKey: c.pk === 1
            }));
          } else if (dialect === 'postgres') {
            [columns] = await sequelize.query(`
              SELECT 
                column_name as name,
                data_type as type,
                is_nullable = 'YES' as nullable,
                column_default as "defaultValue",
                (SELECT COUNT(*) > 0 FROM information_schema.table_constraints tc
                  JOIN information_schema.key_column_usage kcu 
                  ON tc.constraint_name = kcu.constraint_name
                  WHERE tc.table_name = '${tableName}' 
                  AND tc.constraint_type = 'PRIMARY KEY'
                  AND kcu.column_name = c.column_name) as "primaryKey"
              FROM information_schema.columns c
              WHERE table_name = '${tableName}'
              AND table_schema = 'public'
              ORDER BY ordinal_position
            `);
          }
          
          const dbFields = new Set(columns.map(c => c.name));
          const modelFields = new Set(Object.keys(modelInfo.fields));

          // مقارنة الحقول
          for (const col of columns) {
            if (modelInfo.fields[col.name]) {
              modelInfo.fields[col.name].inDatabase = true;
              modelInfo.fields[col.name].dbType = col.type;
              modelInfo.fields[col.name].nullable = col.nullable;
              modelInfo.fields[col.name].defaultValue = col.defaultValue;
              modelInfo.fields[col.name].primaryKey = col.primaryKey;
            } else {
              // حقل موجود في قاعدة البيانات ولكن ليس في النموذج
              modelInfo.fields[col.name] = {
                inModel: false,
                inDatabase: true,
                dbType: col.type,
                nullable: col.nullable,
                defaultValue: col.defaultValue,
                primaryKey: col.primaryKey
              };
              
              modelInfo.issues.push({
                type: 'FIELD_MISSING_IN_MODEL',
                field: col.name,
                severity: 'MEDIUM',
                message: `الحقل ${col.name} موجود في قاعدة البيانات ولكن ليس في النموذج`
              });
            }
          }

          // التحقق من الحقول المفقودة في قاعدة البيانات
          for (const fieldName of modelFields) {
            if (!dbFields.has(fieldName)) {
              modelInfo.issues.push({
                type: 'FIELD_MISSING_IN_DATABASE',
                field: fieldName,
                severity: 'HIGH',
                message: `الحقل ${fieldName} موجود في النموذج ولكن ليس في قاعدة البيانات`
              });
            }
          }

          // الحصول على الفهارس
          let indexes;
          if (dialect === 'sqlite') {
            [indexes] = await sequelize.query(`PRAGMA index_list(${tableName})`);
            modelInfo.indexes = indexes.map(idx => ({
              name: idx.name,
              unique: idx.unique === 1,
              partial: idx.partial === 1
            }));
          } else if (dialect === 'postgres') {
            [indexes] = await sequelize.query(`
              SELECT 
                i.relname as name,
                ix.indisunique as unique
              FROM pg_class t
              JOIN pg_index ix ON t.oid = ix.indrelid
              JOIN pg_class i ON i.oid = ix.indexrelid
              WHERE t.relname = '${tableName}'
              AND t.relkind = 'r'
            `);
            modelInfo.indexes = indexes.map(idx => ({
              name: idx.name,
              unique: idx.unique
            }));
          }

          // الحصول على المفاتيح الأجنبية
          let foreignKeys;
          if (dialect === 'sqlite') {
            [foreignKeys] = await sequelize.query(`PRAGMA foreign_key_list(${tableName})`);
            modelInfo.foreignKeys = foreignKeys.map(fk => ({
              column: fk.from,
              referencedTable: fk.table,
              referencedColumn: fk.to,
              onUpdate: fk.on_update,
              onDelete: fk.on_delete
            }));
          } else if (dialect === 'postgres') {
            [foreignKeys] = await sequelize.query(`
              SELECT
                kcu.column_name as column,
                ccu.table_name as "referencedTable",
                ccu.column_name as "referencedColumn",
                rc.update_rule as "onUpdate",
                rc.delete_rule as "onDelete"
              FROM information_schema.table_constraints AS tc
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
              JOIN information_schema.referential_constraints AS rc
                ON rc.constraint_name = tc.constraint_name
              WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = '${tableName}'
            `);
            modelInfo.foreignKeys = foreignKeys;
          }

        } else {
          report.summary.missingTables.push(tableName);
          modelInfo.issues.push({
            type: 'TABLE_NOT_FOUND',
            severity: 'CRITICAL',
            message: `الجدول ${tableName} غير موجود في قاعدة البيانات`
          });
        }

        report.modelDetails[modelName] = modelInfo;
        report.summary.totalModels++;

        // طباعة ملخص للنموذج
        if (modelInfo.issues.length > 0) {
          console.log(`❌ ${modelName} (${tableName}): ${modelInfo.issues.length} مشكلة`);
        } else {
          console.log(`✓ ${modelName} (${tableName}): متوافق`);
        }

      } catch (error) {
        console.error(`خطأ في تحليل النموذج ${modelName}:`, error.message);
        report.summary.issues.push({
          type: 'MODEL_ANALYSIS_ERROR',
          model: modelName,
          severity: 'HIGH',
          message: error.message
        });
      }
    }

    // 3. التحقق من الجداول الإضافية في قاعدة البيانات
    console.log('\n🔍 فحص الجداول الإضافية...\n');
    
    for (const table of dbTables) {
      if (!modelTables.has(table) && table !== 'SequelizeMeta') {
        report.summary.extraTables.push(table);
        
        // الحصول على معلومات الجدول
        let columns, indexes, foreignKeys;
        
        if (dialect === 'sqlite') {
          [columns] = await sequelize.query(`PRAGMA table_info(${table})`);
          [indexes] = await sequelize.query(`PRAGMA index_list(${table})`);
          [foreignKeys] = await sequelize.query(`PRAGMA foreign_key_list(${table})`);
          
          report.tableDetails[table] = {
            columns: columns.map(c => ({
              name: c.name,
              type: c.type,
              nullable: c.notnull === 0,
              defaultValue: c.dflt_value,
              primaryKey: c.pk === 1
            })),
            indexes: indexes.map(idx => ({
              name: idx.name,
              unique: idx.unique === 1
            })),
            foreignKeys: foreignKeys.map(fk => ({
              column: fk.from,
              referencedTable: fk.table,
              referencedColumn: fk.to
            }))
          };
        } else if (dialect === 'postgres') {
          [columns] = await sequelize.query(`
            SELECT 
              column_name as name,
              data_type as type,
              is_nullable = 'YES' as nullable,
              column_default as "defaultValue",
              (SELECT COUNT(*) > 0 FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = '${table}' 
                AND tc.constraint_type = 'PRIMARY KEY'
                AND kcu.column_name = c.column_name) as "primaryKey"
            FROM information_schema.columns c
            WHERE table_name = '${table}'
            AND table_schema = 'public'
            ORDER BY ordinal_position
          `);
          
          [indexes] = await sequelize.query(`
            SELECT 
              i.relname as name,
              ix.indisunique as unique
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            WHERE t.relname = '${table}'
            AND t.relkind = 'r'
          `);
          
          [foreignKeys] = await sequelize.query(`
            SELECT
              kcu.column_name as column,
              ccu.table_name as "referencedTable",
              ccu.column_name as "referencedColumn"
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = '${table}'
          `);
          
          report.tableDetails[table] = {
            columns: columns,
            indexes: indexes,
            foreignKeys: foreignKeys
          };
        }
        
        console.log(`⚠️  جدول إضافي: ${table} (لا يوجد له نموذج)`);
      }
    }

    // 4. إنشاء ملخص المشاكل
    console.log('\n' + '='.repeat(80));
    console.log('📋 ملخص الفحص');
    console.log('='.repeat(80));
    console.log(`إجمالي النماذج: ${report.summary.totalModels}`);
    console.log(`إجمالي الجداول: ${report.summary.totalTables}`);
    console.log(`الجداول المتطابقة: ${report.summary.matchingTables}`);
    console.log(`الجداول المفقودة: ${report.summary.missingTables.length}`);
    console.log(`الجداول الإضافية: ${report.summary.extraTables.length}`);
    
    // حساب إجمالي المشاكل
    let totalIssues = report.summary.issues.length;
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;

    for (const modelName in report.modelDetails) {
      const model = report.modelDetails[modelName];
      totalIssues += model.issues.length;
      
      for (const issue of model.issues) {
        if (issue.severity === 'CRITICAL') criticalIssues++;
        else if (issue.severity === 'HIGH') highIssues++;
        else if (issue.severity === 'MEDIUM') mediumIssues++;
      }
    }

    console.log(`\nإجمالي المشاكل: ${totalIssues}`);
    console.log(`  - حرجة: ${criticalIssues}`);
    console.log(`  - عالية: ${highIssues}`);
    console.log(`  - متوسطة: ${mediumIssues}`);

    // 5. عرض المشاكل بالتفصيل
    if (totalIssues > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  المشاكل المكتشفة');
      console.log('='.repeat(80));

      // المشاكل الحرجة
      if (criticalIssues > 0) {
        console.log('\n🔴 مشاكل حرجة:');
        for (const modelName in report.modelDetails) {
          const model = report.modelDetails[modelName];
          const critical = model.issues.filter(i => i.severity === 'CRITICAL');
          if (critical.length > 0) {
            console.log(`\n  ${modelName}:`);
            critical.forEach(issue => {
              console.log(`    - ${issue.message}`);
            });
          }
        }
      }

      // المشاكل العالية
      if (highIssues > 0) {
        console.log('\n🟠 مشاكل عالية:');
        for (const modelName in report.modelDetails) {
          const model = report.modelDetails[modelName];
          const high = model.issues.filter(i => i.severity === 'HIGH');
          if (high.length > 0) {
            console.log(`\n  ${modelName}:`);
            high.forEach(issue => {
              console.log(`    - ${issue.message}`);
            });
          }
        }
      }

      // المشاكل المتوسطة
      if (mediumIssues > 0) {
        console.log('\n🟡 مشاكل متوسطة:');
        for (const modelName in report.modelDetails) {
          const model = report.modelDetails[modelName];
          const medium = model.issues.filter(i => i.severity === 'MEDIUM');
          if (medium.length > 0) {
            console.log(`\n  ${modelName}:`);
            medium.forEach(issue => {
              console.log(`    - ${issue.message}`);
            });
          }
        }
      }
    }

    // 6. التوصيات
    console.log('\n' + '='.repeat(80));
    console.log('💡 التوصيات');
    console.log('='.repeat(80));

    const recommendations = [];

    if (report.summary.missingTables.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'إنشاء الجداول المفقودة',
        details: `الجداول التالية مفقودة من قاعدة البيانات: ${report.summary.missingTables.join(', ')}`
      });
    }

    if (report.summary.extraTables.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'مراجعة الجداول الإضافية',
        details: `الجداول التالية موجودة في قاعدة البيانات ولكن لا يوجد لها نماذج: ${report.summary.extraTables.join(', ')}`
      });
    }

    // التحقق من الحقول المفقودة
    for (const modelName in report.modelDetails) {
      const model = report.modelDetails[modelName];
      const missingInDb = model.issues.filter(i => i.type === 'FIELD_MISSING_IN_DATABASE');
      const missingInModel = model.issues.filter(i => i.type === 'FIELD_MISSING_IN_MODEL');

      if (missingInDb.length > 0) {
        recommendations.push({
          priority: 'HIGH',
          action: `إضافة حقول مفقودة في جدول ${model.tableName}`,
          details: `الحقول: ${missingInDb.map(i => i.field).join(', ')}`
        });
      }

      if (missingInModel.length > 0) {
        recommendations.push({
          priority: 'MEDIUM',
          action: `تحديث نموذج ${modelName}`,
          details: `إضافة الحقول التالية إلى النموذج: ${missingInModel.map(i => i.field).join(', ')}`
        });
      }
    }

    if (recommendations.length > 0) {
      recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`   ${rec.details}`);
      });
    } else {
      console.log('\n✓ لا توجد توصيات - النظام متوافق تماماً!');
    }

    // 7. حفظ التقرير
    const reportPath = path.join(__dirname, 'DATABASE_COMPATIBILITY_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n✓ تم حفظ التقرير الكامل في: ${reportPath}`);

    // إنشاء تقرير مبسط بصيغة Markdown
    const mdReport = generateMarkdownReport(report, recommendations);
    const mdReportPath = path.join(__dirname, 'DATABASE_COMPATIBILITY_REPORT.md');
    fs.writeFileSync(mdReportPath, mdReport, 'utf8');
    console.log(`✓ تم حفظ التقرير المبسط في: ${mdReportPath}`);

  } catch (error) {
    console.error('❌ خطأ في الفحص:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

function generateMarkdownReport(report, recommendations) {
  let md = '# تقرير التوافق بين النماذج وقاعدة البيانات\n\n';
  md += `**تاريخ الفحص:** ${new Date(report.timestamp).toLocaleString('ar-EG')}\n\n`;
  
  md += '## ملخص عام\n\n';
  md += `- **إجمالي النماذج:** ${report.summary.totalModels}\n`;
  md += `- **إجمالي الجداول:** ${report.summary.totalTables}\n`;
  md += `- **الجداول المتطابقة:** ${report.summary.matchingTables}\n`;
  md += `- **الجداول المفقودة:** ${report.summary.missingTables.length}\n`;
  md += `- **الجداول الإضافية:** ${report.summary.extraTables.length}\n\n`;

  // حساب المشاكل
  let totalIssues = 0;
  let criticalIssues = 0;
  let highIssues = 0;
  let mediumIssues = 0;

  for (const modelName in report.modelDetails) {
    const model = report.modelDetails[modelName];
    totalIssues += model.issues.length;
    
    for (const issue of model.issues) {
      if (issue.severity === 'CRITICAL') criticalIssues++;
      else if (issue.severity === 'HIGH') highIssues++;
      else if (issue.severity === 'MEDIUM') mediumIssues++;
    }
  }

  md += '## إحصائيات المشاكل\n\n';
  md += `- **إجمالي المشاكل:** ${totalIssues}\n`;
  md += `  - 🔴 **حرجة:** ${criticalIssues}\n`;
  md += `  - 🟠 **عالية:** ${highIssues}\n`;
  md += `  - 🟡 **متوسطة:** ${mediumIssues}\n\n`;

  // الجداول المفقودة
  if (report.summary.missingTables.length > 0) {
    md += '## 🔴 الجداول المفقودة\n\n';
    md += 'الجداول التالية موجودة في النماذج ولكن مفقودة من قاعدة البيانات:\n\n';
    report.summary.missingTables.forEach(table => {
      md += `- \`${table}\`\n`;
    });
    md += '\n';
  }

  // الجداول الإضافية
  if (report.summary.extraTables.length > 0) {
    md += '## ⚠️ الجداول الإضافية\n\n';
    md += 'الجداول التالية موجودة في قاعدة البيانات ولكن لا يوجد لها نماذج:\n\n';
    report.summary.extraTables.forEach(table => {
      md += `- \`${table}\`\n`;
    });
    md += '\n';
  }

  // تفاصيل المشاكل لكل نموذج
  md += '## تفاصيل المشاكل حسب النموذج\n\n';
  
  for (const modelName in report.modelDetails) {
    const model = report.modelDetails[modelName];
    
    if (model.issues.length > 0) {
      md += `### ${modelName} (\`${model.tableName}\`)\n\n`;
      
      const critical = model.issues.filter(i => i.severity === 'CRITICAL');
      const high = model.issues.filter(i => i.severity === 'HIGH');
      const medium = model.issues.filter(i => i.severity === 'MEDIUM');
      
      if (critical.length > 0) {
        md += '**مشاكل حرجة:**\n\n';
        critical.forEach(issue => {
          md += `- 🔴 ${issue.message}\n`;
        });
        md += '\n';
      }
      
      if (high.length > 0) {
        md += '**مشاكل عالية:**\n\n';
        high.forEach(issue => {
          md += `- 🟠 ${issue.message}\n`;
        });
        md += '\n';
      }
      
      if (medium.length > 0) {
        md += '**مشاكل متوسطة:**\n\n';
        medium.forEach(issue => {
          md += `- 🟡 ${issue.message}\n`;
        });
        md += '\n';
      }
    }
  }

  // التوصيات
  if (recommendations.length > 0) {
    md += '## 💡 التوصيات\n\n';
    recommendations.forEach((rec, index) => {
      const icon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      md += `### ${index + 1}. ${icon} ${rec.action}\n\n`;
      md += `**الأولوية:** ${rec.priority}\n\n`;
      md += `**التفاصيل:** ${rec.details}\n\n`;
    });
  } else {
    md += '## ✅ النتيجة\n\n';
    md += 'النظام متوافق تماماً! لا توجد مشاكل أو توصيات.\n\n';
  }

  // تفاصيل الحقول
  md += '## تفاصيل الحقول\n\n';
  
  for (const modelName in report.modelDetails) {
    const model = report.modelDetails[modelName];
    
    if (Object.keys(model.fields).length > 0) {
      md += `### ${modelName}\n\n`;
      md += '| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |\n';
      md += '|-------|------------|-------------------|--------------|----------|\n';
      
      for (const fieldName in model.fields) {
        const field = model.fields[fieldName];
        const inModel = field.inModel ? '✓' : '✗';
        const inDb = field.inDatabase ? '✓' : '✗';
        const type = field.dbType || field.type || '-';
        const notes = [];
        
        if (field.primaryKey) notes.push('PK');
        if (field.nullable === false) notes.push('NOT NULL');
        if (field.defaultValue) notes.push(`Default: ${field.defaultValue}`);
        if (!field.inModel) notes.push('⚠️ مفقود من النموذج');
        if (!field.inDatabase) notes.push('⚠️ مفقود من قاعدة البيانات');
        
        md += `| \`${fieldName}\` | ${inModel} | ${inDb} | ${type} | ${notes.join(', ') || '-'} |\n`;
      }
      
      md += '\n';
    }
  }

  return md;
}

// تشغيل الفحص
checkDatabaseCompatibility()
  .then(() => {
    console.log('\n✓ اكتمل الفحص بنجاح!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ فشل الفحص:', error);
    process.exit(1);
  });
