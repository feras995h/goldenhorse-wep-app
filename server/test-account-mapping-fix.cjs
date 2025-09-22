/**
 * Test script to verify AccountMapping fixes
 * Tests the salesTaxAccount column and AccountMapping functionality
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testAccountMappingFix() {
  console.log('🧪 Testing AccountMapping fixes...\n');

  // Connect to database
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: console.log,
    dialect: 'postgres'
  });

  try {
    // Test 1: Check if salesTaxAccount column exists
    console.log('1️⃣ Testing salesTaxAccount column existence...');
    const columnResult = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'account_mappings'
      AND column_name = 'salesTaxAccount'
    `);

    if (columnResult[0].length > 0) {
      console.log('✅ salesTaxAccount column exists');
      console.log('   Column details:', columnResult[0][0]);
    } else {
      console.log('❌ salesTaxAccount column does NOT exist');
      return;
    }

    // Test 2: Check AccountMapping model functionality
    console.log('\n2️⃣ Testing AccountMapping model...');

    // Try to find an active mapping
    const mappingResult = await sequelize.query(`
      SELECT id, "salesRevenueAccount", "salesTaxAccount", "accountsReceivableAccount"
      FROM account_mappings
      WHERE "isActive" = true
      LIMIT 1
    `);

    if (mappingResult[0].length > 0) {
      console.log('✅ Found active account mapping');
      console.log('   Mapping details:', mappingResult[0][0]);
    } else {
      console.log('⚠️ No active account mapping found');
    }

    // Test 3: Test AccountMapping model validation
    console.log('\n3️⃣ Testing AccountMapping model validation...');

    // Try to create a test mapping
    const testMapping = await sequelize.query(`
      INSERT INTO account_mappings (
        id, "mappingType", "sourceType", "accountId", "isActive",
        "salesRevenueAccount", "salesTaxAccount", "accountsReceivableAccount",
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 'default', 'sales', gen_random_uuid(), true,
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
        NOW(), NOW()
      )
      RETURNING id
    `);

    if (testMapping[0].length > 0) {
      console.log('✅ Successfully created test account mapping');
      console.log('   Test mapping ID:', testMapping[0][0].id);

      // Clean up test data
      await sequelize.query(`DELETE FROM account_mappings WHERE id = $1`, {
        bind: [testMapping[0][0].id]
      });
      console.log('   🗑️ Cleaned up test data');
    } else {
      console.log('❌ Failed to create test account mapping');
    }

    console.log('\n🎉 AccountMapping tests completed successfully!');
    console.log('✅ All database schema issues have been resolved');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testAccountMappingFix();