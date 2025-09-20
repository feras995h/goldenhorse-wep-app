console.log('🔄 بدء التحقق من الحسابات...');

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
  
  console.log('\n📊 الحسابات الرئيسية الحالية:');
  console.log('=====================================');
  
  if (mainAccounts.length === 0) {
    console.log('❌ لا توجد حسابات رئيسية');
  } else {
    mainAccounts.forEach(account => {
      console.log(`${account.code} - ${account.name} (${account.type}) - طبيعة: ${account.nature || 'غير محدد'}`);
    });
  }
  
  // إحصائيات
  const totalAccounts = await Account.count();
  console.log(`\n📈 إجمالي الحسابات: ${totalAccounts}`);
  
  console.log('\n🎯 التصنيف المطلوب:');
  console.log('1 - الأصول (Assets) - طبيعة مدين');
  console.log('2 - المصروفات (Expenses) - طبيعة مدين');
  console.log('3 - الالتزامات (Liabilities) - طبيعة دائن');
  console.log('4 - حقوق الملكية (Equity) - طبيعة دائن');
  console.log('5 - الإيرادات (Revenue) - طبيعة دائن');
  
  console.log('\n✅ تم الانتهاء من التحقق');
  process.exit(0);
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
}
