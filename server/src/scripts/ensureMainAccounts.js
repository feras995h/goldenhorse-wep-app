import models, { sequelize } from '../models/index.js';
import { ensureDefaultMainAccounts, validateMainAccounts } from '../utils/ensureDefaultAccounts.js';

/**
 * سكريپت لضمان وجود الحسابات الرئيسية الافتراضية
 * يمكن تشغيله عند النشر أو كجزء من عملية الإعداد
 */

async function main() {
  try {
    console.log('🚀 بدء ضمان وجود الحسابات الرئيسية الافتراضية...');
    
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // ضمان وجود الحسابات الرئيسية
    console.log('\n📝 ضمان وجود الحسابات الرئيسية...');
    const accountsResult = await ensureDefaultMainAccounts(models);
    
    if (accountsResult.success) {
      console.log(`✅ نجح ضمان الحسابات الرئيسية:`);
      console.log(`   - إجمالي الحسابات: ${accountsResult.total}`);
      console.log(`   - حسابات جديدة: ${accountsResult.created}`);
      console.log(`   - حسابات موجودة: ${accountsResult.existing}`);
    } else {
      console.error(`❌ فشل في ضمان الحسابات الرئيسية: ${accountsResult.error}`);
      process.exit(1);
    }
    
    // التحقق من صحة الحسابات
    console.log('\n🔍 التحقق من صحة الحسابات الرئيسية...');
    const validationResult = await validateMainAccounts(models);
    
    if (validationResult.success) {
      console.log('✅ جميع الحسابات الرئيسية صحيحة');
    } else {
      console.log('❌ توجد مشاكل في الحسابات الرئيسية:');
      validationResult.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
      
      if (validationResult.issues.length > 0) {
        console.log('\n⚠️  يُنصح بمراجعة الحسابات وإصلاح المشاكل');
      }
    }
    
    // عرض الحسابات الرئيسية النهائية
    console.log('\n📋 الحسابات الرئيسية النهائية:');
    const { Account } = models;
    const mainAccounts = await Account.findAll({
      where: { level: 1 },
      order: [['code', 'ASC']]
    });
    
    console.log('=====================================');
    mainAccounts.forEach(account => {
      const natureText = account.nature === 'debit' ? 'مدين' : 'دائن';
      console.log(`${account.code} - ${account.name} (${account.type}) - طبيعة: ${natureText}`);
    });
    console.log('=====================================');
    
    console.log('\n🎯 التصنيف المطبق:');
    console.log('1 - الأصول (Assets) - طبيعة مدين');
    console.log('2 - المصروفات (Expenses) - طبيعة مدين');
    console.log('3 - الالتزامات (Liabilities) - طبيعة دائن');
    console.log('4 - حقوق الملكية (Equity) - طبيعة دائن');
    console.log('5 - الإيرادات (Revenue) - طبيعة دائن');
    
    console.log('\n✅ تم الانتهاء من ضمان الحسابات الرئيسية بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في ضمان الحسابات الرئيسية:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // إغلاق الاتصال بقاعدة البيانات
    try {
      await sequelize.close();
      console.log('🔒 تم إغلاق الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('⚠️  خطأ في إغلاق الاتصال:', error.message);
    }
  }
}

// تشغيل السكريپت إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('✅ تم تشغيل السكريپت بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في تشغيل السكريپت:', error);
      process.exit(1);
    });
}

export default main;
