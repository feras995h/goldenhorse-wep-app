const { Client } = require('pg');
require('dotenv').config();

async function checkAccountMappings() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if account_mappings table exists
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'account_mappings'
      )
    `);

    if (!tableResult.rows[0].exists) {
      console.log('❌ account_mappings table does not exist');
      return;
    }

    console.log('✅ account_mappings table exists');

    // Get all columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'account_mappings'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Current account_mappings columns:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ' (not null)'}`);
    });

    // Check for required columns
    const requiredColumns = [
      'salesRevenueAccount', 'salesTaxAccount', 'accountsReceivableAccount',
      'localCustomersAccount', 'foreignCustomersAccount', 'discountAccount',
      'shippingRevenueAccount', 'handlingFeeAccount', 'customsClearanceAccount',
      'insuranceAccount', 'storageAccount', 'isActive', 'description',
      'createdBy', 'updatedBy'
    ];

    const existingColumns = columnsResult.rows.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n❌ Missing columns:');
      missingColumns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('\n✅ All required columns exist');
    }

    // Check existing data
    const dataResult = await client.query(`
      SELECT id, "salesRevenueAccount", "salesTaxAccount", "accountsReceivableAccount", "isActive"
      FROM account_mappings
      WHERE "isActive" = true
      LIMIT 1
    `);

    if (dataResult.rows.length > 0) {
      console.log('\n📊 Active account mapping found:');
      console.log(`  ID: ${dataResult.rows[0].id}`);
      console.log(`  Sales Revenue Account: ${dataResult.rows[0].salesRevenueAccount || 'NULL'}`);
      console.log(`  Sales Tax Account: ${dataResult.rows[0].salesTaxAccount || 'NULL'}`);
      console.log(`  Accounts Receivable Account: ${dataResult.rows[0].accountsReceivableAccount || 'NULL'}`);
    } else {
      console.log('\n⚠️ No active account mapping found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAccountMappings();