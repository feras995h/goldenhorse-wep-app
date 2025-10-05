import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

// قائمة الجداول المتوقعة في النظام
const expectedTables = [
  'users',
  'customers',
  'suppliers',
  'employees',
  'accounts',
  'account_mappings',
  'journal_entries',
  'journal_entry_lines',
  'invoices',
  'sales_invoices',
  'purchase_invoices',
  'payments',
  'receipts',
  'receipt_vouchers',
  'payment_vouchers',
  'shipments',
  'shipment_movements',
  'warehouse',
  'fixed_assets',
  'notifications',
  'invoice_payments',
  'invoice_receipts',
  'account_provisions',
  'migrations_log'
];

async function auditDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');
    console.log('='.repeat(80));
    console.log('تقرير فحص قاعدة البيانات الشامل');
    console.log('='.repeat(80));
    console.log();

    // الحصول على جميع الجداول الموجودة
    const [existingTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTableNames = existingTables.map(t => t.table_name);

    console.log(`📊 عدد الجداول الموجودة: ${existingTableNames.length}`);
    console.log(`📋 عدد الجداول المتوقعة: ${expectedTables.length}\n`);

    // الجداول الموجودة
    console.log('✅ الجداول الموجودة:');
    console.log('-'.repeat(80));
    const foundTables = [];
    for (const table of expectedTables) {
      if (existingTableNames.includes(table)) {
        foundTables.push(table);
        
        // الحصول على عدد الأعمدة
        const [columns] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.columns 
          WHERE table_name = '${table}'
        `);
        
        // الحصول على عدد الصفوف
        let rowCount = 0;
        try {
          const [rows] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}"`);
          rowCount = rows[0].count;
        } catch (e) {
          rowCount = 'N/A';
        }
        
        console.log(`  ✓ ${table.padEnd(30)} | أعمدة: ${columns[0].count.toString().padStart(3)} | صفوف: ${rowCount}`);
      }
    }

    console.log();

    // الجداول الناقصة
    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));
    console.log('❌ الجداول الناقصة:');
    console.log('-'.repeat(80));
    if (missingTables.length === 0) {
      console.log('  لا توجد جداول ناقصة! ✨');
    } else {
      missingTables.forEach(table => {
        console.log(`  ✗ ${table}`);
      });
    }

    console.log();

    // الجداول الإضافية (غير متوقعة)
    const extraTables = existingTableNames.filter(t => !expectedTables.includes(t));
    console.log('ℹ️  الجداول الإضافية (غير متوقعة):');
    console.log('-'.repeat(80));
    if (extraTables.length === 0) {
      console.log('  لا توجد جداول إضافية');
    } else {
      extraTables.forEach(table => {
        console.log(`  + ${table}`);
      });
    }

    console.log();
    console.log('='.repeat(80));

    // فحص تفصيلي للجداول الحرجة
    console.log('\n📋 فحص تفصيلي للجداول الحرجة:');
    console.log('='.repeat(80));

    const criticalTables = ['users', 'accounts', 'customers', 'sales_invoices'];
    
    for (const table of criticalTables) {
      if (existingTableNames.includes(table)) {
        console.log(`\n🔍 جدول: ${table}`);
        console.log('-'.repeat(40));
        
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = '${table}'
          ORDER BY ordinal_position
          LIMIT 10
        `);
        
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          console.log(`  - ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | ${nullable}`);
        });
        
        if (columns.length === 10) {
          console.log('  ... (والمزيد)');
        }
      } else {
        console.log(`\n❌ جدول: ${table} - غير موجود!`);
      }
    }

    console.log();
    console.log('='.repeat(80));
    console.log('✅ اكتمل الفحص بنجاح');
    console.log('='.repeat(80));

    // حفظ النتائج في ملف
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalExpected: expectedTables.length,
        totalFound: foundTables.length,
        totalMissing: missingTables.length,
        totalExtra: extraTables.length
      },
      foundTables,
      missingTables,
      extraTables
    };

    console.log('\n📄 تم حفظ التقرير في: database-audit-report.json');

    await sequelize.close();
    
    return report;
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

auditDatabase().then(report => {
  // حفظ التقرير
  import('fs').then(fs => {
    fs.default.writeFileSync(
      'database-audit-report.json',
      JSON.stringify(report, null, 2),
      'utf8'
    );
  });
});
