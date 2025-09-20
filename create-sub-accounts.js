console.log('🔄 بدء إنشاء الحسابات الفرعية...');

try {
  // استيراد النماذج
  const modelsModule = await import('./server/src/models/index.js');
  const models = modelsModule.default;
  const { sequelize } = modelsModule;
  const { Account } = models;
  
  console.log('✅ تم تحميل النماذج بنجاح');
  
  // التحقق من الاتصال
  await sequelize.authenticate();
  console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
  
  // الحصول على الحسابات الرئيسية
  const mainAccounts = await Account.findAll({
    where: { level: 1 },
    order: [['code', 'ASC']]
  });
  
  console.log(`📊 تم العثور على ${mainAccounts.length} حساب رئيسي`);
  
  // الحسابات الفرعية الأساسية
  const subAccounts = [
    // 1 - الأصول
    {
      code: '1.1',
      name: 'الأصول المتداولة',
      nameEn: 'Current Assets',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      nature: 'debit',
      level: 2,
      parentCode: '1',
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '1.1.1',
      name: 'النقدية والبنوك',
      nameEn: 'Cash and Banks',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      nature: 'debit',
      level: 3,
      parentCode: '1.1',
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '1.1.1.1',
      name: 'الصندوق',
      nameEn: 'Cash',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      nature: 'debit',
      level: 4,
      parentCode: '1.1.1',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '1.1.1.2',
      name: 'البنك الأهلي',
      nameEn: 'National Bank',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      nature: 'debit',
      level: 4,
      parentCode: '1.1.1',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '1.1.2',
      name: 'العملاء',
      nameEn: 'Accounts Receivable',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      nature: 'debit',
      level: 3,
      parentCode: '1.1',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '1.2',
      name: 'الأصول الثابتة',
      nameEn: 'Fixed Assets',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      nature: 'debit',
      level: 2,
      parentCode: '1',
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    
    // 2 - المصروفات
    {
      code: '2.1',
      name: 'تكلفة البضاعة المباعة',
      nameEn: 'Cost of Goods Sold',
      type: 'expense',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      nature: 'debit',
      level: 2,
      parentCode: '2',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '2.2',
      name: 'مصروفات التشغيل',
      nameEn: 'Operating Expenses',
      type: 'expense',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      nature: 'debit',
      level: 2,
      parentCode: '2',
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '2.2.1',
      name: 'رواتب الموظفين',
      nameEn: 'Employee Salaries',
      type: 'expense',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      nature: 'debit',
      level: 3,
      parentCode: '2.2',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '2.2.2',
      name: 'إيجار المكتب',
      nameEn: 'Office Rent',
      type: 'expense',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      nature: 'debit',
      level: 3,
      parentCode: '2.2',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    
    // 3 - الالتزامات
    {
      code: '3.1',
      name: 'الالتزامات المتداولة',
      nameEn: 'Current Liabilities',
      type: 'liability',
      rootType: 'Liability',
      reportType: 'Balance Sheet',
      nature: 'credit',
      level: 2,
      parentCode: '3',
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '3.1.1',
      name: 'الموردون',
      nameEn: 'Accounts Payable',
      type: 'liability',
      rootType: 'Liability',
      reportType: 'Balance Sheet',
      nature: 'credit',
      level: 3,
      parentCode: '3.1',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    
    // 4 - حقوق الملكية
    {
      code: '4.1',
      name: 'رأس المال',
      nameEn: 'Capital',
      type: 'equity',
      rootType: 'Equity',
      reportType: 'Balance Sheet',
      nature: 'credit',
      level: 2,
      parentCode: '4',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '4.2',
      name: 'الأرباح المحتجزة',
      nameEn: 'Retained Earnings',
      type: 'equity',
      rootType: 'Equity',
      reportType: 'Balance Sheet',
      nature: 'credit',
      level: 2,
      parentCode: '4',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    
    // 5 - الإيرادات
    {
      code: '5.1',
      name: 'إيرادات المبيعات',
      nameEn: 'Sales Revenue',
      type: 'revenue',
      rootType: 'Income',
      reportType: 'Profit and Loss',
      nature: 'credit',
      level: 2,
      parentCode: '5',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    },
    {
      code: '5.2',
      name: 'إيرادات الخدمات',
      nameEn: 'Service Revenue',
      type: 'revenue',
      rootType: 'Income',
      reportType: 'Profit and Loss',
      nature: 'credit',
      level: 2,
      parentCode: '5',
      isGroup: false,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: 'sub'
    }
  ];
  
  console.log('\n📝 إنشاء الحسابات الفرعية...');
  
  for (const accountData of subAccounts) {
    try {
      // البحث عن الحساب الأب
      const parentAccount = await Account.findOne({ where: { code: accountData.parentCode } });
      
      if (parentAccount) {
        accountData.parentId = parentAccount.id;
      }
      
      // التحقق من وجود الحساب
      const existingAccount = await Account.findOne({ where: { code: accountData.code } });
      
      if (existingAccount) {
        console.log(`ℹ️ الحساب ${accountData.code} - ${accountData.name} موجود بالفعل`);
      } else {
        // إنشاء حساب جديد
        await Account.create(accountData);
        console.log(`✅ تم إنشاء الحساب ${accountData.code} - ${accountData.name}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في إنشاء الحساب ${accountData.code}:`, error.message);
    }
  }
  
  // التحقق من النتائج النهائية
  console.log('\n📊 ملخص دليل الحسابات:');
  const allAccounts = await Account.findAll({
    order: [['code', 'ASC']]
  });
  
  console.log(`إجمالي الحسابات: ${allAccounts.length}`);
  
  const accountsByLevel = await Account.findAll({
    attributes: ['level', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['level'],
    order: [['level', 'ASC']]
  });
  
  console.log('\nتوزيع الحسابات حسب المستوى:');
  for (const stat of accountsByLevel) {
    console.log(`- المستوى ${stat.level}: ${stat.dataValues.count} حساب`);
  }
  
  console.log('\n✅ تم إنشاء دليل الحسابات بنجاح!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}
