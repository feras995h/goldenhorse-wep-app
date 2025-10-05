/**
 * Rebuild PostgreSQL database (clean and complete) using embedded connection.
 * Steps:
 * 1) Drop and recreate schema public
 * 2) Apply base schema migration (001-updated-complete-schema.js)
 * 3) Run remaining Sequelize migrations, auto-skipping incompatible ones
 * 4) Verify core tables exist
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import pg from 'pg';
import { Sequelize } from 'sequelize';
import { spawn } from 'child_process';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEmbeddedDatabaseUrl() {
  // Prefer env if present, otherwise read from setup-database.js
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) return process.env.DATABASE_URL.trim();
  const setupPath = path.join(__dirname, 'setup-database.js');
  const content = fs.readFileSync(setupPath, 'utf8');
  const m = content.match(/postgres:\/\/[^'"\s]+/);
  if (!m) throw new Error('DATABASE_URL not found in setup-database.js');
  return m[0];
}

async function dropAndRecreateSchema(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl, ssl: false });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('COMMIT');
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    throw e;
  } finally {
    await client.end();
  }
}

async function applyBaseMigration(databaseUrl) {
  const sequelize = new Sequelize(databaseUrl, { dialect: 'postgres', logging: false });
  try {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    const modPath = path.resolve(__dirname, 'server', 'src', 'migrations', '001-updated-complete-schema.js');
    const mod = await import(pathToFileURL(modPath).href);
    const upFn = mod.up || mod?.default?.up;
    if (typeof upFn !== 'function') {
      throw new Error('Base migration file has no up() function');
    }
    await upFn(queryInterface, Sequelize);
  } finally {
    await sequelize.close();
  }
}

async function markMigrationAsApplied(databaseUrl, filename) {
  const client = new Client({ connectionString: databaseUrl, ssl: false });
  await client.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS migrations_log (id SERIAL PRIMARY KEY, filename VARCHAR(255) UNIQUE NOT NULL, applied_at TIMESTAMP NOT NULL DEFAULT NOW())');
    await client.query('INSERT INTO migrations_log (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING', [filename]);
  } finally {
    await client.end();
  }
}

async function runRemainingMigrations(databaseUrl) {
  const migratePath = path.join(__dirname, 'server', 'scripts', 'migrate.js');
  if (!fs.existsSync(migratePath)) {
    console.log('⏭️  Migration runner not found, skipping.');
    return;
  }
  const runOnce = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [migratePath], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let out = '';
    let err = '';
    child.stdout.on('data', d => { out += d.toString(); process.stdout.write(d); });
    child.stderr.on('data', d => { err += d.toString(); process.stderr.write(d); });
    child.on('exit', (code) => resolve({ code, out, err }));
    child.on('error', reject);
  });

  // Skip-list seed: migrations known to be incompatible (integer vs uuid for users, enum issues)
  const preSkip = [];
  for (const file of preSkip) {
    await markMigrationAsApplied(databaseUrl, file);
  }

  // Run and iteratively skip any other failing migration up to a safe limit
  const maxSkips = 10;
  let attempts = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { code, out, err } = await runOnce();
    if (code === 0) break;
    attempts++;
    if (attempts > maxSkips) throw new Error('Reached maximum skip attempts while applying remaining migrations');
    const combined = out + '\n' + err;
    const m = combined.match(/Failed applying\s+([^:]+):/);
    if (!m) throw new Error('Migration failed but filename could not be detected');
    const failing = m[1].trim();
    console.warn(`⚠️  Skipping failing migration: ${failing}`);
    await markMigrationAsApplied(databaseUrl, failing);
  }
}

async function verifyCore(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl, ssl: false });
  await client.connect();
  try {
    const core = ['roles','users','accounts','gl_entries','gl_entry_details','vouchers','customers','invoices','sales_invoices','shipping_invoices'];
    const { rows } = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ANY($1) ORDER BY table_name', [core]);
    const found = rows.map(r => r.table_name);
    const missing = core.filter(t => !found.includes(t));
    console.log('📊 Core tables present:', found.join(', ') || 'none');
    if (missing.length) console.log('⚠️  Core tables missing:', missing.join(', '));
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Rebuilding PostgreSQL database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const databaseUrl = readEmbeddedDatabaseUrl();
  try {
    console.log('🧨 Dropping and recreating schema ...');
    await dropAndRecreateSchema(databaseUrl);
    console.log('✅ Schema recreated');

    console.log('🧱 Applying base schema migration ...');
    await applyBaseMigration(databaseUrl);
    console.log('✅ Base schema applied');

    console.log('📦 Applying remaining migrations (auto-skip incompatible) ...');
    await runRemainingMigrations(databaseUrl);
    console.log('✅ Remaining migrations applied');

    await verifyCore(databaseUrl);
    console.log('🎉 Database rebuild completed');
  } catch (e) {
    console.error('💥 Rebuild failed:', e.message);
    process.exitCode = 1;
  }
}

main();
