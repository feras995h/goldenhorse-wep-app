// Check ENUM types in the database
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkEnumTypes() {
  try {
    console.log('🔍 Checking ENUM types in the database...');
    
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
    
    // Check ENUM types
    try {
      const [enums] = await sequelize.query(`
        SELECT t.typname, e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        ORDER BY t.typname, e.enumsortorder
      `);
      
      console.log('📋 ENUM types in database:');
      const groupedEnums = {};
      enums.forEach(row => {
        if (!groupedEnums[row.typname]) {
          groupedEnums[row.typname] = [];
        }
        groupedEnums[row.typname].push(row.enumlabel);
      });
      
      Object.keys(groupedEnums).forEach(enumName => {
        console.log(`  ${enumName}: ${groupedEnums[enumName].join(', ')}`);
      });
    } catch (error) {
      console.log('❌ Error checking ENUM types:', error.message);
    }
    
    await sequelize.close();
    console.log('\n✅ ENUM types check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEnumTypes();