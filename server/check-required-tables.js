import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkRequiredTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected\n');

    // Tables needed by the failing endpoints
    const criticalTables = {
      'sales_invoices': ['id', 'invoiceNumber', 'customerId', 'total', 'status', 'date'],
      'receipt_vouchers': ['id', 'voucherNumber', 'customerId', 'amount', 'date', 'status'],
      'payment_vouchers': ['id', 'voucherNumber', 'beneficiaryId', 'amount', 'date', 'status'],
      'shipments': ['id', 'trackingNumber', 'status', 'estimatedArrival', 'actualArrival']
    };

    console.log('🔍 Checking critical tables and columns:\n');
    console.log('='.repeat(70));

    for (const [tableName, requiredColumns] of Object.entries(criticalTables)) {
      console.log(`\n📋 Table: ${tableName}`);
      
      try {
        // Check if table exists
        const [result] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        
        if (!result[0].exists) {
          console.log(`   ❌ Table does NOT exist`);
          continue;
        }
        
        console.log(`   ✅ Table exists`);
        
        // Get all columns
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `);
        
        const existingColumns = columns.map(c => c.column_name);
        
        // Check required columns
        console.log(`   📊 Total columns: ${existingColumns.length}`);
        console.log(`   🔍 Checking required columns:`);
        
        for (const col of requiredColumns) {
          if (existingColumns.includes(col)) {
            console.log(`      ✅ ${col}`);
          } else {
            console.log(`      ❌ ${col} - MISSING!`);
          }
        }
        
        // Get row count
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`   📈 Rows: ${count[0].count}`);
        
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Check complete');

    await sequelize.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkRequiredTables();
