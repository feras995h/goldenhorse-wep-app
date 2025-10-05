/**
 * Apply minimal setup: audit infrastructure + basic accounts/mapping.
 * Skips files that are missing or fail.
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
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}
const FILES = ['pre_migration_audit.sql','database_setup.sql'];
async function execSqlFile(client, file){
  const abs = path.join(__dirname,file);
  if(!fs.existsSync(abs)){ console.log(`⏭️  Missing: ${file}`); return; }
  const sql = fs.readFileSync(abs,'utf8');
  if(sql.includes('\\echo')){ console.log(`⏭️  Skipping ${file} (psql meta-commands)`); return; }
  console.log(`⚙️  Applying: ${file}`);
  try{ await client.query('BEGIN'); await client.query(sql); await client.query('COMMIT'); console.log(`✅ Applied: ${file}`);}catch(e){ try{await client.query('ROLLBACK');}catch{} console.log(`❌ Failed: ${file}: ${e.message}`); }
}
(async()=>{
  const url = buildDatabaseUrlFromEnv();
  const client = new Client({connectionString:url, ssl:false});
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Applying basic DB setup');
  try{ await client.connect(); for(const f of FILES){ await execSqlFile(client,f);} console.log('🎉 Basic setup done'); }catch(e){ console.error('💥 Failed:', e.message); process.exitCode=1; }finally{ try{await client.end();}catch{} console.log('🔌 Connection closed'); }
})();
