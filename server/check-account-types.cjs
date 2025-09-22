const { Client } = require('pg');
require('dotenv').config();

async function checkAccountTypes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check what types are available
    const typesResult = await client.query(`
      SELECT DISTINCT type
      FROM accounts
      ORDER BY type
    `);

    console.log('📊 Available account types:');
    typesResult.rows.forEach(row => {
      console.log(`  - ${row.type}`);
    });

    // Check what accounts exist for each type
    for (const typeRow of typesResult.rows) {
      const accountsResult = await client.query(`
        SELECT id, code, name
        FROM accounts
        WHERE type = $1
        ORDER BY code
        LIMIT 5
      `, [typeRow.type]);

      console.log(`\n📋 ${typeRow.type} accounts:`);
      accountsResult.rows.forEach(account => {
        console.log(`  ${account.code} - ${account.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAccountTypes();