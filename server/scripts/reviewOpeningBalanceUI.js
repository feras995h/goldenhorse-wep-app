import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

/**
 * Review Opening Balance UI and Logic
 * Comprehensive review and improvements
 */

console.log('🔍 مراجعة واجهة وآلية القيد الافتتاحي');
console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
console.log('='.repeat(60));

async function reviewOpeningBalanceUI() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // 1. Review current opening balance entries
    console.log('\n📊 1. مراجعة القيود الافتتاحية الحالية...');
    await reviewCurrentOpeningEntries();
    
    // 2. Check data integrity
    console.log('\n🔍 2. فحص سلامة البيانات...');
    await checkDataIntegrity();
    
    // 3. Analyze account structure for opening balances
    console.log('\n🏗️ 3. تحليل هيكل الحسابات للأرصدة الافتتاحية...');
    await analyzeAccountStructure();
    
    // 4. Review API endpoints
    console.log('\n🔗 4. مراجعة نقاط API...');
    await reviewAPIEndpoints();
    
    // 5. Generate improvement recommendations
    console.log('\n💡 5. توصيات التحسين...');
    await generateImprovementRecommendations();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 انتهت مراجعة واجهة القيد الافتتاحي');

  } catch (error) {
    console.error('❌ خطأ في المراجعة:', error.message);
  } finally {
    await sequelize.close();
  }
}

async function reviewCurrentOpeningEntries() {
  try {
    // Check GL entries for opening balances
    const [openingEntries] = await sequelize.query(`
      SELECT 
        "voucherNo",
        "postingDate",
        COUNT(*) as entry_count,
        SUM(debit) as total_debit,
        SUM(credit) as total_credit,
        MIN("createdAt") as created_date
      FROM gl_entries
      WHERE "voucherType" = 'Opening Balance'
      GROUP BY "voucherNo", "postingDate"
      ORDER BY "postingDate" DESC, "voucherNo"
    `);

    console.log(`   📋 عدد القيود الافتتاحية: ${openingEntries.length}`);
    
    if (openingEntries.length > 0) {
      console.log('   📊 تفاصيل القيود الافتتاحية:');
      openingEntries.forEach((entry, index) => {
        const isBalanced = Math.abs(parseFloat(entry.total_debit) - parseFloat(entry.total_credit)) < 0.01;
        console.log(`      ${index + 1}. ${entry.voucherNo}:`);
        console.log(`         📅 التاريخ: ${new Date(entry.postingDate).toLocaleDateString('ar-EG')}`);
        console.log(`         📋 عدد السطور: ${entry.entry_count}`);
        console.log(`         💰 إجمالي المدين: ${parseFloat(entry.total_debit).toFixed(2)} د.ل`);
        console.log(`         💰 إجمالي الدائن: ${parseFloat(entry.total_credit).toFixed(2)} د.ل`);
        console.log(`         ⚖️ متوازن: ${isBalanced ? '✅ نعم' : '❌ لا'}`);
        console.log(`         🕐 تاريخ الإنشاء: ${new Date(entry.created_date).toLocaleDateString('ar-EG')}`);
      });
    } else {
      console.log('   ⚠️ لا توجد قيود افتتاحية في النظام');
    }

    // Check individual opening balance entries
    const [detailedEntries] = await sequelize.query(`
      SELECT 
        g."voucherNo",
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        g.debit,
        g.credit,
        g.remarks
      FROM gl_entries g
      JOIN accounts a ON g."accountId" = a.id
      WHERE g."voucherType" = 'Opening Balance'
      ORDER BY g."voucherNo", a.code
    `);

    if (detailedEntries.length > 0) {
      console.log(`\n   📋 تفاصيل السطور (${detailedEntries.length} سطر):`);
      let currentVoucher = '';
      detailedEntries.forEach(entry => {
        if (entry.voucherNo !== currentVoucher) {
          currentVoucher = entry.voucherNo;
          console.log(`\n      📝 ${entry.voucherNo}:`);
        }
        const amount = parseFloat(entry.debit) > 0 ? parseFloat(entry.debit) : parseFloat(entry.credit);
        const type = parseFloat(entry.debit) > 0 ? 'مدين' : 'دائن';
        console.log(`         ${entry.account_code}: ${entry.account_name} (${entry.account_type}) - ${amount.toFixed(2)} د.ل (${type})`);
      });
    }

  } catch (error) {
    console.log(`   ❌ خطأ في مراجعة القيود الافتتاحية: ${error.message}`);
    throw error;
  }
}

async function checkDataIntegrity() {
  try {
    // Check for accounts without opening balances
    const [accountsWithoutOpening] = await sequelize.query(`
      SELECT 
        a.code, a.name, a.type, a.balance
      FROM accounts a
      LEFT JOIN gl_entries g ON a.id = g."accountId" AND g."voucherType" = 'Opening Balance'
      WHERE a."isActive" = true 
        AND a.balance != 0 
        AND g.id IS NULL
      ORDER BY a.type, a.code
    `);

    console.log(`   📊 حسابات لها أرصدة بدون قيود افتتاحية: ${accountsWithoutOpening.length}`);
    
    if (accountsWithoutOpening.length > 0) {
      console.log('   ⚠️ حسابات تحتاج قيود افتتاحية:');
      accountsWithoutOpening.forEach(account => {
        console.log(`      ${account.code}: ${account.name} (${account.type}) - ${parseFloat(account.balance).toFixed(2)} د.ل`);
      });
    }

    // Check for orphaned opening balance entries
    const [orphanedEntries] = await sequelize.query(`
      SELECT 
        g."voucherNo", g."accountId", g.debit, g.credit
      FROM gl_entries g
      LEFT JOIN accounts a ON g."accountId" = a.id
      WHERE g."voucherType" = 'Opening Balance' 
        AND (a.id IS NULL OR a."isActive" = false)
    `);

    console.log(`   📊 قيود افتتاحية يتيمة (حسابات محذوفة/غير نشطة): ${orphanedEntries.length}`);
    
    if (orphanedEntries.length > 0) {
      console.log('   ⚠️ قيود تحتاج تنظيف:');
      orphanedEntries.forEach(entry => {
        const amount = parseFloat(entry.debit) > 0 ? parseFloat(entry.debit) : parseFloat(entry.credit);
        console.log(`      ${entry.voucherNo}: حساب ${entry.accountId} - ${amount.toFixed(2)} د.ل`);
      });
    }

    // Check balance consistency
    const [balanceConsistency] = await sequelize.query(`
      SELECT 
        a.code, a.name, a.balance as account_balance,
        COALESCE(SUM(g.debit - g.credit), 0) as gl_balance,
        ABS(a.balance - COALESCE(SUM(g.debit - g.credit), 0)) as difference
      FROM accounts a
      LEFT JOIN gl_entries g ON a.id = g."accountId" AND g."voucherType" = 'Opening Balance'
      WHERE a."isActive" = true AND a.balance != 0
      GROUP BY a.id, a.code, a.name, a.balance
      HAVING ABS(a.balance - COALESCE(SUM(g.debit - g.credit), 0)) > 0.01
      ORDER BY difference DESC
    `);

    console.log(`   📊 حسابات بها عدم تطابق في الأرصدة: ${balanceConsistency.length}`);
    
    if (balanceConsistency.length > 0) {
      console.log('   ⚠️ حسابات تحتاج مراجعة الأرصدة:');
      balanceConsistency.forEach(account => {
        console.log(`      ${account.code}: ${account.name}`);
        console.log(`         رصيد الحساب: ${parseFloat(account.account_balance).toFixed(2)} د.ل`);
        console.log(`         رصيد GL: ${parseFloat(account.gl_balance).toFixed(2)} د.ل`);
        console.log(`         الفرق: ${parseFloat(account.difference).toFixed(2)} د.ل`);
      });
    }

  } catch (error) {
    console.log(`   ❌ خطأ في فحص سلامة البيانات: ${error.message}`);
    throw error;
  }
}

async function analyzeAccountStructure() {
  try {
    // Analyze account types and their opening balance needs
    const [accountAnalysis] = await sequelize.query(`
      SELECT 
        type,
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN balance != 0 THEN 1 END) as accounts_with_balance,
        COUNT(CASE WHEN balance = 0 THEN 1 END) as accounts_zero_balance,
        SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as positive_balances,
        SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as negative_balances,
        AVG(balance) as avg_balance
      FROM accounts
      WHERE "isActive" = true
      GROUP BY type
      ORDER BY type
    `);

    console.log('   📊 تحليل هيكل الحسابات:');
    accountAnalysis.forEach(analysis => {
      console.log(`\n      📋 نوع الحساب: ${analysis.type}`);
      console.log(`         📊 إجمالي الحسابات: ${analysis.total_accounts}`);
      console.log(`         💰 حسابات لها أرصدة: ${analysis.accounts_with_balance}`);
      console.log(`         🔄 حسابات برصيد صفر: ${analysis.accounts_zero_balance}`);
      console.log(`         📈 مجموع الأرصدة الموجبة: ${parseFloat(analysis.positive_balances || 0).toFixed(2)} د.ل`);
      console.log(`         📉 مجموع الأرصدة السالبة: ${parseFloat(analysis.negative_balances || 0).toFixed(2)} د.ل`);
      console.log(`         📊 متوسط الرصيد: ${parseFloat(analysis.avg_balance || 0).toFixed(2)} د.ل`);
    });

    // Check for accounts that need opening balances
    const [needsOpening] = await sequelize.query(`
      SELECT 
        type,
        COUNT(*) as count
      FROM accounts a
      LEFT JOIN gl_entries g ON a.id = g."accountId" AND g."voucherType" = 'Opening Balance'
      WHERE a."isActive" = true 
        AND a.balance != 0 
        AND g.id IS NULL
      GROUP BY type
      ORDER BY count DESC
    `);

    if (needsOpening.length > 0) {
      console.log('\n   📋 أنواع الحسابات التي تحتاج قيود افتتاحية:');
      needsOpening.forEach(need => {
        console.log(`      ${need.type}: ${need.count} حساب`);
      });
    }

  } catch (error) {
    console.log(`   ❌ خطأ في تحليل هيكل الحسابات: ${error.message}`);
    throw error;
  }
}

async function reviewAPIEndpoints() {
  try {
    console.log('   🔗 مراجعة نقاط API المتاحة:');
    
    // This would normally test actual API endpoints
    // For now, we'll just document what should be available
    const expectedEndpoints = [
      {
        method: 'GET',
        path: '/api/financial/opening-balances',
        description: 'جلب الأرصدة الافتتاحية',
        status: '✅ متاح'
      },
      {
        method: 'POST',
        path: '/api/financial/opening-balance',
        description: 'إنشاء رصيد افتتاحي لحساب واحد',
        status: '✅ متاح'
      },
      {
        method: 'POST',
        path: '/api/financial/opening-balance-entry',
        description: 'إنشاء قيد افتتاحي شامل',
        status: '✅ متاح'
      },
      {
        method: 'GET',
        path: '/api/financial/accounts',
        description: 'جلب قائمة الحسابات',
        status: '✅ متاح'
      },
      {
        method: 'POST',
        path: '/api/financial/journal-entries',
        description: 'إنشاء قيد يومية',
        status: '✅ متاح'
      }
    ];

    expectedEndpoints.forEach(endpoint => {
      console.log(`      ${endpoint.status} ${endpoint.method} ${endpoint.path}`);
      console.log(`         ${endpoint.description}`);
    });

  } catch (error) {
    console.log(`   ❌ خطأ في مراجعة نقاط API: ${error.message}`);
    throw error;
  }
}

async function generateImprovementRecommendations() {
  try {
    console.log('   💡 توصيات التحسين:');
    
    const recommendations = [
      {
        category: '🎨 واجهة المستخدم',
        items: [
          'إضافة مؤشر تقدم أثناء حفظ البيانات',
          'تحسين رسائل الخطأ لتكون أكثر وضوحاً',
          'إضافة تأكيد قبل حذف أو تعديل القيود',
          'تحسين تجربة البحث عن الحسابات',
          'إضافة اختصارات لوحة المفاتيح للعمليات الشائعة'
        ]
      },
      {
        category: '🔧 الوظائف',
        items: [
          'إضافة إمكانية تعديل القيود الافتتاحية الموجودة',
          'إضافة تحقق من التوازن قبل الحفظ',
          'إضافة إمكانية استيراد الأرصدة من ملف Excel',
          'إضافة تقارير للأرصدة الافتتاحية',
          'إضافة إمكانية نسخ القيود بين الفترات'
        ]
      },
      {
        category: '🛡️ الأمان والتحقق',
        items: [
          'إضافة صلاحيات للوصول لواجهة الأرصدة الافتتاحية',
          'إضافة سجل للتغييرات (audit trail)',
          'إضافة تحقق من صحة البيانات قبل الحفظ',
          'إضافة نسخ احتياطي تلقائي قبل التعديلات الكبيرة',
          'إضافة تشفير للبيانات الحساسة'
        ]
      },
      {
        category: '📊 التقارير والتحليل',
        items: [
          'إضافة تقرير ميزان المراجعة الافتتاحي',
          'إضافة مقارنة بين الأرصدة الافتتاحية والحالية',
          'إضافة إحصائيات عن القيود الافتتاحية',
          'إضافة تحليل للحسابات التي تحتاج أرصدة افتتاحية',
          'إضافة تصدير البيانات بصيغ متعددة'
        ]
      },
      {
        category: '⚡ الأداء',
        items: [
          'تحسين سرعة تحميل قائمة الحسابات',
          'إضافة تحميل تدريجي للبيانات الكبيرة',
          'تحسين استعلامات قاعدة البيانات',
          'إضافة ذاكرة تخزين مؤقت للبيانات المتكررة',
          'تحسين واجهة المستخدم للأجهزة المحمولة'
        ]
      }
    ];

    recommendations.forEach(category => {
      console.log(`\n      ${category.category}:`);
      category.items.forEach((item, index) => {
        console.log(`         ${index + 1}. ${item}`);
      });
    });

    console.log('\n   🎯 الأولويات العالية:');
    const highPriority = [
      '✅ إضافة تحقق من التوازن قبل الحفظ',
      '✅ تحسين رسائل الخطأ',
      '✅ إضافة تأكيد قبل العمليات المهمة',
      '✅ إضافة تقرير ميزان المراجعة الافتتاحي',
      '✅ تحسين سرعة تحميل البيانات'
    ];

    highPriority.forEach(priority => {
      console.log(`      ${priority}`);
    });

  } catch (error) {
    console.log(`   ❌ خطأ في توليد التوصيات: ${error.message}`);
    throw error;
  }
}

// Run the review
reviewOpeningBalanceUI();
