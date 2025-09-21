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

  // Debug the actual URL format (safely)
  console.log('🔍 URL Debug Info:');
  console.log('  - URL length:', dbConfig.url.length);
  console.log('  - URL first 20 chars:', dbConfig.url.substring(0, 20));
  console.log('  - URL contains ://:', dbConfig.url.includes('://'));
  console.log('  - URL starts with =:', dbConfig.url.startsWith('='));
  console.log('  - URL starts with postgresql:', dbConfig.url.startsWith('postgresql://'));
  console.log('  - URL starts with postgres:', dbConfig.url.startsWith('postgres://'));

  // Check if URL has proper protocol
  if (!dbConfig.url.includes('://')) {
    console.error('❌ Database URL missing protocol (postgresql://, mysql://, etc.)');
    console.error('Current URL format:', dbConfig.url.substring(0, 20) + '...');
    process.exit(1);
  }

  // Try to parse URL to check for issues
  try {
    const url = new URL(dbConfig.url);
    console.log('🔍 Parsed URL Info:');
    console.log('  - Protocol:', url.protocol);
    console.log('  - Host:', url.hostname);
    console.log('  - Port:', url.port);
    console.log('  - Database:', url.pathname);
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error.message);
    console.error('URL value (first 30 chars):', dbConfig.url.substring(0, 30) + '...');
    process.exit(1);
  }

  // Fix common URL format issues
  let cleanUrl = dbConfig.url;

  // Remove leading = signs (Coolify environment variable issue)
  if (cleanUrl.startsWith('=')) {
    console.log('🔧 Removing leading = from DATABASE_URL');
    cleanUrl = cleanUrl.replace(/^=+/, '');
    console.log('🔧 Cleaned URL first 20 chars:', cleanUrl.substring(0, 20));
  }

  // Convert postgres:// to postgresql:// (Sequelize expects postgresql://)
  if (cleanUrl.startsWith('postgres://')) {
    console.log('🔧 Converting postgres:// to postgresql://');
    cleanUrl = cleanUrl.replace('postgres://', 'postgresql://');
  }

  console.log('🔗 Final URL protocol:', cleanUrl.substring(0, cleanUrl.indexOf('://') + 3));

  sequelize = new Sequelize(cleanUrl, {
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
// Improve SQLite concurrency for local dev: enable WAL and set busy timeout
if (sequelize.getDialect && sequelize.getDialect() === 'sqlite') {
  (async () => {
    try {
      await sequelize.query("PRAGMA journal_mode=WAL;");
      await sequelize.query("PRAGMA busy_timeout=5000;");
      await sequelize.query("PRAGMA synchronous=NORMAL;");
      console.log('🔧 SQLite PRAGMAs applied: WAL, busy_timeout=5000, synchronous=NORMAL');
    } catch (e) {
      console.warn('⚠️ Failed to apply SQLite PRAGMAs:', e.message);
    }
  })();
}

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
import NotificationModel from './Notification.js';
import ShipmentModel from './Shipment.js';
import ShipmentMovementModel from './ShipmentMovement.js';
import WarehouseReleaseOrderModel from './WarehouseReleaseOrder.js';
import ShippingInvoiceModel from './ShippingInvoice.js';
import SalesInvoiceModel from './SalesInvoice.js';
import SalesInvoiceItemModel from './SalesInvoiceItem.js';
import InvoicePaymentModel from './InvoicePayment.js';
import InvoiceReceiptModel from './InvoiceReceipt.js';
import AccountProvisionModel from './AccountProvision.js';
import AccountMappingModel from './AccountMapping.js';
import CompanyLogoModel from './CompanyLogo.js';
import PurchaseInvoiceModel from './PurchaseInvoice.js';
import PurchaseInvoicePaymentModel from './PurchaseInvoicePayment.js';
import SalesInvoicePaymentModel from './SalesInvoicePayment.js';
import StockMovementModel from './StockMovement.js';
import AuditLogModel from './AuditLog.js';
import AccountingPeriodModel from './AccountingPeriod.js';

import SalesReturnModel from './SalesReturn.js';
import ReceiptVoucherModel from './ReceiptVoucher.js';
import PaymentVoucherModel from './PaymentVoucher.js';
import WarehouseModel from './Warehouse.js';

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
const Notification = NotificationModel(sequelize);
const Shipment = ShipmentModel(sequelize);
const ShipmentMovement = ShipmentMovementModel(sequelize);
const WarehouseReleaseOrder = WarehouseReleaseOrderModel(sequelize);
const ShippingInvoice = ShippingInvoiceModel(sequelize);
const SalesInvoice = SalesInvoiceModel(sequelize);
const SalesInvoiceItem = SalesInvoiceItemModel(sequelize);
const InvoicePayment = InvoicePaymentModel(sequelize);
const InvoiceReceipt = InvoiceReceiptModel(sequelize);
const SalesReturn = SalesReturnModel(sequelize);
const SalesInvoicePayment = SalesInvoicePaymentModel(sequelize);
const ReceiptVoucher = ReceiptVoucherModel(sequelize);
const PaymentVoucher = PaymentVoucherModel(sequelize);
const PurchaseInvoice = PurchaseInvoiceModel(sequelize);
const Warehouse = WarehouseModel(sequelize);
const StockMovement = StockMovementModel(sequelize);
const AuditLog = AuditLogModel(sequelize);
const AccountingPeriod = AccountingPeriodModel(sequelize);

const CompanyLogo = CompanyLogoModel(sequelize);
const PurchaseInvoicePayment = PurchaseInvoicePaymentModel(sequelize);
const AccountProvision = AccountProvisionModel(sequelize);
const AccountMapping = AccountMappingModel(sequelize);

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
  Setting,
  Notification,
  Shipment,
  ShipmentMovement,
  WarehouseReleaseOrder,
  ShippingInvoice,
  SalesInvoice,
  SalesInvoiceItem,
  InvoicePayment,
  InvoiceReceipt,
  SalesReturn,
  SalesInvoicePayment,
  ReceiptVoucher,
  PaymentVoucher,
  PurchaseInvoice,
  Warehouse,
  StockMovement,
  AuditLog,
  AccountingPeriod,
  AccountProvision,
  AccountMapping,
  CompanyLogo,
  PurchaseInvoicePayment
};

// Set up associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize };
export default models;
