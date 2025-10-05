import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

const expectedTables = [
  'users', 'customers', 'suppliers', 'employees', 'accounts', 'account_mappings',
  'journal_entries', 'journal_entry_lines', 'invoices', 'sales_invoices',
  'purchase_invoices', 'payments', 'receipts', 'receipt_vouchers', 'payment_vouchers',
  'shipments', 'shipment_movements', 'warehouse', 'fixed_assets', 'notifications',
  'invoice_payments', 'invoice_receipts', 'account_provisions'
];

async function check() {
  try {
    await sequelize.authenticate();
    
    const [existingTables] = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingNames = existingTables.map(t => t.table_name);
    const found = [];
    const missing = [];

    for (const table of expectedTables) {
      if (existingNames.includes(table)) {
        found.push(table);
      } else {
        missing.push(table);
      }
    }

    const report = {
      found: found.sort(),
      missing: missing.sort(),
      extra: existingNames.filter(t => !expectedTables.includes(t)).sort()
    };

    console.log(JSON.stringify(report, null, 2));

    fs.writeFileSync('tables-report.txt', 
      `Found (${found.length}):\n${found.join('\n')}\n\n` +
      `Missing (${missing.length}):\n${missing.join('\n')}\n\n` +
      `Extra (${report.extra.length}):\n${report.extra.join('\n')}`,
      'utf8'
    );

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
