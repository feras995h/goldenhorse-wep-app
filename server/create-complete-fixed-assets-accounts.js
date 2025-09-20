// Create complete fixed assets accounts with all required fields
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function createCompleteFixedAssetsAccounts() {
  try {
    console.log('🔧 Creating complete fixed assets accounts with all required fields...');
    
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
    
    // Create fixed assets accounts with all required fields
    const accounts = [
      {
        code: '112',
        name: 'الأصول الثابتة',
        nameEn: 'Fixed Assets',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        nature: 'debit',
        accountType: 'sub'
      },
      {
        code: '113',
        name: 'استهلاك الأصول الثابتة المتراكمة',
        nameEn: 'Accumulated Depreciation',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        nature: 'credit',
        accountType: 'sub'
      },
      {
        code: '411',
        name: 'مصروف الاستهلاك',
        nameEn: 'Depreciation Expense',
        type: 'expense',
        rootType: 'Expense',
        reportType: 'Profit and Loss',
        nature: 'debit',
        accountType: 'sub'
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
          // Create the account with all required fields and correct ENUM values
          await sequelize.query(`
            INSERT INTO accounts (
              id, code, name, "nameEn", type, "rootType", "reportType", 
              level, "isGroup", "isActive", balance, currency, 
              nature, "accountType", "createdAt", "updatedAt",
              "debitBalance", "creditBalance"
            )
            VALUES (
              gen_random_uuid(), '${account.code}', '${account.name}', '${account.nameEn}', 
              '${account.type}'::account_type_enum, 
              '${account.rootType}'::enum_accounts_roottype, 
              '${account.reportType}'::enum_accounts_reporttype, 
              2, false, true, 0, 'LYD', 
              '${account.nature}'::enum_accounts_nature,
              '${account.accountType}'::enum_accounts_accountType,
              NOW(), NOW(), 0, 0
            )
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
    console.log('\n🎉 Complete fixed assets accounts creation completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCompleteFixedAssetsAccounts();