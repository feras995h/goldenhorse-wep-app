import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to read JSON data
const readJsonFile = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Helper function to backup JSON data
const backupJsonData = async () => {
  const backupDir = path.join(__dirname, '../../backups', new Date().toISOString().split('T')[0]);
  await fs.mkdir(backupDir, { recursive: true });
  
  const dataFiles = [
    'users.json',
    'accounts.json',
    'gl_entries.json',
    'customers.json',
    'employees.json',
    'payroll.json',
    'invoices.json',
    'payments.json',
    'receipts.json',
    'journal-entries.json',
    'employee-advances.json',
    'fixed-assets.json',
    'settings.json'
  ];
  
  for (const file of dataFiles) {
    try {
      const sourcePath = path.join(__dirname, '../data', file);
      const destPath = path.join(backupDir, file);
      await fs.copyFile(sourcePath, destPath);
      console.log(`✅ Backed up ${file}`);
    } catch (error) {
      console.warn(`⚠️ Could not backup ${file}:`, error.message);
    }
  }
  
  console.log(`📁 Backup created at: ${backupDir}`);
  return backupDir;
};

// Migration functions
const migrateUsers = async () => {
  console.log('🔄 Migrating users...');
  const users = await readJsonFile('users.json');
  const models = await import('../models/index.js');
  const User = models.default.User;
  
  for (const userData of users) {
    try {
      await User.create({
        id: userData.id,
        username: userData.username,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        isActive: true
      });
      console.log(`✅ Migrated user: ${userData.username}`);
    } catch (error) {
      console.error(`❌ Error migrating user ${userData.username}:`, error.message);
    }
  }
};

const migrateAccounts = async () => {
  console.log('🔄 Migrating accounts...');
  const accounts = await readJsonFile('accounts.json');
  const models = await import('../models/index.js');
  const Account = models.default.Account;
  
  for (const accountData of accounts) {
    try {
      await Account.create({
        id: accountData.id,
        code: accountData.code,
        name: accountData.name,
        nameEn: accountData.nameEn,
        type: accountData.type,
        rootType: accountData.rootType || accountData.type.charAt(0).toUpperCase() + accountData.type.slice(1),
        reportType: accountData.reportType || (['asset', 'liability', 'equity'].includes(accountData.type) ? 'Balance Sheet' : 'Profit and Loss'),
        accountCategory: accountData.accountCategory,
        accountType: accountData.accountType,
        parentId: accountData.parentId,
        level: accountData.level,
        isGroup: accountData.isGroup,
        isActive: accountData.isActive,
        freezeAccount: accountData.freezeAccount || false,
        balance: accountData.balance,
        currency: accountData.currency || 'LYD',
        description: accountData.description
      });
      console.log(`✅ Migrated account: ${accountData.code} - ${accountData.name}`);
    } catch (error) {
      console.error(`❌ Error migrating account ${accountData.code}:`, error.message);
    }
  }
};

const migrateCustomers = async () => {
  console.log('🔄 Migrating customers...');
  const customers = await readJsonFile('customers.json');
  const models = await import('../models/index.js');
  const Customer = models.default.Customer;
  
  for (const customerData of customers) {
    try {
      await Customer.create({
        id: customerData.id,
        code: customerData.code,
        name: customerData.name,
        nameEn: customerData.nameEn,
        type: customerData.type,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        taxNumber: customerData.taxNumber,
        creditLimit: customerData.creditLimit,
        paymentTerms: customerData.paymentTerms,
        currency: customerData.currency || 'LYD',
        isActive: customerData.isActive,
        balance: customerData.balance,
        accountId: customerData.accountId
      });
      console.log(`✅ Migrated customer: ${customerData.code} - ${customerData.name}`);
    } catch (error) {
      console.error(`❌ Error migrating customer ${customerData.code}:`, error.message);
    }
  }
};

const migrateEmployees = async () => {
  console.log('🔄 Migrating employees...');
  const employees = await readJsonFile('employees.json');
  const models = await import('../models/index.js');
  const Employee = models.default.Employee;
  
  for (const employeeData of employees) {
    try {
      await Employee.create({
        id: employeeData.id,
        code: employeeData.code,
        name: employeeData.name,
        nameEn: employeeData.nameEn,
        email: employeeData.email,
        phone: employeeData.phone,
        address: employeeData.address,
        position: employeeData.position,
        department: employeeData.department,
        salary: employeeData.salary,
        hireDate: employeeData.hireDate,
        terminationDate: employeeData.terminationDate,
        isActive: employeeData.isActive,
        accountId: employeeData.accountId,
        bankAccount: employeeData.bankAccount,
        bankName: employeeData.bankName,
        taxNumber: employeeData.taxNumber,
        emergencyContact: employeeData.emergencyContact,
        emergencyPhone: employeeData.emergencyPhone,
        notes: employeeData.notes
      });
      console.log(`✅ Migrated employee: ${employeeData.code} - ${employeeData.name}`);
    } catch (error) {
      console.error(`❌ Error migrating employee ${employeeData.code}:`, error.message);
    }
  }
};

const migrateGLEntries = async () => {
  console.log('🔄 Migrating GL entries...');
  const glEntries = await readJsonFile('gl_entries.json');
  const models = await import('../models/index.js');
  const GLEntry = models.default.GLEntry;
  
  for (const entryData of glEntries) {
    try {
      await GLEntry.create({
        id: entryData.id,
        postingDate: entryData.postingDate,
        accountId: entryData.account,
        debit: entryData.debit,
        credit: entryData.credit,
        voucherType: entryData.voucherType,
        voucherNo: entryData.voucherNo,
        remarks: entryData.remarks,
        isCancelled: entryData.isCancelled,
        createdBy: '1', // Default to admin user
        currency: 'LYD',
        exchangeRate: 1.000000
      });
      console.log(`✅ Migrated GL entry: ${entryData.id}`);
    } catch (error) {
      console.error(`❌ Error migrating GL entry ${entryData.id}:`, error.message);
    }
  }
};

const migrateSettings = async () => {
  console.log('🔄 Migrating settings...');
  const settings = await readJsonFile('settings.json');
  const models = await import('../models/index.js');
  const Setting = models.default.Setting;
  
  try {
    await Setting.set('logo', settings.logo || {}, {
      type: 'json',
      description: 'Company logo settings',
      category: 'company'
    });
    
    await Setting.set('lastUpdated', settings.lastUpdated || new Date().toISOString(), {
      type: 'date',
      description: 'Last system update',
      category: 'system'
    });
    
    console.log('✅ Migrated settings');
  } catch (error) {
    console.error('❌ Error migrating settings:', error.message);
  }
};

// Main migration function
const migrateData = async () => {
  try {
    console.log('🚀 Starting data migration from JSON to PostgreSQL...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Create backup
    console.log('📁 Creating backup...');
    await backupJsonData();
    
    // Sync database (create tables)
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: false });
    
    // Migrate data in order
    await migrateUsers();
    await migrateAccounts();
    await migrateCustomers();
    await migrateEmployees();
    await migrateGLEntries();
    await migrateSettings();
    
    console.log('🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Verify migration
const verifyMigration = async () => {
  try {
    console.log('🔍 Verifying migration...');
    
    const { User, Account, Customer, Employee, GLEntry } = await import('../models/index.js');
    
    // Count records
    const userCount = await User.count();
    const accountCount = await Account.count();
    const customerCount = await Customer.count();
    const employeeCount = await Employee.count();
    const glEntryCount = await GLEntry.count();
    
    console.log('📊 Migration Results:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Accounts: ${accountCount}`);
    console.log(`- Customers: ${customerCount}`);
    console.log(`- Employees: ${employeeCount}`);
    console.log(`- GL Entries: ${glEntryCount}`);
    
    // Verify some sample data
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      console.log('✅ Admin user found');
    } else {
      console.log('❌ Admin user not found');
    }
    
    const cashAccount = await Account.findOne({ where: { code: '1111' } });
    if (cashAccount) {
      console.log('✅ Cash account found');
    } else {
      console.log('❌ Cash account not found');
    }
    
    console.log('✅ Migration verification completed');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await sequelize.close();
  }
};

// Run migration if called directly
if (process.argv[2] === 'verify') {
  verifyMigration();
} else {
  migrateData();
}

