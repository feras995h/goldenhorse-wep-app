/**
 * Golden Horse - Reset PostgreSQL Database (using embedded connection)
 * 
 * خطوات التنفيذ:
 * 1) إسقاط مخطط public بالكامل (DROP SCHEMA public CASCADE)
 * 2) إعادة إنشاء المخطط (CREATE SCHEMA public)
 * 3) تطبيق ملفات SQL (إن وُجدت) بالترتيب الآمن
 * 4) التحقق من وجود الجداول الأساسية
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { Sequelize } from 'sequelize';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// الاتصال المضمّن (نفسه كما في setup-database.js)
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

// لتهيئة نظيفة: نطبق ملفات الإنشاء أولاً (مطلوبة)، ثم نحاول ملفات الترقيات/التصحيحات (اختيارية)
const REQUIRED_FILES = [
  'database_setup.sql',
  'database-migration.sql',
];
const OPTIONAL_FILES = [
  'pre_migration_audit.sql',
  'production-api-fix-migration.sql',
];

async function execSql(client, sql, label = 'SQL block') {
  console.log(`⚙️  Executing: ${label}`);
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ Done: ${label}`);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error(`❌ Failed: ${label}: ${e.message}`);
    throw e;
  }
}

async function execSqlFileIfExists(client, filename, { optional = false } = {}) {
  const abs = path.join(__dirname, filename);
  if (!fs.existsSync(abs)) {
    console.log(`⏭️  Missing file (skip): ${filename}`);
    return { skipped: true };
  }
  const sql = fs.readFileSync(abs, 'utf8');
  if (sql.includes('\\echo')) {
    console.log(`⏭️  Skip ${filename}: contains psql meta-commands (\\echo)`);
    return { skipped: true };
  }
  try {
    await execSql(client, sql, filename);
    return { ok: true };
  } catch (e) {
    if (optional) {
      console.log(`⏭️  Optional file failed (${filename}): ${e.message} — skipped`);
      return { skipped: true, error: e };
    }
    throw e;
  }
}

async function markMigrationAsApplied(filename) {
  const client = new Client({ connectionString: DATABASE_URL, ssl: false });
  await client.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS migrations_log (id SERIAL PRIMARY KEY, filename VARCHAR(255) UNIQUE NOT NULL, applied_at TIMESTAMP NOT NULL DEFAULT NOW())');
    await client.query('INSERT INTO migrations_log (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING', [filename]);
  } finally {
    await client.end();
  }
}

// تشغيل مبدئي آمن: تطبيق المخطط الأساسي فقط من ملف واحد محدث وشامل
async function runBaseMigrationOnly() {
  console.log('');
  console.log('🧱 Running base schema migration (001-updated-complete-schema.js) ...');
  const sequelize = new Sequelize(DATABASE_URL, { dialect: 'postgres', logging: false });
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
    console.log('✅ Base schema migration applied');
  } finally {
    await sequelize.close();
  }
}

function pathToFileURL(p) {
  const url = new URL('file://');
  const resolved = path.resolve(p);
  const parts = resolved.split(path.sep);
  if (parts[0].endsWith(':')) { url.pathname = '/' + parts.join('/'); } else { url.pathname = parts.join('/'); }
  return url;
}

async function runMigrationsWithEmbeddedConnection() {
  const migratePath = path.join(__dirname, 'server', 'scripts', 'migrate.js');
  if (!fs.existsSync(migratePath)) {
    console.log('⏭️  Migration script not found, skipping Sequelize migrations');
    return;
  }
  console.log('');
  console.log('🧱 Running Sequelize migrations ...');
  const runOnce = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [migratePath], {
      env: { ...process.env, DATABASE_URL },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let out = '';
    let err = '';
    child.stdout.on('data', d => { out += d.toString(); process.stdout.write(d); });
    child.stderr.on('data', d => { err += d.toString(); process.stderr.write(d); });
    child.on('exit', (code) => {
      resolve({ code, out, err });
    });
    child.on('error', reject);
  });

  const maxSkips = 10;
  let attempts = 0;
  while (true) {
    const { code, out, err } = await runOnce();
    if (code === 0) break;
    attempts++;
    if (attempts > maxSkips) {
      throw new Error('Reached maximum skip attempts for migrations');
    }
    const combined = out + '\n' + err;
    const m = combined.match(/Failed applying\s+([^:]+):/);
    if (!m) {
      throw new Error('Migration failed but could not detect failing filename');
    }
    const failing = m[1].trim();
    console.warn(`⚠️  Detected failing migration: ${failing}. Marking as applied to skip and retrying...`);
    await markMigrationAsApplied(failing);
  }
  console.log('✅ Sequelize migrations completed');
}

async function verifyTables(client) {
  const expected = [
    'roles','users','accounts','gl_entries','gl_entry_details',
    'vouchers','customers','invoices','sales_invoices','shipping_invoices'
  ];
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = ANY($1)
    ORDER BY table_name
  `, [expected]);
  const found = rows.map(r => r.table_name);
  const missing = expected.filter(t => !found.includes(t));

  console.log('');
  console.log('📊 Verification:');
  console.log(`   Present (${found.length}): ${found.join(', ') || 'none'}`);
  console.log(`   Missing (${missing.length}): ${missing.join(', ') || 'none'}`);
  console.log('');

  return { found, missing };
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Resetting PostgreSQL database (embedded connection)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const client = new Client({ connectionString: DATABASE_URL, ssl: false });
  try {
    await client.connect();
    console.log('✅ Connected');

    // 1) Drop and recreate schema
    console.log('');
    console.log('🧨 Dropping schema public ...');
    await execSql(client, 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;', 'drop/recreate schema public');

    // 2) Run only the base schema migration to create core tables
    await runBaseMigrationOnly();

    // 3) Apply SQL files in order
    console.log('');
    console.log('📄 Applying REQUIRED SQL files (clean setup) ...');
    for (const f of REQUIRED_FILES) {
      await execSqlFileIfExists(client, f, { optional: false });
    }

    console.log('');
    console.log('📄 Applying OPTIONAL SQL files (patches/upgrades) ...');
    for (const f of OPTIONAL_FILES) {
      await execSqlFileIfExists(client, f, { optional: true });
    }

    // 4) Verify
    const result = await verifyTables(client);

    console.log('');
    if (result.missing.length === 0) {
      console.log('🎉 Database reset and setup completed successfully');
    } else {
      console.log('⚠️  Database reset done, but some tables are missing. Review logs above.');
    }
  } catch (e) {
    console.error('💥 Reset process failed:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
    console.log('🔌 Connection closed');
  }
}

main();
