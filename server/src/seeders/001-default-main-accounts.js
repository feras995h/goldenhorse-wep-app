import { v4 as uuidv4 } from 'uuid';

/**
 * Seeder للحسابات الرئيسية الافتراضية
 * يتم تشغيله تلقائياً عند بدء النظام لضمان وجود الحسابات الأساسية
 */

// الحسابات الرئيسية الافتراضية وفقاً للتصنيف المحاسبي التقليدي
const DEFAULT_MAIN_ACCOUNTS = [
  {
    id: uuidv4(),
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
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
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
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
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
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
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
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
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
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function up(queryInterface, Sequelize) {
  console.log('🌱 إنشاء الحسابات الرئيسية الافتراضية...');
  
  try {
    // التحقق من وجود الحسابات الرئيسية
    const existingAccounts = await queryInterface.sequelize.query(
      'SELECT code FROM accounts WHERE level = 1 ORDER BY code',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const existingCodes = existingAccounts.map(acc => acc.code);
    console.log(`📊 الحسابات الرئيسية الموجودة: ${existingCodes.join(', ') || 'لا توجد'}`);
    
    // إنشاء الحسابات المفقودة فقط
    const accountsToCreate = DEFAULT_MAIN_ACCOUNTS.filter(
      account => !existingCodes.includes(account.code)
    );
    
    if (accountsToCreate.length === 0) {
      console.log('✅ جميع الحسابات الرئيسية موجودة بالفعل');
      return;
    }
    
    console.log(`📝 سيتم إنشاء ${accountsToCreate.length} حساب رئيسي جديد`);
    
    // إنشاء الحسابات الجديدة
    await queryInterface.bulkInsert('accounts', accountsToCreate);
    
    console.log('✅ تم إنشاء الحسابات الرئيسية الافتراضية بنجاح');
    
    // عرض الحسابات المنشأة
    accountsToCreate.forEach(account => {
      console.log(`  ✓ ${account.code} - ${account.name} (${account.type}) - طبيعة: ${account.nature}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الحسابات الرئيسية:', error.message);
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  console.log('🗑️ حذف الحسابات الرئيسية الافتراضية...');
  
  try {
    const codes = DEFAULT_MAIN_ACCOUNTS.map(account => account.code);
    
    await queryInterface.bulkDelete('accounts', {
      code: {
        [Sequelize.Op.in]: codes
      },
      isSystemAccount: true
    });
    
    console.log('✅ تم حذف الحسابات الرئيسية الافتراضية');
    
  } catch (error) {
    console.error('❌ خطأ في حذف الحسابات الرئيسية:', error.message);
    throw error;
  }
}

// تصدير الحسابات للاستخدام في أماكن أخرى
export { DEFAULT_MAIN_ACCOUNTS };
