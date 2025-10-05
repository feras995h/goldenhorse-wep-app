import pg from 'pg';
const { Client } = pg;
const MIG = process.argv[2];
if (!MIG) {
  console.error('Usage: node mark-migration.js <filename>');
  process.exit(1);
}
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
  try {
    await client.connect();
    await client.query(`CREATE TABLE IF NOT EXISTS migrations_log (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`);
    await client.query('INSERT INTO migrations_log (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING', [MIG]);
    console.log(`✅ Marked migration as applied: ${MIG}`);
  } catch (e) {
    console.error('❌', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
})();