// Create basic fixed assets accounts
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function createFixedAssetsAccounts() {
  try {
    console.log('🔧 Creating basic fixed assets accounts...');
    
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
    
    // Create fixed assets accounts
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
          'SELECT id FROM accounts WHERE code = $1',
          { bind: [account.code] }
        );
        
        if (existing.length > 0) {
          console.log(`✅ Account already exists: ${account.name} (${account.code})`);
        } else {
          // Create the account
          await sequelize.query(`
            INSERT INTO accounts (id, code, name, "nameEn", type, "isGroup", "isActive", balance, currency, nature, "accountType", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, false, true, 0, 'LYD', 
              CASE WHEN $4 IN ('asset', 'expense') THEN 'debit' ELSE 'credit' END,
              'sub', NOW(), NOW())
          `, {
            bind: [
              account.code,
              account.name,
              account.nameEn,
              account.type
            ]
          });
          
          console.log(`✅ Created account: ${account.name} (${account.code})`);
        }
      } catch (error) {
        console.log(`❌ Error with account ${account.name}:`, error.message);
      }
    }
    
    await sequelize.close();
    console.log('\n🎉 Fixed assets accounts creation completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createFixedAssetsAccounts();