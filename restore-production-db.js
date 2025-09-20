import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

// الاتصال بقاعدة البيانات الإنتاج
const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// دليل الحسابات الكامل
const chartOfAccounts = [
  // الأصول
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

  // الخصوم
  { code: '2', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: true, parentCode: null, balance: 0 },
  { code: '2.1', name: 'الخصوم المتداولة', nameEn: 'Current Liabilities', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: true, parentCode: '2', balance: 0 },
  { code: '2.1.1', name: 'الدائنون', nameEn: 'Accounts Payable', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: true, parentCode: '2.1', balance: 0 },
  { code: '2.1.1.1', name: 'موردون', nameEn: 'Suppliers', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: false, parentCode: '2.1.1', balance: 0 },
  { code: '2.1.1.2', name: 'أوراق الدفع', nameEn: 'Notes Payable', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: false, parentCode: '2.1.1', balance: 0 },
  { code: '2.1.2', name: 'مصروفات مستحقة', nameEn: 'Accrued Expenses', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: false, parentCode: '2.1', balance: 0 },
  { code: '2.1.3', name: 'ضرائب مستحقة', nameEn: 'Accrued Taxes', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: false, parentCode: '2.1', balance: 0 },
  { code: '2.2', name: 'مصروف الاستهلاك', nameEn: 'Depreciation Expense', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: false, parentCode: '2', balance: 0 },

  // حقوق الملكية
  { code: '3', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: true, parentCode: null, balance: 0 },
  { code: '3.1', name: 'رأس المال', nameEn: 'Capital', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: false, parentCode: '3', balance: 0 },
  { code: '3.2', name: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: false, parentCode: '3', balance: 0 },
  { code: '3.3', name: 'أرباح العام الحالي', nameEn: 'Current Year Earnings', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: false, parentCode: '3', balance: 0 },

  // الإيرادات
  { code: '4', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: true, parentCode: null, balance: 0 },
  { code: '4.1', name: 'إيرادات المبيعات', nameEn: 'Sales Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: false, parentCode: '4', balance: 0 },
  { code: '4.2', name: 'إيرادات الخدمات', nameEn: 'Service Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: false, parentCode: '4', balance: 0 },
  { code: '4.3', name: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: false, parentCode: '4', balance: 0 },

  // المصروفات
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

async function restoreProductionAccounts() {
  try {
    console.log('🔄 بدء استعادة دليل الحسابات في قاعدة البيانات الإنتاج...');
    console.log('🔗 الاتصال بـ PostgreSQL...');
    
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات الإنتاج بنجاح');
    
    // تنفيذ SQL مباشر لإدراج الحسابات
    const insertSQL = `
      INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "isGroup", "parentCode", balance, "isActive", "createdAt", "updatedAt") VALUES
      ${chartOfAccounts.map(account => 
        `(gen_random_uuid(), '${account.code}', '${account.name}', '${account.nameEn}', '${account.type}', '${account.rootType}', '${account.reportType}', ${account.isGroup}, ${account.parentCode ? `'${account.parentCode}'` : 'null'}, ${account.balance}, true, NOW(), NOW())`
      ).join(',\n')}
      ON CONFLICT (code) DO NOTHING;
    `;
    
    console.log('🔄 تنفيذ عملية الإدراج...');
    await sequelize.query(insertSQL);
    
    // التحقق من النتائج
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
    const totalAccounts = results[0].count;
    
    console.log(`🎉 تم الانتهاء بنجاح!`);
    console.log(`📊 العدد الإجمالي للحسابات: ${totalAccounts}`);
    
    // عرض عينة من الحسابات
    const [sampleAccounts] = await sequelize.query('SELECT code, name, type FROM accounts ORDER BY code LIMIT 10');
    console.log('\n📋 عينة من الحسابات:');
    sampleAccounts.forEach(account => {
      console.log(`  ${account.code} - ${account.name} (${account.type})`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في استعادة الحسابات:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 تم إغلاق الاتصال بقاعدة البيانات الإنتاج');
  }
}

restoreProductionAccounts();
