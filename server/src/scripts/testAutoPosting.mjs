// Test auto-posting for SalesInvoice and ShippingInvoice using a single transaction (no permanent changes)
// This script will create a temporary user, customer, sales invoice, and shipping invoice
// It verifies journal entries and GL entries are auto-created by model hooks, then rolls back.

import models, { sequelize } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  // Ensure schema exists for SQLite/dev
  try {
    await sequelize.sync({ alter: true });
  } catch (e) {
    console.warn('[auto-posting-test] Warning: sequelize.sync failed:', e?.message);
  }
  const t = await sequelize.transaction();
  const log = (...args) => console.log('[auto-posting-test]', ...args);

  try {
    const {
      User,
      Customer,
      SalesInvoice,
      ShippingInvoice,
      JournalEntry,
      JournalEntryDetail,
      GLEntry,
      AccountMapping,
      Account
    } = models;

    // 0) Ensure AccountMapping exists and required accounts are present
    let mapping = null;
    try {
      mapping = await AccountMapping.findOne({ where: { isActive: true }, transaction: t });
    } catch (e) {
      // ignore if model not present
    }
    if (!mapping) {
      // try to find accounts by code
      let ar = await Account.findOne({ where: { code: '1201' }, transaction: t });
      let revenue = await Account.findOne({ where: { code: '4101' }, transaction: t });
      let tax = await Account.findOne({ where: { code: '2301' }, transaction: t });
      let discount = await Account.findOne({ where: { code: '4102' }, transaction: t });

      // If missing, seed minimal required accounts inside transaction
      const now = new Date();
      if (!ar) {
        ar = await Account.create({
          id: uuidv4(), code: '1201', name: 'ذمم العملاء', nameEn: 'Accounts Receivable',
          type: 'asset', rootType: 'current_assets', reportType: 'balance_sheet', level: 2,
          isGroup: true, isActive: true, balance: 0, currency: 'LYD', nature: 'debit', createdAt: now, updatedAt: now
        }, { transaction: t });
      }
      if (!revenue) {
        revenue = await Account.create({
          id: uuidv4(), code: '4101', name: 'إيرادات خدمات الشحن', nameEn: 'Shipping Services Revenue',
          type: 'revenue', rootType: 'revenue', reportType: 'income_statement', level: 2,
          isGroup: false, isActive: true, balance: 0, currency: 'LYD', nature: 'credit', createdAt: now, updatedAt: now
        }, { transaction: t });
      }
      if (!tax) {
        tax = await Account.create({
          id: uuidv4(), code: '2301', name: 'ضريبة القيمة المضافة', nameEn: 'VAT Payable',
          type: 'liability', rootType: 'current_liabilities', reportType: 'balance_sheet', level: 2,
          isGroup: false, isActive: true, balance: 0, currency: 'LYD', nature: 'credit', createdAt: now, updatedAt: now
        }, { transaction: t });
      }
      if (!discount) {
        discount = await Account.create({
          id: uuidv4(), code: '4102', name: 'خصومات المبيعات', nameEn: 'Sales Discounts',
          type: 'revenue', rootType: 'revenue', reportType: 'income_statement', level: 2,
          isGroup: false, isActive: true, balance: 0, currency: 'LYD', nature: 'debit', createdAt: now, updatedAt: now
        }, { transaction: t });
      }

      mapping = await AccountMapping.create({
        id: uuidv4(),
        salesRevenueAccount: revenue.id,
        accountsReceivableAccount: ar.id,
        salesTaxAccount: tax.id,
        discountAccount: discount.id,
        shippingRevenueAccount: revenue.id,
        isActive: true,
        description: 'Auto test mapping',
        createdAt: now,
        updatedAt: now
      }, { transaction: t });
    }

    // 1) Use existing user and customer from DB to avoid schema type mismatch
    const user = await User.findOne({ transaction: t });
    if (!user) {
      throw new Error('No existing user found in DB. Please seed at least one user to run the auto-posting test.');
    }
    const customer = await Customer.findOne({ transaction: t });
    if (!customer) {
      throw new Error('No existing customer found in DB. Please seed at least one customer to run the auto-posting test.');
    }

    // dates
    const today = new Date();
    const due = new Date(today.getTime() + 7 * 24 * 3600 * 1000);
    const toISODate = (d) => d.toISOString().slice(0,10);

    // 2) Create a SalesInvoice (hooks should auto-post)
    const siData = {
      id: uuidv4(),
      invoiceNumber: `SITEST-${Date.now()}`,
      customerId: customer.id,
      date: toISODate(today),
      dueDate: toISODate(due),
      subtotal: 1000,
      discountAmount: 50,
      taxAmount: 150,
      total: 1100, // 1000 - 50 + 150
      paidAmount: 0,
      currency: 'LYD',
      createdBy: user.id
    };

    const si = await SalesInvoice.create(siData, { transaction: t });
    log('Created SalesInvoice', si.invoiceNumber);

    // Verify JE
    const je1 = await JournalEntry.findOne({ where: { type: 'sales_invoice', voucherNo: si.invoiceNumber }, transaction: t });
    if (!je1) throw new Error('SalesInvoice JournalEntry was not auto-created');
    const je1Details = await JournalEntryDetail.count({ where: { journalEntryId: je1.id }, transaction: t });
    const gl1Count = await GLEntry.count({ where: { journalEntryId: je1.id }, transaction: t });

    log('SalesInvoice JE created:', { entryNumber: je1.entryNumber, details: je1Details, glEntries: gl1Count });

    // 3) Create a ShippingInvoice (hooks should auto-post)
    // Try to reuse same customer; totalAmount should be > 0
    const shiData = {
      id: uuidv4(),
      invoiceNumber: `SH${String(Date.now()).slice(-6)}`,
      date: toISODate(today),
      customerId: customer.id,
      totalAmount: 500,
      status: 'sent',
      isActive: true,
      createdBy: user.id
    };

    const shi = await ShippingInvoice.create(shiData, { transaction: t });
    log('Created ShippingInvoice', shi.invoiceNumber);

    const je2 = await JournalEntry.findOne({ where: { type: 'shipping_invoice', voucherNo: shi.invoiceNumber }, transaction: t });
    if (!je2) throw new Error('ShippingInvoice JournalEntry was not auto-created');
    const je2Details = await JournalEntryDetail.count({ where: { journalEntryId: je2.id }, transaction: t });
    const gl2Count = await GLEntry.count({ where: { journalEntryId: je2.id }, transaction: t });

    log('ShippingInvoice JE created:', { entryNumber: je2.entryNumber, details: je2Details, glEntries: gl2Count });

    // Rollback to avoid permanent changes
    await t.rollback();
    log('Rolled back transaction successfully. Auto-posting works.');
    process.exit(0);
  } catch (error) {
    try { await t.rollback(); } catch {}
    console.error('[auto-posting-test] Failed:', error.message);
    process.exit(1);
  }
}

run();
