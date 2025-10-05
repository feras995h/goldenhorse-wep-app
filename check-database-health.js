/**
 * Quick Database Health Check for Golden Horse
 * - Detects DATABASE_URL from setup-database.js if not set
 * - Verifies core tables exist
 * - Verifies critical columns and types
 * - Prints basic data stats and flags warnings
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEmbeddedDatabaseUrl() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) return process.env.DATABASE_URL.trim();
  const setupPath = path.join(__dirname, 'setup-database.js');
  const content = fs.readFileSync(setupPath, 'utf8');
  const m = content.match(/postgres:\/\/[^'"\s]+/);
  if (!m) throw new Error('DATABASE_URL not found in setup-database.js');
  return m[0];
}

async function tableExists(client, table) {
  const { rows } = await client.query(
    'SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = $1',
    [table]
  );
  return rows.length > 0;
}

async function columnInfo(client, table, column) {
  const { rows } = await client.query(
    `SELECT data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return rows[0] || null;
}

async function hasForeignKey(client, table, column, refTable) {
  const { rows } = await client.query(`
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = current_schema()
      AND tc.table_name = $1
      AND kcu.column_name = $2
      AND ccu.table_name = $3
    `, [table, column, refTable]
  );
  return rows.length > 0;
}

async function main() {
  const url = readEmbeddedDatabaseUrl();
  const client = new Client({ connectionString: url, ssl: false });

  const expectedTables = [
    'roles','users','accounts','gl_entries','gl_entry_details','vouchers',
    'customers','invoices','sales_invoices','shipping_invoices'
  ];

  const criticalColumns = [
    { table: 'users', column: 'id', wantType: 'uuid' },
    { table: 'invoices', column: 'createdBy', wantType: 'uuid', optional: true },
    { table: 'invoice_payments', column: 'createdBy', wantType: 'uuid', optional: true },
    { table: 'invoice_receipts', column: 'createdBy', wantType: 'uuid', optional: true },
    { table: 'payments', column: 'createdBy', wantType: 'uuid', optional: true },
  ];

  const enumChecks = [
    { table: 'invoices', column: 'status', udt: 'enum_invoices_status' }
  ];

  const fkChecks = [
    { table: 'invoice_payments', column: 'createdBy', ref: 'users', optional: true },
    { table: 'invoice_receipts', column: 'createdBy', ref: 'users', optional: true },
    { table: 'payments', column: 'createdBy', ref: 'users', optional: true },
  ];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🩺 Database Health Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await client.connect();
    console.log('✅ Connected');

    // Tables
    const missingTables = [];
    for (const t of expectedTables) {
      if (!(await tableExists(client, t))) missingTables.push(t);
    }
    if (missingTables.length) {
      console.log('❌ Missing tables:', missingTables.join(', '));
    } else {
      console.log('✅ All core tables are present');
    }

    // Critical columns and types
    const columnIssues = [];
    for (const { table, column, wantType, optional } of criticalColumns) {
      const exists = await tableExists(client, table);
      if (!exists) {
        if (!optional) columnIssues.push(`${table}.${column}: table missing`);
        continue;
      }
      const info = await columnInfo(client, table, column);
      if (!info) {
        if (!optional) columnIssues.push(`${table}.${column}: column missing`);
        continue;
      }
      const actual = info.data_type === 'USER-DEFINED' ? info.udt_name : info.data_type;
      if (wantType && wantType !== actual) {
        columnIssues.push(`${table}.${column}: expected ${wantType}, got ${actual}`);
      }
    }
    if (columnIssues.length) {
      console.log('❌ Column/type issues:');
      for (const issue of columnIssues) console.log('   -', issue);
    } else {
      console.log('✅ Critical columns and types look good');
    }

    // Enum checks
    const enumIssues = [];
    for (const { table, column, udt } of enumChecks) {
      if (!(await tableExists(client, table))) continue;
      const info = await columnInfo(client, table, column);
      if (!info) { enumIssues.push(`${table}.${column}: missing`); continue; }
      if (!(info.data_type === 'USER-DEFINED' && info.udt_name === udt)) {
        enumIssues.push(`${table}.${column}: expected enum ${udt}, got ${info.data_type}/${info.udt_name}`);
      }
    }
    if (enumIssues.length) {
      console.log('❌ Enum issues:');
      for (const issue of enumIssues) console.log('   -', issue);
    } else {
      console.log('✅ Enum columns OK');
    }

    // Foreign keys (optional)
    const fkIssues = [];
    for (const { table, column, ref, optional } of fkChecks) {
      if (!(await tableExists(client, table))) continue;
      const ok = await hasForeignKey(client, table, column, ref);
      if (!ok && !optional) fkIssues.push(`${table}.${column} -> ${ref}: FK missing`);
    }
    if (fkIssues.length) {
      console.log('⚠️  Foreign key issues:');
      for (const issue of fkIssues) console.log('   -', issue);
    } else {
      console.log('✅ Foreign key spot-checks OK');
    }

    // Basic stats
    const q = async (sql) => (await client.query(sql)).rows?.[0]?.count || '0';
    const stats = {
      users: await q('SELECT COUNT(*)::int AS count FROM users'),
      accounts: await q('SELECT COUNT(*)::int AS count FROM accounts'),
      invoices: await q('SELECT COUNT(*)::int AS count FROM invoices'),
      sales_invoices: await q('SELECT COUNT(*)::int AS count FROM sales_invoices'),
    };
    console.log('📊 Stats:', stats);

    // Summary
    const ok = missingTables.length === 0 && columnIssues.length === 0 && enumIssues.length === 0;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (ok) {
      console.log('🎉 Health check passed');
      if (Number(stats.users) === 0) console.log('ℹ️  Note: No users found — consider seeding an admin user.');
      if (Number(stats.accounts) === 0) console.log('ℹ️  Note: No accounts found — consider running your account setup/seed.');
      process.exit(0);
    } else {
      console.log('⚠️  Health check completed with issues (see above)');
      process.exit(1);
    }
  } catch (e) {
    console.error('💥 Health check failed:', e.message);
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
}

main();
