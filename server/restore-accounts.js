import models, { sequelize } from './src/models/index.js';

const { Account } = models;

// دليل الحسابات الكامل
const chartOfAccounts = [
  // الأصول (Assets) - 1
  { code: '1', name: 'الأصول', nameEn: 'Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, parentCode: null },
  { code: '1.1', name: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, parentCode: '1' },
  { code: '1.1.1', name: 'النقدية والبنوك', nameEn: 'Cash and Banks', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, parentCode: '1.1' },
  { code: '1.1.1.1', name: 'الصندوق', nameEn: 'Cash', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.1', balance: 500 },
  { code: '1.1.1.2', name: 'البنك الأهلي', nameEn: 'National Bank', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.1', balance: 0 },
  { code: '1.1.1.3', name: 'بنك الجمهورية', nameEn: 'Republic Bank', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: false, parentCode: '1.1.1', balance: 0 },
  
  { code: '1.1.2', name: 'المدينون', nameEn: 'Accounts Receivable', type: 'asset', isGroup: true, parentCode: '1.1' },
  { code: '1.1.2.1', name: 'عملاء', nameEn: 'Customers', type: 'asset', isGroup: false, parentCode: '1.1.2', balance: 0 },
  { code: '1.1.2.2', name: 'أوراق القبض', nameEn: 'Notes Receivable', type: 'asset', isGroup: false, parentCode: '1.1.2', balance: 0 },
  
  { code: '1.1.3', name: 'المخزون', nameEn: 'Inventory', type: 'asset', isGroup: true, parentCode: '1.1' },
  { code: '1.1.3.1', name: 'مخزون البضائع', nameEn: 'Merchandise Inventory', type: 'asset', isGroup: false, parentCode: '1.1.3', balance: 0 },
  { code: '1.1.3.2', name: 'مخزون المواد الخام', nameEn: 'Raw Materials', type: 'asset', isGroup: false, parentCode: '1.1.3', balance: 0 },
  
  { code: '1.2', name: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'asset', isGroup: true, parentCode: '1' },
  { code: '1.2.1', name: 'الأراضي', nameEn: 'Land', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.2', name: 'المباني', nameEn: 'Buildings', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.3', name: 'الآلات والمعدات', nameEn: 'Machinery & Equipment', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.4', name: 'الأثاث والتجهيزات', nameEn: 'Furniture & Fixtures', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.5', name: 'السيارات', nameEn: 'Vehicles', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.6', name: 'أجهزة الحاسوب', nameEn: 'Computer Equipment', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },
  { code: '1.2.7', name: 'مجمع الاستهلاك', nameEn: 'Accumulated Depreciation', type: 'asset', isGroup: false, parentCode: '1.2', balance: 0 },

  // الخصوم (Liabilities) - 2
  { code: '2', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', isGroup: true, parentCode: null },
  { code: '2.1', name: 'الخصوم المتداولة', nameEn: 'Current Liabilities', type: 'liability', isGroup: true, parentCode: '2' },
  { code: '2.1.1', name: 'الدائنون', nameEn: 'Accounts Payable', type: 'liability', isGroup: true, parentCode: '2.1' },
  { code: '2.1.1.1', name: 'موردون', nameEn: 'Suppliers', type: 'liability', isGroup: false, parentCode: '2.1.1', balance: 0 },
  { code: '2.1.1.2', name: 'أوراق الدفع', nameEn: 'Notes Payable', type: 'liability', isGroup: false, parentCode: '2.1.1', balance: 0 },
  
  { code: '2.1.2', name: 'مصروفات مستحقة', nameEn: 'Accrued Expenses', type: 'liability', isGroup: false, parentCode: '2.1', balance: 0 },
  { code: '2.1.3', name: 'ضرائب مستحقة', nameEn: 'Accrued Taxes', type: 'liability', isGroup: false, parentCode: '2.1', balance: 0 },
  
  { code: '2.2', name: 'مصروف الاستهلاك', nameEn: 'Depreciation Expense', type: 'expense', isGroup: false, parentCode: '2', balance: 0 },

  // حقوق الملكية (Equity) - 3
  { code: '3', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', isGroup: true, parentCode: null },
  { code: '3.1', name: 'رأس المال', nameEn: 'Capital', type: 'equity', isGroup: false, parentCode: '3', balance: 0 },
  { code: '3.2', name: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity', isGroup: false, parentCode: '3', balance: 0 },
  { code: '3.3', name: 'أرباح العام الحالي', nameEn: 'Current Year Earnings', type: 'equity', isGroup: false, parentCode: '3', balance: 0 },

  // الإيرادات (Revenue) - 4
  { code: '4', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', isGroup: true, parentCode: null },
  { code: '4.1', name: 'إيرادات المبيعات', nameEn: 'Sales Revenue', type: 'revenue', isGroup: false, parentCode: '4', balance: 0 },
  { code: '4.2', name: 'إيرادات الخدمات', nameEn: 'Service Revenue', type: 'revenue', isGroup: false, parentCode: '4', balance: 0 },
  { code: '4.3', name: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue', isGroup: false, parentCode: '4', balance: 0 },

  // المصروفات (Expenses) - 5
  { code: '5', name: 'المصروفات', nameEn: 'Expenses', type: 'expense', isGroup: true, parentCode: null },
  { code: '5.1', name: 'تكلفة البضاعة المباعة', nameEn: 'Cost of Goods Sold', type: 'expense', isGroup: false, parentCode: '5', balance: 0 },
  { code: '5.2', name: 'مصروفات التشغيل', nameEn: 'Operating Expenses', type: 'expense', isGroup: true, parentCode: '5' },
  { code: '5.2.1', name: 'مواد نظافة', nameEn: 'Cleaning Supplies', type: 'expense', isGroup: false, parentCode: '5.2', balance: 300 },
  { code: '5.2.2', name: 'رواتب الموظفين', nameEn: 'Employee Salaries', type: 'expense', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.2.3', name: 'إيجار المكتب', nameEn: 'Office Rent', type: 'expense', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.2.4', name: 'فواتير الكهرباء', nameEn: 'Electricity Bills', type: 'expense', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.2.5', name: 'فواتير الهاتف', nameEn: 'Phone Bills', type: 'expense', isGroup: false, parentCode: '5.2', balance: 0 },
  { code: '5.3', name: 'مصروفات إدارية', nameEn: 'Administrative Expenses', type: 'expense', isGroup: false, parentCode: '5', balance: 0 },
  { code: '5.4', name: 'مصروفات مالية', nameEn: 'Financial Expenses', type: 'expense', isGroup: false, parentCode: '5', balance: 0 }
];

async function restoreAccounts() {
  try {
    console.log('🔄 بدء استعادة دليل الحسابات...');
    
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // عد الحسابات الموجودة
    const existingCount = await Account.count();
    console.log(`📊 عدد الحسابات الموجودة حالياً: ${existingCount}`);
    
    console.log('🔄 سيتم إضافة الحسابات المفقودة...');

    let addedCount = 0;
    let existingAccountsCount = 0;

    // إنشاء الحسابات بالترتيب الصحيح (الآباء أولاً)
    for (const accountData of chartOfAccounts) {
      try {
        const existingAccount = await Account.findOne({ where: { code: accountData.code } });

        if (!existingAccount) {
          await Account.create({
            ...accountData,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`✅ تم إنشاء الحساب: ${accountData.code} - ${accountData.name}`);
          addedCount++;
        } else {
          console.log(`⏭️  الحساب موجود: ${accountData.code} - ${accountData.name}`);
          existingAccountsCount++;
        }
      } catch (error) {
        console.error(`❌ خطأ في إنشاء الحساب ${accountData.code}:`, error.message);
      }
    }

    const finalCount = await Account.count();
    console.log(`\n📊 ملخص العملية:`);
    console.log(`  - الحسابات الموجودة مسبقاً: ${existingAccountsCount}`);
    console.log(`  - الحسابات المضافة: ${addedCount}`);
    console.log(`  - العدد النهائي للحسابات: ${finalCount}`);

    if (addedCount > 0) {
      console.log(`🎉 تم إضافة ${addedCount} حساب جديد بنجاح!`);
    } else {
      console.log(`✅ جميع الحسابات موجودة مسبقاً`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في استعادة الحسابات:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

restoreAccounts();
