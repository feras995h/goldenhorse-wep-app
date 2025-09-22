const { Client } = require('pg');
require('dotenv').config();

async function fixAccountMappingData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // First, let's see what accounts are available
    console.log('\n📊 Available accounts:');
    const accountsResult = await client.query(`
      SELECT id, code, name, type
      FROM accounts
      ORDER BY type, code
      LIMIT 20
    `);

    accountsResult.rows.forEach(account => {
      console.log(`  ${account.code} - ${account.name} (${account.type})`);
    });

    // Find appropriate accounts for the mapping
    console.log('\n🔍 Finding appropriate accounts for mapping...');

    // Find sales revenue account
    const salesAccount = await client.query(`
      SELECT id, code, name
      FROM accounts
      WHERE type = 'revenue'
      ORDER BY code
      LIMIT 1
    `);

    // Find accounts receivable account
    const receivableAccount = await client.query(`
      SELECT id, code, name
      FROM accounts
      WHERE type = 'asset'
      ORDER BY code
      LIMIT 1
    `);

    // Find tax account
    const taxAccount = await client.query(`
      SELECT id, code, name
      FROM accounts
      WHERE (name ILIKE '%tax%' OR name ILIKE '%ضريبة%')
      OR type = 'liability'
      ORDER BY code
      LIMIT 1
    `);

    console.log('\n📋 Selected accounts:');
    if (salesAccount.rows[0]) {
      console.log(`  Sales Revenue: ${salesAccount.rows[0].code} - ${salesAccount.rows[0].name}`);
    }
    if (receivableAccount.rows[0]) {
      console.log(`  Accounts Receivable: ${receivableAccount.rows[0].code} - ${receivableAccount.rows[0].name}`);
    }
    if (taxAccount.rows[0]) {
      console.log(`  Tax Account: ${taxAccount.rows[0].code} - ${taxAccount.rows[0].name}`);
    }

    // Update the active account mapping
    console.log('\n🔧 Updating active account mapping...');

    const updateQuery = `
      UPDATE account_mappings
      SET
        "salesRevenueAccount" = $1,
        "accountsReceivableAccount" = $2,
        "salesTaxAccount" = $3,
        "description" = 'Fixed account mapping with proper account references'
      WHERE "isActive" = true
      RETURNING id, "salesRevenueAccount", "salesTaxAccount", "accountsReceivableAccount"
    `;

    const updateResult = await client.query(updateQuery, [
      salesAccount.rows[0]?.id || null,
      receivableAccount.rows[0]?.id || null,
      taxAccount.rows[0]?.id || null
    ]);

    if (updateResult.rows.length > 0) {
      console.log('✅ Updated active account mapping:');
      console.log(`  ID: ${updateResult.rows[0].id}`);
      console.log(`  Sales Revenue Account: ${updateResult.rows[0].salesRevenueAccount || 'NULL'}`);
      console.log(`  Sales Tax Account: ${updateResult.rows[0].salesTaxAccount || 'NULL'}`);
      console.log(`  Accounts Receivable Account: ${updateResult.rows[0].accountsReceivableAccount || 'NULL'}`);
    } else {
      console.log('⚠️ No active account mapping found to update');
    }

    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const verifyResult = await client.query(`
      SELECT id, "salesRevenueAccount", "salesTaxAccount", "accountsReceivableAccount", "isActive"
      FROM account_mappings
      WHERE "isActive" = true
      LIMIT 1
    `);

    if (verifyResult.rows.length > 0) {
      const mapping = verifyResult.rows[0];
      console.log('✅ Active account mapping verification:');
      console.log(`  ID: ${mapping.id}`);
      console.log(`  Sales Revenue Account: ${mapping.salesRevenueAccount || 'NULL'}`);
      console.log(`  Sales Tax Account: ${mapping.salesTaxAccount || 'NULL'}`);
      console.log(`  Accounts Receivable Account: ${mapping.accountsReceivableAccount || 'NULL'}`);

      if (mapping.salesRevenueAccount && mapping.salesTaxAccount && mapping.accountsReceivableAccount) {
        console.log('\n🎉 Account mapping data fix completed successfully!');
        console.log('✅ All required account references are now populated');
      } else {
        console.log('\n⚠️ Some account references are still NULL');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixAccountMappingData();