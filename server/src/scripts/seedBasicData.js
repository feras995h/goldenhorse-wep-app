import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import models, { sequelize } from '../models/index.js';

const { User, Role, Account } = models;

// Function to seed basic data
const seedBasicData = async () => {
  try {
    console.log('sequelize config:', sequelize.config);
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
    await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        id: uuidv4(),
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        name: 'مدير النظام',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Admin user created');

    // Create basic chart of accounts
    console.log('🔄 Creating chart of accounts...');
    try {
      const { ensureDefaultMainAccounts } = await import('../utils/ensureDefaultAccounts.js');
      const accountsResult = await ensureDefaultMainAccounts({ Account });

      if (accountsResult.success) {
        console.log(`✅ الحسابات الرئيسية: ${accountsResult.total} حساب (${accountsResult.created} جديد، ${accountsResult.existing} موجود)`);
      } else {
        throw new Error(accountsResult.error || 'ensureDefaultMainAccounts returned success: false');
      }
    } catch (error) {
      console.warn('⚠️  مشكلة في إنشاء الحسابات الرئيسية, using fallback:', error.message);
      console.log('🔄 استخدام الطريقة البديلة لإنشاء الحسابات...');

      const rootAccounts = [
          { id: uuidv4(), code: '1', name: 'الأصول', nameEn: 'Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit', level: 1, isGroup: true, isActive: true, balance: 0, currency: 'LYD', accountType: 'main', isSystemAccount: true },
          { id: uuidv4(), code: '2', name: 'الالتزامات', nameEn: 'Liabilities', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', nature: 'credit', level: 1, isGroup: true, isActive: true, balance: 0, currency: 'LYD', accountType: 'main', isSystemAccount: true },
          { id: uuidv4(), code: '3', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', nature: 'credit', level: 1, isGroup: true, isActive: true, balance: 0, currency: 'LYD', accountType: 'main', isSystemAccount: true },
          { id: uuidv4(), code: '4', name: 'الإيرادات', nameEn: 'Income', type: 'income', rootType: 'Income', reportType: 'Profit and Loss', nature: 'credit', level: 1, isGroup: true, isActive: true, balance: 0, currency: 'LYD', accountType: 'main', isSystemAccount: true },
          { id: uuidv4(), code: '5', name: 'المصروفات', nameEn: 'Expense', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', nature: 'debit', level: 1, isGroup: true, isActive: true, balance: 0, currency: 'LYD', accountType: 'main', isSystemAccount: true }
      ];

      for (const account of rootAccounts) {
        await Account.findOrCreate({ where: { code: account.code }, defaults: account });
        console.log(`✅ Root account created: ${account.code} - ${account.name}`);
      }
      
      console.log('🎉 Basic data seeding completed successfully!');
      console.log('📊 Summary:');
      console.log('- 3 roles created');
      console.log('- 1 admin user created (username: admin, password: admin123)');
      console.log('- 5 root accounts created');
    }

  } catch (error) {
    console.error('❌ Error seeding basic data:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run the script
seedBasicData();

    const rootAccount = await Account.findOne({ where: { code: '1' }, logging: console.log });
