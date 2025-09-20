import models, { sequelize } from './server/src/models/index.js';

const { Account } = models;

async function checkCurrentAccounts() {
  try {
    console.log('🔄 التحقق من الحسابات الحالية...');
    
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // الحصول على الحسابات الرئيسية (المستوى الأول)
    const mainAccounts = await Account.findAll({
      where: { level: 1 },
      order: [['code', 'ASC']]
    });
    
    console.log('\n📊 الحسابات الرئيسية الحالية:');
    console.log('=====================================');
    
    if (mainAccounts.length === 0) {
      console.log('❌ لا توجد حسابات رئيسية في قاعدة البيانات');
      return;
    }
    
    for (const account of mainAccounts) {
      console.log(`${account.code} - ${account.name} (${account.type}) - طبيعة: ${account.nature || 'غير محدد'}`);
    }
    
    // إحصائيات إضافية
    const totalAccounts = await Account.count();
    const accountsByType = await Account.findAll({
      attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['type']
    });
    
    console.log('\n📈 إحصائيات الحسابات:');
    console.log('======================');
    console.log(`إجمالي الحسابات: ${totalAccounts}`);
    console.log(`الحسابات الرئيسية: ${mainAccounts.length}`);
    
    console.log('\nتوزيع الحسابات حسب النوع:');
    for (const stat of accountsByType) {
      console.log(`- ${stat.type}: ${stat.dataValues.count} حساب`);
    }
    
    // التحقق من طبيعة الأرصدة
    console.log('\n🔍 التحقق من طبيعة الأرصدة:');
    console.log('===============================');
    
    const accountsWithNature = await Account.findAll({
      where: { level: 1 },
      attributes: ['code', 'name', 'type', 'nature'],
      order: [['code', 'ASC']]
    });
    
    const expectedNatures = {
      'asset': 'debit',
      'expense': 'debit',
      'liability': 'credit',
      'equity': 'credit',
      'revenue': 'credit'
    };
    
    let correctNatures = 0;
    let incorrectNatures = 0;
    
    for (const account of accountsWithNature) {
      const expectedNature = expectedNatures[account.type];
      const actualNature = account.nature;
      const isCorrect = expectedNature === actualNature;
      
      console.log(`${account.code} - ${account.name}:`);
      console.log(`  النوع: ${account.type}`);
      console.log(`  الطبيعة المتوقعة: ${expectedNature}`);
      console.log(`  الطبيعة الحالية: ${actualNature || 'غير محدد'}`);
      console.log(`  الحالة: ${isCorrect ? '✅ صحيح' : '❌ يحتاج تصحيح'}`);
      console.log('');
      
      if (isCorrect) {
        correctNatures++;
      } else {
        incorrectNatures++;
      }
    }
    
    console.log(`📊 ملخص طبيعة الأرصدة:`);
    console.log(`✅ صحيح: ${correctNatures}`);
    console.log(`❌ يحتاج تصحيح: ${incorrectNatures}`);
    
    // التحقق من التصنيف المطلوب
    console.log('\n🎯 التصنيف المطلوب:');
    console.log('===================');
    console.log('1 - الأصول (Assets) - طبيعة مدين');
    console.log('2 - المصروفات (Expenses) - طبيعة مدين');
    console.log('3 - الالتزامات (Liabilities) - طبيعة دائن');
    console.log('4 - حقوق الملكية (Equity) - طبيعة دائن');
    console.log('5 - الإيرادات (Revenue) - طبيعة دائن');
    
    console.log('\n✅ تم الانتهاء من التحقق');
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من الحسابات:', error);
    throw error;
  }
}

// تشغيل السكريبت
if (import.meta.url === `file://${process.argv[1]}`) {
  checkCurrentAccounts()
    .then(() => {
      console.log('✅ تم تشغيل السكريبت بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في تشغيل السكريبت:', error);
      process.exit(1);
    });
}

export default checkCurrentAccounts;
