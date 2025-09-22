const { Client } = require('pg');
require('dotenv').config();

async function addUserColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Add createdBy column
    try {
      await client.query(`
        ALTER TABLE account_mappings
        ADD COLUMN IF NOT EXISTS "createdBy" UUID
      `);
      console.log('✅ Added createdBy column');
    } catch (error) {
      console.error('❌ Error adding createdBy column:', error.message);
    }

    // Add updatedBy column
    try {
      await client.query(`
        ALTER TABLE account_mappings
        ADD COLUMN IF NOT EXISTS "updatedBy" UUID
      `);
      console.log('✅ Added updatedBy column');
    } catch (error) {
      console.error('❌ Error adding updatedBy column:', error.message);
    }

    // Add indexes
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_account_mappings_created_by
        ON account_mappings("createdBy")
      `);
      console.log('✅ Added index for createdBy');
    } catch (error) {
      console.error('❌ Error adding index for createdBy:', error.message);
    }

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_account_mappings_updated_by
        ON account_mappings("updatedBy")
      `);
      console.log('✅ Added index for updatedBy');
    } catch (error) {
      console.error('❌ Error adding index for updatedBy:', error.message);
    }

    console.log('\n🎉 User columns addition completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addUserColumns();