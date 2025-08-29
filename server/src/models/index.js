import { Sequelize } from 'sequelize';
import config from '../config/database.cjs';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
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
