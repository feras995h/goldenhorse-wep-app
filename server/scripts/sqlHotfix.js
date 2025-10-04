#!/usr/bin/env node
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    const url = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
    if (!url) throw new Error('DATABASE_URL/DB_URL is not set');
    const db = new Sequelize(url, { dialect: 'postgres', logging: false });
    await db.authenticate();
await db.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "total" DECIMAL(15,2) DEFAULT 0');
    await db.query('UPDATE invoices SET "total" = COALESCE("totalAmount",0) WHERE "total" IS NULL OR "total"=0');
    await db.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) DEFAULT \'LYD\'' );
await db.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "exchangeRate" DECIMAL(10,6) DEFAULT 1.000000');
    await db.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "dueDate" DATE');
    await db.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "outstandingAmount" DECIMAL(15,2) DEFAULT 0');
    await db.query('UPDATE invoices SET "outstandingAmount" = COALESCE("total",0) - COALESCE("paidAmount",0) WHERE "outstandingAmount" IS NULL OR "outstandingAmount"=0');
    console.log('✅ invoices.total, currency, exchangeRate, dueDate, outstandingAmount ensured');
    await db.close();
    process.exit(0);
  } catch (e) {
    console.error('❌ Hotfix failed:', e.message);
    process.exit(1);
  }
})();
