#!/usr/bin/env node

// Add missing columns to production Payment table
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 ADDING MISSING PAYMENT TABLE COLUMNS');
console.log('======================================');

async function addMissingColumns() {
  // Connect to production database
  const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:tP1Cf7Wf2A6H@194.28.243.162:5432/golden_horse_db', {
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully');

    // Check current table structure
    console.log('\n📋 Checking current payments table structure...');
    const tableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('Current columns:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    const existingColumns = tableInfo.map(col => col.column_name);

    // Define columns that should exist
    const requiredColumns = [
      { name: 'currency', definition: 'VARCHAR(3) DEFAULT \'LYD\'' },
      { name: 'exchangeRate', definition: 'DECIMAL(10,6) DEFAULT 1.000000' }
    ];

    // Add missing columns
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`\n➕ Adding missing column: ${column.name}`);
        try {
          await sequelize.query(`ALTER TABLE payments ADD COLUMN "${column.name}" ${column.definition}`);
          console.log(`✅ Successfully added ${column.name} column`);
        } catch (error) {
          console.log(`❌ Failed to add ${column.name} column:`, error.message);
        }
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }

    // Verify final structure
    console.log('\n🔍 Verifying final table structure...');
    const finalTableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('Final columns:');
    finalTableInfo.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    console.log('\n🎯 COLUMN ADDITION COMPLETE');
    console.log('===========================');
    
    const missingAfter = requiredColumns.filter(col => 
      !finalTableInfo.some(dbCol => dbCol.column_name === col.name)
    );

    if (missingAfter.length === 0) {
      console.log('✅ All required columns are now present');
      console.log('💡 You should now restart the production server');
    } else {
      console.log('❌ Some columns are still missing:', missingAfter.map(c => c.name));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
}

addMissingColumns().catch(console.error);