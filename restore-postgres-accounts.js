import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تحميل متغيرات البيئة من المجلد الجذر
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔄 بدء استعادة دليل الحسابات في PostgreSQL...');

// الاتصال بقاعدة البيانات PostgreSQL الإنتاج
const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL غير موجود في متغيرات البيئة');
  console.log('💡 تأكد من وجود DATABASE_URL في ملف .env');
  process.exit(1);
}

console.log('🔗 الاتصال بـ PostgreSQL...');
console.log('🔍 Database URL:', databaseUrl.replace(/\/\/.*@/, '//***:***@')); // إخفاء كلمة المرور

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false, // تعطيل السجلات لتجنب الفوضى
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// دليل الحسابات الكامل
const chartOfAccounts = [
  // الأصول (Assets) - 1
  { code: '1', name: 'الأصول', nameEn: 'Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, parentCode: null, balance: 0 },
  { code: '1.1', name: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, parentCode: '1', balance: 0 },
  { code: '1.1.1', name: 'النقدية والبنوك', nameEn: 'Cash and Banks', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, parentCode: '1.1', balance: 0 },
  { code: '1.1.1.1', name: 'الصندوق', nameEn: 'Cash', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.1', balance: 500 },
  { code: '1.1.1.2', name: 'البنك الأهلي', nameEn: 'National Bank', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.1', balance: 0 },
  { code: '1.1.1.3', name: 'بنك الجمهورية', nameEn: 'Republic Bank', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.1', balance: 0 },
  
  { code: '1.1.2', name: 'المدينون', nameEn: 'Accounts Receivable', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, parentCode: '1.1', balance: 0 },
  { code: '1.1.2.1', name: 'عملاء', nameEn: 'Customers', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.2', balance: 0 },
  { code: '1.1.2.2', name: 'أوراق القبض', nameEn: 'Notes Receivable', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.2', balance: 0 },
  
  { code: '1.1.3', name: 'المخزون', nameEn: 'Inventory', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, parentCode: '1.1', balance: 0 },
  { code: '1.1.3.1', name: 'مخزون البضائع', nameEn: 'Merchandise Inventory', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.3', balance: 0 },
  { code: '1.1.3.2', name: 'مخزون المواد الخام', nameEn: 'Raw Materials', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.3', balance: 0 },
  
  { code: '1.2', name: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, parentCode: '1', balance: 0 },
  { code: '1.2.1', name: 'الأراضي', nameEn: 'Land', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.2', name: 'المباني', nameEn: 'Buildings', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.3', name: 'الآلات والمعدات', nameEn: 'Machinery & Equipment', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.4', name: 'الأثاث والتجهيزات', nameEn: 'Furniture & Fixtures', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.5', name: 'السيارات', nameEn: 'Vehicles', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.6', name: 'أجهزة الحاسوب', nameEn: 'Computer Equipment', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.7', name: 'مجمع الاستهلاك', nameEn: 'Accumulated Depreciation', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.2', balance: 0 },

  // الخصوم (Liabilities) - 2
  { code: '2', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: true, parentCode: null, balance: 0 },
  { code: '2.1', name: 'الخصوم المتداولة', nameEn: 'Current Liabilities', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: true, parentCode: '2', balance: 0 },
  { code: '2.1.1', name: 'الدائنون', nameEn: 'Accounts Payable', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: true, parentCode: '2.1', balance: 0 },
  { code: '2.1.1.1', name: 'موردون', nameEn: 'Suppliers', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: false, parentCode: '2.1.1', balance: 0 },
  { code: '2.1.1.2', name: 'أوراق الدفع', nameEn: 'Notes Payable', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: false, parentCode: '2.1.1', balance: 0 },
  { code: '2.1.2', name: 'مصروفات مستحقة', nameEn: 'Accrued Expenses', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: false, parentCode: '2.1', balance: 0 },
  { code: '2.1.3', name: 'ضرائب مستحقة', nameEn: 'Accrued Taxes', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: false, parentCode: '2.1', balance: 0 },
  { code: '2.2', name: 'مصروف الاستهلاك', nameEn: 'Depreciation Expense', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '2', balance: 0 },

  // حقوق الملكية (Equity) - 3
  { code: '3', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: true, parentCode: null, balance: 0 },
  { code: '3.1', name: 'رأس المال', nameEn: 'Capital', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: false, parentCode: '3', balance: 0 },
  { code: '3.2', name: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: false, parentCode: '3', balance: 0 },
  { code: '3.3', name: 'أرباح العام الحالي', nameEn: 'Current Year Earnings', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: false, parentCode: '3', balance: 0 },

  // الإيرادات (Revenue) - 4
  { code: '4', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: true, parentCode: null, balance: 0 },
  { code: '4.1', name: 'إيرادات المبيعات', nameEn: 'Sales Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: false, parentCode: '4', balance: 0 },
  { code: '4.2', name: 'إيرادات الخدمات', nameEn: 'Service Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: false, parentCode: '4', balance: 0 },
  { code: '4.3', name: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: false, parentCode: '4', balance: 0 },

  // المصروفات (Expenses) - 5
  { code: '5', name: 'المصروفات', nameEn: 'Expenses', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: true, parentCode: null, balance: 0 },
  { code: '5.1', name: 'تكلفة البضاعة المباعة', nameEn: 'Cost of Goods Sold', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '5', balance: 0 },
  { code: '5.2', name: 'مصروفات التشغيل', nameEn: 'Operating Expenses', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: true, parentCode: '5', balance: 0 },
  { code: '5.2.1', name: 'مواد نظافة', nameEn: 'Cleaning Supplies', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '5.2', balance: 300 },
  { code: '5.2.2', name: 'رواتب الموظفين', nameEn: 'Employee Salaries', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.2.3', name: 'إيجار المكتب', nameEn: 'Office Rent', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.2.4', name: 'فواتير الكهرباء', nameEn: 'Electricity Bills', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.2.5', name: 'فواتير الهاتف', nameEn: 'Phone Bills', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.3', name: 'مصروفات إدارية', nameEn: 'Administrative Expenses', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '5', balance: 0 },
  { code: '5.4', name: 'مصروفات مالية', nameEn: 'Financial Expenses', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '5', balance: 0 }
];

async function restorePostgreSQLAccounts() {
  try {
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات PostgreSQL بنجاح');
    
    // عد الحسابات الموجودة
    const [existingCountResult] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
    const existingCount = parseInt(existingCountResult[0].count);
    console.log(`📊 عدد الحسابات الموجودة حالياً: ${existingCount}`);
    
    console.log('🔄 سيتم إضافة الحسابات المفقودة...');
    
    let addedCount = 0;
    let existingAccountsCount = 0;
    let errorCount = 0;
    
    // إنشاء الحسابات بالترتيب الصحيح (الآباء أولاً)
    for (const accountData of chartOfAccounts) {
      try {
        // التحقق من وجود الحساب
        const [existingResult] = await sequelize.query(
          'SELECT id FROM accounts WHERE code = :code',
          { replacements: { code: accountData.code } }
        );
        
        if (existingResult.length === 0) {
          // إدراج الحساب الجديد
          await sequelize.query(`
            INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "isGroup", "parentCode", balance, "isActive", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), :code, :name, :nameEn, :type, :rootType, :reportType, :isGroup, :parentCode, :balance, true, NOW(), NOW())
          `, {
            replacements: {
              code: accountData.code,
              name: accountData.name,
              nameEn: accountData.nameEn,
              type: accountData.type,
              rootType: accountData.rootType,
              reportType: accountData.reportType,
              isGroup: accountData.isGroup,
              parentCode: accountData.parentCode,
              balance: accountData.balance
            }
          });
          
          console.log(`✅ تم إنشاء الحساب: ${accountData.code} - ${accountData.name}`);
          addedCount++;
        } else {
          console.log(`⏭️  الحساب موجود: ${accountData.code} - ${accountData.name}`);
          existingAccountsCount++;
        }
      } catch (error) {
        console.error(`❌ خطأ في إنشاء الحساب ${accountData.code}:`, error.message);
        errorCount++;
      }
    }
    
    // التحقق من النتائج النهائية
    const [finalCountResult] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
    const finalCount = parseInt(finalCountResult[0].count);
    
    console.log(`\n📊 ملخص العملية:`);
    console.log(`  - الحسابات الموجودة مسبقاً: ${existingAccountsCount}`);
    console.log(`  - الحسابات المضافة: ${addedCount}`);
    console.log(`  - الأخطاء: ${errorCount}`);
    console.log(`  - العدد النهائي للحسابات: ${finalCount}`);
    
    if (addedCount > 0) {
      console.log(`🎉 تم إضافة ${addedCount} حساب جديد بنجاح في قاعدة البيانات PostgreSQL!`);
    } else if (existingAccountsCount > 0) {
      console.log(`✅ جميع الحسابات موجودة مسبقاً في قاعدة البيانات`);
    }
    
    // عرض عينة من الحسابات
    const [sampleAccounts] = await sequelize.query('SELECT code, name, type FROM accounts ORDER BY code LIMIT 10');
    console.log('\n📋 عينة من الحسابات:');
    sampleAccounts.forEach(account => {
      console.log(`  ${account.code} - ${account.name} (${account.type})`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في استعادة الحسابات:', error);
    console.error('تفاصيل الخطأ:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔒 تم إغلاق الاتصال بقاعدة البيانات PostgreSQL');
  }
}

restorePostgreSQLAccounts();
