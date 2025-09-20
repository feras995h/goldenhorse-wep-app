import models, { sequelize } from './src/models/index.js';
import { Op } from 'sequelize';

const { Account, GLEntry, JournalEntry } = models;

/**
 * سكريپت لإصلاح وتحسين منطق الملخص المالي
 * يقوم بحساب الأرصدة الحقيقية وإنشاء ملخص مالي دقيق
 */

async function fixFinancialSummary() {
  try {
    console.log('🔧 بدء إصلاح منطق الملخص المالي...\n');

    // 1. التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح');

    // 2. فحص الحسابات الموجودة
    const totalAccounts = await Account.count();
    console.log(`📊 إجمالي الحسابات: ${totalAccounts}`);

    if (totalAccounts === 0) {
      console.log('⚠️  لا توجد حسابات في النظام');
      return;
    }

    // 3. حساب الملخص المالي الحقيقي
    console.log('\n💰 حساب الملخص المالي الحقيقي...');

    // حساب إجمالي الأصول
    const assetAccounts = await Account.findAll({
      where: { type: 'asset', isActive: true }
    });
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    console.log(`  📈 إجمالي الأصول: ${totalAssets.toLocaleString()} LYD`);

    // حساب إجمالي الالتزامات
    const liabilityAccounts = await Account.findAll({
      where: { type: 'liability', isActive: true }
    });
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    console.log(`  📉 إجمالي الالتزامات: ${totalLiabilities.toLocaleString()} LYD`);

    // حساب إجمالي حقوق الملكية
    const equityAccounts = await Account.findAll({
      where: { type: 'equity', isActive: true }
    });
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    console.log(`  💎 إجمالي حقوق الملكية: ${totalEquity.toLocaleString()} LYD`);

    // حساب الإيرادات
    const revenueAccounts = await Account.findAll({
      where: { type: 'revenue', isActive: true }
    });
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    console.log(`  💚 إجمالي الإيرادات: ${totalRevenue.toLocaleString()} LYD`);

    // حساب المصروفات
    const expenseAccounts = await Account.findAll({
      where: { type: 'expense', isActive: true }
    });
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    console.log(`  💸 إجمالي المصروفات: ${totalExpenses.toLocaleString()} LYD`);

    // حساب صافي الربح
    const netProfit = totalRevenue - totalExpenses;
    console.log(`  🎯 صافي الربح: ${netProfit.toLocaleString()} LYD`);

    // حساب رصيد النقدية
    const cashAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%نقد%' } },
          { name: { [Op.like]: '%صندوق%' } },
          { name: { [Op.like]: '%cash%' } }
        ],
        isActive: true
      }
    });
    const cashBalance = cashAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    console.log(`  💵 رصيد النقدية: ${cashBalance.toLocaleString()} LYD (من ${cashAccounts.length} حساب)`);

    // حساب أرصدة البنوك
    const bankAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%بنك%' } },
          { name: { [Op.like]: '%مصرف%' } },
          { name: { [Op.like]: '%bank%' } }
        ],
        isActive: true
      }
    });
    const bankBalance = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    console.log(`  🏦 أرصدة البنوك: ${bankBalance.toLocaleString()} LYD (من ${bankAccounts.length} حساب)`);

    // حساب ذمم العملاء
    const receivableAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%عميل%' } },
          { name: { [Op.like]: '%مدين%' } },
          { name: { [Op.like]: '%receivable%' } }
        ],
        isActive: true
      }
    });
    const accountsReceivable = receivableAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    console.log(`  👥 ذمم العملاء: ${accountsReceivable.toLocaleString()} LYD (من ${receivableAccounts.length} حساب)`);

    // حساب ذمم الموردين
    const payableAccounts = await Account.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%مورد%' } },
          { name: { [Op.like]: '%دائن%' } },
          { name: { [Op.like]: '%payable%' } }
        ],
        isActive: true
      }
    });
    const accountsPayable = payableAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    console.log(`  🏪 ذمم الموردين: ${accountsPayable.toLocaleString()} LYD (من ${payableAccounts.length} حساب)`);

    // 4. التحقق من معادلة المحاسبة الأساسية
    console.log('\n⚖️  التحقق من معادلة المحاسبة الأساسية...');
    const leftSide = totalAssets;
    const rightSide = totalLiabilities + totalEquity;
    const difference = Math.abs(leftSide - rightSide);
    
    console.log(`  الأصول: ${leftSide.toLocaleString()} LYD`);
    console.log(`  الالتزامات + حقوق الملكية: ${rightSide.toLocaleString()} LYD`);
    console.log(`  الفرق: ${difference.toLocaleString()} LYD`);
    
    if (difference < 0.01) {
      console.log('  ✅ معادلة المحاسبة متوازنة');
    } else {
      console.log('  ⚠️  معادلة المحاسبة غير متوازنة - يحتاج مراجعة');
    }

    // 5. إنشاء الملخص المالي النهائي
    const summary = {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netProfit,
      cashBalance,
      bankBalance,
      accountsReceivable,
      accountsPayable,
      totalSales: totalRevenue,
      totalPurchases: totalExpenses,
      netIncome: netProfit,
      cashFlow: cashBalance + bankBalance,
      currency: 'LYD',
      asOfDate: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      accountingEquationBalanced: difference < 0.01
    };

    // 6. عرض الملخص النهائي
    console.log('\n📋 الملخص المالي النهائي:');
    console.log('=====================================');
    Object.entries(summary).forEach(([key, value]) => {
      if (typeof value === 'number') {
        console.log(`  ${key}: ${value.toLocaleString()} LYD`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });

    // 7. فحص القيود المحاسبية
    console.log('\n📝 فحص القيود المحاسبية...');
    const totalJournalEntries = await JournalEntry.count();
    const postedEntries = await JournalEntry.count({ where: { status: 'posted' } });
    const totalGLEntries = await GLEntry.count();
    
    console.log(`  إجمالي القيود: ${totalJournalEntries}`);
    console.log(`  القيود المعتمدة: ${postedEntries}`);
    console.log(`  إجمالي قيود الأستاذ العام: ${totalGLEntries}`);

    // 8. اقتراحات للتحسين
    console.log('\n💡 اقتراحات للتحسين:');
    
    if (totalAssets === 0) {
      console.log('  ⚠️  لا توجد أصول مسجلة - يُنصح بإدخال الأصول الافتتاحية');
    }
    
    if (totalRevenue === 0 && totalExpenses === 0) {
      console.log('  ⚠️  لا توجد إيرادات أو مصروفات - يُنصح بإدخال القيود التشغيلية');
    }
    
    if (difference > 0.01) {
      console.log('  ⚠️  معادلة المحاسبة غير متوازنة - يُنصح بمراجعة القيود');
    }
    
    if (cashBalance < 0) {
      console.log('  ⚠️  رصيد النقدية سالب - يُنصح بمراجعة حسابات النقدية');
    }

    console.log('\n🎉 تم إكمال فحص وإصلاح الملخص المالي بنجاح!');
    
    return summary;

  } catch (error) {
    console.error('❌ خطأ في إصلاح الملخص المالي:', error);
    console.error('تفاصيل الخطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

// تشغيل السكريپت
fixFinancialSummary().catch(console.error);
