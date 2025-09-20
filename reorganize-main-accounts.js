import models, { sequelize } from './server/src/models/index.js';

const { Account } = models;

/**
 * سكريبت إعادة تنظيم الحسابات الرئيسية في دليل الحسابات
 * 
 * التصنيف الجديد:
 * 1 - الأصول (Assets) - طبيعة مدين
 * 2 - المصروفات (Expenses) - طبيعة مدين  
 * 3 - الالتزامات (Liabilities) - طبيعة دائن
 * 4 - حقوق الملكية (Equity) - طبيعة دائن
 * 5 - الإيرادات (Revenue) - طبيعة دائن
 */

// خريطة إعادة التنظيم
const reorganizationMap = {
  // الأصول تبقى كما هي
  '1': { newCode: '1', type: 'asset', nature: 'debit', name: 'الأصول', nameEn: 'Assets' },
  
  // المصروفات من 5 إلى 2
  '5': { newCode: '2', type: 'expense', nature: 'debit', name: 'المصروفات', nameEn: 'Expenses' },
  
  // الالتزامات من 2 إلى 3
  '2': { newCode: '3', type: 'liability', nature: 'credit', name: 'الالتزامات', nameEn: 'Liabilities' },
  
  // حقوق الملكية من 3 إلى 4
  '3': { newCode: '4', type: 'equity', nature: 'credit', name: 'حقوق الملكية', nameEn: 'Equity' },
  
  // الإيرادات من 4 إلى 5
  '4': { newCode: '5', type: 'revenue', nature: 'credit', name: 'الإيرادات', nameEn: 'Revenue' }
};

async function reorganizeMainAccounts() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 بدء إعادة تنظيم الحسابات الرئيسية...');
    
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // الحصول على جميع الحسابات
    const allAccounts = await Account.findAll({
      order: [['code', 'ASC']],
      transaction
    });
    
    console.log(`📊 إجمالي الحسابات: ${allAccounts.length}`);
    
    // إنشاء حسابات مؤقتة بأكواد جديدة لتجنب تضارب المفاتيح الفريدة
    const tempAccounts = [];
    
    // المرحلة 1: إنشاء حسابات مؤقتة بأكواد جديدة
    console.log('\n📝 المرحلة 1: إنشاء حسابات مؤقتة...');
    
    for (const account of allAccounts) {
      const oldCode = account.code;
      const rootCode = oldCode.split('.')[0]; // الحصول على الرقم الأساسي
      
      if (reorganizationMap[rootCode]) {
        const mapping = reorganizationMap[rootCode];
        const newCode = oldCode.replace(new RegExp(`^${rootCode}`), mapping.newCode);
        const tempCode = `TEMP_${newCode}`;
        
        // إنشاء حساب مؤقت
        const tempAccount = await Account.create({
          id: `temp_${account.id}`,
          code: tempCode,
          name: account.name,
          nameEn: account.nameEn,
          type: mapping.type,
          rootType: mapping.type === 'asset' ? 'Asset' : 
                   mapping.type === 'liability' ? 'Liability' :
                   mapping.type === 'equity' ? 'Equity' :
                   mapping.type === 'revenue' ? 'Income' : 'Expense',
          reportType: ['asset', 'liability', 'equity'].includes(mapping.type) ? 'Balance Sheet' : 'Profit and Loss',
          accountCategory: account.accountCategory,
          parentId: account.parentId ? `temp_${account.parentId}` : null,
          level: account.level,
          isGroup: account.isGroup,
          isActive: account.isActive,
          freezeAccount: account.freezeAccount,
          balance: account.balance,
          currency: account.currency,
          description: account.description,
          accountType: account.accountType,
          nature: mapping.nature,
          notes: account.notes,
          isSystemAccount: account.isSystemAccount,
          isMonitored: account.isMonitored
        }, { transaction });
        
        tempAccounts.push({
          original: account,
          temp: tempAccount,
          newCode: newCode,
          mapping: mapping
        });
        
        console.log(`✅ إنشاء مؤقت: ${oldCode} → ${tempCode}`);
      }
    }
    
    // المرحلة 2: حذف الحسابات القديمة
    console.log('\n🗑️ المرحلة 2: حذف الحسابات القديمة...');
    
    for (const tempAccount of tempAccounts) {
      await tempAccount.original.destroy({ transaction });
      console.log(`🗑️ حذف: ${tempAccount.original.code}`);
    }
    
    // المرحلة 3: إنشاء الحسابات الجديدة بالأكواد النهائية
    console.log('\n✨ المرحلة 3: إنشاء الحسابات الجديدة...');
    
    // ترتيب الحسابات المؤقتة حسب المستوى (الآباء أولاً)
    tempAccounts.sort((a, b) => a.temp.level - b.temp.level);
    
    const idMapping = {}; // خريطة لربط المعرفات القديمة بالجديدة
    
    for (const tempAccount of tempAccounts) {
      const temp = tempAccount.temp;
      const newCode = tempAccount.newCode;
      
      // تحديد المعرف الأب الجديد
      let newParentId = null;
      if (temp.parentId && temp.parentId.startsWith('temp_')) {
        const originalParentId = temp.parentId.replace('temp_', '');
        newParentId = idMapping[originalParentId] || null;
      }
      
      // إنشاء الحساب الجديد
      const newAccount = await Account.create({
        id: tempAccount.original.id, // استخدام نفس المعرف الأصلي
        code: newCode,
        name: temp.name,
        nameEn: temp.nameEn,
        type: temp.type,
        rootType: temp.rootType,
        reportType: temp.reportType,
        accountCategory: temp.accountCategory,
        parentId: newParentId,
        level: temp.level,
        isGroup: temp.isGroup,
        isActive: temp.isActive,
        freezeAccount: temp.freezeAccount,
        balance: temp.balance,
        currency: temp.currency,
        description: temp.description,
        accountType: temp.accountType,
        nature: temp.nature,
        notes: temp.notes,
        isSystemAccount: temp.isSystemAccount,
        isMonitored: temp.isMonitored
      }, { transaction });
      
      // حفظ ربط المعرفات
      idMapping[tempAccount.original.id] = newAccount.id;
      
      console.log(`✅ إنشاء جديد: ${newCode} - ${temp.name}`);
    }
    
    // المرحلة 4: حذف الحسابات المؤقتة
    console.log('\n🧹 المرحلة 4: تنظيف الحسابات المؤقتة...');
    
    for (const tempAccount of tempAccounts) {
      await tempAccount.temp.destroy({ transaction });
      console.log(`🧹 تنظيف: ${tempAccount.temp.code}`);
    }
    
    // تأكيد التغييرات
    await transaction.commit();
    
    console.log('\n🎉 تم إعادة تنظيم الحسابات الرئيسية بنجاح!');
    
    // عرض ملخص النتائج
    console.log('\n📊 ملخص التنظيم الجديد:');
    const mainAccounts = await Account.findAll({
      where: { level: 1 },
      order: [['code', 'ASC']]
    });
    
    for (const account of mainAccounts) {
      console.log(`${account.code} - ${account.name} (${account.type}) - طبيعة: ${account.nature}`);
    }
    
    console.log('\n✅ تم الانتهاء من إعادة التنظيم بنجاح!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ خطأ في إعادة تنظيم الحسابات:', error);
    throw error;
  }
}

// تشغيل السكريبت
if (import.meta.url === `file://${process.argv[1]}`) {
  reorganizeMainAccounts()
    .then(() => {
      console.log('✅ تم تشغيل السكريبت بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في تشغيل السكريبت:', error);
      process.exit(1);
    });
}

export default reorganizeMainAccounts;
