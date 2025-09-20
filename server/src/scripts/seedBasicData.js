import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import models, { sequelize } from '../models/index.js';

const { User, Role, Account } = models;

// Function to seed basic data
const seedBasicData = async () => {
  try {
    console.log('🌱 Starting to seed basic data...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Create roles
    console.log('🔄 Creating roles...');
    const roles = [
      { id: uuidv4(), name: 'admin', description: 'مدير النظام', permissions: ['all'] },
      { id: uuidv4(), name: 'financial', description: 'محاسب', permissions: ['financial'] },
      { id: uuidv4(), name: 'user', description: 'مستخدم عادي', permissions: ['read'] }
    ];
    
    for (const role of roles) {
      await Role.findOrCreate({
        where: { name: role.name },
        defaults: role
      });
      console.log(`✅ Role created: ${role.name}`);
    }
    
    // Create admin user
    console.log('🔄 Creating admin user...');
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        id: uuidv4(),
        username: 'admin',
        password: hashedPassword,
        name: 'مدير النظام',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Admin user created');
    
    // Create basic chart of accounts using the default main accounts
    console.log('🔄 Creating chart of accounts...');

    try {
      const { ensureDefaultMainAccounts } = await import('../utils/ensureDefaultAccounts.js');
      const accountsResult = await ensureDefaultMainAccounts({ Account });

      if (accountsResult.success) {
        console.log(`✅ الحسابات الرئيسية: ${accountsResult.total} حساب (${accountsResult.created} جديد، ${accountsResult.existing} موجود)`);
      } else {
        console.warn('⚠️  مشكلة في إنشاء الحسابات الرئيسية:', accountsResult.error);

        // Fallback to old method if the new one fails
        console.log('🔄 استخدام الطريقة البديلة لإنشاء الحسابات...');

        // Root accounts (fallback)
        const rootAccounts = [
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
            balance: 0,
            currency: 'LYD',
            accountType: 'main',
            isSystemAccount: true
          },
        isActive: true,
        balance: 0,
        currency: 'LYD'
      },
      {
        id: uuidv4(),
        code: '3',
        name: 'حقوق الملكية',
        nameEn: 'Equity',
        type: 'equity',
        rootType: 'Equity',
        reportType: 'Balance Sheet',
        level: 1,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD'
      },
      {
        id: uuidv4(),
        code: '4',
        name: 'الإيرادات',
        nameEn: 'Income',
        type: 'income',
        rootType: 'Income',
        reportType: 'Profit and Loss',
        level: 1,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD'
      },
      {
        id: uuidv4(),
        code: '5',
        name: 'المصروفات',
        nameEn: 'Expense',
        type: 'expense',
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        level: 1,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD'
      }
    ];
    
    // Create root accounts
    for (const account of rootAccounts) {
      await Account.findOrCreate({
        where: { code: account.code },
        defaults: account
      });
      console.log(`✅ Root account created: ${account.code} - ${account.name}`);
    }
    
    // Get root accounts for creating child accounts
    const assetsRoot = await Account.findOne({ where: { code: '1' } });
    const liabilitiesRoot = await Account.findOne({ where: { code: '2' } });
    const equityRoot = await Account.findOne({ where: { code: '3' } });
    const incomeRoot = await Account.findOne({ where: { code: '4' } });
    const expenseRoot = await Account.findOne({ where: { code: '5' } });
    
    // Asset accounts
    const assetAccounts = [
      {
        code: '11',
        name: 'الأصول المتداولة',
        nameEn: 'Current Assets',
        type: 'asset',
        parentId: assetsRoot.id,
        level: 2,
        isGroup: true
      },
      {
        code: '111',
        name: 'النقد وما في حكمه',
        nameEn: 'Cash and Cash Equivalents',
        type: 'asset',
        parentId: assetsRoot.id,
        level: 2,
        isGroup: true
      },
      {
        code: '1111',
        name: 'الصندوق',
        nameEn: 'Cash',
        type: 'asset',
        parentId: assetsRoot.id,
        level: 3,
        isGroup: false
      },
      {
        code: '1112',
        name: 'البنك',
        nameEn: 'Bank',
        type: 'asset',
        parentId: assetsRoot.id,
        level: 3,
        isGroup: false
      },
      {
        code: '12',
        name: 'الأصول الثابتة',
        nameEn: 'Fixed Assets',
        type: 'asset',
        parentId: assetsRoot.id,
        level: 2,
        isGroup: true
      },
      {
        code: '121',
        name: 'المباني والمنشآت',
        nameEn: 'Buildings and Structures',
        type: 'asset',
        parentId: assetsRoot.id,
        level: 3,
        isGroup: true
      },
      {
        code: '1211',
        name: 'المباني',
        nameEn: 'Buildings',
        type: 'asset',
        parentId: assetsRoot.id,
        level: 4,
        isGroup: false
      }
    ];
    
    // Liability accounts
    const liabilityAccounts = [
      {
        code: '21',
        name: 'الالتزامات المتداولة',
        nameEn: 'Current Liabilities',
        type: 'liability',
        parentId: liabilitiesRoot.id,
        level: 2,
        isGroup: true
      },
      {
        code: '211',
        name: 'الموردين',
        nameEn: 'Accounts Payable',
        type: 'liability',
        parentId: liabilitiesRoot.id,
        level: 3,
        isGroup: false
      },
      {
        code: '22',
        name: 'الالتزامات طويلة الأجل',
        nameEn: 'Long Term Liabilities',
        type: 'liability',
        parentId: liabilitiesRoot.id,
        level: 2,
        isGroup: true
      }
    ];
    
    // Equity accounts
    const equityAccounts = [
      {
        code: '31',
        name: 'رأس المال',
        nameEn: 'Capital',
        type: 'equity',
        parentId: equityRoot.id,
        level: 2,
        isGroup: false
      },
      {
        code: '32',
        name: 'الأرباح المحتجزة',
        nameEn: 'Retained Earnings',
        type: 'equity',
        parentId: equityRoot.id,
        level: 2,
        isGroup: false
      }
    ];
    
    // Income accounts
    const incomeAccounts = [
      {
        code: '41',
        name: 'إيرادات النشاط',
        nameEn: 'Operating Income',
        type: 'income',
        parentId: incomeRoot.id,
        level: 2,
        isGroup: true
      },
      {
        code: '411',
        name: 'إيرادات المبيعات',
        nameEn: 'Sales Revenue',
        type: 'income',
        parentId: incomeRoot.id,
        level: 3,
        isGroup: false
      }
    ];
    
    // Expense accounts
    const expenseAccounts = [
      {
        code: '51',
        name: 'مصروفات التشغيل',
        nameEn: 'Operating Expenses',
        type: 'expense',
        parentId: expenseRoot.id,
        level: 2,
        isGroup: true
      },
      {
        code: '511',
        name: 'مصروفات الرواتب',
        nameEn: 'Salary Expenses',
        type: 'expense',
        parentId: expenseRoot.id,
        level: 3,
        isGroup: false
      },
      {
        code: '512',
        name: 'مصروفات الإيجار',
        nameEn: 'Rent Expenses',
        type: 'expense',
        parentId: expenseRoot.id,
        level: 3,
        isGroup: false
      }
    ];
    
    // Create all child accounts
    const allChildAccounts = [
      ...assetAccounts,
      ...liabilityAccounts,
      ...equityAccounts,
      ...incomeAccounts,
      ...expenseAccounts
    ];
    
    for (const account of allChildAccounts) {
      await Account.findOrCreate({
        where: { code: account.code },
        defaults: {
          id: uuidv4(),
          ...account,
          rootType: account.type.charAt(0).toUpperCase() + account.type.slice(1),
          reportType: ['asset', 'liability', 'equity'].includes(account.type) ? 'Balance Sheet' : 'Profit and Loss',
          isActive: true,
          balance: 0,
          currency: 'LYD',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Account created: ${account.code} - ${account.name}`);
    }
    
    console.log('🎉 Basic data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('- 3 roles created');
    console.log('- 1 admin user created (username: admin, password: admin123)');
    console.log('- 5 root accounts created');
    console.log('- 15 child accounts created');
    
  } catch (error) {
    console.error('❌ Error seeding basic data:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run the script
seedBasicData();
