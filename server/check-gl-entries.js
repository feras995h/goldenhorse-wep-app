// Check GL entries table structure
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkGLEntriesTable() {
  try {
    console.log('🔍 Checking GL entries table structure...');
    
    const sequelize = new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if gl_entries table exists
    try {
      const [result] = await sequelize.query('SELECT COUNT(*) as count FROM gl_entries');
      console.log(`✅ GL entries table exists with ${result[0].count} records`);
    } catch (error) {
      console.log('❌ GL entries table does not exist or is inaccessible');
      console.log('Error:', error.message);
    }
    
    // Check table structure
    try {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'gl_entries'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 GL entries table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } catch (error) {
      console.log('❌ Error checking table structure:', error.message);
    }
    
    // Check ENUM values for voucherType
    try {
      const [enumValues] = await sequelize.query(`
        SELECT enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'enum_gl_entries_voucherType'
        ORDER BY e.enumsortorder
      `);
      
      console.log('\n📋 VoucherType ENUM values:');
      enumValues.forEach(val => {
        console.log(`   - ${val.enumlabel}`);
      });
    } catch (error) {
      console.log('❌ Error checking voucherType ENUM:', error.message);
    }
    
    await sequelize.close();
    console.log('🔒 Connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkGLEntriesTable();