/**
 * Seed system basics: Settings + AccountMapping
 * - Creates settings table if missing and upserts essential keys
 * - Creates account_mappings table if missing and seeds an active mapping
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import crypto from 'crypto';

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

function uuid() { return crypto.randomUUID(); }

async function ensureSettingsTable(client) {
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'settings'
      ) THEN
        CREATE TYPE "enum_settings_type" AS ENUM ('string','number','boolean','json');
        CREATE TABLE "settings" (
          id UUID PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          type "enum_settings_type" NOT NULL DEFAULT 'string',
          description TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      END IF;
    END$$;
  `);
}

async function upsertSetting(client, { key, value, type = 'string', description = null }) {
  const id = uuid();
  await client.query(
    `INSERT INTO settings (id, key, value, type, description, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, type = EXCLUDED.type, description = EXCLUDED.description, "updatedAt" = NOW()`,
    [id, key, value, type, description]
  );
}

async function getAccountIdByCode(client, code) {
  const { rows } = await client.query('SELECT id FROM accounts WHERE code = $1', [code]);
  return rows[0]?.id || null;
}

async function ensureAccountMappingsTable(client) {
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'account_mappings'
      ) THEN
        CREATE TABLE account_mappings (
          id UUID PRIMARY KEY,
          description TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "salesRevenueAccount" UUID REFERENCES accounts(id),
          "accountsReceivableAccount" UUID REFERENCES accounts(id),
          "salesTaxAccount" UUID REFERENCES accounts(id),
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS account_mappings_active_idx ON account_mappings ("isActive");
      END IF;
    END$$;
  `);
}

async function upsertDefaultMapping(client, { salesRevenueCode, arCode, taxPayableCode }) {
  const sr = await getAccountIdByCode(client, salesRevenueCode);
  const ar = await getAccountIdByCode(client, arCode);
  const tax = await getAccountIdByCode(client, taxPayableCode);
  if (!sr || !ar || !tax) {
    throw new Error(`Missing account(s) for mapping. Found: salesRevenue=${!!sr}, AR=${!!ar}, tax=${!!tax}`);
  }

  // If an active mapping exists, update it; else insert a new one
  const { rows } = await client.query('SELECT id FROM account_mappings WHERE "isActive" = true LIMIT 1');
  if (rows.length) {
    await client.query(
      `UPDATE account_mappings
       SET description = $2,
           "salesRevenueAccount" = $3,
           "accountsReceivableAccount" = $4,
           "salesTaxAccount" = $5,
           "updatedAt" = NOW()
       WHERE id = $1`,
      [rows[0].id, 'Default financial mapping', sr, ar, tax]
    );
  } else {
    await client.query(
      `INSERT INTO account_mappings (id, description, "isActive", "salesRevenueAccount", "accountsReceivableAccount", "salesTaxAccount", "createdAt", "updatedAt")
       VALUES ($1,$2,true,$3,$4,$5,NOW(),NOW())`,
      [uuid(), 'Default financial mapping', sr, ar, tax]
    );
  }
}

async function main() {
  const url = readEmbeddedDatabaseUrl();
  const client = new Client({ connectionString: url, ssl: false });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚙️  Seeding system basics (Settings + AccountMapping)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await client.connect();
    await client.query('BEGIN');

    // Settings
    console.log('🧩 Ensuring settings table and keys...');
    await ensureSettingsTable(client);
    await upsertSetting(client, { key: 'company_name', value: 'شركة الحصان الذهبي للشحن', type: 'string', description: 'اسم الشركة' });
    await upsertSetting(client, { key: 'company_name_en', value: 'Golden Horse Shipping', type: 'string' });
    await upsertSetting(client, { key: 'default_currency', value: 'LYD', type: 'string' });
    await upsertSetting(client, { key: 'sales_tax_rate', value: '0.00', type: 'number', description: 'نسبة ضريبة المبيعات الافتراضية' });
    await upsertSetting(client, { key: 'system_ready', value: 'true', type: 'boolean', description: 'هل النظام مفعّل وجاهز؟' });

    // Account Mapping
    console.log('🔗 Ensuring account mappings...');
    await ensureAccountMappingsTable(client);
    await upsertDefaultMapping(client, { salesRevenueCode: '4101', arCode: '1201', taxPayableCode: '2301' });

    await client.query('COMMIT');
    console.log('✅ System basics seeded successfully');
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('💥 Seeding system basics failed:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

main();
