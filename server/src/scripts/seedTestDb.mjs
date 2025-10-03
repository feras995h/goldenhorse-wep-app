// Seed a clean test database matching Sequelize models (UUID IDs) and minimal data
// Safety: abort if DATABASE_URL seems to point to a non-test or default "postgres" database.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env.test') });

import models, { sequelize } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';

function assertSafeDatabase() {
  const url = process.env.DATABASE_URL || process.env.DB_URL;
  if (!url) {
    console.error('❌ Missing DATABASE_URL in server/.env.test');
    process.exit(1);
  }
  try {
    const u = new URL(url);
    const dbName = (u.pathname || '').replace(/^\//, '');
    if (!dbName || dbName.toLowerCase() === 'postgres') {
      console.error('❌ Unsafe database name detected:', dbName);
      console.error('Please point DATABASE_URL to a dedicated test database (e.g., golden_horse_test)');
      process.exit(1);
    }
    if (!/test|golden|horse/i.test(dbName)) {
      console.error('❌ Database name does not look like a dedicated test DB:', dbName);
      console.error('Set DATABASE_URL to something like postgresql://user:pass@host:5432/golden_horse_test');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Invalid DATABASE_URL format in server/.env.test:', e.message);
    process.exit(1);
  }
}

async function run() {
  assertSafeDatabase();
  console.log('🧪 Seeding clean test database (force sync)...');

  // Force recreate tables to match models exactly
  await sequelize.sync({ force: true });

  const { Account, AccountMapping, User, Customer } = models;

  const now = new Date();
  // Seed accounts
  const ar = await Account.create({
    id: uuidv4(), code: '1201', name: 'ذمم العملاء', nameEn: 'Accounts Receivable',
    type: 'asset', rootType: 'current_assets', reportType: 'balance_sheet', level: 2,
    isGroup: true, isActive: true, balance: 0, currency: 'LYD', nature: 'debit', createdAt: now, updatedAt: now
  });
  const revenue = await Account.create({
    id: uuidv4(), code: '4101', name: 'إيرادات خدمات الشحن', nameEn: 'Shipping Services Revenue',
    type: 'revenue', rootType: 'revenue', reportType: 'income_statement', level: 2,
    isGroup: false, isActive: true, balance: 0, currency: 'LYD', nature: 'credit', createdAt: now, updatedAt: now
  });
  const tax = await Account.create({
    id: uuidv4(), code: '2301', name: 'ضريبة القيمة المضافة', nameEn: 'VAT Payable',
    type: 'liability', rootType: 'current_liabilities', reportType: 'balance_sheet', level: 2,
    isGroup: false, isActive: true, balance: 0, currency: 'LYD', nature: 'credit', createdAt: now, updatedAt: now
  });
  const discount = await Account.create({
    id: uuidv4(), code: '4102', name: 'خصومات المبيعات', nameEn: 'Sales Discounts',
    type: 'revenue', rootType: 'revenue', reportType: 'income_statement', level: 2,
    isGroup: false, isActive: true, balance: 0, currency: 'LYD', nature: 'debit', createdAt: now, updatedAt: now
  });

  await AccountMapping.create({
    id: uuidv4(),
    salesRevenueAccount: revenue.id,
    accountsReceivableAccount: ar.id,
    salesTaxAccount: tax.id,
    discountAccount: discount.id,
    shippingRevenueAccount: revenue.id,
    isActive: true,
    description: 'Seed test mapping',
    createdAt: now,
    updatedAt: now
  });

  // Seed a user and a customer
  const user = await User.create({
    id: uuidv4(),
    username: 'test_admin',
    password: 'Password123!',
    name: 'Test Admin',
    email: 'test_admin@example.com',
    role: 'admin'
  });

  const customer = await Customer.create({
    id: uuidv4(),
    code: 'CUST-TEST-001',
    name: 'Test Customer',
    isActive: true
  });

  console.log('✅ Test DB seeded successfully.');
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
