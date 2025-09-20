import { v4 as uuidv4 } from 'uuid';

/**
 * دالة لضمان وجود الحسابات الرئيسية الافتراضية
 * يتم استدعاؤها عند بدء النظام لضمان وجود الحسابات الأساسية
 */

// الحسابات الرئيسية الافتراضية
const DEFAULT_MAIN_ACCOUNTS = [
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
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي للأصول - يشمل جميع الأصول المملوكة للشركة',
    accountType: 'main',
    isSystemAccount: true,
    isMonitored: false,
    freezeAccount: false,
    parentId: null
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
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي للمصروفات - يشمل جميع المصروفات التشغيلية والإدارية',
    accountType: 'main',
    isSystemAccount: true,
    isMonitored: false,
    freezeAccount: false,
    parentId: null
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
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي للالتزامات - يشمل جميع الديون والالتزامات المالية',
    accountType: 'main',
    isSystemAccount: true,
    isMonitored: false,
    freezeAccount: false,
    parentId: null
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
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي لحقوق الملكية - يشمل رأس المال والأرباح المحتجزة',
    accountType: 'main',
    isSystemAccount: true,
    isMonitored: false,
    freezeAccount: false,
    parentId: null
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
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي للإيرادات - يشمل جميع الإيرادات من المبيعات والخدمات',
    accountType: 'main',
    isSystemAccount: true,
    isMonitored: false,
    freezeAccount: false,
    parentId: null
  }
];

/**
 * دالة لضمان وجود الحسابات الرئيسية الافتراضية
 * @param {Object} models - نماذج قاعدة البيانات
 * @returns {Promise<Object>} نتيجة العملية
 */
export async function ensureDefaultMainAccounts(models) {
  try {
    const { Account } = models;

    console.log('🔍 التحقق من وجود الحسابات الرئيسية الافتراضية...');

    // التحقق من وجود الحسابات الرئيسية
    const existingMainAccounts = await Account.findAll({
      where: { level: 1 },
      order: [['code', 'ASC']]
    });

    const existingCodes = existingMainAccounts.map(acc => acc.code);
    console.log(`📊 الحسابات الرئيسية الموجودة: ${existingCodes.join(', ') || 'لا توجد'}`);

    // تحديد الحسابات المفقودة
    const missingAccounts = DEFAULT_MAIN_ACCOUNTS.filter(
      account => !existingCodes.includes(account.code)
    );

    if (missingAccounts.length === 0) {
      console.log('✅ جميع الحسابات الرئيسية موجودة بالفعل');
      return {
        success: true,
        message: 'جميع الحسابات الرئيسية موجودة',
        created: 0,
        existing: existingMainAccounts.length
      };
    }

    console.log(`📝 سيتم إنشاء ${missingAccounts.length} حساب رئيسي مفقود`);

    // إنشاء الحسابات المفقودة
    const createdAccounts = [];

    for (const accountData of missingAccounts) {
      try {
        const account = await Account.create({
          id: uuidv4(),
          ...accountData,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        createdAccounts.push(account);
        console.log(`  ✓ ${account.code} - ${account.name} (${account.type}) - طبيعة: ${account.nature}`);

      } catch (error) {
        console.error(`❌ خطأ في إنشاء الحساب ${accountData.code}:`, error.message);
      }
    }

    console.log(`✅ تم إنشاء ${createdAccounts.length} حساب رئيسي جديد`);

    // التحقق النهائي
    const finalMainAccounts = await Account.findAll({
      where: { level: 1 },
      order: [['code', 'ASC']]
    });

    console.log('\n📋 الحسابات الرئيسية النهائية:');
    finalMainAccounts.forEach(account => {
      console.log(`  ${account.code} - ${account.name} (${account.type}) - طبيعة: ${account.nature}`);
    });

    return {
      success: true,
      message: 'تم ضمان وجود الحسابات الرئيسية بنجاح',
      created: createdAccounts.length,
      existing: existingMainAccounts.length,
      total: finalMainAccounts.length
    };

  } catch (error) {
    console.error('❌ خطأ في ضمان وجود الحسابات الرئيسية:', error.message);
    return {
      success: false,
      error: error.message,
      created: 0,
      existing: 0
    };
  }
}

/**
 * Ensure essential operational sub-accounts exist (Cash, Bank, AR, Storage/Handling/Shipping Revenue)
 * This complements the main accounts and is idempotent.
 */
export async function ensureOperationalSubAccounts(models) {
  const { Account } = models;
  try {
    console.log('🔧 التحقق من الحسابات التشغيلية الافتراضية (صندوق/مصرف/ذمم/إيرادات خدمات)...');

    // Fetch main parents
    const assetsMain = await Account.findOne({ where: { code: '1' } });
    const expensesMain = await Account.findOne({ where: { code: '2' } });
    const liabilitiesMain = await Account.findOne({ where: { code: '3' } });
    const revenueMain = await Account.findOne({ where: { code: '5' } });

    if (!assetsMain || !revenueMain || !expensesMain || !liabilitiesMain) {
      console.warn('⚠️ لا يمكن إنشاء الحسابات التشغيلية لأن الحسابات الرئيسية غير مكتملة');
      return { success: false, message: 'Main accounts missing' };
    }

    const candidates = [
      // Assets (Cash/Bank/AR)
      {
        code: '1.1.1', name: 'الصندوق', nameEn: 'Cash on Hand', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit', parentId: assetsMain.id
      },
      {
        code: '1.1.2', name: 'المصرف', nameEn: 'Bank', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit', parentId: assetsMain.id
      },
      {
        code: '1.2.1', name: 'ذمم عملاء', nameEn: 'Accounts Receivable', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit', parentId: assetsMain.id
      },
      // Liabilities (AP)
      {
        code: '3.1.1', name: 'ذمم موردين', nameEn: 'Accounts Payable', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', nature: 'credit', parentId: liabilitiesMain.id
      },
      // Expenses (common operating expenses)
      {
        code: '2.1.1', name: 'مصروف مشتريات', nameEn: 'Purchases Expense', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', nature: 'debit', parentId: expensesMain.id
      },
      {
        code: '2.1.2', name: 'مصروف نقل', nameEn: 'Transport Expense', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', nature: 'debit', parentId: expensesMain.id
      },
      {
        code: '2.2.1', name: 'مصروف رواتب', nameEn: 'Salaries Expense', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', nature: 'debit', parentId: expensesMain.id
      },
      // Revenue (service revenues)
      {
        code: '5.1.1', name: 'إيرادات التخزين', nameEn: 'Storage Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', nature: 'credit', parentId: revenueMain.id
      },
      {
        code: '5.1.2', name: 'إيرادات المناولة', nameEn: 'Handling Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', nature: 'credit', parentId: revenueMain.id
      },
      {
        code: '5.1.3', name: 'إيرادات الشحن', nameEn: 'Shipping Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', nature: 'credit', parentId: revenueMain.id
      }
    ];

    let created = 0;
    for (const data of candidates) {
      const exists = await Account.findOne({ where: { code: data.code } });
      if (exists) continue;
      await Account.create({
        id: uuidv4(),
        ...data,
        level: 2,
        isGroup: false,
        isActive: true,
        accountType: 'sub',
        currency: 'LYD',
        description: `System default sub-account: ${data.nameEn}`,
        isSystemAccount: true,
        isMonitored: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      created += 1;
      console.log(`  ✓ تم إنشاء ${data.code} - ${data.name}`);
    }

    return { success: true, created };
  } catch (error) {
    console.error('❌ خطأ في إنشاء الحسابات التشغيلية الافتراضية:', error.message);
    return { success: false, error: error.message };
  }
}


/**
 * دالة للتحقق من صحة الحسابات الرئيسية
 * @param {Object} models - نماذج قاعدة البيانات
 * @returns {Promise<Object>} نتيجة التحقق
 */
export async function validateMainAccounts(models) {
  try {
    const { Account } = models;

    console.log('🔍 التحقق من صحة الحسابات الرئيسية...');

    const mainAccounts = await Account.findAll({
      where: { level: 1 },
      order: [['code', 'ASC']]
    });

    const expectedClassification = {
      '1': { type: 'asset', nature: 'debit', name: 'الأصول' },
      '2': { type: 'expense', nature: 'debit', name: 'المصروفات' },
      '3': { type: 'liability', nature: 'credit', name: 'الالتزامات' },
      '4': { type: 'equity', nature: 'credit', name: 'حقوق الملكية' },
      '5': { type: 'revenue', nature: 'credit', name: 'الإيرادات' }
    };

    let allCorrect = true;
    const issues = [];

    for (const [code, expected] of Object.entries(expectedClassification)) {
      const account = mainAccounts.find(acc => acc.code === code);

      if (!account) {
        issues.push(`الحساب ${code} - ${expected.name} غير موجود`);
        allCorrect = false;
        continue;
      }

      if (account.type !== expected.type) {
        issues.push(`الحساب ${code} - نوع خاطئ: ${account.type} بدلاً من ${expected.type}`);
        allCorrect = false;
      }

      if (account.nature !== expected.nature) {
        issues.push(`الحساب ${code} - طبيعة خاطئة: ${account.nature} بدلاً من ${expected.nature}`);
        allCorrect = false;
      }
    }

    if (allCorrect) {
      console.log('✅ جميع الحسابات الرئيسية صحيحة');
    } else {
      console.log('❌ توجد مشاكل في الحسابات الرئيسية:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    return {
      success: allCorrect,
      issues: issues,
      total: mainAccounts.length,
      expected: Object.keys(expectedClassification).length
    };

  } catch (error) {
    console.error('❌ خطأ في التحقق من الحسابات الرئيسية:', error.message);
    return {
      success: false,
      error: error.message,
      issues: [],
      total: 0,
      expected: 5
    };
  }
}

// تصدير الحسابات الافتراضية للاستخدام في أماكن أخرى
export { DEFAULT_MAIN_ACCOUNTS };
