// Check existing accounts for fixed assets
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function checkFixedAssetsAccounts() {
  try {
    console.log('🔍 Checking existing accounts for fixed assets...');
    
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
    
    // Check for accounts that might be used for fixed assets
    try {
      const [accounts] = await sequelize.query(`
        SELECT code, name, "nameEn", type 
        FROM accounts 
        WHERE code LIKE '112%' OR code LIKE '113%' OR code LIKE '411%'
        ORDER BY code
      `);
      
      console.log('📋 Found potential fixed assets accounts:');
      accounts.forEach(account => {
        console.log(`  - ${account.code}: ${account.name} (${account.nameEn || 'No English name'}) [${account.type}]`);
      });
      
      if (accounts.length === 0) {
        console.log('⚠️ No fixed assets accounts found');
      }
    } catch (error) {
      console.log('❌ Error checking accounts:', error.message);
    }
    
    await sequelize.close();
    console.log('\n✅ Fixed assets accounts check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkFixedAssetsAccounts();