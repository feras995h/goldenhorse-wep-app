/**
 * Apply database migrations to the production database in a safe order.
 * - Reads connection from process.env.DATABASE_URL, or from individual PG* env vars
 * - Executes these SQL files if present (skipping any missing):
 *   1) pre_migration_audit.sql
 *   2) production-api-fix-migration.sql
 *   3) database-migration.sql
 *   4) database_setup.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildDatabaseUrlFromEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER || 'postgres';
  const pass = process.env.PGPASSWORD || '';
  const db   = process.env.PGDATABASE || 'postgres';
  // Do not log this URL anywhere to avoid exposing secrets
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}

const FILES_IN_ORDER = [
  'pre_migration_audit.sql',
  'production-api-fix-migration.sql',
  'database-migration.sql',
  'database_setup.sql',
];

async function execSqlFile(client, filePath) {
  const abs = path.join(__dirname, filePath);
  if (!fs.existsSync(abs)) {
    console.log(`⏭️  Skipping missing file: ${filePath}`);
    return { skipped: true };
  }
  const sql = fs.readFileSync(abs, 'utf8');
  // Basic guard: skip psql meta-commands which pg client cannot execute
  if (sql.includes('\\echo')) {
    console.log(`⏭️  Skipping ${filePath}: contains psql meta-commands (\\echo)`);
    return { skipped: true };
  }
  console.log(`⚙️  Applying: ${filePath}`);
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ Applied: ${filePath}`);
    return { ok: true };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error(`❌ Failed: ${filePath}`);
    console.error(`   Error: ${err.message}`);
    // Re-throw to stop the pipeline
    throw err;
  }
}

async function main() {
  const databaseUrl = buildDatabaseUrlFromEnv();
  const client = new Client({ connectionString: databaseUrl, ssl: false });

  const maskedHost = process.env.PGHOST || 'unknown-host';
  const maskedPort = process.env.PGPORT || '5432';
  const maskedDb   = process.env.PGDATABASE || 'postgres';

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Applying Golden Horse DB migrations');
  console.log(`📍 Target: ${maskedHost}:${maskedPort}/${maskedDb}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await client.connect();
    for (const f of FILES_IN_ORDER) {
      await execSqlFile(client, f);
    }
    console.log('');
    console.log('🎉 All migrations applied successfully');
  } catch (err) {
    console.error('');
    console.error('💥 Migration process failed');
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
    console.log('🔌 Connection closed');
  }
}

main();
