import { Sequelize } from 'sequelize';
import config from '../config/database.cjs';

const env = (process.env.NODE_ENV || 'development').trim().replace(/^=+/, '');
const dbConfig = config[env];

// Debug environment information
console.log(`🔍 Environment: "${env}" (original: "${process.env.NODE_ENV}")`);

// Check if dbConfig exists
if (!dbConfig) {
  console.error(`❌ Database configuration not found for environment: ${env}`);
  console.error('Available environments:', Object.keys(config));
  console.error('Raw NODE_ENV value:', JSON.stringify(process.env.NODE_ENV));
  process.exit(1);
}

// Initialize Sequelize based on configuration
let sequelize;

if (dbConfig.url) {
  // Use DATABASE_URL or DB_URL if provided (for hosted databases)
  console.log('🔗 Using database URL connection');
  console.log('🔍 Database URL value:', dbConfig.url ? 'Set (hidden for security)' : 'Not set');
  console.log('🔍 URL source:', process.env.DATABASE_URL ? 'DATABASE_URL' : process.env.DB_URL ? 'DB_URL' : 'Unknown');

  // Validate DATABASE_URL format
  if (!dbConfig.url || typeof dbConfig.url !== 'string' || dbConfig.url.trim() === '') {
    console.error('❌ Database URL is empty or invalid');
    console.error('Expected format: postgresql://username:password@host:port/database');
    console.error('Supported variables: DATABASE_URL or DB_URL');
    process.exit(1);
  }

  // Check if URL has proper protocol
  if (!dbConfig.url.includes('://')) {
    console.error('❌ Database URL missing protocol (postgresql://, mysql://, etc.)');
    console.error('Current URL format:', dbConfig.url.substring(0, 20) + '...');
    process.exit(1);
  }

  sequelize = new Sequelize(dbConfig.url, {
    dialect: dbConfig.dialect || 'postgres',
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  });
} else if (dbConfig.dialect === 'sqlite') {
  // SQLite configuration
  console.log('💾 Using SQLite database');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbConfig.storage,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  });
} else {
  // PostgreSQL/MySQL configuration with individual parameters
  console.log(`🗄️ Using ${dbConfig.dialect} database with individual parameters`);

  // Check required parameters for non-SQLite databases
  if (!dbConfig.database || !dbConfig.username) {
    console.error('❌ Missing required database parameters for production');
    console.error('Required: database, username');
    console.error('Available config:', dbConfig);
    process.exit(1);
  }

  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool,
      dialectOptions: dbConfig.dialectOptions
    }
  );
}

// Import and initialize models
import UserModel from './User.js';
import RoleModel from './Role.js';
import AccountModel from './Account.js';
import GLEntryModel from './GLEntry.js';
import JournalEntryModel from './JournalEntry.js';
import JournalEntryDetailModel from './JournalEntryDetail.js';
import CustomerModel from './Customer.js';
import SupplierModel from './Supplier.js';
import EmployeeModel from './Employee.js';
import PayrollEntryModel from './PayrollEntry.js';
import EmployeeAdvanceModel from './EmployeeAdvance.js';
import InvoiceModel from './Invoice.js';
import PaymentModel from './Payment.js';
import ReceiptModel from './Receipt.js';
import FixedAssetModel from './FixedAsset.js';
import SettingModel from './Setting.js';

// Initialize models with sequelize
const User = UserModel(sequelize);
const Role = RoleModel(sequelize);
const Account = AccountModel(sequelize);
const GLEntry = GLEntryModel(sequelize);
const JournalEntry = JournalEntryModel(sequelize);
const JournalEntryDetail = JournalEntryDetailModel(sequelize);
const Customer = CustomerModel(sequelize);
const Supplier = SupplierModel(sequelize);
const Employee = EmployeeModel(sequelize);
const PayrollEntry = PayrollEntryModel(sequelize);
const EmployeeAdvance = EmployeeAdvanceModel(sequelize);
const Invoice = InvoiceModel(sequelize);
const Payment = PaymentModel(sequelize);
const Receipt = ReceiptModel(sequelize);
const FixedAsset = FixedAssetModel(sequelize);
const Setting = SettingModel(sequelize);

// Define associations
const models = {
  User,
  Role,
  Account,
  GLEntry,
  JournalEntry,
  JournalEntryDetail,
  Customer,
  Supplier,
  Employee,
  PayrollEntry,
  EmployeeAdvance,
  Invoice,
  Payment,
  Receipt,
  FixedAsset,
  Setting
};

// Set up associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize };
export default models;
