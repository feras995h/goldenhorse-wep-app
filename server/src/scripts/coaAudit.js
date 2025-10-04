import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function main() {
  await sequelize.authenticate();

  const [flat] = await sequelize.query(`
    SELECT code, name, type, "parentId"
    FROM accounts
    WHERE code ~ '^[0-9]{4}$'
    ORDER BY code::int ASC
  `);

  const [dot] = await sequelize.query(`
    SELECT code, name, type, "parentId"
    FROM accounts
    WHERE code ~ '^[0-9](\.[0-9]+)*$'
    ORDER BY code ASC
  `);

  const [dups] = await sequelize.query(`
    SELECT code, COUNT(*) AS cnt
    FROM accounts
    GROUP BY code
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC, code ASC
  `);

  console.log('📊 Chart of Accounts Audit');
  console.log(`- Dot-style accounts (e.g., 1, 1.1, 1.1.1): ${dot.length}`);
  console.log(`- Flat 4-digit accounts (e.g., 1000, 1100, 1200): ${flat.length}`);
  console.log(`- Duplicate codes: ${dups.length}`);

  if (flat.length > 0) {
    console.log('\nSome flat accounts detected (first 15):');
    flat.slice(0, 15).forEach(a => console.log(`  ${a.code} - ${a.name} (${a.type})`));
  }

  if (dups.length > 0) {
    console.log('\nDuplicate code summary (top 15):');
    dups.slice(0, 15).forEach(d => console.log(`  ${d.code}: ${d.cnt}`));
  }

  console.log('\nRecommendation:');
  console.log('- Normalize to dot-style (1, 1.1, 1.1.1, ...) and retire flat-style (1000, 1100, ...) codes.');
  console.log('- We can generate a mapping plan and optionally rename codes in a transaction with backups.');

  await sequelize.close();
}

main().catch(err => { console.error(err); process.exit(1); });