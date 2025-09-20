// Create basic fixed assets accounts (simple approach)
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function createFixedAssetsAccountsSimple() {
  try {
    console.log('🔧 Creating basic fixed assets accounts (simple approach)...');
    
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
    
    // Create fixed assets accounts using direct queries
    const accounts = [
      {
        code: '112',
        name: 'الأصول الثابتة',
        nameEn: 'Fixed Assets',
        type: 'asset'
      },
      {
        code: '113',
        name: 'استهلاك الأصول الثابتة المتراكمة',
        nameEn: 'Accumulated Depreciation',
        type: 'asset'
      },
      {
        code: '411',
        name: 'مصروف الاستهلاك',
        nameEn: 'Depreciation Expense',
        type: 'expense'
      }
    ];
    
    for (const account of accounts) {
      try {
        // Check if account already exists
        const [existing] = await sequelize.query(
          `SELECT id FROM accounts WHERE code = '${account.code}'`
        );
        
        if (existing.length > 0) {
          console.log(`✅ Account already exists: ${account.name} (${account.code})`);
        } else {
          // Create the account with a direct query
          await sequelize.query(`
            INSERT INTO accounts (id, code, name, "nameEn", type, "isGroup", "isActive", balance, currency, nature, "accountType", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), '${account.code}', '${account.name}', '${account.nameEn}', '${account.type}', false, true, 0, 'LYD', 
              CASE WHEN '${account.type}' IN ('asset', 'expense') THEN 'debit' ELSE 'credit' END,
              'sub', NOW(), NOW())
          `);
          
          console.log(`✅ Created account: ${account.name} (${account.code})`);
        }
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`✅ Account already exists: ${account.name} (${account.code})`);
        } else {
          console.log(`❌ Error with account ${account.name}:`, error.message);
        }
      }
    }
    
    await sequelize.close();
    console.log('\n🎉 Fixed assets accounts creation completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createFixedAssetsAccountsSimple();