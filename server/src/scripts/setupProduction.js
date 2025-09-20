import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import models, { sequelize } from '../models/index.js';

const { User, Role, Account, Setting } = models;

console.log('🚀 Setting up production environment...');

const setupProduction = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 1. Create essential roles
    console.log('🔄 Creating essential roles...');
    const roles = [
      { 
        id: uuidv4(), 
        name: 'admin', 
        description: 'مدير النظام', 
        permissions: {
          users: ['view', 'create', 'edit', 'delete'],
          roles: ['view', 'create', 'edit', 'delete'],
          financial: ['view', 'create', 'edit', 'delete'],
          sales: ['view', 'create', 'edit', 'delete'],
          operations: ['view', 'create', 'edit', 'delete'],
          customer_service: ['view', 'create', 'edit', 'delete'],
          admin: ['view', 'create', 'edit', 'delete', 'configure', 'backup', 'restore']
        }
      },
      { 
        id: uuidv4(), 
        name: 'financial', 
        description: 'مدير مالي', 
        permissions: {
          financial: ['view', 'create', 'edit', 'delete'],
          reports: ['view', 'create']
        }
      },
      { 
        id: uuidv4(), 
        name: 'sales', 
        description: 'مدير مبيعات', 
        permissions: {
          sales: ['view', 'create', 'edit', 'delete'],
          customers: ['view', 'create', 'edit'],
          reports: ['view']
        }
      },
      { 
        id: uuidv4(), 
        name: 'customer_service', 
        description: 'خدمة العملاء', 
        permissions: {
          customer_service: ['view', 'create', 'edit', 'delete'],
          customers: ['view', 'edit']
        }
      },
      { 
        id: uuidv4(), 
        name: 'operations', 
        description: 'عمليات', 
        permissions: {
          operations: ['view', 'create', 'edit', 'delete'],
          shipments: ['view', 'create', 'edit']
        }
      }
    ];
    
    for (const role of roles) {
      await Role.findOrCreate({
        where: { name: role.name },
        defaults: {
          ...role,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Role created/updated: ${role.name}`);
    }

    // 2. Create admin user
    console.log('🔄 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
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
    console.log('✅ Admin user created/updated');

    // 3. Create basic chart of accounts
    console.log('🔄 Creating basic chart of accounts...');
    const accounts = [
      // Assets
      { code: '1', name: 'الأصول', nameEn: 'Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', accountType: 'main', level: 1, isGroup: true, nature: 'debit' },
      { code: '11', name: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', accountType: 'main', level: 2, isGroup: true, nature: 'debit', parentCode: '1' },
      { code: '12', name: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', accountType: 'main', level: 2, isGroup: true, nature: 'debit', parentCode: '1' },
      
      // Liabilities
      { code: '2', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', accountType: 'main', level: 1, isGroup: true, nature: 'credit' },
      { code: '21', name: 'الخصوم المتداولة', nameEn: 'Current Liabilities', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', accountType: 'main', level: 2, isGroup: true, nature: 'credit', parentCode: '2' },
      { code: '22', name: 'الخصوم طويلة الأجل', nameEn: 'Long-term Liabilities', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', accountType: 'main', level: 2, isGroup: true, nature: 'credit', parentCode: '2' },
      
      // Equity
      { code: '3', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', accountType: 'main', level: 1, isGroup: true, nature: 'credit' },
      
      // Revenue
      { code: '4', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', accountType: 'main', level: 1, isGroup: true, nature: 'credit' },
      
      // Expenses
      { code: '5', name: 'المصروفات', nameEn: 'Expenses', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', accountType: 'main', level: 1, isGroup: true, nature: 'debit' }
    ];
    
    for (const account of accounts) {
      let parentId = null;
      if (account.parentCode) {
        const parentAccount = await Account.findOne({ where: { code: account.parentCode } });
        if (parentAccount) {
          parentId = parentAccount.id;
        }
      }
      
      await Account.findOrCreate({
        where: { code: account.code },
        defaults: {
          id: uuidv4(),
          ...account,
          parentId,
          isActive: true,
          balance: 0.00,
          currency: 'LYD',
          description: `حساب ${account.name}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Account created/updated: ${account.code} - ${account.name}`);
    }

    // 4. Create essential settings
    console.log('🔄 Creating essential settings...');
    const settings = [
      { key: 'company_name', value: 'شركة الحصان الذهبي للشحن', description: 'اسم الشركة' },
      { key: 'company_name_en', value: 'Golden Horse Shipping', description: 'Company Name (English)' },
      { key: 'company_address', value: '', description: 'عنوان الشركة' },
      { key: 'company_phone', value: '', description: 'هاتف الشركة' },
      { key: 'company_email', value: '', description: 'بريد الشركة الإلكتروني' },
      { key: 'company_website', value: '', description: 'موقع الشركة الإلكتروني' },
      { key: 'company_tax_number', value: '', description: 'الرقم الضريبي للشركة' },
      { key: 'default_currency', value: 'LYD', description: 'العملة الافتراضية' },
      { key: 'fiscal_year_start', value: '01-01', description: 'بداية السنة المالية (MM-DD)' },
      { key: 'backup_enabled', value: 'true', description: 'تفعيل النسخ الاحتياطي' },
      { key: 'backup_frequency', value: 'daily', description: 'تكرار النسخ الاحتياطي' },
      { key: 'system_timezone', value: 'Africa/Tripoli', description: 'المنطقة الزمنية للنظام' }
    ];
    
    for (const setting of settings) {
      await Setting.findOrCreate({
        where: { key: setting.key },
        defaults: {
          id: uuidv4(),
          ...setting,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Setting created/updated: ${setting.key}`);
    }

    console.log('🎉 Production setup completed successfully!');
    console.log('📊 Production environment ready:');
    console.log('- ✅ Essential roles created');
    console.log('- ✅ Admin user configured');
    console.log('- ✅ Basic chart of accounts created');
    console.log('- ✅ Essential settings configured');
    console.log('- ✅ System ready for production use');
    console.log('');
    console.log('🔐 Admin Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');

  } catch (error) {
    console.error('❌ Error setting up production:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Run the setup
setupProduction()
  .then(() => {
    console.log('✅ Production setup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Production setup script failed:', error);
    process.exit(1);
  });
