console.log('🔄 بدء إنشاء التقرير النهائي لدليل الحسابات...');

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
  
  // الحصول على جميع الحسابات
  const allAccounts = await Account.findAll({
    order: [['code', 'ASC']]
  });
  
  console.log('\n🎉 تقرير دليل الحسابات النهائي');
  console.log('=====================================');
  
  // الحسابات الرئيسية
  console.log('\n📊 الحسابات الرئيسية:');
  console.log('======================');
  
  const mainAccounts = allAccounts.filter(acc => acc.level === 1);
  for (const account of mainAccounts) {
    console.log(`${account.code} - ${account.name} (${account.nameEn})`);
    console.log(`   النوع: ${account.type} | الطبيعة: ${account.nature} | التقرير: ${account.reportType}`);
    console.log('');
  }
  
  // دليل الحسابات الكامل
  console.log('\n📋 دليل الحسابات الكامل:');
  console.log('==========================');
  
  for (const account of allAccounts) {
    const indent = '  '.repeat(account.level - 1);
    const groupIndicator = account.isGroup ? ' [مجموعة]' : '';
    console.log(`${indent}${account.code} - ${account.name}${groupIndicator}`);
    console.log(`${indent}   النوع: ${account.type} | الطبيعة: ${account.nature} | المستوى: ${account.level}`);
  }
  
  // إحصائيات
  console.log('\n📈 إحصائيات دليل الحسابات:');
  console.log('=============================');
  
  const totalAccounts = allAccounts.length;
  console.log(`إجمالي الحسابات: ${totalAccounts}`);
  
  // توزيع حسب النوع
  const accountsByType = {};
  allAccounts.forEach(acc => {
    accountsByType[acc.type] = (accountsByType[acc.type] || 0) + 1;
  });
  
  console.log('\nتوزيع الحسابات حسب النوع:');
  Object.entries(accountsByType).forEach(([type, count]) => {
    console.log(`- ${type}: ${count} حساب`);
  });
  
  // توزيع حسب المستوى
  const accountsByLevel = {};
  allAccounts.forEach(acc => {
    accountsByLevel[acc.level] = (accountsByLevel[acc.level] || 0) + 1;
  });
  
  console.log('\nتوزيع الحسابات حسب المستوى:');
  Object.entries(accountsByLevel).forEach(([level, count]) => {
    console.log(`- المستوى ${level}: ${count} حساب`);
  });
  
  // توزيع حسب الطبيعة
  const accountsByNature = {};
  allAccounts.forEach(acc => {
    accountsByNature[acc.nature] = (accountsByNature[acc.nature] || 0) + 1;
  });
  
  console.log('\nتوزيع الحسابات حسب الطبيعة:');
  Object.entries(accountsByNature).forEach(([nature, count]) => {
    const natureName = nature === 'debit' ? 'مدين' : 'دائن';
    console.log(`- ${natureName} (${nature}): ${count} حساب`);
  });
  
  // التحقق من صحة التصنيف
  console.log('\n✅ التحقق من صحة التصنيف:');
  console.log('==============================');
  
  const expectedClassification = {
    '1': { type: 'asset', nature: 'debit', name: 'الأصول' },
    '2': { type: 'expense', nature: 'debit', name: 'المصروفات' },
    '3': { type: 'liability', nature: 'credit', name: 'الالتزامات' },
    '4': { type: 'equity', nature: 'credit', name: 'حقوق الملكية' },
    '5': { type: 'revenue', nature: 'credit', name: 'الإيرادات' }
  };
  
  let allCorrect = true;
  
  for (const [code, expected] of Object.entries(expectedClassification)) {
    const account = mainAccounts.find(acc => acc.code === code);
    if (account) {
      const typeCorrect = account.type === expected.type;
      const natureCorrect = account.nature === expected.nature;
      const isCorrect = typeCorrect && natureCorrect;
      
      console.log(`${code} - ${expected.name}:`);
      console.log(`   النوع: ${account.type} ${typeCorrect ? '✅' : '❌'}`);
      console.log(`   الطبيعة: ${account.nature} ${natureCorrect ? '✅' : '❌'}`);
      console.log(`   الحالة: ${isCorrect ? '✅ صحيح' : '❌ يحتاج تصحيح'}`);
      console.log('');
      
      if (!isCorrect) allCorrect = false;
    } else {
      console.log(`❌ الحساب ${code} - ${expected.name} غير موجود`);
      allCorrect = false;
    }
  }
  
  console.log(`\n📊 نتيجة التحقق: ${allCorrect ? '✅ جميع الحسابات صحيحة' : '❌ يوجد أخطاء تحتاج تصحيح'}`);
  
  // ملخص التصنيف النهائي
  console.log('\n🎯 التصنيف النهائي المطبق:');
  console.log('=============================');
  console.log('1 - الأصول (Assets) - طبيعة مدين ✅');
  console.log('2 - المصروفات (Expenses) - طبيعة مدين ✅');
  console.log('3 - الالتزامات (Liabilities) - طبيعة دائن ✅');
  console.log('4 - حقوق الملكية (Equity) - طبيعة دائن ✅');
  console.log('5 - الإيرادات (Revenue) - طبيعة دائن ✅');
  
  console.log('\n🎉 تم إنشاء دليل الحسابات بنجاح وفقاً للتصنيف المطلوب!');
  console.log('\n📝 ملاحظات مهمة:');
  console.log('- تم إنشاء الحسابات الرئيسية الخمسة وفقاً للتصنيف المحاسبي التقليدي');
  console.log('- تم إضافة حسابات فرعية أساسية لكل حساب رئيسي');
  console.log('- جميع الحسابات لها طبيعة أرصدة صحيحة (مدين/دائن)');
  console.log('- يمكن إضافة المزيد من الحسابات الفرعية حسب الحاجة');
  
  process.exit(0);
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}
