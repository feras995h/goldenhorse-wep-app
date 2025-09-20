import { v4 as uuidv4 } from 'uuid';

/**
 * Seeder محدث للحسابات الرئيسية الافتراضية
 * Updated Default Main Accounts Seeder - Golden Horse Shipping System
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
    accountType: 'main',
    nature: 'debit',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي للأصول - يشمل جميع الأصول المملوكة للشركة',
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
    accountType: 'main',
    nature: 'debit',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي للمصروفات - يشمل جميع المصروفات التشغيلية والإدارية',
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
    accountType: 'main',
    nature: 'credit',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي للالتزامات - يشمل جميع الديون والالتزامات المالية',
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
    accountType: 'main',
    nature: 'credit',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي لحقوق الملكية - يشمل رأس المال والأرباح المحتجزة',
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
    accountType: 'main',
    nature: 'credit',
    level: 1,
    isGroup: true,
    isActive: true,
    balance: 0.00,
    currency: 'LYD',
    description: 'الحساب الرئيسي للإيرادات - يشمل جميع الإيرادات من المبيعات والخدمات',
    isSystemAccount: true,
    isMonitored: false,
    freezeAccount: false,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// المستخدمين الافتراضيين
const DEFAULT_USERS = [
  {
    id: uuidv4(),
    username: 'admin',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
    name: 'مدير النظام',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    username: 'financial',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: financial123
    name: 'مدير مالي',
    role: 'financial_manager',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    username: 'sales',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: sales123
    name: 'مدير مبيعات',
    role: 'sales_manager',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    username: 'user',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: user123
    name: 'مستخدم عادي',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function up(queryInterface, Sequelize) {
  console.log('🌱 إنشاء البيانات الافتراضية...');
  
  try {
    // إنشاء المستخدمين الافتراضيين
    console.log('👥 إنشاء المستخدمين الافتراضيين...');
    const existingUsers = await queryInterface.sequelize.query(
      'SELECT username FROM users ORDER BY username',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const existingUsernames = existingUsers.map(user => user.username);
    console.log(`📊 المستخدمين الموجودين: ${existingUsernames.join(', ') || 'لا يوجد'}`);
    
    const usersToCreate = DEFAULT_USERS.filter(
      user => !existingUsernames.includes(user.username)
    );
    
    if (usersToCreate.length > 0) {
      await queryInterface.bulkInsert('users', usersToCreate);
      console.log(`✅ تم إنشاء ${usersToCreate.length} مستخدم جديد`);
      usersToCreate.forEach(user => {
        console.log(`  ✓ ${user.username} - ${user.name} (${user.role})`);
      });
    } else {
      console.log('✅ جميع المستخدمين الافتراضيين موجودون بالفعل');
    }

    // إنشاء الحسابات الرئيسية
    console.log('💰 إنشاء الحسابات الرئيسية الافتراضية...');
    const existingAccounts = await queryInterface.sequelize.query(
      'SELECT code FROM accounts WHERE level = 1 ORDER BY code',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const existingCodes = existingAccounts.map(acc => acc.code);
    console.log(`📊 الحسابات الرئيسية الموجودة: ${existingCodes.join(', ') || 'لا توجد'}`);
    
    const accountsToCreate = DEFAULT_MAIN_ACCOUNTS.filter(
      account => !existingCodes.includes(account.code)
    );
    
    if (accountsToCreate.length > 0) {
      await queryInterface.bulkInsert('accounts', accountsToCreate);
      console.log(`✅ تم إنشاء ${accountsToCreate.length} حساب رئيسي جديد`);
      accountsToCreate.forEach(account => {
        console.log(`  ✓ ${account.code} - ${account.name} (${account.type}) - طبيعة: ${account.nature}`);
      });
    } else {
      console.log('✅ جميع الحسابات الرئيسية موجودة بالفعل');
    }
    
    console.log('🎉 تم إنشاء البيانات الافتراضية بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات الافتراضية:', error.message);
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  console.log('🗑️ حذف البيانات الافتراضية...');
  
  try {
    // حذف الحسابات الرئيسية
    const codes = DEFAULT_MAIN_ACCOUNTS.map(account => account.code);
    await queryInterface.bulkDelete('accounts', {
      code: {
        [Sequelize.Op.in]: codes
      },
      isSystemAccount: true
    });
    
    // حذف المستخدمين الافتراضيين
    const usernames = DEFAULT_USERS.map(user => user.username);
    await queryInterface.bulkDelete('users', {
      username: {
        [Sequelize.Op.in]: usernames
      }
    });
    
    console.log('✅ تم حذف البيانات الافتراضية');
    
  } catch (error) {
    console.error('❌ خطأ في حذف البيانات الافتراضية:', error.message);
    throw error;
  }
}

// تصدير البيانات للاستخدام في أماكن أخرى
export { DEFAULT_MAIN_ACCOUNTS, DEFAULT_USERS };
