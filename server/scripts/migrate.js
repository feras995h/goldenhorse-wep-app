#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadModule(modulePath) {
  // Dynamic import works for both .js ES modules and .cjs CommonJS
  const mod = await import(modulePath);
  // CommonJS default export compatibility
  return mod?.default || mod;
}

async function ensureMigrationsTable(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS migrations_log (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(sequelize) {
  try {
    const [rows] = await sequelize.query('SELECT filename FROM migrations_log');
    const set = new Set(rows.map(r => r.filename));
    return set;
  } catch (e) {
    return new Set();
  }
}

async function recordMigration(sequelize, filename) {
  await sequelize.query('INSERT INTO migrations_log (filename) VALUES (:filename) ON CONFLICT (filename) DO NOTHING', {
    replacements: { filename }
  });
}

async function run() {
  const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
  if (!dbUrl) {
    console.error('❌ DATABASE_URL/DB_URL is not set');
    process.exit(1);
  }
  const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    await ensureMigrationsTable(sequelize);
    const applied = await getAppliedMigrations(sequelize);

    const migrationsDir = path.resolve(__dirname, '../src/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js') || f.endsWith('.cjs'))
      .sort((a, b) => a.localeCompare(b));

    const queryInterface = sequelize.getQueryInterface();
    const DataTypes = Sequelize; // pass Sequelize for DataTypes access

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`⏭️  Skipping already applied: ${file}`);
        continue;
      }
      const fullPath = path.join(migrationsDir, file);
      console.log(`🚀 Applying: ${file}`);
      try {
        const mod = await loadModule(pathToFileURL(fullPath).href);
        const upFn = mod.up || mod?.default?.up;
        if (typeof upFn !== 'function') {
          throw new Error('Migration file has no up() function');
        }
        await upFn(queryInterface, DataTypes);
        await recordMigration(sequelize, file);
        console.log(`✅ Applied: ${file}`);
      } catch (err) {
        console.error(`❌ Failed applying ${file}:`, err.message);
        throw err;
      }
    }

    // Hotfix: if invoices.total is missing but totalAmount exists, create total and backfill
    try {
      const [desc] = await sequelize.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'invoices\'');
      const hasTotal = desc.some(r => r.column_name === 'total');
      const hasTotalAmount = desc.some(r => r.column_name === 'totalAmount');
      if (!hasTotal && hasTotalAmount) {
        console.log('🔧 Adding invoices.total and backfilling from totalAmount');
        await sequelize.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "total" DECIMAL(15,2) DEFAULT 0');
        await sequelize.query('UPDATE invoices SET "total" = COALESCE("totalAmount", 0) WHERE "total" IS NULL OR "total" = 0');
        console.log('✅ Backfilled invoices.total from totalAmount');
      }
    } catch (e) {
      console.warn('⚠️ Could not run invoices.total hotfix:', e.message);
    }

    console.log('🎉 All migrations applied');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('💥 Migration failed:', err);
    try { await sequelize.close(); } catch {}
    process.exit(1);
  }
}

// Helper for file URL conversion
function pathToFileURL(p) {
  const url = new URL('file://');
  const resolved = path.resolve(p);
  const parts = resolved.split(path.sep);
  // Windows drive letter
  if (parts[0].endsWith(':')) {
    url.pathname = '/' + parts.join('/');
  } else {
    url.pathname = parts.join('/');
  }
  return url;
}

run();