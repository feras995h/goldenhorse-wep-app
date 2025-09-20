console.log('🔄 بدء إنشاء الحسابات الرئيسية...');

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
  
  // الحسابات الرئيسية وفقاً للتصنيف المطلوب
  const mainAccounts = [
    {
      code: '1',
      name: 'الأصول',
      nameEn: 'Assets',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      nature: 'debit',
      level: 1,
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      description: 'الحساب الرئيسي للأصول - يشمل جميع الأصول المملوكة للشركة',
      accountType: 'main',
      isSystemAccount: true,
      isMonitored: false
    },
    {
      code: '2',
      name: 'المصروفات',
      nameEn: 'Expenses',
      type: 'expense',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      nature: 'debit',
      level: 1,
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      description: 'الحساب الرئيسي للمصروفات - يشمل جميع المصروفات التشغيلية والإدارية',
      accountType: 'main',
      isSystemAccount: true,
      isMonitored: false
    },
    {
      code: '3',
      name: 'الالتزامات',
      nameEn: 'Liabilities',
      type: 'liability',
      rootType: 'Liability',
      reportType: 'Balance Sheet',
      nature: 'credit',
      level: 1,
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      description: 'الحساب الرئيسي للالتزامات - يشمل جميع الديون والالتزامات المالية',
      accountType: 'main',
      isSystemAccount: true,
      isMonitored: false
    },
    {
      code: '4',
      name: 'حقوق الملكية',
      nameEn: 'Equity',
      type: 'equity',
      rootType: 'Equity',
      reportType: 'Balance Sheet',
      nature: 'credit',
      level: 1,
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      description: 'الحساب الرئيسي لحقوق الملكية - يشمل رأس المال والأرباح المحتجزة',
      accountType: 'main',
      isSystemAccount: true,
      isMonitored: false
    },
    {
      code: '5',
      name: 'الإيرادات',
      nameEn: 'Revenue',
      type: 'revenue',
      rootType: 'Income',
      reportType: 'Profit and Loss',
      nature: 'credit',
      level: 1,
      isGroup: true,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      description: 'الحساب الرئيسي للإيرادات - يشمل جميع الإيرادات من المبيعات والخدمات',
      accountType: 'main',
      isSystemAccount: true,
      isMonitored: false
    }
  ];
  
  console.log('\n📝 إنشاء الحسابات الرئيسية...');
  
  for (const accountData of mainAccounts) {
    try {
      // التحقق من وجود الحساب
      const existingAccount = await Account.findOne({ where: { code: accountData.code } });
      
      if (existingAccount) {
        console.log(`ℹ️ الحساب ${accountData.code} - ${accountData.name} موجود بالفعل`);
        
        // تحديث الحساب الموجود
        await existingAccount.update({
          nature: accountData.nature,
          rootType: accountData.rootType,
          reportType: accountData.reportType,
          description: accountData.description
        });
        console.log(`✅ تم تحديث الحساب ${accountData.code} - ${accountData.name}`);
      } else {
        // إنشاء حساب جديد
        await Account.create(accountData);
        console.log(`✅ تم إنشاء الحساب ${accountData.code} - ${accountData.name}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في إنشاء الحساب ${accountData.code}:`, error.message);
    }
  }
  
  // التحقق من النتائج
  console.log('\n📊 التحقق من النتائج...');
  const createdAccounts = await Account.findAll({
    where: { level: 1 },
    order: [['code', 'ASC']]
  });
  
  console.log('\n🎉 الحسابات الرئيسية المنشأة:');
  console.log('=====================================');
  
  for (const account of createdAccounts) {
    console.log(`${account.code} - ${account.name} (${account.type}) - طبيعة: ${account.nature}`);
  }
  
  console.log('\n✅ تم إنشاء الحسابات الرئيسية بنجاح!');
  console.log('\n📋 التصنيف النهائي:');
  console.log('1 - الأصول (Assets) - طبيعة مدين');
  console.log('2 - المصروفات (Expenses) - طبيعة مدين');
  console.log('3 - الالتزامات (Liabilities) - طبيعة دائن');
  console.log('4 - حقوق الملكية (Equity) - طبيعة دائن');
  console.log('5 - الإيرادات (Revenue) - طبيعة دائن');
  
  process.exit(0);
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}
